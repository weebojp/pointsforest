'use client'

import { AdminAuthProvider, useAdminAuth } from '@/lib/admin-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  BarChart3, 
  Users, 
  GamepadIcon, 
  Settings, 
  Shield, 
  LogOut, 
  Menu,
  X,
  Home,
  Coins,
  FileText,
  AlertTriangle,
  Crown,
  MessageSquare,
  TrendingUp,
  Database
} from 'lucide-react'
import Link from 'next/link'

const navigation = [
  { name: 'ダッシュボード', href: '/admin', icon: Home },
  { name: 'ユーザー管理', href: '/admin/users', icon: Users },
  { name: 'ポイント管理', href: '/admin/points', icon: Coins },
  { name: 'ゲーム管理', href: '/admin/games', icon: GamepadIcon },
  // { name: 'ガチャ管理', href: '/admin/gacha', icon: Crown }, // 法的理由により一時的に無効化
  { name: 'クエスト管理', href: '/admin/quests', icon: FileText },
  { name: 'レポート', href: '/admin/reports', icon: TrendingUp },
  { name: 'システム設定', href: '/admin/settings', icon: Settings },
]

function AdminNavigation() {
  const { admin, signOut } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ログインページの場合はナビゲーションを表示しない
  if (pathname === '/admin/login') {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'moderator': return 'bg-green-100 text-green-800'
      case 'analyst': return 'bg-purple-100 text-purple-800'
      case 'support': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'スーパー管理者'
      case 'admin': return '管理者'
      case 'moderator': return 'モデレーター'
      case 'analyst': return 'アナリスト'
      case 'support': return 'サポート'
      default: return role
    }
  }

  return (
    <>
      {/* モバイル用サイドバーオーバーレイ */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* デスクトップ用サイドバー */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>

      {/* メインコンテンツエリア */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* トップバー */}
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <button
              type="button"
              className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              {/* 管理者情報 */}
              {admin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="hidden lg:block text-left">
                        <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                        <div className="text-xs text-gray-500">{admin.email}</div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div>
                        <div className="font-medium">{admin.username}</div>
                        <div className="text-sm text-gray-600">{admin.email}</div>
                        <Badge className={`mt-1 text-xs ${getRoleColor(admin.role)}`}>
                          {getRoleLabel(admin.role)}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      プロフィール設定
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="h-4 w-4 mr-2" />
                      セキュリティ設定
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      ログアウト
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  function SidebarContent() {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Shield className="h-8 w-8 text-white" />
            <span className="ml-2 text-white text-lg font-semibold">Points Forest</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        
        {/* フッター情報 */}
        <div className="flex-shrink-0 flex bg-gray-800 p-4">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0">
              <Database className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">システム正常</p>
              <p className="text-xs text-gray-400">最終更新: 2分前</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <div className="h-screen flex overflow-hidden bg-gray-100">
        <AdminNavigation />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </AdminAuthProvider>
  )
}