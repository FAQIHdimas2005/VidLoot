import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import {
  isSafeCliTargetUrl,
  isSafeExternalUrl,
  normalizePlatformParam,
  sanitizeCacheKeyPart,
} from '@/lib/security';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getCleanFilename(
  rawName: string,
  ext: string = 'mp4',
  platform: string = 'video'
): { ascii: string; utf8: string } {
  // 1. Strip extension if passed
  const withoutExt = rawName.replace(/\.[^/.]+$/, '');

  // 2. Remove dangerous Windows characters and trim extra spaces
  let sanitized = withoutExt
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '') // Strip leading/trailing dots to prevent Windows .mp4 bug
    .trim()
    .slice(0, 120);

  // 3. If title is empty or has no alphanumeric characters (e.g. "..."), use fallback
  if (!sanitized || !/[a-zA-Z0-9]/.test(sanitized)) {
    sanitized = `VidLoot_${platform}_${Date.now().toString().slice(-4)}`;
  }

  const finalName = `${sanitized}.${ext}`;
  const ascii = finalName.replace(/[^\x20-\x7E]/g, '_');
  const utf8 = encodeURIComponent(finalName);
  return { ascii, utf8 };
}

const TEMP_DIR_NAME = '.temp-downloads';
const TEMP_MAX_AGE_MS = 30 * 60 * 1000;
const MAX_CONCURRENT_MERGES = 5;
const BUSY_MESSAGE = 'Too Many Requests - Server is busy processing media.';

let activeMerges = 0;
const inFlightMerges = new Map<string, Promise<string>>();

function getTempDir(): string {
  // On Vercel/Linux serverless, process.cwd() (/var/task) is read-only; use os.tmpdir() (/tmp)
  if (process.platform === 'win32' && !process.env.VERCEL) {
    return path.join(process.cwd(), TEMP_DIR_NAME);
  }
  return path.join(os.tmpdir(), TEMP_DIR_NAME);
}

function resolveFfmpegBinary(tempDir?: string): string {
  const localBin = path.join(
    process.cwd(),
    'bin',
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  );
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const staticFfmpeg = require('ffmpeg-static');
    if (typeof staticFfmpeg === 'string' && fs.existsSync(staticFfmpeg)) {
      if (process.platform === 'win32') {
        return staticFfmpeg;
      }
      // On Linux / Vercel Serverless: copy to tempDir and set executable bit 0o755
      const effectiveTemp = tempDir || getTempDir();
      if (!fs.existsSync(effectiveTemp)) {
        fs.mkdirSync(effectiveTemp, { recursive: true });
      }
      const tmpFfmpeg = path.join(effectiveTemp, 'ffmpeg');
      try {
        if (!fs.existsSync(tmpFfmpeg)) {
          fs.copyFileSync(staticFfmpeg, tmpFfmpeg);
        }
        fs.chmodSync(tmpFfmpeg, 0o755);
        return tmpFfmpeg;
      } catch (copyErr) {
        console.warn('Failed to copy/chmod ffmpeg in tempDir:', copyErr);
        return staticFfmpeg;
      }
    }
  } catch {
    // fallback to system PATH
  }
  return 'ffmpeg';
}

function cleanupOldTempFiles(): void {
  try {
    const tempDir = getTempDir();
    if (!fs.existsSync(tempDir)) return;
    const now = Date.now();
    for (const entry of fs.readdirSync(tempDir)) {
      try {
        if (!/\.(mp4|mp3|m4a|webm|part|ytdl)$/i.test(entry)) continue;
        const filePath = path.join(tempDir, entry);
        const stat = fs.statSync(filePath);
        if (stat.isFile() && now - stat.mtimeMs > TEMP_MAX_AGE_MS) {
          fs.unlink(filePath, () => {});
        }
      } catch {
        // skip individual entry failures
      }
    }
  } catch {
    // ignore cleanup failures
  }
}

function isMergeBusyError(err: unknown): boolean {
  return (err as { status?: number })?.status === 429;
}

/**
 * Pure-Node.js Niconico Domand HLS (fMP4 + AES-128-CBC) Decryptor & FFmpeg Remuxer.
 * Works natively on both Vercel Linux Serverless (via ffmpeg-static) and Windows/Docker.
 */
