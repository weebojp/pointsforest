'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker-range'
import { supabase } from '@/lib/supabase'
import { formatPoints } from '@/lib/utils'
import { Download, TrendingUp, Users, Gamepad2, Crown, FileText, Calendar, BarChart3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'

interface ReportData {
  user_stats: {
    total_users: number
    new_users_period: number
    active_users_period: number
    retention_rate: number
  }
  game_stats: {
    total_sessions: number
    total_games_played: number
    most_popular_game: string
    average_session_duration: number
  }
  point_stats: {
    total_points_distributed: number
    total_points_spent: number
    points_in_circulation: number
    average_points_per_user: number
  }
  quest_stats: {
    total_quests_completed: number
    quest_completion_rate: number
    most_popular_quest_type: string
    total_rewards_distributed: number
  }
  gacha_stats: {
    total_pulls: number
    total_revenue: number
    most_popular_machine: string
    total_items_distributed: number
  }
}

export default function ReportsPage() {
  const { admin, loading } = useAdminAuth()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  })

  useEffect(() => {
    if (admin && !loading) {
      fetchReportData()
    }
  }, [admin, loading, selectedPeriod, dateRange])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      
      // 複数のレポートデータを並行取得
      const [userStats, gameStats, pointStats, questStats, gachaStats] = await Promise.allSettled([
        fetchUserStats(),
        fetchGameStats(),
        fetchPointStats(),
        fetchQuestStats(),
        fetchGachaStats()
      ])

      setReportData({
        user_stats: userStats.status === 'fulfilled' ? userStats.value : getDefaultUserStats(),
        game_stats: gameStats.status === 'fulfilled' ? gameStats.value : getDefaultGameStats(),
        point_stats: pointStats.status === 'fulfilled' ? pointStats.value : getDefaultPointStats(),
        quest_stats: questStats.status === 'fulfilled' ? questStats.value : getDefaultQuestStats(),
        gacha_stats: gachaStats.status === 'fulfilled' ? gachaStats.value : getDefaultGachaStats()
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('レポートデータの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserStats = async () => {
    const { data: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' })

    const { data: newUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .gte('created_at', dateRange?.from?.toISOString())
      .lte('created_at', dateRange?.to?.toISOString())

    const { data: activeUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .gte('last_login_at', dateRange?.from?.toISOString())
      .lte('last_login_at', dateRange?.to?.toISOString())

    return {
      total_users: totalUsers?.length || 0,
      new_users_period: newUsers?.length || 0,
      active_users_period: activeUsers?.length || 0,
      retention_rate: totalUsers?.length ? ((activeUsers?.length || 0) / totalUsers.length) * 100 : 0
    }
  }

  const fetchGameStats = async () => {
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select(`
        *,
        games(name)
      `)
      .gte('created_at', dateRange?.from?.toISOString())
      .lte('created_at', dateRange?.to?.toISOString())

    if (!sessions) return getDefaultGameStats()

    const gamePlayCounts = sessions.reduce((acc: Record<string, number>, session: any) => {
      const gameName = session.games?.name || 'Unknown'
      acc[gameName] = (acc[gameName] || 0) + 1
      return acc
    }, {})

    const mostPopular = Object.entries(gamePlayCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    const averageDuration = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length 
      : 0

    return {
      total_sessions: sessions.length,
      total_games_played: sessions.length,
      most_popular_game: mostPopular,
      average_session_duration: averageDuration
    }
  }

  const fetchPointStats = async () => {
    const { data: transactions } = await supabase
      .from('point_transactions')
      .select('amount, type')
      .gte('created_at', dateRange?.from?.toISOString())
      .lte('created_at', dateRange?.to?.toISOString())

    const { data: users } = await supabase
      .from('users')
      .select('points')

    if (!transactions) return getDefaultPointStats()

    const distributed = transactions
      .filter(t => ['earn', 'bonus'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0)

    const spent = transactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const totalInCirculation = users?.reduce((sum, u) => sum + (u.points || 0), 0) || 0
    const averagePerUser = users?.length ? totalInCirculation / users.length : 0

    return {
      total_points_distributed: distributed,
      total_points_spent: spent,
      points_in_circulation: totalInCirculation,
      average_points_per_user: averagePerUser
    }
  }

  const fetchQuestStats = async () => {
    const { data: completions } = await supabase
      .from('quest_completions')
      .select(`
        *,
        user_quests(
          quest_templates(type)
        )
      `)
      .gte('completed_at', dateRange?.from?.toISOString())
      .lte('completed_at', dateRange?.to?.toISOString())

    const { data: userQuests } = await supabase
      .from('user_quests')
      .select('id')
      .gte('created_at', dateRange?.from?.toISOString())
      .lte('created_at', dateRange?.to?.toISOString())

    if (!completions) return getDefaultQuestStats()

    const questTypes = completions.reduce((acc: Record<string, number>, completion: any) => {
      const type = completion.user_quests?.quest_templates?.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const mostPopularType = Object.entries(questTypes).sort(([,a], [,b]) => b - a)[0]?.[0] || 'daily'
    const completionRate = userQuests?.length ? (completions.length / userQuests.length) * 100 : 0

    return {
      total_quests_completed: completions.length,
      quest_completion_rate: completionRate,
      most_popular_quest_type: mostPopularType,
      total_rewards_distributed: 0 // TODO: Calculate from rewards_claimed
    }
  }

  const fetchGachaStats = async () => {
    const { data: pulls } = await supabase
      .from('gacha_pulls')
      .select(`
        *,
        gacha_machines(name)
      `)
      .gte('created_at', dateRange?.from?.toISOString())
      .lte('created_at', dateRange?.to?.toISOString())

    if (!pulls) return getDefaultGachaStats()

    const machineCounts = pulls.reduce((acc: Record<string, number>, pull: any) => {
      const machineName = pull.gacha_machines?.name || 'Unknown'
      acc[machineName] = (acc[machineName] || 0) + 1
      return acc
    }, {})

    const mostPopular = Object.entries(machineCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    const totalRevenue = pulls.reduce((sum, pull) => sum + (pull.cost_paid || 0), 0)
    const totalItems = pulls.reduce((sum, pull) => sum + (pull.pull_count || 0), 0)

    return {
      total_pulls: pulls.length,
      total_revenue: totalRevenue,
      most_popular_machine: mostPopular,
      total_items_distributed: totalItems
    }
  }

  // デフォルト値関数
  const getDefaultUserStats = () => ({
    total_users: 0,
    new_users_period: 0,
    active_users_period: 0,
    retention_rate: 0
  })

  const getDefaultGameStats = () => ({
    total_sessions: 0,
    total_games_played: 0,
    most_popular_game: 'N/A',
    average_session_duration: 0
  })

  const getDefaultPointStats = () => ({
    total_points_distributed: 0,
    total_points_spent: 0,
    points_in_circulation: 0,
    average_points_per_user: 0
  })

  const getDefaultQuestStats = () => ({
    total_quests_completed: 0,
    quest_completion_rate: 0,
    most_popular_quest_type: 'daily',
    total_rewards_distributed: 0
  })

  const getDefaultGachaStats = () => ({
    total_pulls: 0,
    total_revenue: 0,
    most_popular_machine: 'N/A',
    total_items_distributed: 0
  })

  const exportToCSV = (data: any[], filename: string) => {
    try {
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header] || '').join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('CSVエクスポートに失敗しました')
    }
  }

  const exportAllReports = async () => {
    if (!reportData) return

    try {
      // 各種レポートデータをCSV形式で準備
      const userReportData = [
        {
          期間: selectedPeriod,
          総ユーザー数: reportData.user_stats.total_users,
          新規ユーザー: reportData.user_stats.new_users_period,
          アクティブユーザー: reportData.user_stats.active_users_period,
          継続率: `${reportData.user_stats.retention_rate.toFixed(1)}%`
        }
      ]

      const gameReportData = [
        {
          期間: selectedPeriod,
          総セッション数: reportData.game_stats.total_sessions,
          人気ゲーム: reportData.game_stats.most_popular_game,
          平均セッション時間: `${Math.round(reportData.game_stats.average_session_duration)}秒`
        }
      ]

      const pointReportData = [
        {
          期間: selectedPeriod,
          総配布ポイント: reportData.point_stats.total_points_distributed,
          総消費ポイント: reportData.point_stats.total_points_spent,
          流通ポイント: reportData.point_stats.points_in_circulation,
          ユーザー平均ポイント: Math.round(reportData.point_stats.average_points_per_user)
        }
      ]

      // それぞれのレポートをエクスポート
      exportToCSV(userReportData, 'user_report')
      exportToCSV(gameReportData, 'game_report') 
      exportToCSV(pointReportData, 'point_report')

      toast.success('レポートをエクスポートしました')
    } catch (error) {
      console.error('Error exporting reports:', error)
      toast.error('レポートエクスポートに失敗しました')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">レポート・分析</h1>
          <p className="text-muted-foreground mt-1">システム全体の詳細分析レポート</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">過去7日</SelectItem>
              <SelectItem value="30d">過去30日</SelectItem>
              <SelectItem value="90d">過去90日</SelectItem>
              <SelectItem value="custom">カスタム</SelectItem>
            </SelectContent>
          </Select>
          {selectedPeriod === 'custom' && (
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          )}
          <Button onClick={exportAllReports}>
            <Download className="w-4 h-4 mr-2" />
            エクスポート
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="users">ユーザー分析</TabsTrigger>
          <TabsTrigger value="games">ゲーム分析</TabsTrigger>
          <TabsTrigger value="points">ポイント分析</TabsTrigger>
          <TabsTrigger value="quests">クエスト分析</TabsTrigger>
          <TabsTrigger value="gacha">ガチャ分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.user_stats.total_users.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  新規: {reportData?.user_stats.new_users_period}人
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ゲームセッション</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.game_stats.total_sessions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  人気: {reportData?.game_stats.most_popular_game}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">流通ポイント</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPoints(reportData?.point_stats.points_in_circulation || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  配布: {formatPoints(reportData?.point_stats.total_points_distributed || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ガチャ売上</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPoints(reportData?.gacha_stats.total_revenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  回数: {reportData?.gacha_stats.total_pulls}回
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>期間サマリー</CardTitle>
                <CardDescription>選択期間の主要指標</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>新規ユーザー:</span>
                  <span className="font-bold">{reportData?.user_stats.new_users_period}人</span>
                </div>
                <div className="flex justify-between">
                  <span>アクティブユーザー:</span>
                  <span className="font-bold">{reportData?.user_stats.active_users_period}人</span>
                </div>
                <div className="flex justify-between">
                  <span>継続率:</span>
                  <span className="font-bold">{reportData?.user_stats.retention_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>クエスト完了率:</span>
                  <span className="font-bold">{reportData?.quest_stats.quest_completion_rate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>パフォーマンス指標</CardTitle>
                <CardDescription>システム利用状況</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>平均セッション時間:</span>
                  <span className="font-bold">{Math.round(reportData?.game_stats.average_session_duration || 0)}秒</span>
                </div>
                <div className="flex justify-between">
                  <span>ユーザー平均ポイント:</span>
                  <span className="font-bold">{formatPoints(Math.round(reportData?.point_stats.average_points_per_user || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>人気ガチャマシン:</span>
                  <span className="font-bold text-sm">{reportData?.gacha_stats.most_popular_machine}</span>
                </div>
                <div className="flex justify-between">
                  <span>人気クエストタイプ:</span>
                  <span className="font-bold">{reportData?.quest_stats.most_popular_quest_type}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.user_stats.total_users.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">新規ユーザー</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.user_stats.new_users_period.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.user_stats.active_users_period.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">継続率</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.user_stats.retention_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総セッション数</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.game_stats.total_sessions.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">人気ゲーム</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{reportData?.game_stats.most_popular_game}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均セッション時間</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(reportData?.game_stats.average_session_duration || 0)}秒</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="points" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総配布ポイント</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(reportData?.point_stats.total_points_distributed || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総消費ポイント</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(reportData?.point_stats.total_points_spent || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">流通ポイント</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(reportData?.point_stats.points_in_circulation || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均ポイント/ユーザー</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(Math.round(reportData?.point_stats.average_points_per_user || 0))}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完了クエスト数</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.quest_stats.total_quests_completed.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完了率</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.quest_stats.quest_completion_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">人気クエストタイプ</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{reportData?.quest_stats.most_popular_quest_type}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総報酬配布</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(reportData?.quest_stats.total_rewards_distributed || 0)}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gacha" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総ガチャ回数</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.gacha_stats.total_pulls.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総売上</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(reportData?.gacha_stats.total_revenue || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">人気マシン</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{reportData?.gacha_stats.most_popular_machine}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">配布アイテム数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.gacha_stats.total_items_distributed.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}