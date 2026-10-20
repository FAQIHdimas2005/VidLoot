import { NextRequest, NextResponse } from 'next/server';
import { extractVideo } from '@/lib/extractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL video tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const result = await extractVideo(url);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Terjadi kesalahan saat memproses link video.',
      },
      { status: 500 }
    );
  }
}
