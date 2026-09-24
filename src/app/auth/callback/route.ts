import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  // Resolve base domain taking Cloudflare/proxies into account (never use 0.0.0.0 or localhost)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isInvalidHost =
    !forwardedHost ||
    forwardedHost.includes('0.0.0.0') ||
    forwardedHost.includes('localhost') ||
    forwardedHost.includes('127.0.0.1')

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (!isInvalidHost && forwardedHost
      ? `https://${forwardedHost}`
      : 'https://prepforge.umair786ullah.workers.dev')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=Could not verify email or authenticate user`)
}
