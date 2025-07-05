-- ====================================
-- ADMIN DASHBOARD DATABASE SCHEMA
-- Points Forest 管理画面システム
-- ====================================

-- ====================================
-- 1. 管理者ユーザーシステム
-- ====================================

-- 管理者ユーザーテーブル
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- 役割と権限
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'analyst', 'support')),
  permissions JSONB NOT NULL DEFAULT '{}',
  
  -- セキュリティ
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  
  -- アクセス履歴
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  
  -- アカウント状態
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- 管理者セッションテーブル
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理者操作ログテーブル
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  
  -- 操作情報
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'export'
  target_type TEXT NOT NULL, -- 'user', 'game', 'gacha', 'system', 'points'
  target_id TEXT,
  
  -- 変更内容
  old_values JSONB,
  new_values JSONB,
  
  -- リクエスト情報
  ip_address INET,
  user_agent TEXT,
  request_url TEXT,
  
  -- メタデータ
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- 2. システム設定管理
-- ====================================

-- システム設定テーブル
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'game', 'points', 'gacha', 'general', 'security'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  
  -- 設定メタデータ
  display_name TEXT,
  description TEXT,
  data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
  validation_rules JSONB,
  
  -- 状態管理
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE,
  requires_restart BOOLEAN DEFAULT FALSE,
  
  -- 履歴
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category, key)
);

-- A/Bテスト設定テーブル
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- テスト設定
  feature_flag TEXT NOT NULL,
  traffic_allocation DECIMAL(3,2) CHECK (traffic_allocation BETWEEN 0.01 AND 1.00),
  
  -- バリアント設定
  variants JSONB NOT NULL, -- [{"name": "A", "weight": 0.5}, {"name": "B", "weight": 0.5}]
  
  -- 期間設定
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- 状態
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  
  -- メタデータ
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- 3. 分析・レポート用テーブル
-- ====================================

-- 日次集計統計テーブル
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  -- ユーザー統計
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  daily_active_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  
  -- ポイント統計
  total_points_earned BIGINT DEFAULT 0,
  total_points_spent BIGINT DEFAULT 0,
  points_net_flow BIGINT DEFAULT 0,
  
  -- ゲーム統計
  total_game_sessions INTEGER DEFAULT 0,
  total_game_time_minutes INTEGER DEFAULT 0,
  
  -- ガチャ統計
  total_gacha_pulls INTEGER DEFAULT 0,
  gacha_revenue_points BIGINT DEFAULT 0,
  
  -- システム統計
  system_errors INTEGER DEFAULT 0,
  api_requests INTEGER DEFAULT 0,
  average_response_time_ms DECIMAL(8,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date)
);

-- ユーザー行動イベントテーブル
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- イベント情報
  event_type TEXT NOT NULL, -- 'login', 'game_play', 'gacha_pull', 'achievement_unlock'
  event_name TEXT NOT NULL,
  
  -- イベントデータ
  properties JSONB DEFAULT '{}',
  
  -- セッション情報
  session_id TEXT,
  
  -- リクエスト情報
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- 4. 運営支援テーブル
-- ====================================

-- 運営通知テーブル
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- 通知レベル
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- 受信者設定
  target_roles TEXT[] DEFAULT ARRAY['admin'], -- 対象ロール配列
  target_users UUID[], -- 特定ユーザー配列
  
  -- 状態管理
  is_read BOOLEAN DEFAULT FALSE,
  auto_dismiss BOOLEAN DEFAULT TRUE,
  dismiss_after_hours INTEGER DEFAULT 24,
  
  -- アクション
  action_url TEXT,
  action_label TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- バックアップ管理テーブル
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'scheduled', 'emergency')),
  
  -- バックアップ情報
  file_path TEXT,
  file_size_bytes BIGINT,
  tables_included TEXT[],
  
  -- 状態
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  error_message TEXT,
  
  -- 実行情報
  started_by UUID REFERENCES admin_users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- 保持設定
  retention_days INTEGER DEFAULT 30,
  expires_at TIMESTAMPTZ
);

-- ====================================
-- 5. インデックス作成
-- ====================================

-- パフォーマンス最適化用インデックス
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_type ON admin_audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_active ON system_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_target_roles ON admin_notifications USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- ====================================
-- 6. 分析用ビューとファンクション
-- ====================================

