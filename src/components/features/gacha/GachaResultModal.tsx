'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Gift, ArrowRight, Star } from 'lucide-react'
import { GachaPullItem, RARITY_INFO } from '@/types/gacha'
import { formatPoints } from '@/lib/utils'

interface GachaResultModalProps {
  isOpen: boolean
  onClose: () => void
  results: {
    items_received: GachaPullItem[]
    total_value: number
    cost_paid: number
    machine_name?: string
  } | null
}

export function GachaResultModal({ isOpen, onClose, results }: GachaResultModalProps) {
  const [currentStep, setCurrentStep] = useState<'pulling' | 'reveal' | 'summary'>('pulling')
  const [revealedItems, setRevealedItems] = useState<GachaPullItem[]>([])
  const [animatingItemIndex, setAnimatingItemIndex] = useState(0)

  useEffect(() => {
    if (isOpen && results) {
      // アニメーションシーケンスを開始
      setCurrentStep('pulling')
      setRevealedItems([])
      setAnimatingItemIndex(0)

      // プルアニメーション (2秒)
      const pullingTimer = setTimeout(() => {
        setCurrentStep('reveal')
        revealItems()
      }, 2000)

      return () => clearTimeout(pullingTimer)
    }
  }, [isOpen, results])

  const revealItems = () => {
    if (!results) return

    const revealNext = (index: number) => {
      if (index >= results.items_received.length) {
        // 全アイテム表示完了
        setTimeout(() => {
          setCurrentStep('summary')
        }, 1000)
        return
      }

      setAnimatingItemIndex(index)
      setRevealedItems(prev => [...prev, results.items_received[index]])

      // 次のアイテムを500ms後に表示
      setTimeout(() => revealNext(index + 1), 600)
    }

    revealNext(0)
  }

  const getRarityGlow = (rarity: string) => {
    const rarityInfo = RARITY_INFO[rarity as keyof typeof RARITY_INFO]
    return rarityInfo ? rarityInfo.color : '#94a3b8'
  }

  const getBestRarity = () => {
    if (!results) return 'common'
    
    const rarityOrder = ['mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common']
    for (const rarity of rarityOrder) {
      if (results.items_received.some(item => item.rarity === rarity)) {
        return rarity
      }
    }
    return 'common'
  }

  const handleClose = () => {
    setCurrentStep('pulling')
    setRevealedItems([])
    setAnimatingItemIndex(0)
    onClose()
  }

  if (!results) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            ガチャ結果
          </DialogTitle>
          <DialogDescription>
            {results.machine_name && `${results.machine_name} の結果`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pulling Animation */}
          {currentStep === 'pulling' && (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <Sparkles className="h-8 w-8 absolute top-6 left-1/2 transform -translate-x-1/2 text-purple-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold mb-2">ガチャを引いています...</h3>
              <p className="text-gray-600">運命の結果をお待ちください</p>
            </div>
          )}

          {/* Item Reveal */}
          {currentStep === 'reveal' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">結果発表！</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {revealedItems.map((item, index) => {
                  const rarityInfo = RARITY_INFO[item.rarity]
                  const isAnimating = index === animatingItemIndex
                  
                  return (
                    <Card 
                      key={index}
                      className={`relative overflow-hidden transition-all duration-500 ${
                        isAnimating ? 'animate-bounce scale-105' : ''
                      }`}
                      style={{
                        boxShadow: isAnimating 
                          ? `0 0 20px ${getRarityGlow(item.rarity)}40` 
                          : 'none'
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="text-3xl"
                            style={{ filter: isAnimating ? 'drop-shadow(0 0 10px currentColor)' : 'none' }}
                          >
                            {item.icon_emoji || '🎁'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                style={{ 
                                  backgroundColor: `${getRarityGlow(item.rarity)}20`,
                                  color: getRarityGlow(item.rarity),
                                  borderColor: getRarityGlow(item.rarity)
                                }}
                              >
                                {rarityInfo?.emoji} {rarityInfo?.name}
                              </Badge>
                              {item.point_value && (
                                <span className="text-sm text-green-600 font-medium">
                                  +{formatPoints(item.point_value)}pt
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      
                      {/* Rarity Glow Effect */}
                      {isAnimating && (
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-30"
                          style={{
                            background: `radial-gradient(circle, ${getRarityGlow(item.rarity)}40 0%, transparent 70%)`
                          }}
                        />
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {currentStep === 'summary' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">ガチャ完了！</h3>
                <p className="text-gray-600">おめでとうございます！</p>
              </div>

              {/* All Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {results.items_received.map((item, index) => {
                  const rarityInfo = RARITY_INFO[item.rarity]
                  
                  return (
                    <Card key={index} className="relative">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {item.icon_emoji || '🎁'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline"
                                className="text-xs"
                                style={{ 
                                  borderColor: getRarityGlow(item.rarity),
                                  color: getRarityGlow(item.rarity)
                                }}
                              >
                                {rarityInfo?.emoji} {rarityInfo?.name}
                              </Badge>
                              {item.point_value && (
                                <span className="text-xs text-green-600 font-medium">
                                  +{formatPoints(item.point_value)}pt
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Summary Stats */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {results.items_received.length}
                    </div>
                    <div className="text-sm text-gray-600">アイテム数</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      +{formatPoints(results.total_value)}
                    </div>
                    <div className="text-sm text-gray-600">総価値</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPoints(results.cost_paid)}
                    </div>
                    <div className="text-sm text-gray-600">消費ポイント</div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold" style={{ color: getRarityGlow(getBestRarity()) }}>
                      {RARITY_INFO[getBestRarity()]?.emoji}
                    </div>
                    <div className="text-sm text-gray-600">最高レア度</div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center">
                <Button onClick={handleClose} className="px-8">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  続ける
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}