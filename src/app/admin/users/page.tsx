'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth, withAdminAuth } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Ban, 
  UnlockIcon,
  Coins,
  Calendar,
  Crown,
  ArrowUpDown,
  Download,
  RefreshCw
} from 'lucide-react'

interface User {
  id: string
  email: string
  username: string
  display_name: string
  points: number
  level: number
  experience: number
  login_streak: number
  last_login_at: string | null
  is_premium: boolean
  created_at: string
}

interface SearchParams {
  searchTerm: string
  minPoints: string
  maxPoints: string
  minLevel: string
  maxLevel: string
  isPremium: boolean | null
}

function UserManagement() {
  const { admin } = useAdminAuth()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchTerm: '',
    minPoints: '',
    maxPoints: '',
    minLevel: '',
    maxLevel: '',
    isPremium: null
  })
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  
  // 選択されたユーザー
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPointAdjustment, setShowPointAdjustment] = useState(false)
  const [pointAdjustment, setPointAdjustment] = useState({
    amount: '',
    reason: ''
  })

  useEffect(() => {
    searchUsers()
  }, [currentPage, searchParams])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('admin_search_users', {
        p_search_term: searchParams.searchTerm || null,
        p_min_points: searchParams.minPoints ? parseInt(searchParams.minPoints) : null,
        p_max_points: searchParams.maxPoints ? parseInt(searchParams.maxPoints) : null,
        p_min_level: searchParams.minLevel ? parseInt(searchParams.minLevel) : null,
        p_max_level: searchParams.maxLevel ? parseInt(searchParams.maxLevel) : null,
        p_is_premium: searchParams.isPremium,
        p_limit: pageSize,
        p_offset: (currentPage - 1) * pageSize
      })

      if (error) throw error

      if (data && data.length > 0) {
        setUsers(data)
        setTotalCount(data[0].total_count)
      } else {
        setUsers([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Failed to search users:', error)
      toast({
        title: 'エラー',
        description: 'ユーザー検索に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePointAdjustment = async () => {
    if (!selectedUser || !pointAdjustment.amount || !pointAdjustment.reason) {
      toast({
        title: 'エラー',
        description: '金額と理由を入力してください',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data, error } = await supabase.rpc('admin_adjust_user_points', {
        p_user_id: selectedUser.id,
        p_amount: parseInt(pointAdjustment.amount),
        p_reason: pointAdjustment.reason,
        p_admin_user_id: admin?.id
      })

      if (error) throw error

      toast({
        title: 'ポイント調整完了',
        description: `${selectedUser.username}のポイントを${pointAdjustment.amount}ポイント調整しました`,
      })

      setShowPointAdjustment(false)
      setPointAdjustment({ amount: '', reason: '' })
      setSelectedUser(null)
      searchUsers() // リストを更新
    } catch (error) {
      console.error('Failed to adjust points:', error)
      toast({
        title: 'エラー',
        description: 'ポイント調整に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未記録'
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPoints = (points: number) => {
    return points.toLocaleString() + 'pt'
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
              <p className="text-gray-600 mt-1">登録ユーザーの管理とポイント調整</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={searchUsers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                更新
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                エクスポート
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              検索・フィルター
            </CardTitle>
            <CardDescription>
              ユーザーを検索・フィルタリングできます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Label>検索キーワード</Label>
                <Input
                  placeholder="メール、ユーザー名、表示名"
                  value={searchParams.searchTerm}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
              <div>
                <Label>最小ポイント</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={searchParams.minPoints}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, minPoints: e.target.value }))}
                />
              </div>
              <div>
                <Label>最大ポイント</Label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={searchParams.maxPoints}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, maxPoints: e.target.value }))}
                />
              </div>
              <div>
                <Label>最小レベル</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={searchParams.minLevel}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, minLevel: e.target.value }))}
                />
              </div>
              <div>
                <Label>最大レベル</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={searchParams.maxLevel}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, maxLevel: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSearchParams(prev => ({ ...prev, isPremium: null }))}
                  className={`px-3 py-1 rounded text-sm ${
                    searchParams.isPremium === null ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setSearchParams(prev => ({ ...prev, isPremium: true }))}
                  className={`px-3 py-1 rounded text-sm ${
                    searchParams.isPremium === true ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                  }`}
                >
                  プレミアムのみ
                </button>
                <button
                  onClick={() => setSearchParams(prev => ({ ...prev, isPremium: false }))}
                  className={`px-3 py-1 rounded text-sm ${
                    searchParams.isPremium === false ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                  }`}
                >
                  無料ユーザーのみ
                </button>
              </div>
              <Button onClick={searchUsers} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                検索
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ユーザーテーブル */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>ユーザー一覧</CardTitle>
                <CardDescription>
                  {totalCount}人のユーザー (ページ {currentPage} / {totalPages})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ユーザー情報</TableHead>
                    <TableHead>ポイント</TableHead>
                    <TableHead>レベル</TableHead>
                    <TableHead>ストリーク</TableHead>
                    <TableHead>最終ログイン</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        読み込み中...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        ユーザーが見つかりませんでした
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            {user.display_name && (
                              <div className="text-sm text-gray-500">表示名: {user.display_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {formatPoints(user.points)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Lv.{user.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-orange-500" />
                            {user.login_streak}日
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.last_login_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {user.is_premium && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Crown className="h-3 w-3 mr-1" />
                                プレミアム
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              アクティブ
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>操作</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowPointAdjustment(true)
                                }}
                              >
                                <Coins className="h-4 w-4 mr-2" />
                                ポイント調整
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                詳細編集
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Ban className="h-4 w-4 mr-2" />
                                アカウント停止
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  {totalCount}件中 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}件を表示
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    次へ
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ポイント調整ダイアログ */}
      <Dialog open={showPointAdjustment} onOpenChange={setShowPointAdjustment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ポイント調整</DialogTitle>
            <DialogDescription>
              {selectedUser?.username} のポイントを調整します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>現在のポイント</Label>
              <div className="text-2xl font-bold text-blue-600">
                {selectedUser ? formatPoints(selectedUser.points) : '0pt'}
              </div>
            </div>
            <div>
              <Label>調整量</Label>
              <Input
                type="number"
                placeholder="正の値で増加、負の値で減少"
                value={pointAdjustment.amount}
                onChange={(e) => setPointAdjustment(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>理由</Label>
              <Input
                placeholder="調整理由を入力してください"
                value={pointAdjustment.reason}
                onChange={(e) => setPointAdjustment(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPointAdjustment(false)}>
                キャンセル
              </Button>
              <Button onClick={handlePointAdjustment}>
                調整実行
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAdminAuth(UserManagement, 'users.view')