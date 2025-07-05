'use client'

import { motion } from 'framer-motion'
import { Trees } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedForestBackground } from '@/components/home/AnimatedForestBackground'
import { LiveStats } from '@/components/home/LiveStats'
import { GameDemo } from '@/components/home/GameDemo'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { AllFeatures } from '@/components/home/AllFeatures'
import { UserJourney } from '@/components/home/UserJourney'
import { SocialProof } from '@/components/home/SocialProof'
import { OptimizedCTA } from '@/components/home/OptimizedCTA'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden py-20 px-4">
        <AnimatedForestBackground />
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Trees className="h-20 w-20 mx-auto text-green-600 mb-4" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                毎日が冒険！ポイントを集めて成長する森
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-2">
              16種類のゲームと100以上のクエストで、楽しみながら報酬をゲット
            </p>
          </motion.div>
          
          {/* Value Props */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🎮</div>
              <div className="font-semibold">即座に楽しめる</div>
              <div className="text-sm text-gray-600">登録30秒で16種類のゲームをプレイ開始</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold">達成感がある</div>
              <div className="text-sm text-gray-600">100以上のクエストと実績で毎日新しい挑戦</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🎁</div>
              <div className="font-semibold">報酬がもらえる</div>
              <div className="text-sm text-gray-600">ポイントで限定アイテムやギフトカードと交換</div>
            </div>
          </motion.div>

          <OptimizedCTA />
          
          {/* Live Stats */}
          <LiveStats />
        </div>
      </section>

      {/* Interactive Game Demo */}
      <section id="game-demo" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                今すぐ体験プレイ！
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                登録なしで人気No.1の数字当てゲームを体験できます。
                実際のゲームプレイを試して、Points Forestの楽しさを実感してください。
              </p>
              <ActivityFeed />
            </div>
            <div>
              <GameDemo />
            </div>
          </div>
        </div>
      </section>

      {/* All Features Showcase */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              豊富な機能で毎日が楽しい
            </h2>
            <p className="text-xl text-gray-600">
              16種類の機能があなたの冒険をサポート
            </p>
          </div>
          
          <AllFeatures />
        </div>
      </section>

      {/* User Journey */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              あなたの成長ストーリー
            </h2>
            <p className="text-xl text-gray-600">
              Points Forestでの冒険がどのように進むか見てみましょう
            </p>
          </div>
          
          <UserJourney />
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              50,000人以上が楽しんでいます
            </h2>
            <p className="text-xl text-gray-600">
              Points Forestは多くのユーザーに愛されています
            </p>
          </div>
          
          <SocialProof />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            今すぐPoints Forestを始めよう！
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            無料でアカウントを作成して、ポイント獲得の冒険を始めましょう。
            クレジットカード不要、30秒で登録完了。
          </p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Button asChild size="lg" className="bg-white text-green-600 hover:bg-gray-100 px-8 py-6 text-lg">
              <Link href="/auth/register">
                無料で始める →
              </Link>
            </Button>
          </motion.div>
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