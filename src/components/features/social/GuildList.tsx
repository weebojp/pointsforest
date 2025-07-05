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
  Crown, 
  Users, 
  Search, 
  Shield,
  Star,
  Plus,
  Settings,
  Activity,
  Trophy,
  Target
} from 'lucide-react'
import { Guild, GuildMember, GuildActivity, GuildSearchResult } from '@/types/social'
import { formatPoints, formatDate } from '@/lib/utils'

export function GuildList() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [currentGuild, setCurrentGuild] = useState<Guild | null>(null)
  const [guildMembers, setGuildMembers] = useState<GuildMember[]>([])
  const [guildActivities, setGuildActivities] = useState<GuildActivity[]>([])
  const [searchResults, setSearchResults] = useState<GuildSearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('my-guild')

  useEffect(() => {
    if (user) {
      loadCurrentGuild()
    }
  }, [user])

  const loadCurrentGuild = async () => {
    if (!user) return

    try {
      // Get user's current guild membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('guild_members')
        .select(`
          *,
          guild:guilds(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError
      }

      if (membershipData) {
        setCurrentGuild(membershipData.guild)
        await loadGuildMembers(membershipData.guild.id)
        await loadGuildActivities(membershipData.guild.id)
      }
    } catch (error) {
      console.error('Error loading current guild:', error)
    }
  }

  const loadGuildMembers = async (guildId: string) => {
    try {
      const { data, error } = await supabase
        .from('guild_members')
        .select(`
          *,
          user:users(
            username,
            display_name,
            level,
            last_seen_at
          )
        `)
        .eq('guild_id', guildId)
        .eq('status', 'active')
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true })

      if (error) throw error
      setGuildMembers(data || [])
    } catch (error) {
      console.error('Error loading guild members:', error)
    }
  }

  const loadGuildActivities = async (guildId: string) => {
    try {
      const { data, error } = await supabase
        .from('guild_activities')
        .select(`
          *,
          user:users(
            username,
            display_name
          )
        `)
        .eq('guild_id', guildId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setGuildActivities(data || [])
    } catch (error) {
      console.error('Error loading guild activities:', error)
    }
  }

  const searchGuilds = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('guilds')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('is_active', true)
        .eq('is_public', true)
        .limit(10)

      if (error) throw error

      const results: GuildSearchResult[] = (data || []).map(guild => ({
        id: guild.id,
        name: guild.name,
        slug: guild.slug,
        description: guild.description,
        member_count: guild.member_count,
        max_members: guild.max_members,
        guild_level: guild.guild_level,
        is_public: guild.is_public,
        join_policy: guild.join_policy,
        color_theme: guild.color_theme,
        can_join: guild.member_count < guild.max_members
      }))

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching guilds:', error)
      toast({
        title: 'エラー',
        description: 'ギルド検索に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const joinGuild = async (guildSlug: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('join_guild', {
        p_user_id: user.id,
        p_guild_slug: guildSlug
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '参加完了',
          description: data.message,
        })
        loadCurrentGuild()
        setActiveTab('my-guild')
      } else {
        toast({
          title: 'エラー',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error joining guild:', error)
      toast({
        title: 'エラー',
        description: 'ギルドへの参加に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'leader': return 'text-yellow-600 bg-yellow-100'
      case 'officer': return 'text-blue-600 bg-blue-100'
      case 'member': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader': return <Crown className="h-4 w-4" />
      case 'officer': return <Shield className="h-4 w-4" />
      case 'member': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            ギルド
          </CardTitle>
          <CardDescription>
            ギルドに参加してメンバーと一緒に活動しよう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my-guild">
                マイギルド
              </TabsTrigger>
              <TabsTrigger value="members">
                メンバー
              </TabsTrigger>
              <TabsTrigger value="search">
                ギルド検索
              </TabsTrigger>
            </TabsList>

            {/* My Guild Tab */}
            <TabsContent value="my-guild" className="space-y-4">
              {!currentGuild ? (
                <div className="text-center py-8 text-gray-500">
                  <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>まだギルドに参加していません</p>
                  <p className="text-sm">検索タブから新しいギルドを見つけよう！</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Guild Info */}
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{currentGuild.name}</h3>
                        <p className="text-gray-600 mt-1">{currentGuild.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {currentGuild.member_count}/{currentGuild.max_members}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            レベル {currentGuild.guild_level}
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            {formatPoints(currentGuild.total_points)}pt
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {currentGuild.join_policy === 'open' ? '公開' : '承認制'}
                      </Badge>
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5" />
                        最近のアクティビティ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {guildActivities.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          まだアクティビティがありません
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {guildActivities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Activity className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{activity.title}</p>
                                <p className="text-sm text-gray-600">
                                  {activity.user?.display_name || activity.user?.username} • {formatDate(activity.created_at)}
                                </p>
                              </div>
                              {activity.points_involved > 0 && (
                                <Badge variant="outline" className="text-green-600">
                                  +{formatPoints(activity.points_involved)}pt
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              {!currentGuild ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ギルドに参加していません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">メンバー一覧 ({guildMembers.length})</h3>
                  </div>
                  {guildMembers.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(member.user?.display_name || member.user?.username || 'U')[0].toUpperCase()}
                          </div>
                          {member.role === 'leader' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Crown className="h-2 w-2 text-yellow-800" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {member.user?.display_name || member.user?.username}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Star className="h-3 w-3" />
                            レベル {member.user?.level}
                            <span className="mx-1">•</span>
                            貢献 {formatPoints(member.points_contributed)}pt
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role === 'leader' ? 'リーダー' : 
                             member.role === 'officer' ? 'オフィサー' : 'メンバー'}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="ギルド名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchGuilds()}
                />
                <Button onClick={searchGuilds} disabled={loading}>
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
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: result.color_theme }}
                        >
                          {result.name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{result.name}</div>
                          <div className="text-sm text-gray-600">
                            {result.description}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {result.member_count}/{result.max_members}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Lv.{result.guild_level}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {result.join_policy === 'open' ? '自由参加' : '承認制'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        {currentGuild ? (
                          <Badge variant="outline">
                            既に参加中
                          </Badge>
                        ) : result.can_join ? (
                          <Button 
                            size="sm"
                            onClick={() => joinGuild(result.slug)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            参加
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            定員満了
                          </Badge>
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