-- ====================================
-- COMPLETE SYSTEM DEPLOYMENT SCRIPT (SAFE)
-- Deploy All Sprint 1-4 Features with Safe Schema Updates
-- ====================================

-- This script safely deploys:
-- 1. Quest System (Sprint 1)
-- 2. Gacha System (Sprint 2) 
-- 3. Rank/Level System (Sprint 3)
-- 4. Social System (Sprint 4)

-- ====================================
-- QUEST SYSTEM (SPRINT 1) - SAFE DEPLOYMENT
-- ====================================

-- Drop existing tables in correct order to avoid constraint issues
DROP TABLE IF EXISTS quest_completions CASCADE;
DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quest_templates CASCADE;

-- Quest Templates Table (recreate cleanly)
CREATE TABLE quest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Quest Configuration
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'challenge')),
  category TEXT NOT NULL CHECK (category IN ('games', 'points', 'social', 'login')),
  
  -- Requirements & Rewards
  requirements JSONB NOT NULL DEFAULT '{}',
  point_reward INTEGER DEFAULT 0 CHECK (point_reward >= 0),
  exp_reward INTEGER DEFAULT 0 CHECK (exp_reward >= 0),
  
  -- Quest Availability
  cooldown_hours INTEGER DEFAULT 24 CHECK (cooldown_hours > 0),
  max_completions INTEGER DEFAULT 1 CHECK (max_completions > 0),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Quest Properties
  difficulty TEXT DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard', 'expert')),
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Quest Progress Table (recreate cleanly)
CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_template_id UUID REFERENCES quest_templates(id) ON DELETE CASCADE,
  
  -- Progress Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  progress JSONB DEFAULT '{}',
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Add quest_date column for simple indexing
  quest_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Simple unique constraint without functions
  UNIQUE(user_id, quest_template_id, quest_date)
);

-- Quest Completions History (recreate cleanly)
CREATE TABLE quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_template_id UUID REFERENCES quest_templates(id) ON DELETE CASCADE,
  
  -- Completion Details
  points_earned INTEGER DEFAULT 0,
  exp_earned INTEGER DEFAULT 0,
  completion_time INTEGER, -- seconds taken
  
  -- Metadata
  completion_data JSONB DEFAULT '{}',
  
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- GACHA SYSTEM (SPRINT 2) - SAFE DEPLOYMENT
-- ====================================

-- Drop existing gacha tables
DROP TABLE IF EXISTS daily_gacha_limits CASCADE;
DROP TABLE IF EXISTS user_items CASCADE;
DROP TABLE IF EXISTS gacha_pulls CASCADE;
DROP TABLE IF EXISTS gacha_pools CASCADE;
DROP TABLE IF EXISTS gacha_items CASCADE;
DROP TABLE IF EXISTS gacha_machines CASCADE;

-- Gacha Machines Table (recreate cleanly)
CREATE TABLE gacha_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Machine Configuration
  cost_per_pull INTEGER NOT NULL CHECK (cost_per_pull > 0),
  pulls_per_day INTEGER DEFAULT 10 CHECK (pulls_per_day > 0),
  machine_type TEXT DEFAULT 'standard' CHECK (machine_type IN ('standard', 'premium', 'event')),
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Visual
  banner_image_url TEXT,
  icon_url TEXT,
  theme_color TEXT DEFAULT '#3b82f6',
  
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gacha Items Table (recreate cleanly)
CREATE TABLE gacha_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Item Properties
  item_type TEXT NOT NULL CHECK (item_type IN ('avatar', 'frame', 'currency', 'booster', 'cosmetic')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythical', 'cosmic')),
  
  -- Item Value
  point_value INTEGER DEFAULT 0 CHECK (point_value >= 0),
  
  -- Visual
  image_url TEXT,
  icon_url TEXT,
  rarity_color TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  special_effect TEXT,
  flavor_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gacha Pools (Machine-Item Relationships)
CREATE TABLE gacha_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES gacha_machines(id) ON DELETE CASCADE,
  item_id UUID REFERENCES gacha_items(id) ON DELETE CASCADE,
  
  -- Drop Rate Configuration
  drop_rate DECIMAL(10,8) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 1),
  weight INTEGER DEFAULT 1 CHECK (weight > 0),
  
  -- Availability
  is_featured BOOLEAN DEFAULT FALSE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(machine_id, item_id)
);

-- Gacha Pull History
CREATE TABLE gacha_pulls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES gacha_machines(id) ON DELETE CASCADE,
  item_id UUID REFERENCES gacha_items(id) ON DELETE CASCADE,
  
  -- Pull Details
  cost_paid INTEGER NOT NULL,
  bonus_pull BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  pull_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Items Inventory
CREATE TABLE user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES gacha_items(id) ON DELETE CASCADE,
  
  -- Item Details
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  is_equipped BOOLEAN DEFAULT FALSE,
  
  -- Acquisition Info
  acquired_from TEXT DEFAULT 'gacha',
  acquisition_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  item_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, item_id)
);

