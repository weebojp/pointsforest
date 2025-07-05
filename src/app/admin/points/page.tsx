'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { formatPoints } from '@/lib/utils'
import { Plus, Edit, TrendingUp, TrendingDown, DollarSign, Activity, Search, Filter, Download, Settings } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PointTransaction {
  id: string
  user_id: string
  amount: number
  type: 'earn' | 'spend' | 'bonus' | 'refund' | 'adjustment'
  source: string
  description: string
  created_at: string
  users: {
    username: string
    email: string
  }
}

interface PointSettings {
  daily_bonus_base: number
  daily_bonus_streak_multiplier: number
  max_daily_earn: number
  game_point_multiplier: number
  achievement_point_multiplier: number
  spring_point_multiplier: number
}

interface PointStats {
  total_points_distributed: number
  total_points_spent: number
  daily_points_distributed: number
  weekly_points_distributed: number
  monthly_points_distributed: number
  top_earners: Array<{
    user_id: string
    username: string
    total_points: number
  }>
}

export default function PointsManagementPage() {
  const { admin, loading } = useAdminAuth()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [stats, setStats] = useState<PointStats | null>(null)
  const [settings, setSettings] = useState<PointSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)

  useEffect(() => {
    if (admin && !loading) {
      fetchData()
    }
  }, [admin, loading])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchTransactions(),
        fetchStats(),
        fetchSettings()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('point_transactions')
      .select(`
        *,
        users!inner(username, email)
      `)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }

    setTransactions(data || [])
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_point_stats')
      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // フォールバック: 基本的な統計を計算
      const { data: allTransactions } = await supabase
        .from('point_transactions')
        .select('amount, type, created_at')
      
      if (allTransactions) {
        const total_earned = allTransactions
          .filter(t => ['earn', 'bonus', 'adjustment'].includes(t.type) && t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0)
        
        const total_spent = allTransactions
          .filter(t => ['spend', 'adjustment'].includes(t.type) && t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
        setStats({
          total_points_distributed: total_earned,
          total_points_spent: total_spent,
          daily_points_distributed: 0,
          weekly_points_distributed: 0,
          monthly_points_distributed: 0,
          top_earners: []
        })
      }
    }
  }

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'points')
        .single()

      if (error) throw error
      
      setSettings(data?.settings || {
        daily_bonus_base: 50,
        daily_bonus_streak_multiplier: 1.1,
        max_daily_earn: 1000,
        game_point_multiplier: 1.0,
        achievement_point_multiplier: 1.0,
        spring_point_multiplier: 1.0
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      setSettings({
        daily_bonus_base: 50,
        daily_bonus_streak_multiplier: 1.1,
        max_daily_earn: 1000,
        game_point_multiplier: 1.0,
        achievement_point_multiplier: 1.0,
        spring_point_multiplier: 1.0
      })
    }
  }

  const handlePointAdjustment = async () => {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason) {
      toast.error('すべての項目を入力してください')
      return
    }

    const amount = parseInt(adjustmentAmount)
    if (isNaN(amount) || amount === 0) {
      toast.error('有効な数値を入力してください')
      return
    }

    try {
      const { error } = await supabase.rpc('admin_adjust_user_points', {
        user_id: selectedUser,
        amount: amount,
        reason: adjustmentReason,
        admin_id: admin!.id
      })

      if (error) throw error

      toast.success('ポイント調整が完了しました')
      setSelectedUser('')
      setAdjustmentAmount('')
      setAdjustmentReason('')
      setIsAdjustmentOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error adjusting points:', error)
      toast.error('ポイント調整に失敗しました')
    }
  }

  const handleSettingsUpdate = async () => {
    if (!settings) return

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          category: 'points',
          settings: settings,
          updated_by: admin!.id
        })

      if (error) throw error

      toast.success('設定が更新されました')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('設定の更新に失敗しました')
    }
  }

  const exportTransactions = async () => {
    try {
      const csvData = transactions.map(t => ({
        日時: new Date(t.created_at).toLocaleString('ja-JP'),
        ユーザー: t.users.username,
        メール: t.users.email,
        金額: t.amount,
        タイプ: t.type,
        ソース: t.source,
        説明: t.description
      }))

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `point_transactions_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('エクスポートに失敗しました')
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.users.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || t.type === filterType
    return matchesSearch && matchesFilter
  })

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

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
          <h1 className="text-3xl font-bold">ポイント管理</h1>
          <p className="text-muted-foreground mt-1">ポイントシステムの管理と分析</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />ポイント調整</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ポイント調整</DialogTitle>
                <DialogDescription>
                  ユーザーのポイントを調整します。正の値で追加、負の値で減算されます。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">ユーザー</Label>
                  <Input
                    id="user"
                    placeholder="ユーザーIDを入力"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">調整量</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="調整するポイント数"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">理由</Label>
                  <Textarea
                    id="reason"
                    placeholder="調整理由を入力"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  />
                </div>
                <Button onClick={handlePointAdjustment} className="w-full">
                  調整実行
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="w-4 h-4 mr-2" />エクスポート
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="transactions">取引履歴</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総配布ポイント</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(stats?.total_points_distributed || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総消費ポイント</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(stats?.total_points_spent || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">日次配布</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(stats?.daily_points_distributed || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">流通ポイント</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPoints((stats?.total_points_distributed || 0) - (stats?.total_points_spent || 0))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ユーザー名、メール、説明で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="フィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="earn">獲得</SelectItem>
                <SelectItem value="spend">消費</SelectItem>
                <SelectItem value="bonus">ボーナス</SelectItem>
                <SelectItem value="adjustment">調整</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>取引履歴</CardTitle>
              <CardDescription>
                {filteredTransactions.length} 件の取引（{totalPages} ページ中 {currentPage} ページ）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日時</TableHead>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>ソース</TableHead>
                    <TableHead>説明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(transaction.created_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.users.username}</div>
                          <div className="text-sm text-muted-foreground">{transaction.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatPoints(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'earn' ? 'default' : 
                                      transaction.type === 'spend' ? 'destructive' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{transaction.source}</TableCell>
                      <TableCell className="text-sm">{transaction.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    前のページ
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    次のページ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                ポイントシステム設定
              </CardTitle>
              <CardDescription>
                ポイントシステムの基本設定を管理します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>デイリーボーナス基本値</Label>
                      <Input
                        type="number"
                        value={settings.daily_bonus_base}
                        onChange={(e) => setSettings({...settings, daily_bonus_base: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>ストリーク乗数</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.daily_bonus_streak_multiplier}
                        onChange={(e) => setSettings({...settings, daily_bonus_streak_multiplier: parseFloat(e.target.value) || 1})}
                      />
                    </div>
                    <div>
                      <Label>1日最大獲得ポイント</Label>
                      <Input
                        type="number"
                        value={settings.max_daily_earn}
                        onChange={(e) => setSettings({...settings, max_daily_earn: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>ゲームポイント乗数</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.game_point_multiplier}
                        onChange={(e) => setSettings({...settings, game_point_multiplier: parseFloat(e.target.value) || 1})}
                      />
                    </div>
                    <div>
                      <Label>アチーブメントポイント乗数</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.achievement_point_multiplier}
                        onChange={(e) => setSettings({...settings, achievement_point_multiplier: parseFloat(e.target.value) || 1})}
                      />
                    </div>
                    <div>
                      <Label>ラッキースプリングポイント乗数</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.spring_point_multiplier}
                        onChange={(e) => setSettings({...settings, spring_point_multiplier: parseFloat(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                </div>
              )}
              <Button onClick={handleSettingsUpdate} className="w-full">
                設定を更新
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}