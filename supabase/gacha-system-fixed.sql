-- Gacha System Database Schema (Fixed Version)
-- ガチャシステム用のデータベーススキーマ（修正版）

-- 1. ガチャマシン設定テーブル
CREATE TABLE IF NOT EXISTS gacha_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- ガチャタイプ・設定
  type TEXT NOT NULL CHECK (type IN ('standard', 'premium', 'event', 'daily')),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('points', 'premium_currency', 'special_key')),
  cost_amount INTEGER NOT NULL,
  
  -- プルレート設定
  pull_rates JSONB NOT NULL, -- 排出率設定
  guaranteed_items JSONB,    -- 天井・保証設定
  
  -- 制限・期間
  daily_limit INTEGER,
  weekly_limit INTEGER,
  requires_premium BOOLEAN DEFAULT FALSE,
  
  -- 期間限定設定
  is_limited BOOLEAN DEFAULT FALSE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- 表示設定
  banner_image_url TEXT,
  animation_config JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ガチャアイテム（景品）定義
CREATE TABLE IF NOT EXISTS gacha_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- アイテム分類
  category TEXT NOT NULL CHECK (category IN ('points', 'avatar_frame', 'badge', 'boost', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical')),
  
  -- アイテム値・効果
  point_value INTEGER,           -- ポイントアイテムの場合
  effect_config JSONB,          -- ブースト等の効果設定
  
  -- 表示
  image_url TEXT,
  icon_emoji TEXT,              -- 絵文字アイコン
  rarity_color TEXT,
  
  -- 状態
  is_tradeable BOOLEAN DEFAULT FALSE,
  is_consumable BOOLEAN DEFAULT TRUE,
  max_stack INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ガチャマシンとアイテムの関連（プール設定）
CREATE TABLE IF NOT EXISTS gacha_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gacha_machine_id UUID REFERENCES gacha_machines(id) ON DELETE CASCADE,
  gacha_item_id UUID REFERENCES gacha_items(id) ON DELETE CASCADE,
  
  -- 排出率
  drop_rate DECIMAL(8,6) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 1),
  weight INTEGER DEFAULT 1,
  
  -- 特別条件
  is_jackpot BOOLEAN DEFAULT FALSE,
  guaranteed_after INTEGER,      -- X回後確定
  
  -- 期間限定
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ガチャ実行履歴
CREATE TABLE IF NOT EXISTS gacha_pulls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gacha_machine_id UUID REFERENCES gacha_machines(id) ON DELETE CASCADE,
  
  -- プル情報
  cost_paid INTEGER NOT NULL,
  currency_type TEXT NOT NULL,
  
  -- 結果
  items_received JSONB NOT NULL, -- 取得アイテムリスト
  total_value INTEGER,           -- 総価値
  
  -- ガチャ実行データ
  random_seed DECIMAL(10,8),     -- 乱数シード（検証用）
  pull_count INTEGER,            -- そのガチャでの通算回数
  is_guaranteed BOOLEAN DEFAULT FALSE,
  
  -- メタデータ
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ユーザーアイテム所持
CREATE TABLE IF NOT EXISTS user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gacha_item_id UUID REFERENCES gacha_items(id) ON DELETE CASCADE,
  
  -- 所持情報
  quantity INTEGER NOT NULL DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,
  
  -- 取得情報
  obtained_from TEXT, -- 'gacha', 'purchase', 'event', 'admin'
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 状態
  is_consumed BOOLEAN DEFAULT FALSE,
  consumed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, gacha_item_id)
);

-- デフォルトガチャマシンを挿入
INSERT INTO gacha_machines (name, slug, description, type, cost_type, cost_amount, pull_rates, daily_limit, sort_order)
VALUES 
-- スタンダードガチャ
('フォレストガチャ', 'forest-standard', '森の恵みが詰まった基本ガチャ', 'standard', 'points', 100, 
 '{"rates": {"common": 0.7, "uncommon": 0.2, "rare": 0.08, "epic": 0.015, "legendary": 0.004, "mythical": 0.001}}', 
 50, 1),

-- プレミアムガチャ
('ゴールデンガチャ', 'golden-premium', '高級な景品が当たるプレミアムガチャ', 'premium', 'points', 500,
 '{"rates": {"common": 0.4, "uncommon": 0.35, "rare": 0.18, "epic": 0.05, "legendary": 0.018, "mythical": 0.002}}', 
 10, 2),

