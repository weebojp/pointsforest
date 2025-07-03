// Social System Types (Friends & Guilds)

// Friend System Types
export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'blocked' | 'rejected'
  requested_at: string
  responded_at?: string
  blocked_by?: string
  created_at: string
  updated_at: string
}

export interface Friend {
  user_id: string
  username: string
  display_name?: string
  level: number
  last_seen_at: string
  friendship_since: string
  is_online: boolean
}

export interface FriendRequest {
  id: string
  requester: {
    id: string
    username: string
    display_name?: string
    level: number
  }
  requested_at: string
}

// Guild System Types
export interface Guild {
  id: string
  name: string
  slug: string
  description?: string
  leader_id?: string
  max_members: number
  is_public: boolean
  join_policy: 'open' | 'approval' | 'invite_only'
  member_count: number
  total_points: number
  guild_level: number
  guild_exp: number
  banner_url?: string
  icon_url?: string
  color_theme: string
  founded_at: string
  last_activity_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GuildMember {
  id: string
  guild_id: string
  user_id: string
  role: 'leader' | 'officer' | 'member'
  points_contributed: number
  last_contribution_at?: string
  status: 'active' | 'inactive' | 'pending' | 'banned'
  joined_at: string
  invited_by?: string
  created_at: string
  updated_at: string
  user?: {
    username: string
    display_name?: string
    level: number
    last_seen_at: string
  }
}

export interface GuildActivity {
  id: string
  guild_id: string
  user_id?: string
  activity_type: 'member_join' | 'member_leave' | 'points_contribution' | 'level_up' | 'achievement'
  title: string
  description?: string
  points_involved: number
  metadata: Record<string, any>
  created_at: string
  user?: {
    username: string
    display_name?: string
  }
}

// Messaging Types
export interface PrivateMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: 'text' | 'system' | 'achievement_share'
  is_read: boolean
  read_at?: string
  is_deleted_by_sender: boolean
  is_deleted_by_recipient: boolean
  attachment?: Record<string, any>
  created_at: string
  sender?: {
    username: string
    display_name?: string
  }
  recipient?: {
    username: string
    display_name?: string
  }
}

export interface MessageThread {
  participant_id: string
  participant: {
    username: string
    display_name?: string
    level: number
    last_seen_at: string
  }
  last_message: PrivateMessage
  unread_count: number
}

// Social Feed Types
export interface SocialPost {
  id: string
  user_id: string
  content?: string
  post_type: 'status' | 'achievement' | 'level_up' | 'system'
  achievement_id?: string
  metadata: Record<string, any>
  likes_count: number
  comments_count: number
  visibility: 'public' | 'friends' | 'guild'
  created_at: string
  updated_at: string
  user: {
    username: string
    display_name?: string
    level: number
  }
  achievement?: {
    name: string
    description: string
    rarity: string
    badge_image_url?: string
  }
  is_liked?: boolean
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

// API Response Types
export interface SocialApiResponse {
  success: boolean
  error?: string
  message?: string
}

export interface FriendRequestResponse extends SocialApiResponse {
  data?: Friend
}

export interface GuildJoinResponse extends SocialApiResponse {
  guild?: Guild
}

// Social Statistics
export interface SocialStats {
  friends_count: number
  guild_members_count?: number
  messages_sent: number
  messages_received: number
  posts_created: number
  likes_received: number
}

// Search and Discovery
export interface UserSearchResult {
  id: string
  username: string
  display_name?: string
  level: number
  rank?: {
    name: string
    tier: number
  }
  friendship_status?: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'
  mutual_friends_count?: number
}

export interface GuildSearchResult {
  id: string
  name: string
  slug: string
  description?: string
  member_count: number
  max_members: number
  guild_level: number
  is_public: boolean
  join_policy: string
  color_theme: string
  can_join: boolean
}

// Notification Types
export interface SocialNotification {
  id: string
  type: 'friend_request' | 'friend_accepted' | 'guild_invite' | 'new_message' | 'post_like'
  title: string
  message: string
  data: Record<string, any>
  is_read: boolean
  created_at: string
}