async function mergeNicoNicoDomand(
  originalUrl: string,
  outputPath: string,
  cleanQuality: string,
  isAudio: boolean,
  tempDir: string
): Promise<string> {
  const idMatch = originalUrl.match(/(?:watch\/|nico\.ms\/)([a-z]{2}\d+|\d+)/i);
  if (!idMatch) {
    throw new Error('Could not parse Niconico video ID from URL.');
  }
  const nicoId = idMatch[1];
  const trackId = `AAAAAAAAAA_${Date.now()}`;
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  const extractCookies = (res: Response): string[] => {
    const rawList: string[] =
      typeof (res.headers as any).getSetCookie === 'function'
        ? (res.headers as any).getSetCookie()
        : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie')!]
        : [];
    return rawList.map((c) => c.split(';')[0]).filter(Boolean);
  };

  const nicoCookie = (process.env.NICONICO_COOKIE || '').trim();
  const baseHeaders: Record<string, string> = {
    'User-Agent': ua,
    Accept: '*/*',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'X-Frontend-Id': '6',
    'X-Frontend-Version': '0',
  };
  if (nicoCookie) {
    baseHeaders['Cookie'] = nicoCookie;
  }

  // 1. Fetch Watch API v3_guest (or fallback to v3)
  const endpoint = nicoCookie ? 'v3' : 'v3_guest';
  let watchRes = await fetch(
    `https://www.nicovideo.jp/api/watch/${endpoint}/${nicoId}?actionTrackId=${encodeURIComponent(trackId)}`,
    { headers: baseHeaders }
  );
  if (!watchRes.ok && nicoCookie) {
    watchRes = await fetch(
      `https://www.nicovideo.jp/api/watch/v3_guest/${nicoId}?actionTrackId=${encodeURIComponent(trackId)}`,
      {
        headers: {
          'User-Agent': ua,
          Accept: '*/*',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'X-Frontend-Id': '6',
          'X-Frontend-Version': '0',
        },
      }
    );
  }
  if (!watchRes.ok) {
    throw new Error(`Niconico Watch API returned HTTP ${watchRes.status}`);
  }

  const baseCookies = extractCookies(watchRes);
  const watchJson = await watchRes.json();
  const domand = watchJson?.data?.media?.domand;
  if (!domand || !domand.accessRightKey) {
    throw new Error('Niconico Domand media data or accessRightKey is missing.');
  }

  const availVideos: any[] = Array.isArray(domand.videos)
    ? domand.videos.filter((v: any) => v && v.isAvailable)
    : [];
  const availAudios: any[] = Array.isArray(domand.audios)
    ? domand.audios.filter((a: any) => a && a.isAvailable)
    : [];

  if (availVideos.length === 0 || availAudios.length === 0) {
    throw new Error('No available video or audio streams returned by Niconico Domand.');
  }

  const targetHeight = cleanQuality.includes('1080')
    ? 1080
    : cleanQuality.includes('480')
    ? 480
    : cleanQuality.includes('360')
    ? 360
    : 720;

  const selectedVideo =
    availVideos.find((v) => String(v.id).includes(`${targetHeight}p`)) ||
    availVideos.find((v) => Number(v.height) <= targetHeight) ||
    availVideos[0];
  const selectedAudio = availAudios[0];

  // 2. Request Domand HLS Access Right
  const accessHeaders: Record<string, string> = {
    'User-Agent': ua,
    'Content-Type': 'application/json',
    Accept: '*/*',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'X-Access-Right-Key': domand.accessRightKey,
    'X-Request-With': 'https://www.nicovideo.jp',
    'X-Frontend-Id': '6',
    'X-Frontend-Version': '0',
    Origin: 'https://www.nicovideo.jp',
    Referer: 'https://www.nicovideo.jp/',
  };
  if (baseCookies.length > 0) {
    accessHeaders['Cookie'] = baseCookies.join('; ');
  }

  const accessRes = await fetch(
    `https://nvapi.nicovideo.jp/v1/watch/${nicoId}/access-rights/hls?actionTrackId=${encodeURIComponent(trackId)}`,
    {
      method: 'POST',
      headers: accessHeaders,
      body: JSON.stringify({
        outputs: [[selectedVideo.id, selectedAudio.id]],
      }),
    }
  );

  if (!accessRes.ok) {
    throw new Error(`Niconico nvapi access-rights failed with HTTP ${accessRes.status}`);
  }

  const allCookies = [...baseCookies, ...extractCookies(accessRes)].join('; ');
  const accessJson = await accessRes.json();
  const masterM3u8Url: string | undefined = accessJson?.data?.contentUrl;
  if (!masterM3u8Url) {
    throw new Error('Niconico nvapi did not return a master M3U8 URL.');
  }

  // 3. Parse Master M3U8
  const masterText = await (
    await fetch(masterM3u8Url, {
      headers: {
        'User-Agent': ua,
        Accept: '*/*',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        Cookie: allCookies,
      },
    })
  ).text();

  let audioPlaylistUrl = '';
  let videoPlaylistUrl = '';
  for (const rawLine of masterText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
      const m = line.match(/URI="([^"]+)"/);
      if (m) audioPlaylistUrl = new URL(m[1], masterM3u8Url).href;
    } else if (!line.startsWith('#') && !videoPlaylistUrl) {
      videoPlaylistUrl = new URL(line, masterM3u8Url).href;
    }
  }

  if (!audioPlaylistUrl || (!isAudio && !videoPlaylistUrl)) {
    throw new Error('Failed to locate video/audio variant playlists in Niconico master M3U8.');
  }

  // 4. Download & AES-128-CBC Decrypt fMP4 Stream
  const downloadAndDecryptStream = async (playlistUrl: string, destFile: string) => {
    const m3u8Text = await (
      await fetch(playlistUrl, {
        headers: {
          'User-Agent': ua,
          Accept: '*/*',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          Cookie: allCookies,
        },
      })
    ).text();

    let initUrl = '';
    let keyUrl = '';
    let ivHex = '';
    let mediaSequence = 0;
    const segUrls: string[] = [];

    for (const rawLine of m3u8Text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
        mediaSequence = parseInt(line.split(':')[1] || '0', 10) || 0;
      } else if (line.startsWith('#EXT-X-MAP:')) {
        const m = line.match(/URI="([^"]+)"/);
        if (m) initUrl = new URL(m[1], playlistUrl).href;
      } else if (line.startsWith('#EXT-X-KEY:')) {
        const km = line.match(/URI="([^"]+)"/);
        const ivm = line.match(/IV=0x([0-9a-fA-F]+)/);
        if (km) keyUrl = new URL(km[1], playlistUrl).href;
        if (ivm) ivHex = ivm[1];
      } else if (!line.startsWith('#')) {
        segUrls.push(new URL(line, playlistUrl).href);
      }
    }

    if (!initUrl || segUrls.length === 0) {
      throw new Error('Invalid Niconico fMP4 variant playlist.');
    }

    const [initBuf, keyBuf] = await Promise.all([
      fetch(initUrl, {
        headers: {
          'User-Agent': ua,
          Accept: '*/*',
          Cookie: allCookies,
        },
      })
        .then((r) => r.arrayBuffer())
        .then((b) => Buffer.from(b)),
      keyUrl
        ? fetch(keyUrl, {
            headers: {
              'User-Agent': ua,
              Accept: '*/*',
              Cookie: allCookies,
            },
          })
            .then((r) => r.arrayBuffer())
            .then((b) => Buffer.from(b))
        : Promise.resolve(null),
    ]);

    const segBuffers: Buffer[] = new Array(segUrls.length);
    const BATCH_SIZE = 8;

    for (let i = 0; i < segUrls.length; i += BATCH_SIZE) {
      const batch = segUrls.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (segUrl, idx) => {
          const segIndex = i + idx;
          const rawBuf = Buffer.from(
            await (
              await fetch(segUrl, {
                headers: {
                  'User-Agent': ua,
                  Accept: '*/*',
                  Cookie: allCookies,
                },
              })
            ).arrayBuffer()
          );

          if (keyBuf) {
            let ivBuf: Buffer;
            if (ivHex) {
              ivBuf = Buffer.from(ivHex.padStart(32, '0'), 'hex');
            } else {
              ivBuf = Buffer.alloc(16, 0);
              ivBuf.writeUInt32BE(mediaSequence + segIndex, 12);
            }
            const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuf, ivBuf);
            segBuffers[segIndex] = Buffer.concat([decipher.update(rawBuf), decipher.final()]);
          } else {
            segBuffers[segIndex] = rawBuf;
          }
        })
      );
    }

    fs.writeFileSync(destFile, Buffer.concat([initBuf, ...segBuffers]));
  };

  const uniqueSuffix = `${nicoId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tempVideoPath = path.join(tempDir, `nico_vid_${uniqueSuffix}.mp4`);
  const tempAudioPath = path.join(tempDir, `nico_aud_${uniqueSuffix}.m4a`);

  try {
    if (isAudio) {
      await downloadAndDecryptStream(audioPlaylistUrl, tempAudioPath);
    } else {
      await Promise.all([
        downloadAndDecryptStream(videoPlaylistUrl, tempVideoPath),
        downloadAndDecryptStream(audioPlaylistUrl, tempAudioPath),
      ]);
    }

    const ffmpegBin = resolveFfmpegBinary(tempDir);
    const ffmpegArgs = isAudio
      ? ['-y', '-i', tempAudioPath, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', outputPath]
      : [
          '-y',
          '-i',
          tempVideoPath,
          '-i',
          tempAudioPath,
          '-c',
          'copy',
          '-movflags',
          '+faststart',
          outputPath,
        ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegBin, ffmpegArgs);
      let stderrLog = '';
      proc.stderr.on('data', (chunk) => {
        stderrLog += chunk.toString();
      });
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderrLog.slice(-300)}`));
        }
      });
      proc.on('error', (err) => reject(err));
    });

    return outputPath;
  } finally {
    if (fs.existsSync(tempVideoPath)) {
      fs.unlink(tempVideoPath, () => {});
    }
    if (fs.existsSync(tempAudioPath)) {
      fs.unlink(tempAudioPath, () => {});
    }
  }
}

