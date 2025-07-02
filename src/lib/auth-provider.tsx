'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { authMetrics } from './performance-monitor'
import { cacheHelpers, clientCache } from './cache'
import type { UserProfile } from '@/types/user'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      authMetrics.startSessionCheck()
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // プロフィール取得を並列化せず、必要な時のみ実行
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        authMetrics.endSessionCheck()
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
          // ログイン完了時にメトリクス終了
          if (event === 'SIGNED_IN') {
            authMetrics.endLogin()
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    authMetrics.startProfileFetch(userId)
    
    try {
      // キャッシュから取得を試行
      const cachedProfile = cacheHelpers.getProfile(userId) as UserProfile | null
      if (cachedProfile) {
        console.log('Profile loaded from cache:', userId)
        setProfile(cachedProfile)
        authMetrics.endProfileFetch()
        return
      }
      
      console.log('Fetching profile for user:', userId)
      
      // 最適化: すべてのフィールドを選択（型安全性のため）
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        
        // プロフィールが存在しない場合は作成を試行
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created by trigger or manually')
          // 短い遅延後に再試行
          setTimeout(() => fetchProfile(userId), 1000)
        }
        authMetrics.endProfileFetch()
        return
      }

      console.log('Profile fetched:', data)
      setProfile(data)
      
      // キャッシュに保存
      cacheHelpers.setProfile(userId, data)
      
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    } finally {
      authMetrics.endProfileFetch()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    authMetrics.startLogin()
    try {
      console.log('Attempting sign in for:', email)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        authMetrics.endLogin()
        return { error }
      } else {
        console.log('Sign in successful')
        // ログイン成功時のメトリクスは onAuthStateChange で終了
        return { error: null }
      }
    } catch (error) {
      console.error('Sign in exception:', error)
      authMetrics.endLogin()
      return { error }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('Attempting sign up for:', email, 'with username:', username)
      
      // ステップ1: Supabase Auth でユーザー作成
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          }
        }
      })

      if (error) {
        console.error('Auth sign up error:', error)
        return { error }
      }

      console.log('Auth sign up successful:', data.user?.id)

      // ステップ2: プロフィール作成を試行（手動フォールバック）
      if (data.user && !data.user.email_confirmed_at) {
        console.log('User created, email confirmation required')
        
        // メール確認が必要な場合、トリガーが後で動作する
        return { error: null }
      }

      // ステップ3: ユーザーがすでに確認済みの場合、手動でプロフィール作成
      if (data.user && data.user.email_confirmed_at) {
        await createUserProfile(data.user.id, email, username)
      }

      return { error: null }
    } catch (error) {
      console.error('Sign up exception:', error)
      return { error }
    }
  }

  const createUserProfile = async (userId: string, email: string, username: string) => {
    try {
      console.log('Creating user profile manually for:', userId)
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          username: username,
          display_name: username,
        })

      if (profileError) {
        console.error('Manual profile creation error:', profileError)
        
        // 既に存在する場合は無視
        if (profileError.code !== '23505') { // duplicate key error
          throw profileError
        } else {
          console.log('Profile already exists, continuing...')
        }
      } else {
        console.log('Manual profile creation successful')
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      // プロフィール作成エラーでも認証は成功しているので続行
    }
  }

  const signOut = async () => {
    try {
      // ログアウト前にユーザー関連のキャッシュをクリア
      if (user) {
        clientCache.clearUserCache(user.id)
      }
      
      await supabase.auth.signOut()
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}