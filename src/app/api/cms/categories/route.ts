import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/cms/categories
 *
 * Returns all categories for the CMS category picker dropdown.
 * This endpoint is public within the CMS context (no auth required)
 * because the category list is needed on the login page for display
 * and the CMS article editor needs it without additional auth overhead.
 *
 * Response: { categories: [{ id, name, slug, description }] }
 */
export async function GET(_request: NextRequest) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, description')
    .order('name');

  if (error) {
    console.error('GET /api/cms/categories error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  return NextResponse.json({ categories: data || [] });
}
