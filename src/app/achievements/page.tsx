'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trees, Trophy, ArrowLeft, Star, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AchievementCard } from '@/components/features/achievements/AchievementCard'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'

interface Achievement {
  id: string
  name: string
  description: string
  category: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  point_reward: number
  is_active: boolean
  conditions: any
}

interface UserAchievement {
  achievement_id: string
  completed_at: string
  progress: any
}

interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean
  completedAt?: string
  progress: number
}

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth()
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchAchievements()
    }
  }, [user, authLoading, router])

  const fetchAchievements = async () => {
    try {
      setLoading(true)

      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError)
        return
      }

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user!.id)

      if (userError) {
        console.error('Error fetching user achievements:', userError)
        return
      }

      // Merge data
      const mergedAchievements: AchievementWithProgress[] = (allAchievements || []).map(achievement => {
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id)
        
        return {
          ...achievement,
          isUnlocked: !!userAchievement?.completed_at,
          completedAt: userAchievement?.completed_at,
          progress: calculateProgress(achievement, userAchievement)
        }
      })

      setAchievements(mergedAchievements)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (achievement: Achievement, userAchievement?: UserAchievement): number => {
    if (userAchievement?.completed_at) return 100

    // This would be where you calculate progress based on the achievement type
    // For now, return 0 or some mock progress
    const progress = userAchievement?.progress || {}
    
    switch (achievement.conditions.type) {
      case 'total_points':
        // Would fetch user's current points and compare to target
        return 0
      case 'games_played':
        // Would fetch user's game count and compare to target
        return 0
      case 'login_streak':
        // Would check current streak vs target
        return 0
      default:
        return 0
    }
  }

  const categories = useMemo(() => {
    const categoryMap = new Map()
    achievements.forEach(achievement => {
      const category = achievement.category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: getCategoryName(category),
          count: 0,
          unlocked: 0
        })
      }
      const cat = categoryMap.get(category)
      cat.count++
      if (achievement.isUnlocked) cat.unlocked++
    })
    return Array.from(categoryMap.entries()).map(([key, value]) => ({
      key,
      ...value
    }))
  }, [achievements])

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements
    return achievements.filter(a => a.category === selectedCategory)
  }, [achievements, selectedCategory])

  const stats = useMemo(() => {
    const total = achievements.length
    const unlocked = achievements.filter(a => a.isUnlocked).length
    const totalPoints = achievements
      .filter(a => a.isUnlocked)
      .reduce((sum, a) => sum + a.point_reward, 0)
    
    return { total, unlocked, totalPoints }
  }, [achievements])

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
          { label: 'アチーブメント', icon: Trophy }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">達成済み</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unlocked}/{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}% 完了
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">獲得ポイント</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                アチーブメントから獲得
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">進行状況</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {achievements.filter(a => !a.isUnlocked && a.progress > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                進行中のアチーブメント
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <TabsTrigger value="all">
              すべて ({achievements.length})
            </TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category.key} value={category.key}>
                {category.name} ({category.unlocked}/{category.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {filteredAchievements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">このカテゴリにはアチーブメントがありません</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={achievement.isUnlocked}
                    progress={achievement.progress}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function getCategoryName(category: string): string {
  switch (category) {
    case 'first_steps':
      return 'はじめの一歩'
    case 'points':
      return 'ポイント'
    case 'games':
      return 'ゲーム'
    case 'number_guess':
      return '数字当て'
    case 'roulette':
      return 'ルーレット'
    case 'streak':
      return 'ストリーク'
    case 'level':
      return 'レベル'
    case 'special':
      return 'スペシャル'
    default:
      return category
  }
}