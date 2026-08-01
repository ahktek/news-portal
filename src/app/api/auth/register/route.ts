import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

/**
 * POST /api/auth/register
 *
 * Creates a new CMS user account via Supabase Auth + public.users profile.
 *
 * Request body: { email: string, password: string, display_name: string }
 * Response 201:  { success: true, user: { id, email, display_name, role } }
 * Response 400:  { error: "validation message" }
 * Response 429:  { error: "Too many requests" }
 * Response 500:  { error: "Registration failed" }
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
  // ── Rate limiting: 5 attempts per minute per IP ──
  const ip = getClientIP(request);
  const limit = rateLimit(ip, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Try again in a minute.' },
      { status: 429 },
    );
  }

  // ── Parse and validate input ──
  let body: { email?: string; password?: string; display_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { email, password, display_name } = body;

  const errors: string[] = [];
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!display_name || typeof display_name !== 'string' || display_name.trim().length === 0) {
    errors.push('Display name is required');
  }
  if (display_name && display_name.length > 100) {
    errors.push('Display name must be 100 characters or fewer');
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
  }

  // ── Create confirmed user directly (no email verification) ──
  const validEmail = email!.trim().toLowerCase();
  const validDisplayName = display_name!.trim();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: validEmail,
    password: password!,
    email_confirm: true,
    user_metadata: { display_name: validDisplayName },
  });

  if (authError) {
    console.error('Supabase Auth createUser error:', authError.message);
    const alreadyExists =
      /already|registered|exists/i.test(authError.message);
    return NextResponse.json(
      {
        error: alreadyExists
          ? 'This email is already registered. Try logging in instead.'
          : 'Registration failed. Please try again.',
      },
      { status: 400 },
    );
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: 'Registration failed — no user returned' },
      { status: 500 },
    );
  }

  // ── Insert profile into public.users ──
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      display_name: validDisplayName,
      role: 'author',
    });

  if (profileError) {
    console.error('Profile insert error:', profileError.message);
    // Clean up: delete the auth user since profile insert failed
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: 'Registration failed — could not create profile' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        display_name: validDisplayName,
        role: 'author',
      },
    },
    { status: 201 },
  );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Register route error:', message);
    return NextResponse.json(
      { error: `Registration failed — ${message}` },
      { status: 500 },
    );
  }
}
