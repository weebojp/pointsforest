'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, Play, Check } from 'lucide-react'
import Link from 'next/link'

export function OptimizedCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg shadow-lg"
          >
            <Link href="/auth/register">
              <Sparkles className="h-5 w-5 mr-2" />
              無料で始める（30秒）
            </Link>
          </Button>
        </motion.div>
        
        <div className="text-sm text-gray-600">
          クレジットカード不要・いつでも退会可能
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span>50,000人が利用中</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span>完全無料スタート</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span>いつでも退会可能</span>
        </div>
      </div>

      <div className="pt-4">
        <Button
          variant="outline"
          size="lg"
          className="group"
          onClick={() => {
            const demoSection = document.getElementById('game-demo')
            demoSection?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <Play className="h-4 w-4 mr-2 group-hover:text-green-600 transition-colors" />
          まずは体験プレイ
        </Button>
      </div>
    </motion.div>
  )
}