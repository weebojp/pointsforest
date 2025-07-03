import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { GrantExpResponse, EXP_SOURCES } from '@/types/rank'

export function useExperience() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const grantExperience = useCallback(async (
    userId: string,
    amount: number,
    source: keyof typeof EXP_SOURCES,
    sourceId?: string,
    metadata?: Record<string, any>
  ): Promise<GrantExpResponse | null> => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.rpc('grant_experience', {
        p_user_id: userId,
        p_amount: amount,
        p_source: source.toLowerCase(),
        p_source_id: sourceId,
        p_metadata: metadata || {}
      })

      if (error) {
        console.error('Error granting experience:', error)
        toast({
          title: 'エラー',
          description: '経験値の付与に失敗しました',
          variant: 'destructive'
        })
        return null
      }

      if (data?.success) {
        // Show experience gained
        toast({
          title: '経験値獲得！',
          description: `+${data.exp_gained} EXP${data.multiplier > 1 ? ` (x${data.multiplier})` : ''}`,
          duration: 2000
        })

        // Check for level ups
        if (data.level_ups && data.level_ups > 0) {
          // Will be handled by parent component to show level up modal
        }

        return data as GrantExpResponse
      }

      return null
    } catch (error) {
      console.error('Error in grantExperience:', error)
      toast({
        title: 'システムエラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const getUserRankInfo = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_rank_info', {
        p_user_id: userId
      })

      if (error) {
        console.error('Error fetching rank info:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserRankInfo:', error)
      return null
    }
  }, [])

  return {
    grantExperience,
    getUserRankInfo,
    loading
  }
}