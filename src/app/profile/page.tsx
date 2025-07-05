'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Palette, 
  Frame,
  History,
  Trees,
  Crown,
  Sparkles,
  ShoppingBag,
  Edit2,
  Save,
  X,
  Trophy,
  TrendingUp,
  Target
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPoints, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { AvatarFrame, UserAvatarFrame, Purchase } from '@/types/avatar'
import type { UserRankInfo } from '@/types/rank'
import { AppHeader } from '@/components/layout/AppHeader'
import { RankDisplay } from '@/components/features/rank/RankDisplay'
import { useExperience } from '@/hooks/useExperience'

interface ProfileData {
  displayName: string
  bio: string
  isPublic: boolean
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const { getUserRankInfo } = useExperience()
  const [activeTab, setActiveTab] = useState('overview')
  const [dataLoading, setDataLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    isPublic: true
  })
  const [ownedFrames, setOwnedFrames] = useState<UserAvatarFrame[]>([])
  const [availableFrames, setAvailableFrames] = useState<AvatarFrame[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([])
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (profile) {
      setProfileData({
        displayName: profile.display_name || profile.username || '',
        bio: '', // Will be loaded from profile
        isPublic: true // Will be loaded from profile
      })
      fetchProfileData()
    }
  }, [user, profile, authLoading, router])

  const fetchProfileData = async () => {
    if (!user) return

    setDataLoading(true)
    try {
      // Fetch owned frames
      const { data: ownedData, error: ownedError } = await supabase
        .from('user_avatar_frames')
        .select(`
          *,
          frame:avatar_frames(*)
        `)
        .eq('user_id', user.id)

      if (ownedError) throw ownedError
      setOwnedFrames(ownedData || [])

      // Fetch all available frames
      const { data: framesData, error: framesError } = await supabase
        .from('avatar_frames')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (framesError) throw framesError
      setAvailableFrames(framesData || [])

      // Fetch purchase history
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (purchasesError) throw purchasesError
      setPurchaseHistory(purchasesData || [])

      // Fetch rank information
      const rankData = await getUserRankInfo(user.id)
      setRankInfo(rankData)

    } catch (error) {
      console.error('Error fetching profile data:', error)
      toast({
        title: 'エラー',
        description: 'プロフィールデータの取得に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setDataLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: profileData.displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setEditing(false)
      
      toast({
        title: '保存完了',
        description: 'プロフィールを更新しました',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'エラー',
        description: 'プロフィールの更新に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const handleEquipFrame = async (frameId: string) => {
    try {
      const { data, error } = await supabase.rpc('equip_avatar_frame', {
        p_user_id: user?.id,
        p_frame_id: frameId
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '装備完了',
          description: 'アバターフレームを装備しました',
        })
        await refreshProfile()
        await fetchProfileData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error equipping frame:', error)
      toast({
        title: 'エラー',
        description: 'フレームの装備に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const handlePurchaseFrame = async (frameId: string) => {
    try {
      const { data, error } = await supabase.rpc('purchase_avatar_frame', {
        p_user_id: user?.id,
        p_frame_id: frameId
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '購入完了',
          description: 'アバターフレームを購入しました！',
        })
        await refreshProfile()
        await fetchProfileData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error purchasing frame:', error)
      toast({
        title: 'エラー',
        description: 'フレームの購入に失敗しました',
        variant: 'destructive'
      })
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

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Trees className="h-12 w-12 mx-auto text-green-600 animate-pulse mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <AppHeader 
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'マイプロフィール', icon: User }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              プロフィール
            </TabsTrigger>
            <TabsTrigger value="rank" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              ランク
            </TabsTrigger>
            <TabsTrigger value="avatar" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              アバター
            </TabsTrigger>
            <TabsTrigger value="frames" className="flex items-center gap-2">
              <Frame className="h-4 w-4" />
              フレーム
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              履歴
            </TabsTrigger>
          </TabsList>

          {/* Profile Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      基本情報
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editing ? setEditing(false) : setEditing(true)}
                    >
                      {editing ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          キャンセル
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-4 w-4 mr-2" />
                          編集
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">表示名</Label>
                        <Input
                          id="displayName"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            displayName: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">自己紹介</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            bio: e.target.value
                          }))}
                          placeholder="自己紹介を入力してください"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleSaveProfile} className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>表示名</Label>
                        <p className="text-lg font-medium">{profile.display_name || profile.username}</p>
                      </div>
                      <div>
                        <Label>ユーザー名</Label>
                        <p className="text-gray-600">@{profile.username}</p>
                      </div>
                      <div>
                        <Label>自己紹介</Label>
                        <p className="text-gray-600">{profileData.bio || '自己紹介がまだ設定されていません'}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    統計情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatPoints(profile.points)}</p>
                      <p className="text-sm text-gray-600">総ポイント</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{profile.level}</p>
                      <p className="text-sm text-gray-600">レベル</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{profile.login_streak}</p>
                      <p className="text-sm text-gray-600">ログインストリーク</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{ownedFrames.length}</p>
                      <p className="text-sm text-gray-600">所有フレーム</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      登録日: {formatDate(profile.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rank Tab */}
          <TabsContent value="rank" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Current Rank Display */}
              {rankInfo && rankInfo.success && rankInfo.rank && (
                <RankDisplay
                  level={rankInfo.level || 1}
                  experience={rankInfo.experience || 0}
                  nextLevelExp={rankInfo.next_level_exp || 100}
                  rank={{
                    name: rankInfo.rank.name,
                    tier: rankInfo.rank.tier,
                    color_primary: rankInfo.rank.color_primary,
                    color_secondary: rankInfo.rank.color_secondary
                  }}
                />
              )}

              {/* Rank Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    ランク特典
                  </CardTitle>
                  <CardDescription>
                    現在のランクで利用できる特典一覧
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rankInfo?.rank?.benefits && (
                    <div className="space-y-3">
                      {rankInfo.rank.benefits.daily_bonus_multiplier && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm">デイリーボーナス倍率</span>
                          <span className="font-semibold text-blue-600">
                            x{rankInfo.rank.benefits.daily_bonus_multiplier}
                          </span>
                        </div>
                      )}
                      {rankInfo.rank.benefits.exp_multiplier && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-sm">経験値倍率</span>
                          <span className="font-semibold text-green-600">
                            x{rankInfo.rank.benefits.exp_multiplier}
                          </span>
                        </div>
                      )}
                      {rankInfo.rank.benefits.gacha_discount && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm">ガチャ割引</span>
                          <span className="font-semibold text-purple-600">
                            {(rankInfo.rank.benefits.gacha_discount * 100).toFixed(0)}% OFF
                          </span>
                        </div>
                      )}
                      {rankInfo.rank.benefits.quest_bonus && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span className="text-sm">クエストボーナス</span>
                          <span className="font-semibold text-orange-600">
                            +{(rankInfo.rank.benefits.quest_bonus * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      次のランクアップまで
                    </p>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold">
                        レベル {rankInfo?.rank?.tier === 5 ? 'MAX' : ((rankInfo?.rank?.tier || 1) + 1) * 25} で昇格
                      </p>
                      <p className="text-sm text-gray-600">
                        {rankInfo?.rank?.tier === 5 
                          ? '最高ランクに到達しています！' 
                          : '上位ランクでさらなる特典を獲得'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Experience History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  レベル進捗
                </CardTitle>
                <CardDescription>
                  現在のレベルとランクの詳細情報
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {rankInfo?.level || 1}
                    </div>
                    <div className="text-sm text-gray-600">現在レベル</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatPoints(rankInfo?.experience || 0)}
                    </div>
                    <div className="text-sm text-gray-600">現在EXP</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {formatPoints(rankInfo?.next_level_exp || 100)}
                    </div>
                    <div className="text-sm text-gray-600">次レベルまで</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avatar Tab */}
          <TabsContent value="avatar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>アバタープレビュー</CardTitle>
                <CardDescription>
                  現在のアバターの見た目を確認できます
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {/* Avatar Preview */}
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-4xl font-bold ${
                    profile.avatar_frame_id ? 'border-4' : ''
                  }`}>
                    {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                  </div>
                  
                  {/* Current Frame Preview */}
                  {profile.avatar_frame_id && (
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-400 shadow-lg">
                      {/* Frame will be styled based on CSS classes */}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="font-medium">{profile.display_name || profile.username}</p>
                  <p className="text-sm text-gray-600">
                    {profile.avatar_frame_id ? '装備中のフレーム' : 'フレーム未装備'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frames Tab */}
          <TabsContent value="frames" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Owned Frames */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    所有フレーム ({ownedFrames.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ownedFrames.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      まだフレームを所有していません
                    </p>
                  ) : (
                    ownedFrames.map((userFrame) => (
                      <div
                        key={userFrame.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded border-2 ${userFrame.frame?.css_class || ''}`} />
                          <div>
                            <p className="font-medium">{userFrame.frame?.name}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(userFrame.frame?.rarity || '')}`}>
                              {userFrame.frame?.rarity}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={userFrame.is_equipped ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleEquipFrame(userFrame.frame_id)}
                          disabled={userFrame.is_equipped}
                        >
                          {userFrame.is_equipped ? '装備中' : '装備'}
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Available Frames */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    購入可能フレーム
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableFrames
                    .filter(frame => !ownedFrames.some(owned => owned.frame_id === frame.id))
                    .map((frame) => (
                      <div
                        key={frame.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded border-2 ${frame.css_class}`} />
                          <div>
                            <p className="font-medium">{frame.name}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(frame.rarity)}`}>
                                {frame.rarity}
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                {formatPoints(frame.price)}pt
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePurchaseFrame(frame.id)}
                          disabled={profile.points < frame.price}
                        >
                          購入
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  購入履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purchaseHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    購入履歴がありません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {purchaseHistory.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{purchase.item_name}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(purchase.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            -{formatPoints(purchase.total_price)}pt
                          </p>
                          <p className="text-xs text-gray-500">
                            {purchase.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}