-- Daily Pull Limits Tracking
CREATE TABLE daily_gacha_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES gacha_machines(id) ON DELETE CASCADE,
  
  -- Limit Tracking
  pulls_today INTEGER DEFAULT 0 CHECK (pulls_today >= 0),
  last_pull_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, machine_id, last_pull_date)
);

-- ====================================
-- RANK & LEVEL SYSTEM (SPRINT 3) - SAFE DEPLOYMENT
-- ====================================

-- Drop existing rank tables
DROP TABLE IF EXISTS rank_seasons CASCADE;
DROP TABLE IF EXISTS exp_transactions CASCADE;
DROP TABLE IF EXISTS user_rank_history CASCADE;
DROP TABLE IF EXISTS level_configs CASCADE;
DROP TABLE IF EXISTS ranks CASCADE;

-- Ranks Table (recreate cleanly)
CREATE TABLE ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tier INTEGER NOT NULL UNIQUE CHECK (tier >= 1 AND tier <= 10),
  
  -- Rank Requirements
  min_level INTEGER NOT NULL CHECK (min_level >= 1),
  level_range_start INTEGER NOT NULL,
  level_range_end INTEGER,
  
  -- Visual Styling
  color_primary TEXT NOT NULL DEFAULT '#6b7280',
  color_secondary TEXT NOT NULL DEFAULT '#9ca3af',
  icon_name TEXT,
  
  -- Rank Benefits (JSONB for flexibility)
  benefits JSONB DEFAULT '{}',
  
  -- Metadata
  description TEXT,
  rank_order INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Level Configuration Table (recreate cleanly)
CREATE TABLE level_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE CHECK (level >= 1),
  
  -- Experience Requirements
  experience_required BIGINT NOT NULL CHECK (experience_required >= 0),
  experience_total BIGINT NOT NULL CHECK (experience_total >= 0),
  
  -- Level Rewards
  point_reward INTEGER DEFAULT 0 CHECK (point_reward >= 0),
  special_reward JSONB DEFAULT '{}',
  
  -- Metadata
  is_milestone BOOLEAN DEFAULT FALSE,
  milestone_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Rank History Table (recreate cleanly)
CREATE TABLE user_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rank_id UUID REFERENCES ranks(id) ON DELETE CASCADE,
  
  -- Rank Achievement
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  previous_rank_id UUID REFERENCES ranks(id),
  level_when_achieved INTEGER,
  
  -- Achievement Details
  achievement_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experience Transactions Table (recreate cleanly)
CREATE TABLE exp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction Details
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('quest', 'game', 'bonus', 'admin')),
  source TEXT NOT NULL,
  description TEXT,
  
  -- Level Impact
  level_before INTEGER,
  level_after INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rank Seasons Table (recreate cleanly)
CREATE TABLE rank_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- Season Period
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Season Configuration
  is_active BOOLEAN DEFAULT FALSE,
  season_type TEXT DEFAULT 'regular' CHECK (season_type IN ('regular', 'special', 'event')),
  
  -- Rewards & Rules
  season_rules JSONB DEFAULT '{}',
  season_rewards JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_season_dates CHECK (end_date > start_date)
);

-- ====================================
-- SOCIAL SYSTEM (SPRINT 4) - SAFE DEPLOYMENT
-- ====================================

-- Drop existing social tables
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS private_messages CASCADE;
DROP TABLE IF EXISTS guild_activities CASCADE;
DROP TABLE IF EXISTS guild_members CASCADE;
DROP TABLE IF EXISTS guilds CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Friendships Table (recreate cleanly)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- フレンド状態
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked', 'rejected')),
  
  -- Simple friendship pair tracking (avoid LEAST/GREATEST functions)
  user1_id UUID GENERATED ALWAYS AS (
    CASE WHEN requester_id < addressee_id THEN requester_id ELSE addressee_id END
  ) STORED,
  user2_id UUID GENERATED ALWAYS AS (
    CASE WHEN requester_id < addressee_id THEN addressee_id ELSE requester_id END
  ) STORED,
  
  -- メタデータ
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  blocked_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 制約: 自分自身とはフレンドになれない
  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
  -- Simple unique constraint without functions
  UNIQUE(user1_id, user2_id)
);

-- Guilds Table (recreate cleanly)
CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- ギルド設定
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 50 CHECK (max_members > 0),
  is_public BOOLEAN DEFAULT TRUE,
  join_policy TEXT DEFAULT 'open' CHECK (join_policy IN ('open', 'approval', 'invite_only')),
  
  -- ギルド統計
  member_count INTEGER DEFAULT 0,
  total_points BIGINT DEFAULT 0,
  guild_level INTEGER DEFAULT 1 CHECK (guild_level >= 1),
  guild_exp BIGINT DEFAULT 0,
  
  -- 視覚設定
  banner_url TEXT,
  icon_url TEXT,
  color_theme TEXT DEFAULT '#10b981',
  
  -- メタデータ
  founded_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guild Members Table (recreate cleanly)
