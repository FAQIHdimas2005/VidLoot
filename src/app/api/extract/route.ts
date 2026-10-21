import { NextRequest, NextResponse } from 'next/server';
import { extractVideo } from '@/lib/extractor';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Video URL cannot be empty.' },
        { status: 400 }
      );
    }

    if (url.trim().length > 2048) {
      return NextResponse.json(
        { success: false, error: 'Video URL is too long.' },
        { status: 400 }
      );
    }

    const result = await extractVideo(url);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }
    console.error('[Extraction Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to extract video. Please verify the URL and try again.',
      },
      { status: 500 }
    );
  }
}
