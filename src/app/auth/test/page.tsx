'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results: string[] = []

    // Test 1: Environment Variables
    results.push('=== Environment Variables ===')
    results.push(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    results.push(`ANON_KEY exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
    
    // Test 2: Supabase Connection
    results.push('\n=== Supabase Connection Test ===')
    try {
      const { data, error } = await supabase.from('games').select('count').limit(1)
      if (error) {
        results.push(`❌ Database Query Error: ${error.message}`)
        results.push(`Error Code: ${error.code}`)
        results.push(`Error Details: ${JSON.stringify(error.details)}`)
      } else {
        results.push('✅ Database connection successful')
      }
    } catch (e) {
      results.push(`❌ Connection Error: ${e}`)
    }

    // Test 3: Auth Health Check
    results.push('\n=== Auth Health Check ===')
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        results.push(`❌ Auth Error: ${error.message}`)
      } else {
        results.push(`✅ Auth working, Session: ${session ? 'Active' : 'None'}`)
      }
    } catch (e) {
      results.push(`❌ Auth Error: ${e}`)
    }

    // Test 4: Direct API Call
    results.push('\n=== Direct API Test ===')
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`
      results.push(`Testing URL: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        }
      })
      
      results.push(`Response Status: ${response.status}`)
      results.push(`Response OK: ${response.ok}`)
      
      if (!response.ok) {
        const text = await response.text()
        results.push(`Response Body: ${text}`)
      } else {
        const data = await response.json()
        results.push(`✅ Health Check Response: ${JSON.stringify(data)}`)
      }
    } catch (e) {
      const error = e as Error
      results.push(`❌ Direct API Error: ${error.message || error}`)
      results.push(`Error Type: ${error.constructor?.name || 'Unknown'}`)
      if (error instanceof TypeError) {
        results.push('This appears to be a network/CORS issue')
      }
    }

    // Test 5: Browser Environment Check
    results.push('\n=== Browser Environment ===')
    results.push(`User Agent: ${navigator.userAgent}`)
    results.push(`Online Status: ${navigator.onLine}`)
    results.push(`Window location: ${window.location.href}`)
    
    // Test 6: Simple fetch to verify browser can make requests
    results.push('\n=== Basic Fetch Test ===')
    try {
      const testResponse = await fetch('/api/health')
      results.push(`✅ Can fetch local endpoints: ${testResponse.ok}`)
    } catch (e) {
      results.push(`❌ Cannot fetch local endpoints: ${e}`)
    }
    
    // Test 7: Test Supabase Auth Signup
    results.push('\n=== Auth Signup Test ===')
    try {
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
      })
      
      if (error) {
        results.push(`❌ Signup Error: ${error.message}`)
        results.push(`Error Name: ${error.name}`)
        results.push(`Error Stack: ${error.stack?.split('\n')[0]}`)
      } else {
        results.push(`✅ Signup successful for: ${testEmail}`)
      }
    } catch (e) {
      const error = e as Error
      results.push(`❌ Signup Exception: ${error.message || error}`)
      results.push(`Error Type: ${error.constructor?.name || 'Unknown'}`)
    }

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </Button>
          
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            {testResults.length > 0 
              ? testResults.join('\n')
              : 'Click "Run Tests" to start diagnostics'
            }
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}