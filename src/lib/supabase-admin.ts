import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the SERVICE_ROLE key.
 * Uses lazy initialization so the build doesn't fail when the env var is missing
 * (it only throws at runtime when the client is first accessed).
 *
 * REQUIRES: SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Get it from Supabase Dashboard > Project Settings > API > service_role key.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://msypsrswdlvamjzgqgpg.supabase.co';

let _admin: SupabaseClient | null = null;

function initAdmin(): SupabaseClient {
  if (_admin) return _admin;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.\n' +
      'Get it from: Supabase Dashboard > Project Settings > API > service_role key'
    );
  }

  _admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _admin;
}

/**
 * Lazy-initialized admin client. Behaves identically to a regular SupabaseClient
 * but defers instantiation until the first `.from()`, `.auth`, `.storage`, etc. call.
 */
export const supabaseAdmin = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_target, prop) {
    const client = initAdmin();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    // Bind functions so they retain the client as `this`
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
