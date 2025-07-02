'use client'

import { useEffect, useState } from 'react'
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
  LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { formatPoints, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface DashboardStats {
  totalPoints: number
  level: number
  experience: number
  loginStreak: number
  gamesPlayedToday: number
  achievementsUnlocked: number
}

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
    if (!user) return

    try {
      // Fetch user profile with current stats
      if (profile) {
        setStats({
          totalPoints: profile.points,
          level: profile.level,
          experience: profile.experience,
          loginStreak: profile.login_streak,
          gamesPlayedToday: 0, // Will fetch separately
          achievementsUnlocked: 0 // Will fetch separately
        })

        // Check if daily bonus was claimed today
        const today = new Date().toISOString().split('T')[0]
        const lastBonus = profile.last_daily_bonus_at
        setDailyBonusClaimed(lastBonus?.startsWith(today) || false)
      }

      // Fetch games played today
      const { data: gamesToday } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0])

      // Fetch achievements unlocked
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)

      setStats(prev => ({
        ...prev,
        gamesPlayedToday: gamesToday?.length || 0,
        achievementsUnlocked: achievements?.length || 0
      }))

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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trees className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Points Forest</h1>
                <p className="text-sm text-gray-600">
                  ようこそ、{profile?.display_name || profile?.username}さん！
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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