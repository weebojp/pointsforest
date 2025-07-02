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
import { parseError, getToastFromError } from '@/lib/error-handler'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        const appError = parseError(error)
        const toastConfig = getToastFromError(appError)
        
        toast({
          title: toastConfig.title,
          description: toastConfig.description,
          variant: toastConfig.variant,
          duration: toastConfig.duration
        })
      } else {
        toast({
          title: 'ログイン成功',
          description: 'Points Forestへようこそ！',
          duration: 2000
        })
        // 即座にリダイレクトしない（ローディング状態を改善）
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    } catch (error) {
      const appError = parseError(error)
      const toastConfig = getToastFromError(appError)
      
      toast({
        title: toastConfig.title,
        description: toastConfig.description,
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
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>
            Points Forestアカウントにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="パスワードを入力"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full forest-gradient text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ログイン
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link 
                href="/auth/register" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                新規登録
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