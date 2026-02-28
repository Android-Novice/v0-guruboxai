# Phase 1: Supabase 数据库集成 (Supabase Database)

**负责 Agent**: Database Agent
**预计时间**: 1-2 天
**依赖**: 阶段 0
**关联页面**: 所有页面（数据持久化）

---

## 目标

建立 Supabase 数据库 Schema，实现数据持久化，配置 RLS 策略确保数据安全。

---

## 实现功能

### 1. 创建 Supabase 客户端

创建文件 `/lib/supabase.ts`：

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase-types'

// 客户端 Supabase 实例（用于客户端组件）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 服务端 Supabase 实例（使用 service role key，绕过 RLS）
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

// 类型导出
export type { Database }
export type { SupabaseClient } from '@supabase/supabase-js'
```

---

### 2. 创建数据库迁移

创建文件 `/supabase/migrations/001_initial_schema.sql`：

```sql
-- ========================================
-- 1. Users 表（扩展 Supabase Auth）
-- ========================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. Reports 表
-- ========================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  status TEXT DEFAULT 'generating',
  analysis_time_sec INTEGER DEFAULT 0,
  total_opportunities INTEGER DEFAULT 300,
  premium_ratio NUMERIC(5, 2) DEFAULT 0,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- ========================================
-- 3. Tasks 表
-- ========================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL UNIQUE REFERENCES public.reports(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  current_stage TEXT DEFAULT 'understanding',
  stages_completed TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. Opportunities 表
-- ========================================

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  index_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  core_users TEXT NOT NULL,
  pain_points TEXT NOT NULL,
  user_demands TEXT NOT NULL,
  ai_solution TEXT NOT NULL,
  category TEXT,
  inspiration_source TEXT,
  signal_count INTEGER DEFAULT 0,
  monetization_score INTEGER DEFAULT 0 CHECK (monetization_score >= 0 AND monetization_score <= 100),
  industry_size_score INTEGER DEFAULT 0 CHECK (industry_size_score >= 0 AND industry_size_score <= 100),
  competition_score INTEGER DEFAULT 0 CHECK (competition_score >= 0 AND competition_score <= 100),
  mvp_difficulty_score INTEGER DEFAULT 0 CHECK (mvp_difficulty_score >= 0 AND mvp_difficulty_score <= 100),
  final_score INTEGER DEFAULT 0 CHECK (final_score >= 0 AND final_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. 索引创建（优化查询性能）
-- ========================================

-- Users 表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Reports 表索引
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON public.reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_deleted ON public.reports(is_deleted);

-- Tasks 表索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_report_id ON public.tasks(report_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);

-- Opportunities 表索引
CREATE INDEX IF NOT EXISTS idx_opportunities_report_id ON public.opportunities(report_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_final_score ON public.opportunities(report_id, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_index ON public.opportunities(report_id, index_number);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON public.opportunities(report_id, category);

-- ========================================
-- 6. RLS (Row Level Security) 策略
-- ========================================

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Users 表 RLS 策略
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Reports 表 RLS 策略
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks 表 RLS 策略
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Opportunities 表 RLS 策略（通过 report_id 级联权限）
CREATE POLICY "Users can view own opportunities" ON public.opportunities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = opportunities.report_id AND reports.user_id = auth.uid()
    )
  );

-- ========================================
-- 7. 触发器（自动更新 updated_at）
-- ========================================

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users 表触发器
CREATE TRIGGER handle_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tasks 表触发器
CREATE TRIGGER handle_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- 8. 创建数据库视图（用于常用查询）
-- ========================================

-- 报告摘要视图
CREATE OR REPLACE VIEW public.reports_summary AS
SELECT
  r.id,
  r.user_id,
  r.input_text,
  r.status,
  r.analysis_time_sec,
  r.total_opportunities,
  r.premium_ratio,
  r.created_at,
  COUNT(o.id) AS actual_opportunity_count
FROM public.reports r
LEFT JOIN public.opportunities o ON o.report_id = r.id
WHERE r.is_deleted = FALSE
GROUP BY r.id;

-- 用户统计视图
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  u.id,
  u.email,
  u.language,
  COUNT(DISTINCT r.id) AS total_reports,
  COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) AS completed_reports,
  SUM(r.total_opportunities) AS total_opportunities
FROM public.users u
LEFT JOIN public.reports r ON r.user_id = u.id AND r.is_deleted = FALSE
GROUP BY u.id;

-- ========================================
-- 9. 注释
-- ========================================

COMMENT ON TABLE public.users IS '用户扩展信息表（与 Supabase Auth 关联）';
COMMENT ON TABLE public.reports IS '分析报告表';
COMMENT ON TABLE public.tasks IS '任务表（跟踪分析进度）';
COMMENT ON TABLE public.opportunities IS '机会数据表（每份报告 300 条）';

COMMENT ON COLUMN public.opportunities.final_score IS '最终得分（0-100），优质机会 > 80';
COMMENT ON COLUMN public.opportunities.signal_count IS '信号来源数量，至少 3 个';
```

---

### 3. 运行迁移

#### 方式 A: 使用 Supabase CLI（推荐）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 链接到远程项目
supabase link --project-ref YOUR_PROJECT_REF

# 运行迁移
supabase db push
```

#### 方式 B: 使用 Supabase Dashboard

1. 访问 Supabase Dashboard
2. SQL Editor → New Query
3. 复制并粘贴 `001_initial_schema.sql` 内容
4. 点击 Run

---

### 4. 生成 TypeScript 类型

```bash
# 生成类型文件
supabase gen types typescript --linked > lib/supabase-types.ts
```

生成的类型文件将包含：

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar?: string | null
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar?: string | null
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          input_text: string
          status: string
          analysis_time_sec: number
          total_opportunities: number
          premium_ratio: number
          summary_text: string | null
          created_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          user_id: string
          input_text: string
          status?: string
          analysis_time_sec?: number
          total_opportunities?: number
          premium_ratio?: number
          summary_text?: string | null
          created_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          input_text?: string
          status?: string
          analysis_time_sec?: number
          total_opportunities?: number
          premium_ratio?: number
          summary_text?: string | null
          created_at?: string
          is_deleted?: boolean
        }
      }
      // ... other tables
    }
    Views: {
      reports_summary: { ... }
      user_stats: { ... }
    }
    Functions: {
      handle_updated_at: { ... }
    }
    Enums: { }
  }
}
```

---

### 5. 创建数据库工具函数

创建文件 `/lib/supabase/user.ts`：

```typescript
import { supabase, supabaseAdmin } from './supabase'
import type { Database } from './supabase-types'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  return { user: data, error }
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  return { user: data, error }
}

