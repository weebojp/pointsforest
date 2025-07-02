'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Star, 
  Crown, 
  Sparkles, 
  Target,
  Gamepad2,
  TrendingUp,
  Calendar,
  Gift,
  Clock
} from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  category: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  point_reward: number
  is_active: boolean
  conditions: any
  completed_at?: string
  progress?: number
}

interface AchievementCardProps {
  achievement: Achievement
  isUnlocked: boolean
  progress?: number
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'first_steps':
      return Star
    case 'points':
      return TrendingUp
    case 'games':
      return Gamepad2
    case 'number_guess':
      return Target
    case 'roulette':
      return Sparkles
    case 'streak':
      return Calendar
    case 'level':
      return Crown
    case 'special':
      return Gift
    default:
      return Trophy
  }
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'uncommon':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'rare':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'epic':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'legendary':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getRarityName = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'コモン'
    case 'uncommon':
      return 'アンコモン'
    case 'rare':
      return 'レア'
    case 'epic':
      return 'エピック'
    case 'legendary':
      return 'レジェンダリー'
    default:
      return rarity
  }
}

export const AchievementCard = memo(({ achievement, isUnlocked, progress = 0 }: AchievementCardProps) => {
  const IconComponent = getCategoryIcon(achievement.category)
  const rarityColor = getRarityColor(achievement.rarity)
  const progressPercentage = Math.min(100, Math.max(0, progress))

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
      isUnlocked 
        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' 
        : 'bg-white hover:bg-gray-50'
    }`}>
      {/* Unlocked indicator */}
      {isUnlocked && (
        <div className="absolute top-2 right-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isUnlocked 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className={`text-lg ${
                isUnlocked ? 'text-yellow-900' : 'text-gray-600'
              }`}>
                {achievement.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`text-xs ${rarityColor}`}>
                  {getRarityName(achievement.rarity)}
                </Badge>
                <span className="text-sm font-medium text-blue-600">
                  +{achievement.point_reward}pt
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <CardDescription className={`mb-3 ${
          isUnlocked ? 'text-yellow-800' : 'text-gray-600'
        }`}>
          {achievement.description}
        </CardDescription>

        {/* Progress bar for incomplete achievements */}
        {!isUnlocked && progressPercentage > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">進行状況</span>
              <span className="text-gray-800 font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Completion date for unlocked achievements */}
        {isUnlocked && achievement.completed_at && (
          <div className="flex items-center text-sm text-yellow-700 mt-2">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(achievement.completed_at).toLocaleDateString('ja-JP')} に達成
          </div>
        )}
      </CardContent>
    </Card>
  )
})

AchievementCard.displayName = 'AchievementCard'