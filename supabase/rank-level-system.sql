-- ====================================
-- RANK & LEVEL SYSTEM
-- Sprint 3 Implementation
-- ====================================

-- 1. ランク定義テーブル
CREATE TABLE IF NOT EXISTS ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier INTEGER NOT NULL CHECK (tier >= 1), -- 1: Bronze, 2: Silver, 3: Gold, 4: Platinum, 5: Diamond
  
  -- ランク要件
  min_level INTEGER NOT NULL CHECK (min_level >= 1),
  max_level INTEGER, -- NULL = 無制限
  
  -- 視覚設定
  color_primary TEXT NOT NULL DEFAULT '#cd7f32', -- Bronze default
  color_secondary TEXT,
  icon_url TEXT,
  badge_url TEXT,
  
  -- ランク特典
  benefits JSONB DEFAULT '{}', -- { "daily_bonus_multiplier": 1.5, "gacha_discount": 0.1 }
  
  -- メタデータ
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. レベル進行設定テーブル
CREATE TABLE IF NOT EXISTS level_configs (
  level INTEGER PRIMARY KEY CHECK (level >= 1),
  
  -- 経験値要件
  required_exp INTEGER NOT NULL CHECK (required_exp >= 0),
  total_exp INTEGER NOT NULL CHECK (total_exp >= 0), -- 累計経験値
  
  -- レベルアップ報酬
  reward_points INTEGER DEFAULT 0,
  reward_items JSONB DEFAULT '[]', -- [{"type": "gacha_ticket", "quantity": 1}]
  
  -- 解放要素
  unlocks JSONB DEFAULT '[]', -- ["crystal-spring", "premium-gacha"]
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ユーザーランク履歴
CREATE TABLE IF NOT EXISTS user_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- ランク変更
  previous_rank_id UUID REFERENCES ranks(id),
  new_rank_id UUID REFERENCES ranks(id),
  previous_level INTEGER,
  new_level INTEGER,
  
  -- 変更理由
  reason TEXT, -- 'level_up', 'season_reset', 'admin_adjustment'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 経験値取得履歴
CREATE TABLE IF NOT EXISTS exp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 経験値詳細
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'game', 'quest', 'achievement', 'daily_bonus'
  source_id UUID, -- 関連するゲーム/クエスト/実績のID
  
  -- コンテキスト
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  bonus_exp INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. シーズンランク（将来の拡張用）
CREATE TABLE IF NOT EXISTS rank_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- シーズン期間
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- シーズン設定
  exp_multiplier DECIMAL(3,2) DEFAULT 1.0,
  special_rewards JSONB DEFAULT '{}',
  
  -- ステータス
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_rank_history_user_id ON user_rank_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_transactions_user_id ON exp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_transactions_source ON exp_transactions(source, source_id);

-- デフォルトランクデータ投入
INSERT INTO ranks (name, slug, tier, min_level, max_level, color_primary, color_secondary, description, benefits, sort_order)
VALUES
  ('ブロンズ', 'bronze', 1, 1, 9, '#cd7f32', '#b8860b', '冒険を始めたばかりの初心者ランク', 
   '{"daily_bonus_multiplier": 1.0, "exp_multiplier": 1.0}', 1),
  
  ('シルバー', 'silver', 2, 10, 24, '#c0c0c0', '#a8a8a8', '経験を積んだ中級者ランク',
   '{"daily_bonus_multiplier": 1.2, "exp_multiplier": 1.1, "gacha_discount": 0.05}', 2),
  
  ('ゴールド', 'gold', 3, 25, 49, '#ffd700', '#ffaa00', '熟練した上級者ランク',
   '{"daily_bonus_multiplier": 1.5, "exp_multiplier": 1.2, "gacha_discount": 0.1, "quest_bonus": 0.1}', 3),
  
  ('プラチナ', 'platinum', 4, 50, 74, '#e5e4e2', '#d4d4d4', 'エリートプレイヤーの証',
   '{"daily_bonus_multiplier": 2.0, "exp_multiplier": 1.3, "gacha_discount": 0.15, "quest_bonus": 0.2}', 4),
  
  ('ダイヤモンド', 'diamond', 5, 75, NULL, '#b9f2ff', '#89cff0', '最高位の伝説的ランク',
   '{"daily_bonus_multiplier": 3.0, "exp_multiplier": 1.5, "gacha_discount": 0.2, "quest_bonus": 0.3, "exclusive_access": true}', 5)
ON CONFLICT (slug) DO NOTHING;

-- レベル設定生成（1-100レベル）
INSERT INTO level_configs (level, required_exp, total_exp, reward_points)
SELECT 
  level,
  CASE 
    WHEN level = 1 THEN 0
    WHEN level <= 10 THEN 100 * (level - 1)
    WHEN level <= 25 THEN 1000 + 200 * (level - 10)
    WHEN level <= 50 THEN 4000 + 300 * (level - 25)
    WHEN level <= 75 THEN 11500 + 500 * (level - 50)
    ELSE 24000 + 1000 * (level - 75)
  END as required_exp,
  CASE 
    WHEN level = 1 THEN 0
    WHEN level <= 10 THEN 100 * (level - 1) * level / 2
    WHEN level <= 25 THEN 4500 + 200 * ((level - 10) * (level - 9) / 2)
    WHEN level <= 50 THEN 20500 + 300 * ((level - 25) * (level - 24) / 2)
    WHEN level <= 75 THEN 83250 + 500 * ((level - 50) * (level - 49) / 2)
    ELSE 270750 + 1000 * ((level - 75) * (level - 74) / 2)
  END as total_exp,
  CASE 
    WHEN level % 10 = 0 THEN level * 100  -- レベル10毎にボーナス
    WHEN level % 5 = 0 THEN level * 50
    ELSE level * 10
  END as reward_points
FROM generate_series(1, 100) as level
ON CONFLICT (level) DO NOTHING;

-- 経験値付与関数
CREATE OR REPLACE FUNCTION grant_experience(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_current_level INTEGER;
  v_current_exp INTEGER;
  v_new_exp INTEGER;
  v_new_level INTEGER;
  v_new_total_exp INTEGER;
  v_level_config RECORD;
  v_rank RECORD;
  v_new_rank RECORD;
  v_multiplier DECIMAL(3,2) := 1.0;
  v_actual_exp INTEGER;
  v_level_ups INTEGER := 0;
  v_rewards JSONB := '[]';
BEGIN
  -- ユーザー情報取得
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  v_current_level := v_user.level;
  v_current_exp := v_user.experience;
  
  -- 現在のランク取得
  SELECT * INTO v_rank 
  FROM ranks 
  WHERE v_current_level >= min_level 
    AND (max_level IS NULL OR v_current_level <= max_level)
    AND is_active = TRUE
  ORDER BY tier DESC
  LIMIT 1;
  
  -- EXP倍率適用
  IF v_rank.benefits->>'exp_multiplier' IS NOT NULL THEN
    v_multiplier := (v_rank.benefits->>'exp_multiplier')::DECIMAL;
  END IF;
  
  v_actual_exp := FLOOR(p_amount * v_multiplier);
  v_new_exp := v_current_exp + v_actual_exp;
  v_new_level := v_current_level;
  
  -- レベルアップチェック
  LOOP
    SELECT * INTO v_level_config 
    FROM level_configs 
    WHERE level = v_new_level + 1;
    
    EXIT WHEN NOT FOUND OR v_new_exp < v_level_config.required_exp;
    
    -- レベルアップ！
    v_new_exp := v_new_exp - v_level_config.required_exp;
    v_new_level := v_new_level + 1;
    v_level_ups := v_level_ups + 1;
    
    -- レベルアップ報酬
    IF v_level_config.reward_points > 0 THEN
      UPDATE users 
      SET points = points + v_level_config.reward_points 
      WHERE id = p_user_id;
      
      v_rewards := v_rewards || jsonb_build_object(
        'type', 'points',
        'amount', v_level_config.reward_points,
        'level', v_new_level
      );
    END IF;
  END LOOP;
  
  -- ユーザー情報更新
  UPDATE users 
  SET level = v_new_level,
      experience = v_new_exp,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- EXP取得履歴記録
  INSERT INTO exp_transactions (
    user_id, amount, source, source_id, 
    multiplier, metadata
  ) VALUES (
    p_user_id, p_amount, p_source, p_source_id,
    v_multiplier, p_metadata
  );
  
  -- ランクアップチェック
  SELECT * INTO v_new_rank 
  FROM ranks 
  WHERE v_new_level >= min_level 
    AND (max_level IS NULL OR v_new_level <= max_level)
    AND is_active = TRUE
  ORDER BY tier DESC
  LIMIT 1;
  
  IF v_new_rank.id IS DISTINCT FROM v_rank.id THEN
    -- ランク変更履歴記録
    INSERT INTO user_rank_history (
      user_id, previous_rank_id, new_rank_id,
      previous_level, new_level, reason
    ) VALUES (
      p_user_id, v_rank.id, v_new_rank.id,
      v_current_level, v_new_level, 'level_up'
    );
  END IF;
  
  -- 実績チェック
  PERFORM check_achievements(p_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'exp_gained', v_actual_exp,
    'multiplier', v_multiplier,
    'current_level', v_new_level,
    'current_exp', v_new_exp,
    'level_ups', v_level_ups,
    'rewards', v_rewards,
    'rank', jsonb_build_object(
      'name', COALESCE(v_new_rank.name, v_rank.name),
      'tier', COALESCE(v_new_rank.tier, v_rank.tier),
      'color', COALESCE(v_new_rank.color_primary, v_rank.color_primary)
    )
  );
END;
$$;

-- ユーザーランク情報取得関数
CREATE OR REPLACE FUNCTION get_user_rank_info(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_rank RECORD;
  v_next_level_config RECORD;
  v_progress DECIMAL(5,2);
BEGIN
  -- ユーザー情報取得
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- 現在のランク取得
  SELECT * INTO v_rank 
  FROM ranks 
  WHERE v_user.level >= min_level 
    AND (max_level IS NULL OR v_user.level <= max_level)
    AND is_active = TRUE
  ORDER BY tier DESC
  LIMIT 1;
  
  -- 次レベルの設定取得
  SELECT * INTO v_next_level_config 
  FROM level_configs 
  WHERE level = v_user.level + 1;
  
  -- 進捗率計算
  IF v_next_level_config.required_exp > 0 THEN
    v_progress := (v_user.experience::DECIMAL / v_next_level_config.required_exp) * 100;
  ELSE
    v_progress := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'level', v_user.level,
    'experience', v_user.experience,
    'next_level_exp', COALESCE(v_next_level_config.required_exp, 0),
    'progress_percent', v_progress,
    'rank', jsonb_build_object(
      'id', v_rank.id,
      'name', v_rank.name,
      'tier', v_rank.tier,
      'color_primary', v_rank.color_primary,
      'color_secondary', v_rank.color_secondary,
      'benefits', v_rank.benefits
    )
  );
END;
$$;