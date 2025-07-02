'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Trees, 
  ArrowLeft,
  User,
  Bell,
  Shield,
  Palette,
  Volume2,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'

interface UserSettings {
  // Theme settings
  theme: 'light' | 'dark' | 'forest' | 'system'
  
  // Notification settings
  notifications: {
    email: boolean
    browser: boolean
    gameUpdates: boolean
    achievementAlerts: boolean
    dailyReminder: boolean
    weeklyReport: boolean
  }
  
  // Game settings
  gameSettings: {
    soundEffects: boolean
    animations: boolean
    autoPlay: boolean
    confirmActions: boolean
  }
  
  // Privacy settings
  privacy: {
    showProfile: boolean
    showStats: boolean
    allowFriendRequests: boolean
    showOnLeaderboard: boolean
  }
  
  // Language settings
  language: 'ja' | 'en'
}

const defaultSettings: UserSettings = {
  theme: 'forest',
  notifications: {
    email: true,
    browser: true,
    gameUpdates: true,
    achievementAlerts: true,
    dailyReminder: true,
    weeklyReport: false
  },
  gameSettings: {
    soundEffects: true,
    animations: true,
    autoPlay: false,
    confirmActions: true
  },
  privacy: {
    showProfile: true,
    showStats: true,
    allowFriendRequests: true,
    showOnLeaderboard: true
  },
  language: 'ja'
}

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [profileData, setProfileData] = useState({
    display_name: '',
    username: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && profile) {
      setProfileData({
        display_name: profile.display_name || '',
        username: profile.username || '',
        email: user.email || ''
      })
      
      // Load user settings (in a real app, this would come from the database)
      const savedSettings = localStorage.getItem(`settings_${user.id}`)
      if (savedSettings) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
        } catch (error) {
          console.error('Failed to parse saved settings:', error)
        }
      }
    }
  }, [user, profile, authLoading, router])

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const updated = { ...prev }
      const keys = path.split('.')
      let current = updated as any
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      
      return updated
    })
    setHasUnsavedChanges(true)
  }

  const saveProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: profileData.display_name,
          username: profileData.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: '保存完了',
        description: 'プロフィールが更新されました',
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: 'エラー',
        description: 'プロフィールの更新に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = () => {
    if (!user) return
    
    try {
      localStorage.setItem(`settings_${user.id}`, JSON.stringify(settings))
      setHasUnsavedChanges(false)
      
      toast({
        title: '設定を保存しました',
        description: '変更が適用されました',
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
    
    toast({
      title: '設定をリセットしました',
      description: 'デフォルト設定に戻りました',
      duration: 3000
    })
  }

  if (authLoading) {
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
          { label: '設定', icon: User }
        ]}
      />
      
      {/* Settings Status Bar */}
      {hasUnsavedChanges && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                未保存の変更があります
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="notifications">通知</TabsTrigger>
            <TabsTrigger value="game">ゲーム</TabsTrigger>
            <TabsTrigger value="privacy">プライバシー</TabsTrigger>
            <TabsTrigger value="appearance">外観</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  プロフィール設定
                </CardTitle>
                <CardDescription>
                  表示名やユーザー名を変更できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="display_name">表示名</Label>
                    <Input
                      id="display_name"
                      value={profileData.display_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="表示名を入力"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      他のユーザーに表示される名前です
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="username">ユーザー名</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="ユーザー名を入力"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      @{profileData.username || 'username'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    メールアドレスの変更は現在サポートされていません
                  </p>
                </div>

                <Button onClick={saveProfile} disabled={loading}>
                  {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  プロフィールを保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  通知設定
                </CardTitle>
                <CardDescription>
                  どの通知を受け取るかを設定できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">メール通知</Label>
                      <p className="text-sm text-gray-500">重要なお知らせをメールで受け取る</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => updateSetting('notifications.email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="browser-notifications">ブラウザ通知</Label>
                      <p className="text-sm text-gray-500">ブラウザ上で通知を表示</p>
                    </div>
                    <Switch
                      id="browser-notifications"
                      checked={settings.notifications.browser}
                      onCheckedChange={(checked) => updateSetting('notifications.browser', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="achievement-alerts">アチーブメント通知</Label>
                      <p className="text-sm text-gray-500">アチーブメント達成時の通知</p>
                    </div>
                    <Switch
                      id="achievement-alerts"
                      checked={settings.notifications.achievementAlerts}
                      onCheckedChange={(checked) => updateSetting('notifications.achievementAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="daily-reminder">デイリーリマインダー</Label>
                      <p className="text-sm text-gray-500">毎日のログインを促す通知</p>
                    </div>
                    <Switch
                      id="daily-reminder"
                      checked={settings.notifications.dailyReminder}
                      onCheckedChange={(checked) => updateSetting('notifications.dailyReminder', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Settings Tab */}
          <TabsContent value="game" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="h-5 w-5 mr-2" />
                  ゲーム設定
                </CardTitle>
                <CardDescription>
                  ゲーム体験をカスタマイズ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sound-effects">効果音</Label>
                      <p className="text-sm text-gray-500">ゲーム中の効果音を再生</p>
                    </div>
                    <Switch
                      id="sound-effects"
                      checked={settings.gameSettings.soundEffects}
                      onCheckedChange={(checked) => updateSetting('gameSettings.soundEffects', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animations">アニメーション</Label>
                      <p className="text-sm text-gray-500">スムーズなアニメーション効果</p>
                    </div>
                    <Switch
                      id="animations"
                      checked={settings.gameSettings.animations}
                      onCheckedChange={(checked) => updateSetting('gameSettings.animations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="confirm-actions">操作確認</Label>
                      <p className="text-sm text-gray-500">重要な操作前に確認ダイアログを表示</p>
                    </div>
                    <Switch
                      id="confirm-actions"
                      checked={settings.gameSettings.confirmActions}
                      onCheckedChange={(checked) => updateSetting('gameSettings.confirmActions', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  プライバシー設定
                </CardTitle>
                <CardDescription>
                  個人情報の表示と共有を管理
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-profile">プロフィール公開</Label>
                      <p className="text-sm text-gray-500">他のユーザーにプロフィールを表示</p>
                    </div>
                    <Switch
                      id="show-profile"
                      checked={settings.privacy.showProfile}
                      onCheckedChange={(checked) => updateSetting('privacy.showProfile', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-stats">統計情報公開</Label>
                      <p className="text-sm text-gray-500">ポイントやレベルを他のユーザーに表示</p>
                    </div>
                    <Switch
                      id="show-stats"
                      checked={settings.privacy.showStats}
                      onCheckedChange={(checked) => updateSetting('privacy.showStats', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-leaderboard">リーダーボード参加</Label>
                      <p className="text-sm text-gray-500">ランキングに名前を表示</p>
                    </div>
                    <Switch
                      id="show-leaderboard"
                      checked={settings.privacy.showOnLeaderboard}
                      onCheckedChange={(checked) => updateSetting('privacy.showOnLeaderboard', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  外観設定
                </CardTitle>
                <CardDescription>
                  テーマと表示設定をカスタマイズ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>テーマ</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                      { value: 'light', label: 'ライト', icon: Sun },
                      { value: 'dark', label: 'ダーク', icon: Moon },
                      { value: 'forest', label: 'フォレスト', icon: Trees },
                      { value: 'system', label: 'システム', icon: Monitor }
                    ].map((theme) => (
                      <Button
                        key={theme.value}
                        variant={settings.theme === theme.value ? 'default' : 'outline'}
                        className="flex flex-col items-center p-4 h-auto"
                        onClick={() => updateSetting('theme', theme.value)}
                      >
                        <theme.icon className="h-6 w-6 mb-2" />
                        {theme.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    現在のテーマ: {settings.theme === 'light' ? 'ライト' : 
                                  settings.theme === 'dark' ? 'ダーク' : 
                                  settings.theme === 'forest' ? 'フォレスト' : 'システム'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save/Reset Actions */}
        {hasUnsavedChanges && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-orange-800">保存されていない変更があります</span>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={resetSettings}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    リセット
                  </Button>
                  <Button onClick={saveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    設定を保存
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}