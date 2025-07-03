'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestGachaPage() {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      const startTime = Date.now()
      const result = await testFunction()
      const endTime = Date.now()
      
      setTestResults(prev => [...prev, {
        name: testName,
        success: true,
        result,
        duration: endTime - startTime,
        timestamp: new Date().toLocaleTimeString()
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleTimeString()
      }])
    }
  }

  const testGachaMachinesTable = async () => {
    const { data, error } = await supabase
      .from('gacha_machines')
      .select('*')
      .limit(5)
    
    if (error) throw error
    return { count: data?.length || 0, sample: data?.[0] }
  }

  const testGachaItemsTable = async () => {
    const { data, error } = await supabase
      .from('gacha_items')
      .select('*')
      .limit(5)
    
    if (error) throw error
    return { count: data?.length || 0, sample: data?.[0] }
  }

  const testGachaPoolsTable = async () => {
    const { data, error } = await supabase
      .from('gacha_pools')
      .select('*')
      .limit(5)
    
    if (error) throw error
    return { count: data?.length || 0, sample: data?.[0] }
  }

  const testExecuteGachaFunction = async () => {
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase.rpc('execute_gacha_pull', {
      p_user_id: user.id,
      p_gacha_slug: 'forest-standard',
      p_pull_count: 1
    })
    
    if (error) throw error
    return data
  }

  const testGetUserPullsFunction = async () => {
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase.rpc('get_user_gacha_pulls_today', {
      p_user_id: user.id,
      p_gacha_slug: 'forest-standard'
    })
    
    if (error) throw error
    return data
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p className="text-gray-600">ログインが必要です</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="container mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ガチャシステム デバッグ</CardTitle>
            <CardDescription>
              データベーステーブルとRPC関数のテスト
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button onClick={() => runTest('gacha_machines テーブル', testGachaMachinesTable)}>
                マシンテーブル
              </Button>
              <Button onClick={() => runTest('gacha_items テーブル', testGachaItemsTable)}>
                アイテムテーブル
              </Button>
              <Button onClick={() => runTest('gacha_pools テーブル', testGachaPoolsTable)}>
                プールテーブル
              </Button>
              <Button onClick={() => runTest('get_user_gacha_pulls_today 関数', testGetUserPullsFunction)}>
                プル数取得関数
              </Button>
              <Button onClick={() => runTest('execute_gacha_pull 関数', testExecuteGachaFunction)}>
                ガチャ実行関数
              </Button>
              <Button onClick={clearResults} variant="outline">
                結果クリア
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>テスト結果</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500">テストを実行してください</p>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{result.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.success ? '成功' : '失敗'}
                        </span>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                    </div>
                    
                    {result.success ? (
                      <div className="text-sm">
                        {result.duration && <p>実行時間: {result.duration}ms</p>}
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        エラー: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}