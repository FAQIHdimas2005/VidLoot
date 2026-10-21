import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

function getCleanFilename(rawName: string, ext: string = 'mp4'): { ascii: string; utf8: string } {
  const withoutExt = rawName.replace(/\.[^/.]+$/, '');
  const sanitized = withoutExt
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

  const finalName = `${sanitized || 'video'}.${ext}`;
  const ascii = finalName.replace(/[^\x20-\x7E]/g, '_');
  const utf8 = encodeURIComponent(finalName);
  return { ascii, utf8 };
}

async function ensureYouTubeMerged(videoUrl: string, quality: string = '360p'): Promise<string> {
  const tempDir = path.join(process.cwd(), '.temp-downloads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Extract ID or hash
  const match = videoUrl.match(/(?:youtu\.be\/|v=|\/shorts\/|embed\/)([\w-]{11})/);
  const videoId = match ? match[1] : 'yt_video';
  const outputPath = path.join(tempDir, `${videoId}_${quality}.mp4`);

  // Cache check
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
    const formatSpec = quality === '720p' ? '298+140/134+140/b' : '134+140/b';
    const proc = spawn(ytBinary, [
      '-f', formatSpec,
      '-o', outputPath,
      '--no-playlist',
      videoUrl,
    ]);

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
  const rawFilename = searchParams.get('filename') || 'video.mp4';
  const isAudio = rawFilename.endsWith('.mp3');
  const ext = isAudio ? 'mp3' : 'mp4';
  const { ascii: asciiFilename, utf8: utf8Filename } = getCleanFilename(rawFilename, ext);

  if (!targetUrl) {
    return NextResponse.json({ error: 'Target URL is required.' }, { status: 400 });
  }

  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

  // 1. YouTube Merged Handler (Local yt-dlp + ffmpeg)
  const isYouTube = sourcePlatform === 'youtube' || targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be') || targetUrl.includes('googlevideo.com');

  if (isYouTube && !isAudio) {
    try {
      const origUrl = searchParams.get('origUrl') || targetUrl;
      const filePath = await ensureYouTubeMerged(origUrl, '360p');
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
      console.warn('Local YouTube merge failed, falling back to direct stream:', err);
    }
  }

  // 2. Generic Proxy for Remote Streams (TikTok, X, Facebook, Audio)
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
        'Content-Type': headRes.headers.get('content-type') || contentType,
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
      'Content-Type': mediaResponse.headers.get('content-type') || contentType,
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
