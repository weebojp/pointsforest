'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { formatPoints } from '@/lib/utils'
import { FileText, Plus, Edit, TrendingUp, Target, Clock, CheckCircle, Users, Trophy } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QuestTemplate {
  id: string
  name: string
  description: string
  type: 'daily' | 'weekly' | 'achievement' | 'challenge'
  category: 'login' | 'game' | 'points' | 'social'
  requirements: any
  rewards: any
  duration_hours: number
  max_completions: number
  is_active: boolean
  created_at: string
}

interface UserQuest {
  id: string
  user_id: string
  template_id: string
  progress: any
  is_completed: boolean
  completed_at?: string
  expires_at: string
  created_at: string
  users: {
    username: string
    email: string
  }
  quest_templates: {
    name: string
    type: string
    category: string
  }
}

interface QuestCompletion {
  id: string
  user_id: string
  quest_id: string
  rewards_claimed: any
  completed_at: string
  users: {
    username: string
    email: string
  }
  user_quests: {
    quest_templates: {
      name: string
      type: string
    }
  }
}

interface QuestStats {
  total_active_quests: number
  total_completions: number
  completion_rate: number
  most_popular_quest: string
  total_rewards_distributed: number
  daily_completions: number
  weekly_completions: number
  monthly_completions: number
}

