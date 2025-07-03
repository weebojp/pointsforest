'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { formatPoints } from '@/lib/utils'
import { Loader2, Coins, Sparkles } from 'lucide-react'

interface SlotSymbol {
  id: string
  icon: string
  name: string
  probability: number
  value: number
}

interface SlotResult {
  symbols: string[]
  combination: string
  pointsEarned: number
  multiplier: number
  message: string
}

const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: 'cherry', icon: '🍒', name: 'チェリー', probability: 0.4, value: 1 },
  { id: 'lemon', icon: '🍋', name: 'レモン', probability: 0.25, value: 2 },
  { id: 'orange', icon: '🍊', name: 'オレンジ', probability: 0.15, value: 3 },
  { id: 'bell', icon: '🔔', name: 'ベル', probability: 0.1, value: 5 },
  { id: 'diamond', icon: '💎', name: 'ダイヤ', probability: 0.05, value: 10 },
  { id: 'star', icon: '🌟', name: 'スター', probability: 0.03, value: 20 },
  { id: 'jackpot', icon: '🎯', name: 'ジャックポット', probability: 0.02, value: 50 }
]

const PAYOUT_TABLE = {
  three_of_kind: {
    cherry: 10, lemon: 25, orange: 50, bell: 100, 
    diamond: 500, star: 1000, jackpot: 5000
  },
  two_of_kind: {
    cherry: 2, lemon: 5, orange: 10, bell: 20, 
    diamond: 50, star: 100, jackpot: 500
  }
}