-- デイリーガチャ
('デイリーボーナスガチャ', 'daily-bonus', '1日1回無料のデイリーガチャ', 'daily', 'points', 50,
 '{"rates": {"common": 0.6, "uncommon": 0.25, "rare": 0.12, "epic": 0.025, "legendary": 0.004, "mythical": 0.001}}', 
 1, 3)
ON CONFLICT (slug) DO NOTHING;

-- デフォルトガチャアイテムを挿入
INSERT INTO gacha_items (name, slug, description, category, rarity, point_value, icon_emoji, rarity_color)
VALUES 
-- コモンアイテム
('ベーシックポイント', 'basic-points', '基本的なポイント報酬', 'points', 'common', 50, '🪙', '#94a3b8'),
('フォレストコイン', 'forest-coin', '森の小さなコイン', 'points', 'common', 75, '🌰', '#94a3b8'),
('木の実ポイント', 'acorn-points', '木の実からのポイント', 'points', 'common', 100, '🥜', '#94a3b8'),

-- アンコモンアイテム
('シルバーコイン', 'silver-coin', '銀貨相当のポイント', 'points', 'uncommon', 200, '🥈', '#60a5fa'),
('フォレストジェム', 'forest-gem', '森の小さな宝石', 'points', 'uncommon', 250, '💎', '#60a5fa'),
('マジックベリー', 'magic-berry', '魔法の木の実', 'points', 'uncommon', 300, '🫐', '#60a5fa'),

-- レアアイテム
('ゴールドコイン', 'gold-coin', '金貨相当のポイント', 'points', 'rare', 500, '🥇', '#fbbf24'),
('エンチャントストーン', 'enchant-stone', '魔法が込められた石', 'points', 'rare', 750, '✨', '#fbbf24'),
('フォレストクリスタル', 'forest-crystal', '森の力が宿るクリスタル', 'points', 'rare', 1000, '🔮', '#fbbf24'),

-- エピックアイテム
('プラチナコイン', 'platinum-coin', 'プラチナ貨相当のポイント', 'points', 'epic', 2000, '🪙', '#a855f7'),
('ドラゴンスケール', 'dragon-scale', '伝説のドラゴンの鱗', 'points', 'epic', 2500, '🐉', '#a855f7'),
('ムーンストーン', 'moon-stone', '月の力を秘めた石', 'points', 'epic', 3000, '🌙', '#a855f7'),

-- レジェンダリーアイテム
('ダイヤモンド', 'diamond', '最高級のダイヤモンド', 'points', 'legendary', 5000, '💎', '#ef4444'),
('フェニックスフェザー', 'phoenix-feather', '不死鳥の羽根', 'points', 'legendary', 7500, '🪶', '#ef4444'),
('スターフラグメント', 'star-fragment', '星のかけら', 'points', 'legendary', 10000, '⭐', '#ef4444'),

-- ミシカルアイテム
('エターナルジェム', 'eternal-gem', '永遠の宝石', 'points', 'mythical', 25000, '💠', '#f97316'),
('ガーディアンオーブ', 'guardian-orb', '守護者のオーブ', 'points', 'mythical', 50000, '🔮', '#f97316'),
('コスミックエッセンス', 'cosmic-essence', '宇宙の神秘', 'points', 'mythical', 100000, '🌌', '#f97316')
ON CONFLICT (slug) DO NOTHING;

-- デフォルトガチャプールを設定
INSERT INTO gacha_pools (gacha_machine_id, gacha_item_id, drop_rate)
SELECT 
  gm.id,
  gi.id,
  CASE gi.rarity
    WHEN 'common' THEN 0.233333    -- 70% / 3アイテム
    WHEN 'uncommon' THEN 0.066667  -- 20% / 3アイテム  
    WHEN 'rare' THEN 0.026667      -- 8% / 3アイテム
    WHEN 'epic' THEN 0.005         -- 1.5% / 3アイテム
    WHEN 'legendary' THEN 0.001333 -- 0.4% / 3アイテム
    WHEN 'mythical' THEN 0.000333  -- 0.1% / 3アイテム
  END
FROM gacha_machines gm
CROSS JOIN gacha_items gi
WHERE gm.slug = 'forest-standard'
  AND gi.category = 'points'
ON CONFLICT DO NOTHING;

