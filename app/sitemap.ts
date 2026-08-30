import type { MetadataRoute } from 'next';

import { getPublicRepairs } from '@/db/queries';
import { PUBLIC_ORIGIN } from '@/lib/site-origin';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repairs = await getPublicRepairs();
  const pages = [
    '',
    '/repairs',
    '/outcomes',
    '/start',
    '/covenant',
    '/appeal',
    '/privacy',
    '/accessibility',
    '/archive',
  ];
  return [
    ...pages.map((path) => ({
      url: `${PUBLIC_ORIGIN}${path}`,
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.7,
    })),
    ...repairs.map((repair) => ({
      url: `${PUBLIC_ORIGIN}/repairs/${repair.slug}`,
      lastModified: new Date(repair.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ];
}
