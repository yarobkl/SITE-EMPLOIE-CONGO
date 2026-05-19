import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const tables = {
  profiles: 'profiles',
  companies: 'companies',
  jobs: 'jobs',
  applications: 'applications',
  savedJobs: 'saved_jobs',
  notifications: 'notifications',
};
