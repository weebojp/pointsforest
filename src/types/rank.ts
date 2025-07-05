// Rank and Level System Types

export interface Rank {
  id: string
  name: string
  slug: string
  tier: number // 1-5: Bronze to Diamond
  min_level: number
  max_level: number | null
  color_primary: string
  color_secondary?: string
  icon_url?: string
  badge_url?: string
  benefits: RankBenefits
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RankBenefits {
  daily_bonus_multiplier?: number
  exp_multiplier?: number
  gacha_discount?: number
  quest_bonus?: number
  exclusive_access?: boolean
  [key: string]: any
}

export interface LevelConfig {
  level: number
  required_exp: number
  total_exp: number
  reward_points: number
  reward_items?: RewardItem[]
  unlocks?: string[]
  created_at: string
}

export interface RewardItem {
  type: 'points' | 'gacha_ticket' | 'avatar_frame' | 'badge'
  quantity: number
  item_id?: string
}

export interface UserRankHistory {
  id: string
  user_id: string
  previous_rank_id?: string
  new_rank_id?: string
  previous_level: number
  new_level: number
  reason: 'level_up' | 'season_reset' | 'admin_adjustment'
  created_at: string
}

export interface ExpTransaction {
  id: string
  user_id: string
  amount: number
  source: 'game' | 'quest' | 'achievement' | 'daily_bonus' | 'event'
  source_id?: string
  multiplier: number
  bonus_exp: number
  metadata: Record<string, any>
  created_at: string
}

export interface RankSeason {
  id: string
  name: string
  slug: string
  start_date: string
  end_date: string
  exp_multiplier: number
  special_rewards: Record<string, any>
  is_active: boolean
  created_at: string
}

// API Response Types
export interface GrantExpResponse {
  success: boolean
  error?: string
  exp_gained?: number
  multiplier?: number
  current_level?: number
  current_exp?: number
  level_ups?: number
  rewards?: LevelUpReward[]
  rank?: {
    name: string
    tier: number
    color: string
  }
}

export interface LevelUpReward {
  type: 'points' | 'item'
  amount?: number
  item?: RewardItem
  level: number
}

export interface UserRankInfo {
  success: boolean
  error?: string
  level?: number
  experience?: number
  next_level_exp?: number
  progress_percent?: number
  rank?: {
    id: string
    name: string
    tier: number
    color_primary: string
    color_secondary?: string
    benefits: RankBenefits
  }
}

// Rank tier constants
export const RANK_TIERS = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  DIAMOND: 5
} as const

export const RANK_COLORS = {
  1: { primary: '#cd7f32', secondary: '#b8860b', name: 'Bronze' },
  2: { primary: '#c0c0c0', secondary: '#a8a8a8', name: 'Silver' },
  3: { primary: '#ffd700', secondary: '#ffaa00', name: 'Gold' },
  4: { primary: '#e5e4e2', secondary: '#d4d4d4', name: 'Platinum' },
  5: { primary: '#b9f2ff', secondary: '#89cff0', name: 'Diamond' }
} as const

// Experience source multipliers
export const EXP_SOURCES = {
  GAME: { base: 10, multiplier: 1.0 },
  QUEST: { base: 50, multiplier: 1.2 },
  ACHIEVEMENT: { base: 100, multiplier: 1.5 },
  DAILY_BONUS: { base: 25, multiplier: 1.1 },
  EVENT: { base: 200, multiplier: 2.0 }
} as const