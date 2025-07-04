'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { formatPoints } from '@/lib/utils'
import { GamepadIcon, Play, Pause, Edit, TrendingUp, Settings, BarChart3, Users, Clock, Trophy } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface GameConfig {
  id: string
  name: string
  type: 'number_guess' | 'roulette' | 'slot_machine' | 'memory_card'
  is_active: boolean
  daily_limit: number
  point_reward_min: number
  point_reward_max: number
  config: any
  created_at: string
}

interface GameStats {
  game_id: string
  game_name: string
  total_plays: number
  total_players: number
  total_points_awarded: number
  average_score: number
  average_session_duration: number
  daily_plays: number
  weekly_plays: number
  monthly_plays: number
}

interface GameSession {
  id: string
  user_id: string
  game_id: string
  score: number
  points_earned: number
  duration_seconds: number
  created_at: string
  users: {
    username: string
    email: string
  }
  games: {
    name: string
    type: string
  }
}

export default function GamesManagementPage() {
  const { admin, loading } = useAdminAuth()
  const [games, setGames] = useState<GameConfig[]>([])
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    if (admin && !loading) {
      fetchData()
    }
  }, [admin, loading])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchGames(),
        fetchGameStats(),
        fetchSessions()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching games:', error)
      return
    }

    setGames(data || [])
  }

  const fetchGameStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_game_stats')
      if (error) throw error
      setGameStats(data || [])
    } catch (error) {
      console.error('Error fetching game stats:', error)
      // フォールバック: 基本的な統計を計算
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select(`
          *,
          games(name, type)
        `)
      
      if (sessions) {
        const stats = sessions.reduce((acc: any, session: any) => {
          const gameId = session.game_id
          if (!acc[gameId]) {
            acc[gameId] = {
              game_id: gameId,
              game_name: session.games.name,
              total_plays: 0,
              total_players: new Set(),
              total_points_awarded: 0,
              total_score: 0,
              total_duration: 0
            }
          }
          acc[gameId].total_plays++
          acc[gameId].total_players.add(session.user_id)
          acc[gameId].total_points_awarded += session.points_earned || 0
          acc[gameId].total_score += session.score || 0
          acc[gameId].total_duration += session.duration_seconds || 0
          return acc
        }, {})
        
        const formattedStats = Object.values(stats).map((stat: any) => ({
          ...stat,
          total_players: stat.total_players.size,
          average_score: stat.total_plays > 0 ? stat.total_score / stat.total_plays : 0,
          average_session_duration: stat.total_plays > 0 ? stat.total_duration / stat.total_plays : 0,
          daily_plays: 0,
          weekly_plays: 0,
          monthly_plays: 0
        }))
        
        setGameStats(formattedStats)
      }
    }
  }

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        users!inner(username, email),
        games!inner(name, type)
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Error fetching sessions:', error)
      return
    }

    setSessions(data || [])
  }

  const handleGameToggle = async (gameId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ is_active: isActive })
        .eq('id', gameId)

      if (error) throw error

      toast.success(`ゲームを${isActive ? '有効' : '無効'}にしました`)
      fetchGames()
    } catch (error) {
      console.error('Error updating game:', error)
      toast.error('ゲームの更新に失敗しました')
    }
  }

  const handleGameUpdate = async () => {
    if (!selectedGame) return

    try {
      const { error } = await supabase
        .from('games')
        .update({
          name: selectedGame.name,
          daily_limit: selectedGame.daily_limit,
          point_reward_min: selectedGame.point_reward_min,
          point_reward_max: selectedGame.point_reward_max,
          config: selectedGame.config,
          is_active: selectedGame.is_active
        })
        .eq('id', selectedGame.id)

      if (error) throw error

      toast.success('ゲーム設定が更新されました')
      setIsEditOpen(false)
      setSelectedGame(null)
      fetchGames()
    } catch (error) {
      console.error('Error updating game:', error)
      toast.error('ゲーム設定の更新に失敗しました')
    }
  }

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case 'number_guess': return '数字当てゲーム'
      case 'roulette': return 'ルーレットゲーム'
      case 'slot_machine': return 'スロットマシン'
      case 'memory_card': return 'メモリーカードゲーム'
      default: return type
    }
  }

  const paginatedSessions = sessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sessions.length / itemsPerPage)

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ゲーム管理</h1>
          <p className="text-muted-foreground mt-1">ゲームの設定と統計を管理</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="games">ゲーム設定</TabsTrigger>
          <TabsTrigger value="sessions">セッション履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総プレイ数</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gameStats.reduce((sum, stat) => sum + stat.total_plays, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総プレイヤー数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gameStats.reduce((sum, stat) => sum + stat.total_players, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総獲得ポイント</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPoints(gameStats.reduce((sum, stat) => sum + stat.total_points_awarded, 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均セッション時間</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(gameStats.reduce((sum, stat) => sum + stat.average_session_duration, 0) / gameStats.length || 0)}s
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ゲーム別統計</CardTitle>
              <CardDescription>各ゲームのパフォーマンス概要</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ゲーム</TableHead>
                    <TableHead>総プレイ数</TableHead>
                    <TableHead>プレイヤー数</TableHead>
                    <TableHead>獲得ポイント</TableHead>
                    <TableHead>平均スコア</TableHead>
                    <TableHead>平均時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameStats.map((stat) => (
                    <TableRow key={stat.game_id}>
                      <TableCell className="font-medium">{stat.game_name}</TableCell>
                      <TableCell>{stat.total_plays.toLocaleString()}</TableCell>
                      <TableCell>{stat.total_players.toLocaleString()}</TableCell>
                      <TableCell>{formatPoints(stat.total_points_awarded)}</TableCell>
                      <TableCell>{Math.round(stat.average_score)}</TableCell>
                      <TableCell>{Math.round(stat.average_session_duration)}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ゲーム設定</CardTitle>
              <CardDescription>各ゲームの設定を管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ゲーム名</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>1日制限</TableHead>
                    <TableHead>ポイント範囲</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.name}</TableCell>
                      <TableCell>{getGameTypeLabel(game.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={game.is_active}
                            onCheckedChange={(checked) => handleGameToggle(game.id, checked)}
                          />
                          <Badge variant={game.is_active ? 'default' : 'secondary'}>
                            {game.is_active ? '有効' : '無効'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{game.daily_limit}回</TableCell>
                      <TableCell>
                        {formatPoints(game.point_reward_min)} - {formatPoints(game.point_reward_max)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGame(game)
                            setIsEditOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>セッション履歴</CardTitle>
              <CardDescription>
                {sessions.length} 件のセッション（{totalPages} ページ中 {currentPage} ページ）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日時</TableHead>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>ゲーム</TableHead>
                    <TableHead>スコア</TableHead>
                    <TableHead>獲得ポイント</TableHead>
                    <TableHead>プレイ時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(session.created_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.users.username}</div>
                          <div className="text-sm text-muted-foreground">{session.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.games.name}</div>
                          <div className="text-sm text-muted-foreground">{getGameTypeLabel(session.games.type)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{session.score || 0}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        +{formatPoints(session.points_earned || 0)}
                      </TableCell>
                      <TableCell>{session.duration_seconds || 0}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    前のページ
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    次のページ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ゲーム設定編集</DialogTitle>
            <DialogDescription>
              ゲームの設定を変更します。
            </DialogDescription>
          </DialogHeader>
          {selectedGame && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ゲーム名</Label>
                  <Input
                    value={selectedGame.name}
                    onChange={(e) => setSelectedGame({...selectedGame, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>1日制限</Label>
                  <Input
                    type="number"
                    value={selectedGame.daily_limit}
                    onChange={(e) => setSelectedGame({...selectedGame, daily_limit: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>最小ポイント</Label>
                  <Input
                    type="number"
                    value={selectedGame.point_reward_min}
                    onChange={(e) => setSelectedGame({...selectedGame, point_reward_min: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>最大ポイント</Label>
                  <Input
                    type="number"
                    value={selectedGame.point_reward_max}
                    onChange={(e) => setSelectedGame({...selectedGame, point_reward_max: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedGame.is_active}
                  onCheckedChange={(checked) => setSelectedGame({...selectedGame, is_active: checked})}
                />
                <Label>ゲームを有効にする</Label>
              </div>
              <Button onClick={handleGameUpdate} className="w-full">
                設定を更新
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}