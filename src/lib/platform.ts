import { PlatformType } from './types';

export function detectPlatform(url: string): PlatformType {
  if (!url) return 'unknown';
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
  if (
    trimmed.includes('deviantart.com') ||
    trimmed.includes('sta.sh') ||
    trimmed.includes('fav.me')
  ) {
    return 'deviantart';
  }
  return 'unknown';
}
