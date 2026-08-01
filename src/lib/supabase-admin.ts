import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://msypsrswdlvamjzgqgpg.supabase.co';

function resolveSupabaseUrl(): string {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');

  // Handle PostgreSQL connection strings
  if (rawUrl && (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://'))) {
    const refMatch = rawUrl.match(/([a-z0-9]{20})/);
    if (refMatch?.[1]) rawUrl = `https://${refMatch[1]}.supabase.co`;
  }

  // Reject garbage values
  if (!rawUrl || rawUrl === 'undefined' || rawUrl === 'null' ||
      (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
    return DEFAULT_URL;
  }

  return rawUrl;
}

const supabaseUrl = resolveSupabaseUrl();

let _admin: SupabaseClient | null = null;
let _keyError: string | null = null;

function initAdmin(): SupabaseClient {
  if (_admin) return _admin;
  if (_keyError) throw new Error(_keyError);

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    _keyError = 'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to Vercel Environment Variables.';
    throw new Error(_keyError);
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
