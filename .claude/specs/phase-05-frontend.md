# Phase 5: 前端集成和实时更新 (Frontend Integration)

**负责 Agent**: API Agent (前端部分)
**预计时间**: 2-3 天
**依赖**: 阶段 2, 阶段 3, 阶段 4
**关联页面**: 所有页面

---

## 目标

将前端从 mock 数据迁移到真实 API，实现实时更新、错误处理和用户体验优化。

---

## 组件更新清单

| 组件 | 位置 | 关联页面 | 更改 |
|------|------|----------|------|
| AuthProvider | `/components/auth/auth-provider.tsx` | 全局 | 使用 Supabase Auth |
| InputSection | `/components/tool/input-section.tsx` | `/tools/product-insight` | 调用创建任务 API |
| AnalysisPage | `/app/analysis/[task_id]/page.tsx` | `/analysis/[task_id]` | 轮询任务状态 API |
| ReportPage | `/app/report/[report_id]/page.tsx` | `/report/[report_id]` | 从 API 获取报告和机会 |
| HistoryTable | `/components/account/history-table.tsx` | `/account` | 从 API 获取历史 |
| ExportButtons | `/components/report/export-buttons.tsx` | `/report/[report_id]` | 调用导出 API |
| LanguageSwitch | `/components/account/language-switch.tsx` | `/account` | 调用更新语言 API |

---

## 1. API 工具函数

创建文件 `/lib/api/client.ts`：

```typescript
/**
 * 通用 API 客户端
 */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
  }

  /**
   * GET 请求
   */
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(path, window.location.origin + this.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString())
    return this.handleResponse<T>(response)
  }

  /**
   * POST 请求
   */
  async post<T>(path: string, body?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  /**
   * PUT 请求
   */
  async put<T>(path: string, body?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  /**
   * DELETE 请求
   */
  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
    })
    return this.handleResponse<T>(response)
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')

    if (!response.ok) {
      const errorBody = contentType?.includes('application/json')
        ? await response.json()
        : { message: response.statusText }

      throw new ApiError(
        errorBody.error?.code || 'API_ERROR',
        errorBody.error?.message || 'An error occurred',
        errorBody.error?.details,
        response.status
      )
    }

    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>
    }

    return response.text() as unknown as Promise<T>
  }
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = new ApiClient()
```

---

## 2. 更新 InputSection 组件

