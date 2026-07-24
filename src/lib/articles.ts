import { supabase, isPlaceholder } from './supabase'

export interface Article {
  id: string | number
  source_url: string
  title: string
  content: string
  category: 'National' | 'Politics' | 'Economics' | 'International' | 'Sports' | 'Entertainment' | 'Feature' | 'Tech'
  image_url: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface FrontendArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string[]
  publishedAt: string
  readingTime: number
  featured: boolean
  category: Category
  author: { name: string; slug: string; bio: string; avatarUrl: string }
  tags: Tag[]
  image_url?: string
}

export const categories: Category[] = [
  { id: "national", name: "জাতীয়", slug: "national", description: "সারা দেশের সব গুরুত্বপূর্ণ খবর" },
  { id: "politics", name: "রাজনীতি", slug: "politics", description: "রাজনৈতিক দল, নেতৃত্ব ও নীতিনির্ধারণী সিদ্ধান্ত" },
  { id: "economics", name: "অর্থনীতি", slug: "economics", description: "ব্যবসা, বাণিজ্য, বাজার ও সামগ্রিক অর্থনৈতিক পরিস্থিতি" },
  { id: "international", name: "আন্তর্জাতিক", slug: "international", description: "বিশ্ব রাজনীতি ও আন্তর্জাতিক অঙ্গনের ঘটনাপ্রবাহ" },
  { id: "sports", name: "খেলা", slug: "sports", description: "ক্রিকেট, ফুটবল ও অন্যান্য খেলার আপডেট ও বিশ্লেষণ" },
  { id: "entertainment", name: "বিনোদন", slug: "entertainment", description: "চলচ্চিত্র, নাটক, সঙ্গীত ও সংস্কৃতি জগতের খবরাখবর" },
  { id: "feature", name: "features", slug: "feature", description: "বিশেষ প্রতিবেদন, স্মৃতিচারণ ও দীর্ঘ বিশ্লেষণমূলক লেখা" },
  { id: "tech", name: "প্রযুক্তি", slug: "tech", description: "বিজ্ঞান, তথ্যপ্রযুক্তি ও গ্যাজেট সম্পর্কিত নতুন সংবাদ" }
]

export const tags: Tag[] = [
  { id: "1", name: "বাংলাদেশ", slug: "bangladesh" },
  { id: "2", name: "নির্বাচন", slug: "election" },
  { id: "3", name: "বাজেট", slug: "budget" },
  { id: "4", name: "মূল্যস্ফীতি", slug: "inflation" },
  { id: "5", name: "ক্রিকেট", slug: "cricket" },
  { id: "6", name: "চলচ্চিত্র", slug: "cinema" },
  { id: "7", name: "গ্রাফিতি", slug: "graffiti" },
  { id: "8", name: "জলবায়ু", slug: "climate" },
  { id: "9", name: "আইসিটি", slug: "ict" },
  { id: "10", name: "উন্নয়ন", slug: "development" }
]

const categoryMap = {
  National:      { id: 'national',      name: 'জাতীয়',       slug: 'national',      description: '' },
  Politics:      { id: 'politics',      name: 'রাজনীতি',      slug: 'politics',      description: '' },
  Economics:     { id: 'economics',     name: 'অর্থনীতি',     slug: 'economics',     description: '' },
  International: { id: 'international', name: 'আন্তর্জাতিক',  slug: 'international', description: '' },
  Sports:        { id: 'sports',        name: 'খেলা',         slug: 'sports',        description: '' },
  Entertainment: { id: 'entertainment', name: 'বিনোদন',       slug: 'entertainment', description: '' },
  Feature:       { id: 'feature',       name: 'ফিচার',        slug: 'feature',       description: '' },
  Tech:          { id: 'tech',          name: 'প্রযুক্তি',    slug: 'tech',          description: '' },
}

export function mapArticle(article: Article): FrontendArticle {
  const mappedCategory = categoryMap[article.category] || categoryMap.National;
  const wordCount = article.content ? article.content.split(/\s+/).length : 0;
  
  let imageUrl = article.image_url ? article.image_url.trim() : '';
  if (imageUrl) {
    imageUrl = imageUrl.replace(/\/article-images\/article-images\//g, '/article-images/');
  }
  const finalImageUrl = imageUrl || 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg';

  return {
    id: String(article.id),
    slug: String(article.id),
    title: article.title,
    excerpt: article.content ? article.content.slice(0, 160) : '',
    body: article.content ? article.content.split('\n').filter(Boolean) : [],
    publishedAt: article.created_at,
    readingTime: Math.ceil(wordCount / 200),
    featured: false,
    category: mappedCategory,
    author: { name: 'বাংলানিউজ ডেস্ক', slug: 'desk', bio: '', avatarUrl: '' },
    tags: [],
    image_url: finalImageUrl
  }
}

export const revalidate = 60;

export async function getArticles(category?: string, page: number = 1, pageSize: number = 10): Promise<FrontendArticle[]> {
  if (isPlaceholder) return []

  try {
    let query = supabase.from('articles').select('*')
    
    if (category) {
      query = query.ilike('category', category)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error } = await query
    if (error) {
      console.error('Supabase Error in getArticles:', error)
      return []
    }
    return (data || []).map(mapArticle)
  } catch (err) {
    console.error('Unhandled Exception in getArticles:', err)
    return []
  }
}

export async function getArticleById(id: string | number): Promise<FrontendArticle | null> {
  if (isPlaceholder) return null

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Supabase Error in getArticleById:', error)
      return null
    }
    return mapArticle(data)
  } catch (err) {
    console.error('Unhandled Exception in getArticleById:', err)
    return null
  }
}

export async function getLatestArticles(limit: number = 10): Promise<FrontendArticle[]> {
  if (isPlaceholder) return []

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Supabase Error in getLatestArticles:', error)
      return []
    }
    return (data || []).map(mapArticle)
  } catch (err) {
    console.error('Unhandled Exception in getLatestArticles:', err)
    return []
  }
}

export async function getArticlesCount(category?: string): Promise<number> {
  if (isPlaceholder) return 0

  try {
    let query = supabase.from('articles').select('id', { count: 'exact', head: true })
    
    if (category) {
      query = query.ilike('category', category)
    }
    
    const { count, error } = await query
    if (error) {
      console.error('Supabase Error in getArticlesCount:', error)
      return 0
    }
    return count || 0
  } catch (err) {
    console.error('Unhandled Exception in getArticlesCount:', err)
    return 0
  }
}

export async function searchArticles(query: string): Promise<FrontendArticle[]> {
  if (isPlaceholder) return []

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase Error in searchArticles:', error)
      return []
    }
    return (data || []).map(mapArticle)
  } catch (err) {
    console.error('Unhandled Exception in searchArticles:', err)
    return []
  }
}
