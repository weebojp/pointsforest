// Gacha System Type Definitions
// ガチャシステム用の型定義

export interface GachaMachine {
  id: string
  name: string
  slug: string
  description: string
  type: GachaType
  cost_type: CostType
  cost_amount: number
  pull_rates: PullRates
  guaranteed_items?: any
  daily_limit?: number
  weekly_limit?: number
  requires_premium: boolean
  is_limited: boolean
  available_from?: string
  available_until?: string
  banner_image_url?: string
  animation_config: Record<string, any>
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GachaItem {
  id: string
  name: string
  slug: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  point_value?: number
  effect_config?: Record<string, any>
  image_url?: string
  icon_emoji?: string
  rarity_color: string
  is_tradeable: boolean
  is_consumable: boolean
  max_stack: number
  created_at: string
  updated_at: string
}

export interface GachaPool {
  id: string
  gacha_machine_id: string
  gacha_item_id: string
  drop_rate: number
  weight: number
  is_jackpot: boolean
  guaranteed_after?: number
  available_from?: string
  available_until?: string
  created_at: string
  
  // 関連データ
  item?: GachaItem
}

export interface GachaPull {
  id: string
  user_id: string
  gacha_machine_id: string
  cost_paid: number
  currency_type: string
  items_received: GachaPullItem[]
  total_value: number
  random_seed: number
  pull_count: number
  is_guaranteed: boolean
  ip_address?: string
  user_agent?: string
  created_at: string
  
  // 関連データ
  machine?: GachaMachine
}

export interface UserItem {
  id: string
  user_id: string
  gacha_item_id: string
  quantity: number
  is_equipped: boolean
  obtained_from: string
  obtained_at: string
  is_consumed: boolean
  consumed_at?: string
  created_at: string
  updated_at: string
  
