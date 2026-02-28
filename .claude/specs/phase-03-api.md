# Phase 3: API 路由实现 (API Implementation)

**负责 Agent**: API Agent
**预计时间**: 3-4 天
**依赖**: 阶段 1, 阶段 2
**关联页面**: 所有页面（后端支持）

---

## 目标

实现所有后端 API 路由，包括任务管理、报告查询、机会列表、导出功能和用户管理。

---

## API 路由清单

| 方法 | 路径 | 功能 | 关联页面 |
|------|------|------|----------|
| POST | `/api/v1/tools/product-insight/tasks` | 创建分析任务 | `/tools/product-insight` |
| GET | `/api/v1/tasks/[task_id]` | 获取任务状态 | `/analysis/[task_id]` |
| GET | `/api/v1/reports/[report_id]` | 获取报告 | `/report/[report_id]` |
| GET | `/api/v1/reports` | 获取用户历史 | `/account` |
| GET | `/api/v1/reports/[report_id]/opportunities` | 获取机会列表（分页） | `/report/[report_id]` |
| DELETE | `/api/v1/reports/[report_id]` | 删除报告（软删除） | `/report/[report_id]`, `/account` |
| PUT | `/api/v1/users/language` | 更新用户语言 | `/account` |
| POST | `/api/v1/reports/[report_id]/export/pdf` | 导出 PDF | `/report/[report_id]` |
| POST | `/api/v1/reports/[report_id]/export/gdocs` | 导出 Google Docs | `/report/[report_id]` |

---

## 通用响应格式

### 成功响应
```json
{
  "data": { ... },
  "meta": { ... }
}
```

### 错误响应
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

### 错误代码
| 代码 | 说明 | HTTP 状态 |
|------|------|-----------|
| UNAUTHORIZED | 未认证 | 401 |
| FORBIDDEN | 无权限 | 403 |
| NOT_FOUND | 资源不存在 | 404 |
| VALIDATION_ERROR | 输入验证失败 | 400 |
| CONCURRENT_TASK_LIMIT | 并发任务限制 | 429 |
| INTERNAL_ERROR | 内部错误 | 500 |

---

## API 路由实现

### 1. 创建任务 API

**路径**: `/app/api/v1/tools/product-insight/tasks/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// 验证 schema - 增强版输入验证
const CreateTaskSchema = z.object({
  input_text: z.string()
    .min(10, 'Input text must be at least 10 characters')
    .max(500, 'Input text must be less than 500 characters')
    .refine(
      (value) => value.trim().length > 5,
      'Please enter meaningful text (at least 5 non-whitespace characters)'
    )
    .refine(
      (value) => !/^\d+$/.test(value.trim()),
      'Input cannot be just numbers. Please describe a product direction or idea.'
    )
    .refine(
      (value) => {
        const trimmed = value.trim()
        const specialChars = /[<>{}|\\^`]/g
        return !specialChars.test(trimmed) || trimmed.replace(specialChars, '').length > trimmed.length * 0.5
      },
      'Input contains too many special characters. Please use plain text.'
    ),
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validation = CreateTaskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { input_text } = validation.data

    // 额外的内容有效性验证
    const trimmedInput = input_text.trim()

    // 检查是否为空或只有空格
    if (!trimmedInput || trimmedInput.length < 5) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please enter meaningful content (at least 5 characters)',
          },
        },
        { status: 400 }
      )
    }

    // 检查是否包含敏感词（示例）
    const forbiddenWords = ['xxx', 'porn', 'illegal', 'hack']
    const hasForbiddenWord = forbiddenWords.some(word =>
      trimmedInput.toLowerCase().includes(word)
    )

    if (hasForbiddenWord) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input contains inappropriate content',
          },
        },
        { status: 400 }
      )
    }

    // 检查用户输入是否与最近提交的内容重复（防刷）
    // 这个检查在数据库中执行

    // 检查并发任务限制
    const { data: runningTask } = await supabase
      .from('tasks')
      .select('id, report_id')
      .eq('user_id', user.id)
      .eq('status', 'running')
      .single()

    if (runningTask) {
      return NextResponse.json(
        {
          error: {
            code: 'CONCURRENT_TASK_LIMIT',
            message: 'You already have an analysis running',
            details: {
              task_id: runningTask.id,
              report_id: runningTask.report_id,
            },
          },
        },
        { status: 429 }
      )
    }

    // 创建报告
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        input_text,
        status: 'generating',
      })
      .select()
      .single()

    if (reportError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create report' } },
        { status: 500 }
      )
    }

    // 创建任务
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        report_id: report.id,
        status: 'pending',
        current_stage: 'understanding',
      })
      .select()
      .single()

    if (taskError) {
      // 回滚报告
      await supabase.from('reports').delete().eq('id', report.id)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create task' } },
        { status: 500 }
      )
    }

    // TODO: 添加到队列（阶段 4）
    // await analysisQueue.add('analyze', { ... })

    return NextResponse.json({
      data: {
        task_id: task.id,
        report_id: report.id,
        status: task.status,
      },
    })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 2. 获取任务状态 API

