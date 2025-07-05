-- ====================================
-- ADMIN DASHBOARD RPC FUNCTIONS
-- Points Forest 管理画面用ファンクション
-- ====================================

-- ====================================
-- 1. 管理者認証関連ファンクション
-- ====================================

-- 管理者ログイン
CREATE OR REPLACE FUNCTION admin_sign_in(
  p_email TEXT,
  p_password TEXT,
  p_two_factor_code TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_admin_user RECORD;
  v_password_valid BOOLEAN;
  v_session_token TEXT;
  v_requires_2fa BOOLEAN DEFAULT FALSE;
  v_2fa_valid BOOLEAN DEFAULT TRUE;
BEGIN
  -- 管理者ユーザー取得
  SELECT * INTO v_admin_user
  FROM admin_users
  WHERE email = p_email AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid credentials'
    );
  END IF;
  
  -- パスワード検証 (実際の実装では適切なハッシュ化を使用)
  v_password_valid := (v_admin_user.password_hash = crypt(p_password, v_admin_user.password_hash));
  
  IF NOT v_password_valid THEN
    -- ログイン試行回数を増加
    UPDATE admin_users 
    SET login_attempts = login_attempts + 1
    WHERE id = v_admin_user.id;
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid credentials'
    );
  END IF;
  
  -- 2FA検証
  IF v_admin_user.two_factor_enabled THEN
    v_requires_2fa := TRUE;
    
    IF p_two_factor_code IS NOT NULL THEN
      -- 2FAコード検証 (実際の実装ではTOTPライブラリを使用)
      v_2fa_valid := (p_two_factor_code = 'admin123'); -- テスト用
      
      IF NOT v_2fa_valid THEN
        RETURN jsonb_build_object(
          'success', FALSE,
          'error', 'Invalid 2FA code'
        );
      END IF;
    ELSE
      RETURN jsonb_build_object(
        'success', FALSE,
        'requires_two_factor', TRUE
      );
    END IF;
  END IF;
  
  -- セッショントークン生成
  v_session_token := encode(gen_random_bytes(32), 'base64');
  
  -- セッション作成
  INSERT INTO admin_sessions (admin_user_id, session_token, expires_at)
  VALUES (v_admin_user.id, v_session_token, NOW() + INTERVAL '24 hours');
  
  -- ログイン情報更新
  UPDATE admin_users
  SET 
    last_login_at = NOW(),
    login_attempts = 0
  WHERE id = v_admin_user.id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'session_token', v_session_token,
    'admin_user', row_to_json(v_admin_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- セッション検証
CREATE OR REPLACE FUNCTION verify_admin_session(
  session_token TEXT
) RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_admin_user RECORD;
BEGIN
  -- セッション取得
  SELECT * INTO v_session
  FROM admin_sessions
  WHERE session_token = verify_admin_session.session_token
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- 管理者ユーザー取得
  SELECT * INTO v_admin_user
  FROM admin_users
  WHERE id = v_session.admin_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN row_to_json(v_admin_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者ログアウト
CREATE OR REPLACE FUNCTION admin_sign_out(
  session_token TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM admin_sessions
  WHERE session_token = admin_sign_out.session_token;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- 2. ユーザー管理ファンクション
-- ====================================

-- ユーザーポイント調整
CREATE OR REPLACE FUNCTION admin_adjust_user_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_admin_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_old_points INTEGER;
BEGIN
  -- ユーザー取得
  SELECT * INTO v_user
  FROM users
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User not found'
    );
  END IF;
  
  v_old_points := v_user.points;
  
  -- ポイント更新
  UPDATE users
  SET points = GREATEST(0, points + p_amount)
  WHERE id = p_user_id;
  
  -- トランザクション記録
  INSERT INTO point_transactions (user_id, amount, type, source, description)
  VALUES (p_user_id, p_amount, 'admin_adjustment', 'admin', p_reason);
  
  -- 監査ログ記録
  INSERT INTO admin_audit_logs (
    admin_user_id, action, target_type, target_id,
    old_values, new_values, description
  ) VALUES (
    p_admin_user_id, 'point_adjustment', 'user', p_user_id::text,
    jsonb_build_object('points', v_old_points),
    jsonb_build_object('points', v_old_points + p_amount),
    p_reason
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'old_points', v_old_points,
    'new_points', v_old_points + p_amount,
    'adjustment', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー検索
CREATE OR REPLACE FUNCTION admin_search_users(
  p_search_term TEXT DEFAULT NULL,
  p_min_points INTEGER DEFAULT NULL,
  p_max_points INTEGER DEFAULT NULL,
  p_min_level INTEGER DEFAULT NULL,
  p_max_level INTEGER DEFAULT NULL,
  p_is_premium BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  display_name TEXT,
  points INTEGER,
  level INTEGER,
  experience INTEGER,
  login_streak INTEGER,
  last_login_at TIMESTAMPTZ,
  is_premium BOOLEAN,
  created_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- 総件数取得
  SELECT COUNT(*) INTO v_total_count
  FROM users u
  WHERE (p_search_term IS NULL OR 
         u.email ILIKE '%' || p_search_term || '%' OR 
         u.username ILIKE '%' || p_search_term || '%' OR
         u.display_name ILIKE '%' || p_search_term || '%')
    AND (p_min_points IS NULL OR u.points >= p_min_points)
    AND (p_max_points IS NULL OR u.points <= p_max_points)
    AND (p_min_level IS NULL OR u.level >= p_min_level)
    AND (p_max_level IS NULL OR u.level <= p_max_level)
    AND (p_is_premium IS NULL OR u.is_premium = p_is_premium);
  
  -- 結果返却
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.points,
    u.level,
    u.experience,
    u.login_streak,
    u.last_login_at,
    u.is_premium,
    u.created_at,
    v_total_count
  FROM users u
  WHERE (p_search_term IS NULL OR 
         u.email ILIKE '%' || p_search_term || '%' OR 
         u.username ILIKE '%' || p_search_term || '%' OR
         u.display_name ILIKE '%' || p_search_term || '%')
    AND (p_min_points IS NULL OR u.points >= p_min_points)
    AND (p_max_points IS NULL OR u.points <= p_max_points)
    AND (p_min_level IS NULL OR u.level >= p_min_level)
    AND (p_max_level IS NULL OR u.level <= p_max_level)
    AND (p_is_premium IS NULL OR u.is_premium = p_is_premium)
  ORDER BY u.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- 3. 分析・レポートファンクション
-- ====================================

-- ダッシュボード統計
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  p_date_range TEXT DEFAULT '7d' -- '1d', '7d', '30d', '90d'
) RETURNS JSONB AS $$
DECLARE
  v_start_date DATE;
  v_result JSONB;
  v_user_stats RECORD;
  v_point_stats RECORD;
  v_game_stats RECORD;
BEGIN
  -- 期間設定
  CASE p_date_range
    WHEN '1d' THEN v_start_date := CURRENT_DATE;
    WHEN '7d' THEN v_start_date := CURRENT_DATE - INTERVAL '7 days';
    WHEN '30d' THEN v_start_date := CURRENT_DATE - INTERVAL '30 days';
    WHEN '90d' THEN v_start_date := CURRENT_DATE - INTERVAL '90 days';
    ELSE v_start_date := CURRENT_DATE - INTERVAL '7 days';
  END CASE;
  
  -- ユーザー統計
  SELECT 
    COUNT(*) FILTER (WHERE created_at >= v_start_date) as new_users,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - INTERVAL '1 day') as daily_active,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_active,
    COUNT(*) as total_users
  INTO v_user_stats
  FROM users;
  
  -- ポイント統計
  SELECT 
    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as points_earned,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as points_spent,
    COUNT(*) as transactions
  INTO v_point_stats
  FROM point_transactions
  WHERE created_at >= v_start_date;
  
  -- ゲーム統計
  SELECT 
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_players,
    AVG(points_earned) as avg_points_per_session
  INTO v_game_stats
  FROM game_sessions
  WHERE created_at >= v_start_date;
  
  -- 結果組み立て
  v_result := jsonb_build_object(
    'period', p_date_range,
    'start_date', v_start_date,
    'users', jsonb_build_object(
      'new_users', COALESCE(v_user_stats.new_users, 0),
      'daily_active', COALESCE(v_user_stats.daily_active, 0),
      'weekly_active', COALESCE(v_user_stats.weekly_active, 0),
      'total_users', COALESCE(v_user_stats.total_users, 0)
    ),
    'points', jsonb_build_object(
      'earned', COALESCE(v_point_stats.points_earned, 0),
      'spent', COALESCE(v_point_stats.points_spent, 0),
      'net_flow', COALESCE(v_point_stats.points_earned, 0) - COALESCE(v_point_stats.points_spent, 0),
      'transactions', COALESCE(v_point_stats.transactions, 0)
    ),
    'games', jsonb_build_object(
      'total_sessions', COALESCE(v_game_stats.total_sessions, 0),
      'unique_players', COALESCE(v_game_stats.unique_players, 0),
      'avg_points_per_session', ROUND(COALESCE(v_game_stats.avg_points_per_session, 0), 2)
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- システム設定更新
CREATE OR REPLACE FUNCTION admin_update_system_setting(
  p_category TEXT,
  p_key TEXT,
  p_value JSONB,
  p_admin_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_old_value JSONB;
BEGIN
  -- 現在の値を取得
  SELECT value INTO v_old_value
  FROM system_settings
  WHERE category = p_category AND key = p_key;
  
  -- 設定更新
  INSERT INTO system_settings (category, key, value, updated_by)
  VALUES (p_category, p_key, p_value, p_admin_user_id)
  ON CONFLICT (category, key)
  DO UPDATE SET 
    value = p_value,
    updated_by = p_admin_user_id,
    updated_at = NOW();
  
  -- 監査ログ記録
  INSERT INTO admin_audit_logs (
    admin_user_id, action, target_type, target_id,
    old_values, new_values
  ) VALUES (
    p_admin_user_id, 'update_setting', 'system', p_category || '.' || p_key,
    jsonb_build_object('value', v_old_value),
    jsonb_build_object('value', p_value)
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'old_value', v_old_value,
    'new_value', p_value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- 4. 権限設定
-- ====================================

-- 管理者関数の実行権限
GRANT EXECUTE ON FUNCTION admin_sign_in(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sign_out(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_user_points(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_search_users(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_system_setting(TEXT, TEXT, JSONB, UUID) TO authenticated;