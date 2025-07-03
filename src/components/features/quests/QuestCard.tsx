'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, Star, Gift, Trophy, Gamepad2, Calendar, Users, Coins } from 'lucide-react'
import { UserQuest, QUEST_DIFFICULTY_INFO, QUEST_CATEGORY_INFO } from '@/types/quest'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface QuestCardProps {
  quest: UserQuest
  onClaim?: (questId: string) => Promise<void>
}

export function QuestCard({ quest, onClaim }: QuestCardProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  
  const progressPercentage = Math.min((quest.current_value / quest.target_value) * 100, 100)
  const isCompleted = quest.status === 'completed'
  const isExpired = quest.expires_at ? new Date(quest.expires_at) < new Date() : false
  const canClaim = isCompleted && !quest.rewards_claimed

  const categoryInfo = quest.template ? QUEST_CATEGORY_INFO[quest.template.category] : null
  const difficultyInfo = quest.template?.difficulty ? QUEST_DIFFICULTY_INFO[quest.template.difficulty] : null

  const getCategoryIcon = () => {
    if (!categoryInfo) return <Trophy className="h-4 w-4" />
    
    switch (categoryInfo.icon) {
      case 'Calendar': return <Calendar className="h-4 w-4" />
      case 'Gamepad2': return <Gamepad2 className="h-4 w-4" />
      case 'Users': return <Users className="h-4 w-4" />
      case 'Trophy': return <Trophy className="h-4 w-4" />
      case 'Coins': return <Coins className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty || !difficultyInfo) return 'bg-gray-100 text-gray-800'
    
    switch (difficultyInfo.color) {
      case 'green': return 'bg-green-100 text-green-800'
      case 'blue': return 'bg-blue-100 text-blue-800'
      case 'red': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = () => {
    if (!categoryInfo) return 'bg-gray-100 text-gray-800'
    
    switch (categoryInfo.color) {
      case 'blue': return 'bg-blue-100 text-blue-800'
      case 'green': return 'bg-green-100 text-green-800'
      case 'purple': return 'bg-purple-100 text-purple-800'
      case 'yellow': return 'bg-yellow-100 text-yellow-800'
      case 'orange': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const handleClaim = async () => {
    if (!onClaim || isClaiming) return
    
    setIsClaiming(true)
    try {
      await onClaim(quest.id)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 
      isExpired ? 'bg-gray-50 border-gray-200 opacity-75' : 
      'hover:shadow-md hover:scale-[1.02]'
    }`}>
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2 mb-2">
              {getCategoryIcon()}
              {quest.template?.name}
            </CardTitle>
            <CardDescription className="mb-2">
              {quest.template?.description}
            </CardDescription>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {categoryInfo && (
                <Badge className={getCategoryColor()}>
                  {categoryInfo.name}
                </Badge>
              )}
              {quest.template?.difficulty && difficultyInfo && (
                <Badge className={getDifficultyColor(quest.template.difficulty)}>
                  {difficultyInfo.name}
                </Badge>
              )}
              {quest.template?.type && (
                <Badge variant="outline" className="text-xs">
                  {quest.template.type === 'daily' ? 'デイリー' :
                   quest.template.type === 'weekly' ? 'ウィークリー' :
                   quest.template.type === 'challenge' ? 'チャレンジ' : 'クエスト'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {quest.expires_at && !isCompleted && (
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <Clock className="h-4 w-4 mr-1" />
            期限: {formatDistanceToNow(new Date(quest.expires_at), { 
              addSuffix: true, 
              locale: ja 
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>進行状況</span>
            <span className="font-medium">
              {quest.current_value} / {quest.target_value}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={`h-2 transition-all duration-500 ${
              isCompleted ? '[&>div]:bg-green-500' : ''
            }`}
          />
          <div className="text-right text-xs text-gray-500">
            {progressPercentage.toFixed(1)}% 完了
          </div>
        </div>
        
        {/* Rewards */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {quest.template?.rewards.points || quest.points_earned}pt
            </span>
            {quest.template?.rewards.bonus_multiplier && 
             quest.template.rewards.bonus_multiplier > 1 && (
              <Badge variant="secondary" className="text-xs">
                ×{quest.template.rewards.bonus_multiplier}
              </Badge>
            )}
          </div>
          
          {canClaim && (
            <Button 
              size="sm" 
              onClick={handleClaim}
              disabled={isClaiming}
              className="bg-green-600 hover:bg-green-700 animate-pulse"
            >
              {isClaiming ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  受取中...
                </>
              ) : (
                <>
                  <Gift className="h-3 w-3 mr-1" />
                  報酬受取
                </>
              )}
            </Button>
          )}
          
          {isCompleted && quest.rewards_claimed && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              受取済み
            </Badge>
          )}
        </div>
        
        {/* Quest Type Badge */}
        {isExpired && (
          <div className="text-center py-2">
            <Badge variant="destructive" className="text-xs">
              期限切れ
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}