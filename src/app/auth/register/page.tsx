'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: 'パスワードエラー',
        description: 'パスワードが一致しません',
        variant: 'destructive'
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'パスワードエラー',
        description: 'パスワードは6文字以上で入力してください',
        variant: 'destructive'
      })
      return
    }

    if (username.length < 3) {
      toast({
        title: 'ユーザー名エラー',
        description: 'ユーザー名は3文字以上で入力してください',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password, username)
      
      if (error) {
        toast({
          title: '登録エラー',
          description: error.message || '登録に失敗しました',
          variant: 'destructive'
        })
      } else {
        toast({
          title: '登録成功',
          description: 'アカウントが作成されました。メールを確認してください。'
        })
        router.push('/auth/login')
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trees className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <CardDescription>
            Points Forestで冒険を始めましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名（3文字以上）"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード（6文字以上）"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再入力"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full forest-gradient text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              アカウント作成
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              既にアカウントをお持ちの方は{' '}
              <Link 
                href="/auth/login" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ログイン
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← ホームに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}