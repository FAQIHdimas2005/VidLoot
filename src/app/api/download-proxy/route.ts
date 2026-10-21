import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';

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

async function ensureLocalMerged(
  videoUrl: string,
  platform: string,
  quality: string = '720p',
  isAudio: boolean = false
): Promise<string> {
  const tempDir = path.join(process.cwd(), '.temp-downloads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Generate safe unique key for cache
  let idKey = 'media';
  if (platform === 'youtube') {
    const match = videoUrl.match(/(?:youtu\.be\/|v=|\/shorts\/|embed\/)([\w-]{11})/);
    idKey = match ? match[1] : 'yt_' + crypto.createHash('md5').update(videoUrl).digest('hex').slice(0, 8);
  } else if (platform === 'facebook') {
    const match = videoUrl.match(/(?:posts|videos|reel|share\/r|watch\/?\?v=)\/(\d+)/);
    idKey = match ? match[1] : 'fb_' + crypto.createHash('md5').update(videoUrl).digest('hex').slice(0, 8);
  } else {
    idKey = `${platform}_` + crypto.createHash('md5').update(videoUrl).digest('hex').slice(0, 8);
  }

  const cleanQuality = isAudio
    ? 'audio'
    : quality.includes('1080')
    ? '1080p'
    : quality.includes('360')
    ? '360p'
    : '720p';

  const ext = isAudio ? 'mp3' : 'mp4';
  const outputPath = path.join(tempDir, `${platform}_${idKey}_${cleanQuality}.${ext}`);

  // Cache check: return instant if already merged
  if (fs.existsSync(outputPath)) {
    const stat = fs.statSync(outputPath);
    if (stat.size > 1000) {
      return outputPath;
    }
  }

  const ytBinary = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
  if (!fs.existsSync(ytBinary)) {
    throw new Error('yt-dlp binary not found in bin directory.');
  }

  return new Promise((resolve, reject) => {
    let args: string[] = [];

    if (isAudio) {
      args = [
        '-x',
        '--audio-format', 'mp3',
        '--no-playlist',
        '-o', outputPath,
        videoUrl,
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
        '-o', outputPath,
        videoUrl,
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
        '-o', outputPath,
        videoUrl,
      ];
    } else {
      // General platform
      args = [
        '-f', 'best',
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '-o', outputPath,
        videoUrl,
      ];
    }

    const proc = spawn(ytBinary, args);

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error(`yt-dlp process exited with code ${code}`));
      }
    });

    proc.on('error', (err) => reject(err));
  });
}

async function handleProxy(req: NextRequest, isHead: boolean = false) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const sourcePlatform = searchParams.get('platform') || '';
  const qualityParam = searchParams.get('quality') || '720p';
  const rawFilename = searchParams.get('filename') || 'video.mp4';
  const isAudio = rawFilename.endsWith('.mp3') || qualityParam === 'mp3' || qualityParam.toLowerCase().includes('audio');
  const ext = isAudio ? 'mp3' : 'mp4';
  const { ascii: asciiFilename, utf8: utf8Filename } = getCleanFilename(rawFilename, ext, sourcePlatform);

  if (!targetUrl) {
    return NextResponse.json({ error: 'Target URL is required.' }, { status: 400 });
  }

  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

  // 1. High-Speed Local Engine (YouTube & Facebook Muxing / MP3)
  const isLocalEngine =
    targetUrl === 'local_merge' ||
    targetUrl === 'local' ||
    sourcePlatform === 'youtube' ||
    sourcePlatform === 'facebook' ||
    targetUrl.includes('youtube.com') ||
    targetUrl.includes('youtu.be');

  if (isLocalEngine) {
    try {
      const origUrl = searchParams.get('origUrl') || targetUrl;
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
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
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
      console.warn('Local merge failed, attempting direct stream fallback:', err);
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
      const respHeaders: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`,
        'Accept-Ranges': 'bytes',
      };
      const len = headRes.headers.get('content-length');
      if (len) respHeaders['Content-Length'] = len;

      return new NextResponse(null, { status: headRes.status === 206 ? 206 : 200, headers: respHeaders });
    }

    const mediaResponse = await fetch(targetUrl, { headers: fetchHeaders });

    if (!mediaResponse.ok && mediaResponse.status !== 206) {
      console.warn(`Upstream status ${mediaResponse.status}, redirecting to source URL`);
      return NextResponse.redirect(targetUrl);
    }

    const respHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    };

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
    return NextResponse.redirect(targetUrl);
  }
}

export async function GET(req: NextRequest) {
  return handleProxy(req, false);
}

export async function HEAD(req: NextRequest) {
  return handleProxy(req, true);
}