-- プレミアムガチャのプール設定
INSERT INTO gacha_pools (gacha_machine_id, gacha_item_id, drop_rate)
SELECT 
  gm.id,
  gi.id,
  CASE gi.rarity
    WHEN 'common' THEN 0.133333    -- 40% / 3アイテム
    WHEN 'uncommon' THEN 0.116667  -- 35% / 3アイテム  
    WHEN 'rare' THEN 0.06          -- 18% / 3アイテム
    WHEN 'epic' THEN 0.016667      -- 5% / 3アイテム
    WHEN 'legendary' THEN 0.006    -- 1.8% / 3アイテム
    WHEN 'mythical' THEN 0.000667  -- 0.2% / 3アイテム
  END
FROM gacha_machines gm
CROSS JOIN gacha_items gi
WHERE gm.slug = 'golden-premium'
  AND gi.category = 'points'
ON CONFLICT DO NOTHING;

-- デイリーガチャのプール設定
INSERT INTO gacha_pools (gacha_machine_id, gacha_item_id, drop_rate)
SELECT 
  gm.id,
  gi.id,
  CASE gi.rarity
    WHEN 'common' THEN 0.2         -- 60% / 3アイテム
    WHEN 'uncommon' THEN 0.083333  -- 25% / 3アイテム  
    WHEN 'rare' THEN 0.04          -- 12% / 3アイテム
    WHEN 'epic' THEN 0.008333      -- 2.5% / 3アイテム
    WHEN 'legendary' THEN 0.001333 -- 0.4% / 3アイテム
    WHEN 'mythical' THEN 0.000333  -- 0.1% / 3アイテム
  END
FROM gacha_machines gm
CROSS JOIN gacha_items gi
WHERE gm.slug = 'daily-bonus'
  AND gi.category = 'points'
ON CONFLICT DO NOTHING;

