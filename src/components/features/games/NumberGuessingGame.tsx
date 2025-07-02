'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Trophy, RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { Game } from '@/types/user'

interface NumberGuessingGameProps {
  game: Game
  onComplete: () => void
}

interface GameState {
  status: 'playing' | 'finished' | 'loading'
  guess: number
  targetNumber: number
  result: {
    score: number
    pointsEarned: number
    message: string
  } | null
}

export function NumberGuessingGame({ game, onComplete }: NumberGuessingGameProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [gameState, setGameState] = useState<GameState>({
    status: 'playing',
    guess: 50,
    targetNumber: Math.floor(Math.random() * 100) + 1,
    result: null
  })

  const calculateScore = useCallback((guess: number, target: number): number => {
    return Math.max(1, 100 - Math.abs(guess - target))
  }, [])

  const handleSubmit = async () => {
    if (!user || gameState.status !== 'playing') return

    setGameState(prev => ({ ...prev, status: 'loading' }))

    try {
      const score = calculateScore(gameState.guess, gameState.targetNumber)
      const pointsEarned = score

      // Submit to backend
      const { data, error } = await supabase.rpc('handle_game_session', {
        p_user_id: user.id,
        p_game_id: game.id,
        p_score: score,
        p_points_earned: pointsEarned,
        p_metadata: {
          guess: gameState.guess,
          target: gameState.targetNumber,
          accuracy: score
        }
      })

      if (error) {
        console.error('Game session error:', error)
        toast({
          title: 'エラー',
          description: 'ゲーム結果の保存に失敗しました',
          variant: 'destructive'
        })
        setGameState(prev => ({ ...prev, status: 'playing' }))
        return
      }

      if (!data.success) {
        toast({
          title: '制限エラー',
          description: data.error || 'ゲームをプレイできませんでした',
          variant: 'destructive'
        })
        setGameState(prev => ({ ...prev, status: 'playing' }))
        return
      }

      // Determine result message
      let message: string
      if (gameState.guess === gameState.targetNumber) {
        message = '🎯 パーフェクト！完璧な予想です！'
      } else if (Math.abs(gameState.guess - gameState.targetNumber) <= 5) {
        message = '🔥 素晴らしい！とても近い予想でした！'
      } else if (Math.abs(gameState.guess - gameState.targetNumber) <= 15) {
        message = '👍 良い予想！まずまずの結果です！'
      } else {
        message = '📝 次回頑張りましょう！'
      }

      setGameState(prev => ({
        ...prev,
        status: 'finished',
        result: {
          score,
          pointsEarned: data.points_earned,
          message
        }
      }))

      toast({
        title: 'ゲーム完了！',
        description: `${data.points_earned}ポイントを獲得しました！`
      })

    } catch (error) {
      console.error('Error submitting game:', error)
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive'
      })
      setGameState(prev => ({ ...prev, status: 'playing' }))
    }
  }

  const playAgain = () => {
    setGameState({
      status: 'playing',
      guess: 50,
      targetNumber: Math.floor(Math.random() * 100) + 1,
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
            <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">ゲーム終了！</CardTitle>
            <CardDescription>
              {gameState.result.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">結果</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">あなたの予想</div>
                  <div className="text-lg font-bold text-blue-600">{gameState.guess}</div>
                </div>
                <div>
                  <div className="text-gray-600">正解</div>
                  <div className="text-lg font-bold text-green-600">{gameState.targetNumber}</div>
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
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>{game.name}</CardTitle>
          <CardDescription>
            {game.instructions || '1から100の数字を予想してください'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Game Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <h4 className="font-semibold text-blue-800 mb-2">ゲームルール</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• 1から100の間の数字を予想</li>
                <li>• 正解に近いほど高得点</li>
                <li>• 完全一致で100ポイント</li>
                <li>• 計算式: 100 - |予想 - 正解|</li>
              </ul>
            </div>

            {/* Input */}
            <div className="space-y-3">
              <Label htmlFor="guess" className="text-base">
                あなたの予想 (1-100)
              </Label>
              <Input
                id="guess"
                type="number"
                min="1"
                max="100"
                value={gameState.guess}
                onChange={(e) => setGameState(prev => ({ 
                  ...prev, 
                  guess: Math.max(1, Math.min(100, Number(e.target.value) || 1))
                }))}
                disabled={gameState.status === 'loading'}
                className="text-center text-lg font-bold"
              />
              
              {/* Range slider for better UX */}
              <input
                type="range"
                min="1"
                max="100"
                value={gameState.guess}
                onChange={(e) => setGameState(prev => ({ 
                  ...prev, 
                  guess: Number(e.target.value)
                }))}
                disabled={gameState.status === 'loading'}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span className="font-semibold">現在: {gameState.guess}</span>
                <span>100</span>
              </div>
            </div>

            {/* Estimated Score Preview */}
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-sm text-green-700 mb-1">予想得点レンジ</div>
              <div className="text-green-800 font-semibold">
                最低: 1pt ～ 最高: 100pt
              </div>
              <div className="text-xs text-green-600 mt-1">
                実際の得点は正解との差で決まります
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={gameState.status === 'loading'}
              className="w-full forest-gradient text-white text-lg py-3"
            >
              {gameState.status === 'loading' ? '処理中...' : '予想を送信'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}