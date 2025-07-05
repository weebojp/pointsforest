'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  UserPlus, 
  Search, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  XCircle,
  UserX,
  Star
} from 'lucide-react'
import { Friend, FriendRequest, UserSearchResult } from '@/types/social'
import { formatDate } from '@/lib/utils'

export function FriendsList() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('friends')

  useEffect(() => {
    if (user) {
      loadFriends()
      loadFriendRequests()
    }
  }, [user])

  const loadFriends = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('get_user_friends', {
        p_user_id: user.id
      })

      if (error) throw error
      setFriends(data || [])
    } catch (error) {
      console.error('Error loading friends:', error)
      toast({
        title: 'エラー',
        description: 'フレンド一覧の取得に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const loadFriendRequests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          requested_at,
          requester:users!friendships_requester_id_fkey(
            id,
            username,
            display_name,
            level
          )
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      if (error) throw error

      const requests: FriendRequest[] = (data || []).map(item => ({
        id: item.id,
        requester: {
          id: item.requester.id,
          username: item.requester.username,
          display_name: item.requester.display_name,
          level: item.requester.level
        },
        requested_at: item.requested_at
      }))

      setFriendRequests(requests)
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, level')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10)

      if (error) throw error

      const results: UserSearchResult[] = (data || []).map(user => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        level: user.level,
        friendship_status: 'none' // Will be updated with actual status
      }))

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
      toast({
        title: 'エラー',
        description: 'ユーザー検索に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_requester_id: user.id,
        p_addressee_id: addresseeId
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '送信完了',
          description: 'フレンドリクエストを送信しました',
        })
        // Update search results to reflect sent request
        setSearchResults(results => 
          results.map(result => 
            result.id === addresseeId 
              ? { ...result, friendship_status: 'pending_sent' }
              : result
          )
        )
      } else {
        toast({
          title: 'エラー',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast({
        title: 'エラー',
        description: 'フレンドリクエストの送信に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const acceptFriendRequest = async (requesterId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        p_user_id: user.id,
        p_requester_id: requesterId
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '承諾完了',
          description: 'フレンドリクエストを承諾しました',
        })
        loadFriends()
        loadFriendRequests()
      } else {
        toast({
          title: 'エラー',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast({
        title: 'エラー',
        description: 'フレンドリクエストの承諾に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', friendshipId)

      if (error) throw error

      toast({
        title: '拒否完了',
        description: 'フレンドリクエストを拒否しました',
      })
      loadFriendRequests()
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast({
        title: 'エラー',
        description: 'フレンドリクエストの拒否に失敗しました',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            フレンド
          </CardTitle>
          <CardDescription>
            フレンドと一緒にゲームを楽しもう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends">
                フレンド ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                リクエスト ({friendRequests.length})
              </TabsTrigger>
              <TabsTrigger value="search">
                検索
              </TabsTrigger>
            </TabsList>

            {/* Friends List */}
            <TabsContent value="friends" className="space-y-4">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>まだフレンドがいません</p>
                  <p className="text-sm">検索タブから新しいフレンドを見つけよう！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div 
                      key={friend.user_id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(friend.display_name || friend.username)[0].toUpperCase()}
                          </div>
                          {friend.is_online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {friend.display_name || friend.username}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Star className="h-3 w-3" />
                            レベル {friend.level}
                            <span className="mx-1">•</span>
                            フレンド歴 {formatDate(friend.friendship_since)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {friend.is_online ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            オンライン
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            オフライン
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Friend Requests */}
            <TabsContent value="requests" className="space-y-4">
              {friendRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>フレンドリクエストはありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {(request.requester.display_name || request.requester.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {request.requester.display_name || request.requester.username}
                          </div>
                          <div className="text-sm text-gray-600">
                            レベル {request.requester.level} • {formatDate(request.requested_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => acceptFriendRequest(request.requester.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          承諾
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => rejectFriendRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒否
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* User Search */}
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="ユーザー名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div 
                      key={result.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {(result.display_name || result.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {result.display_name || result.username}
                          </div>
                          <div className="text-sm text-gray-600">
                            レベル {result.level}
                          </div>
                        </div>
                      </div>
                      <div>
                        {result.friendship_status === 'pending_sent' ? (
                          <Badge variant="outline">
                            リクエスト送信済み
                          </Badge>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => sendFriendRequest(result.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            フレンド申請
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}