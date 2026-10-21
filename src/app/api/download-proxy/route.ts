import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
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

function cleanupOldTempFiles(): void {
  try {
    const tempDir = path.join(process.cwd(), TEMP_DIR_NAME);
    if (!fs.existsSync(tempDir)) return;
    const now = Date.now();
    for (const entry of fs.readdirSync(tempDir)) {
      try {
        if (!/\.(mp4|mp3|webm|part|ytdl)$/i.test(entry)) continue;
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

async function ensureLocalMerged(
  originalUrl: string,
  rawPlatform: string,
  quality: string = '720p',
  isAudio: boolean = false
): Promise<string> {
  const platform = normalizePlatformParam(rawPlatform);
  const tempDir = path.join(process.cwd(), TEMP_DIR_NAME);
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
  } else {
    idKey = `${platform}_` + crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 8);
  }
  idKey = sanitizeCacheKeyPart(idKey) || 'media';

  const cleanQuality = isAudio
    ? 'audio'
    : quality.includes('1080')
    ? '1080p'
    : quality.includes('360')
    ? '360p'
    : '720p';

  const ext = isAudio ? 'mp3' : 'mp4';
  const outputPath = path.join(tempDir, `${platform}_${idKey}_${cleanQuality}.${ext}`);

  // Path traversal guard: resolved output must stay inside the temp cache root
  const tempRoot = path.resolve(process.cwd(), TEMP_DIR_NAME);
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

  const ytBinary = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
  if (!fs.existsSync(ytBinary)) {
    throw new Error('yt-dlp binary not found in bin directory.');
  }

  const mergePromise = (async () => {
    activeMerges++;
    try {
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
            '-o', outputPath,
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
            '-o', outputPath,
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
            '-o', outputPath,
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
            '-o', outputPath,
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

async function handleProxy(req: NextRequest, isHead: boolean = false) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url') || '';
  const sourcePlatform = normalizePlatformParam(searchParams.get('platform'));
  const qualityParam = searchParams.get('quality') || '720p';
  const rawFilename = searchParams.get('filename') || 'video.mp4';
  const isAudio = rawFilename.endsWith('.mp3') || qualityParam === 'mp3' || qualityParam.toLowerCase().includes('audio');
  const ext = isAudio ? 'mp3' : 'mp4';
  const { ascii: asciiFilename, utf8: utf8Filename } = getCleanFilename(rawFilename, ext, sourcePlatform);

  if (!targetUrl) {
    return NextResponse.json({ error: 'Target URL is required.' }, { status: 400 });
  }

  const isInternalLocalFlag = targetUrl === 'local_merge' || targetUrl === 'local';
  if (!isInternalLocalFlag && !(await isSafeExternalUrl(targetUrl))) {
    return NextResponse.json({ error: 'Access denied: Dangerous target URL.' }, { status: 403 });
  }

  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

  // 1. High-Speed Local Engine (YouTube & Facebook Muxing / MP3)
  const isLocalEngine =
    isInternalLocalFlag ||
    targetUrl === 'local_merge' ||
    targetUrl === 'local' ||
    targetUrl.includes('youtube.com') ||
    targetUrl.includes('youtu.be');

  if (isLocalEngine) {
    try {
      const origUrl = searchParams.get('origUrl') || targetUrl;
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
    }
  }

  // 2. High-Speed Direct Proxy for Remote Streams (TikTok, Twitter/X)
  try {
    const fetchHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const clientRange = req.headers.get('range');
    if (clientRange) {
      fetchHeaders['Range'] = clientRange;
    }

    if (isHead) {
      const headRes = await fetch(targetUrl, { method: 'HEAD', headers: fetchHeaders });
      const upstreamType = headRes.headers.get('content-type') || '';
      const isImage =
        upstreamType.startsWith('image/') ||
        Boolean(targetUrl.match(/\.(jpg|jpeg|png|webp)/i)) ||
        targetUrl.includes('/thumb?') ||
        targetUrl.includes('thumb');

      const finalContentType = isImage
        ? (upstreamType.startsWith('image/') ? upstreamType : 'image/jpeg')
        : (upstreamType || contentType);

      const respHeaders: Record<string, string> = {
        'Content-Type': finalContentType,
        'Accept-Ranges': 'bytes',
      };
      if (!isImage) {
        respHeaders['Content-Disposition'] = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`;
      }
      const len = headRes.headers.get('content-length');
      if (len) respHeaders['Content-Length'] = len;

      return new NextResponse(null, { status: headRes.status === 206 ? 206 : 200, headers: respHeaders });
    }

    const mediaResponse = await fetch(targetUrl, { headers: fetchHeaders });

    if (!mediaResponse.ok && mediaResponse.status !== 206) {
      console.warn(`Upstream status ${mediaResponse.status}, redirecting to source URL`);
      if (await isSafeExternalUrl(targetUrl)) {
        return NextResponse.redirect(targetUrl);
      }
      return NextResponse.json({ error: 'Upstream media is unavailable.' }, { status: 502 });
    }

    const upstreamType = mediaResponse.headers.get('content-type') || '';
    const isImage =
      upstreamType.startsWith('image/') ||
      Boolean(targetUrl.match(/\.(jpg|jpeg|png|webp)/i)) ||
      targetUrl.includes('/thumb?') ||
      targetUrl.includes('thumb');

    const finalContentType = isImage
      ? (upstreamType.startsWith('image/') ? upstreamType : 'image/jpeg')
      : (upstreamType || contentType);

    const respHeaders: Record<string, string> = {
      'Content-Type': finalContentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': isImage ? 'public, max-age=86400' : 'no-cache',
    };

    if (!isImage) {
      respHeaders['Content-Disposition'] = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`;
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
