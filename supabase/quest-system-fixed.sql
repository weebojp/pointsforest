-- Quest System Database Schema (Fixed Version)
-- クエストシステム用のデータベーススキーマ（修正版）

-- 1. クエストテンプレート（クエスト定義）
CREATE TABLE IF NOT EXISTS quest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- クエストタイプ
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'challenge', 'choice')),
  category TEXT NOT NULL CHECK (category IN ('login', 'game', 'social', 'achievement', 'points')),
  
  -- 条件設定
  conditions JSONB NOT NULL, -- 達成条件の詳細設定
  rewards JSONB NOT NULL,    -- 報酬設定（ポイント、アイテム等）
  
  -- 難易度・選択肢
  difficulty TEXT CHECK (difficulty IN ('easy', 'normal', 'hard')),
  choice_group UUID,         -- 選択型クエストのグループID
  choice_options JSONB,      -- 選択肢の設定
  
  -- 期間・制限
  duration_hours INTEGER,    -- クエスト有効期間
  max_completions INTEGER DEFAULT 1, -- 完了可能回数
  
  -- 表示・状態
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  requires_premium BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ユーザークエスト進行状況
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_template_id UUID REFERENCES quest_templates(id) ON DELETE CASCADE,
  
  -- 進行状況
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  progress JSONB DEFAULT '{}',      -- 進行データ
  current_value INTEGER DEFAULT 0, -- 現在の進行値
  target_value INTEGER NOT NULL,   -- 目標値
  
  -- 時間管理
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- 報酬
  rewards_claimed BOOLEAN DEFAULT FALSE,
  points_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. クエスト完了履歴
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_template_id UUID REFERENCES quest_templates(id) ON DELETE CASCADE,
  user_quest_id UUID REFERENCES user_quests(id) ON DELETE CASCADE,
  
  completion_time TIMESTAMPTZ DEFAULT NOW(),
  points_earned INTEGER NOT NULL,
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  metadata JSONB DEFAULT '{}', -- 完了時の追加データ
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. デフォルトクエストテンプレートを挿入
INSERT INTO quest_templates (name, slug, description, type, category, conditions, rewards, difficulty, duration_hours, sort_order)
VALUES 
-- デイリークエスト
('デイリーログイン', 'daily-login', '毎日ログインしてボーナスポイントを獲得', 'daily', 'login', 
 '{"action_type": "login", "count": 1}', '{"points": 50}', 'easy', 24, 1),

('デイリーゲーム', 'daily-games', '今日3回ゲームをプレイする', 'daily', 'game',
 '{"action_type": "game_complete", "count": 3}', '{"points": 100}', 'easy', 24, 2),

('デイリー・ポイント獲得', 'daily-points', '今日200ポイント以上獲得する', 'daily', 'points',
 '{"action_type": "points_earned", "count": 200}', '{"points": 150}', 'normal', 24, 3),

('ラッキースプリング訪問', 'daily-spring', 'ラッキースプリングを訪問する', 'daily', 'game',
 '{"action_type": "spring_visit", "count": 1}', '{"points": 75}', 'easy', 24, 4),

-- ウィークリークエスト
('ウィークリー・ゲームマスター', 'weekly-game-master', '今週15回ゲームをプレイする', 'weekly', 'game',
 '{"action_type": "game_complete", "count": 15}', '{"points": 500}', 'normal', 168, 5),

('ウィークリー・アチーブメント', 'weekly-achievements', '今週3つのアチーブメントを達成する', 'weekly', 'achievement',
 '{"action_type": "achievement_earned", "count": 3}', '{"points": 750}', 'hard', 168, 6),

('ウィークリー・ポイント王', 'weekly-point-king', '今週1500ポイント以上獲得する', 'weekly', 'points',
 '{"action_type": "points_earned", "count": 1500}', '{"points": 1000}', 'hard', 168, 7),

-- チャレンジクエスト
('チャレンジ・連続ログイン', 'challenge-streak', '7日連続ログインする', 'challenge', 'login',
 '{"action_type": "login_streak", "count": 7}', '{"points": 2000}', 'hard', NULL, 8),

('チャレンジ・ポイントマスター', 'challenge-point-master', '累計10000ポイント獲得する', 'challenge', 'points',
 '{"action_type": "total_points", "count": 10000}', '{"points": 5000}', 'hard', NULL, 9)
ON CONFLICT (slug) DO NOTHING;

-- 5. デイリークエスト生成・更新関数
CREATE OR REPLACE FUNCTION generate_daily_quests(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest_template RECORD;
  v_existing_quest RECORD;
  v_new_quests INTEGER := 0;
  v_target_value INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 今日のアクティブなクエストをチェック
  FOR v_quest_template IN 
    SELECT * FROM quest_templates 
    WHERE type = 'daily' AND is_active = TRUE
    ORDER BY sort_order
  LOOP
    -- 既存の今日のクエストをチェック
    SELECT * INTO v_existing_quest
    FROM user_quests
    WHERE user_id = p_user_id 
      AND quest_template_id = v_quest_template.id
      AND started_at >= v_today
      AND started_at < v_today + INTERVAL '1 day';
    
    -- 今日のクエストが存在しない場合、新規作成
    IF NOT FOUND THEN
      -- 条件に基づいて目標値を設定
      v_target_value := (v_quest_template.conditions->>'count')::INTEGER;
      
      -- クエスト作成
      INSERT INTO user_quests (
        user_id, quest_template_id, target_value, expires_at
      ) VALUES (
        p_user_id, 
        v_quest_template.id, 
        v_target_value,
        v_today + INTERVAL '1 day'
      );
      
      v_new_quests := v_new_quests + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_quests_generated', v_new_quests,
    'total_active_quests', (
      SELECT COUNT(*) FROM user_quests 
      WHERE user_id = p_user_id AND status = 'active'
    )
  );
