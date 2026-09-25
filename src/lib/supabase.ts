import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")) {
    try {
      _client = createClient(supabaseUrl, supabaseAnonKey);
      return _client;
    } catch (e) {
      console.warn("Failed to initialize Supabase client:", e);
      return null;
    }
  }

  return null;
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")
);
