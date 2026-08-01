import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';

/**
 * GET    /api/cms/articles/[id] — Fetch a single article
 * PATCH  /api/cms/articles/[id] — Update an article
 * DELETE /api/cms/articles/[id] — Soft-delete (status → 'archived')
 *
 * Ownership rules:
 *   - Authors can only access/modify their own articles
 *   - Editors and admins can access/modify any article
 */

// ─── Helpers ──────────────────────────────────────────────

async function getArticleOrDeny(
  articleId: string,
  userId: string,
  userRole: string,
) {
  const { data: article, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (error || !article) return { article: null, response: NextResponse.json({ error: 'Article not found' }, { status: 404 }) };

  // Staff can access any article
  if (userRole === 'editor' || userRole === 'admin') {
    return { article, response: null };
  }

  // Authors can only access their own
  if (article.author_user_id !== userId) {
    return { article: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { article, response: null };
}

function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
}

function isValidURL(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── GET — Fetch single article ───────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { article, response } = await getArticleOrDeny(id, auth.user.id, auth.role);
  if (response) return response;

  return NextResponse.json({ article });
}

// ─── PATCH — Update article ───────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { article: existing, response } = await getArticleOrDeny(id, auth.user.id, auth.role);
  if (response) return response;

  // Parse update body
  let body: {
    title?: string;
    content?: string;
    category_id?: string;
    image_url?: string;
    status?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  const errors: string[] = [];

  // Title
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    } else if (body.title.length > 200) {
      errors.push('Title must be 200 characters or fewer');
    } else {
      updates.title = body.title.trim();
    }
  }

  // Content
  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      errors.push('Content cannot be empty');
    } else {
      updates.content = sanitizeHTML(body.content.trim());
    }
  }

  // Category
  if (body.category_id !== undefined) {
    const { count, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('id', body.category_id);

    if (catError || count === 0) {
      errors.push('category_id does not reference an existing category');
    } else {
      updates.category_id = body.category_id;
    }
  }

  // Image URL
  if (body.image_url !== undefined) {
    if (body.image_url === '' || body.image_url === null) {
      updates.image_url = null;
    } else if (isValidURL(body.image_url)) {
      updates.image_url = body.image_url;
    } else {
      errors.push('image_url must be a valid URL or empty');
    }
  }

  // Status — only editors/admins can change status to published
  if (body.status !== undefined) {
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(body.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    } else if (body.status === 'published' && auth.role === 'author') {
      errors.push('Only editors and admins can publish articles');
    } else {
      updates.status = body.status;
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // updated_at is auto-set by the DB trigger (trg_articles_updated_at)
  const { data, error } = await supabaseAdmin
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('PATCH article error:', error.message);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }

  return NextResponse.json({ article: data });
}

// ─── DELETE — Soft-delete (archive) ───────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { article: existing, response } = await getArticleOrDeny(id, auth.user.id, auth.role);
  if (response) return response;

  // Soft-delete: set status to 'archived'
  const { error } = await supabaseAdmin
    .from('articles')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    console.error('DELETE article error:', error.message);
    return NextResponse.json({ error: 'Failed to archive article' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Article archived' });
}
