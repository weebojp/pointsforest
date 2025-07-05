import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { useExperience } from './useExperience'

interface GameSessionResult {
  score: number
  points_earned: number
  duration_seconds: number
  metadata?: Record<string, any>
}

export function useGameSession() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { grantExperience } = useExperience()
  const [saving, setSaving] = useState(false)

  const saveGameSession = async (
    gameId: string,
    result: GameSessionResult
  ) => {
    if (!user) {
      toast({
        title: 'エラー',
        description: 'ログインが必要です',
        variant: 'destructive'
      })
      return null
    }

    try {
      setSaving(true)

      // ゲームセッションを保存
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          user_id: user.id,
          game_id: gameId,
          score: result.score,
          points_earned: result.points_earned,
          duration_seconds: result.duration_seconds,
          game_data: result.metadata || {}
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // ポイントを付与
      if (result.points_earned > 0) {
        const { error: pointError } = await supabase
          .from('point_transactions')
          .insert({
            user_id: user.id,
            amount: result.points_earned,
            type: 'earn',
            source: 'game',
            reference_id: sessionData.id,
            description: `ゲーム報酬: ${result.points_earned}ポイント獲得`
          })

        if (pointError) throw pointError

        // ユーザーのポイントを更新
        const { error: updateError } = await supabase.rpc('update_user_points', {
          p_user_id: user.id,
          p_amount: result.points_earned
        })

        if (updateError) throw updateError
      }

      // 経験値を付与（ポイントの10%）
      const expAmount = Math.floor(result.points_earned * 0.1)
      if (expAmount > 0) {
        const expResult = await grantExperience(expAmount, 'game', sessionData.id)
        
        if (expResult && expResult.level_ups > 0) {
          toast({
            title: 'レベルアップ！',
            description: `レベル ${expResult.level_after} に到達しました！`,
            duration: 5000
          })
        }
      }

      // クエスト進捗を更新
      await updateQuestProgress('game_complete')

      // 成功メッセージ
      toast({
        title: 'ゲーム完了！',
        description: `${result.points_earned}ポイントと${expAmount}経験値を獲得しました`,
        duration: 3000
      })

      return sessionData
    } catch (error) {
      console.error('Error saving game session:', error)
      toast({
        title: 'エラー',
        description: 'ゲーム結果の保存に失敗しました',
        variant: 'destructive'
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  const updateQuestProgress = async (action: string) => {
    if (!user) return

    try {
      await supabase.rpc('update_quest_progress', {
        p_user_id: user.id,
        p_quest_type: 'daily',
        p_category: 'games',
        p_increment: 1
      })
    } catch (error) {
      console.error('Error updating quest progress:', error)
    }
  }

  return {
    saveGameSession,
    saving
  }
}