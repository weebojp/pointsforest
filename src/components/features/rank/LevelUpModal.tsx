'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Star, 
  Sparkles, 
  Gift, 
  ChevronUp,
  Coins,
  Package
} from 'lucide-react'
import { LevelUpReward } from '@/types/rank'
import { formatPoints } from '@/lib/utils'

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  previousLevel: number
  currentLevel: number
  rewards: LevelUpReward[]
  newRank?: {
    name: string
    tier: number
    color: string
  }
}

export function LevelUpModal({
  isOpen,
  onClose,
  previousLevel,
  currentLevel,
  rewards,
  newRank
}: LevelUpModalProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setShowAnimation(false)
    setTimeout(onClose, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            レベルアップ！
          </DialogTitle>
        </DialogHeader>

        <div className={`space-y-6 ${showAnimation ? 'animate-fade-in' : ''}`}>
          {/* Level Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-3xl font-bold text-gray-400">
                Lv.{previousLevel}
              </div>
              <ChevronUp className="h-8 w-8 text-green-500 animate-bounce" />
              <div className="text-4xl font-bold text-green-600">
                Lv.{currentLevel}
              </div>
            </div>

            {/* Rank Up Display */}
            {newRank && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  <span className="text-lg font-semibold text-yellow-800">
                    ランクアップ！
                  </span>
                </div>
                <div 
                  className="text-2xl font-bold"
                  style={{ color: newRank.color }}
                >
                  {newRank.name}
                </div>
              </div>
            )}
          </div>

          {/* Rewards Section */}
          {rewards.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                獲得報酬
              </h3>
              <div className="space-y-2">
                {rewards.map((reward, index) => (
                  <Card 
                    key={index} 
                    className="p-3 bg-gradient-to-r from-purple-50 to-pink-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {reward.type === 'points' ? (
                          <Coins className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Package className="h-5 w-5 text-purple-600" />
                        )}
                        <span className="font-medium">
                          {reward.type === 'points' 
                            ? 'ボーナスポイント'
                            : reward.item?.type || 'アイテム'
                          }
                        </span>
                      </div>
                      <div className="font-bold text-lg">
                        {reward.type === 'points'
                          ? `+${formatPoints(reward.amount || 0)}`
                          : `×${reward.item?.quantity || 1}`
                        }
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Celebration Effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute animate-float-up opacity-0`}
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              >
                {i % 2 === 0 ? (
                  <Star className="h-6 w-6 text-yellow-400" />
                ) : (
                  <Sparkles className="h-6 w-6 text-purple-400" />
                )}
              </div>
            ))}
          </div>

          {/* Close Button */}
          <Button 
            onClick={handleClose} 
            className="w-full"
            size="lg"
          >
            素晴らしい！
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// CSS animations (add to globals.css)
const animationStyles = `
@keyframes float-up {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100%);
    opacity: 0;
  }
}

.animate-float-up {
  animation: float-up 3s ease-out forwards;
}
`