async function ensureLocalMerged(
  originalUrl: string,
  rawPlatform: string,
  quality: string = '720p',
  isAudio: boolean = false
): Promise<string> {
  const platform = normalizePlatformParam(rawPlatform);
  const tempDir = getTempDir();
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Generate safe unique key for cache
  let idKey = 'media';
  if (platform === 'youtube') {
    const match = originalUrl.match(/(?:youtu\.be\/|v=|\/shorts\/|embed\/)([\w-]{11})/);
    idKey = match ? match[1] : 'yt_' + crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  } else if (platform === 'facebook') {
    const match = originalUrl.match(/(?:posts|videos|reel|share\/r|watch\/?\?v=)\/(\d+)/);
    idKey = match ? match[1] : 'fb_' + crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  } else if (platform === 'niconico') {
    const match = originalUrl.match(/(?:watch\/)?([a-z]{2}\d+)/i);
    idKey = match ? match[1] : 'nico_' + crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  } else {
    idKey = `${platform}_` + crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  }
  idKey = sanitizeCacheKeyPart(idKey) || 'media';

  const cleanQuality = isAudio
    ? 'audio'
    : quality.includes('1080')
    ? '1080p'
    : quality.includes('480')
    ? '480p'
    : quality.includes('360')
    ? '360p'
    : '720p';

  const ext = isAudio ? 'mp3' : 'mp4';
  const outputPath = path.join(tempDir, `${platform}_${idKey}_${cleanQuality}.${ext}`);

  // Path traversal guard: resolved output must stay inside the temp cache root
  const tempRoot = path.resolve(tempDir);
  const resolvedOutput = path.resolve(outputPath);
  if (!resolvedOutput.startsWith(tempRoot + path.sep)) {
    throw new Error('Invalid cache path for merged media.');
  }

  // Cache check: return instant if already merged
  if (fs.existsSync(resolvedOutput)) {
    const stat = fs.statSync(resolvedOutput);
    if (stat.size > 1000) {
      return resolvedOutput;
    }
  }

  // Deduplication check: if another connection is already merging this exact file, await it!
  const ongoing = inFlightMerges.get(resolvedOutput);
  if (ongoing) {
    return await ongoing;
  }

  if (!isSafeCliTargetUrl(originalUrl)) {
    throw new Error('Unsafe target URL for the local download engine.');
  }

  cleanupOldTempFiles();

  if (activeMerges >= MAX_CONCURRENT_MERGES) {
    const busyError = new Error(BUSY_MESSAGE) as Error & { status?: number };
    busyError.status = 429;
    throw busyError;
  }

  const mergePromise = (async () => {
    activeMerges++;
    try {
      // 1. Native Niconico Domand Engine (works on Vercel Serverless + Local Windows/Linux)
      if (
        platform === 'niconico' ||
        originalUrl.includes('nicovideo.jp') ||
        originalUrl.includes('nico.ms')
      ) {
        return await mergeNicoNicoDomand(
          originalUrl,
          resolvedOutput,
          cleanQuality,
          isAudio,
          tempDir
        );
      }

      // 2. Local yt-dlp Engine (YouTube, Facebook, etc.)
      const ytBinary = path.join(
        process.cwd(),
        'bin',
        process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
      );
      if (!fs.existsSync(ytBinary)) {
        throw new Error('yt-dlp binary not found in bin directory.');
      }

      return await new Promise<string>((resolve, reject) => {
        let args: string[] = [];

        const cookiePath = path.join(process.cwd(), 'bin', 'cookies.txt');
        const extraSafeFlags: string[] = ['--js-runtimes', 'node'];
        if (fs.existsSync(cookiePath)) {
          extraSafeFlags.push('--cookies', cookiePath);
        }

        if (isAudio) {
          args = [
            '-x',
            '--audio-format', 'mp3',
            '--no-playlist',
            '--no-exec',
            '--no-config-locations',
            ...extraSafeFlags,
            '-o', resolvedOutput,
            '--', originalUrl,
          ];
        } else if (platform === 'youtube') {
          let formatSpec = 'bestvideo[height<=720]+bestaudio/best[height<=720]/best';
          if (cleanQuality === '1080p') {
            formatSpec = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
          } else if (cleanQuality === '360p') {
            formatSpec = '134+140/bestvideo[height<=360]+bestaudio/best';
          }
          args = [
            '-f', formatSpec,
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '--no-exec',
            '--no-config-locations',
            ...extraSafeFlags,
            '-o', resolvedOutput,
            '--', originalUrl,
          ];
        } else if (platform === 'facebook') {
          let formatSpec = 'hd/best[height<=720]/best';
          if (cleanQuality === '1080p') {
            formatSpec = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
          } else if (cleanQuality === '360p') {
            formatSpec = 'sd/best[height<=360]/best';
          }
          args = [
            '-f', formatSpec,
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '--no-exec',
            '--no-config-locations',
            ...extraSafeFlags,
            '-o', resolvedOutput,
            '--', originalUrl,
          ];
        } else {
          // General platform
          args = [
            '-f', 'best',
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '--no-exec',
            '--no-config-locations',
            ...extraSafeFlags,
            '-o', resolvedOutput,
            '--', originalUrl,
          ];
        }

        const proc = spawn(ytBinary, args);

        proc.on('close', (code) => {
          if (code === 0 && fs.existsSync(resolvedOutput)) {
            resolve(resolvedOutput);
          } else {
            reject(new Error(`yt-dlp process exited with code ${code}`));
          }
        });

        proc.on('error', (err) => reject(err));
      });
    } finally {
      activeMerges--;
      inFlightMerges.delete(resolvedOutput);
    }
  })();

  inFlightMerges.set(resolvedOutput, mergePromise);
  return await mergePromise;
}

