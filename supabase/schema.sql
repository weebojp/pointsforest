-- Points Forest Database Schema (修正版)
-- This file sets up the complete database structure for the gamification platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  
  -- Game progression
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  experience INTEGER DEFAULT 0 CHECK (experience >= 0),
  
  -- Engagement tracking
  login_streak INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  last_daily_bonus_at TIMESTAMPTZ,
  
  -- Profile customization
  avatar_url TEXT,
  avatar_config JSONB DEFAULT '{}',
  profile_theme TEXT DEFAULT 'default',
  
  -- Account status
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  
  -- Metadata
  signup_ip INET,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount INTEGER NOT NULL, -- Can be negative for spending
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'bonus', 'refund', 'admin')),
  source TEXT NOT NULL, -- 'game', 'achievement', 'daily_bonus', 'purchase', etc.
  
  -- Context
  description TEXT,
  metadata JSONB DEFAULT '{}',
  reference_id UUID, -- Links to game_sessions, purchases, etc.
  
  -- Admin tracking
  admin_id UUID REFERENCES users(id), -- If admin action
  admin_note TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games configuration table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  type TEXT NOT NULL CHECK (type IN ('number_guess', 'roulette', 'memory', 'trivia')),
  
  -- Game configuration
  config JSONB NOT NULL DEFAULT '{}',
  daily_limit INTEGER DEFAULT 10 CHECK (daily_limit > 0),
  min_points INTEGER DEFAULT 1,
  max_points INTEGER DEFAULT 1000,
  
  -- Game state
  is_active BOOLEAN DEFAULT TRUE,
  is_beta BOOLEAN DEFAULT FALSE,
  requires_premium BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  description TEXT,
  instructions TEXT,
  icon_url TEXT,
  thumbnail_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  
  -- Game results
  score INTEGER,
  points_earned INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  
  -- Game state
  game_data JSONB DEFAULT '{}', -- Game-specific data
  metadata JSONB DEFAULT '{}',  -- Additional context
  
  -- Session tracking
  session_id TEXT, -- Browser session ID
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('login', 'games', 'points', 'social', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  -- Reward
  point_reward INTEGER DEFAULT 0,
  badge_image_url TEXT,
  
  -- Achievement logic
  conditions JSONB NOT NULL, -- Achievement requirements
  is_secret BOOLEAN DEFAULT FALSE,
  is_repeatable BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievement progress table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Progress tracking
  progress JSONB DEFAULT '{}',
  current_value INTEGER DEFAULT 0,
  target_value INTEGER,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('points', 'level', 'game_score', 'streak')),
  
  -- Leaderboard configuration
  game_id UUID REFERENCES games(id), -- For game-specific leaderboards
  period TEXT DEFAULT 'all_time' CHECK (period IN ('all_time', 'monthly', 'weekly', 'daily')),
  
  -- Settings
  max_entries INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard entries table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ranking data
  rank INTEGER NOT NULL,
  value INTEGER NOT NULL, -- Points, score, streak, etc.
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Time period
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(leaderboard_id, user_id, period_start)
);

