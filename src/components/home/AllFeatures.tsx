'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    category: "🎮 ゲーム",
    items: [
      { 
        icon: "🎯", 
        name: "数字当てゲーム", 
        desc: "AIと知恵比べ！1-100の数字を予想", 
        status: "人気No.1",
        color: "bg-green-100 text-green-800"
      },
      { 
        icon: "💧", 
        name: "ラッキースプリング", 
        desc: "1日1回の神秘的な泉で運試し", 
        status: "NEW",
        color: "bg-blue-100 text-blue-800"
      },
      { 
        icon: "🎯", 
        name: "クエストチャレンジ", 
        desc: "100以上のミッションに挑戦", 
        status: "毎日更新",
        color: "bg-purple-100 text-purple-800"
      },
      {
        icon: "🎨",
        name: "メモリーゲーム",
        desc: "記憶力を試すカードマッチング",
        status: "Coming Soon",
        color: "bg-gray-100 text-gray-600"
      }
    ]
  },
  {
    category: "🌟 成長システム", 
    items: [
      { 
        icon: "📈", 
        name: "ランク・レベル", 
        desc: "ブロンズからダイヤモンドまで5段階", 
        badge: "Lv.99まで",
        highlight: true
      },
      { 
        icon: "🏆", 
        name: "実績コレクション", 
        desc: "100以上の達成目標に挑戦", 
        badge: "レア度5段階"
      },
      { 
        icon: "🎖️", 
        name: "デイリーボーナス", 
        desc: "毎日ログインで最大500pt獲得", 
        badge: "ストリーク継続"
      },
      {
        icon: "⚡",
        name: "経験値システム",
        desc: "あらゆる行動で成長を実感",
        badge: "自動計算"
      }
    ]
  },
  {
    category: "👥 ソーシャル",
    items: [
      { 
        icon: "👫", 
        name: "フレンドシステム", 
        desc: "仲間と競い合い、協力プレイ", 
        status: "協力プレイ可"
      },
      { 
        icon: "⚔️", 
        name: "ギルドバトル", 
        desc: "最大50人のチーム戦略ゲーム", 
        status: "週末イベント"
      },
      { 
        icon: "💬", 
        name: "コミュニティ", 
        desc: "プレイヤー同士の活発な交流", 
        status: "24時間活発"
      },
      {
        icon: "📢",
        name: "ソーシャルフィード",
        desc: "友達の活動をリアルタイムで確認",
        new: true
      }
    ]
  },
  {
    category: "🎁 報酬・カスタマイズ",
    items: [
      { 
        icon: "🖼️", 
        name: "アバター装飾", 
        desc: "1000以上のカスタマイズアイテム", 
        premium: true
      },
      { 
        icon: "🎫", 
        name: "ポイント交換所", 
        desc: "Amazonギフトカードなどと交換", 
        highlight: true
      },
      { 
        icon: "💎", 
        name: "限定コンテンツ", 
        desc: "シーズン限定の特別報酬", 
        new: true
      },
      {
        icon: "🛡️",
        name: "称号システム",
        desc: "実績に応じた特別な称号を獲得",
        badge: "100種類以上"
      }
    ]
  }
]

export function AllFeatures() {
  return (
    <div className="space-y-12">
      {features.map((category, categoryIndex) => (
        <motion.div
          key={category.category}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: categoryIndex * 0.1 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {category.category}
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {category.items.map((feature, index) => (
              <motion.div
                key={feature.name}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className={`h-full ${feature.highlight ? 'ring-2 ring-yellow-400' : ''} hover:shadow-lg transition-shadow`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <span className="text-3xl mb-2">{feature.icon}</span>
                      {feature.status && (
                        <Badge variant="secondary" className={feature.color || ''}>
                          {feature.status}
                        </Badge>
                      )}
                      {feature.new && (
                        <Badge className="bg-red-500 text-white">NEW</Badge>
                      )}
                      {feature.premium && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    {feature.badge && (
                      <Badge variant="outline" className="mt-2">
                        {feature.badge}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}