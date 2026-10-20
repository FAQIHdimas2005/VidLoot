export type PlatformType =
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'youtube'
  | 'unknown';

export interface DownloadMedia {
  quality: string;
  format: 'mp4' | 'mp3' | 'webm';
  url: string;
  size?: string;
  label?: string;
}

export interface VideoExtractionResult {
  success: boolean;
  platform: PlatformType;
  title: string;
  author?: string;
  thumbnail?: string;
  duration?: string;
  medias: DownloadMedia[];
  error?: string;
}
