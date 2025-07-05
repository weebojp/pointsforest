-- ====================================
-- FIX GACHA RPC FUNCTIONS ONLY
-- ====================================

-- Check what columns exist in gacha_pulls table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gacha_pulls' 
ORDER BY ordinal_position;

-- Fix the RPC function to work with existing gacha_pulls table structure
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
  
  -- Count pulls today using existing table structure
  -- Assuming the table has user_id, machine_id, and created_at columns
  SELECT COUNT(*) INTO v_pulls_today
  FROM gacha_pulls
  WHERE user_id = p_user_id
    AND machine_id = v_machine_id
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN v_pulls_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_gacha_pulls_today(UUID, TEXT) TO authenticated;