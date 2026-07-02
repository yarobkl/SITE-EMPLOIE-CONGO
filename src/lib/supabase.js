import { createClient } from '@supabase/supabase-js';

const cleanEnv = (value) => (typeof value === 'string' ? value.trim() : value);

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-application-name': 'congoemploi',
        },
      },
    })
  : null;

export const supabaseProjectHost = (() => {
  try {
    return hasSupabaseConfig ? new URL(supabaseUrl).host : '';
  } catch {
    return '';
  }
})();

export const tables = {
  profiles: 'profiles',
  companies: 'companies',
  jobs: 'jobs',
  applications: 'applications',
  savedJobs: 'saved_jobs',
  notifications: 'notifications',
};
