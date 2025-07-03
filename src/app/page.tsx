import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trees, Trophy, Gamepad2, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <Trees className="h-20 w-20 mx-auto text-green-600 mb-4" />
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Points Forest
            </h1>
            <p className="text-xl text-gray-600 mb-2">ポイントの森</p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              ゲーミフィケーションプラットフォームで楽しみながらポイントを獲得し、
              アチーブメントを達成して、友達と競い合おう！
            </p>
          </div>
          
          <div className="space-x-4">
            <Button asChild size="lg" className="forest-gradient text-white">
              <Link href="/auth/register">
                今すぐ始める
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">
                ログイン
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            主な機能
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="game-card-hover cursor-pointer">
              <CardHeader className="text-center">
                <Gamepad2 className="h-12 w-12 mx-auto text-green-600 mb-2" />
                <CardTitle>ミニゲーム</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  数字当て、ルーレット、メモリーゲームなど
                  多彩なゲームでポイントを獲得
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="game-card-hover cursor-pointer">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 mx-auto text-yellow-600 mb-2" />
                <CardTitle>アチーブメント</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  様々な実績を達成してバッジを獲得。
                  レア度の高いアチーブメントに挑戦
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="game-card-hover cursor-pointer">
              <CardHeader className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <CardTitle>リーダーボード</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  他のプレイヤーと競い合い、
                  ランキング上位を目指そう
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="game-card-hover cursor-pointer">
              <CardHeader className="text-center">
                <Trees className="h-12 w-12 mx-auto text-green-600 mb-2" />
                <CardTitle>ポイントシステム</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  ログインボーナス、ゲーム報酬、
                  アチーブメント達成でポイント獲得
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Points Forestの世界
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">10+</div>
              <div className="text-gray-600">ミニゲーム</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-600 mb-2">50+</div>
              <div className="text-gray-600">アチーブメント</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
              <div className="text-gray-600">楽しさ</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 forest-gradient">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐPoints Forestを始めよう！
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            無料でアカウントを作成して、ポイント獲得の冒険を始めましょう。
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/auth/register">
              無料で始める
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Trees className="h-6 w-6 mr-2" />
            <span className="font-semibold">Points Forest</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Points Forest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}