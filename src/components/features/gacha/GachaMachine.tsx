'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Coins, Star, Sparkles, Zap, Calendar, Package, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { GachaMachine as GachaMachineType, GACHA_TYPE_INFO, RARITY_INFO } from '@/types/gacha'
import { formatPoints } from '@/lib/utils'

interface GachaMachineProps {
  machine: GachaMachineType
  userPullsToday: number
  onPull: (machineSlug: string, count: number) => Promise<void>
  disabled?: boolean
}

export function GachaMachine({ machine, userPullsToday, onPull, disabled = false }: GachaMachineProps) {
  const { profile } = useAuth()
  const [isPulling, setIsPulling] = useState(false)
  const [showRates, setShowRates] = useState(false)

  // Map database fields to frontend expected fields
  const costAmount = machine.cost_amount || (machine as any).cost_per_pull || 0
  const dailyLimit = machine.daily_limit || (machine as any).pulls_per_day || null

  const typeInfo = GACHA_TYPE_INFO[machine.type]
  const canPull = dailyLimit ? userPullsToday < dailyLimit : true
  const remainingPulls = dailyLimit ? dailyLimit - userPullsToday : null
  const canAfford = profile ? profile.points >= costAmount : false
  const canAfford10 = profile ? profile.points >= (costAmount * 10) : false

  const getTypeIcon = () => {
    switch (typeInfo.icon) {
      case 'Star': return <Star className="h-5 w-5" />
      case 'Sparkles': return <Sparkles className="h-5 w-5" />
      case 'Calendar': return <Calendar className="h-5 w-5" />
      case 'Package': return <Package className="h-5 w-5" />
      default: return <Package className="h-5 w-5" />
    }
  }

  const getTypeColor = () => {
    switch (typeInfo.color) {
      case 'purple': return 'bg-purple-100 text-purple-800'
      case 'pink': return 'bg-pink-100 text-pink-800'
      case 'green': return 'bg-green-100 text-green-800'
      case 'blue': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePull = async (count: number) => {
    if (isPulling || !canPull || disabled) return

    setIsPulling(true)
    try {
      await onPull(machine.slug, count)
    } finally {
      setIsPulling(false)
    }
  }

  // 進捗バーの計算（デイリー制限に対する進捗）
  const progressPercentage = machine.daily_limit ? (userPullsToday / machine.daily_limit) * 100 : 0

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${
      disabled ? 'opacity-50' : 'hover:shadow-lg hover:scale-[1.02]'
    }`}>
      {/* Banner/Header */}
      <div className={`h-24 bg-gradient-to-r relative overflow-hidden ${
        machine.type === 'premium' ? 'from-purple-400 to-pink-400' :
        machine.type === 'event' ? 'from-pink-400 to-red-400' :
        machine.type === 'daily' ? 'from-green-400 to-blue-400' :
        'from-blue-400 to-cyan-400'
      }`}>
        {machine.banner_image_url ? (
          <img 
            src={machine.banner_image_url} 
            alt={machine.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-2xl font-bold opacity-90">
              {machine.name}
            </div>
          </div>
        )}
        
        <div className="absolute top-2 left-2">
          <Badge className={getTypeColor()}>
            {getTypeIcon()}
            <span className="ml-1">{typeInfo.name}</span>
          </Badge>
        </div>
        
        {machine.is_limited && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">
              期間限定
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{machine.name}</CardTitle>
        <CardDescription className="text-sm">
          {machine.description}
        </CardDescription>
        
        {/* Cost and Limits Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
          <div className="flex items-center gap-1">
            <Coins className="h-4 w-4" />
            <span>{formatPoints(costAmount)} pt/回</span>
          </div>
          {remainingPulls !== null && (
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>残り: {remainingPulls}回</span>
            </div>
          )}
        </div>
        
        {/* Daily Progress Bar */}
        {machine.daily_limit && (
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>本日の使用回数</span>
              <span>{userPullsToday} / {machine.daily_limit}</span>
            </div>
            <Progress value={progressPercentage} className="h-1" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pull Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={() => handlePull(1)}
            disabled={!canPull || !canAfford || isPulling || disabled}
            className="w-full"
            variant={machine.type === 'premium' ? 'default' : 'outline'}
          >
            {isPulling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                実行中...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                1回引く ({formatPoints(costAmount)}pt)
              </>
            )}
          </Button>
          
          {machine.type !== 'daily' && (
            <Button 
              onClick={() => handlePull(10)}
              disabled={!canPull || !canAfford10 || isPulling || disabled || (remainingPulls && remainingPulls < 10)}
              className="w-full"
              variant="default"
            >
              {isPulling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  実行中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  10回引く ({formatPoints(costAmount * 10)}pt)
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Insufficient funds warning */}
        {!canAfford && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-2 rounded">
            ポイントが不足しています
          </div>
        )}
        
        {!canPull && remainingPulls === 0 && (
          <div className="text-center text-sm text-orange-600 bg-orange-50 p-2 rounded">
            本日の回数制限に達しました
          </div>
        )}
        
        {/* Rate Display Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowRates(!showRates)}
          className="w-full text-xs"
        >
          {showRates ? '排出率を隠す' : '排出率を表示'}
        </Button>
        
        {/* Rate Display */}
        {showRates && (
          <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-2">
            <div className="font-medium text-center mb-3">排出率</div>
            <div className="space-y-1">
              {Object.entries(machine.pull_rates.rates).map(([rarity, rate]) => {
                const rarityInfo = RARITY_INFO[rarity as keyof typeof RARITY_INFO]
                if (!rarityInfo) return null
                
                return (
                  <div key={rarity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{rarityInfo.emoji}</span>
                      <span style={{ color: rarityInfo.color }}>
                        {rarityInfo.name}
                      </span>
                    </div>
                    <span className="font-medium">
                      {(rate * 100).toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div className="text-center text-gray-500 text-xs mt-3 pt-2 border-t">
              ※ 表示される確率は参考値です
            </div>
          </div>
        )}
        
        {/* Special Features */}
        {machine.guaranteed_items && (
          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
            <div className="font-medium text-yellow-800">天井システム</div>
            <div className="text-yellow-700">
              一定回数でレア報酬確定
            </div>
          </div>
        )}
        
        {machine.requires_premium && (
          <div className="bg-purple-50 border border-purple-200 p-2 rounded text-xs">
            <div className="font-medium text-purple-800 flex items-center gap-1">
              <Star className="h-3 w-3" />
              プレミアム限定
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}