const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PORT = parseInt(process.env.PORT || '10000', 10);
const CACHE_DIR = path.join(os.tmpdir(), 'vidloot-engine-cache');
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CONCURRENT_MERGES = 4;

let activeMerges = 0;
const inFlightMerges = new Map();

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function isSafeTargetUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (/[\s\r\n\t]/.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getCleanFilename(rawName, ext = 'mp4', platform = 'video') {
  const withoutExt = (rawName || '').replace(/\.[^/.]+$/, '');
  let sanitized = withoutExt
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .trim()
    .slice(0, 120);

  if (!sanitized || !/[a-zA-Z0-9]/.test(sanitized)) {
    sanitized = `VidLoot_${platform}_${Date.now().toString().slice(-4)}`;
  }

  const finalName = `${sanitized}.${ext}`;
  const ascii = finalName.replace(/[^\x20-\x7E]/g, '_');
  const utf8 = encodeURIComponent(finalName);
  return { ascii, utf8 };
}

function cleanupOldCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) return;
    const now = Date.now();
    for (const entry of fs.readdirSync(CACHE_DIR)) {
      try {
        const fullPath = path.join(CACHE_DIR, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && now - stat.mtimeMs > CACHE_TTL_MS) {
          fs.unlink(fullPath, () => {});
        }
      } catch {
        // ignore individual file errors
      }
    }
  } catch {
    // ignore cleanup errors
  }
}

function resolveYtDlpBinary() {
  if (process.platform === 'win32') {
    const localWin = path.resolve(__dirname, '..', 'bin', 'yt-dlp.exe');
    if (fs.existsSync(localWin)) return localWin;
    return 'yt-dlp.exe';
  }
  if (fs.existsSync('/usr/local/bin/yt-dlp')) return '/usr/local/bin/yt-dlp';
  return 'yt-dlp';
}

function resolveFfmpegBinary() {
  if (process.platform === 'win32') {
    const localWin = path.resolve(__dirname, '..', 'bin', 'ffmpeg.exe');
    if (fs.existsSync(localWin)) return localWin;
    return 'ffmpeg.exe';
  }
  return 'ffmpeg';
}

/**
 * High-speed Pure Node.js Niconico Domand HLS (fMP4 + AES-128-CBC) Decryptor & FFmpeg Remuxer
 */
