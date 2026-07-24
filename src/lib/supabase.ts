import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://msypsrswdlvamjzgqgpg.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zeXBzcnN3ZGx2YW1qemdxZ3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTY1NjQsImV4cCI6MjEwMDE5MjU2NH0.6eoQumKkCpKZLZ2bUHpp3Dl7j6FlzcGXDpBefsHlv44';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (supabaseUrl && supabaseUrl.startsWith('postgresql://')) {
  const match = supabaseUrl.match(/@db\.(.+?)\.supabase\.co/);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

const isInvalidUrl = !supabaseUrl || 
                     supabaseUrl === 'undefined' || 
                     supabaseUrl === 'null' || 
                     (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'));

const isInvalidKey = !supabaseAnonKey || 
                     supabaseAnonKey === 'undefined' || 
                     supabaseAnonKey === 'null';

if (isInvalidUrl) {
  supabaseUrl = DEFAULT_URL;
}

if (isInvalidKey) {
  supabaseAnonKey = DEFAULT_ANON_KEY;
}

export const isPlaceholder = false;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
