import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-provider'
import { QuestActionType } from '@/types/quest'

export function useQuestProgress() {
  const { user } = useAuth()
  const progressQueue = useRef<Map<QuestActionType, number>>(new Map())
  const batchTimer = useRef<NodeJS.Timeout>()

  // バッチ処理でクエスト進行を更新
  const updateProgress = async (actionType: QuestActionType, value: number = 1, metadata?: Record<string, any>) => {
    if (!user) return

    // 即座にクエスト進行を更新（デバウンスなし）
    try {
      const { data, error } = await supabase.rpc('update_quest_progress', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_value: value,
        p_metadata: metadata || {}
      })

      if (error) {
        console.error('Error updating quest progress:', error)
        return
      }

      // 完了したクエストがある場合の処理
      if (data?.quests_completed > 0) {
        console.log(`${data.quests_completed} quest(s) completed, ${data.total_points_earned} points earned`)
      }

      return data
    } catch (error) {
      console.error('Error updating quest progress:', error)
    }
  }

  // 特定のアクション用のヘルパー関数
  const trackLogin = () => updateProgress('login')
  
  const trackGameComplete = (gameType?: string) => 
    updateProgress('game_complete', 1, { game_type: gameType })
  
  const trackPointsEarned = (points: number) => 
    updateProgress('points_earned', points)
  
  const trackAchievementEarned = (achievementId: string) => 
    updateProgress('achievement_earned', 1, { achievement_id: achievementId })
  
  const trackSpringVisit = (springType: string) => 
    updateProgress('spring_visit', 1, { spring_type: springType })

  return {
    updateProgress,
    trackLogin,
    trackGameComplete,
    trackPointsEarned,
    trackAchievementEarned,
    trackSpringVisit
  }
}