async function mergeNicoNicoDomand(originalUrl, outputPath, cleanQuality, isAudio) {
  const idMatch = originalUrl.match(/(?:watch\/|nico\.ms\/)([a-z]{2}\d+|\d+)/i);
  if (!idMatch) {
    throw new Error('Could not parse Niconico video ID from URL.');
  }
  const nicoId = idMatch[1];
  const trackId = `AAAAAAAAAA_${Date.now()}`;
  const ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  const extractCookies = (res) => {
    const rawList =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie')]
        : [];
    return rawList.map((c) => c.split(';')[0]).filter(Boolean);
  };

  let watchRes = await fetch(
    `https://www.nicovideo.jp/api/watch/v3_guest/${nicoId}?actionTrackId=${encodeURIComponent(trackId)}`,
    {
      headers: {
        'User-Agent': ua,
        Accept: 'application/json',
        'X-Frontend-Id': '6',
        'X-Frontend-Version': '0',
      },
    }
  );
  if (!watchRes.ok) {
    watchRes = await fetch(
      `https://www.nicovideo.jp/api/watch/v3/${nicoId}?actionTrackId=${encodeURIComponent(trackId)}`,
      {
        headers: {
          'User-Agent': ua,
          Accept: 'application/json',
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

  const availVideos = Array.isArray(domand.videos) ? domand.videos.filter((v) => v && v.isAvailable) : [];
  const availAudios = Array.isArray(domand.audios) ? domand.audios.filter((a) => a && a.isAvailable) : [];
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

  const accessRes = await fetch(
    `https://nvapi.nicovideo.jp/v1/watch/${nicoId}/access-rights/hls?actionTrackId=${encodeURIComponent(trackId)}`,
    {
      method: 'POST',
      headers: {
        'User-Agent': ua,
        'Content-Type': 'application/json',
        'X-Access-Right-Key': domand.accessRightKey,
        'X-Request-With': 'https://www.nicovideo.jp',
        'X-Frontend-Id': '6',
        'X-Frontend-Version': '0',
        Origin: 'https://www.nicovideo.jp',
        Referer: 'https://www.nicovideo.jp/',
        Cookie: baseCookies.join('; '),
      },
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
  const masterM3u8Url = accessJson?.data?.contentUrl;
  if (!masterM3u8Url) {
    throw new Error('Niconico nvapi did not return a master M3U8 URL.');
  }

  const masterText = await (
    await fetch(masterM3u8Url, {
      headers: { 'User-Agent': ua, Cookie: allCookies },
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

  const downloadAndDecryptStream = async (playlistUrl, destFile) => {
    const m3u8Text = await (
      await fetch(playlistUrl, {
        headers: { 'User-Agent': ua, Cookie: allCookies },
      })
    ).text();

    let initUrl = '';
    let keyUrl = '';
    let ivHex = '';
    let mediaSequence = 0;
    const segUrls = [];

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
      fetch(initUrl, { headers: { 'User-Agent': ua, Cookie: allCookies } })
        .then((r) => r.arrayBuffer())
        .then((b) => Buffer.from(b)),
      keyUrl
        ? fetch(keyUrl, { headers: { 'User-Agent': ua, Cookie: allCookies } })
            .then((r) => r.arrayBuffer())
            .then((b) => Buffer.from(b))
        : Promise.resolve(null),
    ]);

    const segBuffers = new Array(segUrls.length);
    const BATCH_SIZE = 8;

    for (let i = 0; i < segUrls.length; i += BATCH_SIZE) {
      const batch = segUrls.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (segUrl, idx) => {
          const segIndex = i + idx;
          const rawBuf = Buffer.from(
            await (
              await fetch(segUrl, { headers: { 'User-Agent': ua, Cookie: allCookies } })
            ).arrayBuffer()
          );

          if (keyBuf) {
            let ivBuf;
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
  const tempVideoPath = path.join(CACHE_DIR, `nico_vid_${uniqueSuffix}.mp4`);
  const tempAudioPath = path.join(CACHE_DIR, `nico_aud_${uniqueSuffix}.m4a`);

  try {
    if (isAudio) {
      await downloadAndDecryptStream(audioPlaylistUrl, tempAudioPath);
    } else {
      await Promise.all([
        downloadAndDecryptStream(videoPlaylistUrl, tempVideoPath),
        downloadAndDecryptStream(audioPlaylistUrl, tempAudioPath),
      ]);
    }

    const ffmpegBin = resolveFfmpegBinary();
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

    await new Promise((resolve, reject) => {
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
    if (fs.existsSync(tempVideoPath)) fs.unlink(tempVideoPath, () => {});
    if (fs.existsSync(tempAudioPath)) fs.unlink(tempAudioPath, () => {});
  }
}

async function ensureMergedMedia(originalUrl, platform, quality, isAudio) {
  const cleanPlatform = String(platform || 'niconico')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20) || 'media';

  const urlHash = crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 12);
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
  const outputPath = path.join(CACHE_DIR, `${cleanPlatform}_${urlHash}_${cleanQuality}.${ext}`);

  // 1. Return immediately if already cached on disk
  if (fs.existsSync(outputPath)) {
    const stat = fs.statSync(outputPath);
    if (stat.size > 1000) {
      return outputPath;
    }
  }

  // 2. Deduplicate concurrent requests (critical for IDM multi-connection probes)
  if (inFlightMerges.has(outputPath)) {
    return await inFlightMerges.get(outputPath);
  }

  if (activeMerges >= MAX_CONCURRENT_MERGES) {
    const busyErr = new Error('Server is busy processing media. Please try again in a few seconds.');
    busyErr.status = 429;
    throw busyErr;
  }

  cleanupOldCache();

  const mergePromise = (async () => {
    activeMerges++;
    try {
      // Primary: High-Speed Niconico Domand AES-128 Decryptor + FFmpeg
      if (
        cleanPlatform === 'niconico' ||
        originalUrl.includes('nicovideo.jp') ||
        originalUrl.includes('nico.ms')
      ) {
        try {
          return await mergeNicoNicoDomand(originalUrl, outputPath, cleanQuality, isAudio);
        } catch (domandErr) {
          console.warn('Domand native engine failed, falling back to yt-dlp:', domandErr.message);
        }
      }

      // Secondary: yt-dlp CLI
      const ytBinary = resolveYtDlpBinary();
      return await new Promise((resolve, reject) => {
        let args = [];
        const baseFlags = ['--no-playlist', '--no-exec', '--no-config-locations', '--js-runtimes', 'node'];

        if (isAudio) {
          args = [
            '-x',
            '--audio-format', 'mp3',
            ...baseFlags,
            '-o', outputPath,
            '--', originalUrl,
          ];
        } else {
          let formatSpec = 'bestvideo+bestaudio/best';
          if (cleanQuality === '1080p') {
            formatSpec = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
          } else if (cleanQuality === '720p') {
            formatSpec = 'bestvideo[height<=720]+bestaudio/best[height<=720]/best';
          } else if (cleanQuality === '480p') {
            formatSpec = 'bestvideo[height<=480]+bestaudio/best[height<=480]/best';
          } else if (cleanQuality === '360p') {
            formatSpec = 'bestvideo[height<=360]+bestaudio/best[height<=360]/best';
          }

          args = [
            '-f', formatSpec,
            '--merge-output-format', 'mp4',
            ...baseFlags,
            '-o', outputPath,
            '--', originalUrl,
          ];
        }

        const proc = spawn(ytBinary, args);
        let stderrLog = '';

        proc.stderr.on('data', (chunk) => {
          stderrLog += chunk.toString();
        });

        proc.on('close', (code) => {
          if (code === 0 && fs.existsSync(outputPath)) {
            resolve(outputPath);
          } else {
            reject(new Error(`yt-dlp exited with code ${code}: ${stderrLog.slice(-300)}`));
          }
        });

        proc.on('error', (err) => reject(err));
      });
    } finally {
      activeMerges--;
      inFlightMerges.delete(outputPath);
    }
  })();

  inFlightMerges.set(outputPath, mergePromise);
  return await mergePromise;
}

const server = http.createServer(async (req, res) => {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health Check Endpoint (Used by Render & VidLoot Auto-Killswitch)
  if (pathname === '/' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'vidloot-server-engine',
        activeMerges,
        maxConcurrentMerges: MAX_CONCURRENT_MERGES,
        timestamp: Date.now(),
      })
    );
    return;
  }

  // 2. Download & Stream Endpoint (Supports GET & HEAD + Byte Ranges for IDM)
  if (pathname === '/download') {
    const targetUrl = parsedUrl.searchParams.get('url') || '';
    const platform = parsedUrl.searchParams.get('platform') || 'niconico';
    const quality = parsedUrl.searchParams.get('quality') || '720p';
    const rawFilename = parsedUrl.searchParams.get('filename') || 'video.mp4';

    if (!isSafeTargetUrl(targetUrl)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or unsafe target URL.' }));
      return;
    }

    const isAudio =
      rawFilename.toLowerCase().endsWith('.mp3') ||
      quality === 'mp3' ||
      quality.toLowerCase().includes('audio');
    const ext = isAudio ? 'mp3' : 'mp4';
    const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';
    const { ascii, utf8 } = getCleanFilename(rawFilename, ext, platform);

    try {
      const filePath = await ensureMergedMedia(targetUrl, platform, quality, isAudio);
      const stat = fs.statSync(filePath);
      const totalSize = stat.size;

      const baseHeaders = {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      };

      if (req.method === 'HEAD') {
        res.writeHead(200, {
          ...baseHeaders,
          'Content-Length': totalSize.toString(),
        });
        res.end();
        return;
      }

      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        const match = rangeHeader.match(/^bytes=(\d*)-(\d*)\s*$/);
        if (match) {
          const rawStart = match[1];
          const rawEnd = match[2];
          let start = 0;
          let end = totalSize - 1;

          if (rawStart === '' && rawEnd !== '') {
            const suffix = parseInt(rawEnd, 10);
            start = Number.isFinite(suffix) ? Math.max(0, totalSize - suffix) : 0;
          } else {
            start = parseInt(rawStart, 10);
            end = rawEnd === '' ? totalSize - 1 : parseInt(rawEnd, 10);
          }

          if (!Number.isFinite(start) || !Number.isFinite(end) || start >= totalSize || start > end) {
            res.writeHead(416, {
              'Content-Type': contentType,
              'Accept-Ranges': 'bytes',
              'Content-Range': `bytes */${totalSize}`,
            });
            res.end();
            return;
          }

          if (end > totalSize - 1) end = totalSize - 1;
          const chunkSize = end - start + 1;

          res.writeHead(206, {
            ...baseHeaders,
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': chunkSize.toString(),
          });

          const stream = fs.createReadStream(filePath, { start, end });
          stream.pipe(res);
          return;
        }
      }

      res.writeHead(200, {
        ...baseHeaders,
        'Content-Length': totalSize.toString(),
      });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err) {
      console.error('Engine merge error:', err.message);
      const statusCode = err.status === 429 ? 429 : 502;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Failed to process media stream.' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VidLoot Server Engine listening on port ${PORT}`);
});
