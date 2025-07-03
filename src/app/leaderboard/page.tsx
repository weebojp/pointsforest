'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Trees, 
  Trophy, 
  ArrowLeft, 
  Crown, 
  Medal, 
  Star,
  TrendingUp,
  Calendar,
  Gamepad2,
  Flame
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'

interface LeaderboardEntry {
  user_id: string
  username: string
  display_name: string
  value: number
  rank: number
  is_current_user?: boolean
}

interface Leaderboard {
  id: string
  name: string
  type: string
  description: string
  period_type: string
}

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([])
  const [currentLeaderboard, setCurrentLeaderboard] = useState<string>('')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchLeaderboards()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (currentLeaderboard && user) {
      fetchLeaderboardData(currentLeaderboard)
    }
  }, [currentLeaderboard, user])

  const fetchLeaderboards = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching leaderboards:', error)
        return
      }

      setLeaderboards(data || [])
      if (data && data.length > 0) {
        setCurrentLeaderboard(data[0].id)
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboardData = async (leaderboardId: string) => {
    if (!user) return

    try {
      setLoading(true)
      const leaderboard = leaderboards.find(lb => lb.id === leaderboardId)
      if (!leaderboard) return

      let rawEntries: Omit<LeaderboardEntry, 'rank' | 'is_current_user'>[] = []

      switch (leaderboard.type) {
        case 'total_points':
          rawEntries = await fetchTotalPointsLeaderboard()
          break
        case 'weekly_points':
          rawEntries = await fetchWeeklyPointsLeaderboard()
          break
        case 'monthly_games':
          rawEntries = await fetchMonthlyGamesLeaderboard()
          break
        case 'login_streak':
          rawEntries = await fetchLoginStreakLeaderboard()
          break
        default:
          console.warn('Unknown leaderboard type:', leaderboard.type)
      }

      // Add rank and mark current user
      const rankedEntries: LeaderboardEntry[] = rawEntries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        is_current_user: entry.user_id === user.id
      }))

      setEntries(rankedEntries)
      
      // Find current user's rank
      const currentUserEntry = rankedEntries.find(entry => entry.is_current_user)
      setUserRank(currentUserEntry?.rank || null)

    } catch (error) {
      console.error('Error fetching leaderboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTotalPointsLeaderboard = async (): Promise<Omit<LeaderboardEntry, 'rank' | 'is_current_user'>[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, points')
      .order('points', { ascending: false })
      .limit(100)

    if (error) throw error

    return (data || []).map(user => ({
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      value: user.points
    }))
  }

  const fetchWeeklyPointsLeaderboard = async (): Promise<Omit<LeaderboardEntry, 'rank' | 'is_current_user'>[]> => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('point_transactions')
      .select(`
        user_id,
        amount,
        users:user_id(username, display_name)
      `)
      .gte('created_at', weekStart.toISOString())
      .eq('type', 'earn')

    if (error) throw error

    // Aggregate weekly points by user
    const userPoints = new Map()
    data?.forEach(transaction => {
      const userId = transaction.user_id
      const currentTotal = userPoints.get(userId) || { amount: 0, user: null }
      userPoints.set(userId, {
        amount: currentTotal.amount + transaction.amount,
        user: transaction.users
      })
    })

    return Array.from(userPoints.entries())
      .map(([user_id, data]) => ({
        user_id,
        username: data.user?.username || 'Unknown',
        display_name: data.user?.display_name || 'Unknown User',
        value: data.amount
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 100)
  }

  const fetchMonthlyGamesLeaderboard = async (): Promise<Omit<LeaderboardEntry, 'rank' | 'is_current_user'>[]> => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        user_id,
        users:user_id(username, display_name)
      `)
      .gte('created_at', monthStart.toISOString())

    if (error) throw error

    // Count games by user
    const userGames = new Map()
    data?.forEach(session => {
      const userId = session.user_id
      const current = userGames.get(userId) || { count: 0, user: null }
      userGames.set(userId, {
        count: current.count + 1,
        user: session.users
      })
    })

    return Array.from(userGames.entries())
      .map(([user_id, data]) => ({
        user_id,
        username: data.user?.username || 'Unknown',
        display_name: data.user?.display_name || 'Unknown User',
        value: data.count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 100)
  }

  const fetchLoginStreakLeaderboard = async (): Promise<Omit<LeaderboardEntry, 'rank' | 'is_current_user'>[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, login_streak')
      .order('login_streak', { ascending: false })
      .limit(100)

    if (error) throw error

    return (data || []).map(user => ({
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      value: user.login_streak
    }))
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    }
  }

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'total_points':
      case 'weekly_points':
        return `${value.toLocaleString()}pt`
      case 'monthly_games':
        return `${value}回`
      case 'login_streak':
        return `${value}日`
      default:
        return value.toString()
    }
  }

  const currentLeaderboardData = leaderboards.find(lb => lb.id === currentLeaderboard)

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
      <AppHeader 
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'リーダーボード', icon: TrendingUp }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* User's current rank card */}
        {userRank && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">あなたの順位</h3>
                    <p className="text-blue-700">
                      {currentLeaderboardData?.name}で第{userRank}位
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">#{userRank}</div>
                  <p className="text-sm text-blue-600">
                    {entries.find(e => e.is_current_user) && 
                     formatValue(entries.find(e => e.is_current_user)!.value, currentLeaderboardData?.type || '')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Tabs */}
        <Tabs value={currentLeaderboard} onValueChange={setCurrentLeaderboard} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {leaderboards.map(leaderboard => (
              <TabsTrigger key={leaderboard.id} value={leaderboard.id}>
                {leaderboard.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {leaderboards.map(leaderboard => (
            <TabsContent key={leaderboard.id} value={leaderboard.id} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                    {leaderboard.name}
                  </CardTitle>
                  <CardDescription>{leaderboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {entries.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">まだランキングデータがありません</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {entries.slice(0, 10).map((entry, index) => (
                        <div
                          key={entry.user_id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            entry.is_current_user 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12">
                              {getRankIcon(entry.rank)}
                            </div>
                            <Avatar>
                              <AvatarFallback>
                                {entry.display_name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">
                                {entry.display_name || entry.username}
                              </h4>
                              <p className="text-sm text-gray-600">@{entry.username}</p>
                            </div>
                            {entry.is_current_user && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                あなた
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatValue(entry.value, leaderboard.type)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Information Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ランキングについて</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🏆 ランキングの種類</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>総合ポイント</strong>: 累計獲得ポイント数</li>
                  <li>• <strong>今週のポイント</strong>: 今週獲得したポイント数</li>
                  <li>• <strong>今月のゲーマー</strong>: 今月プレイしたゲーム数</li>
                  <li>• <strong>ログインストリーク</strong>: 連続ログイン日数</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📅 更新タイミング</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 総合ポイント: リアルタイム更新</li>
                  <li>• 今週のポイント: 毎週月曜日リセット</li>
                  <li>• 今月のゲーマー: 毎月1日リセット</li>
                  <li>• ログインストリーク: 毎日更新</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}