import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabaseAnonKey, SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export function createClient(
  url: string = getSupabaseUrl() || SUPABASE_URL,
  anonKey: string = getSupabaseAnonKey() || SUPABASE_ANON_KEY
) {
  return createBrowserClient(
    url,
    anonKey
  )
}
