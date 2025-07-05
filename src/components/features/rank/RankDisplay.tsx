'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Trophy, 
  TrendingUp, 
  Star,
  Shield,
  Crown,
  Gem
} from 'lucide-react'
import { RANK_COLORS } from '@/types/rank'
import { formatPoints } from '@/lib/utils'

interface RankDisplayProps {
  level: number
  experience: number
  nextLevelExp: number
  rank: {
    name: string
    tier: number
    color_primary: string
    color_secondary?: string
  }
  compact?: boolean
}

export function RankDisplay({
  level,
  experience,
  nextLevelExp,
  rank,
  compact = false
}: RankDisplayProps) {
  const progress = nextLevelExp > 0 
    ? Math.min((experience / nextLevelExp) * 100, 100)
    : 0

  const getRankIcon = (tier: number) => {
    switch (tier) {
      case 1: // Bronze
        return <Shield className="h-5 w-5" />
      case 2: // Silver
        return <Star className="h-5 w-5" />
      case 3: // Gold
        return <Trophy className="h-5 w-5" />
      case 4: // Platinum
        return <Crown className="h-5 w-5" />
      case 5: // Diamond
        return <Gem className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{
            backgroundColor: `${rank.color_primary}20`,
            borderColor: rank.color_primary,
            borderWidth: '2px',
            borderStyle: 'solid'
          }}
        >
          <span style={{ color: rank.color_primary }}>
            {getRankIcon(rank.tier)}
          </span>
          <span 
            className="font-semibold"
            style={{ color: rank.color_primary }}
          >
            {rank.name}
          </span>
        </div>
        <div className="text-sm font-medium">
          Lv.{level}
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div 
        className="h-2"
        style={{
          background: `linear-gradient(90deg, ${rank.color_primary} 0%, ${rank.color_secondary || rank.color_primary} 100%)`
        }}
      />
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Rank Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-full"
                style={{
                  backgroundColor: `${rank.color_primary}20`,
                  color: rank.color_primary
                }}
              >
                {getRankIcon(rank.tier)}
              </div>
              <div>
                <h3 
                  className="text-xl font-bold"
                  style={{ color: rank.color_primary }}
                >
                  {rank.name}
                </h3>
                <p className="text-sm text-gray-600">
                  現在のランク
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                Lv.{level}
              </div>
            </div>
          </div>

          {/* Experience Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                次のレベルまで
              </span>
              <span className="font-medium">
                {formatPoints(experience)} / {formatPoints(nextLevelExp)} EXP
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-3"
              style={{
                '--progress-background': rank.color_primary
              } as any}
            />
            <div className="text-right text-sm text-gray-600">
              {progress.toFixed(1)}%
            </div>
          </div>

          {/* Rank Benefits Preview */}
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 mb-2">
              ランク特典
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                EXP +{((RANK_COLORS[rank.tier as keyof typeof RANK_COLORS]?.name === 'Bronze' ? 0 : (rank.tier - 1) * 10))}%
              </Badge>
              {rank.tier >= 2 && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  デイリーボーナス +{(rank.tier - 1) * 20}%
                </Badge>
              )}
              {rank.tier >= 3 && (
                <Badge variant="secondary" className="text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  ガチャ割引 {rank.tier * 5}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}