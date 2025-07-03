-- Fix for gacha system: Handle missing user profiles
-- This patch updates the execute_gacha_pull function to handle cases where 
-- user profiles don't exist in the users table

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
  v_auth_user RECORD;
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
  
  -- ユーザー情報取得 (修正: ユーザーが存在しない場合の処理を追加)
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  -- ユーザープロファイルが存在しない場合、認証ユーザーから作成を試行
  IF NOT FOUND THEN
    -- 認証テーブルからユーザー情報を取得
    SELECT * INTO v_auth_user FROM auth.users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'ユーザーが見つかりません');
    END IF;
    
    -- ユーザープロファイルを作成
    INSERT INTO users (id, email, username, display_name)
    VALUES (
      v_auth_user.id,
      v_auth_user.email,
      COALESCE(v_auth_user.raw_user_meta_data->>'username', SPLIT_PART(v_auth_user.email, '@', 1)),
      COALESCE(v_auth_user.raw_user_meta_data->>'display_name', SPLIT_PART(v_auth_user.email, '@', 1))
    );
    
    -- 新しく作成されたユーザー情報を取得
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
  END IF;
  
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
        
        -- 価値を累積
        v_total_value := v_total_value + COALESCE(v_item.point_value, 0);
        
        EXIT; -- 一つのアイテムが選択されたらループを抜ける
      END IF;
    END LOOP;
  END LOOP;
  
  -- ポイント支払い処理
  IF v_gacha.cost_type = 'points' THEN
    UPDATE users 
    SET points = points - v_total_cost,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING points INTO v_current_balance;
    
    -- 支払いトランザクション記録
    INSERT INTO point_transactions (user_id, amount, balance_after, type, source, description)
    VALUES (p_user_id, -v_total_cost, v_current_balance, 'spend', 'gacha', 
      FORMAT('ガチャ %s (%s回)', v_gacha.name, p_pull_count));
  END IF;
  
  -- ガチャ実行履歴を記録
  INSERT INTO gacha_pulls (
    user_id, gacha_machine_id, cost_paid, currency_type,
    items_received, total_value, random_seed, pull_count
  ) VALUES (
    p_user_id, v_gacha.id, v_total_cost, v_gacha.cost_type,
    v_pull_result, v_total_value, v_random_value, p_pull_count
  ) RETURNING id INTO v_pull_id;
  
  -- 成功レスポンス
  RETURN jsonb_build_object(
    'success', true,
    'pull_id', v_pull_id,
    'items_received', v_pull_result,
    'total_value', v_total_value,
    'cost_paid', v_total_cost,
    'remaining_balance', v_current_balance,
    'machine_name', v_gacha.name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', FORMAT('ガチャ実行エラー: %s', SQLERRM)
    );
END;
$$;