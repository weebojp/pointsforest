'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Trophy, RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { sleep } from '@/lib/utils'
import type { Game, RouletteSegment } from '@/types/user'

interface RouletteGameProps {
  game: Game
  onComplete: () => void
}

interface GameState {
  status: 'ready' | 'spinning' | 'finished' | 'loading'
  currentSegment: number
  finalSegment: number | null
  result: {
    segment: RouletteSegment
    pointsEarned: number
    message: string
  } | null
}

export function RouletteGame({ game, onComplete }: RouletteGameProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Parse game config to get segments
  const segments: RouletteSegment[] = game.config?.segments || [
    { id: 0, label: '5pt', points: 5, probability: 0.4, color: '#10b981' },
    { id: 1, label: '10pt', points: 10, probability: 0.25, color: '#3b82f6' },
    { id: 2, label: '25pt', points: 25, probability: 0.15, color: '#8b5cf6' },
    { id: 3, label: '50pt', points: 50, probability: 0.1, color: '#f59e0b' },
    { id: 4, label: '100pt', points: 100, probability: 0.05, color: '#ef4444' },
    { id: 5, label: '200pt', points: 200, probability: 0.03, color: '#ec4899' },
    { id: 6, label: '500pt', points: 500, probability: 0.015, color: '#6366f1' },
    { id: 7, label: '1000pt', points: 1000, probability: 0.005, color: '#dc2626' }
  ]

  const [gameState, setGameState] = useState<GameState>({
    status: 'ready',
    currentSegment: 0,
    finalSegment: null,
    result: null
  })

  const selectRandomSegment = useCallback((): number => {
    const random = Math.random()
    let cumulativeProbability = 0
    
    for (const segment of segments) {
      cumulativeProbability += segment.probability
      if (random <= cumulativeProbability) {
        return segment.id
      }
    }
    
    // Fallback to first segment
    return segments[0].id
  }, [segments])

  const spinRoulette = async () => {
    if (!user || gameState.status !== 'ready') return

    const finalSegment = selectRandomSegment()
    
    setGameState(prev => ({
      ...prev,
      status: 'spinning',
      finalSegment
    }))

    // Animate spinning
    const spinDuration = 3000 // 3 seconds
    const spinSpeed = 100 // ms per segment change
    const totalSpins = spinDuration / spinSpeed

    for (let i = 0; i < totalSpins; i++) {
      const segmentIndex = Math.floor(Math.random() * segments.length)
      setGameState(prev => ({
        ...prev,
        currentSegment: segmentIndex
      }))
      await sleep(spinSpeed)
    }

    // Final result
    setGameState(prev => ({
      ...prev,
      currentSegment: finalSegment,
      status: 'loading'
    }))

    // Submit result to backend
    try {
      const winningSegment = segments.find(s => s.id === finalSegment)!
      const pointsEarned = winningSegment.points

      const { data, error } = await supabase.rpc('handle_game_session', {
        p_user_id: user.id,
        p_game_id: game.id,
        p_score: pointsEarned,
        p_points_earned: pointsEarned,
        p_metadata: {
          segment: finalSegment,
          segmentLabel: winningSegment.label,
          segmentPoints: winningSegment.points
        }
      })

      if (error) {
        console.error('Game session error:', error)
        toast({
          title: 'エラー',
          description: 'ゲーム結果の保存に失敗しました',
          variant: 'destructive'
        })
        setGameState(prev => ({ ...prev, status: 'ready' }))
        return
      }

      if (!data.success) {
        toast({
          title: '制限エラー',
          description: data.error || 'ゲームをプレイできませんでした',
          variant: 'destructive'
        })
        setGameState(prev => ({ ...prev, status: 'ready' }))
        return
      }

      // Determine result message based on points
      let message: string
      if (pointsEarned >= 500) {
        message = '🎉 JACKPOT！超レアな大当たりです！'
      } else if (pointsEarned >= 100) {
        message = '🔥 BIG WIN！素晴らしい結果です！'
      } else if (pointsEarned >= 50) {
        message = '✨ GOOD！良い結果でした！'
      } else {
        message = '🎯 ナイストライ！次回に期待！'
      }

      setGameState(prev => ({
        ...prev,
        status: 'finished',
        result: {
          segment: winningSegment,
          pointsEarned: data.points_earned,
          message
        }
      }))

      toast({
        title: 'ルーレット完了！',
        description: `${data.points_earned}ポイントを獲得しました！`
      })

    } catch (error) {
      console.error('Error submitting roulette result:', error)
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive'
      })
      setGameState(prev => ({ ...prev, status: 'ready' }))
    }
  }

  const playAgain = () => {
    setGameState({
      status: 'ready',
      currentSegment: 0,
      finalSegment: null,
      result: null
    })
  }

  const exitGame = () => {
    onComplete()
  }

  if (gameState.status === 'finished' && gameState.result) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="achievement-glow">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-yellow-100 rounded-full w-fit">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">ルーレット完了！</CardTitle>
            <CardDescription>
              {gameState.result.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-3">結果</div>
              
              {/* Winning segment display */}
              <div 
                className="mx-auto w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4"
                style={{ backgroundColor: gameState.result.segment.color }}
              >
                {gameState.result.segment.label}
              </div>

              <div className="space-y-2">
                <div className="text-gray-600">当選セグメント</div>
                <div className="text-lg font-bold" style={{ color: gameState.result.segment.color }}>
                  {gameState.result.segment.label}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-gray-600">獲得ポイント</div>
                <div className="text-2xl font-bold text-green-600 points-glow">
                  {gameState.result.pointsEarned}pt
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={playAgain}
                className="flex-1"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                もう一度
              </Button>
              <Button 
                onClick={exitGame}
                className="flex-1 forest-gradient text-white"
              >
                ゲーム一覧
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle>{game.name}</CardTitle>
          <CardDescription>
            {game.instructions || 'ルーレットを回して運試し！'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Game Instructions */}
            <div className="bg-purple-50 rounded-lg p-4 text-sm">
              <h4 className="font-semibold text-purple-800 mb-2">ゲームルール</h4>
              <ul className="text-purple-700 space-y-1">
                <li>• ルーレットボタンをクリック</li>
                <li>• 止まったセグメントのポイント獲得</li>
                <li>• レアなセグメントほど高ポイント</li>
                <li>• 完全に運次第のゲーム</li>
              </ul>
            </div>

            {/* Roulette Wheel */}
            <div className="relative">
              <div 
                className={`mx-auto w-64 h-64 rounded-full border-4 border-gray-300 relative overflow-hidden ${
                  gameState.status === 'spinning' ? 'roulette-wheel' : ''
                }`}
              >
                {segments.map((segment, index) => {
                  const angle = (360 / segments.length) * index
                  const isActive = gameState.currentSegment === index
                  
                  return (
                    <div
                      key={segment.id}
                      className={`absolute w-1/2 h-1/2 origin-bottom-right transform transition-all duration-200 ${
                        isActive ? 'scale-105 z-10' : ''
                      }`}
                      style={{
                        transform: `rotate(${angle}deg)`,
                        backgroundColor: segment.color,
                        clipPath: 'polygon(0 100%, 100% 100%, 50% 0)',
                        right: '50%',
                        bottom: '50%'
                      }}
                    >
                      <div 
                        className="absolute text-white font-bold text-xs"
                        style={{
                          bottom: '20%',
                          right: '35%',
                          transform: `rotate(${-angle + 90}deg)`,
                          transformOrigin: 'center'
                        }}
                      >
                        {segment.label}
                      </div>
                    </div>
                  )
                })}
                
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-gray-400 z-20" />
                
                {/* Pointer */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gray-800 z-30" />
              </div>
            </div>

            {/* Probability Display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-800 mb-2 text-center">確率表</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {segments.map(segment => (
                  <div 
                    key={segment.id}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ backgroundColor: segment.color + '20' }}
                  >
                    <span className="font-semibold" style={{ color: segment.color }}>
                      {segment.label}
                    </span>
                    <span className="text-gray-600">
                      {(segment.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spin Button */}
            <Button 
              onClick={spinRoulette}
              disabled={gameState.status !== 'ready'}
              className="w-full forest-gradient text-white text-lg py-3"
            >
              {gameState.status === 'spinning' && '🎲 回転中...'}
              {gameState.status === 'loading' && '💾 保存中...'}
              {gameState.status === 'ready' && '🎯 ルーレットを回す'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}