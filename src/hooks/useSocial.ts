import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import type { Friendship, Guild, PrivateMessage } from '@/types/social'

export function useSocial() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([])
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [loading, setLoading] = useState(true)

  // フレンドリクエスト送信
  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_requester_id: user.id,
        p_addressee_id: addresseeId
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '成功',
          description: data.message,
          duration: 3000
        })
        return true
      } else {
        toast({
          title: 'エラー',
          description: data.error,
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast({
        title: 'エラー',
        description: 'フレンドリクエストの送信に失敗しました',
        variant: 'destructive'
      })
      return false
    }
  }

  // フレンドリクエスト承諾
  const acceptFriendRequest = async (requesterId: string) => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        p_user_id: user.id,
        p_requester_id: requesterId
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '成功',
          description: data.message,
          duration: 3000
        })
        // フレンドリストを再読み込み
        await loadFriends()
        return true
      } else {
        toast({
          title: 'エラー',
          description: data.error,
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast({
        title: 'エラー',
        description: 'フレンドリクエストの承諾に失敗しました',
        variant: 'destructive'
      })
      return false
    }
  }

  // ギルドに参加
  const joinGuild = async (guildSlug: string) => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('join_guild', {
        p_user_id: user.id,
        p_guild_slug: guildSlug
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: '成功',
          description: data.message,
          duration: 3000
        })
        return true
      } else {
        toast({
          title: 'エラー',
          description: data.error,
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error('Error joining guild:', error)
      toast({
        title: 'エラー',
        description: 'ギルドへの参加に失敗しました',
        variant: 'destructive'
      })
      return false
    }
  }

  // フレンド一覧を取得
  const loadFriends = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('get_user_friends', {
        p_user_id: user.id
      })

      if (error) throw error

      setFriends(data || [])
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  // 保留中のフレンドリクエストを取得
  const loadPendingRequests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:users!friendships_requester_id_fkey(id, username, display_name, level)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPendingRequests(data || [])
    } catch (error) {
      console.error('Error loading pending requests:', error)
    }
  }

  // プライベートメッセージを送信
  const sendMessage = async (recipientId: string, content: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: content
        })

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'エラー',
        description: 'メッセージの送信に失敗しました',
        variant: 'destructive'
      })
      return false
    }
  }

  // リアルタイム購読の設定
  useEffect(() => {
    if (!user) return

    setLoading(true)

    // 初期データの読み込み
    Promise.all([
      loadFriends(),
      loadPendingRequests()
    ]).finally(() => {
      setLoading(false)
    })

    // リアルタイム購読
    const friendshipChannel = supabase
      .channel(`friendships-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${user.id},addressee_id=eq.${user.id}`
        },
        () => {
          loadFriends()
          loadPendingRequests()
        }
      )
      .subscribe()

    const messageChannel = supabase
      .channel(`messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // 新しいメッセージの通知
          toast({
            title: '新着メッセージ',
            description: '新しいメッセージが届きました',
            duration: 3000
          })
        }
      )
      .subscribe()

    return () => {
      friendshipChannel.unsubscribe()
      messageChannel.unsubscribe()
    }
  }, [user])

  return {
    friends,
    pendingRequests,
    messages,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    joinGuild,
    sendMessage,
    loadFriends,
    loadPendingRequests
  }
}