  // 関連データ
  item?: GachaItem
}

// エニュメーション
export type GachaType = 'standard' | 'premium' | 'event' | 'daily'

export type CostType = 'points' | 'premium_currency' | 'special_key'

export type ItemCategory = 'points' | 'avatar_frame' | 'badge' | 'boost' | 'special'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical'

// プル結果の個別アイテム
export interface GachaPullItem {
  item_id: string
  name: string
  rarity: ItemRarity
  category: ItemCategory
  point_value?: number
  icon_emoji?: string
  rarity_color: string
}

// プルレート設定
export interface PullRates {
  rates: Record<ItemRarity, number>
  [key: string]: any
}

// API応答型
export interface GachaPullResponse {
  success: boolean
  pull_id?: string
  items_received: GachaPullItem[]
  total_value: number
  cost_paid: number
  remaining_balance?: number
  error?: string
}

export interface UserGachaPullsResponse {
  pulls_today: number
  remaining_pulls: number
  next_reset: string
}

// フィルタリング・ソート用
export interface GachaFilters {
  type?: GachaType
  rarity?: ItemRarity
  category?: ItemCategory
  available_only?: boolean
  show_premium?: boolean
}

export interface GachaSortOptions {
  field: 'name' | 'cost' | 'rarity' | 'created_at'
  direction: 'asc' | 'desc'
}

// ガチャ統計
export interface GachaStats {
  total_pulls: number
  total_spent: number
  total_value_received: number
  items_obtained: number
  rarity_distribution: Record<ItemRarity, number>
  favorite_machine?: string
  lucky_streak: number
  last_pull_at?: string
}

// レア度情報
export interface RarityInfo {
  rarity: ItemRarity
  name: string
  color: string
  emoji: string
  base_rate: number
  multiplier: number
}

export const RARITY_INFO: Record<ItemRarity, RarityInfo> = {
  common: {
    rarity: 'common',
    name: 'コモン',
    color: '#94a3b8',
    emoji: '⚪',
    base_rate: 0.7,
    multiplier: 1.0
  },
  uncommon: {
    rarity: 'uncommon',
    name: 'アンコモン',
    color: '#60a5fa',
    emoji: '🔵',
    base_rate: 0.2,
    multiplier: 1.5
  },
  rare: {
    rarity: 'rare',
    name: 'レア',
    color: '#fbbf24',
    emoji: '🟡',
    base_rate: 0.08,
    multiplier: 2.0
  },
  epic: {
    rarity: 'epic',
    name: 'エピック',
    color: '#a855f7',
    emoji: '🟣',
    base_rate: 0.015,
    multiplier: 4.0
  },
  legendary: {
    rarity: 'legendary',
    name: 'レジェンダリー',
    color: '#ef4444',
    emoji: '🔴',
    base_rate: 0.004,
    multiplier: 10.0
  },
  mythical: {
    rarity: 'mythical',
    name: 'ミシカル',
    color: '#f97316',
    emoji: '🟠',
    base_rate: 0.001,
    multiplier: 50.0
  }
}

// ガチャタイプ情報
export interface GachaTypeInfo {
  type: GachaType
  name: string
  description: string
  icon: string
  color: string
}

export const GACHA_TYPE_INFO: Record<GachaType, GachaTypeInfo> = {
  standard: {
    type: 'standard',
    name: 'スタンダード',
    description: '基本的なガチャ',
    icon: 'Package',
    color: 'blue'
  },
  premium: {
    type: 'premium',
    name: 'プレミアム',
    description: '高品質なアイテムが当たりやすい',
    icon: 'Star',
    color: 'purple'
  },
  event: {
    type: 'event',
    name: 'イベント',
    description: '期間限定のガチャ',
    icon: 'Sparkles',
    color: 'pink'
  },
  daily: {
    type: 'daily',
    name: 'デイリー',
    description: '1日1回のガチャ',
    icon: 'Calendar',
    color: 'green'
  }
}

// アイテムカテゴリ情報
export interface ItemCategoryInfo {
  category: ItemCategory
  name: string
  description: string
  icon: string
  color: string
}

export const ITEM_CATEGORY_INFO: Record<ItemCategory, ItemCategoryInfo> = {
  points: {
    category: 'points',
    name: 'ポイント',
    description: 'ポイントを獲得できるアイテム',
    icon: 'Coins',
    color: 'yellow'
  },
  avatar_frame: {
    category: 'avatar_frame',
    name: 'アバターフレーム',
    description: 'プロフィール用のフレーム',
    icon: 'Frame',
    color: 'blue'
  },
  badge: {
    category: 'badge',
    name: 'バッジ',
    description: '称号やバッジ',
    icon: 'Award',
    color: 'purple'
  },
  boost: {
    category: 'boost',
    name: 'ブースト',
    description: 'ゲーム効果を向上させるアイテム',
    icon: 'Zap',
    color: 'orange'
  },
  special: {
    category: 'special',
    name: 'スペシャル',
    description: '特別なアイテム',
    icon: 'Gift',
    color: 'red'
  }
}

// ユーティリティ型
export type GachaMachineWithPools = GachaMachine & {
  pools: GachaPool[]
}

export type UserItemWithDetails = UserItem & {
  item: GachaItem
}

export type GachaPullWithDetails = GachaPull & {
  machine: GachaMachine
  items: GachaItem[]
}

export type GachaResultSummary = {
  machine_name: string
  items_count: number
  total_value: number
  best_rarity: ItemRarity
  new_items: number
}

// ガチャアニメーション設定
export interface GachaAnimationConfig {
  pull_duration: number
  reveal_delay: number
  rarity_effects: Record<ItemRarity, {
    glow_color: string
    particle_count: number
    sound_effect?: string
  }>
  camera_shake: boolean
  background_effects: boolean
}

// デフォルトアニメーション設定
export const DEFAULT_ANIMATION_CONFIG: GachaAnimationConfig = {
  pull_duration: 2000,
  reveal_delay: 500,
  rarity_effects: {
    common: { glow_color: '#94a3b8', particle_count: 5 },
    uncommon: { glow_color: '#60a5fa', particle_count: 10 },
    rare: { glow_color: '#fbbf24', particle_count: 15 },
    epic: { glow_color: '#a855f7', particle_count: 25 },
    legendary: { glow_color: '#ef4444', particle_count: 50 },
    mythical: { glow_color: '#f97316', particle_count: 100 }
  },
  camera_shake: true,
  background_effects: true
}