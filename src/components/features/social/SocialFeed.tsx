'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Heart, 
  MessageSquare, 
  Share,
  Trophy,
  TrendingUp,
  Users,
  Star,
  Crown,
  Target,
  Zap,
  Plus,
  Send
} from 'lucide-react'
import { SocialPost } from '@/types/social'
import { formatDate, formatPoints } from '@/lib/utils'

export function SocialFeed() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState('feed')

  useEffect(() => {
    if (user) {
      loadSocialFeed()
    }
  }, [user])

  const loadSocialFeed = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          user:users(
            username,
            display_name,
            level
          ),
          achievement:achievements(
            name,
            description,
            rarity,
            badge_image_url
          )
        `)
        .in('visibility', ['public', 'friends'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Check if user has liked each post
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .single()

          return {
            ...post,
            is_liked: !!likeData
          }
        })
      )

      setPosts(postsWithLikes)
    } catch (error) {
      console.error('Error loading social feed:', error)
      toast({
        title: 'エラー',
        description: 'フィードの読み込みに失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!user || !newPostContent.trim()) return

    setPosting(true)
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: newPostContent.trim(),
          post_type: 'status',
          visibility: 'friends'
        })
        .select(`
          *,
          user:users(
            username,
            display_name,
            level
          )
        `)
        .single()

      if (error) throw error

      setPosts(prev => [{ ...data, is_liked: false }, ...prev])
      setNewPostContent('')

      toast({
        title: '投稿完了',
        description: '投稿を作成しました',
      })
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: 'エラー',
        description: '投稿の作成に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    if (!user) return

    try {
      if (isCurrentlyLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        // Update local state
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
              : post
          )
        )
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        // Update local state
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'achievement': return <Trophy className="h-5 w-5 text-yellow-600" />
      case 'level_up': return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'system': return <Star className="h-5 w-5 text-purple-600" />
      default: return <MessageSquare className="h-5 w-5 text-gray-600" />
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ソーシャルフィード
          </CardTitle>
          <CardDescription>
            コミュニティの最新アクティビティをチェックしよう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feed">
                フィード
              </TabsTrigger>
              <TabsTrigger value="create">
                投稿作成
              </TabsTrigger>
            </TabsList>

            {/* Feed Tab */}
            <TabsContent value="feed" className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                  <p>フィードを読み込み中...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>まだ投稿がありません</p>
                  <p className="text-sm">コミュニティの最初の投稿をしてみよう！</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="border-l-4 border-l-blue-400">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(post.user.display_name || post.user.username)[0].toUpperCase()}
                          </div>
                          
                          <div className="flex-1">
                            {/* Post Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                {post.user.display_name || post.user.username}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                レベル {post.user.level}
                              </Badge>
                              {getPostIcon(post.post_type)}
                              <span className="text-sm text-gray-500">
                                {formatDate(post.created_at)}
                              </span>
                            </div>

                            {/* Post Content */}
                            <div className="space-y-3">
                              {post.content && (
                                <p className="text-gray-800">{post.content}</p>
                              )}

                              {/* Achievement Display */}
                              {post.post_type === 'achievement' && post.achievement && (
                                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                  <div className="flex items-center gap-3">
                                    <Trophy className="h-8 w-8 text-yellow-600" />
                                    <div>
                                      <p className="font-semibold text-yellow-800">
                                        実績解除: {post.achievement.name}
                                      </p>
                                      <p className="text-sm text-yellow-700">
                                        {post.achievement.description}
                                      </p>
                                      <Badge 
                                        variant="outline" 
                                        className={`mt-1 ${getRarityColor(post.achievement.rarity)}`}
                                      >
                                        {post.achievement.rarity}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Level Up Display */}
                              {post.post_type === 'level_up' && (
                                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center gap-3">
                                    <TrendingUp className="h-8 w-8 text-blue-600" />
                                    <div>
                                      <p className="font-semibold text-blue-800">
                                        レベルアップ！
                                      </p>
                                      <p className="text-sm text-blue-700">
                                        レベル {post.user.level} に到達しました
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Post Actions */}
                            <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLike(post.id, post.is_liked || false)}
                                className={post.is_liked ? 'text-red-600' : 'text-gray-600'}
                              >
                                <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                                {post.likes_count || 0}
                              </Button>
                              
                              <Button variant="ghost" size="sm" disabled>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {post.comments_count || 0}
                              </Button>
                              
                              <Button variant="ghost" size="sm" disabled>
                                <Share className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Create Post Tab */}
            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    新しい投稿
                  </CardTitle>
                  <CardDescription>
                    コミュニティに投稿を共有しよう
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {profile?.display_name?.[0] || profile?.username?.[0] || 'U'}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="今何してる？コミュニティとシェアしよう..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows={4}
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {newPostContent.length}/500
                        </span>
                        <Button 
                          onClick={createPost}
                          disabled={posting || !newPostContent.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          投稿する
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">あなたの統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Star className="h-6 w-6 mx-auto text-green-600 mb-1" />
                      <p className="text-sm text-gray-600">レベル</p>
                      <p className="text-xl font-bold text-green-600">{profile?.level || 1}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Target className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-sm text-gray-600">ポイント</p>
                      <p className="text-xl font-bold text-blue-600">{formatPoints(profile?.points || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <Zap className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                      <p className="text-sm text-gray-600">ストリーク</p>
                      <p className="text-xl font-bold text-orange-600">{profile?.login_streak || 0}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Crown className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                      <p className="text-sm text-gray-600">投稿数</p>
                      <p className="text-xl font-bold text-purple-600">
                        {posts.filter(p => p.user_id === user?.id).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}