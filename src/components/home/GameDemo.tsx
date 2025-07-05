'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, RefreshCw } from 'lucide-react'

export function GameDemo() {
  const [guess, setGuess] = useState<number | null>(null)
  const [targetNumber] = useState(() => Math.floor(Math.random() * 100) + 1)
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState('')
  const [showResult, setShowResult] = useState(false)
  const maxAttempts = 3

  const handleGuess = (num: number) => {
    if (attempts >= maxAttempts || showResult) return

    setGuess(num)
    setAttempts(prev => prev + 1)

    if (num === targetNumber) {
      setMessage('🎉 正解！登録で100ポイントボーナス獲得！')
      setShowResult(true)
    } else if (num < targetNumber) {
      setMessage('もっと大きい数字です！')
    } else {
      setMessage('もっと小さい数字です！')
    }

    if (attempts + 1 >= maxAttempts && num !== targetNumber) {
      setMessage(`残念！正解は ${targetNumber} でした。登録してリトライ！`)
      setShowResult(true)
    }
  }

  const reset = () => {
    setGuess(null)
    setAttempts(0)
    setMessage('')
    setShowResult(false)
  }

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2">🎯 数字当てゲームを体験</h3>
        <p className="text-sm text-gray-600">
          1-100の数字を当ててみよう！（{maxAttempts - attempts}回チャンス）
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {[20, 40, 50, 60, 80].map((num) => (
          <Button
            key={num}
            onClick={() => handleGuess(num)}
            disabled={attempts >= maxAttempts || showResult}
            variant={guess === num ? 'default' : 'outline'}
            className="h-12"
          >
            {num}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-center p-4 rounded-lg mb-4 ${
              showResult && guess === targetNumber
                ? 'bg-green-100 text-green-800'
                : showResult
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {showResult && (
        <div className="space-y-3">
          <Button
            onClick={reset}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            もう一度プレイ
          </Button>
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            無料で登録して100ptゲット！
          </Button>
        </div>
      )}
    </Card>
  )
}