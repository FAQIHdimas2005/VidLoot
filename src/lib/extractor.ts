import { PlatformType, VideoExtractionResult, DownloadMedia } from './types';

export function detectPlatform(url: string): PlatformType {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes('tiktok.com') || trimmed.includes('douyin.com')) {
    return 'tiktok';
  }
  if (trimmed.includes('instagram.com')) {
    return 'instagram';
  }
  if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
    return 'twitter';
  }
  if (
    trimmed.includes('facebook.com') ||
    trimmed.includes('fb.watch') ||
    trimmed.includes('fb.com')
  ) {
    return 'facebook';
  }
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return 'youtube';
  }
  return 'unknown';
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 1. REAL TWITTER / X EXTRACTOR
async function extractTwitter(url: string): Promise<VideoExtractionResult | null> {
  try {
    const match = url.match(/status\/(\d+)/);
    if (!match) return null;
    const tweetId = match[1];

    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const tweet = data.tweet;
    if (!tweet) return null;

    const videos = tweet.media?.videos || [];
    if (videos.length === 0) {
      return {
        success: false,
        platform: 'twitter',
        title: tweet.text || 'Postingan X',
        medias: [],
        error: 'Tidak ditemukan video pada postingan tweet/X ini.',
      };
    }

    const firstVideo = videos[0];
    const variants = (firstVideo.formats || firstVideo.variants || []).filter(
      (v: any) => v.url && (v.content_type === 'video/mp4' || v.container === 'mp4' || v.url.endsWith('.mp4'))
    );

    // Sort by bitrate descending
    variants.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    const medias: DownloadMedia[] = [];

    if (variants.length > 0) {
      // Best quality
      medias.push({
        quality: 'MP4 Full HD / High Quality',
        format: 'mp4',
        url: variants[0].url,
        label: 'Download Video (HD)',
      });

      // Medium / SD quality if available
      if (variants.length > 1) {
        medias.push({
          quality: 'MP4 Standard Quality (SD)',
          format: 'mp4',
          url: variants[variants.length - 1].url,
          label: 'Download Video (SD / Ukuran Kecil)',
        });
      }
    } else if (firstVideo.url) {
      medias.push({
        quality: 'MP4 Default',
        format: 'mp4',
        url: firstVideo.url,
        label: 'Download Video MP4',
      });
    }

    // Audio option using the same video stream
    if (medias.length > 0) {
      medias.push({
        quality: 'Audio Only',
        format: 'mp3',
        url: medias[0].url,
        label: 'Download Audio Saja (MP3)',
      });
    }

    return {
      success: true,
      platform: 'twitter',
      title: tweet.text ? tweet.text.slice(0, 120) : 'Video X (Twitter)',
      author: `@${tweet.author?.screen_name || 'user'} (${tweet.author?.name || ''})`,
      thumbnail: firstVideo.thumbnail_url || tweet.author?.avatar_url,
      duration: firstVideo.duration ? formatDuration(firstVideo.duration) : undefined,
      medias,
    };
  } catch (err) {
    console.warn('FxTwitter extractor failed:', err);
    return null;
  }
}

