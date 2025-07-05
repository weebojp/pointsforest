'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const activities = [
  { icon: '🎯', text: '田中さんが「数字マスター」実績を解除！' },
  { icon: '💎', text: '山田さんがレジェンダリー報酬を獲得！' },
  { icon: '🏆', text: '鈴木さんがランキング3位に到達！' },
  { icon: '🌟', text: '佐藤さんが30日連続ログイン達成！' },
  { icon: '🎮', text: '高橋さんがパーフェクトゲームを達成！' },
  { icon: '💧', text: '伊藤さんがミシカルドロップを獲得！' },
  { icon: '⚔️', text: 'ドラゴンギルドが週間ランキング1位！' },
  { icon: '🎁', text: '渡辺さんがゴールドフレームを購入！' },
]

export function ActivityFeed() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-12 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-lg">{activities[currentIndex].icon}</span>
            <span>{activities[currentIndex].text}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}