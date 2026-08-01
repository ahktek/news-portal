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

  // ── Create user via signUp (sends verification email) + auto-confirm ──
  // signUp() triggers Supabase's built-in verification-email flow so the user
  // receives a confirmation link. We then call the admin API to confirm the
  // account immediately — the user can log in right away without waiting for
  // the email, but the email is still sent as a record / fallback.
  const validEmail = email!.trim().toLowerCase();
  const validDisplayName = display_name!.trim();

  const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
    email: validEmail,
    password: password!,
    options: {
      data: { display_name: validDisplayName },
    },
  });

  if (signUpError) {
    console.error('Supabase Auth signUp error:', signUpError.message);
    const alreadyExists =
      /already|registered|exists/i.test(signUpError.message);
    return NextResponse.json(
      {
        error: alreadyExists
          ? 'This email is already registered. Try logging in instead.'
          : 'Registration failed. Please try again.',
      },
      { status: 400 },
    );
  }

  if (!signUpData.user) {
    return NextResponse.json(
      { error: 'Registration failed — no user returned' },
      { status: 500 },
    );
  }

  // Auto-confirm so the user can log in immediately (the verification email
  // is still sent by signUp above — this just removes the login block).
  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
    signUpData.user.id,
    { email_confirm: true },
  );
  if (confirmError) {
    console.error('Auto-confirm error:', confirmError.message);
    // Non-fatal: the user can still verify via the email link.
  }

  // ── Insert profile into public.users ──
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: signUpData.user.id,
      email: signUpData.user.email!,
      display_name: validDisplayName,
      role: 'author',
    });

  if (profileError) {
    console.error('Profile insert error:', profileError.message);
    // Clean up: delete the auth user since profile insert failed
    await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
    return NextResponse.json(
      { error: 'Registration failed — could not create profile' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: signUpData.user.id,
        email: signUpData.user.email,
        display_name: validDisplayName,
        role: 'author',
      },
    },
    { status: 201 },
  );
}
