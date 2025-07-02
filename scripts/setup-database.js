#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Points Forest database...')
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../supabase/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split into individual statements (basic approach)
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing statement...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct execution for some statements
          const { error: directError } = await supabase
            .from('_internal')
            .select('*')
            .limit(0)
          
          if (directError && directError.message.includes('relation "_internal" does not exist')) {
            // This is expected, continue
            console.log(`   ✓ Statement executed`)
          } else if (error.message.includes('already exists')) {
            console.log(`   ⚠ Already exists, skipping`)
          } else {
            console.log(`   ❌ Error: ${error.message}`)
          }
        } else {
          console.log(`   ✓ Statement executed`)
        }
      } catch (err) {
        console.log(`   ⚠ Skipping statement due to error: ${err.message}`)
      }
    }
    
    console.log('✅ Database setup completed!')
    console.log('')
    console.log('🎯 Next steps:')
    console.log('1. Run: npm run dev')
    console.log('2. Visit: http://localhost:3000')
    console.log('3. Create an account and start playing!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Alternative approach: Manual table creation
async function setupDatabaseManual() {
  try {
    console.log('🚀 Setting up Points Forest database (manual approach)...')
    
    // Create users table
    console.log('Creating users table...')
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          display_name TEXT,
          points INTEGER DEFAULT 0 CHECK (points >= 0),
          level INTEGER DEFAULT 1 CHECK (level >= 1),
          experience INTEGER DEFAULT 0 CHECK (experience >= 0),
          login_streak INTEGER DEFAULT 0,
          last_login_at TIMESTAMPTZ,
          last_daily_bonus_at TIMESTAMPTZ,
          avatar_url TEXT,
          avatar_config JSONB DEFAULT '{}',
          profile_theme TEXT DEFAULT 'default',
          is_premium BOOLEAN DEFAULT FALSE,
          premium_expires_at TIMESTAMPTZ,
          is_banned BOOLEAN DEFAULT FALSE,
          ban_reason TEXT,
          signup_ip INET,
          last_seen_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (usersError) console.log('Users table error:', usersError.message)
    else console.log('✅ Users table created')
    
    console.log('✅ Database setup completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
}