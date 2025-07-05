'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

const journeySteps = [
  {
    day: "Day 1",
    title: "登録してすぐに100ptゲット！",
    desc: "初めてのゲームで追加200pt獲得",
    icon: "🎯",
    color: "from-green-400 to-emerald-500"
  },
  {
    day: "Day 7",
    title: "レベル10到達！新機能解放",
    desc: "ラッキースプリングで大当たり1000pt",
    icon: "💎",
    color: "from-blue-400 to-cyan-500"
  },
  {
    day: "Day 30",
    title: "初のレア実績解除！",
    desc: "累計10,000pt達成でギフトカード交換",
    icon: "🏆",
    color: "from-purple-400 to-pink-500"
  },
  {
    day: "Day 90",
    title: "ギルドマスターに昇格！",
    desc: "仲間と協力して週間ランキング1位",
    icon: "⚔️",
    color: "from-orange-400 to-red-500"
  }
]

export function UserJourney() {
  return (
    <div className="relative">
      {/* Journey line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-300 via-blue-300 to-purple-300 transform -translate-y-1/2 hidden lg:block" />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {journeySteps.map((step, index) => (
          <motion.div
            key={step.day}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="relative"
          >
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl mb-4 mx-auto`}>
                  {step.icon}
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-500 mb-2">
                    {step.day}
                  </div>
                  <h4 className="font-bold text-lg mb-2">
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {step.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {index < journeySteps.length - 1 && (
              <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                <div className="bg-white rounded-full p-1">
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}