export default function SlotMachineGame() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState(['🍒', '🍒', '🍒'])
  const [result, setResult] = useState<SlotResult | null>(null)
  const [playsToday, setPlaysToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const reelRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]

  const DAILY_LIMIT = 5

  useEffect(() => {
    fetchPlaysToday()
  }, [user])

  const fetchPlaysToday = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Count slot machine transactions today as a simple alternative
      const { data, error } = await supabase
        .from('point_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', 'slot_machine')
        .gte('created_at', today)

      if (error) {
        console.error('Database error fetching plays:', error)
        setPlaysToday(0)
        return
      }

      setPlaysToday(data?.length || 0)
    } catch (error) {
      console.error('Error fetching plays today:', error)
      setPlaysToday(0)
    } finally {
      setLoading(false)
    }
  }

  const getRandomSymbol = (): string => {
    const random = Math.random()
    let cumulative = 0
    
    for (const symbol of SLOT_SYMBOLS) {
      cumulative += symbol.probability
      if (random <= cumulative) {
        return symbol.icon
      }
    }
    
    return SLOT_SYMBOLS[0].icon // fallback
  }

  const calculateResult = (symbols: string[]): SlotResult => {
    const symbolIds = symbols.map(icon => 
      SLOT_SYMBOLS.find(s => s.icon === icon)?.id || 'cherry'
    )

    // Check for three of a kind
    if (symbolIds[0] === symbolIds[1] && symbolIds[1] === symbolIds[2]) {
      const multiplier = PAYOUT_TABLE.three_of_kind[symbolIds[0] as keyof typeof PAYOUT_TABLE.three_of_kind] || 1
      return {
        symbols,
        combination: 'three_of_kind',
        pointsEarned: multiplier,
        multiplier,
        message: `🎉 3つ揃い！ ${SLOT_SYMBOLS.find(s => s.id === symbolIds[0])?.name}!`
      }
    }

    // Check for two of a kind
    const counts = symbolIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const twoOfKindSymbol = Object.keys(counts).find(id => counts[id] === 2)
    if (twoOfKindSymbol) {
      const multiplier = PAYOUT_TABLE.two_of_kind[twoOfKindSymbol as keyof typeof PAYOUT_TABLE.two_of_kind] || 1
      return {
        symbols,
        combination: 'two_of_kind',
        pointsEarned: multiplier,
        multiplier,
        message: `👍 2つ揃い！ ${SLOT_SYMBOLS.find(s => s.id === twoOfKindSymbol)?.name}!`
      }
    }

    // No match
    return {
      symbols,
      combination: 'no_match',
      pointsEarned: 1, // 最低保証
      multiplier: 1,
      message: '残念！ 次回頑張りましょう！'
    }
  }

  const animateReel = (reelIndex: number, finalSymbol: string, delay: number) => {
    const reel = reelRefs[reelIndex].current
    if (!reel) return

    // Add spinning animation
    reel.classList.add('animate-spin')

    setTimeout(() => {
      // Stop spinning and show final symbol
      reel.classList.remove('animate-spin')
      setReels(prev => {
        const newReels = [...prev]
        newReels[reelIndex] = finalSymbol
        return newReels
      })
    }, delay)
  }

  const handleSpin = async () => {
    if (!user || !profile || isSpinning || playsToday >= DAILY_LIMIT) return

    setIsSpinning(true)
    setResult(null)

    try {
      // Generate result
      const newSymbols = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      const gameResult = calculateResult(newSymbols)

      // Animate reels with different delays
      animateReel(0, newSymbols[0], 500)
      animateReel(1, newSymbols[1], 1000)
      animateReel(2, newSymbols[2], 1500)

      // Wait for animations to complete
      setTimeout(async () => {
        try {
          // Create simple point transaction instead of complex game session
          const { error: transactionError } = await supabase
            .from('point_transactions')
            .insert({
              user_id: user.id,
              amount: gameResult.pointsEarned,
              type: 'earn',
              source: 'slot_machine',
              description: `スロットマシン: ${gameResult.message}`,
              metadata: {
                symbols: newSymbols,
                combination: gameResult.combination,
                multiplier: gameResult.multiplier
              }
            })

          if (transactionError) {
            console.warn('Transaction save failed:', transactionError)
          }

          // Update user points
          await supabase
            .from('users')
            .update({
              points: profile.points + gameResult.pointsEarned,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)


          setResult(gameResult)
          setPlaysToday(prev => prev + 1)
          await refreshProfile()

          toast({
            title: gameResult.message,
            description: `${formatPoints(gameResult.pointsEarned)}ポイントを獲得しました！`,
            variant: gameResult.combination === 'no_match' ? 'default' : 'default'
          })

        } catch (error) {
          console.error('Error saving slot result:', error)
          toast({
            title: 'エラー',
            description: 'ゲーム結果の保存に失敗しました',
            variant: 'destructive'
          })
        }

        setIsSpinning(false)
      }, 2000)

    } catch (error) {
      console.error('Error playing slot machine:', error)
      setIsSpinning(false)
      toast({
        title: 'エラー',
        description: 'ゲームの実行に失敗しました',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const canPlay = playsToday < DAILY_LIMIT && !isSpinning

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          🎰 森のスロット
        </CardTitle>
        <CardDescription>
          運試しのスロットマシン！3つ揃えて大当たりを狙おう！
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Slot Machine Display */}
        <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 p-6 rounded-lg border-4 border-yellow-400">
          {/* Reels */}
          <div className="flex justify-center gap-2 mb-4">
            {reels.map((symbol, index) => (
              <div
                key={index}
                ref={reelRefs[index]}
                className="w-20 h-20 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-4xl shadow-inner"
              >
                {symbol}
              </div>
            ))}
          </div>
          
          {/* Spin Button */}
          <div className="text-center">
            <Button
              onClick={handleSpin}
              disabled={!canPlay}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 text-lg"
            >
              {isSpinning ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  スピン中...
                </>
              ) : (
                <>
                  <Coins className="h-5 w-5 mr-2" />
                  スピン！
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h3 className="font-bold text-lg">{result.message}</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              +{formatPoints(result.pointsEarned)}pt
            </p>
            {result.multiplier > 1 && (
              <p className="text-sm text-gray-600">
                倍率: x{result.multiplier}
              </p>
            )}
          </div>
        )}

        {/* Game Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>今日のプレイ回数:</span>
            <span className={playsToday >= DAILY_LIMIT ? 'text-red-600 font-medium' : ''}>
              {playsToday} / {DAILY_LIMIT}
            </span>
          </div>
          
          {playsToday >= DAILY_LIMIT && (
            <p className="text-red-600 text-center font-medium">
              本日の回数制限に達しました。明日またお試しください！
            </p>
          )}
        </div>

        {/* Payout Table */}
        <details className="cursor-pointer">
          <summary className="font-medium text-gray-700 hover:text-gray-900">
            配当表を見る
          </summary>
          <div className="mt-3 space-y-2 text-sm">
            <div className="font-medium">3つ揃い:</div>
            {Object.entries(PAYOUT_TABLE.three_of_kind).map(([id, multiplier]) => {
              const symbol = SLOT_SYMBOLS.find(s => s.id === id)
              return (
                <div key={id} className="flex justify-between pl-4">
                  <span>{symbol?.icon} {symbol?.name}</span>
                  <span className="font-medium">x{multiplier}</span>
                </div>
              )
            })}
            
            <div className="font-medium mt-3">2つ揃い:</div>
            {Object.entries(PAYOUT_TABLE.two_of_kind).map(([id, multiplier]) => {
              const symbol = SLOT_SYMBOLS.find(s => s.id === id)
              return (
                <div key={id} className="flex justify-between pl-4">
                  <span>{symbol?.icon} {symbol?.name}</span>
                  <span className="font-medium">x{multiplier}</span>
                </div>
              )
            })}
          </div>
        </details>
      </CardContent>
    </Card>
  )
}