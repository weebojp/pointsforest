'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Shield, Award } from 'lucide-react'
import CountUp from 'react-countup'

const testimonials = [
  {
    user: "T.K. (28歳・会社員)",
    comment: "通勤時間が楽しみになりました！毎日のクエストがやりがいあります",
    achievement: "30日連続ログイン達成",
    rating: 5
  },
  {
    user: "Y.S. (24歳・大学生)",
    comment: "友達と競い合えるのが最高！ギルド戦が熱いです",
    achievement: "レジェンダリー実績5個",
    rating: 5
  },
  {
    user: "M.T. (35歳・主婦)",
    comment: "隙間時間に楽しめて、ポイントも貯まるのが嬉しい",
    achievement: "累計50,000pt達成",
    rating: 5
  }
]

export function SocialProof() {
  return (
    <div className="space-y-12">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-4 gap-6 text-center"
      >
        <div>
          <div className="text-4xl font-bold text-green-600">
            <CountUp end={50000} duration={2} separator="," />+
          </div>
          <div className="text-gray-600 mt-2">登録ユーザー</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-blue-600">
            <CountUp end={15000} duration={2} separator="," />+
          </div>
          <div className="text-gray-600 mt-2">毎日アクティブ</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-purple-600">
            <CountUp end={100} duration={2} />M+
          </div>
          <div className="text-gray-600 mt-2">配布ポイント総数</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-yellow-600 flex items-center justify-center">
            4.8
            <Star className="h-8 w-8 ml-1 fill-current" />
          </div>
          <div className="text-gray-600 mt-2">ユーザー満足度</div>
        </div>
      </motion.div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                
                <div className="border-t pt-4">
                  <div className="font-semibold text-sm">
                    {testimonial.user}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ✓ {testimonial.achievement}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Security badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t"
      >
        <div className="flex items-center gap-2 text-gray-600">
          <Shield className="h-5 w-5" />
          <span className="text-sm">SSL暗号化</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Award className="h-5 w-5" />
          <span className="text-sm">Supabase認証</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Shield className="h-5 w-5" />
          <span className="text-sm">24時間監視体制</span>
        </div>
      </motion.div>
    </div>
  )
}