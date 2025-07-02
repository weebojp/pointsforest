-- ====================================
-- LUCKY SPRINGS SYSTEM SETUP
-- Execute this in Supabase SQL Editor
-- ====================================

-- Lucky springs configuration table
CREATE TABLE IF NOT EXISTS lucky_springs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  theme TEXT NOT NULL DEFAULT 'water' CHECK (theme IN ('water', 'forest', 'mystic', 'rainbow')),
  
  -- Access requirements
  level_requirement INTEGER DEFAULT 1 CHECK (level_requirement >= 1),
  achievement_requirement UUID REFERENCES achievements(id),
  premium_only BOOLEAN DEFAULT FALSE,
  
  -- Reward configuration
  reward_tiers JSONB NOT NULL DEFAULT '[
    {"min_points": 10, "max_points": 50, "probability": 0.50, "tier": "common"},
    {"min_points": 100, "max_points": 200, "probability": 0.25, "tier": "rare"},
    {"min_points": 500, "max_points": 1000, "probability": 0.15, "tier": "epic"},
    {"min_points": 2000, "max_points": 5000, "probability": 0.09, "tier": "legendary"},
    {"min_points": 10000, "max_points": 10000, "probability": 0.01, "tier": "mythical"}
  ]',
  
  -- Limits and cooldowns
  daily_visits INTEGER DEFAULT 1 CHECK (daily_visits > 0),
  cooldown_hours INTEGER DEFAULT 24 CHECK (cooldown_hours > 0),
  
  -- Spring status
  is_active BOOLEAN DEFAULT TRUE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  season_start TIMESTAMPTZ,
  season_end TIMESTAMPTZ,
  
  -- Visual configuration
  animation_config JSONB DEFAULT '{"bubbles": true, "sparkles": true, "glow": true}',
  color_scheme JSONB DEFAULT '{"primary": "#10b981", "secondary": "#059669", "accent": "#34d399"}',
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spring visits tracking table
CREATE TABLE IF NOT EXISTS spring_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  spring_id UUID REFERENCES lucky_springs(id) ON DELETE CASCADE,
  
  -- Visit details
  points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
  reward_tier TEXT NOT NULL,
  
  -- Random seed for reproducibility
  random_seed DECIMAL(10,8) NOT NULL,
  
  -- Visit metadata
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one visit per day per spring per user
  UNIQUE(user_id, spring_id, visit_date)
);

