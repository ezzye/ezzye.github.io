import type { MetadataRoute } from 'next';

import { PUBLIC_ORIGIN } from '@/lib/site-origin';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${PUBLIC_ORIGIN}/sitemap.xml`,
  };
}
