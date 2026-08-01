import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

/**
 * POST /api/auth/login
 *
 * Authenticates a user via Supabase Auth and returns session tokens + CMS role.
 *
 * Request body:  { email: string, password: string }
 * Response 200:  { success: true, session: { access_token, refresh_token, expires_in }, user: { id, email, role } }
 * Response 400:  { error: "Invalid credentials" }
 * Response 429:  { error: "Too many requests" }
 */

export async function POST(request: NextRequest) {
  try {
  // ── Rate limiting: 5 attempts per minute per IP ──
  const ip = getClientIP(request);
  const limit = rateLimit(ip, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in a minute.' },
      { status: 429 },
    );
  }

  // ── Parse input ──
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  // ── Authenticate ──
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.session) {
    console.error('Login error:', error?.message);
    // Surface the most common post-signup failure clearly
    const msg = error?.message?.toLowerCase() ?? '';
    if (msg.includes('email not confirmed')) {
      return NextResponse.json(
        {
          error:
            'Email not confirmed. Check your inbox, or ask an admin to confirm the account in Supabase Auth.',
        },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 },
    );
  }

  // ── Fetch CMS role from public.users ──
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  return NextResponse.json({
    success: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    },
    user: {
      id: data.user.id,
      email: data.user.email,
      role: profile?.role ?? 'author',
    },
  });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Login route error:', message);
    return NextResponse.json(
      { error: 'Login failed — server configuration error.' },
      { status: 500 },
    );
  }
}
