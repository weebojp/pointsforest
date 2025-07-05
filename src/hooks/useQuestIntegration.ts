import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/auth-provider'

export type QuestAction = 
  | 'login'
  | 'game_complete'
  | 'points_earned'
  | 'achievement_earned'
  | 'spring_visit'
  | 'gacha_pull'
  | 'friend_added'
  | 'social_interaction'

export function useQuestIntegration() {
  const { user } = useAuth()

  const updateQuestProgress = useCallback(async (
    action: QuestAction,
    value: number = 1,
    metadata?: Record<string, any>
  ) => {
    if (!user) return null

    try {
      const { data, error } = await supabase.rpc('update_quest_progress', {
        p_user_id: user.id,
        p_action_type: action,
        p_value: value,
        p_metadata: metadata || {}
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error updating quest progress:', error)
      return null
    }
  }, [user])

  // ゲーム完了時の統合処理
  const onGameComplete = useCallback(async (pointsEarned: number) => {
    if (!user) return

    // クエスト進捗を更新
    await Promise.all([
      updateQuestProgress('game_complete', 1),
      updateQuestProgress('points_earned', pointsEarned)
    ])
  }, [user, updateQuestProgress])

  // ガチャ実行時の統合処理
  const onGachaPull = useCallback(async () => {
    if (!user) return

    await updateQuestProgress('gacha_pull', 1)
  }, [user, updateQuestProgress])

  // 泉訪問時の統合処理
  const onSpringVisit = useCallback(async () => {
    if (!user) return

    await updateQuestProgress('spring_visit', 1)
  }, [user, updateQuestProgress])

  // ログイン時の統合処理
  const onLogin = useCallback(async () => {
    if (!user) return

    await updateQuestProgress('login', 1)
  }, [user, updateQuestProgress])

  // フレンド追加時の統合処理
  const onFriendAdded = useCallback(async () => {
    if (!user) return

    await updateQuestProgress('friend_added', 1)
  }, [user, updateQuestProgress])

  // ソーシャルインタラクション時の統合処理
  const onSocialInteraction = useCallback(async () => {
    if (!user) return

    await updateQuestProgress('social_interaction', 1)
  }, [user, updateQuestProgress])

  return {
    updateQuestProgress,
    onGameComplete,
    onGachaPull,
    onSpringVisit,
    onLogin,
    onFriendAdded,
    onSocialInteraction
  }
}