CREATE TABLE guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- メンバー役職
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
  
  -- 貢献度
  points_contributed BIGINT DEFAULT 0,
  last_contribution_at TIMESTAMPTZ,
  
  -- メンバーシップ状態
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'banned')),
  
  -- 参加情報
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guild_id, user_id)
);

-- Guild Activities Table (recreate cleanly)
CREATE TABLE guild_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- 活動内容
  activity_type TEXT NOT NULL, -- 'member_join', 'member_leave', 'points_contribution', 'level_up', 'achievement'
  title TEXT NOT NULL,
  description TEXT,
  
  -- 活動データ
  points_involved INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Private Messages Table (recreate cleanly)
CREATE TABLE private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- メッセージ内容
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'achievement_share')),
  
  -- メッセージ状態
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
  
  -- 添付データ（実績共有など）
  attachment JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 制約: 自分自身にはメッセージを送れない
  CONSTRAINT no_self_message CHECK (sender_id != recipient_id)
);

-- Social Posts Table (recreate cleanly)
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 投稿内容
  content TEXT,
  post_type TEXT DEFAULT 'status' CHECK (post_type IN ('status', 'achievement', 'level_up', 'system')),
  
  -- 投稿データ
  achievement_id UUID REFERENCES achievements(id),
  metadata JSONB DEFAULT '{}',
  
  -- 投稿統計
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- 公開設定
  visibility TEXT DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'guild')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes Table (recreate cleanly)
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- ====================================
-- RPC FUNCTIONS
-- ====================================

