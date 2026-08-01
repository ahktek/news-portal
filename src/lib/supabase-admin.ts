import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://msypsrswdlvamjzgqgpg.supabase.co';

let _admin: SupabaseClient | null = null;
let _keyMissing = false;

function initAdmin(): SupabaseClient {
  if (_admin) return _admin;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    if (!_keyMissing) {
      console.error(
        'SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
        'Add it to .env.local (local) or Vercel Environment Variables (production).\n' +
        'Get it from: Supabase Dashboard > Project Settings > API > service_role key'
      );
      _keyMissing = true;
    }
    // Return a stub that throws on every method call with a clear message.
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
      'Auth & CMS API routes cannot function without it.'
    );
  }

  _admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _admin;
}

export const supabaseAdmin = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_target, prop) {
    const client = initAdmin();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
});
