import { createClient } from "@supabase/supabase-js";

const env = (import.meta as any).env || {};

// Supabase project connection (Safe to expose publishable key in frontend client)
const supabaseUrl =
  env.VITE_SUPABASE_URL || "https://awcgcpoibputqrtuvrms.supabase.co";
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_UGc-TpOB6-ONOpUNlqYFhA_XuyDiSbv";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "atelier_supabase_session",
  },
});

export default supabase;

