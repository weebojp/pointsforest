// Quest System Type Definitions
// クエストシステム用の型定義

export interface QuestTemplate {
  id: string
  name: string
  slug: string
  description: string
  type: QuestType
  category: QuestCategory
  conditions: QuestConditions
  rewards: QuestRewards
  difficulty?: QuestDifficulty
  choice_group?: string
  choice_options?: any
  duration_hours?: number
  max_completions: number
  sort_order: number
  is_active: boolean
  requires_premium: boolean
  created_at: string
  updated_at: string
}

export interface UserQuest {
  id: string
  user_id: string
  quest_template_id: string
  status: QuestStatus
  progress: Record<string, any>
  current_value: number
  target_value: number
  started_at: string
  completed_at?: string
  expires_at?: string
  rewards_claimed: boolean
  points_earned: number
  created_at: string
  updated_at: string
  
  // 関連データ（JOIN結果）
  template?: QuestTemplate
}

export interface QuestCompletion {
  id: string
  user_id: string
  quest_template_id: string
  user_quest_id: string
  completion_time: string
  points_earned: number
  bonus_multiplier: number
  metadata: Record<string, any>
  created_at: string
}

// エニュレーション
export type QuestType = 'daily' | 'weekly' | 'challenge' | 'choice'

export type QuestCategory = 'login' | 'game' | 'social' | 'achievement' | 'points'

export type QuestStatus = 'active' | 'completed' | 'failed' | 'abandoned'

export type QuestDifficulty = 'easy' | 'normal' | 'hard'

export type QuestActionType = 
  | 'login'
  | 'game_complete'
  | 'points_earned'
  | 'achievement_earned'
  | 'spring_visit'
  | 'total_points'
  | 'login_streak'

// クエスト条件
export interface QuestConditions {
  action_type: QuestActionType
  count: number
  timeframe?: string
  specific_targets?: string[]
  // その他の条件パラメータ
  [key: string]: any
}

// クエスト報酬
export interface QuestRewards {
  points: number
  items?: QuestRewardItem[]
  bonus_multiplier?: number
  special_rewards?: any[]
  // その他の報酬
  [key: string]: any
}

export interface QuestRewardItem {
  type: string
  id: string
  quantity: number
  rarity?: string
}

// API応答型
export interface QuestProgressResponse {
  success: boolean
  quests_completed: number
  total_points_earned: number
  error?: string
}

export interface DailyQuestGenerationResponse {
  success: boolean
  new_quests_generated: number
  total_active_quests: number
  error?: string
}

export interface ClaimRewardResponse {
  success: boolean
  points_earned: number
  quest_name: string
  error?: string
}

// フィルタリング・ソート用
export interface QuestFilters {
  type?: QuestType
  category?: QuestCategory
  status?: QuestStatus
  difficulty?: QuestDifficulty
  showCompleted?: boolean
  showExpired?: boolean
}

export interface QuestSortOptions {
  field: 'name' | 'difficulty' | 'points' | 'progress' | 'expires_at' | 'created_at'
  direction: 'asc' | 'desc'
}

// クエスト統計
export interface QuestStats {
  total_quests: number
  completed_quests: number
  active_quests: number
  points_from_quests: number
  completion_rate: number
  streak_count: number
  last_completed_at?: string
}

// クエストカテゴリ情報
export interface QuestCategoryInfo {
  category: QuestCategory
  name: string
  description: string
  icon: string
  color: string
}

// デフォルトのカテゴリ情報
export const QUEST_CATEGORY_INFO: Record<QuestCategory, QuestCategoryInfo> = {
  login: {
    category: 'login',
    name: 'ログイン',
    description: 'ログイン関連のクエスト',
    icon: 'Calendar',
    color: 'blue'
  },
  game: {
    category: 'game',
    name: 'ゲーム',
    description: 'ゲームプレイ関連のクエスト',
    icon: 'Gamepad2',
    color: 'green'
  },
  social: {
    category: 'social',
    name: 'ソーシャル',
    description: 'ソーシャル機能関連のクエスト',
    icon: 'Users',
    color: 'purple'
  },
  achievement: {
    category: 'achievement',
    name: 'アチーブメント',
    description: 'アチーブメント関連のクエスト',
    icon: 'Trophy',
    color: 'yellow'
  },
  points: {
    category: 'points',
    name: 'ポイント',
    description: 'ポイント獲得関連のクエスト',
    icon: 'Coins',
    color: 'orange'
  }
}

// 難易度情報
export interface QuestDifficultyInfo {
  difficulty: QuestDifficulty
  name: string
  color: string
  multiplier: number
}

export const QUEST_DIFFICULTY_INFO: Record<QuestDifficulty, QuestDifficultyInfo> = {
  easy: {
    difficulty: 'easy',
    name: '簡単',
    color: 'green',
    multiplier: 1.0
  },
  normal: {
    difficulty: 'normal',
    name: '普通',
    color: 'blue',
    multiplier: 1.5
  },
  hard: {
    difficulty: 'hard',
    name: '困難',
    color: 'red',
    multiplier: 2.0
  }
}

// クエストタイプ情報
export interface QuestTypeInfo {
  type: QuestType
  name: string
  description: string
  icon: string
  refresh_period: string
}

export const QUEST_TYPE_INFO: Record<QuestType, QuestTypeInfo> = {
  daily: {
    type: 'daily',
    name: 'デイリー',
    description: '毎日更新されるクエスト',
    icon: 'Calendar',
    refresh_period: '毎日更新'
  },
  weekly: {
    type: 'weekly',
    name: 'ウィークリー',
    description: '週単位で更新されるクエスト',
    icon: 'CalendarDays',
    refresh_period: '毎週更新'
  },
  challenge: {
    type: 'challenge',
    name: 'チャレンジ',
    description: '長期間の挑戦クエスト',
    icon: 'Target',
    refresh_period: '期間限定'
  },
  choice: {
    type: 'choice',
    name: '選択',
    description: '複数の選択肢から選ぶクエスト',
    icon: 'GitBranch',
    refresh_period: '選択制'
  }
}

// ユーティリティ型
export type QuestWithTemplate = UserQuest & {
  template: QuestTemplate
}

export type QuestSummary = {
  quest_id: string
  name: string
  progress_percentage: number
  is_completed: boolean
  expires_soon: boolean
  reward_points: number
}