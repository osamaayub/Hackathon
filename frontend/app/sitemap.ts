import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Events, projects and the leaderboard need a signed-in session, so only the public pages are listed.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [path: string, changeFrequency: 'daily' | 'weekly' | 'monthly', priority: number][] = [
    ['', 'daily', 1],
    ['/features', 'monthly', 0.7],
    ['/resources', 'monthly', 0.7],
    ['/faq', 'monthly', 0.6],
    ['/about', 'monthly', 0.5],
    ['/sponsors', 'monthly', 0.5],
    ['/contact', 'monthly', 0.4],
  ];
  return pages.map(([path, changeFrequency, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency, priority }));
}
