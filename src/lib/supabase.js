import { createClient } from '@supabase/supabase-js';

const cleanEnv = (value) => (typeof value === 'string' ? value.trim() : value);

// Public client configuration for the congoemploi Supabase project.
// These values are safe to ship to the browser: database access remains protected by RLS.
// Vercel environment variables still take precedence when configured.
const DEFAULT_SUPABASE_URL = 'https://sikyglaexfkbwzjmqjxf.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yyXcdXCaHoXob7IiZKlwmw_nsEz5hcj';

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

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
  locations: 'locations',
  candidateProfiles: 'candidate_profiles',
  jobSeekerPosts: 'job_seeker_posts',
  recruiterVerifications: 'recruiter_verifications',
  jobMatches: 'job_matches',
  talentInvitations: 'talent_invitations',
};