export async function upsertUser(user: UserInsert) {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  return { user: data, error }
}

export async function updateUser(id: string, updates: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { user: data, error }
}
```

创建文件 `/lib/supabase/report.ts`：

```typescript
import { supabase, supabaseAdmin } from './supabase'
import type { Database } from './supabase-types'

type Report = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']
type ReportUpdate = Database['public']['Tables']['reports']['Update']

export async function getReportById(id: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  return { report: data, error }
}

export async function getUserReports(
  userId: string,
  options: { page?: number; size?: number; includeDeleted?: boolean } = {}
) {
  const { page = 1, size = 20, includeDeleted = false } = options

  const query = supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!includeDeleted) {
    query.eq('is_deleted', false)
  }

  // 分页
  const from = (page - 1) * size
  const to = from + size - 1
  query.range(from, to)

  // 获取总数
  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .match(includeDeleted ? {} : { is_deleted: false })

  const { data, error } = await query

  return {
    reports: data || [],
    pagination: {
      page,
      size,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / size),
    },
    error,
  }
}

export async function createReport(report: ReportInsert) {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert(report)
    .select()
    .single()

  return { report: data, error }
}

export async function updateReport(id: string, updates: ReportUpdate) {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { report: data, error }
}

export async function softDeleteReport(id: string) {
  const { data, error } = await supabase
    .from('reports')
    .update({ is_deleted: true })
    .eq('id', id)
    .select()
    .single()

  return { report: data, error }
}
```

创建文件 `/lib/supabase/task.ts`：

```typescript
import { supabase, supabaseAdmin } from './supabase'
import type { Database } from './supabase-types'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export async function getTaskById(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  return { task: data, error }
}

