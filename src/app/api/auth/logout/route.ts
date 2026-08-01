import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 *
 * Stateless logout — the server simply acknowledges.
 * The CMS client is responsible for discarding the access_token
 * from its storage (localStorage / sessionStorage).
 *
 * This endpoint exists to provide a consistent auth API surface
 * and can be extended later for server-side session invalidation
 * (e.g., adding tokens to a blocklist).
 */
export async function POST() {
  return NextResponse.json({ success: true });
}
