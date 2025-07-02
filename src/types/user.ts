import type { Database } from './database'

export type UserProfile = Database['public']['Tables']['users']['Row']

export type PointTransaction = Database['public']['Tables']['point_transactions']['Row']

export type Game = Database['public']['Tables']['games']['Row']

export type GameSession = Database['public']['Tables']['game_sessions']['Row']

export type Achievement = Database['public']['Tables']['achievements']['Row']

export type UserAchievement = Database['public']['Tables']['user_achievements']['Row']

export interface GameResult {
  score: number
  pointsEarned: number
  metadata?: Record<string, any>
  durationSeconds?: number
}

export interface GameConfig {
  // Number Guess Game
  minNumber?: number
  maxNumber?: number
  
  // Roulette Game
  segments?: RouletteSegment[]
  
  // Memory Game
  gridSize?: number
  cardTypes?: string[]
  
  // Common config
  timeLimit?: number
  difficultyLevel?: 'easy' | 'medium' | 'hard'
}

export interface RouletteSegment {
  id: number
  label: string
  points: number
  probability: number
  color: string
}

export interface AchievementCondition {
  type: 'count' | 'streak' | 'total' | 'specific'
  field: string
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte'
  value: number | string
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time'
}

export interface LeaderboardEntry {
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  value: number
  rank: number
  metadata?: Record<string, any>
}

export interface UserStats {
  totalPoints: number
  level: number
  experience: number
  loginStreak: number
  gamesPlayed: number
  achievementsUnlocked: number
  averageScore: number
  bestScore: number
  totalPlayTime: number
}