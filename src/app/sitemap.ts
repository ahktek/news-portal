import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://tangentnews.vercel.app';

export const revalidate = 3600;

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
    const { data, error } = await supabase
      .from('articles')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const articleEntries: MetadataRoute.Sitemap = (data || []).map((article: { id: string | number; created_at: string }) => ({
      url: `${BASE_URL}/article/${String(article.id)}`,
      lastModified: article.created_at,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...articleEntries];
  } catch (error) {
    console.error('Failed to generate sitemap articles:', error);
    return staticPages;
  }
}