-- ユーザー統計ビュー
CREATE OR REPLACE VIEW user_analytics_summary AS
SELECT 
  DATE(u.created_at) as registration_date,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE u.last_login_at > NOW() - INTERVAL '1 day') as daily_active,
  COUNT(*) FILTER (WHERE u.last_login_at > NOW() - INTERVAL '7 days') as weekly_active,
  COUNT(*) FILTER (WHERE u.last_login_at > NOW() - INTERVAL '30 days') as monthly_active,
  AVG(u.points) as avg_points,
  AVG(u.level) as avg_level,
  COUNT(*) FILTER (WHERE u.is_premium = true) as premium_users
FROM users u
WHERE u.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(u.created_at)
ORDER BY registration_date DESC;

-- ポイント流通分析ファンクション
CREATE OR REPLACE FUNCTION get_point_flow_analysis(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  date DATE,
  points_earned BIGINT,
  points_spent BIGINT,
  net_flow BIGINT,
  source_breakdown JSONB,
  spend_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(pt.created_at) as date,
    SUM(CASE WHEN pt.amount > 0 THEN pt.amount ELSE 0 END) as points_earned,
    SUM(CASE WHEN pt.amount < 0 THEN ABS(pt.amount) ELSE 0 END) as points_spent,
    SUM(pt.amount) as net_flow,
    jsonb_object_agg(
      CASE WHEN pt.amount > 0 THEN pt.source ELSE NULL END,
      CASE WHEN pt.amount > 0 THEN SUM(pt.amount) ELSE NULL END
    ) FILTER (WHERE pt.amount > 0) as source_breakdown,
    jsonb_object_agg(
      CASE WHEN pt.amount < 0 THEN pt.source ELSE NULL END,
      CASE WHEN pt.amount < 0 THEN SUM(ABS(pt.amount)) ELSE NULL END
    ) FILTER (WHERE pt.amount < 0) as spend_breakdown
  FROM point_transactions pt
  WHERE DATE(pt.created_at) BETWEEN start_date AND end_date
  GROUP BY DATE(pt.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- ゲーム統計分析ファンクション
CREATE OR REPLACE FUNCTION get_game_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  game_id UUID,
  game_name TEXT,
  total_sessions BIGINT,
  unique_players BIGINT,
  avg_score DECIMAL,
  total_points_awarded BIGINT,
  avg_session_duration DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as game_id,
    g.name as game_name,
    COUNT(gs.id) as total_sessions,
    COUNT(DISTINCT gs.user_id) as unique_players,
    AVG(gs.score) as avg_score,
    SUM(gs.points_earned) as total_points_awarded,
    AVG(gs.duration_seconds) as avg_session_duration
  FROM games g
  LEFT JOIN game_sessions gs ON g.id = gs.game_id
  WHERE DATE(gs.created_at) BETWEEN start_date AND end_date
  GROUP BY g.id, g.name
  ORDER BY total_sessions DESC;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 7. RLS (Row Level Security) 設定
-- ====================================

-- admin_usersテーブルのRLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_users_policy ON admin_users
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
  );

-- admin_audit_logsのRLS  
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_audit_logs_policy ON admin_audit_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
  );

-- system_settingsのRLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_policy ON system_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin'))
  );

-- ====================================
-- 8. 初期データ挿入
-- ====================================

-- デフォルトシステム設定
INSERT INTO system_settings (category, key, value, display_name, description, data_type) VALUES
('game', 'daily_play_limit', '{"number_guess": 5, "roulette": 3, "slot_machine": 5}', 'デイリープレイ制限', 'ゲーム別1日プレイ制限回数', 'json'),
('points', 'daily_bonus_base', '50', 'デイリーボーナス基本値', '連続ログインボーナスの基本ポイント', 'number'),
('points', 'max_daily_earn', '1000', '1日最大獲得ポイント', 'ユーザーが1日に獲得できる最大ポイント', 'number'),
('gacha', 'standard_cost', '100', 'スタンダードガチャコスト', 'スタンダードガチャ1回のコスト', 'number'),
('security', 'session_timeout_hours', '24', 'セッションタイムアウト', '管理者セッションの有効期限（時間）', 'number'),
('general', 'maintenance_mode', 'false', 'メンテナンスモード', 'システム全体のメンテナンスモード', 'boolean')
ON CONFLICT (category, key) DO NOTHING;

-- 管理者権限
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;