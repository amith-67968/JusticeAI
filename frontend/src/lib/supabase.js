import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error(
      'Shared sign-in is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for this app.'
    );
  }
  return supabase;
};
