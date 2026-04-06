import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
  console.error('Missing VITE_SUPABASE_URL. Set it in Vercel project environment variables and redeploy.');
}
if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('Missing VITE_SUPABASE_ANON_KEY. Set it in Vercel project environment variables and redeploy.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';