-- Create indexes for performance (修正版 - IMMUTABLE エラー対応)
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_users_login_streak ON users(login_streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium, premium_expires_at);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_source ON point_transactions(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_reference ON point_transactions(reference_id);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id, created_at DESC);
-- 修正: 日付関数インデックスを通常のインデックスに変更
CREATE INDEX IF NOT EXISTS idx_game_sessions_daily ON game_sessions(user_id, game_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(game_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed_at) WHERE completed_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own game sessions" ON game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Public read access for reference tables
CREATE POLICY "Anyone can read games" ON games
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read achievements" ON achievements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read leaderboards" ON leaderboards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read leaderboard entries" ON leaderboard_entries
  FOR SELECT USING (true);

-- Database functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle game sessions (修正版)
CREATE OR REPLACE FUNCTION handle_game_session(
  p_user_id UUID,
  p_game_id UUID,
  p_score INTEGER,
  p_points_earned INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_count INTEGER;
  v_game_limit INTEGER;
  v_session_id UUID;
  v_transaction_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Check daily limit (修正: DATE()関数を使用)
  SELECT count(*) INTO v_daily_count
  FROM game_sessions gs
  WHERE gs.user_id = p_user_id 
    AND gs.game_id = p_game_id
    AND DATE(gs.created_at) = CURRENT_DATE;
  
  SELECT daily_limit INTO v_game_limit
  FROM games 
  WHERE id = p_game_id;
  
  IF v_daily_count >= v_game_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily limit exceeded'
    );
  END IF;
  
  -- Get current user balance
  SELECT points INTO v_current_balance
  FROM users 
  WHERE id = p_user_id;
  
  -- Create game session
  INSERT INTO game_sessions (user_id, game_id, score, points_earned, metadata)
  VALUES (p_user_id, p_game_id, p_score, p_points_earned, p_metadata)
  RETURNING id INTO v_session_id;
  
  -- Add points to user
  UPDATE users 
  SET points = points + p_points_earned,
      experience = experience + p_points_earned,
      level = GREATEST(1, FLOOR(SQRT((experience + p_points_earned) / 100.0)) + 1),
      last_seen_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record point transaction
  INSERT INTO point_transactions (user_id, amount, balance_after, type, source, metadata, reference_id)
  VALUES (p_user_id, p_points_earned, v_current_balance + p_points_earned, 'earn', 'game', 
    jsonb_build_object('game_id', p_game_id, 'session_id', v_session_id), v_session_id)
  RETURNING id INTO v_transaction_id;
  
  -- Check for achievements
  PERFORM check_achievements(p_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'transaction_id', v_transaction_id,
    'points_earned', p_points_earned
  );
END;
$$;

-- Function to process daily bonus (修正版)
CREATE OR REPLACE FUNCTION process_daily_bonus(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_days_since_last_bonus INTEGER;
  v_new_streak INTEGER;
  v_bonus_points INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Get user data
  SELECT * INTO v_user_record
  FROM users 
  WHERE id = p_user_id;
  
  -- Check if user already claimed bonus today
  IF DATE(v_user_record.last_daily_bonus_at) = CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily bonus already claimed today'
    );
  END IF;
  
  -- Calculate days since last bonus
  IF v_user_record.last_daily_bonus_at IS NULL THEN
    v_days_since_last_bonus := 0;
  ELSE
    v_days_since_last_bonus := CURRENT_DATE - DATE(v_user_record.last_daily_bonus_at);
  END IF;
  
  -- Calculate new streak
  IF v_days_since_last_bonus <= 1 THEN
    v_new_streak := v_user_record.login_streak + 1;
  ELSE
    v_new_streak := 1; -- Reset streak if more than 1 day gap
  END IF;
  
  -- Calculate bonus points (base 10 + streak bonus)
  v_bonus_points := 10 + LEAST(v_new_streak * 2, 50); -- Max 50 bonus points
  
  -- Update user
  UPDATE users 
  SET points = points + v_bonus_points,
      login_streak = v_new_streak,
      last_daily_bonus_at = NOW(),
      last_login_at = NOW(),
      last_seen_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points INTO v_current_balance;
  
  -- Record transaction
  INSERT INTO point_transactions (user_id, amount, balance_after, type, source, description)
  VALUES (p_user_id, v_bonus_points, v_current_balance, 'bonus', 'daily_bonus', 
    FORMAT('Daily login bonus (streak: %s)', v_new_streak));
  
  -- Check for achievements
  PERFORM check_achievements(p_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'points_earned', v_bonus_points,
    'streak', v_new_streak
  );
END;
$$;

-- Basic achievement checking function (修正版)
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  achievement_record RECORD;
  user_record RECORD;
  progress_record RECORD;
  new_achievements INTEGER := 0;
  achievement_value INTEGER;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = p_user_id;
  
  -- Loop through all active achievements
  FOR achievement_record IN 
    SELECT * FROM achievements WHERE is_active = TRUE
  LOOP
    -- Get current progress
    SELECT * INTO progress_record 
    FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    
    -- Skip if achievement is already completed (and not repeatable)
    IF progress_record.completed_at IS NOT NULL AND NOT achievement_record.is_repeatable THEN
      CONTINUE;
    END IF;
    
    -- Check achievement conditions based on category
    CASE achievement_record.category
      WHEN 'login' THEN
        IF achievement_record.slug = 'first-login' AND user_record.login_streak >= 1 THEN
          PERFORM complete_achievement(p_user_id, achievement_record.id);
          new_achievements := new_achievements + 1;
        ELSIF achievement_record.slug = 'login-streak-7' AND user_record.login_streak >= 7 THEN
          PERFORM complete_achievement(p_user_id, achievement_record.id);
          new_achievements := new_achievements + 1;
        ELSIF achievement_record.slug = 'login-streak-30' AND user_record.login_streak >= 30 THEN
          PERFORM complete_achievement(p_user_id, achievement_record.id);
          new_achievements := new_achievements + 1;
        END IF;
        
      WHEN 'points' THEN
        IF achievement_record.slug = 'first-1000-points' AND user_record.points >= 1000 THEN
          PERFORM complete_achievement(p_user_id, achievement_record.id);
          new_achievements := new_achievements + 1;
        ELSIF achievement_record.slug = 'points-millionaire' AND user_record.points >= 1000000 THEN
          PERFORM complete_achievement(p_user_id, achievement_record.id);
          new_achievements := new_achievements + 1;
        END IF;
        
      WHEN 'games' THEN
        -- Count total games played
        SELECT COUNT(*) INTO achievement_value
        FROM game_sessions
        WHERE user_id = p_user_id;
        
        IF achievement_record.slug = 'games-played-10' AND achievement_value >= 10 THEN
          PERFORM complete_achievement(p_user_id, achievement_record.id);
          new_achievements := new_achievements + 1;
        ELSIF achievement_record.slug = 'games-played-100' AND achievement_value >= 100 THEN
          PERFORM complete_achievement(p_user_id, achievement_record.id);
          new_achievements := new_achievements + 1;
        END IF;
    END CASE;
  END LOOP;
  
  RETURN new_achievements;
END;
$$;

-- Function to complete an achievement (修正版)
CREATE OR REPLACE FUNCTION complete_achievement(p_user_id UUID, p_achievement_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement RECORD;
  v_current_balance INTEGER;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement
  FROM achievements
  WHERE id = p_achievement_id;
  
  -- Get current user balance
  SELECT points INTO v_current_balance
  FROM users
  WHERE id = p_user_id;
  
  -- Insert or update user achievement
  INSERT INTO user_achievements (user_id, achievement_id, completed_at, current_value, target_value)
  VALUES (p_user_id, p_achievement_id, NOW(), 1, 1)
  ON CONFLICT (user_id, achievement_id)
  DO UPDATE SET 
    completed_at = NOW(),
    current_value = user_achievements.current_value + 1,
    updated_at = NOW();
  
  -- Award points if any
  IF v_achievement.point_reward > 0 THEN
    UPDATE users
    SET points = points + v_achievement.point_reward,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Record transaction
    INSERT INTO point_transactions (user_id, amount, balance_after, type, source, description, reference_id)
    VALUES (p_user_id, v_achievement.point_reward, v_current_balance + v_achievement.point_reward, 
      'bonus', 'achievement', 
      FORMAT('Achievement unlocked: %s', v_achievement.name), p_achievement_id);
  END IF;
END;
$$;

-- Insert initial games
INSERT INTO games (name, slug, type, description, instructions, config, daily_limit, min_points, max_points) VALUES
('数字当てゲーム', 'number-guess', 'number_guess', 
 '1から100の数字を予想するゲーム', 
 '1から100の間の数字を予想してください。正解に近いほど高得点！',
 '{"minNumber": 1, "maxNumber": 100}',
 5, 1, 100),

('ルーレットゲーム', 'roulette', 'roulette',
 '運試しのルーレットゲーム',
 'ルーレットを回して運試し！レアなセグメントほど高ポイント！',
 '{"segments": [
   {"id": 0, "label": "5pt", "points": 5, "probability": 0.4, "color": "#10b981"},
   {"id": 1, "label": "10pt", "points": 10, "probability": 0.25, "color": "#3b82f6"},
   {"id": 2, "label": "25pt", "points": 25, "probability": 0.15, "color": "#8b5cf6"},
   {"id": 3, "label": "50pt", "points": 50, "probability": 0.1, "color": "#f59e0b"},
   {"id": 4, "label": "100pt", "points": 100, "probability": 0.05, "color": "#ef4444"},
   {"id": 5, "label": "200pt", "points": 200, "probability": 0.03, "color": "#ec4899"},
   {"id": 6, "label": "500pt", "points": 500, "probability": 0.015, "color": "#6366f1"},
   {"id": 7, "label": "1000pt", "points": 1000, "probability": 0.005, "color": "#dc2626"}
 ]}',
 3, 5, 1000)
