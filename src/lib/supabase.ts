import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-url-for-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-build';

// Convert PostgreSQL URL if configured by mistake
if (supabaseUrl && supabaseUrl.startsWith('postgresql://')) {
  const match = supabaseUrl.match(/@db\.(.+?)\.supabase\.co/);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

// Fall back to placeholder if URL is still not a valid HTTP/HTTPS URL
if (!supabaseUrl || (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
  supabaseUrl = 'https://placeholder-project-url-for-build.supabase.co';
}

export const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                             !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                             process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('postgresql://') ||
                             (!process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http://') && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://'));

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
