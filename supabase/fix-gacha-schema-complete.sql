-- ====================================
-- COMPLETE GACHA SCHEMA FIX
-- ====================================

-- 1. Update gacha_pulls table to match frontend expectations
ALTER TABLE gacha_pulls DROP COLUMN IF EXISTS item_id;
ALTER TABLE gacha_pulls DROP COLUMN IF EXISTS bonus_pull;
ALTER TABLE gacha_pulls DROP COLUMN IF EXISTS pull_metadata;

-- Add missing columns
ALTER TABLE gacha_pulls ADD COLUMN IF NOT EXISTS pull_count INTEGER DEFAULT 1 CHECK (pull_count > 0);
ALTER TABLE gacha_pulls ADD COLUMN IF NOT EXISTS items_received JSONB DEFAULT '[]';
ALTER TABLE gacha_pulls ADD COLUMN IF NOT EXISTS total_value INTEGER DEFAULT 0 CHECK (total_value >= 0);
ALTER TABLE gacha_pulls ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing records to have proper structure
UPDATE gacha_pulls 
SET 
  pull_count = 1,
  items_received = '[]'::jsonb,
  total_value = 0,
  metadata = '{}'::jsonb
WHERE pull_count IS NULL OR items_received IS NULL;

-- Make required columns NOT NULL
ALTER TABLE gacha_pulls ALTER COLUMN pull_count SET NOT NULL;
ALTER TABLE gacha_pulls ALTER COLUMN items_received SET NOT NULL;
ALTER TABLE gacha_pulls ALTER COLUMN total_value SET NOT NULL;

-- 2. Fix the RPC function to work with updated schema
CREATE OR REPLACE FUNCTION get_user_gacha_pulls_today(
  p_user_id UUID,
  p_gacha_slug TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_machine_id UUID;
  v_pulls_today INTEGER;
BEGIN
  -- Get machine ID from slug
  SELECT id INTO v_machine_id 
  FROM gacha_machines 
  WHERE slug = p_gacha_slug AND is_active = TRUE;
  
  -- If machine not found, return 0
  IF v_machine_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count pulls today using pull_count column
  SELECT COALESCE(SUM(pull_count), 0) INTO v_pulls_today
  FROM gacha_pulls
  WHERE user_id = p_user_id
    AND machine_id = v_machine_id
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN v_pulls_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create execute_gacha_pull function
CREATE OR REPLACE FUNCTION execute_gacha_pull(
  p_user_id UUID,
  p_gacha_slug TEXT,
  p_pull_count INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_machine_id UUID;
  v_machine_record RECORD;
  v_user_points INTEGER;
  v_total_cost INTEGER;
  v_pulls_today INTEGER;
  v_items_received JSONB;
  v_total_value INTEGER;
  v_pull_id UUID;
  v_item RECORD;
  v_selected_items JSONB;
  v_random_value NUMERIC;
  v_cumulative_rate NUMERIC;
  v_i INTEGER;
BEGIN
  -- Get machine details (map database columns to expected names)
  SELECT 
    id,
    name,
    slug,
    type,
    cost_per_pull as cost_amount,
    pulls_per_day as daily_limit,
    is_active
  INTO v_machine_record
  FROM gacha_machines
  WHERE slug = p_gacha_slug AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Gacha machine not found or inactive'
    );
  END IF;
  
  v_machine_id := v_machine_record.id;
  
  -- Check daily limits
  v_pulls_today := get_user_gacha_pulls_today(p_user_id, p_gacha_slug);
  
  IF v_pulls_today + p_pull_count > v_machine_record.daily_limit THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Daily pull limit exceeded'
    );
  END IF;
  
  -- Calculate total cost
  v_total_cost := v_machine_record.cost_amount * p_pull_count;
  
  -- Check user points
  SELECT points INTO v_user_points
  FROM users
  WHERE id = p_user_id;
  
  IF v_user_points < v_total_cost THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Insufficient points'
    );
  END IF;
  
  -- Deduct points
  UPDATE users 
  SET points = points - v_total_cost
  WHERE id = p_user_id;
  
  -- Perform pulls
  v_selected_items := '[]'::jsonb;
  v_total_value := 0;
  
  FOR v_i IN 1..p_pull_count LOOP
    -- Get random value
    v_random_value := random();
    v_cumulative_rate := 0;
    
    -- Find item based on drop rates
    FOR v_item IN 
      SELECT gi.*, gp.drop_rate
      FROM gacha_items gi
      JOIN gacha_pools gp ON gi.id = gp.item_id
      WHERE gp.machine_id = v_machine_id
      ORDER BY gp.drop_rate DESC
    LOOP
      v_cumulative_rate := v_cumulative_rate + v_item.drop_rate;
      
      IF v_random_value <= v_cumulative_rate THEN
        -- Add item to results
        v_selected_items := v_selected_items || jsonb_build_object(
          'id', v_item.id,
          'name', v_item.name,
          'rarity', v_item.rarity,
          'point_value', v_item.point_value,
          'item_type', v_item.item_type
        );
        
        v_total_value := v_total_value + COALESCE(v_item.point_value, 0);
        
        -- Add to user inventory if not currency
        IF v_item.item_type != 'currency' THEN
          INSERT INTO user_items (user_id, item_id, quantity)
          VALUES (p_user_id, v_item.id, 1)
          ON CONFLICT (user_id, item_id)
          DO UPDATE SET quantity = user_items.quantity + 1;
        ELSE
          -- Add currency points directly
          UPDATE users 
          SET points = points + COALESCE(v_item.point_value, 0)
          WHERE id = p_user_id;
        END IF;
        
        EXIT; -- Exit the loop once item is found
      END IF;
    END LOOP;
  END LOOP;
  
  -- Record the pull
  INSERT INTO gacha_pulls (
    user_id, machine_id, pull_count, cost_paid, items_received, total_value
  ) VALUES (
    p_user_id, v_machine_id, p_pull_count, v_total_cost, v_selected_items, v_total_value
  ) RETURNING id INTO v_pull_id;
  
  -- Record transaction
  INSERT INTO point_transactions (user_id, amount, type, source, description)
  VALUES (p_user_id, -v_total_cost, 'spend', 'gacha', 'Gacha pull: ' || v_machine_record.name);
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'pull_id', v_pull_id,
    'items_received', v_selected_items,
    'total_value', v_total_value,
    'cost_paid', v_total_cost,
    'remaining_pulls_today', v_machine_record.daily_limit - v_pulls_today - p_pull_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_gacha_pulls_today(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_gacha_pull(UUID, TEXT, INTEGER) TO authenticated;