更新文件 `/components/tool/input-section.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'AI productivity tools for freelancers',
  'AI-powered content creation platforms',
  'AI assistant for e-commerce sellers',
  'AI tools for remote teams',
  'AI for creative professionals',
  'AI for small business automation',
]

export function InputSection() {
  const router = useRouter()
  const { user, signInWithGoogle, loading: authLoading } = useAuth()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStartAnalysis = async () => {
    if (!input.trim()) return

    if (!user) {
      toast.info('Please sign in to start analysis')
      await signInWithGoogle()
      return
    }

    setLoading(true)

    try {
      const response = await api.post<{ task_id: string; report_id: string }>(
        '/tools/product-insight/tasks',
        { input_text: input }
      )

      toast.success('Analysis started!')

      // 跳转到分析进度页面
      router.push(`/analysis/${response.task_id}`)
    } catch (error) {
      if (error instanceof api.ApiError) {
        if (error.code === 'CONCURRENT_TASK_LIMIT') {
          toast.error('You already have an analysis running', {
            description: 'Please wait for it to complete',
            action: {
              label: 'Go to analysis',
              onClick: () => router.push(`/analysis/${error.details.task_id}`),
            },
          })
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Failed to start analysis')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleStartAnalysis(), 100)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Discover AI Product Opportunities
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Get 300 expert-level AI product ideas tailored to your direction
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartAnalysis()}
            placeholder="Enter a product direction (e.g., 'AI for freelancers')"
            className="h-14 pl-4 pr-32 text-lg"
            disabled={loading || authLoading}
          />
          <Button
            onClick={handleStartAnalysis}
            disabled={loading || authLoading || !input.trim()}
            className="absolute right-2 top-2 h-10"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 3. 更新 AnalysisPage 组件

更新文件 `/app/analysis/[task_id]/page.tsx`：

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api/client'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

// 分析阶段配置
const STAGES = [
  { key: 'understanding', label: 'Understanding', description: 'Analyzing your input' },
  { key: 'analyzing', label: 'Analyzing', description: 'Researching the market' },
  { key: 'scanning', label: 'Scanning', description: 'Scanning for signals' },
  { key: 'generating', label: 'Generating', description: 'Creating opportunities' },
  { key: 'scoring', label: 'Scoring', description: 'Evaluating opportunities' },
  { key: 'finalizing', label: 'Finalizing', description: 'Preparing your report' },
]

export default function AnalysisPage({ params }: { params: { task_id: string } }) {
  const router = useRouter()
  const taskId = params.task_id

  const [status, setStatus] = useState<'pending' | 'running' | 'completed' | 'failed'>('pending')
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [stagesCompleted, setStagesCompleted] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 轮询任务状态
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await api.get<{
          status: string
          current_stage: string
          stages_completed: string[]
          report_status: string
        }>(`/tasks/${taskId}`)

        setStatus(data.status)
        setCurrentStageIndex(STAGES.findIndex(s => s.key === data.current_stage))
        setStagesCompleted(data.stages_completed)

        // 任务完成，跳转到报告页面
        if (data.status === 'completed' && data.report_status === 'completed') {
          clearInterval(pollInterval)
          router.replace(`/report/${taskId}`)
        }

        // 任务失败
        if (data.status === 'failed' || data.report_status === 'failed') {
          clearInterval(pollInterval)
          setError('Analysis failed. Please try again.')
        }
      } catch (err) {
        if (err instanceof ApiError && err.status !== 404) {
          console.error('Poll error:', err)
        }
      }
    }, 2000) // 每 2 秒轮询一次

    return () => clearInterval(pollInterval)
  }, [taskId, router])

  // 计算进度百分比
  const progressPercentage = Math.round(
    ((currentStageIndex + (status === 'completed' ? 1 : 0)) / STAGES.length) * 100
  )

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Analysis Failed</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/tools/product-insight')}
            className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Analyzing Your Idea</h1>
        <p className="mt-2 text-muted-foreground">
          This usually takes 30 seconds to 5 minutes
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />

          <div className="space-y-4">
            {STAGES.map((stage, index) => {
              const isCompleted = stagesCompleted.includes(stage.key)
              const isCurrent = stage.key === STAGES[currentStageIndex]?.key
              const isPending = index > currentStageIndex

              return (
                <div
                  key={stage.key}
                  className={`flex items-start gap-4 ${isPending ? 'opacity-50' : ''}`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
```

---

## 4. 更新 ReportPage 组件

更新文件 `/app/report/[report_id]/page.tsx`：

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api/client'
import type { Opportunity } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExportButtons } from '@/components/report/export-buttons'
import { Loader2, ChevronLeft, ChevronRight, Trophy, TrendingUp, Zap } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_SIZE = 20

