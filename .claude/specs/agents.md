# GuruBox.ai - Agent 架构设计

## 概述

定义 5 个专门 Agent，每个负责不同领域的实现，通过明确的职责分工和输出文件实现高效协作。

---

## 1. Database Agent (Supabase 数据库专家)

### 职责范围
- 设计 Supabase 数据库 Schema
- 配置 Supabase Client
- 创建数据库表和关系
- 设置 RLS (Row Level Security) 策略
- 数据库迁移和版本管理
- 数据类型与 TypeScript 类型同步

### 核心能力
- Supabase 客户端配置
- PostgreSQL 表设计
- RLS 策略编写
- Realtime 订阅配置
- 索引优化

### 输出文件
- `/supabase/migrations/001_initial_schema.sql` - 数据库迁移文件
- `/lib/supabase.ts` - Supabase 客户端配置
- `/lib/supabase-types.ts` - TypeScript 类型定义（自动生成）
- `/lib/supabase/` - 数据库工具函数目录

### 数据模型

#### Users 表
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Reports 表
```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  status TEXT DEFAULT 'generating',
  analysis_time_sec INTEGER DEFAULT 0,
  total_opportunities INTEGER DEFAULT 300,
  premium_ratio NUMERIC DEFAULT 0,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);
```

#### Tasks 表
```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL UNIQUE REFERENCES public.reports(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  current_stage TEXT DEFAULT 'understanding',
  stages_completed TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Opportunities 表
```sql
CREATE TABLE public.opportunities (
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
  monetization_score INTEGER DEFAULT 0,
  industry_size_score INTEGER DEFAULT 0,
  competition_score INTEGER DEFAULT 0,
  mvp_difficulty_score INTEGER DEFAULT 0,
  final_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Authentication Agent (认证专家)

### 职责范围
- Supabase Auth 集成
- Google OAuth 连接
- Session 管理和持久化
- 用户状态同步到数据库
- 认证中间件和保护路由
- 用户信息更新（语言偏好等）

### 核心能力
- Supabase Auth API
- Google OAuth 流程
- Server Actions 和 API 保护
- 用户会话管理
- RLS 策略与认证结合

### 输出文件
- `/lib/auth.ts` - 认证工具函数
- `/middleware.ts` - Next.js 中间件（路由保护）
- `/app/auth/callback/route.ts` - OAuth 回调路由
- `/components/auth/auth-provider.tsx` - 认证 Provider 组件（更新）
- Supabase RLS 迁移文件

### 认证流程

#### 1. Google OAuth 登录
```typescript
// 用户点击登录
signInWithGoogle() → 跳转到 Google OAuth 授权页面
    ↓
// 用户授权后回调
/auth/callback → 交换 code 为 session
    ↓
// 创建/更新用户记录
users 表 upsert 操作
    ↓
// 重定向到首页
/tools/product-insight
```

#### 2. Session 管理
- 使用 Supabase Auth 的自动 session 持久化
- `onAuthStateChange` 监听器更新前端状态
- Server Components 通过 `cookies` 获取 session

#### 3. 路由保护
- `/account/*` 路径需要认证
- 未登录用户重定向到 `/tools/product-insight`

---

## 3. API Agent (API 专家)

### 职责范围
- 实现所有后端 API 路由
- RESTful API 设计
- 请求验证和错误处理
- 并发控制和任务管理
- API 文档

### 核心能力
- Next.js App Router API Routes
- Supabase 查询构建
- Zod 验证
- 错误处理中间件
- 分页和查询优化
- 并发限制逻辑

### 输出文件
- `/app/api/v1/tools/product-insight/tasks/route.ts`
- `/app/api/v1/tasks/[task_id]/route.ts`
- `/app/api/v1/reports/route.ts`
- `/app/api/v1/reports/[report_id]/route.ts`
- `/app/api/v1/reports/[report_id]/opportunities/route.ts`
- `/app/api/v1/reports/[report_id]/export/pdf/route.ts`
- `/app/api/v1/reports/[report_id]/export/gdocs/route.ts`
- `/app/api/v1/users/language/route.ts`
- `/lib/api/` - API 工具类
- `/lib/validation/` - Zod 验证 schemas

### API 路由清单

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/v1/tools/product-insight/tasks` | 创建分析任务 |
| GET | `/api/v1/tasks/[task_id]` | 获取任务状态 |
| GET | `/api/v1/reports/[report_id]` | 获取报告 |
| GET | `/api/v1/reports` | 获取用户历史 |
| GET | `/api/v1/reports/[report_id]/opportunities` | 获取机会列表（分页） |
| DELETE | `/api/v1/reports/[report_id]` | 删除报告（软删除） |
| PUT | `/api/v1/users/language` | 更新用户语言 |
| POST | `/api/v1/reports/[report_id]/export/pdf` | 导出 PDF |
| POST | `/api/v1/reports/[report_id]/export/gdocs` | 导出 Google Docs |

### 错误处理标准

```typescript
{
  "error": {
    "code": "CONCURRENT_TASK_LIMIT",
    "message": "You already have an analysis running",
    "details": { ... }
  }
}
```

---

## 4. AI Agent (AI 分析专家)

### 职责范围
- AI 模型集成（支持多模型切换）
- 基于提示词样例的 Prompt 模板设计
- 10 大信号源的模拟/集成
- 6 阶段 AI Pipeline 实现
- 批处理和流式响应
- 任务队列集成
- 成本控制和多模型策略

### 核心能力
- 多 AI 提供商集成（OpenAI, Anthropic 等）
- Prompt Engineering（基于 InsightPrompt.md）
- 信号源数据模拟或真实集成
- 任务队列 (BullMQ + Redis)
- 批处理逻辑
- 重试和超时机制

### 输出文件
- `/lib/ai/engine.ts` - AI 引擎核心
- `/lib/ai/prompts.ts` - Prompt 模板（基于 InsightPrompt.md）
- `/lib/ai/signals/` - 信号源处理器目录
- `/lib/ai/providers/base.ts` - AI Provider 基类
- `/lib/ai/providers/openai.ts` - OpenAI Provider
- `/lib/ai/providers/anthropic.ts` - Anthropic Provider
- `/lib/ai/providers/factory.ts` - Provider 工厂
- `/lib/ai/service.ts` - AI 服务类
- `/lib/queue/worker.ts` - 队列 worker
- `/lib/redis.ts` - Redis 配置

### AI Pipeline 6 阶段

| 阶段 | 名称 | 用时 | 模型 | 输出 |
|------|------|------|------|------|
| 1 | Understanding | 3-8s | gpt-3.5-turbo | 行业理解、用户意图 |
| 2 | Analyzing | 3-8s | gpt-3.5-turbo | 行业结构、市场空间 |
| 3 | Scanning | 3-8s | gpt-4 | 灵感来源、信号数据 |
| 4 | Generating | 30-120s | gpt-4 | 300 个完整机会数据 |
| 5 | Scoring | 3-8s | gpt-3.5-turbo | 各维度得分 |
| 6 | Finalizing | 3-8s | gpt-4 | 专家摘要、统计数据 |

### 多模型策略

| 任务类型 | 推荐模型 | 成本 | 质量 |
|---------|---------|------|------|
| 理解/分析/评分 | gpt-3.5-turbo | 低 | 中 |
| 扫描/生成/总结 | gpt-4 / claude-3-opus | 高 | 高 |

---

## 5. Export Agent (导出专家)

### 职责范围
- PDF 生成和导出
- Google Docs API 集成
- 文件服务和存储（Supabase Storage）
- 导出内容的格式化和样式
- 大量数据的导出优化

### 核心能力
- PDF 生成 (@react-pdf/renderer)
- Google Docs API 集成
- Supabase Storage API
- 文件流处理
- 模板和样式设计

### 输出文件
- `/lib/export/pdf-generator.ts` - PDF 生成器
- `/lib/export/gdocs-service.ts` - Google Docs 服务
- `/app/api/v1/reports/[report_id]/export/pdf/route.ts` - PDF 导出路由
- `/app/api/v1/reports/[report_id]/export/gdocs/route.ts` - Google Docs 导出路由

### 导出内容结构

#### PDF 报告结构
1. 标题页（报告标题、日期、用户信息）
2. 专家摘要
3. 统计信息（分析时间、机会数、优质比例）
4. 机会表格（300 个，按得分排序）
5. 分类汇总

#### Google Docs 结构
1. 标题（Heading 1）
2. 专家摘要
3. 统计信息（表格）
4. 机会列表（表格）
5. 分类汇总

---

## Agent 协作关系

```
┌─────────────────────────────────────────────────────────────┐
│                     Database Agent                           │
│                    (阶段 1)                                   │
│  输出: Schema, RLS, Migrations, Client                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────┴───────────────────────────────────────┐
│                   Authentication Agent                        │
│                    (阶段 2)                                   │
│  依赖: Database Agent                                        │
│  输出: Auth utils, Middleware, Callback route                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────┴───────────────────────────────────────┐
│                    API Agent                                 │
│                    (阶段 3)                                   │
│  依赖: Database Agent, Authentication Agent                  │
│  输出: All API routes, Validation schemas                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────┴───────────────────────────────────────┐
│                     AI Agent                                 │
│                    (阶段 4)                                   │
│  依赖: Database Agent, API Agent                              │
│  输出: AI Engine, Prompts, Providers, Queue worker           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────┴───────────────────────────────────────┐
│              Frontend Integration (API Agent)               │
│                    (阶段 5)                                   │
│  依赖: All previous agents                                   │
│  输出: Updated components with real API calls                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────┴───────────────────────────────────────┐
│                   Export Agent                               │
│                    (阶段 6)                                   │
│  依赖: API Agent, Frontend Integration                        │
│  输出: PDF generator, GDocs service, Export routes          │
└─────────────────────────────────────────────────────────────┘
```

---

## 依赖关系总结

| Agent | 依赖 | 输出被依赖 |
|-------|------|-----------|
| Database | 无 | Auth, API, AI |
| Authentication | Database | API, Frontend |
| API | Database, Auth | AI, Frontend, Export |
| AI | Database, API | Frontend |
| Export | API, Frontend | 无 |