-- Quest Management Functions
CREATE OR REPLACE FUNCTION assign_daily_quests(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_assigned_count INTEGER := 0;
BEGIN
  -- Check if user already has today's daily quests
  IF EXISTS (
    SELECT 1 FROM user_quests 
    WHERE user_id = p_user_id 
    AND quest_template_id IN (
      SELECT id FROM quest_templates WHERE quest_type = 'daily'
    )
    AND quest_date = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Today''s quests already assigned'
    );
  END IF;
  
  -- Assign all active daily quests
  FOR v_quest IN 
    SELECT * FROM quest_templates 
    WHERE quest_type = 'daily' 
    AND is_active = TRUE
    ORDER BY sort_order
  LOOP
    INSERT INTO user_quests (
      user_id, 
      quest_template_id, 
      target_value,
      expires_at,
      quest_date
    ) VALUES (
      p_user_id,
      v_quest.id,
      (v_quest.requirements->>'target_value')::INTEGER,
      NOW() + INTERVAL '24 hours',
      CURRENT_DATE
    );
    
    v_assigned_count := v_assigned_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', FORMAT('Assigned %s daily quests', v_assigned_count),
    'quests_assigned', v_assigned_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_id UUID,
  p_quest_type TEXT,
  p_category TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_completed_count INTEGER := 0;
BEGIN
  -- Update progress for matching active quests
  FOR v_quest IN
    SELECT uq.*, qt.point_reward, qt.exp_reward, qt.name
    FROM user_quests uq
    JOIN quest_templates qt ON uq.quest_template_id = qt.id
    WHERE uq.user_id = p_user_id
    AND uq.status = 'active'
    AND qt.quest_type = p_quest_type
    AND qt.category = p_category
    AND (uq.expires_at IS NULL OR uq.expires_at > NOW())
  LOOP
    -- Update progress
    UPDATE user_quests
    SET current_value = LEAST(current_value + p_increment, target_value),
        updated_at = NOW()
    WHERE id = v_quest.id;
    
    -- Check if quest is completed
    IF (v_quest.current_value + p_increment) >= v_quest.target_value THEN
      -- Mark as completed
      UPDATE user_quests
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = v_quest.id;
      
      -- Record completion
      INSERT INTO quest_completions (
        user_id, quest_template_id, points_earned, exp_earned
      ) VALUES (
        p_user_id, v_quest.quest_template_id, 
        v_quest.point_reward, v_quest.exp_reward
      );
      
      -- Award points and experience
      IF v_quest.point_reward > 0 THEN
        INSERT INTO point_transactions (user_id, amount, type, source, description)
        VALUES (p_user_id, v_quest.point_reward, 'earn', 'quest', 
               FORMAT('Quest completed: %s', v_quest.name));
        
        UPDATE users SET points = points + v_quest.point_reward WHERE id = p_user_id;
      END IF;
      
      IF v_quest.exp_reward > 0 THEN
        UPDATE users SET experience = experience + v_quest.exp_reward WHERE id = p_user_id;
      END IF;
      
      v_completed_count := v_completed_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'quests_completed', v_completed_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_user_quests(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '[]';
  v_quest RECORD;
BEGIN
  FOR v_quest IN
    SELECT 
      uq.*,
      qt.name,
      qt.description,
      qt.quest_type,
      qt.category,
      qt.point_reward,
      qt.exp_reward,
      qt.difficulty
    FROM user_quests uq
    JOIN quest_templates qt ON uq.quest_template_id = qt.id
    WHERE uq.user_id = p_user_id
    AND uq.status IN ('active', 'completed')
    AND (uq.expires_at IS NULL OR uq.expires_at > NOW())
    ORDER BY 
      CASE WHEN uq.status = 'active' THEN 0 ELSE 1 END,
      qt.sort_order
  LOOP
    v_result := v_result || jsonb_build_object(
      'id', v_quest.id,
      'quest_template_id', v_quest.quest_template_id,
      'name', v_quest.name,
      'description', v_quest.description,
      'quest_type', v_quest.quest_type,
      'category', v_quest.category,
      'status', v_quest.status,
      'current_value', v_quest.current_value,
      'target_value', v_quest.target_value,
      'point_reward', v_quest.point_reward,
      'exp_reward', v_quest.exp_reward,
      'difficulty', v_quest.difficulty,
      'progress_percentage', ROUND((v_quest.current_value::DECIMAL / v_quest.target_value) * 100, 1),
      'started_at', v_quest.started_at,
      'completed_at', v_quest.completed_at,
      'expires_at', v_quest.expires_at
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Gacha Execution Function
CREATE OR REPLACE FUNCTION execute_gacha_pull(
  p_user_id UUID,
  p_machine_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_machine RECORD;
  v_user RECORD;
  v_auth_user RECORD;
  v_daily_limit RECORD;
  v_selected_item RECORD;
  v_random_value DECIMAL;
  v_cumulative_rate DECIMAL := 0;
  v_pool_item RECORD;
  v_existing_item RECORD;
BEGIN
  -- Get machine details
  SELECT * INTO v_machine FROM gacha_machines WHERE id = p_machine_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ガチャマシンが見つかりません');
  END IF;
  
  -- Get user details (with auto-creation fallback)
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    -- Auto-create user profile if missing
    SELECT * INTO v_auth_user FROM auth.users WHERE id = p_user_id;
    IF FOUND THEN
      INSERT INTO users (id, email, username, display_name)
      VALUES (
        v_auth_user.id, 
        v_auth_user.email, 
        COALESCE(v_auth_user.raw_user_meta_data->>'username', SPLIT_PART(v_auth_user.email, '@', 1)),
        COALESCE(v_auth_user.raw_user_meta_data->>'display_name', SPLIT_PART(v_auth_user.email, '@', 1))
      );
      
      SELECT * INTO v_user FROM users WHERE id = p_user_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'ユーザーが見つかりません');
    END IF;
  END IF;
  
  -- Check if user has enough points
  IF v_user.points < v_machine.cost_per_pull THEN
    RETURN jsonb_build_object('success', false, 'error', 'ポイントが不足しています');
  END IF;
  
  -- Check daily pull limit
  SELECT * INTO v_daily_limit 
  FROM daily_gacha_limits 
  WHERE user_id = p_user_id 
  AND machine_id = p_machine_id 
  AND last_pull_date = CURRENT_DATE;
  
  IF FOUND AND v_daily_limit.pulls_today >= v_machine.pulls_per_day THEN
    RETURN jsonb_build_object('success', false, 'error', '本日の引き回数上限に達しています');
  END IF;
  
  -- Generate random value for gacha roll
  v_random_value := RANDOM();
  
  -- Select item based on drop rates
  FOR v_pool_item IN
    SELECT gp.*, gi.* 
    FROM gacha_pools gp
    JOIN gacha_items gi ON gp.item_id = gi.id
    WHERE gp.machine_id = p_machine_id
    AND (gp.available_from IS NULL OR gp.available_from <= NOW())
    AND (gp.available_until IS NULL OR gp.available_until >= NOW())
    ORDER BY gp.drop_rate DESC
  LOOP
    v_cumulative_rate := v_cumulative_rate + v_pool_item.drop_rate;
    
    IF v_random_value <= v_cumulative_rate THEN
      v_selected_item := v_pool_item;
      EXIT;
    END IF;
  END LOOP;
  
  -- Fallback to most common item if nothing selected
  IF v_selected_item IS NULL THEN
    SELECT gp.*, gi.* INTO v_selected_item
    FROM gacha_pools gp
    JOIN gacha_items gi ON gp.item_id = gi.id
    WHERE gp.machine_id = p_machine_id
    ORDER BY gp.drop_rate DESC
    LIMIT 1;
  END IF;
  
  IF v_selected_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'アイテムの選択に失敗しました');
  END IF;
  
  -- Deduct points from user
  UPDATE users 
  SET points = points - v_machine.cost_per_pull,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record the pull
  INSERT INTO gacha_pulls (user_id, machine_id, item_id, cost_paid)
  VALUES (p_user_id, p_machine_id, v_selected_item.item_id, v_machine.cost_per_pull);
  
  -- Add item to user inventory
  SELECT * INTO v_existing_item 
  FROM user_items 
  WHERE user_id = p_user_id AND item_id = v_selected_item.item_id;
  
  IF FOUND THEN
    UPDATE user_items 
    SET quantity = quantity + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id AND item_id = v_selected_item.item_id;
  ELSE
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, v_selected_item.item_id, 1);
  END IF;
  
  -- Update daily pull limit
  INSERT INTO daily_gacha_limits (user_id, machine_id, pulls_today, last_pull_date)
  VALUES (p_user_id, p_machine_id, 1, CURRENT_DATE)
  ON CONFLICT (user_id, machine_id, last_pull_date)
  DO UPDATE SET pulls_today = daily_gacha_limits.pulls_today + 1, updated_at = NOW();
  
  -- Record transaction
  INSERT INTO point_transactions (user_id, amount, type, source, description)
  VALUES (p_user_id, -v_machine.cost_per_pull, 'spend', 'gacha', 
         FORMAT('Gacha pull: %s', v_machine.name));
  
  -- If currency item, add points to user
  IF v_selected_item.item_type = 'currency' AND v_selected_item.point_value > 0 THEN
    UPDATE users 
    SET points = points + v_selected_item.point_value
    WHERE id = p_user_id;
    
    INSERT INTO point_transactions (user_id, amount, type, source, description)
    VALUES (p_user_id, v_selected_item.point_value, 'earn', 'gacha_reward', 
           FORMAT('Currency item: %s', v_selected_item.name));
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'item', jsonb_build_object(
      'id', v_selected_item.item_id,
      'name', v_selected_item.name,
      'description', v_selected_item.description,
      'rarity', v_selected_item.rarity,
      'item_type', v_selected_item.item_type,
      'point_value', v_selected_item.point_value,
      'image_url', v_selected_item.image_url,
      'rarity_color', v_selected_item.rarity_color
    ),
    'cost_paid', v_machine.cost_per_pull
  );
