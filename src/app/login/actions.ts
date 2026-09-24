'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in production, you should validate this data with Zod
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message || 'Could not authenticate user'))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()

  if (!name) {
    redirect('/login?message=Please enter your name')
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Always use the public deployed domain for auth callbacks (prevents 0.0.0.0 / localhost redirects on mobile)
  const origin =
    process.env.NEXT_PUBLIC_APP_URL || 'https://prepforge.umair786ullah.workers.dev'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message || 'Could not create user'))
  }

  // If email confirmation is required, notify user to check email
  if (data?.user && !data?.session) {
    redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account.'))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}