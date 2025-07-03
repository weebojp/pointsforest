'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { QuestCard } from './QuestCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Target, Calendar, Trophy, Filter, BarChart3 } from 'lucide-react'
import { UserQuest, QuestStats, QuestFilters } from '@/types/quest'

export function QuestDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [quests, setQuests] = useState<{
    daily: UserQuest[]
    weekly: UserQuest[]
    challenge: UserQuest[]
  }>({
    daily: [],
    weekly: [],
    challenge: []
  })
  const [stats, setStats] = useState<QuestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<QuestFilters>({
    showCompleted: true,
    showExpired: false
  })

  useEffect(() => {
    if (user) {
      loadQuestData()
    }
  }, [user])

  const loadQuestData = async () => {
    if (!user) return

    try {
      await Promise.all([
        generateDailyQuests(),
        fetchQuests(),
        fetchQuestStats()
      ])
    } catch (error) {
      console.error('Error loading quest data:', error)
    }
  }

  const fetchQuests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_quests')
        .select(`
          *,
          template:quest_templates(*)
        `)
        .eq('user_id', user.id)
        .in('status', filters.showCompleted ? ['active', 'completed'] : ['active'])
        .order('created_at', { ascending: false })

      if (error) throw error

      // クエストをタイプ別に分類
      const now = new Date()
      const categorized = {
        daily: data?.filter(q => {
          const quest = q as UserQuest
          if (!filters.showExpired && quest.expires_at && new Date(quest.expires_at) < now) {
            return false
          }
          return quest.template?.type === 'daily'
        }) || [],
        weekly: data?.filter(q => {
          const quest = q as UserQuest
          if (!filters.showExpired && quest.expires_at && new Date(quest.expires_at) < now) {
            return false
          }
          return quest.template?.type === 'weekly'
        }) || [],
        challenge: data?.filter(q => {
          const quest = q as UserQuest
          if (!filters.showExpired && quest.expires_at && new Date(quest.expires_at) < now) {
            return false
          }
          return quest.template?.type === 'challenge'
        }) || [],
      }

      setQuests(categorized)
    } catch (error) {
      console.error('Error fetching quests:', error)
      toast({
        title: 'エラー',
        description: 'クエストの取得に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestStats = async () => {
    if (!user) return

    try {
      // 統計データを取得
      const { data: completions, error: completionsError } = await supabase
        .from('quest_completions')
        .select('points_earned, created_at')
        .eq('user_id', user.id)

      if (completionsError) throw completionsError

      const { data: activeQuests, error: activeError } = await supabase
        .from('user_quests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (activeError) throw activeError

      const totalCompletions = completions?.length || 0
      const totalPointsFromQuests = completions?.reduce((sum, completion) => sum + completion.points_earned, 0) || 0
      const totalActiveQuests = activeQuests?.length || 0

      // 完了率計算（完了 / (完了 + アクティブ)）
      const completionRate = totalCompletions + totalActiveQuests > 0 
        ? (totalCompletions / (totalCompletions + totalActiveQuests)) * 100 
        : 0

      // 連続完了数計算（簡易版）
      const recentCompletions = completions?.filter(c => {
        const completionDate = new Date(c.created_at)
        const daysDiff = Math.floor((Date.now() - completionDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 7 // 過去7日間
      }) || []

      const questStats: QuestStats = {
        total_quests: totalCompletions + totalActiveQuests,
        completed_quests: totalCompletions,
        active_quests: totalActiveQuests,
        points_from_quests: totalPointsFromQuests,
        completion_rate: completionRate,
        streak_count: recentCompletions.length,
        last_completed_at: completions?.[0]?.created_at
      }

      setStats(questStats)
    } catch (error) {
      console.error('Error fetching quest stats:', error)
    }
  }

  const generateDailyQuests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('generate_daily_quests', {
        p_user_id: user.id
      })

      if (error) throw error

      if (data?.new_quests_generated > 0) {
        toast({
          title: '新しいデイリークエスト',
          description: `${data.new_quests_generated}個のクエストが追加されました！`,
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error generating daily quests:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadQuestData()
    setRefreshing(false)
    
    toast({
      title: 'クエスト更新完了',
      description: 'クエストデータを最新の状態に更新しました',
      duration: 2000
    })
  }

  const handleClaimReward = async (questId: string) => {
    try {
      const { data, error } = await supabase.rpc('claim_quest_reward', {
        p_quest_id: questId
      })

      if (error) throw error

      if (data?.success) {
        toast({
          title: '報酬受取完了！',
          description: `${data.points_earned}ポイントを獲得しました！`,
          duration: 3000
        })
        await fetchQuests() // リフレッシュ
        await fetchQuestStats() // 統計も更新
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
      toast({
        title: 'エラー',
        description: '報酬の受取に失敗しました',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">クエストを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">クエスト</h2>
          <p className="text-gray-600">
            タスクを完了してポイントを獲得しよう！
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
              <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active_quests}</div>
              <p className="text-xs text-gray-500">進行中のクエスト</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">完了済み</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed_quests}</div>
              <p className="text-xs text-gray-500">達成したクエスト</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">獲得ポイント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.points_from_quests.toLocaleString()}</div>
              <p className="text-xs text-gray-500">クエストから</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">完了率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completion_rate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">成功率</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quest Tabs */}
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            デイリー ({quests.daily.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            ウィークリー ({quests.weekly.length})
          </TabsTrigger>
          <TabsTrigger value="challenge" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            チャレンジ ({quests.challenge.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {quests.daily.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">本日のデイリークエストはありません</p>
                <Button 
                  onClick={generateDailyQuests} 
                  className="mt-4"
                  variant="outline"
                >
                  デイリークエストを生成
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quests.daily.map(quest => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest} 
                  onClaim={handleClaimReward}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {quests.weekly.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">今週のウィークリークエストはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quests.weekly.map(quest => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest} 
                  onClaim={handleClaimReward}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenge" className="space-y-4">
          {quests.challenge.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">利用可能なチャレンジクエストはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quests.challenge.map(quest => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest} 
                  onClaim={handleClaimReward}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <BarChart3 className="h-5 w-5" />
            クエストのコツ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">🎯 効率的なクエスト攻略</h4>
              <ul className="space-y-1">
                <li>• デイリークエストは毎日リセットされます</li>
                <li>• ゲームを複数回プレイして効率よく進行</li>
                <li>• ラッキースプリングも忘れずに訪問</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⏰ 期限管理</h4>
              <ul className="space-y-1">
                <li>• デイリー: 毎日午前0時にリセット</li>
                <li>• ウィークリー: 毎週月曜日にリセット</li>
                <li>• チャレンジ: 期限なし（長期目標）</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}