ON CONFLICT (slug) DO NOTHING;

-- Insert initial achievements
INSERT INTO achievements (name, slug, description, category, rarity, conditions, point_reward, sort_order) VALUES
('初回ログイン', 'first-login', '初めてPoints Forestにログインしました', 'login', 'common', '{}', 50, 1),
('7日連続ログイン', 'login-streak-7', '7日連続でログインしました', 'login', 'rare', '{}', 200, 2),
('30日連続ログイン', 'login-streak-30', '30日連続でログインしました', 'login', 'epic', '{}', 1000, 3),
('初回1000ポイント', 'first-1000-points', '1000ポイントを獲得しました', 'points', 'common', '{}', 100, 4),
('ミリオネア', 'points-millionaire', '1,000,000ポイントを獲得しました', 'points', 'legendary', '{}', 50000, 5),
('ゲーマー', 'games-played-10', '10回ゲームをプレイしました', 'games', 'common', '{}', 200, 6),
('ゲームマスター', 'games-played-100', '100回ゲームをプレイしました', 'games', 'rare', '{}', 1000, 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert initial leaderboards
INSERT INTO leaderboards (name, type, period, max_entries) VALUES
('総合ポイントランキング', 'points', 'all_time', 100),
('今月のポイントランキング', 'points', 'monthly', 50),
('今週のポイントランキング', 'points', 'weekly', 50),
('レベルランキング', 'level', 'all_time', 100),
('ログインストリークランキング', 'streak', 'all_time', 50)
ON CONFLICT DO NOTHING;

-- ====================================
-- AVATAR SYSTEM TABLES (Phase 2.5)
-- ====================================

-- Avatar frames table
CREATE TABLE IF NOT EXISTS avatar_frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bronze', 'silver', 'gold', 'rainbow')),
  price INTEGER NOT NULL CHECK (price >= 0),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  css_class TEXT NOT NULL,
  unlock_requirement TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User avatar frames ownership
CREATE TABLE IF NOT EXISTS user_avatar_frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  frame_id UUID REFERENCES avatar_frames(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, frame_id)
);

