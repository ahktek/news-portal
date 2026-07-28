import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/feed.xml'],
    },
    sitemap: 'https://tangentnews.vercel.app/sitemap.xml',
  };
}
