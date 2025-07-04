import { supabase } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST() {
  try {
    const serverSupabase = createServerSupabaseClient()
    
    // Create a test user in the users table
    const testUserId = 'test-user-uuid-for-gacha-testing'
    const { data, error } = await serverSupabase
      .from('users')
      .upsert({
        id: testUserId,
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        points: 10000, // Give them plenty of points for testing
        level: 1,
        experience: 0,
        login_streak: 1,
        last_login_at: new Date().toISOString(),
        avatar_url: null,
        is_premium: false
      })
      .select()

    if (error) {
      console.error('Error creating test user:', error)
      return Response.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Test user created successfully',
      user: data[0],
      testInfo: {
        note: 'You can now test gacha with this user ID',
        testUserId,
        points: 10000
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ 
    message: 'Use POST to create a test user for gacha testing' 
  })
}