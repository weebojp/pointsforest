'use client'

import { Button } from '@/components/ui/button'
import { Trees, LogOut, User, Settings, Home } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { toast } from '@/hooks/use-toast'

interface AppHeaderProps {
  currentPage?: string
  showBreadcrumb?: boolean
  breadcrumbItems?: Array<{
    label: string
    href?: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export function AppHeader({ currentPage, showBreadcrumb = false, breadcrumbItems = [] }: AppHeaderProps) {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'エラー',
        description: 'ログアウトに失敗しました。',
        variant: 'destructive'
      })
    }
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <Trees className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Points Forest</h1>
                <p className="text-sm text-gray-600">
                  ようこそ、{profile?.display_name || profile?.username}さん！
                </p>
              </div>
            </Link>
            <div className="flex space-x-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  <Trees className="h-4 w-4 mr-2" />
                  ダッシュボード
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/games">
                  <span className="h-4 w-4 mr-2">🎮</span>
                  ゲーム
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/springs">
                  <span className="h-4 w-4 mr-2">💧</span>
                  泉
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/achievements">
                  <span className="h-4 w-4 mr-2">🏆</span>
                  実績
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/leaderboard">
                  <span className="h-4 w-4 mr-2">📈</span>
                  ランキング
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  プロフィール
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  設定
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      {showBreadcrumb && breadcrumbItems.length > 0 && (
        <nav className="bg-gray-50 border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-green-600 flex items-center">
                <Home className="h-4 w-4 mr-1" />
                ダッシュボード
              </Link>
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-gray-400">›</span>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-green-600 flex items-center">
                      {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-green-600 font-medium flex items-center">
                      {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>
      )}
    </>
  )
}