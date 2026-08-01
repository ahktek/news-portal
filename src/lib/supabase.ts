import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://msypsrswdlvamjzgqgpg.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zeXBzcnN3ZGx2YW1qemdxZ3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTY1NjQsImV4cCI6MjEwMDE5MjU2NH0.6eoQumKkCpKZLZ2bUHpp3Dl7j6FlzcGXDpBefsHlv44';

let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
let rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

let supabaseUrl = rawUrl;

if (supabaseUrl && (supabaseUrl.startsWith('postgresql://') || supabaseUrl.startsWith('postgres://'))) {
  const refMatch = supabaseUrl.match(/([a-z0-9]{20})/);
  if (refMatch && refMatch[1]) {
    supabaseUrl = `https://${refMatch[1]}.supabase.co`;
  }
}

const isInvalidUrl = !supabaseUrl || 
                     supabaseUrl === 'undefined' || 
                     supabaseUrl === 'null' || 
                     (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'));

const isInvalidKey = !rawKey || 
                     rawKey === 'undefined' || 
                     rawKey === 'null' ||
                     !rawKey.startsWith('eyJ') ||
                     rawKey.length < 50;

if (isInvalidUrl) {
  supabaseUrl = DEFAULT_URL;
}

const supabaseAnonKey = isInvalidKey ? DEFAULT_ANON_KEY : rawKey;

export const isPlaceholder = false;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