END;
$$;

-- 6. クエスト進行更新関数
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_id UUID,
  p_action_type TEXT, -- 'login', 'game_complete', 'points_earned', 'achievement_earned', 'spring_visit'
  p_value INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_completed_quests INTEGER := 0;
  v_points_earned INTEGER := 0;
  v_condition_met BOOLEAN := FALSE;
BEGIN
  -- アクティブなクエストをループ
  FOR v_quest IN
    SELECT uq.*, qt.conditions, qt.rewards, qt.name
    FROM user_quests uq
    JOIN quest_templates qt ON qt.id = uq.quest_template_id
    WHERE uq.user_id = p_user_id 
      AND uq.status = 'active'
      AND (uq.expires_at IS NULL OR uq.expires_at > NOW())
  LOOP
    v_condition_met := FALSE;
    
    -- アクションタイプに基づいてクエスト進行を判定
    IF v_quest.conditions->>'action_type' = p_action_type THEN
      -- 特別な条件チェック
      CASE p_action_type
        WHEN 'points_earned' THEN
          -- ポイント系クエストは累積値で判定
          UPDATE user_quests 
          SET current_value = current_value + p_value,
              progress = progress || jsonb_build_object('last_action', NOW(), 'total_earned', current_value + p_value),
              updated_at = NOW()
          WHERE id = v_quest.id;
          
          v_condition_met := (v_quest.current_value + p_value >= v_quest.target_value);
          
        WHEN 'total_points' THEN
          -- 累計ポイントは現在のユーザーポイントで判定
          DECLARE
            v_user_total_points INTEGER;
          BEGIN
            SELECT points INTO v_user_total_points FROM users WHERE id = p_user_id;
            
            UPDATE user_quests 
            SET current_value = v_user_total_points,
                progress = progress || jsonb_build_object('last_check', NOW()),
                updated_at = NOW()
            WHERE id = v_quest.id;
            
            v_condition_met := (v_user_total_points >= v_quest.target_value);
          END;
          
        WHEN 'login_streak' THEN
          -- ログインストリークは現在のストリークで判定
          DECLARE
            v_user_streak INTEGER;
          BEGIN
            SELECT login_streak INTO v_user_streak FROM users WHERE id = p_user_id;
            
            UPDATE user_quests 
            SET current_value = v_user_streak,
                progress = progress || jsonb_build_object('last_check', NOW()),
                updated_at = NOW()
            WHERE id = v_quest.id;
            
            v_condition_met := (v_user_streak >= v_quest.target_value);
          END;
          
        ELSE
          -- その他のアクション（login, game_complete, achievement_earned, spring_visit）
          UPDATE user_quests 
          SET current_value = current_value + p_value,
              progress = progress || jsonb_build_object('last_action', NOW()),
              updated_at = NOW()
          WHERE id = v_quest.id;
          
          v_condition_met := (v_quest.current_value + p_value >= v_quest.target_value);
      END CASE;
      
      -- 完了チェック
      IF v_condition_met THEN
        -- クエスト完了処理
        UPDATE user_quests 
        SET status = 'completed',
            completed_at = NOW(),
            points_earned = (v_quest.rewards->>'points')::INTEGER
        WHERE id = v_quest.id;
        
        -- ユーザーにポイント付与
        UPDATE users 
        SET points = points + (v_quest.rewards->>'points')::INTEGER
        WHERE id = p_user_id;
        
        -- ポイント取引履歴に記録
        INSERT INTO point_transactions (user_id, amount, type, source, description, metadata)
        VALUES (
          p_user_id, 
          (v_quest.rewards->>'points')::INTEGER, 
          'earn', 
          'quest', 
          'クエスト完了: ' || v_quest.name,
          jsonb_build_object('quest_id', v_quest.id, 'quest_name', v_quest.name)
        );
        
        -- 完了記録
        INSERT INTO quest_completions (
          user_id, quest_template_id, user_quest_id, points_earned
        ) VALUES (
          p_user_id, v_quest.quest_template_id, v_quest.id, 
          (v_quest.rewards->>'points')::INTEGER
        );
        
        v_completed_quests := v_completed_quests + 1;
        v_points_earned := v_points_earned + (v_quest.rewards->>'points')::INTEGER;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'quests_completed', v_completed_quests,
    'total_points_earned', v_points_earned
  );
END;
$$;

-- 7. 報酬受け取り関数
CREATE OR REPLACE FUNCTION claim_quest_reward(p_quest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_points INTEGER;
BEGIN
  -- クエスト情報取得
  SELECT uq.*, qt.rewards, qt.name
  INTO v_quest
  FROM user_quests uq
  JOIN quest_templates qt ON qt.id = uq.quest_template_id
  WHERE uq.id = p_quest_id AND uq.status = 'completed' AND uq.rewards_claimed = FALSE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest not found or already claimed');
  END IF;
  
  v_points := (v_quest.rewards->>'points')::INTEGER;
  
  -- 報酬受け取りマーク
  UPDATE user_quests
  SET rewards_claimed = TRUE
  WHERE id = p_quest_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'points_earned', v_points,
    'quest_name', v_quest.name
  );
END;
$$;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_quests_user_status ON user_quests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_quests_expires_at ON user_quests(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_quests_started_at ON user_quests(started_at);
CREATE INDEX IF NOT EXISTS idx_quest_templates_type_active ON quest_templates(type, is_active);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_created ON quest_completions(user_id, created_at);

-- Row Level Security (RLS)
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Users can view active quest templates" ON quest_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own quests" ON user_quests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quest completions" ON quest_completions
  FOR SELECT USING (auth.uid() = user_id);