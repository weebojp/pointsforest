'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Crown, 
  MessageCircle, 
  Activity 
} from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { FriendsList } from '@/components/features/social/FriendsList'
import { GuildList } from '@/components/features/social/GuildList'
import { PrivateMessages } from '@/components/features/social/PrivateMessages'
import { SocialFeed } from '@/components/features/social/SocialFeed'

export default function SocialPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('feed')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-green-600 animate-pulse mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <AppHeader 
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'ソーシャル', icon: Users }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                フィード
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                フレンド
              </TabsTrigger>
              <TabsTrigger value="guilds" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                ギルド
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                メッセージ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <SocialFeed />
            </TabsContent>

            <TabsContent value="friends">
              <FriendsList />
            </TabsContent>

            <TabsContent value="guilds">
              <GuildList />
            </TabsContent>

            <TabsContent value="messages">
              <PrivateMessages />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}