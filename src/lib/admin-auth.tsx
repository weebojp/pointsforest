'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email: string
  username: string
  role: 'super_admin' | 'admin' | 'moderator' | 'analyst' | 'support'
  permissions: Record<string, boolean>
  two_factor_enabled: boolean
  last_login_at: string | null
  is_active: boolean
}

interface AdminAuthContextType {
  admin: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string, twoFactorCode?: string) => Promise<{ success: boolean; error?: string; requiresTwoFactor?: boolean }>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  canAccess: (resource: string, action: string) => boolean
  refreshProfile: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

// 権限定義
const ROLE_PERMISSIONS = {
  super_admin: [
    'users.view', 'users.edit', 'users.delete', 'users.create',
    'games.view', 'games.edit', 'games.configure',
    'gacha.view', 'gacha.edit', 'gacha.configure',
    'points.view', 'points.edit', 'points.adjust',
    'analytics.view', 'analytics.export',
    'system.view', 'system.configure', 'system.backup',
    'admin.view', 'admin.create', 'admin.edit', 'admin.delete',
    'audit.view', 'audit.export'
  ],
  admin: [
    'users.view', 'users.edit', 'users.create',
    'games.view', 'games.edit', 'games.configure',
    'gacha.view', 'gacha.edit', 'gacha.configure',
    'points.view', 'points.edit', 'points.adjust',
    'analytics.view', 'analytics.export',
    'system.view', 'system.configure',
    'audit.view'
  ],
  moderator: [
    'users.view', 'users.edit',
    'games.view', 'games.edit',
    'gacha.view', 'gacha.edit',
    'points.view', 'points.adjust',
    'analytics.view',
    'audit.view'
  ],
  analyst: [
    'users.view',
    'games.view',
    'gacha.view',
    'points.view',
    'analytics.view', 'analytics.export'
  ],
  support: [
    'users.view', 'users.edit',
    'points.view', 'points.adjust',
    'analytics.view'
  ]
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminSession()
  }, [])

  const checkAdminSession = async () => {
    try {
      // セッショントークンをlocalStorageから取得
      const sessionToken = localStorage.getItem('admin_session_token')
      
      if (!sessionToken) {
        setLoading(false)
        return
      }

      // セッション検証
      const { data, error } = await supabase.rpc('verify_admin_session', {
        session_token: sessionToken
      })

      if (error || !data) {
        localStorage.removeItem('admin_session_token')
        setLoading(false)
        return
      }

      setAdmin(data)
    } catch (error) {
      console.error('Admin session check error:', error)
      localStorage.removeItem('admin_session_token')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_sign_in', {
        p_email: email,
        p_password: password,
        p_two_factor_code: twoFactorCode
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.requires_two_factor && !twoFactorCode) {
        return { success: false, requiresTwoFactor: true }
      }

      if (data.success) {
        // セッショントークンを保存
        localStorage.setItem('admin_session_token', data.session_token)
        
        // 管理者情報を設定
        setAdmin(data.admin_user)
        
        // ログイン成功をログに記録
        await logAdminAction('admin_login', 'session', null, {
          login_method: twoFactorCode ? '2fa' : 'password'
        })

        return { success: true }
      }

      return { success: false, error: data.error || 'ログインに失敗しました' }
    } catch (error) {
      console.error('Admin sign in error:', error)
      return { success: false, error: 'システムエラーが発生しました' }
    }
  }

  const signOut = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token')
      
      if (sessionToken) {
        // セッションを無効化
        await supabase.rpc('admin_sign_out', {
          session_token: sessionToken
        })
        
        // ログアウトをログに記録
        await logAdminAction('admin_logout', 'session')
      }
      
      localStorage.removeItem('admin_session_token')
      setAdmin(null)
      router.push('/admin/login')
    } catch (error) {
      console.error('Admin sign out error:', error)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false
    
    const rolePermissions = ROLE_PERMISSIONS[admin.role] || []
    return rolePermissions.includes(permission) || admin.permissions[permission] === true
  }

  const canAccess = (resource: string, action: string): boolean => {
    return hasPermission(`${resource}.${action}`)
  }

  const refreshProfile = async () => {
    if (!admin) return
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', admin.id)
        .single()

      if (!error && data) {
        setAdmin(data)
      }
    } catch (error) {
      console.error('Admin profile refresh error:', error)
    }
  }

  const logAdminAction = async (
    action: string,
    targetType: string,
    targetId?: string | null,
    metadata?: Record<string, any>
  ) => {
    try {
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: admin?.id,
        action,
        target_type: targetType,
        target_id: targetId,
        new_values: metadata,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      })
    } catch (error) {
      console.error('Failed to log admin action:', error)
    }
  }

  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return null
    }
  }

  const value = {
    admin,
    loading,
    signIn,
    signOut,
    hasPermission,
    canAccess,
    refreshProfile
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

// 管理者権限チェック用HOC
export function withAdminAuth<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermission?: string
) {
  return function AdminProtectedComponent(props: T) {
    const { admin, loading, hasPermission } = useAdminAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!admin) {
          router.push('/admin/login')
          return
        }
        
        if (requiredPermission && !hasPermission(requiredPermission)) {
          router.push('/admin/unauthorized')
          return
        }
      }
    }, [admin, loading, hasPermission, router])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!admin) {
      return null
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return null
    }

    return <Component {...props} />
  }
}

// 権限チェック用フック
export function useAdminPermission(permission: string) {
  const { hasPermission } = useAdminAuth()
  return hasPermission(permission)
}

// 複数権限チェック用フック
export function useAdminPermissions(permissions: string[]) {
  const { hasPermission } = useAdminAuth()
  return permissions.every(permission => hasPermission(permission))
}