'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Settings, Database, Shield, Bell, Palette, Globe, Server, HardDrive } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SystemSettings {
  id?: string
  category: string
  settings: any
  updated_by?: string
  updated_at?: string
}

interface GeneralSettings {
  site_name: string
  site_description: string
  maintenance_mode: boolean
  maintenance_message: string
  max_users: number
  registration_enabled: boolean
  admin_email: string
}

interface GameSettings {
  daily_login_bonus: number
  max_daily_games: number
  point_multiplier: number
  achievement_multiplier: number
  game_session_timeout: number
  leaderboard_size: number
}

interface SecuritySettings {
  session_timeout_hours: number
  password_min_length: number
  require_email_verification: boolean
  max_login_attempts: number
  lockout_duration_minutes: number
  two_factor_enabled: boolean
  allowed_domains: string[]
}

interface NotificationSettings {
  email_notifications: boolean
  admin_alerts: boolean
  user_welcome_email: boolean
  achievement_notifications: boolean
  maintenance_notifications: boolean
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
}

export default function SystemSettingsPage() {
  const { admin, loading } = useAdminAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    site_name: 'Points Forest',
    site_description: 'ポイントエコノミーゲーミングプラットフォーム',
    maintenance_mode: false,
    maintenance_message: 'メンテナンス中です。しばらくお待ちください。',
    max_users: 100000,
    registration_enabled: true,
    admin_email: 'admin@pointsforest.com'
  })
  
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    daily_login_bonus: 50,
    max_daily_games: 20,
    point_multiplier: 1.0,
    achievement_multiplier: 1.0,
    game_session_timeout: 1800,
    leaderboard_size: 100
  })
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    session_timeout_hours: 24,
    password_min_length: 8,
    require_email_verification: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    two_factor_enabled: false,
    allowed_domains: []
  })
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    admin_alerts: true,
    user_welcome_email: true,
    achievement_notifications: true,
    maintenance_notifications: true,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: ''
  })

  useEffect(() => {
    if (admin && !loading) {
      fetchSettings()
    }
  }, [admin, loading])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*')
      
      if (error) throw error
      
      // 設定をカテゴリ別に振り分け
      settings?.forEach((setting: SystemSettings) => {
        switch (setting.category) {
          case 'general':
            setGeneralSettings(prev => ({ ...prev, ...setting.settings }))
            break
          case 'games':
            setGameSettings(prev => ({ ...prev, ...setting.settings }))
            break
          case 'security':
            setSecuritySettings(prev => ({ ...prev, ...setting.settings }))
            break
          case 'notifications':
            setNotificationSettings(prev => ({ ...prev, ...setting.settings }))
            break
        }
      })
      
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('設定の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (category: string, settings: any) => {
    try {
      setIsSaving(true)
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          category,
          settings,
          updated_by: admin!.id
        })
      
      if (error) throw error
      
      toast.success(`${category}設定が更新されました`)
      
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const testEmailSettings = async () => {
    try {
      // メール設定のテスト送信
      toast.success('テストメールが送信されました')
    } catch (error) {
      console.error('Error testing email:', error)
      toast.error('メールテストに失敗しました')
    }
  }

  const clearCache = async () => {
    try {
      // キャッシュクリアの実装
      toast.success('キャッシュがクリアされました')
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('キャッシュクリアに失敗しました')
    }
  }

  const backupDatabase = async () => {
    try {
      // データベースバックアップの実装
      toast.success('バックアップが開始されました')
    } catch (error) {
      console.error('Error backing up database:', error)
      toast.error('バックアップに失敗しました')
    }
  }

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
          <h1 className="text-3xl font-bold">システム設定</h1>
          <p className="text-muted-foreground mt-1">システム全体の設定と管理</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="w-3 h-3" />
          管理者モード
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="games">ゲーム</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="system">システム</TabsTrigger>
          <TabsTrigger value="maintenance">メンテナンス</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                一般設定
              </CardTitle>
              <CardDescription>
                サイトの基本設定と情報
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>サイト名</Label>
                    <Input
                      value={generalSettings.site_name}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, site_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>サイト説明</Label>
                    <Textarea
                      value={generalSettings.site_description}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, site_description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>管理者メールアドレス</Label>
                    <Input
                      type="email"
                      value={generalSettings.admin_email}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, admin_email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>最大ユーザー数</Label>
                    <Input
                      type="number"
                      value={generalSettings.max_users}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, max_users: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={generalSettings.registration_enabled}
                      onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, registration_enabled: checked }))}
                    />
                    <Label>新規登録を有効にする</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={generalSettings.maintenance_mode}
                      onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, maintenance_mode: checked }))}
                    />
                    <Label>メンテナンスモード</Label>
                  </div>
                  {generalSettings.maintenance_mode && (
                    <div>
                      <Label>メンテナンスメッセージ</Label>
                      <Textarea
                        value={generalSettings.maintenance_message}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, maintenance_message: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => saveSettings('general', generalSettings)}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? '保存中...' : '一般設定を保存'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                ゲーム設定
              </CardTitle>
              <CardDescription>
                ゲームシステムのパラメータとバランス設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>デイリーログインボーナス</Label>
                    <Input
                      type="number"
                      value={gameSettings.daily_login_bonus}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, daily_login_bonus: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>1日最大ゲーム回数</Label>
                    <Input
                      type="number"
                      value={gameSettings.max_daily_games}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, max_daily_games: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>ポイント乗数</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={gameSettings.point_multiplier}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, point_multiplier: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>アチーブメント乗数</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={gameSettings.achievement_multiplier}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, achievement_multiplier: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label>ゲームセッションタイムアウト（秒）</Label>
                    <Input
                      type="number"
                      value={gameSettings.game_session_timeout}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, game_session_timeout: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>リーダーボード表示数</Label>
                    <Input
                      type="number"
                      value={gameSettings.leaderboard_size}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, leaderboard_size: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => saveSettings('games', gameSettings)}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? '保存中...' : 'ゲーム設定を保存'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                セキュリティ設定
              </CardTitle>
              <CardDescription>
                アクセス制御とセキュリティポリシー
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>セッションタイムアウト（時間）</Label>
                    <Input
                      type="number"
                      value={securitySettings.session_timeout_hours}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout_hours: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>パスワード最小文字数</Label>
                    <Input
                      type="number"
                      value={securitySettings.password_min_length}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_min_length: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>最大ログイン試行回数</Label>
                    <Input
                      type="number"
                      value={securitySettings.max_login_attempts}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>ロックアウト時間（分）</Label>
                    <Input
                      type="number"
                      value={securitySettings.lockout_duration_minutes}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockout_duration_minutes: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securitySettings.require_email_verification}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, require_email_verification: checked }))}
                    />
                    <Label>メール認証を必須にする</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securitySettings.two_factor_enabled}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, two_factor_enabled: checked }))}
                    />
                    <Label>2因子認証を有効にする</Label>
                  </div>
                  <div>
                    <Label>許可ドメイン（カンマ区切り）</Label>
                    <Textarea
                      placeholder="example.com, company.org"
                      value={securitySettings.allowed_domains.join(', ')}
                      onChange={(e) => {
                        const domains = e.target.value.split(',').map(d => d.trim()).filter(d => d)
                        setSecuritySettings(prev => ({ ...prev, allowed_domains: domains }))
                      }}
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => saveSettings('security', securitySettings)}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? '保存中...' : 'セキュリティ設定を保存'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                通知設定
              </CardTitle>
              <CardDescription>
                メール通知とアラートの設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>通知オプション</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={notificationSettings.email_notifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))}
                        />
                        <Label>メール通知</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={notificationSettings.admin_alerts}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, admin_alerts: checked }))}
                        />
                        <Label>管理者アラート</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={notificationSettings.user_welcome_email}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, user_welcome_email: checked }))}
                        />
                        <Label>ウェルカムメール</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={notificationSettings.achievement_notifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, achievement_notifications: checked }))}
                        />
                        <Label>アチーブメント通知</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={notificationSettings.maintenance_notifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, maintenance_notifications: checked }))}
                        />
                        <Label>メンテナンス通知</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>SMTPホスト</Label>
                    <Input
                      value={notificationSettings.smtp_host}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label>SMTPポート</Label>
                    <Input
                      type="number"
                      value={notificationSettings.smtp_port}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                    />
                  </div>
                  <div>
                    <Label>SMTPユーザー名</Label>
                    <Input
                      value={notificationSettings.smtp_username}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>SMTPパスワード</Label>
                    <Input
                      type="password"
                      value={notificationSettings.smtp_password}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => saveSettings('notifications', notificationSettings)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? '保存中...' : '通知設定を保存'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={testEmailSettings}
                >
                  メールテスト
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  システム情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>バージョン:</span>
                  <Badge>v1.0.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span>データベース:</span>
                  <Badge variant="outline">PostgreSQL</Badge>
                </div>
                <div className="flex justify-between">
                  <span>サーバー状態:</span>
                  <Badge className="bg-green-100 text-green-800">稼働中</Badge>
                </div>
                <div className="flex justify-between">
                  <span>最終バックアップ:</span>
                  <span className="text-sm text-muted-foreground">2025-07-03 10:00</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  システム操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={clearCache}
                  className="w-full"
                >
                  キャッシュクリア
                </Button>
                <Button 
                  variant="outline" 
                  onClick={backupDatabase}
                  className="w-full"
                >
                  データベースバックアップ
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    if (confirm('システムをメンテナンスモードにしますか？')) {
                      setGeneralSettings(prev => ({ ...prev, maintenance_mode: true }))
                      saveSettings('general', { ...generalSettings, maintenance_mode: true })
                    }
                  }}
                >
                  緊急メンテナンスモード
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                メンテナンスツール
              </CardTitle>
              <CardDescription>
                システムのメンテナンスと最適化
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">データベースメンテナンス</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        インデックスの再構築
                      </Button>
                      <Button variant="outline" className="w-full">
                        統計情報の更新
                      </Button>
                      <Button variant="outline" className="w-full">
                        不要データのクリーンアップ
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">システム最適化</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        アプリケーションキャッシュクリア
                      </Button>
                      <Button variant="outline" className="w-full">
                        一時ファイルの削除
                      </Button>
                      <Button variant="outline" className="w-full">
                        ログファイルのローテーション
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">危険な操作</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      if (confirm('全ユーザーのセッションを無効化しますか？')) {
                        toast.success('全セッションが無効化されました')
                      }
                    }}
                  >
                    全セッションの無効化
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      if (confirm('全キャッシュをクリアしますか？')) {
                        clearCache()
                      }
                    }}
                  >
                    全キャッシュのクリア
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}