export default function QuestsManagementPage() {
  const { admin, loading } = useAdminAuth()
  const [templates, setTemplates] = useState<QuestTemplate[]>([])
  const [userQuests, setUserQuests] = useState<UserQuest[]>([])
  const [completions, setCompletions] = useState<QuestCompletion[]>([])
  const [stats, setStats] = useState<QuestStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    if (admin && !loading) {
      fetchData()
    }
  }, [admin, loading])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchTemplates(),
        fetchUserQuests(),
        fetchCompletions(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('quest_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return
    }

    setTemplates(data || [])
  }

  const fetchUserQuests = async () => {
    const { data, error } = await supabase
      .from('user_quests')
      .select(`
        *,
        users!inner(username, email),
        quest_templates!inner(name, type, category)
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Error fetching user quests:', error)
      return
    }

    setUserQuests(data || [])
  }

  const fetchCompletions = async () => {
    const { data, error } = await supabase
      .from('quest_completions')
      .select(`
        *,
        users!inner(username, email),
        user_quests!inner(
          quest_templates!inner(name, type)
        )
      `)
      .order('completed_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Error fetching completions:', error)
      return
    }

    setCompletions(data || [])
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_quest_stats')
      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // フォールバック: 基本的な統計を計算
      const activeQuests = userQuests.filter(q => !q.is_completed).length
      const totalCompletions = completions.length
      const completionRate = userQuests.length > 0 ? (totalCompletions / userQuests.length) * 100 : 0
      
      setStats({
        total_active_quests: activeQuests,
        total_completions: totalCompletions,
        completion_rate: completionRate,
        most_popular_quest: templates[0]?.name || 'N/A',
        total_rewards_distributed: 0,
        daily_completions: 0,
        weekly_completions: 0,
        monthly_completions: 0
      })
    }
  }

  const handleTemplateToggle = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('quest_templates')
        .update({ is_active: isActive })
        .eq('id', templateId)

      if (error) throw error

      toast.success(`クエストを${isActive ? '有効' : '無効'}にしました`)
      fetchTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('クエストの更新に失敗しました')
    }
  }

  const handleTemplateUpdate = async () => {
    if (!selectedTemplate) return

    try {
      const { error } = await supabase
        .from('quest_templates')
        .update({
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          type: selectedTemplate.type,
          category: selectedTemplate.category,
          requirements: selectedTemplate.requirements,
          rewards: selectedTemplate.rewards,
          duration_hours: selectedTemplate.duration_hours,
          max_completions: selectedTemplate.max_completions,
          is_active: selectedTemplate.is_active
        })
        .eq('id', selectedTemplate.id)

      if (error) throw error

      toast.success('クエストテンプレートが更新されました')
      setIsEditOpen(false)
      setSelectedTemplate(null)
      fetchTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('クエストテンプレートの更新に失敗しました')
    }
  }

  const getQuestTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'デイリー'
      case 'weekly': return 'ウィークリー'
      case 'achievement': return 'アチーブメント'
      case 'challenge': return 'チャレンジ'
      default: return type
    }
  }

  const getQuestCategoryLabel = (category: string) => {
    switch (category) {
      case 'login': return 'ログイン'
      case 'game': return 'ゲーム'
      case 'points': return 'ポイント'
      case 'social': return 'ソーシャル'
      default: return category
    }
  }

  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800'
      case 'weekly': return 'bg-green-100 text-green-800'
      case 'achievement': return 'bg-purple-100 text-purple-800'
      case 'challenge': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const paginatedUserQuests = userQuests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(userQuests.length / itemsPerPage)

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">クエスト管理</h1>
          <p className="text-muted-foreground mt-1">クエストシステムの管理と統計</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          クエスト作成
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="templates">テンプレート</TabsTrigger>
          <TabsTrigger value="active">アクティブクエスト</TabsTrigger>
          <TabsTrigger value="completions">完了履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">アクティブクエスト</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_active_quests.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総完了数</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_completions.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完了率</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.completion_rate || 0).toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総報酬</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPoints(stats?.total_rewards_distributed || 0)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>クエストタイプ別統計</CardTitle>
              <CardDescription>各クエストタイプのパフォーマンス</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['daily', 'weekly', 'achievement', 'challenge'].map((type) => {
                  const typeTemplates = templates.filter(t => t.type === type)
                  const typeQuests = userQuests.filter(q => q.quest_templates.type === type)
                  const typeCompletions = completions.filter(c => c.user_quests.quest_templates.type === type)
                  const completionRate = typeQuests.length > 0 ? (typeCompletions.length / typeQuests.length) * 100 : 0
                  
                  return (
                    <div key={type} className="text-center p-4 border rounded">
                      <Badge className={getQuestTypeColor(type)}>
                        {getQuestTypeLabel(type)}
                      </Badge>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-muted-foreground">テンプレート: {typeTemplates.length}</div>
                        <div className="text-sm text-muted-foreground">アクティブ: {typeQuests.length}</div>
                        <div className="text-sm text-muted-foreground">完了率: {completionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>クエストテンプレート</CardTitle>
              <CardDescription>クエストのテンプレートを管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>クエスト名</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>有効時間</TableHead>
                    <TableHead>最大完了回数</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge className={getQuestTypeColor(template.type)}>
                          {getQuestTypeLabel(template.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getQuestCategoryLabel(template.category)}</TableCell>
                      <TableCell>{template.duration_hours}h</TableCell>
                      <TableCell>
                        {template.max_completions === -1 ? '無制限' : template.max_completions}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={(checked) => handleTemplateToggle(template.id, checked)}
                          />
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? '有効' : '無効'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template)
                            setIsEditOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>アクティブクエスト</CardTitle>
              <CardDescription>
                {userQuests.length} 件のユーザークエスト（{totalPages} ページ中 {currentPage} ページ）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>クエスト</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>進捗</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>期限</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUserQuests.map((quest) => (
                    <TableRow key={quest.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quest.users.username}</div>
                          <div className="text-sm text-muted-foreground">{quest.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{quest.quest_templates.name}</TableCell>
                      <TableCell>
                        <Badge className={getQuestTypeColor(quest.quest_templates.type)}>
                          {getQuestTypeLabel(quest.quest_templates.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {JSON.stringify(quest.progress)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quest.is_completed ? 'default' : 'secondary'}>
                          {quest.is_completed ? '完了' : '進行中'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(quest.expires_at).toLocaleString('ja-JP')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    前のページ
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    次のページ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>完了履歴</CardTitle>
              <CardDescription>クエストの完了履歴</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>完了日時</TableHead>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>クエスト</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>獲得報酬</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completions.map((completion) => (
                    <TableRow key={completion.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(completion.completed_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{completion.users.username}</div>
                          <div className="text-sm text-muted-foreground">{completion.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {completion.user_quests.quest_templates.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={getQuestTypeColor(completion.user_quests.quest_templates.type)}>
                          {getQuestTypeLabel(completion.user_quests.quest_templates.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {JSON.stringify(completion.rewards_claimed)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>クエストテンプレート編集</DialogTitle>
            <DialogDescription>
              クエストテンプレートの設定を変更します。
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>クエスト名</Label>
                  <Input
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>有効時間（時間）</Label>
                  <Input
                    type="number"
                    value={selectedTemplate.duration_hours}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, duration_hours: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label>説明</Label>
                <Textarea
                  value={selectedTemplate.description}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>タイプ</Label>
                  <Select
                    value={selectedTemplate.type}
                    onValueChange={(value: 'daily' | 'weekly' | 'achievement' | 'challenge') => 
                      setSelectedTemplate({...selectedTemplate, type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">デイリー</SelectItem>
                      <SelectItem value="weekly">ウィークリー</SelectItem>
                      <SelectItem value="achievement">アチーブメント</SelectItem>
                      <SelectItem value="challenge">チャレンジ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>カテゴリ</Label>
                  <Select
                    value={selectedTemplate.category}
                    onValueChange={(value: 'login' | 'game' | 'points' | 'social') => 
                      setSelectedTemplate({...selectedTemplate, category: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="login">ログイン</SelectItem>
                      <SelectItem value="game">ゲーム</SelectItem>
                      <SelectItem value="points">ポイント</SelectItem>
                      <SelectItem value="social">ソーシャル</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>最大完了回数</Label>
                <Input
                  type="number"
                  value={selectedTemplate.max_completions}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, max_completions: parseInt(e.target.value) || -1})}
                  placeholder="-1 で無制限"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedTemplate.is_active}
                  onCheckedChange={(checked) => setSelectedTemplate({...selectedTemplate, is_active: checked})}
                />
                <Label>クエストを有効にする</Label>
              </div>
              <Button onClick={handleTemplateUpdate} className="w-full">
                設定を更新
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}