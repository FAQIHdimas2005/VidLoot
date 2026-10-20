import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unduhcepat.vercel.app';
  const lastModified = new Date();

  const routes = [
    '',
    '/tiktok-downloader',
    '/instagram-downloader',
    '/x-downloader',
    '/facebook-downloader',
    '/youtube-downloader',
    '/dmca',
    '/privacy-policy',
    '/terms-of-service',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.endsWith('-downloader') ? 0.9 : 0.4,
  }));
}
