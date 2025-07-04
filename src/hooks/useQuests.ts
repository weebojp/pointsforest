import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/auth-provider'
import type { Quest } from '@/types/quest'

export function useQuests() {
  const { user } = useAuth()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // デイリークエストの自動割り当て
  const assignDailyQuests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('assign_daily_quests', {
        p_user_id: user.id
      })

      if (error) throw error
      
      return data
    } catch (err) {
      console.error('Error assigning daily quests:', err)
      throw err
    }
  }

  // クエスト一覧の取得
  const fetchQuests = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // まずデイリークエストを割り当て
      await assignDailyQuests()

      // クエスト一覧を取得
      const { data, error } = await supabase.rpc('get_user_quests', {
        p_user_id: user.id
      })

      if (error) throw error

      setQuests(data || [])
    } catch (err) {
      console.error('Error fetching quests:', err)
      setError(err instanceof Error ? err.message : 'クエストの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // クエスト進捗の更新
  const updateQuestProgress = async (
    questType: string,
    category: string,
    increment: number = 1
  ) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('update_quest_progress', {
        p_user_id: user.id,
        p_quest_type: questType,
        p_category: category,
        p_increment: increment
      })

      if (error) throw error

      // クエスト完了があれば再取得
      if (data?.quests_completed > 0) {
        await fetchQuests()
      }

      return data
    } catch (err) {
      console.error('Error updating quest progress:', err)
      throw err
    }
  }

  // リアルタイムアップデート
  useEffect(() => {
    if (!user) return

    // 初回取得
    fetchQuests()

    // リアルタイム購読
    const channel = supabase
      .channel(`user-quests-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_quests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchQuests()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  return {
    quests,
    loading,
    error,
    refetch: fetchQuests,
    updateQuestProgress
  }
}