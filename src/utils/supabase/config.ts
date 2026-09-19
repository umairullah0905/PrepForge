export function getSupabaseUrl(): string {
  const url =
    process.env.SUPABASE_URL ||
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ||
    "";
  return url.trim();
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
    "";
  return key.trim();
}

// Dynamic fallbacks evaluated at runtime
export const SUPABASE_URL = getSupabaseUrl() || "https://placeholder-build.supabase.co";
export const SUPABASE_ANON_KEY = getSupabaseAnonKey() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";
