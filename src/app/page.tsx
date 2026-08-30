import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-gray-900">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">Interview OS</h1>
        <p className="text-xl text-gray-600">
          The AI-powered DSA & System Design platform that teaches you the patterns, not just the answers.
        </p>

        <div className="mt-10 p-8 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
          {user ? (
            <div className="space-y-4">
              <p className="text-lg">
                Good evening 👋 <br/>
                <span className="font-semibold text-indigo-600">{user.email}</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900">Overall Readiness</h3>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">67%</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 col-span-2 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Today's Plan</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex gap-2"><span>✓</span> Arrays — Prefix Sum</li>
                    <li className="flex gap-2 text-indigo-600 font-medium"><span>→</span> Sliding Window — 5 problems</li>
                    <li className="flex gap-2"><span>→</span> System Design — Caching</li>
                  </ul>
                </div>
              </div>

              <form action={signOut} className="pt-8">
                <button type="submit" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-600">You are not logged in.</p>
              <Link 
                href="/login" 
                className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Sign In / Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