-- Avatar accessories table
CREATE TABLE IF NOT EXISTS avatar_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hat', 'glasses', 'decoration', 'badge')),
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User avatar accessories ownership
CREATE TABLE IF NOT EXISTS user_avatar_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  accessory_id UUID REFERENCES avatar_accessories(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, accessory_id)
);

-- Shop items table
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('virtual', 'real_world', 'premium', 'limited')),
  subcategory TEXT,
  
  -- Pricing & Stock
  price INTEGER NOT NULL CHECK (price >= 0),
  original_price INTEGER CHECK (original_price >= 0),
  stock INTEGER CHECK (stock >= 0), -- NULL = unlimited
  
  -- Requirements
  level_requirement INTEGER CHECK (level_requirement >= 1),
  premium_only BOOLEAN DEFAULT FALSE,
  time_restricted_start TIMESTAMPTZ,
  time_restricted_end TIMESTAMPTZ,
  
  -- Metadata
  image_url TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  tags JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase history table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES shop_items(id) ON DELETE SET NULL,
  
  -- Purchase details
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Shipping info (for real items)
  shipping_info JSONB,
  tracking_number TEXT,
  delivered_at TIMESTAMPTZ,
  
  -- References
  transaction_id UUID REFERENCES point_transactions(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slot machine results table
CREATE TABLE IF NOT EXISTS slot_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Slot results
  reel_1 TEXT NOT NULL,
  reel_2 TEXT NOT NULL,
  reel_3 TEXT NOT NULL,
  combination_type TEXT,
  multiplier DECIMAL(5,2) DEFAULT 1.0,
  base_points INTEGER NOT NULL CHECK (base_points >= 0),
  bonus_points INTEGER DEFAULT 0 CHECK (bonus_points >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update users table for avatar system
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_frame_id UUID REFERENCES avatar_frames(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_accessories JSONB DEFAULT '[]';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_avatar_frames_user_id ON user_avatar_frames(user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatar_frames_equipped ON user_avatar_frames(user_id, is_equipped) WHERE is_equipped = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_avatar_accessories_user_id ON user_avatar_accessories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatar_accessories_equipped ON user_avatar_accessories(user_id, is_equipped) WHERE is_equipped = TRUE;
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_shop_items_featured ON shop_items(is_featured, is_active) WHERE is_featured = TRUE AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slot_results_user_id ON slot_results(user_id, created_at DESC);

-- Insert default avatar frames
INSERT INTO avatar_frames (name, type, price, rarity, css_class, sort_order) VALUES
('シンプル銅フレーム', 'bronze', 500, 'common', 'avatar-frame-bronze', 1),
('シルバーフレーム', 'silver', 2000, 'rare', 'avatar-frame-silver', 2),
('ゴールドフレーム', 'gold', 5000, 'epic', 'avatar-frame-gold', 3),
('レインボーフレーム', 'rainbow', 15000, 'legendary', 'avatar-frame-rainbow', 4)
ON CONFLICT DO NOTHING;

-- Insert sample shop items
INSERT INTO shop_items (name, description, category, subcategory, price, rarity, is_featured, sort_order) VALUES
('ベーシックハット', 'おしゃれな帽子でアバターを飾ろう', 'virtual', 'accessory', 200, 'common', FALSE, 1),
('スタイリッシュグラス', 'クールなサングラス', 'virtual', 'accessory', 500, 'rare', TRUE, 2),
('ゲームブースト(24h)', '24時間ポイント2倍', 'virtual', 'boost', 1000, 'rare', TRUE, 3),
('Amazonギフトカード 500円', 'Amazon.co.jpで使えるギフトカード', 'real_world', 'gift_card', 50000, 'epic', TRUE, 4)
ON CONFLICT DO NOTHING;

-- Avatar system database functions
CREATE OR REPLACE FUNCTION equip_avatar_frame(
  p_user_id UUID,
  p_frame_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ownership_exists BOOLEAN;
BEGIN
  -- Check if user owns the frame
  SELECT EXISTS(
    SELECT 1 FROM user_avatar_frames 
    WHERE user_id = p_user_id AND frame_id = p_frame_id
  ) INTO v_ownership_exists;
  
  IF NOT v_ownership_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Frame not owned');
  END IF;
  
  -- Unequip all frames for user
  UPDATE user_avatar_frames 
  SET is_equipped = FALSE 
  WHERE user_id = p_user_id;
  
  -- Equip the selected frame
  UPDATE user_avatar_frames 
  SET is_equipped = TRUE 
  WHERE user_id = p_user_id AND frame_id = p_frame_id;
  
  -- Update user's avatar_frame_id
  UPDATE users 
  SET avatar_frame_id = p_frame_id, updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION purchase_avatar_frame(
  p_user_id UUID,
  p_frame_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_frame RECORD;
  v_user_points INTEGER;
  v_already_owned BOOLEAN;
BEGIN
  -- Get frame info
  SELECT * INTO v_frame FROM avatar_frames WHERE id = p_frame_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Frame not found');
  END IF;
  
  -- Check if already owned
  SELECT EXISTS(
    SELECT 1 FROM user_avatar_frames 
    WHERE user_id = p_user_id AND frame_id = p_frame_id
  ) INTO v_already_owned;
  
  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Frame already owned');
  END IF;
  
  -- Check user points
  SELECT points INTO v_user_points FROM users WHERE id = p_user_id;
  
  IF v_user_points < v_frame.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;
  
  -- Deduct points
  UPDATE users 
  SET points = points - v_frame.price, updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record transaction
  INSERT INTO point_transactions (user_id, amount, type, source, description)
  VALUES (p_user_id, -v_frame.price, 'spend', 'avatar_frame', 
    FORMAT('Purchased avatar frame: %s', v_frame.name));
  
  -- Grant ownership
  INSERT INTO user_avatar_frames (user_id, frame_id)
  VALUES (p_user_id, p_frame_id);
  
  RETURN jsonb_build_object('success', true, 'frame_id', p_frame_id);
END;
$$;