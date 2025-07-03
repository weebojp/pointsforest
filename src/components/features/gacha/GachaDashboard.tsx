'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { GachaMachine } from './GachaMachine'
import { GachaResultModal } from './GachaResultModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Package, Star, Sparkles, Calendar, History, BarChart3 } from 'lucide-react'
import { GachaMachine as GachaMachineType, GachaPull, GachaPullResponse, GachaStats } from '@/types/gacha'
import { formatPoints } from '@/lib/utils'

export function GachaDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [machines, setMachines] = useState<{
    standard: GachaMachineType[]
    premium: GachaMachineType[]
    event: GachaMachineType[]
    daily: GachaMachineType[]
  }>({
    standard: [],
    premium: [],
    event: [],
    daily: []
  })
  
  const [userPulls, setUserPulls] = useState<Record<string, number>>({})
  const [recentPulls, setRecentPulls] = useState<GachaPull[]>([])
  const [stats, setStats] = useState<GachaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // モーダル状態
  const [showResultModal, setShowResultModal] = useState(false)
  const [lastPullResult, setLastPullResult] = useState<GachaPullResponse | null>(null)

  useEffect(() => {
    if (user) {
      loadGachaData()
    }
  }, [user])

  const loadGachaData = async () => {
    if (!user) return

    try {
      await Promise.all([
        fetchGachaMachines(),
        fetchUserPullCounts(),
        fetchRecentPulls(),
        fetchGachaStats()
      ])
    } catch (error) {
      console.error('Error loading gacha data:', error)
    }
  }

  const fetchGachaMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('gacha_machines')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      // マシンをタイプ別に分類
      const categorized = {
        standard: data?.filter(m => m.type === 'standard') || [],
        premium: data?.filter(m => m.type === 'premium') || [],
        event: data?.filter(m => m.type === 'event') || [],
        daily: data?.filter(m => m.type === 'daily') || [],
      }

      setMachines(categorized)
    } catch (error) {
      console.error('Error fetching gacha machines:', error)
      toast({
        title: 'エラー',
        description: 'ガチャマシンの取得に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPullCounts = async () => {
    if (!user) return

    try {
      // 全マシンの本日のプル数を取得
      const allMachines = Object.values(machines).flat()
      const pullCounts: Record<string, number> = {}

      for (const machine of allMachines) {
        const { data, error } = await supabase.rpc('get_user_gacha_pulls_today', {
          p_user_id: user.id,
          p_gacha_slug: machine.slug
        })

        if (!error && data !== null) {
          pullCounts[machine.slug] = data
        }
      }

      setUserPulls(pullCounts)
    } catch (error) {
      console.error('Error fetching user pull counts:', error)
    }
  }

  const fetchRecentPulls = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('gacha_pulls')
        .select(`
          *,
          machine:gacha_machines(name, slug)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setRecentPulls(data || [])
    } catch (error) {
      console.error('Error fetching recent pulls:', error)
    }
  }

  const fetchGachaStats = async () => {
    if (!user) return

    try {
      const { data: pullData, error: pullError } = await supabase
        .from('gacha_pulls')
        .select('cost_paid, total_value, items_received, created_at')
        .eq('user_id', user.id)

      if (pullError) throw pullError

      if (pullData && pullData.length > 0) {
        const totalPulls = pullData.length
        const totalSpent = pullData.reduce((sum, pull) => sum + pull.cost_paid, 0)
        const totalValue = pullData.reduce((sum, pull) => sum + (pull.total_value || 0), 0)
        const totalItems = pullData.reduce((sum, pull) => sum + (pull.items_received?.length || 0), 0)

        // レア度分布を計算
        const rarityDistribution: Record<string, number> = {}
        pullData.forEach(pull => {
          if (pull.items_received) {
            pull.items_received.forEach((item: any) => {
              rarityDistribution[item.rarity] = (rarityDistribution[item.rarity] || 0) + 1
            })
          }
        })

        const gachaStats: GachaStats = {
          total_pulls: totalPulls,
          total_spent: totalSpent,
          total_value_received: totalValue,
          items_obtained: totalItems,
          rarity_distribution: rarityDistribution,
          lucky_streak: 0, // 簡易版では0
          last_pull_at: pullData[0]?.created_at
        }

        setStats(gachaStats)
      }
    } catch (error) {
      console.error('Error fetching gacha stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGachaData()
    setRefreshing(false)
    
    toast({
      title: 'ガチャ更新完了',
      description: 'ガチャデータを最新の状態に更新しました',
      duration: 2000
    })
  }

  const handlePull = async (machineSlug: string, count: number) => {
    if (!user) return

    try {
      console.log('Attempting gacha pull:', { machineSlug, count, userId: user.id })
      
      const { data, error } = await supabase.rpc('execute_gacha_pull', {
        p_user_id: user.id,
        p_gacha_slug: machineSlug,
        p_pull_count: count
      })

      console.log('Gacha RPC response:', { data, error })

      if (error) {
        console.error('Supabase RPC error:', error)
        
        // 外部キー制約違反エラーの場合の特別な処理
        if (error.message?.includes('foreign key constraint')) {
          toast({
            title: 'ユーザーデータエラー',
            description: 'ユーザー情報の同期に問題があります。ページを再読み込みしてください。',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'データベースエラー',
            description: `ガチャ実行エラー: ${error.message}`,
            variant: 'destructive'
          })
        }
        return
      }

      if (data?.success) {
        // 結果をモーダルで表示
        const machine = Object.values(machines).flat().find(m => m.slug === machineSlug)
        setLastPullResult({
          ...data,
          machine_name: machine?.name
        })
        setShowResultModal(true)

        // データを更新
        await Promise.all([
          fetchUserPullCounts(),
          fetchRecentPulls(),
          fetchGachaStats()
        ])

        toast({
          title: 'ガチャ完了！',
          description: `${data.items_received.length}個のアイテムを獲得しました！`,
          duration: 3000
        })
      } else {
        console.error('Gacha execution failed:', data)
        toast({
          title: 'ガチャエラー',
          description: data?.error || 'ガチャの実行に失敗しました',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error pulling gacha:', error)
      toast({
        title: 'システムエラー',
        description: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">ガチャを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ガチャ</h2>
          <p className="text-gray-600">
            運を試してレアアイテムを手に入れよう！
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          更新
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">総プル回数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.total_pulls}</div>
              <p className="text-xs text-gray-500">累計</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">消費ポイント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatPoints(stats.total_spent)}</div>
              <p className="text-xs text-gray-500">累計</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">獲得価値</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPoints(stats.total_value_received)}</div>
              <p className="text-xs text-gray-500">累計</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">獲得アイテム</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.items_obtained}</div>
              <p className="text-xs text-gray-500">累計</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gacha Machine Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            すべて
          </TabsTrigger>
          <TabsTrigger value="standard" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            スタンダード ({machines.standard.length})
          </TabsTrigger>
          <TabsTrigger value="premium" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            プレミアム ({machines.premium.length})
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            デイリー ({machines.daily.length})
          </TabsTrigger>
          <TabsTrigger value="event" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            イベント ({machines.event.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.values(machines).flat().map(machine => (
              <GachaMachine
                key={machine.id}
                machine={machine}
                userPullsToday={userPulls[machine.slug] || 0}
                onPull={handlePull}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="standard" className="space-y-4">
          {machines.standard.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">スタンダードガチャはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {machines.standard.map(machine => (
                <GachaMachine
                  key={machine.id}
                  machine={machine}
                  userPullsToday={userPulls[machine.slug] || 0}
                  onPull={handlePull}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          {machines.premium.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">プレミアムガチャはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {machines.premium.map(machine => (
                <GachaMachine
                  key={machine.id}
                  machine={machine}
                  userPullsToday={userPulls[machine.slug] || 0}
                  onPull={handlePull}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          {machines.daily.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">デイリーガチャはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {machines.daily.map(machine => (
                <GachaMachine
                  key={machine.id}
                  machine={machine}
                  userPullsToday={userPulls[machine.slug] || 0}
                  onPull={handlePull}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="event" className="space-y-4">
          {machines.event.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">イベントガチャはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {machines.event.map(machine => (
                <GachaMachine
                  key={machine.id}
                  machine={machine}
                  userPullsToday={userPulls[machine.slug] || 0}
                  onPull={handlePull}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      {recentPulls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              最近のガチャ履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {recentPulls.slice(0, 5).map((pull) => (
                <div key={pull.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎰</div>
                    <div>
                      <div className="font-medium">{pull.machine?.name}</div>
                      <div className="text-sm text-gray-600">
                        {pull.items_received.length}個のアイテム獲得
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-600 font-medium">
                      +{formatPoints(pull.total_value)}pt
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(pull.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <BarChart3 className="h-5 w-5" />
            ガチャのコツ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
            <div>
              <h4 className="font-semibold mb-2">🎯 効率的なガチャ戦略</h4>
              <ul className="space-y-1">
                <li>• デイリーガチャは毎日忘れずに</li>
                <li>• プレミアムガチャは高レア度が狙いやすい</li>
                <li>• 10連ガチャでまとめて引くとお得</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⏰ 制限とリセット</h4>
              <ul className="space-y-1">
                <li>• デイリー制限は毎日午前0時にリセット</li>
                <li>• イベントガチャは期間限定</li>
                <li>• プレミアムガチャは高コストだが高リターン</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Modal */}
      <GachaResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        results={lastPullResult}
      />
    </div>
  )
}