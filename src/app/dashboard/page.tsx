'use client'

import { useEffect, useState, useMemo, memo } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Trees, 
  Trophy, 
  Gamepad2, 
  TrendingUp, 
  Calendar,
  Star,
  Flame,
  Gift,
  LogOut,
  HelpCircle,
  Settings,
  User,
  Droplets,
  Target,
  Package,
  Users
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { formatPoints, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'

interface DashboardStats {
  totalPoints: number
  level: number
  experience: number
  loginStreak: number
  gamesPlayedToday: number
  achievementsUnlocked: number
}

// Optimized stat card component
const StatCard = memo(({ title, value, description, icon: Icon, className = '' }: {
  title: string
  value: string | number
  description: string
  icon: any
  className?: string
}) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
))

StatCard.displayName = 'StatCard'

export default function DashboardPage() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    level: 1,
    experience: 0,
    loginStreak: 0,
    gamesPlayedToday: 0,
    achievementsUnlocked: 0
  })
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    if (!user || !profile) return

    try {
      // 即座に利用可能な統計情報を設定（プロフィールから）
      setStats({
        totalPoints: profile.points || 0,
        level: profile.level || 1,
        experience: profile.experience || 0,
        loginStreak: profile.login_streak || 0,
        gamesPlayedToday: 0, // 後で非同期取得
        achievementsUnlocked: 0 // 後で非同期取得
      })

      // デイリーボーナス状態をチェック
      const today = new Date().toISOString().split('T')[0]
      const lastBonus = profile.last_daily_bonus_at
      setDailyBonusClaimed(lastBonus ? lastBonus.startsWith(today) : false)

      // 非クリティカルなデータを非同期で取得（ページの表示を遅らせない）
      Promise.all([
        // 今日のゲーム数
        supabase
          .from('game_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // アチーブメント数
        supabase
          .from('user_achievements')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
      ]).then(([gamesResult, achievementsResult]) => {
        setStats(prev => ({
          ...prev,
          gamesPlayedToday: gamesResult.count || 0,
          achievementsUnlocked: achievementsResult.count || 0
        }))
      }).catch(error => {
        console.error('Error fetching secondary dashboard data:', error)
      })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimDailyBonus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('process_daily_bonus', {
        p_user_id: user.id
      })

      if (error) {
        toast({
          title: 'エラー',
          description: 'ボーナスの取得に失敗しました',
          variant: 'destructive'
        })
        return
      }

      if (data.success) {
        toast({
          title: '🎁 デイリーボーナス獲得！',
          description: `${data.points_earned}ポイントを獲得しました！ (ストリーク: ${data.streak}日)`
        })
        setDailyBonusClaimed(true)
        // Refresh dashboard data
        fetchDashboardData()
      } else {
        toast({
          title: '情報',
          description: data.error || '本日のボーナスは既に取得済みです',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error claiming daily bonus:', error)
      toast({
        title: 'エラー',
        description: 'ボーナスの取得に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Trees className="h-12 w-12 mx-auto text-green-600 animate-pulse mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Daily Bonus */}
        {!dailyBonusClaimed && (
          <div className="mb-8">
            <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-700">
                  <Gift className="h-5 w-5 mr-2" />
                  デイリーボーナス
                </CardTitle>
                <CardDescription>
                  ログインボーナスを受け取って、ストリークを維持しよう！
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={claimDailyBonus}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  ボーナスを受け取る
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                総ポイント
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 points-glow">
                {formatPoints(stats.totalPoints)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                レベル
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.level}
              </div>
              <p className="text-xs text-gray-500">
                経験値: {formatPoints(stats.experience)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Flame className="h-4 w-4 mr-1" />
                ログインストリーク
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.loginStreak}日
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                アチーブメント
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.achievementsUnlocked}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-6 mb-8">
          <Card className="game-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gamepad2 className="h-5 w-5 mr-2 text-green-600" />
                ゲームをプレイ
              </CardTitle>
              <CardDescription>
                ミニゲームでポイントを獲得しよう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full forest-gradient text-white">
                <Link href="/games">
                  ゲーム一覧
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="game-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                アチーブメント
              </CardTitle>
              <CardDescription>
                実績を確認して目標を設定しよう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/achievements">
                  実績を見る
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="game-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                リーダーボード
              </CardTitle>
              <CardDescription>
                他のプレイヤーと順位を競おう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/leaderboard">
                  ランキング
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="game-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                クエスト
              </CardTitle>
              <CardDescription>
                デイリーミッションをクリアしてポイントを稼ごう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/quests">
                  クエストを見る
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* ガチャ機能は法的理由により一時的に無効化
          <Card className="game-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-pink-600" />
                ガチャ
              </CardTitle>
              <CardDescription>
                運試しでレアアイテムを手に入れよう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                <Link href="/gacha">
                  ガチャを引く
                </Link>
              </Button>
            </CardContent>
          </Card>
          */}

          <Card className="game-card-hover spring-container">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Droplets className="h-5 w-5 mr-2 text-blue-600" />
                ラッキースプリング
              </CardTitle>
              <CardDescription>
                神秘的な泉を訪れて運命の恵みを受け取ろう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                <Link href="/springs">
                  泉を訪れる
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="game-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                ソーシャル
              </CardTitle>
              <CardDescription>
                フレンドと交流してギルドに参加しよう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                <Link href="/social">
                  コミュニティ
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              今日の活動
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Gamepad2 className="h-4 w-4 mr-3 text-green-600" />
                  <span>ゲームプレイ回数</span>
                </div>
                <span className="font-semibold">{stats.gamesPlayedToday}回</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Flame className="h-4 w-4 mr-3 text-orange-600" />
                  <span>ログインストリーク</span>
                </div>
                <span className="font-semibold">{stats.loginStreak}日連続</span>
              </div>

              {dailyBonusClaimed && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Gift className="h-4 w-4 mr-3 text-green-600" />
                    <span>デイリーボーナス</span>
                  </div>
                  <span className="font-semibold text-green-600">受取済み</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}