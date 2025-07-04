-- ====================================
-- FIX GACHA SYSTEM MISSING TABLES AND COLUMNS
-- ====================================

-- 1. Add missing 'slug' column to gacha_machines table
ALTER TABLE gacha_machines ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing records with slug based on machine_type
UPDATE gacha_machines 
SET slug = CASE 
  WHEN machine_type = 'standard' THEN 'forest-standard'
  WHEN machine_type = 'premium' THEN 'forest-premium'  
  WHEN machine_type = 'daily' THEN 'forest-daily'
  WHEN machine_type = 'event' THEN 'forest-event'
  ELSE LOWER(REPLACE(name, ' ', '-'))
END
WHERE slug IS NULL;

-- Make slug NOT NULL and UNIQUE after updating
ALTER TABLE gacha_machines ALTER COLUMN slug SET NOT NULL;
ALTER TABLE gacha_machines ADD CONSTRAINT gacha_machines_slug_unique UNIQUE (slug);

-- 2. Rename machine_type to type for consistency with the frontend
ALTER TABLE gacha_machines RENAME COLUMN machine_type TO type;

-- 3. Create the missing gacha_pulls table
CREATE TABLE IF NOT EXISTS gacha_pulls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES gacha_machines(id) ON DELETE CASCADE,
  
  -- Pull information
  pull_count INTEGER NOT NULL DEFAULT 1 CHECK (pull_count > 0),
  cost_paid INTEGER NOT NULL DEFAULT 0 CHECK (cost_paid >= 0),
  
  -- Results
  items_received JSONB NOT NULL DEFAULT '[]',
  total_value INTEGER NOT NULL DEFAULT 0 CHECK (total_value >= 0),
  
  -- Metadata
  pull_session_id UUID DEFAULT gen_random_uuid(),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_user_id ON gacha_pulls(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_machine_id ON gacha_pulls(machine_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_created_at ON gacha_pulls(created_at);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_user_machine_date ON gacha_pulls(user_id, machine_id, created_at);

-- 4. Create or replace the RPC function for getting daily pulls
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
  
  -- Count pulls today
  SELECT COALESCE(SUM(pull_count), 0) INTO v_pulls_today
  FROM gacha_pulls
  WHERE user_id = p_user_id
    AND machine_id = v_machine_id
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN v_pulls_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the execute_gacha_pull RPC function
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
  -- Get machine details
  SELECT * INTO v_machine_record
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
  
  IF v_pulls_today + p_pull_count > v_machine_record.pulls_per_day THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Daily pull limit exceeded'
    );
  END IF;
  
  -- Calculate total cost
  v_total_cost := v_machine_record.cost_per_pull * p_pull_count;
  
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
        
        v_total_value := v_total_value + v_item.point_value;
        
        -- Add to user inventory if not currency
        IF v_item.item_type != 'currency' THEN
          INSERT INTO user_items (user_id, item_id, quantity)
          VALUES (p_user_id, v_item.id, 1)
          ON CONFLICT (user_id, item_id)
          DO UPDATE SET quantity = user_items.quantity + 1;
        ELSE
          -- Add currency points directly
          UPDATE users 
          SET points = points + v_item.point_value
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
    'remaining_pulls_today', v_machine_record.pulls_per_day - v_pulls_today - p_pull_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant necessary permissions
GRANT ALL ON gacha_pulls TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gacha_pulls_today(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_gacha_pull(UUID, TEXT, INTEGER) TO authenticated;