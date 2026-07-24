import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-url-for-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-build';

if (supabaseUrl && supabaseUrl.startsWith('postgresql://')) {
  const match = supabaseUrl.match(/@db\.(.+?)\.supabase\.co/);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

export const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseUrl.includes('placeholder-project-url-for-build');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
