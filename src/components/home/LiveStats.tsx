'use client'

import { useEffect, useState } from 'react'
import CountUp from 'react-countup'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Trophy } from 'lucide-react'

export function LiveStats() {
  const [stats, setStats] = useState({
    activeUsers: 2847,
    todayPoints: 1234567,
    newAchievements: 89
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        todayPoints: prev.todayPoints + Math.floor(Math.random() * 1000),
        newAchievements: prev.newAchievements + Math.floor(Math.random() * 3)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">現在プレイ中</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          <CountUp
            end={stats.activeUsers}
            duration={1}
            separator=","
          />
          <span className="text-lg ml-1">人</span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-gray-600">本日の獲得ポイント</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          <CountUp
            end={stats.todayPoints}
            duration={2}
            separator=","
          />
          <span className="text-lg ml-1">pt</span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-purple-600" />
          <span className="text-sm text-gray-600">新しい実績解除</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          <CountUp
            end={stats.newAchievements}
            duration={1}
          />
          <span className="text-lg ml-1">個</span>
        </div>
      </div>
    </motion.div>
  )
}