function resolveExtensionFromMime(mime: string, fallbackExt: string): string {
  const lower = mime.toLowerCase();
  if (lower.includes('audio/mpeg') || lower.includes('audio/mp3')) return 'mp3';
  if (lower.includes('image/png')) return 'png';
  if (lower.includes('image/gif')) return 'gif';
  if (lower.includes('image/webp')) return 'webp';
  if (lower.includes('image/jpeg') || lower.includes('image/jpg')) return 'jpg';
  if (lower.includes('video/webm')) return 'webm';
  if (lower.includes('video/mp4')) return 'mp4';
  return fallbackExt;
}

async function handleProxy(req: NextRequest, isHead: boolean = false) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url') || '';
  const sourcePlatform = normalizePlatformParam(searchParams.get('platform'));
  const qualityParam = searchParams.get('quality') || '720p';
  const rawFilename = searchParams.get('filename') || 'video.mp4';
  const isAudio =
    rawFilename.toLowerCase().endsWith('.mp3') ||
    qualityParam === 'mp3' ||
    qualityParam.toLowerCase().includes('audio');

  const rawExtMatch = rawFilename.match(/\.(mp4|mp3|jpg|jpeg|png|gif|webp|webm)$/i);
  const urlExtMatch = targetUrl.match(/\.(mp4|mp3|jpg|jpeg|png|gif|webp|webm)(?:$|[?#])/i);
  const ext = isAudio
    ? 'mp3'
    : rawExtMatch
    ? rawExtMatch[1].toLowerCase()
    : urlExtMatch
    ? urlExtMatch[1].toLowerCase()
    : 'mp4';

  const { ascii: asciiFilename, utf8: utf8Filename } = getCleanFilename(rawFilename, ext, sourcePlatform);

  if (!targetUrl) {
    return NextResponse.json({ error: 'Target URL is required.' }, { status: 400 });
  }

  const isInternalLocalFlag = targetUrl === 'local_merge' || targetUrl === 'local';
  if (!isInternalLocalFlag && !(await isSafeExternalUrl(targetUrl))) {
    return NextResponse.json({ error: 'Access denied: Dangerous target URL.' }, { status: 403 });
  }

  const contentType =
    ext === 'mp3'
      ? 'audio/mpeg'
      : ext === 'png'
      ? 'image/png'
      : ext === 'gif'
      ? 'image/gif'
      : ext === 'webp'
      ? 'image/webp'
      : ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : 'video/mp4';

  // 1. High-Speed Local / Native Engine (NicoNico Domand, YouTube & Facebook Muxing / MP3)
  const isLocalEngine =
    isInternalLocalFlag ||
    targetUrl === 'local_merge' ||
    targetUrl === 'local' ||
    sourcePlatform === 'niconico' ||
    targetUrl.includes('nicovideo.jp') ||
    targetUrl.includes('nico.ms') ||
    targetUrl.includes('youtube.com') ||
    targetUrl.includes('youtu.be');

  if (isLocalEngine) {
    const origUrl = searchParams.get('origUrl') || targetUrl;

    // Optional external persistent engine offload (e.g. Render server-engine) if NICONICO_ENGINE_URL is set
    const externalEngineBase = (process.env.NICONICO_ENGINE_URL || '').trim().replace(/\/+$/, '');
    if (
      externalEngineBase &&
      (sourcePlatform === 'niconico' || origUrl.includes('nicovideo.jp') || origUrl.includes('nico.ms'))
    ) {
      const offloadUrl = `${externalEngineBase}/download?url=${encodeURIComponent(
        origUrl
      )}&platform=${encodeURIComponent(sourcePlatform)}&quality=${encodeURIComponent(
        qualityParam
      )}&filename=${encodeURIComponent(rawFilename)}`;
      return NextResponse.redirect(offloadUrl);
    }

    try {
      if (!(await isSafeExternalUrl(origUrl)) || !isSafeCliTargetUrl(origUrl)) {
        return NextResponse.json({ error: 'Access denied: Dangerous target URL.' }, { status: 403 });
      }

      const filePath = await ensureLocalMerged(origUrl, sourcePlatform, qualityParam, isAudio);
      const stat = fs.statSync(filePath);
      const totalSize = stat.size;

      const rangeHeader = req.headers.get('range');

      const baseHeaders: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      };

      if (isHead) {
        baseHeaders['Content-Length'] = totalSize.toString();
        return new NextResponse(null, { status: 200, headers: baseHeaders });
      }

      if (rangeHeader) {
        const rangeMatch = rangeHeader.match(/^bytes=(\d*)-(\d*)\s*$/);
        let start = 0;
        let end = totalSize - 1;
        let isRangeValid = Boolean(rangeMatch);

        if (rangeMatch) {
          const rawStart = rangeMatch[1];
          const rawEnd = rangeMatch[2];
          if (rawStart === '' && rawEnd !== '') {
            const suffixLength = parseInt(rawEnd, 10);
            start = Number.isFinite(suffixLength) ? Math.max(0, totalSize - suffixLength) : 0;
            end = totalSize - 1;
          } else {
            start = parseInt(rawStart, 10);
            end = rawEnd === '' ? totalSize - 1 : parseInt(rawEnd, 10);
          }
          if (!Number.isFinite(start) || !Number.isFinite(end) || start >= totalSize || start > end) {
            isRangeValid = false;
          } else if (end > totalSize - 1) {
            end = totalSize - 1;
          }
        }

        if (!isRangeValid) {
          return new NextResponse(null, {
            status: 416,
            headers: {
              'Content-Type': contentType,
              'Accept-Ranges': 'bytes',
              'Content-Range': `bytes */${totalSize}`,
            },
          });
        }

        const chunkSize = end - start + 1;

        baseHeaders['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
        baseHeaders['Content-Length'] = chunkSize.toString();

        const fileStream = fs.createReadStream(filePath, { start, end });
        // @ts-ignore Node stream to web stream
        return new NextResponse(fileStream as any, {
          status: 206,
          headers: baseHeaders,
        });
      }

      baseHeaders['Content-Length'] = totalSize.toString();
      const fileStream = fs.createReadStream(filePath);
      // @ts-ignore Node stream to web stream
      return new NextResponse(fileStream as any, {
        status: 200,
        headers: baseHeaders,
      });
    } catch (err) {
      if (isMergeBusyError(err)) {
        return NextResponse.json(
          { error: BUSY_MESSAGE },
          { status: 429, headers: { 'Retry-After': '15' } }
        );
      }
      console.warn('Local merge failed, attempting cloud fallback:', err);

      // Cloud stream fallback for Vercel / serverless Linux environments
      const origUrl = searchParams.get('origUrl');
      if (origUrl && (await isSafeExternalUrl(origUrl))) {
        try {
          const { MediaDownloader } = require('@satorufx/mediadownloader');
          const client = new MediaDownloader({ timeout: 25000 });
          const cloudRes = await client.fromEndpoint('downallv4', origUrl, {
            quality: qualityParam.includes('1080') ? '1080p' : '720p',
          });
          const streamUrl = isAudio ? cloudRes.audio || cloudRes.video : cloudRes.video;
          if (streamUrl && (await isSafeExternalUrl(streamUrl))) {
            return NextResponse.redirect(streamUrl);
          }
        } catch (cloudErr) {
          console.warn('Cloud fallback resolution failed:', cloudErr);
        }
      }

      return NextResponse.json(
        { error: (err as Error)?.message || 'Failed to process and merge media stream.' },
        { status: 502 }
      );
    }
  }

  // 2. High-Speed Direct Proxy for Remote Streams (TikTok, Twitter/X, DeviantArt, YouTube SSE)
  try {
    let resolvedTargetUrl = targetUrl;

    // Resolve downallv2 SSE progress endpoints into their direct CDN download_url
    if (resolvedTargetUrl.includes('/sse-progress?')) {
      const sseRes = await fetch(resolvedTargetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/event-stream,*/*',
        },
      });
      if (sseRes.ok) {
        const sseText = await sseRes.text();
        const dlMatch = sseText.match(/"download_url"\s*:\s*"([^"]+)"/);
        if (dlMatch && dlMatch[1]) {
          const parsedUrl = JSON.parse(`"${dlMatch[1]}"`);
          if (parsedUrl && (await isSafeExternalUrl(parsedUrl))) {
            resolvedTargetUrl = parsedUrl;
          }
        }
      }
    }

    const fetchHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const clientRange = req.headers.get('range');
    if (clientRange) {
      fetchHeaders['Range'] = clientRange;
    }

    if (isHead) {
      const headRes = await fetch(resolvedTargetUrl, { method: 'HEAD', headers: fetchHeaders });
      const upstreamType = headRes.headers.get('content-type') || '';
      if (upstreamType.toLowerCase().includes('text/html')) {
        return NextResponse.json({ error: 'Upstream URL is a webpage, not a media file.' }, { status: 502 });
      }
      const isImage =
        upstreamType.startsWith('image/') ||
        Boolean(targetUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) ||
        targetUrl.includes('/thumb?') ||
        targetUrl.includes('thumb');

      const finalContentType = isImage
        ? (upstreamType.startsWith('image/') ? upstreamType : contentType)
        : (upstreamType || contentType);

      const resolvedExt = resolveExtensionFromMime(finalContentType, ext);
      const { ascii: finalAscii, utf8: finalUtf8 } = getCleanFilename(rawFilename, resolvedExt, sourcePlatform);

      const respHeaders: Record<string, string> = {
        'Content-Type': finalContentType,
        'Accept-Ranges': 'bytes',
      };
      const hasCustomFilename = Boolean(searchParams.get('filename'));
      if (!isImage || hasCustomFilename) {
        respHeaders['Content-Disposition'] = `attachment; filename="${finalAscii}"; filename*=UTF-8''${finalUtf8}`;
      }
      const len = headRes.headers.get('content-length');
      if (len) respHeaders['Content-Length'] = len;

      return new NextResponse(null, { status: headRes.status === 206 ? 206 : 200, headers: respHeaders });
    }

    const mediaResponse = await fetch(resolvedTargetUrl, { headers: fetchHeaders });

    if (!mediaResponse.ok && mediaResponse.status !== 206) {
      console.warn(`Upstream status ${mediaResponse.status}, redirecting to source URL`);
      if (await isSafeExternalUrl(resolvedTargetUrl)) {
        return NextResponse.redirect(resolvedTargetUrl);
      }
      return NextResponse.json({ error: 'Upstream media is unavailable.' }, { status: 502 });
    }

    const upstreamType = mediaResponse.headers.get('content-type') || '';
    if (upstreamType.toLowerCase().includes('text/html')) {
      return NextResponse.json(
        { error: 'Upstream returned an HTML webpage instead of a media stream.' },
        { status: 502 }
      );
    }

    const isImage =
      upstreamType.startsWith('image/') ||
      Boolean(targetUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) ||
      targetUrl.includes('/thumb?') ||
      targetUrl.includes('thumb');

    const finalContentType = isImage
      ? (upstreamType.startsWith('image/') ? upstreamType : contentType)
      : (upstreamType || contentType);

    const resolvedExt = resolveExtensionFromMime(finalContentType, ext);
    const { ascii: finalAscii, utf8: finalUtf8 } = getCleanFilename(rawFilename, resolvedExt, sourcePlatform);

    const respHeaders: Record<string, string> = {
      'Content-Type': finalContentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': isImage ? 'public, max-age=86400' : 'no-cache',
    };

    const hasCustomFilename = Boolean(searchParams.get('filename'));
    if (!isImage || hasCustomFilename) {
      respHeaders['Content-Disposition'] = `attachment; filename="${finalAscii}"; filename*=UTF-8''${finalUtf8}`;
    }

    const clen = mediaResponse.headers.get('content-length');
    if (clen) respHeaders['Content-Length'] = clen;

    const crange = mediaResponse.headers.get('content-range');
    if (crange) respHeaders['Content-Range'] = crange;

    return new NextResponse(mediaResponse.body, {
      status: mediaResponse.status,
      headers: respHeaders,
    });
  } catch (err) {
    console.error('Proxy stream exception:', err);
    if (await isSafeExternalUrl(targetUrl)) {
      return NextResponse.redirect(targetUrl);
    }
    return NextResponse.json({ error: 'Upstream media is unavailable.' }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  return handleProxy(req, false);
}

export async function HEAD(req: NextRequest) {
  return handleProxy(req, true);
}
