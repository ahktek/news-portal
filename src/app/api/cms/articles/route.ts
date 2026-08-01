import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';

/**
 * GET  /api/cms/articles — List articles for the CMS dashboard
 * POST /api/cms/articles — Create a new article (status='draft')
 *
 * All endpoints require authentication.
 */

// ─── Helpers ──────────────────────────────────────────────

/** Naive URL validation */
function isValidURL(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Strip <script> tags and event handlers. Expand as needed. */
function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
}

// ─── GET — List articles ──────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const all = searchParams.get('all') === 'true';
  const isStaff = auth.role === 'editor' || auth.role === 'admin';

  let query = supabaseAdmin
    .from('articles')
    .select('id, title, status, category, category_id, image_url, created_at, updated_at, author_user_id', { count: 'exact' });

  // Authors see only their own articles; staff can see all with ?all=true
  if (all && isStaff) {
    // No ownership filter — returns all articles
  } else {
    query = query.eq('author_user_id', auth.user.id);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order('updated_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('GET /api/cms/articles error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  return NextResponse.json({
    articles: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  });
}

// ─── POST — Create article ────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Parse body
  let body: {
    title?: string;
    content?: string;
    category_id?: string;
    image_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, content, category_id, image_url } = body;

  // Validate
  const errors: string[] = [];
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (title && title.length > 200) {
    errors.push('Title must be 200 characters or fewer');
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('Content is required');
  }
  if (!category_id) {
    errors.push('category_id is required');
  }
  if (image_url && !isValidURL(image_url)) {
    errors.push('image_url must be a valid URL');
  }

  // Verify category exists
  if (category_id) {
    const { count: catCount, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('id', category_id);

    if (catError || catCount === 0) {
      errors.push('category_id does not reference an existing category');
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
  }

  // Validation passed — extract non-null values for TS narrowing
  const validTitle = title!;
  const validContent = content!;
  const validCategoryId = category_id!;

  // Sanitize content
  const sanitizedContent = sanitizeHTML(validContent.trim());

  // Generate a slug from title (simple transliteration — expand for Bengali)
  const slug = validTitle
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100) + '-' + Date.now().toString(36);

  // Insert
  const { data, error } = await supabaseAdmin
    .from('articles')
    .insert({
      title: validTitle.trim(),
      content: sanitizedContent,
      category_id: validCategoryId,
      image_url: image_url || null,
      author_user_id: auth.user.id,
      status: 'draft',
      slug,
    })
    .select('id, title, status, category, category_id, image_url, created_at, updated_at, author_user_id')
    .single();

  if (error) {
    console.error('POST /api/cms/articles error:', error.message);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }

  return NextResponse.json({ article: data }, { status: 201 });
}
