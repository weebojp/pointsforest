import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// URLの末尾のスラッシュを削除
const cleanUrl = supabaseUrl.replace(/\/$/, '')

console.log('Initializing Supabase with URL:', cleanUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

export const supabase = createClient<Database>(cleanUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'points-forest',
    },
  },
})

// Test connection on initialization
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Supabase initialization error:', error)
    } else {
      console.log('Supabase initialized successfully')
    }
  })
}

// Server-side Supabase client for API routes
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    cleanUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}