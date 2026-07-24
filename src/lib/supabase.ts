import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (supabaseUrl && supabaseUrl.startsWith('postgresql://')) {
  const match = supabaseUrl.match(/@db\.(.+?)\.supabase\.co/);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

const hasInvalidUrl = !supabaseUrl || 
                       supabaseUrl === 'undefined' || 
                       supabaseUrl === 'null' || 
                       (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'));

const hasInvalidKey = !supabaseAnonKey || 
                       supabaseAnonKey === 'undefined' || 
                       supabaseAnonKey === 'null';

if (hasInvalidUrl) {
  supabaseUrl = 'https://placeholder-project-url-for-build.supabase.co';
}

if (hasInvalidKey) {
  supabaseAnonKey = 'placeholder-anon-key-for-build';
}

export const isPlaceholder = hasInvalidUrl || hasInvalidKey || supabaseUrl.includes('placeholder-project-url-for-build');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
