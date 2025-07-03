-- Essential database functions for Points Forest

-- Function to handle game sessions
CREATE OR REPLACE FUNCTION handle_game_session(
  p_user_id UUID,
  p_game_id UUID,
  p_score INTEGER,
  p_points_earned INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_count INTEGER;
  v_game_limit INTEGER;
  v_session_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Check daily limit
  SELECT count(*) INTO v_daily_count
  FROM game_sessions gs
  WHERE gs.user_id = p_user_id 
    AND gs.game_id = p_game_id
    AND gs.created_at::date = CURRENT_DATE;
  
  SELECT daily_limit INTO v_game_limit
  FROM games 
  WHERE id = p_game_id;
  
  IF v_daily_count >= COALESCE(v_game_limit, 10) THEN
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
  VALUES (p_user_id, p_points_earned, COALESCE(v_current_balance, 0) + p_points_earned, 'earn', 'game', 
    jsonb_build_object('game_id', p_game_id, 'session_id', v_session_id), v_session_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'points_earned', p_points_earned
  );
END;
$$;

-- Function to process daily bonus
CREATE OR REPLACE FUNCTION process_daily_bonus(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Check if user already claimed bonus today
  IF v_user_record.last_daily_bonus_at IS NOT NULL AND 
     v_user_record.last_daily_bonus_at::date = CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily bonus already claimed today'
    );
  END IF;
  
  -- Calculate days since last bonus
  IF v_user_record.last_daily_bonus_at IS NULL THEN
    v_days_since_last_bonus := 0;
  ELSE
    v_days_since_last_bonus := CURRENT_DATE - v_user_record.last_daily_bonus_at::date;
  END IF;
  
  -- Calculate new streak
  IF v_days_since_last_bonus <= 1 THEN
    v_new_streak := COALESCE(v_user_record.login_streak, 0) + 1;
  ELSE
    v_new_streak := 1; -- Reset streak if more than 1 day gap
  END IF;
  
  -- Calculate bonus points (base 10 + streak bonus)
  v_bonus_points := 10 + LEAST(v_new_streak * 2, 50); -- Max 50 bonus points
  
  -- Update user
  UPDATE users 
  SET points = COALESCE(points, 0) + v_bonus_points,
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
  
  RETURN jsonb_build_object(
    'success', true,
    'points_earned', v_bonus_points,
    'streak', v_new_streak,
    'total_points', v_current_balance
  );
END;
$$;

-- Simple achievement checking function
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic implementation - just return 0 for now
  RETURN 0;
END;
$$;