END;
$$;

-- Experience & Ranking Functions
CREATE OR REPLACE FUNCTION grant_experience(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_level_before INTEGER;
  v_level_after INTEGER;
  v_new_experience BIGINT;
  v_level_config RECORD;
  v_points_earned INTEGER := 0;
  v_rank_changed BOOLEAN := FALSE;
BEGIN
  -- Get current user data
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  v_level_before := v_user.level;
  v_new_experience := v_user.experience + p_amount;
  
  -- Calculate new level based on experience
  SELECT level INTO v_level_after 
  FROM level_configs 
  WHERE experience_total <= v_new_experience 
  ORDER BY level DESC 
  LIMIT 1;
  
  -- Default to level 1 if no config found
  IF v_level_after IS NULL THEN
    v_level_after := 1;
  END IF;
  
  -- Update user experience and level
  UPDATE users 
  SET experience = v_new_experience,
      level = v_level_after,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record experience transaction
  INSERT INTO exp_transactions (
    user_id, amount, transaction_type, source, description,
    level_before, level_after
  ) VALUES (
    p_user_id, p_amount, 
    CASE 
      WHEN p_source IN ('quest', 'game') THEN p_source
      ELSE 'bonus'
    END,
    p_source, p_description,
    v_level_before, v_level_after
  );
  
  -- Handle level up rewards
  IF v_level_after > v_level_before THEN
    -- Check for level rewards in the range
    FOR v_level_config IN
      SELECT * FROM level_configs 
      WHERE level > v_level_before AND level <= v_level_after
      ORDER BY level
    LOOP
      IF v_level_config.point_reward > 0 THEN
        v_points_earned := v_points_earned + v_level_config.point_reward;
        
        INSERT INTO point_transactions (user_id, amount, type, source, description)
        VALUES (p_user_id, v_level_config.point_reward, 'earn', 'level_up', 
               FORMAT('Level %s reward', v_level_config.level));
      END IF;
    END LOOP;
    
    -- Award accumulated points
    IF v_points_earned > 0 THEN
      UPDATE users 
      SET points = points + v_points_earned
      WHERE id = p_user_id;
    END IF;
    
    -- Check for rank changes
    PERFORM update_user_rank(p_user_id, v_level_after);
    v_rank_changed := TRUE;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'experience_gained', p_amount,
    'new_experience', v_new_experience,
    'level_before', v_level_before,
    'level_after', v_level_after,
    'points_earned', v_points_earned,
    'rank_changed', v_rank_changed
  );
END;
$$;

