'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Droplets, Sparkles, Crown, Star, Zap } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { SpringComponent } from '@/components/features/springs/SpringComponent'
import { SpringHistoryComponent } from '@/components/features/springs/SpringHistoryComponent'

interface LuckySpring {
  id: string
  name: string
  slug: string
  description: string
  theme: 'water' | 'forest' | 'mystic' | 'rainbow'
  level_requirement: number
  premium_only: boolean
  daily_visits: number
  visits_today: number
  visits_remaining: number
  accessible: boolean
  can_visit_today: boolean
  animation_config: {
    bubbles: boolean
    sparkles: boolean
    glow: boolean
  }
  color_scheme: {
    primary: string
    secondary: string
    accent: string
  }
}

interface SpringVisit {
  id: string
  spring_name: string
  points_earned: number
  reward_tier: string
  visit_date: string
  created_at: string
}

const THEME_ICONS = {
  water: Droplets,
  forest: Sparkles,
  mystic: Crown,
  rainbow: Star
}

// Moved to SpringHistoryComponent where it's actually used

export default function SpringsPage() {
  const { user, loading: authLoading } = useAuth()
  const [springs, setSprings] = useState<LuckySpring[]>([])
  const [springHistory, setSpringHistory] = useState<SpringVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [visitingSpring, setVisitingSpring] = useState<string | null>(null)
  const [selectedSpring, setSelectedSpring] = useState<LuckySpring | null>(null)

  // Fetch springs data
  const fetchSprings = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase.rpc('get_user_spring_status', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error fetching springs:', error)
        toast({
          title: 'エラー',
          description: '泉の情報を取得できませんでした。',
          variant: 'destructive'
        })
        return
      }

      setSprings(data || [])
    } catch (error) {
      console.error('Error fetching springs:', error)
      toast({
        title: 'エラー',
        description: '泉の情報を取得できませんでした。',
        variant: 'destructive'
      })
    }
  }, [user?.id])

  // Fetch spring visit history
  const fetchSpringHistory = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('spring_visits')
        .select(`
          id,
          points_earned,
          reward_tier,
          visit_date,
          created_at,
          lucky_springs!inner(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching spring history:', error)
        return
      }

      const formattedHistory = data?.map(visit => ({
        id: visit.id,
        spring_name: visit.lucky_springs?.name || '不明な泉',
        points_earned: visit.points_earned,
        reward_tier: visit.reward_tier,
        visit_date: visit.visit_date,
        created_at: visit.created_at
      })) || []

      setSpringHistory(formattedHistory)
    } catch (error) {
      console.error('Error fetching spring history:', error)
    }
  }, [user?.id])

  // Visit spring function
  const visitSpring = async (springSlug: string) => {
    if (!user?.id || visitingSpring) return

    setVisitingSpring(springSlug)

    try {
      const { data, error } = await supabase.rpc('visit_lucky_spring', {
        p_user_id: user.id,
        p_spring_slug: springSlug
      })

      if (error) {
        console.error('Error visiting spring:', error)
        toast({
          title: 'エラー',
          description: 'エラーが発生しました。',
          variant: 'destructive'
        })
        return
      }

      if (!data.success) {
        toast({
          title: '訪問できませんでした',
          description: data.error || '何らかのエラーが発生しました。',
          variant: 'destructive'
        })
        return
      }

      // Success! Show reward
      toast({
        title: `${data.spring_name}の恵み`,
        description: `${data.message} ${data.points_earned}ポイント獲得！ (${data.tier})`,
        variant: 'default'
      })

      // Refresh data
      await Promise.all([fetchSprings(), fetchSpringHistory()])

    } catch (error) {
      console.error('Error visiting spring:', error)
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました。',
        variant: 'destructive'
      })
    } finally {
      setVisitingSpring(null)
    }
  }

  useEffect(() => {
    if (user?.id && !authLoading) {
      const loadData = async () => {
        setLoading(true)
        await Promise.all([fetchSprings(), fetchSpringHistory()])
        setLoading(false)
      }
      loadData()
    }
  }, [user?.id, authLoading, fetchSprings, fetchSpringHistory])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">泉の情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertDescription>
            ログインしてから泉を訪れてください。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="relative">
              <Droplets className="h-8 w-8 text-blue-500" />
              <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              ラッキースプリング
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            神秘的な泉を訪れて、運命の恵みを受け取りましょう。
            一日一回だけ、泉の魔法があなたにポイントを授けてくれます。
          </p>
        </div>

        <Tabs defaultValue="springs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="springs" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              泉を訪れる
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              訪問履歴
            </TabsTrigger>
          </TabsList>

          <TabsContent value="springs" className="space-y-6">
            {springs.length === 0 ? (
              <div className="text-center py-12">
                <Droplets className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">泉が見つかりません</h3>
                <p className="text-muted-foreground">
                  現在利用可能な泉がありません。後ほど再度お試しください。
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {springs.map((spring) => (
                  <SpringComponent
                    key={spring.id}
                    spring={spring}
                    isVisiting={visitingSpring === spring.slug}
                    onVisit={() => visitSpring(spring.slug)}
                    onSelect={() => setSelectedSpring(spring)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <SpringHistoryComponent history={springHistory} />
          </TabsContent>
        </Tabs>

        {/* Spring Details Modal would go here */}
        {selectedSpring && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = THEME_ICONS[selectedSpring.theme]
                      return <Icon className="h-6 w-6 text-blue-500" />
                    })()}
                    <CardTitle>{selectedSpring.name}</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedSpring(null)}
                  >
                    ✕
                  </Button>
                </div>
                <CardDescription>
                  {selectedSpring.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">アクセス条件</h4>
                    <div className="space-y-1 text-sm">
                      <div>必要レベル: {selectedSpring.level_requirement}</div>
                      {selectedSpring.premium_only && (
                        <Badge variant="secondary">プレミアム限定</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">今日の状況</h4>
                    <div className="space-y-1 text-sm">
                      <div>訪問済み: {selectedSpring.visits_today}/{selectedSpring.daily_visits}</div>
                      <div>残り訪問: {selectedSpring.visits_remaining}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}