-- Spring statistics table (aggregated data)
CREATE TABLE IF NOT EXISTS spring_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spring_id UUID REFERENCES lucky_springs(id) ON DELETE CASCADE,
  
  -- Daily statistics
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_visits INTEGER DEFAULT 0,
  total_points_awarded INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  
  -- Tier distribution
  common_rewards INTEGER DEFAULT 0,
  rare_rewards INTEGER DEFAULT 0,
  epic_rewards INTEGER DEFAULT 0,
  legendary_rewards INTEGER DEFAULT 0,
  mythical_rewards INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(spring_id, stat_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spring_visits_user_id ON spring_visits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spring_visits_spring_id ON spring_visits(spring_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_spring_visits_daily ON spring_visits(user_id, spring_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_spring_statistics_date ON spring_statistics(stat_date DESC);

-- Insert default lucky springs
INSERT INTO lucky_springs (name, slug, description, theme, level_requirement, reward_tiers, sort_order) VALUES
('森の泉', 'forest-spring', '古い森の奥深くに隠された神秘的な泉。一日一回だけ、その恵みを受けることができます。', 'forest', 1,
 '[
   {"min_points": 10, "max_points": 50, "probability": 0.50, "tier": "common", "message": "泉が優しく光りました"},
   {"min_points": 100, "max_points": 200, "probability": 0.25, "tier": "rare", "message": "泉が美しく輝きました"},
   {"min_points": 500, "max_points": 1000, "probability": 0.15, "tier": "epic", "message": "泉が強く輝き、魔法の力を感じます"},
   {"min_points": 2000, "max_points": 5000, "probability": 0.09, "tier": "legendary", "message": "泉が黄金に輝き、伝説の力が宿ります"},
   {"min_points": 10000, "max_points": 10000, "probability": 0.01, "tier": "mythical", "message": "泉が虹色に輝き、神話級の恵みが降り注ぎます！"}
 ]', 1),

('クリスタル泉', 'crystal-spring', '水晶で囲まれた美しい泉。高レベルユーザーのみがアクセスできる特別な場所です。', 'mystic', 10,
 '[
   {"min_points": 50, "max_points": 100, "probability": 0.40, "tier": "common", "message": "クリスタルが淡く光りました"},
   {"min_points": 200, "max_points": 400, "probability": 0.30, "tier": "rare", "message": "クリスタルが鮮やかに輝きました"},
   {"min_points": 1000, "max_points": 2000, "probability": 0.20, "tier": "epic", "message": "クリスタルが強烈に輝き、魔力が溢れます"},
   {"min_points": 5000, "max_points": 8000, "probability": 0.09, "tier": "legendary", "message": "クリスタルが完璧に共鳴し、伝説の恵みを与えます"},
   {"min_points": 20000, "max_points": 20000, "probability": 0.01, "tier": "mythical", "message": "すべてのクリスタルが共鳴し、究極の力が解放されます！"}
 ]', 2)
ON CONFLICT (slug) DO NOTHING;

-- Function to get user's spring status
CREATE OR REPLACE FUNCTION get_user_spring_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '[]';
  v_spring RECORD;
  v_daily_visits INTEGER;
  v_user_level INTEGER;
  v_user_premium BOOLEAN;
BEGIN
  -- Get user level and premium status
  SELECT level, is_premium INTO v_user_level, v_user_premium
  FROM users WHERE id = p_user_id;
  
  -- Loop through all active springs
  FOR v_spring IN 
    SELECT * FROM lucky_springs 
    WHERE is_active = TRUE 
    ORDER BY sort_order
  LOOP
    -- Check daily visits for this spring
    SELECT COUNT(*) INTO v_daily_visits
    FROM spring_visits
    WHERE user_id = p_user_id 
      AND spring_id = v_spring.id
      AND visit_date = CURRENT_DATE;
    
    -- Build spring status object
    v_result := v_result || jsonb_build_object(
      'id', v_spring.id,
      'name', v_spring.name,
      'slug', v_spring.slug,
      'description', v_spring.description,
      'theme', v_spring.theme,
      'level_requirement', v_spring.level_requirement,
      'premium_only', v_spring.premium_only,
      'daily_visits', v_spring.daily_visits,
      'visits_today', v_daily_visits,
      'visits_remaining', GREATEST(0, v_spring.daily_visits - v_daily_visits),
      'accessible', (
        v_user_level >= v_spring.level_requirement AND
        (NOT v_spring.premium_only OR v_user_premium) AND
        (NOT v_spring.is_seasonal OR (
          (v_spring.season_start IS NULL OR NOW() >= v_spring.season_start) AND
          (v_spring.season_end IS NULL OR NOW() <= v_spring.season_end)
        ))
      ),
      'can_visit_today', v_daily_visits < v_spring.daily_visits,
      'animation_config', v_spring.animation_config,
      'color_scheme', v_spring.color_scheme
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Lucky springs visit function
CREATE OR REPLACE FUNCTION visit_lucky_spring(
  p_user_id UUID,
  p_spring_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_spring RECORD;
  v_user RECORD;
  v_daily_visits INTEGER;
  v_random_seed DECIMAL(10,8);
  v_points_earned INTEGER;
  v_current_balance INTEGER;
  v_visit_id UUID;
  v_tier_name TEXT;
  v_reward_message TEXT;
  v_tier_min INTEGER;
  v_tier_max INTEGER;
BEGIN
  -- Get spring configuration
  SELECT * INTO v_spring 
  FROM lucky_springs 
  WHERE slug = p_spring_slug AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Spring not found or inactive');
  END IF;
  
  -- Get user information
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  -- Check level requirement
  IF v_user.level < v_spring.level_requirement THEN
    RETURN jsonb_build_object('success', false, 'error', 
      FORMAT('Level %s required (current: %s)', v_spring.level_requirement, v_user.level));
  END IF;
  
  -- Check premium requirement
  IF v_spring.premium_only AND NOT v_user.is_premium THEN
    RETURN jsonb_build_object('success', false, 'error', 'Premium membership required');
  END IF;
  
  -- Check daily visit limit
  SELECT COUNT(*) INTO v_daily_visits
  FROM spring_visits
  WHERE user_id = p_user_id 
    AND spring_id = v_spring.id
    AND visit_date = CURRENT_DATE;
  
  IF v_daily_visits >= v_spring.daily_visits THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily visit limit reached');
  END IF;
  
  -- Generate random seed and determine reward
  v_random_seed := RANDOM();
  
  -- Simple tier selection based on probability
  IF v_random_seed <= 0.01 THEN
    v_tier_name := 'mythical';
    v_tier_min := 10000;
    v_tier_max := 20000;
    v_reward_message := 'Ultimate power flows through you!';
  ELSIF v_random_seed <= 0.10 THEN
    v_tier_name := 'legendary';
    v_tier_min := 2000;
    v_tier_max := 5000;
    v_reward_message := 'Legendary power courses through you!';
  ELSIF v_random_seed <= 0.25 THEN
    v_tier_name := 'epic';
    v_tier_min := 500;
    v_tier_max := 1000;
    v_reward_message := 'Epic energy fills your being!';
  ELSIF v_random_seed <= 0.50 THEN
    v_tier_name := 'rare';
    v_tier_min := 100;
    v_tier_max := 200;
    v_reward_message := 'Rare magic flows through you!';
  ELSE
    v_tier_name := 'common';
    v_tier_min := 10;
    v_tier_max := 50;
    v_reward_message := 'The spring''s blessing touches you gently.';
  END IF;
  
  -- Calculate exact points within tier range
  v_points_earned := v_tier_min + FLOOR(RANDOM() * (v_tier_max - v_tier_min + 1));
  
  -- Get current user balance
  SELECT points INTO v_current_balance FROM users WHERE id = p_user_id;
  
  -- Award points to user
  UPDATE users 
  SET points = points + v_points_earned,
      last_seen_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record spring visit
  INSERT INTO spring_visits (user_id, spring_id, points_earned, reward_tier, random_seed)
  VALUES (p_user_id, v_spring.id, v_points_earned, v_tier_name, v_random_seed)
  RETURNING id INTO v_visit_id;
  
  -- Record point transaction
  INSERT INTO point_transactions (user_id, amount, balance_after, type, source, description, reference_id)
  VALUES (p_user_id, v_points_earned, v_current_balance + v_points_earned, 'bonus', 'lucky_spring',
    FORMAT('Lucky spring reward (%s): %s', v_spring.name, v_tier_name), v_visit_id);
  
  -- Check for achievements
  PERFORM check_achievements(p_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'points_earned', v_points_earned,
    'tier', v_tier_name,
    'message', v_reward_message,
    'spring_name', v_spring.name,
    'visits_remaining', v_spring.daily_visits - v_daily_visits - 1,
    'next_visit_available', CURRENT_DATE + INTERVAL '1 day'
  );
END;
$$;