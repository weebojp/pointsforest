'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth, withAdminAuth } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Coins, 
  GamepadIcon, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface DashboardStats {
  period: string
  start_date: string
  users: {
    new_users: number
    daily_active: number
    weekly_active: number
    total_users: number
  }
  points: {
    earned: number
    spent: number
    net_flow: number
    transactions: number
  }
  games: {
    total_sessions: number
    unique_players: number
    avg_points_per_session: number
  }
}

interface ChartData {
  userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }>
  pointFlow: Array<{ date: string; earned: number; spent: number; netFlow: number }>
  gameActivity: Array<{ name: string; sessions: number; players: number }>
}

function AdminDashboard() {
  const { admin } = useAdminAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // ダッシュボード統計取得
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_dashboard_stats', {
        p_date_range: selectedPeriod
      })

      if (statsError) throw statsError
      setStats(statsData)

      // チャートデータ生成（実際の実装ではより詳細なクエリを使用）
      const mockChartData: ChartData = {
        userGrowth: [
          { date: '2025-06-27', newUsers: 45, totalUsers: 1200 },
          { date: '2025-06-28', newUsers: 52, totalUsers: 1252 },
          { date: '2025-06-29', newUsers: 38, totalUsers: 1290 },
          { date: '2025-06-30', newUsers: 67, totalUsers: 1357 },
          { date: '2025-07-01', newUsers: 43, totalUsers: 1400 },
          { date: '2025-07-02', newUsers: 59, totalUsers: 1459 },
          { date: '2025-07-03', newUsers: 71, totalUsers: 1530 }
        ],
        pointFlow: [
          { date: '2025-06-27', earned: 45000, spent: 32000, netFlow: 13000 },
          { date: '2025-06-28', earned: 52000, spent: 38000, netFlow: 14000 },
          { date: '2025-06-29', earned: 38000, spent: 25000, netFlow: 13000 },
          { date: '2025-06-30', earned: 67000, spent: 45000, netFlow: 22000 },
          { date: '2025-07-01', earned: 43000, spent: 31000, netFlow: 12000 },
          { date: '2025-07-02', earned: 59000, spent: 42000, netFlow: 17000 },
          { date: '2025-07-03', earned: 71000, spent: 48000, netFlow: 23000 }
        ],
        gameActivity: [
          { name: '数字当て', sessions: 1250, players: 420 },
          { name: 'ルーレット', sessions: 980, players: 380 },
          { name: 'スロット', sessions: 1100, players: 450 },
          { name: 'ガチャ', sessions: 650, players: 280 }
        ]
      }
      setChartData(mockChartData)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">管理ダッシュボード</h1>
              <p className="text-gray-600 mt-1">Points Forest システム管理</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border rounded-md px-3 py-1 text-sm"
                >
                  <option value="1d">今日</option>
                  <option value="7d">過去7日</option>
                  <option value="30d">過去30日</option>
                  <option value="90d">過去90日</option>
                </select>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadDashboardData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                更新
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.users.total_users)}</div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    {getTrendIcon(stats.users.new_users, 50)}
                    <span className="ml-1">新規: {stats.users.new_users}人</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">DAU</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.users.daily_active)}</div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span>週間: {formatNumber(stats.users.weekly_active)}人</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ポイント流通</CardTitle>
                  <Coins className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.points.net_flow)}</div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    {getTrendIcon(stats.points.net_flow, 15000)}
                    <span className="ml-1">純増分</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ゲームセッション</CardTitle>
                  <GamepadIcon className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.games.total_sessions)}</div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span>プレイヤー: {formatNumber(stats.games.unique_players)}人</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* チャート */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">ユーザー分析</TabsTrigger>
            <TabsTrigger value="points">ポイント分析</TabsTrigger>
            <TabsTrigger value="games">ゲーム分析</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ユーザー増加推移</CardTitle>
                <CardDescription>新規ユーザー登録と累計ユーザー数の推移</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="newUsers" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="新規ユーザー"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalUsers" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="累計ユーザー"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ポイント流通分析</CardTitle>
                <CardDescription>ポイントの獲得・消費・純増分の推移</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.pointFlow}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="earned" fill="#10b981" name="獲得ポイント" />
                        <Bar dataKey="spent" fill="#ef4444" name="消費ポイント" />
                        <Bar dataKey="netFlow" fill="#3b82f6" name="純増分" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ゲーム別活動状況</CardTitle>
                <CardDescription>ゲーム別のセッション数とプレイヤー数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.gameActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sessions" fill="#8b5cf6" name="セッション数" />
                        <Bar dataKey="players" fill="#f59e0b" name="プレイヤー数" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ユーザー管理</CardTitle>
              <CardDescription>ユーザーアカウントとポイントの管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  ユーザー一覧
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Coins className="h-4 w-4 mr-2" />
                  ポイント調整
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">システム管理</CardTitle>
              <CardDescription>ゲーム設定とシステム構成</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <GamepadIcon className="h-4 w-4 mr-2" />
                  ゲーム設定
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  システム設定
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">レポート</CardTitle>
              <CardDescription>詳細分析とデータエクスポート</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  詳細分析
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  データエクスポート
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default withAdminAuth(AdminDashboard, 'analytics.view')