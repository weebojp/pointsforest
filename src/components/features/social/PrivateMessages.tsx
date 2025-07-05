'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Send, 
  User,
  Search,
  Clock,
  CheckCircle,
  Circle
} from 'lucide-react'
import { PrivateMessage, MessageThread } from '@/types/social'
import { formatDate } from '@/lib/utils'

export function PrivateMessages() {
  const { user } = useAuth()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (user) {
      loadMessageThreads()
    }
  }, [user])

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.participant_id)
    }
  }, [selectedThread])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessageThreads = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get all message threads (simplified query for demo)
      const { data: messagesData, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:users!private_messages_sender_id_fkey(
            username,
            display_name,
            level,
            last_seen_at
          ),
          recipient:users!private_messages_recipient_id_fkey(
            username,
            display_name,
            level,
            last_seen_at
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('is_deleted_by_sender', false)
        .eq('is_deleted_by_recipient', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group messages by conversation partner
      const threadMap = new Map<string, MessageThread>()
      
      for (const message of messagesData || []) {
        const partnerId = message.sender_id === user.id ? message.recipient_id : message.sender_id
        const partner = message.sender_id === user.id ? message.recipient : message.sender
        
        if (!threadMap.has(partnerId)) {
          // Count unread messages
          const unreadCount = (messagesData || [])
            .filter(m => 
              m.sender_id === partnerId && 
              m.recipient_id === user.id && 
              !m.is_read
            ).length

          threadMap.set(partnerId, {
            participant_id: partnerId,
            participant: {
              username: partner.username,
              display_name: partner.display_name,
              level: partner.level,
              last_seen_at: partner.last_seen_at
            },
            last_message: message,
            unread_count: unreadCount
          })
        }
      }

      setThreads(Array.from(threadMap.values()))
    } catch (error) {
      console.error('Error loading message threads:', error)
      toast({
        title: 'エラー',
        description: 'メッセージの読み込みに失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (participantId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:users!private_messages_sender_id_fkey(
            username,
            display_name
          ),
          recipient:users!private_messages_recipient_id_fkey(
            username,
            display_name
          )
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${participantId}),and(sender_id.eq.${participantId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Mark messages as read
      await markMessagesAsRead(participantId)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async (senderId: string) => {
    if (!user) return

    try {
      await supabase
        .from('private_messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('sender_id', senderId)
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      // Update local thread state
      setThreads(prev => 
        prev.map(thread => 
          thread.participant_id === senderId 
            ? { ...thread, unread_count: 0 }
            : thread
        )
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedThread || !newMessage.trim()) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedThread.participant_id,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select(`
          *,
          sender:users!private_messages_sender_id_fkey(
            username,
            display_name
          ),
          recipient:users!private_messages_recipient_id_fkey(
            username,
            display_name
          )
        `)
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
      setNewMessage('')

      // Update thread last message
      setThreads(prev => 
        prev.map(thread => 
          thread.participant_id === selectedThread.participant_id
            ? { ...thread, last_message: data }
            : thread
        )
      )

      toast({
        title: '送信完了',
        description: 'メッセージを送信しました',
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'エラー',
        description: 'メッセージの送信に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            プライベートメッセージ
          </CardTitle>
          <CardDescription>
            フレンドとプライベートで会話しよう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
            {/* Message Threads List */}
            <div className="lg:col-span-1 border-r pr-4">
              <div className="space-y-2">
                <h3 className="font-medium mb-3">会話一覧</h3>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p>読み込み中...</p>
                  </div>
                ) : threads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>まだ会話がありません</p>
                    <p className="text-sm">フレンドにメッセージを送ってみよう！</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {threads.map((thread) => (
                        <div
                          key={thread.participant_id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedThread?.participant_id === thread.participant_id
                              ? 'bg-blue-50 border-blue-200 border'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedThread(thread)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {(thread.participant.display_name || thread.participant.username)[0].toUpperCase()}
                              </div>
                              {thread.unread_count > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                                  {thread.unread_count}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm truncate">
                                  {thread.participant.display_name || thread.participant.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(thread.last_message.created_at, 'short')}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {thread.last_message.sender_id === user?.id ? 'あなた: ' : ''}
                                {thread.last_message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            {/* Message Area */}
            <div className="lg:col-span-2">
              {!selectedThread ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>会話を選択してください</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {(selectedThread.participant.display_name || selectedThread.participant.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedThread.participant.display_name || selectedThread.participant.username}
                      </p>
                      <p className="text-sm text-gray-600">
                        レベル {selectedThread.participant.level}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center gap-1 mt-1 text-xs ${
                              message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatDate(message.created_at, 'time')}
                              {message.sender_id === user?.id && (
                                message.is_read ? (
                                  <CheckCircle className="h-3 w-3 ml-1" />
                                ) : (
                                  <Circle className="h-3 w-3 ml-1" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="メッセージを入力..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={sending || !newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}