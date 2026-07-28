import { MetadataRoute } from 'next';
import { getArticles } from '@/lib/articles';

const BASE_URL = 'https://tangentnews.vercel.app';

const staticPages: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    changeFrequency: 'hourly',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/search`,
    changeFrequency: 'weekly',
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/author/desk`,
    changeFrequency: 'weekly',
    priority: 0.6,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const articles = await getArticles(undefined, 1, 999);

    const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${BASE_URL}/article/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...articleEntries];
  } catch (error) {
    console.error('Failed to generate sitemap articles:', error);
    return staticPages;
  }
}