export async function getUserRunningTask(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'running')
    .single()

  return { task: data, error }
}

export async function createTask(task: TaskInsert) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert(task)
    .select()
    .single()

  return { task: data, error }
}

export async function updateTask(id: string, updates: TaskUpdate) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { task: data, error }
}

export async function updateTaskStage(taskId: string, stage: string) {
  return updateTask(taskId, {
    current_stage: stage,
    updated_at: new Date().toISOString(),
  })
}

export async function completeTaskStage(taskId: string, stage: string) {
  const { data: task } = await getTaskById(taskId)
  if (!task) return { error: new Error('Task not found') }

  const stagesCompleted = [...(task.stages_completed || []), stage]
  return updateTask(taskId, {
    stages_completed: stagesCompleted,
    updated_at: new Date().toISOString(),
  })
}
```

创建文件 `/lib/supabase/opportunity.ts`：

```typescript
import { supabase, supabaseAdmin } from './supabase'
import type { Database } from './supabase-types'

type Opportunity = Database['public']['Tables']['opportunities']['Row']
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']

export async function getReportOpportunities(
  reportId: string,
  options: {
    page?: number
    size?: number
    sortBy?: 'final_score' | 'index_number'
    sortOrder?: 'asc' | 'desc'
    category?: string
  } = {}
) {
  const {
    page = 1,
    size = 20,
    sortBy = 'final_score',
    sortOrder = 'desc',
    category,
  } = options

  const query = supabase
    .from('opportunities')
    .select('*')
    .eq('report_id', reportId)
    .order(sortBy, { ascending: sortOrder === 'asc' })

  if (category) {
    query.eq('category', category)
  }

  // 分页
  const from = (page - 1) * size
  const to = from + size - 1
  query.range(from, to)

  // 获取总数
  const { count } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId)
    .match(category ? { category } : {})

  const { data, error } = await query

  return {
    opportunities: data || [],
    pagination: {
      page,
      size,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / size),
    },
    error,
  }
}

export async function createOpportunities(opportunities: OpportunityInsert[]) {
  const { data, error } = await supabaseAdmin
    .from('opportunities')
    .insert(opportunities)
    .select()

  return { opportunities: data, error }
}

export async function getPremiumOpportunities(reportId: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('report_id', reportId)
    .gt('final_score', 80)
    .order('final_score', { ascending: false })

  return { opportunities: data || [], error }
}

export async function getOpportunitiesByCategory(
  reportId: string
): Promise<Record<string, Opportunity[]>> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('report_id', reportId)

  if (error || !data) return {}

  return data.reduce((acc, opp) => {
    const category = opp.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(opp)
    return acc
  }, {} as Record<string, Opportunity[]>)
}
```

---

## 验收标准

- [ ] Supabase 客户端配置正确（`lib/supabase.ts`）
- [ ] 数据库 Schema 正确定义所有模型（users, reports, tasks, opportunities）
- [ ] RLS 策略生效（用户只能访问自己的数据）
- [ ] 迁移成功执行
- [ ] 所有索引正确创建
- [ ] 触发器正确配置（自动更新 `updated_at`）
- [ ] 视图正确创建（reports_summary, user_stats）
- [ ] TypeScript 类型生成成功（`lib/supabase-types.ts`）
- [ ] 工具函数正常工作（CRUD 操作）

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `/lib/supabase.ts` | Supabase 客户端配置 |
| `/lib/supabase-types.ts` | TypeScript 类型定义（自动生成） |
| `/supabase/migrations/001_initial_schema.sql` | 数据库迁移文件 |
| `/lib/supabase/user.ts` | 用户数据工具函数 |
| `/lib/supabase/report.ts` | 报告数据工具函数 |
| `/lib/supabase/task.ts` | 任务数据工具函数 |
| `/lib/supabase/opportunity.ts` | 机会数据工具函数 |

---

## 下一步

完成此阶段后，进入 **阶段 2: Supabase Auth + Google OAuth**。
