'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Droplets, Sparkles, Crown, Star, Lock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface SpringComponentProps {
  spring: LuckySpring
  isVisiting: boolean
  onVisit: () => void
  onSelect: () => void
}

const THEME_CONFIGS = {
  water: {
    icon: Droplets,
    gradient: 'from-blue-400 to-cyan-500',
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  forest: {
    icon: Sparkles,
    gradient: 'from-green-400 to-emerald-500',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    border: 'border-green-200 dark:border-green-800',
    accent: 'text-green-600 dark:text-green-400'
  },
  mystic: {
    icon: Crown,
    gradient: 'from-purple-400 to-pink-500',
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    border: 'border-purple-200 dark:border-purple-800',
    accent: 'text-purple-600 dark:text-purple-400'
  },
  rainbow: {
    icon: Star,
    gradient: 'from-yellow-400 via-red-500 to-pink-500',
    bg: 'bg-gradient-to-br from-yellow-50 via-red-50 to-pink-50 dark:from-yellow-950/20 dark:via-red-950/20 dark:to-pink-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    accent: 'text-yellow-600 dark:text-yellow-400'
  }
}

const WaterDroplet = ({ delay }: { delay: number }) => (
  <div 
    className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-70 animate-bounce"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${2 + Math.random() * 2}s`
    }}
  />
)

const SparkleParticle = ({ delay }: { delay: number }) => (
  <div 
    className="absolute"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
    }}
  >
    <Sparkles 
      className="h-3 w-3 text-yellow-400 animate-pulse opacity-70" 
      style={{
        animationDuration: `${1 + Math.random()}s`
      }}
    />
  </div>
)

export function SpringComponent({ spring, isVisiting, onVisit, onSelect }: SpringComponentProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const theme = THEME_CONFIGS[spring.theme]
  const Icon = theme.icon

  useEffect(() => {
    if (spring.can_visit_today && spring.accessible) {
      setShowAnimation(true)
    }
  }, [spring.can_visit_today, spring.accessible])

  const getStatusMessage = () => {
    if (!spring.accessible) {
      if (spring.level_requirement > 1) {
        return `レベル ${spring.level_requirement} が必要です`
      }
      if (spring.premium_only) {
        return 'プレミアム会員限定です'
      }
      return '現在アクセスできません'
    }
    
    if (!spring.can_visit_today) {
      return '今日の訪問制限に達しました'
    }
    
    return `今日の残り訪問: ${spring.visits_remaining}回`
  }

  const canInteract = spring.accessible && spring.can_visit_today && !isVisiting

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 cursor-pointer',
        theme.bg,
        theme.border,
        'hover:shadow-lg hover:scale-105',
        showAnimation && spring.animation_config.glow && 'shadow-lg ring-2 ring-blue-200 dark:ring-blue-800',
        !spring.accessible && 'opacity-60'
      )}
      onClick={onSelect}
    >
      {/* Animated Background Effects */}
      {showAnimation && spring.animation_config.bubbles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }, (_, i) => (
            <WaterDroplet key={i} delay={i * 0.5} />
          ))}
        </div>
      )}
      
      {showAnimation && spring.animation_config.sparkles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 6 }, (_, i) => (
            <SparkleParticle key={i} delay={i * 0.7} />
          ))}
        </div>
      )}

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'relative p-2 rounded-full',
              `bg-gradient-to-r ${theme.gradient}`,
              showAnimation && 'animate-pulse'
            )}>
              <Icon className="h-6 w-6 text-white" />
              {!spring.accessible && (
                <Lock className="h-3 w-3 text-white absolute -top-1 -right-1" />
              )}
            </div>
            <div>
              <CardTitle className={theme.accent}>{spring.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {spring.premium_only && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    プレミアム
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Lv.{spring.level_requirement}+
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <CardDescription className="text-sm">
          {spring.description.length > 100 
            ? `${spring.description.substring(0, 100)}...` 
            : spring.description
          }
        </CardDescription>

        {/* Visit Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">今日の訪問状況</span>
            <span className={theme.accent}>
              {spring.visits_today}/{spring.daily_visits}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                `bg-gradient-to-r ${theme.gradient}`
              )}
              style={{ 
                width: `${(spring.visits_today / spring.daily_visits) * 100}%` 
              }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            {getStatusMessage()}
          </p>
        </div>

        {/* Visit Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onVisit()
          }}
          disabled={!canInteract}
          className={cn(
            'w-full transition-all duration-300',
            canInteract && `bg-gradient-to-r ${theme.gradient} hover:opacity-90`,
            showAnimation && canInteract && 'animate-pulse'
          )}
          variant={canInteract ? "default" : "secondary"}
        >
          {isVisiting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              泉を訪問中...
            </div>
          ) : canInteract ? (
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              泉を訪れる
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {!spring.accessible ? '利用不可' : '本日終了'}
            </div>
          )}
        </Button>
      </CardContent>

      {/* Special Effects Overlay */}
      {showAnimation && spring.animation_config.glow && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${spring.color_scheme.primary}20 0%, transparent 70%)`,
            animation: 'pulse 3s ease-in-out infinite'
          }}
        />
      )}
    </Card>
  )
}