'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Gamepad2, ArrowLeft, Clock, Target, Zap, Coins } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { Game } from '@/types/user'

// Lazy load game components for better performance
const NumberGuessingGame = lazy(() => import('@/components/features/games/NumberGuessingGame').then(module => ({ default: module.NumberGuessingGame })))
const RouletteGame = lazy(() => import('@/components/features/games/RouletteGame').then(module => ({ default: module.RouletteGame })))
const SlotMachineGame = lazy(() => import('@/components/features/games/SlotMachineGame'))

export default function GamesPage() {
  const { user, loading: authLoading } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [dailyLimits, setDailyLimits] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchGames()
      fetchDailyLimits()
    }
  }, [user, authLoading, router])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching games:', error)
        return
      }

      setGames(data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyLimits = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_id')
        .eq('user_id', user.id)
        .gte('created_at', today)

      if (error) {
        console.error('Error fetching daily limits:', error)
        return
      }

      // Count games played today by game_id
      const limits: Record<string, number> = {}
      data?.forEach(session => {
        limits[session.game_id] = (limits[session.game_id] || 0) + 1
      })

      setDailyLimits(limits)
    } catch (error) {
      console.error('Error fetching daily limits:', error)
    }
  }

  const onGameComplete = () => {
    // Refresh daily limits after game completion
    fetchDailyLimits()
    setSelectedGame(null)
  }

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'number_guess':
        return <Target className="h-6 w-6" />
      case 'roulette':
        return <Zap className="h-6 w-6" />
      case 'slot_machine':
        return <Coins className="h-6 w-6" />
      default:
        return <Gamepad2 className="h-6 w-6" />
    }
  }

  const getRemainingPlays = (game: Game) => {
    const played = dailyLimits[game.id] || 0
    return Math.max(0, game.daily_limit - played)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Trees className="h-12 w-12 mx-auto text-green-600 animate-pulse mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedGame(null)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              ゲーム一覧に戻る
            </Button>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Trees className="h-8 w-8 text-green-600 animate-pulse mr-2" />
              <span className="text-gray-600">ゲームを読み込んでいます...</span>
            </div>
          }>
            {selectedGame.type === 'number_guess' && (
              <NumberGuessingGame 
                game={selectedGame} 
                onComplete={onGameComplete}
              />
            )}

            {selectedGame.type === 'roulette' && (
              <RouletteGame 
                game={selectedGame} 
                onComplete={onGameComplete}
              />
            )}

            {selectedGame.type === 'slot_machine' && (
              <SlotMachineGame />
            )}
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trees className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ゲーム一覧</h1>
                <p className="text-sm text-gray-600">
                  ミニゲームでポイントを獲得しよう！
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ダッシュボード
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {games.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gamepad2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">利用可能なゲームがありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
              const remainingPlays = getRemainingPlays(game)
              const canPlay = remainingPlays > 0

              return (
                <Card 
                  key={game.id} 
                  className={`game-card-hover ${!canPlay ? 'opacity-75' : ''}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          {getGameIcon(game.type)}
                        </div>
                        {game.name}
                      </div>
                      {game.is_beta && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          BETA
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {game.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-500" />
                          <span>今日の残り回数</span>
                        </div>
                        <span className={`font-semibold ${canPlay ? 'text-green-600' : 'text-red-600'}`}>
                          {remainingPlays}/{game.daily_limit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>ポイント範囲</span>
                        <span className="font-semibold text-blue-600">
                          {game.min_points} - {game.max_points}pt
                        </span>
                      </div>

                      <Button 
                        onClick={() => setSelectedGame(game)}
                        disabled={!canPlay}
                        className={`w-full ${canPlay ? 'forest-gradient text-white' : ''}`}
                        variant={canPlay ? 'default' : 'outline'}
                      >
                        {canPlay ? 'プレイする' : '本日の上限に達しました'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Standalone Slot Machine */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            🎰 スペシャルゲーム
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  🎰 森のスロット
                  <span className="text-sm bg-yellow-500 text-white px-2 py-1 rounded-full">
                    NEW!
                  </span>
                </CardTitle>
                <CardDescription>
                  運試しのスロットマシン！3つ揃えて大当たりを狙おう！
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <Trees className="h-6 w-6 text-green-600 animate-pulse mr-2" />
                    <span className="text-gray-600">読み込み中...</span>
                  </div>
                }>
                  <SlotMachineGame />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ゲームについて</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">📊 ポイントシステム</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• ゲームの成績に応じてポイント獲得</li>
                  <li>• 高得点ほど多くのポイント</li>
                  <li>• 経験値も同時に獲得</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⏰ プレイ制限</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 各ゲームに日次プレイ上限あり</li>
                  <li>• 毎日午前0時にリセット</li>
                  <li>• プレミアム会員は制限緩和</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}