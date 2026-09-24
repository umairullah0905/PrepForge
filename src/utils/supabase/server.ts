import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseUrl, getSupabaseAnonKey, SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export async function createClient() {
  const cookieStore = await cookies()

  const url = getSupabaseUrl() || SUPABASE_URL;
  const key = getSupabaseAnonKey() || SUPABASE_ANON_KEY;

  return createServerClient(
    url,
    key,
    {
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        }
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