**路径**: `/app/api/v1/tasks/[task_id]/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { task_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const taskId = params.task_id

    // 获取任务
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (error || !task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      )
    }

    // 获取关联报告状态
    const { data: report } = await supabase
      .from('reports')
      .select('status')
      .eq('id', task.report_id)
      .single()

    return NextResponse.json({
      data: {
        task_id: task.id,
        report_id: task.report_id,
        status: task.status,
        current_stage: task.current_stage,
        stages_completed: task.stages_completed || [],
        report_status: report?.status,
        created_at: task.created_at,
        updated_at: task.updated_at,
      },
    })
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 3. 获取报告 API

**路径**: `/app/api/v1/reports/[report_id]/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { report_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const reportId = params.report_id

    // 获取报告
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single()

    if (error || !report) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      )
    }

    // 获取机会统计
    const { count } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId)

    // 获取优质机会数量
    const { count: premiumCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId)
      .gt('final_score', 80)

    return NextResponse.json({
      data: {
        id: report.id,
        input_text: report.input_text,
        status: report.status,
        analysis_time_sec: report.analysis_time_sec,
        total_opportunities: count || 0,
        premium_ratio: report.premium_ratio,
        premium_count: premiumCount || 0,
        summary_text: report.summary_text,
        created_at: report.created_at,
      },
    })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { report_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const reportId = params.report_id

    // 软删除报告
    const { data, error } = await supabase
      .from('reports')
      .update({ is_deleted: true })
      .eq('id', reportId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 4. 获取用户历史 API

**路径**: `/app/api/v1/reports/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20')))
    const includeDeleted = searchParams.get('include_deleted') === 'true'

    // 计算分页
    const from = (page - 1) * size
    const to = from + size - 1

    // 构建查询
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    // 分页查询
    query.range(from, to)

    const { data: reports, count, error } = await query

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reports' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: reports || [],
      meta: {
        pagination: {
          page,
          size,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / size),
        },
      },
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 5. 获取机会列表 API（分页）

**路径**: `/app/api/v1/reports/[report_id]/opportunities/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { report_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // 验证报告所有权
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, user_id')
      .eq('id', params.report_id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      )
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20')))
    const sortBy = searchParams.get('sort_by') || 'final_score'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const category = searchParams.get('category')

    // 计算分页
    const from = (page - 1) * size
    const to = from + size - 1

    // 构建查询
    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .eq('report_id', params.report_id)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    if (category) {
      query = query.eq('category', category)
    }

    // 分页查询
    query.range(from, to)

    const { data: opportunities, count, error } = await query

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch opportunities' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: opportunities || [],
      meta: {
        pagination: {
          page,
          size,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / size),
        },
      },
    })
  } catch (error) {
    console.error('Get opportunities error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 6. 更新用户语言 API

**路径**: `/app/api/v1/users/language/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// 验证 schema
const UpdateLanguageSchema = z.object({
  language: z.enum(['en', 'zh', 'de', 'fr', 'it', 'es', 'pt']),
})

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validation = UpdateLanguageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid language code',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { language } = validation.data

    // 更新用户语言
    const { data, error } = await supabase
      .from('users')
      .update({ language })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update language' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        id: data.id,
        email: data.email,
        language: data.language,
      },
    })
  } catch (error) {
    console.error('Update language error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 7. 导出 PDF API

**路径**: `/app/api/v1/reports/[report_id]/export/pdf/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { report_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // TODO: 实现导出逻辑（阶段 6）
    // const pdfBuffer = await generatePDF(reportId)

    return NextResponse.json(
      {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'PDF export is not yet implemented',
        },
      },
      { status: 501 }
    )
  } catch (error) {
    console.error('Export PDF error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 8. 导出 Google Docs API

**路径**: `/app/api/v1/reports/[report_id]/export/gdocs/route.ts`

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { report_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 验证用户认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // TODO: 实现导出逻辑（阶段 6）
    // const docUrl = await exportToGDocs(reportId)

    return NextResponse.json(
      {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Google Docs export is not yet implemented',
        },
      },
      { status: 501 }
    )
  } catch (error) {
    console.error('Export GDocs error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

## 验证 Schemas

创建文件 `/lib/validation/schemas.ts`：

```typescript
import { z } from 'zod'

// 创建任务
export const CreateTaskSchema = z.object({
  input_text: z.string().min(1, 'Input text is required').max(500),
})

// 任务状态类型
export const TaskStatusSchema = z.enum(['pending', 'running', 'completed', 'failed'])

// 分析阶段类型
export const AnalysisStageSchema = z.enum([
  'understanding',
  'analyzing',
  'scanning',
  'generating',
  'scoring',
  'finalizing',
])

// 报告状态类型
export const ReportStatusSchema = z.enum(['generating', 'completed', 'failed', 'deleted'])

// 语言类型
export const LanguageSchema = z.enum(['en', 'zh', 'de', 'fr', 'it', 'es', 'pt'])

// 更新用户
export const UpdateUserSchema = z.object({
  language: LanguageSchema,
})

// 分页参数
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(20),
})

// 机会排序
export const OpportunitySortSchema = z.object({
  sort_by: z.enum(['final_score', 'index_number', 'monetization_score']).default('final_score'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
})

// 导出格式
export const ExportFormatSchema = z.enum(['pdf', 'gdocs'])

// 机会数据
export const OpportunitySchema = z.object({
  index_number: z.number(),
  name: z.string(),
  core_users: z.string(),
  pain_points: z.string(),
  user_demands: z.string(),
  ai_solution: z.string(),
  category: z.string().optional(),
  inspiration_source: z.string().optional(),
  signal_count: z.number().min(0),
  monetization_score: z.number().min(0).max(100),
  industry_size_score: z.number().min(0).max(100),
  competition_score: z.number().min(0).max(100),
  mvp_difficulty_score: z.number().min(0).max(100),
  final_score: z.number().min(0).max(100),
})
```

---

## 验收标准

- [ ] 所有 API 路由正常响应（HTTP 状态码正确）
- [ ] 输入验证正确（Zod schemas）
- [ ] 错误处理完善（统一错误格式）
- [ ] 并发控制生效（每用户最多 1 个运行任务）
- [ ] 分页功能正常（page, size 参数）
- [ ] RLS 策略生效（用户只能访问自己的数据）
- [ ] 未认证用户返回 401
- [ ] 无权限资源返回 403/404

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `/app/api/v1/tools/product-insight/tasks/route.ts` | 创建任务 |
| `/app/api/v1/tasks/[task_id]/route.ts` | 获取任务状态 |
| `/app/api/v1/reports/route.ts` | 获取用户历史 |
| `/app/api/v1/reports/[report_id]/route.ts` | 获取/删除报告 |
| `/app/api/v1/reports/[report_id]/opportunities/route.ts` | 获取机会列表 |
| `/app/api/v1/users/language/route.ts` | 更新用户语言 |
| `/app/api/v1/reports/[report_id]/export/pdf/route.ts` | 导出 PDF |
| `/app/api/v1/reports/[report_id]/export/gdocs/route.ts` | 导出 Google Docs |
| `/lib/validation/schemas.ts` | Zod 验证 schemas |

---

## 下一步

完成此阶段后，进入 **阶段 4: AI 模型集成**。
