import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const tests = []

    // Test 1: Basic connectivity
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      tests.push({
        name: 'Users table',
        success: !usersError,
        error: usersError?.message,
        data: usersData
      })
    } catch (e) {
      tests.push({
        name: 'Users table',
        success: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // Test 2: Gacha machines table
    try {
      const { data: gachaData, error: gachaError } = await supabase
        .from('gacha_machines')
        .select('*')
        .limit(1)

      tests.push({
        name: 'Gacha machines table',
        success: !gachaError,
        error: gachaError?.message,
        data: gachaData
      })
    } catch (e) {
      tests.push({
        name: 'Gacha machines table',
        success: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // Test 3: Gacha items table
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('gacha_items')
        .select('*')
        .limit(1)

      tests.push({
        name: 'Gacha items table',
        success: !itemsError,
        error: itemsError?.message,
        data: itemsData
      })
    } catch (e) {
      tests.push({
        name: 'Gacha items table',
        success: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // Test 4: Quest templates table
    try {
      const { data: questData, error: questError } = await supabase
        .from('quest_templates')
        .select('*')
        .limit(1)

      tests.push({
        name: 'Quest templates table',
        success: !questError,
        error: questError?.message,
        data: questData
      })
    } catch (e) {
      tests.push({
        name: 'Quest templates table',
        success: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // Test 5: RPC function - get pulls today
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_gacha_pulls_today', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        p_gacha_slug: 'forest-standard'
      })

      tests.push({
        name: 'RPC get_user_gacha_pulls_today',
        success: !rpcError,
        error: rpcError?.message,
        data: rpcData
      })
    } catch (e) {
      tests.push({
        name: 'RPC get_user_gacha_pulls_today',
        success: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // Test 6: Check user_items table exists
    try {
      const { data: userItemsData, error: userItemsError } = await supabase
        .from('user_items')
        .select('*')
        .limit(1)

      tests.push({
        name: 'user_items table',
        success: !userItemsError,
        error: userItemsError?.message,
        data: userItemsData
      })
    } catch (e) {
      tests.push({
        name: 'user_items table',
        success: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // Test 7: Check gacha_pools table exists  
    try {
      const { data: poolsData, error: poolsError } = await supabase
        .from('gacha_pools')
        .select('*')
        .limit(5)

      tests.push({
        name: 'gacha_pools table',
        success: !poolsError,
        error: poolsError?.message,
        data: poolsData
      })
    } catch (e) {
      tests.push({
        name: 'gacha_pools table',
        success: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }

    const allSuccess = tests.every(test => test.success)
    const successCount = tests.filter(test => test.success).length

    return Response.json({ 
      success: allSuccess,
      summary: `${successCount}/${tests.length} tests passed`,
      tests
    })

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, userId } = await request.json()
    
    if (action === 'daily-bonus') {
      const { data, error } = await supabase.rpc('process_daily_bonus', {
        p_user_id: userId
      })
      
      return Response.json({ 
        success: !error, 
        data,
        error: error?.message || null 
      })
    }
    
    if (action === 'game-session') {
      const { data, error } = await supabase.rpc('handle_game_session', {
        p_user_id: userId,
        p_game_id: '550e8400-e29b-41d4-a716-446655440000', // Number guessing game ID
        p_score: 80,
        p_points_earned: 20,
        p_metadata: { test: true }
      })
      
      return Response.json({ 
        success: !error, 
        data,
        error: error?.message || null 
      })
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}