-- 6. ガチャ実行関数
CREATE OR REPLACE FUNCTION execute_gacha_pull(
  p_user_id UUID,
  p_gacha_slug TEXT,
  p_pull_count INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gacha RECORD;
  v_user RECORD;
  v_daily_pulls INTEGER;
  v_total_cost INTEGER;
  v_current_balance INTEGER;
  v_pull_result JSONB := '[]';
  v_item RECORD;
  v_random_value DECIMAL(10,8);
  v_cumulative_rate DECIMAL(8,6) := 0;
  v_pull_id UUID;
  v_total_value INTEGER := 0;
  v_today DATE := CURRENT_DATE;
  i INTEGER;
BEGIN
  -- ガチャマシン取得
  SELECT * INTO v_gacha 
  FROM gacha_machines 
  WHERE slug = p_gacha_slug AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ガチャマシンが見つかりません');
  END IF;
  
  -- 期間チェック
  IF v_gacha.is_limited THEN
    IF v_gacha.available_from IS NOT NULL AND NOW() < v_gacha.available_from THEN
      RETURN jsonb_build_object('success', false, 'error', 'ガチャはまだ開始されていません');
    END IF;
    
    IF v_gacha.available_until IS NOT NULL AND NOW() > v_gacha.available_until THEN
      RETURN jsonb_build_object('success', false, 'error', 'ガチャは終了しました');
    END IF;
  END IF;
  
  -- ユーザー情報取得
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  -- プレミアム要件チェック
  IF v_gacha.requires_premium AND NOT v_user.is_premium THEN
    RETURN jsonb_build_object('success', false, 'error', 'プレミアム会員が必要です');
  END IF;
  
  -- デイリー制限チェック
  IF v_gacha.daily_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_daily_pulls
    FROM gacha_pulls
    WHERE user_id = p_user_id 
      AND gacha_machine_id = v_gacha.id
      AND created_at >= v_today
      AND created_at < v_today + INTERVAL '1 day';
    
    IF v_daily_pulls + p_pull_count > v_gacha.daily_limit THEN
      RETURN jsonb_build_object('success', false, 'error', '本日の回数制限に達しました');
    END IF;
  END IF;
  
  -- コスト計算・残高チェック
  v_total_cost := v_gacha.cost_amount * p_pull_count;
  
  IF v_gacha.cost_type = 'points' THEN
    IF v_user.points < v_total_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'ポイントが不足しています');
    END IF;
  END IF;
  
  -- プル実行ループ
  FOR i IN 1..p_pull_count LOOP
    v_random_value := RANDOM();
    v_cumulative_rate := 0;
    
    -- アイテム抽選
    FOR v_item IN
      SELECT gi.*, gp.drop_rate
      FROM gacha_pools gp
      JOIN gacha_items gi ON gi.id = gp.gacha_item_id
      WHERE gp.gacha_machine_id = v_gacha.id
        AND (gp.available_from IS NULL OR NOW() >= gp.available_from)
        AND (gp.available_until IS NULL OR NOW() <= gp.available_until)
      ORDER BY gp.drop_rate ASC
    LOOP
      v_cumulative_rate := v_cumulative_rate + v_item.drop_rate;
      
      IF v_random_value <= v_cumulative_rate THEN
        -- アイテム取得
        v_pull_result := v_pull_result || jsonb_build_object(
          'item_id', v_item.id,
          'name', v_item.name,
          'rarity', v_item.rarity,
          'category', v_item.category,
          'point_value', v_item.point_value,
          'icon_emoji', v_item.icon_emoji,
          'rarity_color', v_item.rarity_color
        );
        
        -- ユーザーアイテムに追加
        INSERT INTO user_items (user_id, gacha_item_id, obtained_from)
        VALUES (p_user_id, v_item.id, 'gacha')
        ON CONFLICT (user_id, gacha_item_id) 
        DO UPDATE SET quantity = user_items.quantity + 1;
        
        -- ポイントアイテムの場合、即座にポイント付与
        IF v_item.category = 'points' AND v_item.point_value IS NOT NULL THEN
          UPDATE users 
          SET points = points + v_item.point_value
          WHERE id = p_user_id;
          
          v_total_value := v_total_value + v_item.point_value;
        END IF;
        
        EXIT; -- 次のプルへ
      END IF;
    END LOOP;
  END LOOP;
  
  -- コスト支払い処理
  IF v_gacha.cost_type = 'points' THEN
    UPDATE users 
    SET points = points - v_total_cost
    WHERE id = p_user_id
    RETURNING points INTO v_current_balance;
    
    -- 支払いトランザクション記録
    INSERT INTO point_transactions (user_id, amount, type, source, description, metadata)
    VALUES (p_user_id, -v_total_cost, 'spend', 'gacha', 
      'ガチャ: ' || v_gacha.name || ' x' || p_pull_count,
      jsonb_build_object('gacha_slug', p_gacha_slug, 'pull_count', p_pull_count));
  END IF;
  
  -- ガチャプル履歴記録
  INSERT INTO gacha_pulls (
    user_id, gacha_machine_id, cost_paid, currency_type, 
    items_received, total_value, random_seed, pull_count
  ) VALUES (
    p_user_id, v_gacha.id, v_total_cost, v_gacha.cost_type,
    v_pull_result, v_total_value, v_random_value, p_pull_count
  ) RETURNING id INTO v_pull_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'pull_id', v_pull_id,
    'items_received', v_pull_result,
    'total_value', v_total_value,
    'cost_paid', v_total_cost,
    'remaining_balance', v_current_balance
  );
END;
$$;

-- 7. ユーザーの本日のガチャ回数取得関数
CREATE OR REPLACE FUNCTION get_user_gacha_pulls_today(
  p_user_id UUID,
  p_gacha_slug TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gacha_id UUID;
  v_pulls_today INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- ガチャID取得
  SELECT id INTO v_gacha_id 
  FROM gacha_machines 
  WHERE slug = p_gacha_slug AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- 本日のプル数を取得
  SELECT COUNT(*) INTO v_pulls_today
  FROM gacha_pulls
  WHERE user_id = p_user_id 
    AND gacha_machine_id = v_gacha_id
    AND created_at >= v_today
    AND created_at < v_today + INTERVAL '1 day';
  
  RETURN v_pulls_today;
END;
$$;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_gacha_pools_machine_id ON gacha_pools(gacha_machine_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_user_date ON gacha_pulls(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_created_at ON gacha_pulls(created_at);
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_machines_active ON gacha_machines(is_active, sort_order);

-- Row Level Security (RLS)
ALTER TABLE gacha_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_pulls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Users can view active gacha machines" ON gacha_machines
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view gacha items" ON gacha_items
  FOR SELECT USING (true);

CREATE POLICY "Users can view gacha pools" ON gacha_pools
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own gacha pulls" ON gacha_pulls
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own items" ON user_items
  FOR ALL USING (auth.uid() = user_id);