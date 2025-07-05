'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Lock, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Smartphone,
  CheckCircle,
  Loader2
} from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const { admin, signIn } = useAdminAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 既にログイン済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (admin) {
      router.push('/admin')
    }
  }, [admin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn(
        formData.email, 
        formData.password, 
        formData.twoFactorCode || undefined
      )

      if (result.success) {
        router.push('/admin')
      } else if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true)
      } else {
        setError(result.error || 'ログインに失敗しました')
      }
    } catch (error) {
      setError('システムエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // エラーをクリア
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">管理者ログイン</h1>
          <p className="text-gray-600 mt-2">Points Forest 管理システム</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">ログイン</CardTitle>
            <CardDescription className="text-center">
              管理者アカウントでログインしてください
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* メールアドレス */}
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pointsforest.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                  required
                  className="w-full"
                />
              </div>

              {/* パスワード */}
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="パスワードを入力"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 2FA入力（必要な場合のみ表示） */}
              {requiresTwoFactor && (
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    認証コード
                  </Label>
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="6桁の認証コード"
                    value={formData.twoFactorCode}
                    onChange={(e) => handleInputChange('twoFactorCode', e.target.value)}
                    disabled={loading}
                    maxLength={6}
                    className="w-full text-center text-lg tracking-wider"
                  />
                  <p className="text-sm text-gray-600">
                    認証アプリまたはSMSで受信した6桁のコードを入力してください
                  </p>
                </div>
              )}

              {/* エラーメッセージ */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 2FA要求通知 */}
              {requiresTwoFactor && !error && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    認証コードを入力してログインを完了してください
                  </AlertDescription>
                </Alert>
              )}

              {/* ログインボタン */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !formData.email || !formData.password}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {requiresTwoFactor ? '認証して完了' : 'ログイン'}
              </Button>
            </form>

            {/* セキュリティ情報 */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-1" />
                  SSL暗号化
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  2FA対応
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* フッター情報 */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-600">
            管理者アカウントに関する問題がある場合は、システム管理者にお問い合わせください
          </p>
          <div className="flex justify-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              セキュア接続
            </Badge>
            <Badge variant="outline" className="text-xs">
              監査ログ記録中
            </Badge>
          </div>
        </div>

        {/* 開発環境用の認証情報表示 */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-4 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">開発環境テスト用</h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>Email: admin@pointsforest.com</p>
                <p>Password: admin123</p>
                <p>2FA Code: admin123 (テスト用)</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}