export default function ReportPage({ params }: { params: { report_id: string } }) {
  const router = useRouter()
  const reportId = params.report_id

  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('final_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // 加载报告数据
  useEffect(() => {
    loadReport()
  }, [reportId])

  // 加载机会列表
  useEffect(() => {
    loadOpportunities()
  }, [page, sortBy, sortOrder, categoryFilter])

  async function loadReport() {
    try {
      setLoading(true)
      const data = await api.get(`/reports/${reportId}`)
      setReport(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        toast.error('Report not found')
        router.push('/account')
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadOpportunities() {
    try {
      const response = await api.get<{
        data: Opportunity[]
        meta: { pagination: { total_pages: number } }
      }>(`/reports/${reportId}/opportunities`, {
        page,
        size: PAGE_SIZE,
        sort_by: sortBy,
        sort_order: sortOrder,
        category: categoryFilter || undefined,
      })

      setOpportunities(response.data)
      setTotalPages(response.meta.pagination.total_pages)
    } catch (error) {
      console.error('Failed to load opportunities:', error)
    }
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      await api.delete(`/reports/${reportId}`)
      toast.success('Report deleted')
      router.push('/account')
    } catch (error) {
      toast.error('Failed to delete report')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!report) return null

  const premiumCount = Math.round(report.premium_ratio * report.total_opportunities)

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="mt-4 text-3xl font-bold">Product Insight Report</h1>
          <p className="mt-2 text-muted-foreground">{report.input_text}</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons reportId={reportId} />
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{report.total_opportunities}</p>
              <p className="text-sm text-muted-foreground">Total Opportunities</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{premiumCount}</p>
              <p className="text-sm text-muted-foreground">Premium Opportunities</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(report.analysis_time_sec / 60)}m</p>
              <p className="text-sm text-muted-foreground">Analysis Time</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 专家摘要 */}
      {report.summary_text && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Expert Summary</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {report.summary_text}
          </p>
        </Card>
      )}

      {/* 筛选和排序 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Filter by category..."
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="final_score">Final Score</SelectItem>
              <SelectItem value="monetization_score">Monetization</SelectItem>
              <SelectItem value="industry_size_score">Market Size</SelectItem>
              <SelectItem value="index_number">Index</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value: any) => { setSortOrder(value); setPage(1); }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 机会列表 */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('monetization_score')}>
                Monetization {sortBy === 'monetization_score' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('final_score')}>
                Score {sortBy === 'final_score' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Signals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono text-sm">{opp.index_number}</TableCell>
                <TableCell className="font-medium">{opp.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{opp.category || '-'}</Badge>
                </TableCell>
                <TableCell>{opp.monetization_score}</TableCell>
                <TableCell>
                  <Badge variant={opp.final_score > 80 ? 'default' : 'secondary'}>
                    {opp.final_score}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{opp.signal_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 分页 */}
        <div className="flex items-center justify-between border-t p-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

---

## 5. 更新 HistoryTable 组件

更新文件 `/components/account/history-table.tsx`：

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { api, ApiError } from '@/lib/api/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '@/lib/utils'

interface Report {
  id: string
  input_text: string
  status: string
  total_opportunities: number
  premium_ratio: number
  created_at: string
}

export function HistoryTable() {
  const router = useRouter()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  const PAGE_SIZE = 20

  useEffect(() => {
    if (user) loadReports()
  }, [user, page])

  async function loadReports() {
    try {
      setLoading(true)
      const response = await api.get<{
        data: Report[]
        meta: { pagination: { total_pages: number } }
      }>('/reports', { page, size: PAGE_SIZE })

      setReports(response.data)
      setTotalPages(response.meta.pagination.total_pages)
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(reportId: string) {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      setDeleting(reportId)
      await api.delete(`/reports/${reportId}`)
      toast.success('Report deleted')
      loadReports()
    } catch (error) {
      toast.error('Failed to delete report')
    } finally {
      setDeleting(null)
    }
  }

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Please sign in to view your history</p>
      </Card>
    )
  }

  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No reports yet</p>
        <Button
          onClick={() => router.push('/tools/product-insight')}
          className="mt-4"
        >
          Start Your First Analysis
        </Button>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Input</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Opportunities</TableHead>
            <TableHead>Premium</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="max-w-[200px] truncate font-medium">
                {report.input_text}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    report.status === 'completed'
                      ? 'default'
                      : report.status === 'generating'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {report.status}
                </Badge>
              </TableCell>
              <TableCell>{report.total_opportunities}</TableCell>
              <TableCell>
                {Math.round(report.premium_ratio * 100)}%
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(report.created_at))}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/report/${report.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(report.id)}
                    disabled={deleting === report.id}
                  >
                    {deleting === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t p-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
```

---

## 6. 更新 LanguageSwitch 组件

更新文件 `/components/account/language-switch.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { api } from '@/lib/api/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
]

export function LanguageSwitch() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)

  const currentLanguage = user?.language || 'en'

  async function handleLanguageChange(code: string) {
    if (code === currentLanguage) return

    setLoading(true)
    try {
      await api.put('/users/language', { language: code })
      toast.success('Language updated')
      // 刷新页面以应用新语言
      window.location.reload()
    } catch (error) {
      toast.error('Failed to update language')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Language:</span>
      <Select
        value={currentLanguage}
        onValueChange={handleLanguageChange}
        disabled={authLoading || loading}
      >
        <SelectTrigger className="w-[150px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

---

## 验收标准

- [ ] 所有页面使用真实 API 数据
- [ ] 实时更新分析进度（轮询）
- [ ] 分页功能正常
- [ ] 错误处理完善（用户友好的错误提示）
- [ ] 用户体验无退化
- [ ] 未认证用户正确引导登录
- [ ] 并发任务限制正确处理
- [ ] 删除操作正确执行
- [ ] 语言切换正常工作

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `/lib/api/client.ts` | API 客户端 |
| `/components/tool/input-section.tsx` | 输入区域组件 |
| `/app/analysis/[task_id]/page.tsx` | 分析进度页面 |
| `/app/report/[report_id]/page.tsx` | 报告页面 |
| `/components/account/history-table.tsx` | 历史表格组件 |
| `/components/account/language-switch.tsx` | 语言切换组件 |

---

## 下一步

完成此阶段后，进入 **阶段 6: 导出功能**。