CREATE OR REPLACE FUNCTION update_user_rank(
  p_user_id UUID,
  p_current_level INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_rank RECORD;
  v_new_rank RECORD;
  v_user_rank_history RECORD;
BEGIN
  -- Get user's current rank from history
  SELECT r.* INTO v_current_rank
  FROM user_rank_history urh
  JOIN ranks r ON urh.rank_id = r.id
  WHERE urh.user_id = p_user_id
  ORDER BY urh.achieved_at DESC
  LIMIT 1;
  
  -- Determine new rank based on level
  SELECT * INTO v_new_rank
  FROM ranks
  WHERE p_current_level >= min_level
  AND (level_range_end IS NULL OR p_current_level <= level_range_end)
  ORDER BY tier DESC
  LIMIT 1;
  
  -- If no rank found, get the lowest rank
  IF v_new_rank IS NULL THEN
    SELECT * INTO v_new_rank FROM ranks ORDER BY tier ASC LIMIT 1;
  END IF;
  
  -- Check if rank has changed
  IF v_current_rank IS NULL OR v_current_rank.id != v_new_rank.id THEN
    -- Record new rank achievement
    INSERT INTO user_rank_history (
      user_id, rank_id, previous_rank_id, level_when_achieved
    ) VALUES (
      p_user_id, v_new_rank.id, v_current_rank.id, p_current_level
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_rank_info(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_rank RECORD;
  v_next_level_config RECORD;
  v_result JSONB;
BEGIN
  -- Get user data
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get current rank
  SELECT r.* INTO v_rank
  FROM user_rank_history urh
  JOIN ranks r ON urh.rank_id = r.id
  WHERE urh.user_id = p_user_id
  ORDER BY urh.achieved_at DESC
  LIMIT 1;
  
  -- Get next level experience requirement
  SELECT * INTO v_next_level_config
  FROM level_configs
  WHERE level = v_user.level + 1;
  
  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'level', v_user.level,
    'experience', v_user.experience,
    'next_level_exp', COALESCE(v_next_level_config.experience_total - v_user.experience, 0)
  );
  
  -- Add rank information if available
  IF v_rank IS NOT NULL THEN
    v_result := v_result || jsonb_build_object(
      'rank', jsonb_build_object(
        'id', v_rank.id,
        'name', v_rank.name,
        'tier', v_rank.tier,
        'color_primary', v_rank.color_primary,
        'color_secondary', v_rank.color_secondary,
        'benefits', v_rank.benefits,
        'description', v_rank.description
      )
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Social System Functions
CREATE OR REPLACE FUNCTION send_friend_request(
  p_requester_id UUID,
  p_addressee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
BEGIN
  -- 自分自身へのリクエストをチェック
  IF p_requester_id = p_addressee_id THEN
    RETURN jsonb_build_object('success', false, 'error', '自分自身にフレンドリクエストを送ることはできません');
  END IF;
  
  -- 既存の関係をチェック
  SELECT * INTO v_existing
  FROM friendships
  WHERE (requester_id = p_requester_id AND addressee_id = p_addressee_id)
     OR (requester_id = p_addressee_id AND addressee_id = p_requester_id);
  
  IF FOUND THEN
    CASE v_existing.status
      WHEN 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', '既にフレンドリクエストが送信されています');
      WHEN 'accepted' THEN
        RETURN jsonb_build_object('success', false, 'error', '既にフレンドです');
      WHEN 'blocked' THEN
        RETURN jsonb_build_object('success', false, 'error', 'このユーザーとの関係はブロックされています');
    END CASE;
  END IF;
  
  -- 新しいフレンドリクエストを作成
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (p_requester_id, p_addressee_id, 'pending');
  
  RETURN jsonb_build_object('success', true, 'message', 'フレンドリクエストを送信しました');
END;
$$;

CREATE OR REPLACE FUNCTION accept_friend_request(
  p_user_id UUID,
  p_requester_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friendship RECORD;
BEGIN
  -- フレンドリクエストを取得
  SELECT * INTO v_friendship
  FROM friendships
  WHERE requester_id = p_requester_id 
    AND addressee_id = p_user_id 
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'フレンドリクエストが見つかりません');
  END IF;
  
  -- フレンドリクエストを承諾
  UPDATE friendships
  SET status = 'accepted',
      responded_at = NOW(),
      updated_at = NOW()
  WHERE id = v_friendship.id;
  
  RETURN jsonb_build_object('success', true, 'message', 'フレンドリクエストを承諾しました');
END;
$$;

CREATE OR REPLACE FUNCTION join_guild(
  p_user_id UUID,
  p_guild_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guild RECORD;
  v_current_guild UUID;
BEGIN
  -- ギルド情報取得
  SELECT * INTO v_guild FROM guilds WHERE slug = p_guild_slug AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ギルドが見つかりません');
  END IF;
  
  -- 既存のギルドメンバーシップをチェック
  SELECT guild_id INTO v_current_guild
  FROM guild_members
  WHERE user_id = p_user_id AND status = 'active';
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '既に他のギルドに参加しています');
  END IF;
  
  -- メンバー数制限チェック
  IF v_guild.member_count >= v_guild.max_members THEN
    RETURN jsonb_build_object('success', false, 'error', 'ギルドの定員に達しています');
  END IF;
  
  -- ギルドに参加
  INSERT INTO guild_members (guild_id, user_id, role, status)
  VALUES (v_guild.id, p_user_id, 'member', 'active');
  
  -- ギルドのメンバー数を更新
  UPDATE guilds
  SET member_count = member_count + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE id = v_guild.id;
  
  -- 活動ログに記録
  INSERT INTO guild_activities (guild_id, user_id, activity_type, title, description)
  VALUES (v_guild.id, p_user_id, 'member_join', 'メンバー参加', '新しいメンバーがギルドに参加しました');
  
  RETURN jsonb_build_object('success', true, 'message', FORMAT('ギルド「%s」に参加しました', v_guild.name));
END;
$$;

CREATE OR REPLACE FUNCTION get_user_friends(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '[]';
  v_friend RECORD;
BEGIN
  FOR v_friend IN
    SELECT 
      CASE 
        WHEN f.requester_id = p_user_id THEN f.addressee_id
        ELSE f.requester_id
      END as friend_id,
      u.username,
      u.display_name,
      u.level,
      u.last_seen_at,
      f.created_at as friendship_since
    FROM friendships f
    JOIN users u ON (
      CASE 
        WHEN f.requester_id = p_user_id THEN f.addressee_id = u.id
        ELSE f.requester_id = u.id
      END
    )
    WHERE (f.requester_id = p_user_id OR f.addressee_id = p_user_id)
      AND f.status = 'accepted'
    ORDER BY u.last_seen_at DESC
  LOOP
    v_result := v_result || jsonb_build_object(
      'user_id', v_friend.friend_id,
      'username', v_friend.username,
      'display_name', v_friend.display_name,
      'level', v_friend.level,
      'last_seen_at', v_friend.last_seen_at,
      'friendship_since', v_friend.friendship_since,
      'is_online', (v_friend.last_seen_at > NOW() - INTERVAL '5 minutes')
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- ====================================
-- CREATE INDEXES
-- ====================================

-- Quest System Indexes
CREATE INDEX IF NOT EXISTS idx_quest_templates_type ON quest_templates(quest_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_status ON user_quests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_quests_date ON user_quests(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user ON quest_completions(user_id, completed_at DESC);

-- Gacha System Indexes
CREATE INDEX IF NOT EXISTS idx_gacha_pools_machine ON gacha_pools(machine_id, drop_rate DESC);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_user ON gacha_pulls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_items_user ON user_items(user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_daily_gacha_limits_user_date ON daily_gacha_limits(user_id, machine_id, last_pull_date);

-- Rank System Indexes
CREATE INDEX IF NOT EXISTS idx_ranks_tier ON ranks(tier);
CREATE INDEX IF NOT EXISTS idx_level_configs_level ON level_configs(level);
CREATE INDEX IF NOT EXISTS idx_user_rank_history_user ON user_rank_history(user_id, achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_transactions_user ON exp_transactions(user_id, created_at DESC);

-- Social System Indexes
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_pair ON friendships(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id, status);
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON guild_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_guild_activities_guild_id ON guild_activities(guild_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_participants ON private_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON social_posts(visibility, created_at DESC);

-- ====================================
-- INSERT DEFAULT DATA
-- ====================================

-- Default Quest Templates
INSERT INTO quest_templates (name, description, quest_type, category, requirements, point_reward, exp_reward, difficulty, sort_order) VALUES
('デイリーログイン', '1日1回ログインする', 'daily', 'login', '{"target_value": 1, "action": "login"}', 50, 10, 'easy', 1),
('ゲーム初心者', '任意のゲームを3回プレイする', 'daily', 'games', '{"target_value": 3, "action": "play_game"}', 100, 20, 'easy', 2),
('ポイントハンター', '200ポイントを獲得する', 'daily', 'points', '{"target_value": 200, "action": "earn_points"}', 150, 30, 'normal', 3),
('週間チャレンジャー', '週間で1000ポイントを獲得する', 'weekly', 'points', '{"target_value": 1000, "action": "earn_points"}', 500, 100, 'hard', 4),
('ソーシャルマスター', 'フレンドと5回交流する', 'weekly', 'social', '{"target_value": 5, "action": "social_interaction"}', 300, 60, 'normal', 5);

-- Default Gacha Machines
INSERT INTO gacha_machines (name, description, cost_per_pull, pulls_per_day, machine_type, theme_color, sort_order) VALUES
('スタンダードガチャ', '基本的なアイテムが手に入るガチャです', 100, 10, 'standard', '#3b82f6', 1),
('プレミアムガチャ', 'レアなアイテムが高確率で手に入ります', 300, 5, 'premium', '#8b5cf6', 2);

-- Default Gacha Items
INSERT INTO gacha_items (name, description, item_type, rarity, point_value, rarity_color) VALUES
('ブロンズコイン', '少量のポイントがもらえます', 'currency', 'common', 50, '#cd7f32'),
('シルバーコイン', '中程度のポイントがもらえます', 'currency', 'rare', 150, '#c0c0c0'),
('ゴールドコイン', '大量のポイントがもらえます', 'currency', 'epic', 500, '#ffd700'),
('プラチナコイン', '非常に大量のポイントがもらえます', 'currency', 'legendary', 1500, '#e5e4e2'),
('ダイヤモンドコイン', '極大量のポイントがもらえます', 'currency', 'mythical', 5000, '#b9f2ff'),
('基本フレーム', 'シンプルなアバターフレーム', 'frame', 'common', 0, '#9ca3af'),
('装飾フレーム', '美しい装飾が施されたフレーム', 'frame', 'rare', 0, '#3b82f6'),
('豪華フレーム', '豪華絢爛なフレーム', 'frame', 'epic', 0, '#8b5cf6'),
('王者フレーム', '王者の証となるフレーム', 'frame', 'legendary', 0, '#f59e0b'),
('神話フレーム', '伝説の神話フレーム', 'frame', 'mythical', 0, '#ec4899');

-- Insert pool relationships
INSERT INTO gacha_pools (machine_id, item_id, drop_rate, weight) 
SELECT 
  gm.id,
  gi.id,
  CASE gi.rarity
    WHEN 'common' THEN 0.50
    WHEN 'rare' THEN 0.30
    WHEN 'epic' THEN 0.15
    WHEN 'legendary' THEN 0.04
    WHEN 'mythical' THEN 0.01
    ELSE 0.10
  END,
  CASE gi.rarity
    WHEN 'common' THEN 100
    WHEN 'rare' THEN 50
    WHEN 'epic' THEN 20
    WHEN 'legendary' THEN 5
    WHEN 'mythical' THEN 1
    ELSE 10
  END
FROM gacha_machines gm
CROSS JOIN gacha_items gi
WHERE gm.machine_type = 'standard';

-- Default Ranks
INSERT INTO ranks (name, tier, min_level, level_range_start, level_range_end, color_primary, color_secondary, benefits, description, rank_order) VALUES
('ブロンズ', 1, 1, 1, 24, '#cd7f32', '#deb887', '{"daily_bonus_multiplier": 1.0, "exp_multiplier": 1.0}', '冒険を始めたばかりの新人ランク', 1),
('シルバー', 2, 25, 25, 49, '#c0c0c0', '#d3d3d3', '{"daily_bonus_multiplier": 1.2, "exp_multiplier": 1.1, "gacha_discount": 0.05}', '経験を積んだ中級者ランク', 2),
('ゴールド', 3, 50, 50, 74, '#ffd700', '#ffef94', '{"daily_bonus_multiplier": 1.5, "exp_multiplier": 1.2, "gacha_discount": 0.10, "quest_bonus": 0.15}', '熟練した上級者ランク', 3),
('プラチナ', 4, 75, 75, 99, '#e5e4e2', '#f0f0f0', '{"daily_bonus_multiplier": 2.0, "exp_multiplier": 1.3, "gacha_discount": 0.15, "quest_bonus": 0.25}', 'エリートプレイヤーのランク', 4),
('ダイヤモンド', 5, 100, 100, NULL, '#b9f2ff', '#e0f7ff', '{"daily_bonus_multiplier": 3.0, "exp_multiplier": 1.5, "gacha_discount": 0.20, "quest_bonus": 0.35}', '最高峰のマスターランク', 5);

-- Level Configurations (safe growth to prevent overflow)
INSERT INTO level_configs (level, experience_required, experience_total, point_reward, is_milestone)
SELECT 
  level,
  CASE 
    WHEN level = 1 THEN 0
    WHEN level <= 30 THEN FLOOR(100 * POWER(1.2, level - 1))::BIGINT
    WHEN level <= 60 THEN FLOOR(100000 + (level - 30) * 5000)::BIGINT
    ELSE FLOOR(250000 + (level - 60) * 10000)::BIGINT
  END as experience_required,
  -- Simplified cumulative calculation
  CASE 
    WHEN level = 1 THEN 0
    WHEN level <= 30 THEN FLOOR(100 * (POWER(1.2, level) - 1) / 0.2)::BIGINT
    WHEN level <= 60 THEN FLOOR(500000 + (level - 30) * 50000)::BIGINT
    ELSE FLOOR(2000000 + (level - 60) * 100000)::BIGINT
  END as experience_total,
  -- Point rewards for milestone levels
  CASE 
    WHEN level % 10 = 0 THEN level * 50
    WHEN level % 5 = 0 THEN level * 20
    ELSE level * 10
  END as point_reward,
  -- Mark milestone levels
  (level % 10 = 0) as is_milestone
FROM generate_series(1, 100) as level;

-- Default Guilds
INSERT INTO guilds (name, slug, description, is_public, max_members, color_theme)
VALUES 
  ('Points Forest 公式ギルド', 'official-guild', '新規プレイヤー歓迎！みんなで楽しくポイントを集めよう！', true, 100, '#10b981'),
  ('エリートハンター', 'elite-hunters', '高レベルプレイヤー専用ギルド。上級者同士で切磋琢磨！', true, 25, '#8b5cf6'),
  ('カジュアルフレンズ', 'casual-friends', 'まったりプレイが好きな人のためのギルド', true, 75, '#f59e0b');

-- ====================================
-- DEPLOYMENT COMPLETE - SAFE VERSION
-- ====================================

SELECT 'ALL SYSTEMS DEPLOYED SUCCESSFULLY - SAFE SCHEMA UPDATES!' as deployment_status;