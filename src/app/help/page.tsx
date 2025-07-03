'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Trees, 
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Gamepad2,
  Trophy,
  Star,
  Gift,
  Target,
  Zap,
  Calendar,
  Crown,
  TrendingUp,
  User,
  Settings,
  ChevronRight,
  Play
} from 'lucide-react'
import Link from 'next/link'

interface FAQ {
  question: string
  answer: string
  category: string
}

interface GameRule {
  game: string
  icon: any
  description: string
  rules: string[]
  scoring: string
  tips: string[]
}

const faqs: FAQ[] = [
  {
    question: 'ポイントはどうやって獲得できますか？',
    answer: 'ゲームをプレイしたり、デイリーボーナスを受け取ったり、アチーブメントを達成することでポイントを獲得できます。',
    category: 'points'
  },
  {
    question: 'デイリーボーナスとは何ですか？',
    answer: '毎日ログインするともらえるボーナスポイントです。連続でログインすると、より多くのポイントがもらえます（ストリークボーナス）。',
    category: 'points'
  },
  {
    question: 'ゲームの1日のプレイ制限はなぜありますか？',
    answer: 'ゲームバランスを保ち、健全なゲーム体験を提供するためです。制限は毎日午前0時にリセットされます。',
    category: 'games'
  },
  {
    question: 'アチーブメントはどうやって達成できますか？',
    answer: 'ゲームをプレイしたり、ポイントを獲得したり、ログインを続けることで自動的に達成されます。達成すると追加のポイントがもらえます。',
    category: 'achievements'
  },
  {
    question: 'リーダーボードはいつ更新されますか？',
    answer: '総合ポイントはリアルタイムで更新されます。週間・月間ランキングはそれぞれ週初めと月初めにリセットされます。',
    category: 'leaderboard'
  },
  {
    question: 'アカウントを削除したい場合はどうすればいいですか？',
    answer: '現在、アカウント削除機能は準備中です。削除をご希望の場合は、サポートまでお問い合わせください。',
    category: 'account'
  },
  {
    question: 'パスワードを忘れた場合はどうすればいいですか？',
    answer: 'ログイン画面で「パスワードを忘れた方」をクリックし、登録したメールアドレスに送信される指示に従ってください。',
    category: 'account'
  },
  {
    question: 'エラーが発生した場合はどうすればいいですか？',
    answer: 'まずページを再読み込みしてください。それでも解決しない場合は、ブラウザのキャッシュをクリアするか、別のブラウザで試してください。',
    category: 'troubleshooting'
  }
]

const gameRules: GameRule[] = [
  {
    game: '数字当てゲーム',
    icon: Target,
    description: '1から100までの数字を当てるシンプルなゲームです',
    rules: [
      '1から100までの範囲で数字を予想します',
      '予想した数字を入力して「予想する」ボタンを押します',
      '正解に近いほど高得点が獲得できます',
      '1日に最大10回まで挑戦できます'
    ],
    scoring: '得点 = 100 - |予想した数字 - 正解の数字|',
    tips: [
      '最初は50から始めて、範囲を絞っていくのが効果的です',
      '正解すると100点、1つずれると99点になります',
      '確率的には中央付近の数字が出やすい傾向があります'
    ]
  },
  {
    game: 'ルーレットゲーム',
    icon: Zap,
    description: '運に任せてルーレットを回すゲームです',
    rules: [
      'ルーレットを回すボタンを押します',
      '8つのセグメントのうち1つが選ばれます',
      '各セグメントには異なるポイントが設定されています',
      '1日に最大8回まで挑戦できます'
    ],
    scoring: 'セグメントによって5〜1000ポイントが獲得できます',
    tips: [
      '高得点のセグメントほど当たる確率が低くなっています',
      '安定してポイントを稼ぎたい場合におすすめです',
      '運が良ければ一度に大量のポイントを獲得できます'
    ]
  }
]

