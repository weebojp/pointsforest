export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          points: number
          level: number
          experience: number
          login_streak: number
          last_login_at: string | null
          last_daily_bonus_at: string | null
          avatar_url: string | null
          avatar_config: Record<string, any> | null
          profile_theme: string
          is_premium: boolean
          premium_expires_at: string | null
          is_banned: boolean
          ban_reason: string | null
          signup_ip: string | null
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name?: string | null
          points?: number
          level?: number
          experience?: number
          login_streak?: number
          last_login_at?: string | null
          last_daily_bonus_at?: string | null
          avatar_url?: string | null
          avatar_config?: Record<string, any> | null
          profile_theme?: string
          is_premium?: boolean
          premium_expires_at?: string | null
          is_banned?: boolean
          ban_reason?: string | null
          signup_ip?: string | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          points?: number
          level?: number
          experience?: number
          login_streak?: number
          last_login_at?: string | null
          last_daily_bonus_at?: string | null
          avatar_url?: string | null
          avatar_config?: Record<string, any> | null
          profile_theme?: string
          is_premium?: boolean
          premium_expires_at?: string | null
          is_banned?: boolean
          ban_reason?: string | null
          signup_ip?: string | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          balance_after: number
          type: 'earn' | 'spend' | 'bonus' | 'refund' | 'admin'
          source: string
          description: string | null
          metadata: Record<string, any> | null
          reference_id: string | null
          admin_id: string | null
          admin_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          balance_after: number
          type: 'earn' | 'spend' | 'bonus' | 'refund' | 'admin'
          source: string
          description?: string | null
          metadata?: Record<string, any> | null
          reference_id?: string | null
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          balance_after?: number
          type?: 'earn' | 'spend' | 'bonus' | 'refund' | 'admin'
          source?: string
          description?: string | null
          metadata?: Record<string, any> | null
          reference_id?: string | null
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'number_guess' | 'roulette' | 'memory' | 'trivia'
          config: Record<string, any>
          daily_limit: number
          min_points: number
          max_points: number
          is_active: boolean
          is_beta: boolean
          requires_premium: boolean
          description: string | null
          instructions: string | null
          icon_url: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: 'number_guess' | 'roulette' | 'memory' | 'trivia'
          config?: Record<string, any>
          daily_limit?: number
          min_points?: number
          max_points?: number
          is_active?: boolean
          is_beta?: boolean
          requires_premium?: boolean
          description?: string | null
          instructions?: string | null
          icon_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: 'number_guess' | 'roulette' | 'memory' | 'trivia'
          config?: Record<string, any>
          daily_limit?: number
          min_points?: number
          max_points?: number
          is_active?: boolean
          is_beta?: boolean
          requires_premium?: boolean
          description?: string | null
          instructions?: string | null
          icon_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          game_id: string
          score: number | null
          points_earned: number
          duration_seconds: number | null
          game_data: Record<string, any> | null
          metadata: Record<string, any> | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          score?: number | null
          points_earned?: number
          duration_seconds?: number | null
          game_data?: Record<string, any> | null
          metadata?: Record<string, any> | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          score?: number | null
          points_earned?: number
          duration_seconds?: number | null
          game_data?: Record<string, any> | null
          metadata?: Record<string, any> | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: 'login' | 'games' | 'points' | 'social' | 'special'
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          point_reward: number
          badge_image_url: string | null
          conditions: Record<string, any>
          is_secret: boolean
          is_repeatable: boolean
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category: 'login' | 'games' | 'points' | 'social' | 'special'
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          point_reward?: number
          badge_image_url?: string | null
          conditions: Record<string, any>
          is_secret?: boolean
          is_repeatable?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: 'login' | 'games' | 'points' | 'social' | 'special'
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          point_reward?: number
          badge_image_url?: string | null
          conditions?: Record<string, any>
          is_secret?: boolean
          is_repeatable?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: Record<string, any> | null
          current_value: number
          target_value: number | null
          completed_at: string | null
          notified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress?: Record<string, any> | null
          current_value?: number
          target_value?: number | null
          completed_at?: string | null
          notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: Record<string, any> | null
          current_value?: number
          target_value?: number | null
          completed_at?: string | null
          notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_game_session: {
        Args: {
          p_user_id: string
          p_game_id: string
          p_score: number
          p_points_earned: number
          p_metadata?: Record<string, any>
        }
        Returns: {
          success: boolean
          session_id?: string
          transaction_id?: string
          points_earned?: number
          error?: string
        }
      }
      check_achievements: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      process_daily_bonus: {
        Args: {
          p_user_id: string
        }
        Returns: {
          success: boolean
          points_earned?: number
          streak?: number
          error?: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}