// 2. REAL TIKTOK EXTRACTOR
async function extractTikTok(url: string): Promise<VideoExtractionResult | null> {
  try {
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: new URLSearchParams({
        url: url.trim(),
        hd: '1',
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.code === 0 && data.data) {
      const v = data.data;
      const medias: DownloadMedia[] = [];

      if (v.hdplay) {
        medias.push({
          quality: 'Full HD (Tanpa Watermark)',
          format: 'mp4',
          url: v.hdplay,
          label: 'Download Video MP4 Full HD',
        });
      }

      if (v.play) {
        medias.push({
          quality: 'Standard (Tanpa Watermark)',
          format: 'mp4',
          url: v.play,
          label: 'Download Video MP4 Standard',
        });
      }

      if (v.music) {
        medias.push({
          quality: 'Audio MP3',
          format: 'mp3',
          url: v.music,
          label: 'Download Audio Sound (MP3)',
        });
      }

      return {
        success: true,
        platform: 'tiktok',
        title: v.title || 'Video TikTok',
        author: `@${v.author?.unique_id || v.author?.nickname || 'kreator'}`,
        thumbnail: v.cover || v.origin_cover,
        duration: v.duration ? formatDuration(v.duration) : undefined,
        medias,
      };
    }
    return null;
  } catch (err) {
    console.warn('TikWM extractor failed:', err);
    return null;
  }
}

// 3. REAL YOUTUBE EXTRACTOR
async function extractYouTube(url: string): Promise<VideoExtractionResult | null> {
  try {
    const { youtube } = require('btch-downloader');
    const data = await youtube(url);
    if (data && data.status && (data.mp4 || data.mp3)) {
      const medias: DownloadMedia[] = [];
      if (data.mp4) {
        medias.push({
          quality: 'MP4 HD 720p',
          format: 'mp4',
          url: data.mp4,
          label: 'Download Video (MP4)',
        });
      }
      if (data.mp3) {
        medias.push({
          quality: 'Audio MP3',
          format: 'mp3',
          url: data.mp3,
          label: 'Download Musik / Audio (MP3)',
        });
      }
      return {
        success: true,
        platform: 'youtube',
        title: data.title || 'Video YouTube',
        author: data.author || undefined,
        thumbnail: data.thumbnail,
        medias,
      };
    }
  } catch (err) {
    console.warn('YouTube extractor failed:', err);
  }
  return null;
}

// 4. REAL FACEBOOK EXTRACTOR
async function extractFacebook(url: string): Promise<VideoExtractionResult | null> {
  try {
    const { fbdown } = require('btch-downloader');
    const data = await fbdown(url);
    if (data && data.status && (data.HD || data.Normal_video)) {
      const medias: DownloadMedia[] = [];
      if (data.HD) {
        medias.push({
          quality: 'Kualitas Tinggi (HD)',
          format: 'mp4',
          url: data.HD,
          label: 'Download Video Facebook (HD)',
        });
      }
      if (data.Normal_video) {
        medias.push({
          quality: 'Kualitas Standar (SD)',
          format: 'mp4',
          url: data.Normal_video,
          label: 'Download Video Facebook (SD)',
        });
      }
      return {
        success: true,
        platform: 'facebook',
        title: 'Video Facebook Siap Diunduh',
        medias,
      };
    }
  } catch (err) {
    console.warn('Facebook extractor failed:', err);
  }
  return null;
}

export async function extractVideo(url: string): Promise<VideoExtractionResult> {
  const platform = detectPlatform(url);

  if (platform === 'unknown') {
    return {
      success: false,
      platform,
      title: '',
      medias: [],
      error: 'URL tidak dikenali. Masukkan link dari TikTok, Instagram, X/Twitter, Facebook, atau YouTube.',
    };
  }

  // 1. Try Twitter/X Real Engine
  if (platform === 'twitter') {
    const tw = await extractTwitter(url);
    if (tw) return tw;
  }

  // 2. Try TikTok Real Engine
  if (platform === 'tiktok') {
    const tt = await extractTikTok(url);
    if (tt) return tt;
  }

  // 3. Try YouTube Real Engine
  if (platform === 'youtube') {
    const yt = await extractYouTube(url);
    if (yt) return yt;
  }

  // 4. Try Facebook Real Engine
  if (platform === 'facebook') {
    const fb = await extractFacebook(url);
    if (fb) return fb;
  }

  // 5. Try RapidAPI if configured
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (rapidApiKey) {
    try {
      const rapidRes = await fetch(
        `https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink?url=${encodeURIComponent(url)}`,
        {
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
          },
        }
      );
      if (rapidRes.ok) {
        const data = await rapidRes.json();
        const medias = (data.medias || []).map((m: any) => ({
          quality: m.quality || 'Default',
          format: m.extension === 'mp3' ? 'mp3' : 'mp4',
          url: m.url,
          label: `${m.type?.toUpperCase() || 'Video'} (${m.quality || 'Standard'})`,
        }));

        if (medias.length > 0) {
          return {
            success: true,
            platform,
            title: data.title || `Video ${platform.toUpperCase()}`,
            author: data.author?.name || undefined,
            thumbnail: data.thumbnail || undefined,
            duration: data.duration || undefined,
            medias,
          };
        }
      }
    } catch (err) {
      console.warn('RapidAPI error:', err);
    }
  }

  // If extraction failed completely, inform the user clearly
  return {
    success: false,
    platform,
    title: '',
    medias: [],
    error: `Maaf, video dari ${platform.toUpperCase()} tidak dapat diambil. Pastikan akun tidak di-private atau link postingan valid.`,
  };
}
