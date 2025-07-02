import { supabase } from '@/lib/supabase'

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