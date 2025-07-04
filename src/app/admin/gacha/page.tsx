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
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { formatPoints } from '@/lib/utils'
import { Crown, Plus, Edit, TrendingUp, Settings, BarChart3, Users, Coins, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface GachaMachine {
  id: string
  name: string
  description: string
  cost_per_pull: number
  is_active: boolean
  created_at: string
  gacha_pools: GachaPool[]
}

interface GachaPool {
  id: string
  machine_id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical'
  probability: number
  is_active: boolean
  gacha_items: GachaItem[]
}

interface GachaItem {
  id: string
  pool_id: string
  name: string
  description: string
  item_type: 'currency' | 'frame' | 'accessory' | 'special'
  item_value: number
  icon_url?: string
  is_active: boolean
}

interface GachaPull {
  id: string
  user_id: string
  machine_id: string
  cost_paid: number
  items_received: any[]
  pull_count: number
  created_at: string
  users: {
    username: string
    email: string
  }
  gacha_machines: {
    name: string
  }
}

interface GachaStats {
  total_pulls: number
  total_revenue: number
  total_items_distributed: number
  most_popular_machine: string
  rarity_distribution: Record<string, number>
  daily_pulls: number
  weekly_pulls: number
  monthly_pulls: number
}

export default function GachaManagementPage() {
  const { admin, loading } = useAdminAuth()
  const [machines, setMachines] = useState<GachaMachine[]>([])
  const [pools, setPools] = useState<GachaPool[]>([])
  const [items, setItems] = useState<GachaItem[]>([])
  const [pulls, setPulls] = useState<GachaPull[]>([])
  const [stats, setStats] = useState<GachaStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMachine, setSelectedMachine] = useState<GachaMachine | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    if (admin && !loading) {
      fetchData()
    }
  }, [admin, loading])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchMachines(),
        fetchPools(),
        fetchItems(),
        fetchPulls(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMachines = async () => {
    const { data, error } = await supabase
      .from('gacha_machines')
      .select(`
        *,
        gacha_pools(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching machines:', error)
      return
    }

    setMachines(data || [])
  }

  const fetchPools = async () => {
    const { data, error } = await supabase
      .from('gacha_pools')
      .select(`
        *,
        gacha_items(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pools:', error)
      return
    }

    setPools(data || [])
  }

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('gacha_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      return
    }

    setItems(data || [])
  }

  const fetchPulls = async () => {
    const { data, error } = await supabase
      .from('gacha_pulls')
      .select(`
        *,
        users!inner(username, email),
        gacha_machines!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Error fetching pulls:', error)
      return
    }

    setPulls(data || [])
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_gacha_stats')
      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // フォールバック: 基本的な統計を計算
      const totalPulls = pulls.length
      const totalRevenue = pulls.reduce((sum, pull) => sum + pull.cost_paid, 0)
      const totalItems = pulls.reduce((sum, pull) => sum + pull.pull_count, 0)
      
      setStats({
        total_pulls: totalPulls,
        total_revenue: totalRevenue,
        total_items_distributed: totalItems,
        most_popular_machine: machines[0]?.name || 'N/A',
        rarity_distribution: {
          common: 0,
          rare: 0,
          epic: 0,
          legendary: 0,
          mythical: 0
        },
        daily_pulls: 0,
        weekly_pulls: 0,
        monthly_pulls: 0
      })
    }
  }

  const handleMachineToggle = async (machineId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('gacha_machines')
        .update({ is_active: isActive })
        .eq('id', machineId)

      if (error) throw error

      toast.success(`ガチャを${isActive ? '有効' : '無効'}にしました`)
      fetchMachines()
    } catch (error) {
      console.error('Error updating machine:', error)
      toast.error('ガチャの更新に失敗しました')
    }
  }

  const handlePoolToggle = async (poolId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('gacha_pools')
        .update({ is_active: isActive })
        .eq('id', poolId)

      if (error) throw error

      toast.success(`プールを${isActive ? '有効' : '無効'}にしました`)
      fetchPools()
    } catch (error) {
      console.error('Error updating pool:', error)
      toast.error('プールの更新に失敗しました')
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'rare': return 'bg-blue-100 text-blue-800'
      case 'epic': return 'bg-purple-100 text-purple-800'
      case 'legendary': return 'bg-yellow-100 text-yellow-800'
      case 'mythical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'コモン'
      case 'rare': return 'レア'
      case 'epic': return 'エピック'
      case 'legendary': return 'レジェンダリー'
      case 'mythical': return 'ミシカル'
      default: return rarity
    }
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'currency': return '通貨'
      case 'frame': return 'フレーム'
      case 'accessory': return 'アクセサリー'
      case 'special': return '特別アイテム'
      default: return type
    }
  }

  const paginatedPulls = pulls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(pulls.length / itemsPerPage)

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
          <h1 className="text-3xl font-bold">ガチャ管理</h1>
          <p className="text-muted-foreground mt-1">ガチャシステムの管理と統計</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="machines">ガチャマシン</TabsTrigger>
          <TabsTrigger value="pools">プール設定</TabsTrigger>
          <TabsTrigger value="items">アイテム</TabsTrigger>
          <TabsTrigger value="pulls">引き履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総引き回数</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_pulls.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総売上</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(stats?.total_revenue || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">配布アイテム数</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_items_distributed.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">人気マシン</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">{stats?.most_popular_machine || 'N/A'}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>レア度分布</CardTitle>
              <CardDescription>獲得されたアイテムのレア度別統計</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(stats?.rarity_distribution || {}).map(([rarity, count]) => (
                  <div key={rarity} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <Badge className={getRarityColor(rarity)}>
                      {getRarityLabel(rarity)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ガチャマシン設定</CardTitle>
              <CardDescription>各ガチャマシンの設定を管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>マシン名</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead>コスト</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>プール数</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">{machine.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{machine.description}</TableCell>
                      <TableCell>{formatPoints(machine.cost_per_pull)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={machine.is_active}
                            onCheckedChange={(checked) => handleMachineToggle(machine.id, checked)}
                          />
                          <Badge variant={machine.is_active ? 'default' : 'secondary'}>
                            {machine.is_active ? '有効' : '無効'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{machine.gacha_pools?.length || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMachine(machine)
                            setIsEditOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>プール設定</CardTitle>
              <CardDescription>各プールの設定とアイテムを管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>プール名</TableHead>
                    <TableHead>レア度</TableHead>
                    <TableHead>確率</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>アイテム数</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((pool) => (
                    <TableRow key={pool.id}>
                      <TableCell className="font-medium">{pool.name}</TableCell>
                      <TableCell>
                        <Badge className={getRarityColor(pool.rarity)}>
                          {getRarityLabel(pool.rarity)}
                        </Badge>
                      </TableCell>
                      <TableCell>{(pool.probability * 100).toFixed(1)}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pool.is_active}
                            onCheckedChange={(checked) => handlePoolToggle(pool.id, checked)}
                          />
                          <Badge variant={pool.is_active ? 'default' : 'secondary'}>
                            {pool.is_active ? '有効' : '無効'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{pool.gacha_items?.length || 0}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>アイテム管理</CardTitle>
              <CardDescription>ガチャアイテムの管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>アイテム名</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>価値</TableHead>
                    <TableHead>状態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell>{getItemTypeLabel(item.item_type)}</TableCell>
                      <TableCell>
                        {item.item_type === 'currency' ? formatPoints(item.item_value) : item.item_value}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? '有効' : '無効'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pulls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>引き履歴</CardTitle>
              <CardDescription>
                {pulls.length} 件の引き履歴（{totalPages} ページ中 {currentPage} ページ）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日時</TableHead>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>マシン</TableHead>
                    <TableHead>コスト</TableHead>
                    <TableHead>引き回数</TableHead>
                    <TableHead>獲得アイテム</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPulls.map((pull) => (
                    <TableRow key={pull.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(pull.created_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pull.users.username}</div>
                          <div className="text-sm text-muted-foreground">{pull.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{pull.gacha_machines.name}</TableCell>
                      <TableCell>{formatPoints(pull.cost_paid)}</TableCell>
                      <TableCell>{pull.pull_count}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {pull.items_received.length} 個のアイテム
                        </div>
                      </TableCell>
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
      </Tabs>
    </div>
  )
}