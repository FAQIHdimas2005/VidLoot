import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'video_download.mp4';

  if (!targetUrl) {
    return NextResponse.json({ error: 'Target URL parameter is required.' }, { status: 400 });
  }

  try {
    // Fetch original media stream
    const mediaResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!mediaResponse.ok) {
      console.warn(`Stream response not ok (${mediaResponse.status}), redirecting directly to source...`);
      return NextResponse.redirect(targetUrl);
    }

    const contentType =
      mediaResponse.headers.get('content-type') ||
      (filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4');
    const contentLength = mediaResponse.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    // Stream directly to client browser
    return new NextResponse(mediaResponse.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('Download proxy error:', err);
    // If stream proxy fails (e.g. cross-origin blocking), fallback redirect
    return NextResponse.redirect(targetUrl);
  }
}
