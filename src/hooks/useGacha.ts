import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import type { GachaMachine, GachaItem } from '@/types/gacha'

export function useGacha() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pulling, setPulling] = useState(false)

  const pullGacha = async (machineId: string) => {
    if (!user) {
      toast({
        title: 'エラー',
        description: 'ログインが必要です',
        variant: 'destructive'
      })
      return null
    }

    try {
      setPulling(true)

      // ガチャを実行
      const { data, error } = await supabase.rpc('execute_gacha_pull', {
        p_user_id: user.id,
        p_machine_id: machineId
      })

      if (error) throw error

      if (!data.success) {
        toast({
          title: 'エラー',
          description: data.error || 'ガチャの実行に失敗しました',
          variant: 'destructive'
        })
        return null
      }

      // ポイント残高を更新
      await supabase
        .from('users')
        .select('points')
        .eq('id', user.id)
        .single()

      return data
    } catch (error) {
      console.error('Gacha pull error:', error)
      toast({
        title: 'エラー',
        description: 'ガチャの実行中にエラーが発生しました',
        variant: 'destructive'
      })
      return null
    } finally {
      setPulling(false)
    }
  }

  const getUserGachaPulls = async (machineId: string) => {
    if (!user) return []

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('gacha_pulls')
        .select('*')
        .eq('user_id', user.id)
        .eq('machine_id', machineId)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching gacha pulls:', error)
      return []
    }
  }

  const getDailyPullsRemaining = async (machine: GachaMachine) => {
    if (!user) return 0

    const pulls = await getUserGachaPulls(machine.id)
    const remaining = Math.max(0, machine.pulls_per_day - pulls.length)
    return remaining
  }

  return {
    pullGacha,
    pulling,
    getUserGachaPulls,
    getDailyPullsRemaining
  }
}