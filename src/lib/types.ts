export type PlatformType =
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'youtube'
  | 'deviantart'
  | 'niconico'
  | 'unknown';

export interface DownloadMedia {
  quality: string;
  format: 'mp4' | 'mp3' | 'webm' | 'jpg' | 'png' | 'gif' | 'webp';
  url: string;
  size?: string;
  label?: string;
  type?: 'video' | 'image' | 'audio';
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
  isRegionLocked?: boolean;
  regionLockReason?: string;
}
