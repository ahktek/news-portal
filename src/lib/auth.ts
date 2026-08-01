import { supabaseAdmin } from './supabase-admin';
import { NextResponse } from 'next/server';

/**
 * Server-side authentication helpers for CMS API routes.
 *
 * AUTH MODEL: Token-based via Authorization header.
 *   - Login returns { access_token, refresh_token } in JSON.
 *   - CMS client stores the token and sends it as:
 *       Authorization: Bearer <access_token>
 *   - Protected routes extract and verify the token via supabaseAdmin.auth.getUser().
 *   - Logout is client-side (discard token); the endpoint is a no-op.
 *
 * This avoids needing @supabase/ssr or cookie-based session handling,
 * keeping the dependency footprint minimal.
 */

// ─── Types ───────────────────────────────────────────────

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  role: string; // from public.users table
}

// ─── Core helpers ─────────────────────────────────────────

/**
 * Extract and verify the Bearer token from a Request.
 * Returns the Supabase User or null if missing/invalid.
 */
export async function getSessionUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  return user;
}

/**
 * Query the public.users table for a user's CMS role.
 * Returns null if no profile row exists.
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role ?? null;
}

/**
 * Full session: Supabase user + CMS role.
 */
export async function getSession(request: Request): Promise<AuthSession | null> {
  const user = await getSessionUser(request);
  if (!user) return null;

  const role = await getUserRole(user.id);
  if (!role) return null;

  return {
    user: { id: user.id, email: user.email ?? '' },
    role,
  };
}

// ─── Route guards ─────────────────────────────────────────

/**
 * Require a valid session. Returns a 401 JSON response if unauthenticated,
 * or the AuthSession on success.
 *
 * Usage in route handlers:
 *   const auth = await requireAuth(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is AuthSession
 */
export async function requireAuth(
  request: Request,
): Promise<AuthSession | NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized — valid session required' },
      { status: 401 },
    );
  }
  return session;
}

/**
 * Require a session AND one of the specified roles.
 * Returns 401 if unauthenticated, 403 if wrong role, or AuthSession on success.
 *
 * Usage:
 *   const auth = await requireRole(request, ['editor', 'admin']);
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireRole(
  request: Request,
  roles: string[],
): Promise<AuthSession | NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized — valid session required' },
      { status: 401 },
    );
  }
  if (!roles.includes(session.role)) {
    return NextResponse.json(
      { error: `Forbidden — requires one of: ${roles.join(', ')}` },
      { status: 403 },
    );
  }
  return session;
}