export default function HelpPage() {
  const [selectedFAQCategory, setSelectedFAQCategory] = useState('all')

  const faqCategories = [
    { key: 'all', name: 'すべて', icon: HelpCircle },
    { key: 'points', name: 'ポイント', icon: Star },
    { key: 'games', name: 'ゲーム', icon: Gamepad2 },
    { key: 'achievements', name: 'アチーブメント', icon: Trophy },
    { key: 'leaderboard', name: 'リーダーボード', icon: Crown },
    { key: 'account', name: 'アカウント', icon: User },
    { key: 'troubleshooting', name: 'トラブルシューティング', icon: Settings }
  ]

  const filteredFAQs = selectedFAQCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedFAQCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trees className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ヘルプセンター</h1>
                <p className="text-sm text-gray-600">
                  Points Forestの使い方をマスターしよう
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ダッシュボード
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="games">ゲームガイド</TabsTrigger>
            <TabsTrigger value="faq">よくある質問</TabsTrigger>
            <TabsTrigger value="tutorial">チュートリアル</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-600" />
                    ポイントシステム
                  </CardTitle>
                  <CardDescription>
                    ポイントの獲得方法と使い道
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      ゲームをプレイして獲得
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      デイリーボーナスで獲得
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      アチーブメント達成で獲得
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                    アチーブメント
                  </CardTitle>
                  <CardDescription>
                    実績システムの仕組み
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      自動的に進行状況を記録
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      達成時にボーナスポイント
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      レアリティ別の特別報酬
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-purple-600" />
                    リーダーボード
                  </CardTitle>
                  <CardDescription>
                    ランキングシステム
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      4種類のランキング
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      リアルタイム更新
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-green-600" />
                      他のプレイヤーとの競争
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start Guide */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2 text-green-600" />
                  クイックスタートガイド
                </CardTitle>
                <CardDescription>
                  Points Forestを始めるための3つのステップ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">デイリーボーナスを受け取る</h3>
                    <p className="text-sm text-gray-600">
                      毎日ログインしてデイリーボーナスを受け取り、ストリークを維持しましょう
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">ゲームをプレイする</h3>
                    <p className="text-sm text-gray-600">
                      数字当てゲームやルーレットでポイントを獲得し、経験値を積みましょう
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-lg">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">アチーブメントを確認</h3>
                    <p className="text-sm text-gray-600">
                      進行状況を確認して、より多くのアチーブメントを目指しましょう
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Games Guide Tab */}
          <TabsContent value="games" className="mt-6">
            <div className="space-y-6">
              {gameRules.map((game, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <game.icon className="h-6 w-6 mr-3 text-green-600" />
                      {game.game}
                    </CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-green-700">🎮 ルール</h4>
                        <ul className="space-y-2 text-sm">
                          {game.rules.map((rule, ruleIndex) => (
                            <li key={ruleIndex} className="flex items-start">
                              <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-green-600 flex-shrink-0" />
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-blue-700">🎯 得点システム</h4>
                        <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                          {game.scoring}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-purple-700">💡 攻略のコツ</h4>
                        <ul className="space-y-2 text-sm">
                          {game.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start">
                              <Star className="h-4 w-4 mr-1 mt-0.5 text-purple-600 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-6">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {faqCategories.map(category => (
                  <Button
                    key={category.key}
                    variant={selectedFAQCategory === category.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFAQCategory(category.key)}
                    className="flex items-center"
                  >
                    <category.icon className="h-4 w-4 mr-1" />
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">このカテゴリには質問がありません</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tutorial Tab */}
          <TabsContent value="tutorial" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  インタラクティブチュートリアル
                </CardTitle>
                <CardDescription>
                  実際に操作しながらPoints Forestの使い方を学びましょう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
                    <Gamepad2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h3 className="font-semibold mb-2">ゲームチュートリアル</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      数字当てゲームとルーレットの遊び方を実際に体験
                    </p>
                    <Button asChild>
                      <Link href="/games">
                        チュートリアルを開始
                      </Link>
                    </Button>
                  </div>

                  <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
                    <Trophy className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
                    <h3 className="font-semibold mb-2">アチーブメントガイド</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      アチーブメントシステムの詳細な説明と攻略法
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/achievements">
                        アチーブメントを見る
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Gift className="h-5 w-5 mr-2 text-blue-600" />
                    初心者ボーナス
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    新規登録から7日間は、デイリーボーナスが2倍になります！毎日ログインして特別ボーナスを受け取りましょう。
                  </p>
                  <Badge className="bg-blue-100 text-blue-800">
                    初回登録特典
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}