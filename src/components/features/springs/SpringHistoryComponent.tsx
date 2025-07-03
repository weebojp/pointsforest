'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Droplets, Calendar, TrendingUp, Award, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO, isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { ja } from 'date-fns/locale'

interface SpringVisit {
  id: string
  spring_name: string
  points_earned: number
  reward_tier: string
  visit_date: string
  created_at: string
}

interface SpringHistoryComponentProps {
  history: SpringVisit[]
}

const TIER_COLORS = {
  common: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  legendary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  mythical: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
}

const TIER_LABELS = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー',
  mythical: 'ミシカル'
}

export function SpringHistoryComponent({ history }: SpringHistoryComponentProps) {
  const [expandedView, setExpandedView] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week' | 'all'>('all')

  // Calculate statistics
  const stats = {
    totalVisits: history.length,
    totalPoints: history.reduce((sum, visit) => sum + visit.points_earned, 0),
    averagePoints: history.length > 0 ? Math.round(history.reduce((sum, visit) => sum + visit.points_earned, 0) / history.length) : 0,
    bestReward: history.reduce((best, visit) => 
      visit.points_earned > best.points_earned ? visit : best, 
      { points_earned: 0, reward_tier: 'common', spring_name: '', visit_date: '', created_at: '', id: '' }
    ),
    tierDistribution: history.reduce((acc, visit) => {
      acc[visit.reward_tier] = (acc[visit.reward_tier] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Filter history based on selected period
  const filteredHistory = history.filter(visit => {
    const visitDate = parseISO(visit.visit_date)
    const now = new Date()
    
    switch (selectedPeriod) {
      case 'today':
        return isToday(visitDate)
      case 'yesterday':
        return isYesterday(visitDate)
      case 'week':
        return isWithinInterval(visitDate, {
          start: startOfWeek(now, { locale: ja }),
          end: endOfWeek(now, { locale: ja })
        })
      default:
        return true
    }
  })

  const formatRelativeDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return '今日'
    if (isYesterday(date)) return '昨日'
    return format(date, 'M月d日', { locale: ja })
  }

  const groupedHistory = filteredHistory.reduce((groups, visit) => {
    const date = visit.visit_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(visit)
    return groups
  }, {} as Record<string, SpringVisit[]>)

  // const displayedHistory = expandedView ? filteredHistory : filteredHistory.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総訪問回数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              すべての泉への訪問
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">獲得ポイント合計</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              泉から獲得したポイント
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均獲得ポイント</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePoints}</div>
            <p className="text-xs text-muted-foreground">
              1回あたりの平均
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高獲得</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestReward.points_earned}</div>
            <p className="text-xs text-muted-foreground">
              {stats.bestReward.spring_name && `${stats.bestReward.spring_name}にて`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      {Object.keys(stats.tierDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              報酬ランク分布
            </CardTitle>
            <CardDescription>
              獲得した報酬のランク別統計
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.tierDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([tier, count]) => (
                <Badge 
                  key={tier} 
                  className={TIER_COLORS[tier as keyof typeof TIER_COLORS]}
                  variant="secondary"
                >
                  {TIER_LABELS[tier as keyof typeof TIER_LABELS]} × {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'すべて' },
          { value: 'today', label: '今日' },
          { value: 'yesterday', label: '昨日' },
          { value: 'week', label: '今週' }
        ].map((period) => (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period.value as 'today' | 'yesterday' | 'week' | 'all')}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            訪問履歴
          </CardTitle>
          <CardDescription>
            泉への訪問とポイント獲得の履歴
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">訪問履歴がありません</h3>
              <p className="text-muted-foreground">
                {selectedPeriod === 'all' 
                  ? 'まだ泉を訪れていません。泉を訪れてポイントを獲得しましょう！'
                  : 'この期間に泉の訪問はありません。'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedHistory)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .slice(0, expandedView ? undefined : 5)
                .map(([date, visits]) => (
                <div key={date} className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground sticky top-0 bg-background py-1">
                    {formatRelativeDate(date)}
                  </h4>
                  <div className="space-y-2 ml-4">
                    {visits.map((visit) => (
                      <div 
                        key={visit.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                            <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">{visit.spring_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(visit.created_at), 'HH:mm', { locale: ja })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={TIER_COLORS[visit.reward_tier as keyof typeof TIER_COLORS]}>
                            {TIER_LABELS[visit.reward_tier as keyof typeof TIER_LABELS]}
                          </Badge>
                          <div className="text-right">
                            <div className="font-bold text-green-600 dark:text-green-400">
                              +{visit.points_earned}pt
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredHistory.length > 10 && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setExpandedView(!expandedView)}
                    className="flex items-center gap-2"
                  >
                    {expandedView ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        折りたたむ
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        すべて表示 ({filteredHistory.length - 10}件)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}