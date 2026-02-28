# Phase 7: 优化和测试 (Optimization & Testing)

**负责 Agent**: 所有 Agent 协作
**预计时间**: 3-5 天
**依赖**: 所有前置阶段
**关联页面**: 所有页面

---

## 目标

进行性能优化、错误处理完善、全面测试和监控配置，确保生产环境就绪。

---

## 1. 性能优化

### 1.1 Supabase 查询优化

创建文件 `/lib/supabase/performance.ts`：

```typescript
import { supabase } from './supabase'

/**
 * 查询性能监控装饰器
 */
export function withQueryTiming<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now()
    try {
      const result = await fn(...args)
      const duration = Date.now() - start

      if (duration > 1000) {
        console.warn(`Slow query detected: ${label} took ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`Query error: ${label} failed after ${duration}ms`, error)
      throw error
    }
  }) as T
}

/**
 * 批量获取建议
 * - 使用 select() 指定需要的字段
 * - 使用索引列进行过滤
 * - 使用分页避免大量数据
 * - 使用 relationships 代替多次查询
 */
export const QUERY_TIPS = {
  reports: `
    - Always filter by user_id (indexed)
    - Always filter by is_deleted (indexed)
    - Use order('created_at', { ascending: false }) (indexed)
    - Limit results with range() for pagination
  `,
  opportunities: `
    - Always filter by report_id (indexed)
    - Use final_score for sorting (indexed)
    - Don't fetch all opportunities at once - use pagination
    - Select only needed fields
  `,
  tasks: `
    - Always filter by user_id and status (indexed)
    - Use single() for lookups instead of array
  `,
}
```

---

### 1.2 API 响应缓存

创建文件 `/lib/cache.ts`：

```typescript
/**
 * 简单的内存缓存
 */
class Cache {
  private cache = new Map<string, { value: any; expires: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 分钟

  set(key: string, value: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

export const cache = new Cache()

/**
 * 带缓存的 API 调用
 */
export async function cachedFetch<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached) {
    return cached
  }

  const result = await fn()
  cache.set(key, result, ttl)
  return result
}
```

---

### 1.3 图片懒加载

更新组件使用 Next.js Image 组件：

```tsx
import Image from 'next/image'

// 使用示例
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
  loading="lazy"
/>
```

---

### 1.4 代码分割

在适当位置使用动态导入：

```tsx
import dynamic from 'next/dynamic'

// 动态导入导出按钮（按需加载）
const ExportButtons = dynamic(
  () => import('@/components/report/export-buttons'),
  { ssr: false, loading: () => <div className="h-10 w-24 animate-pulse rounded" /> }
)
```

---

## 2. 错误处理

### 2.1 统一错误处理中间件

创建文件 `/lib/error-handler.ts`：

```typescript
import { ApiError } from './api/client'

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * 错误代码映射到用户友好消息
 */
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Please sign in to continue',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'Please check your input and try again',
  CONCURRENT_TASK_LIMIT: 'You already have an analysis running',
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
}

/**
 * 处理 API 错误
 */
export function handleApiError(error: unknown): ErrorResponse {
  if (error instanceof ApiError) {
    return {
      error: {
        code: error.code,
        message: ERROR_MESSAGES[error.code] || error.message,
        details: error.details,
      },
    }
  }

  if (error instanceof Error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        details: error.message,
      },
    }
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: ERROR_MESSAGES.INTERNAL_ERROR,
    },
  }
}

/**
 * 格式化错误显示
 */
export function formatErrorMessage(error: ErrorResponse): string {
  return error.error.message
}

/**
 * 检查错误是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const retryableCodes = ['INTERNAL_ERROR', 'NETWORK_ERROR', 'TIMEOUT']
    return retryableCodes.includes(error.code)
  }
  return false
}
```

---

### 2.2 优雅的错误页面

创建文件 `/app/error.tsx`：

```tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-4 text-muted-foreground">
          We apologize for the inconvenience. Please try again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

### 2.3 404 页面

创建文件 `/app/not-found.tsx`：

```tsx
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="mt-4 text-2xl font-bold">Page not found</h2>
        <p className="mt-4 text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <a href="/">
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </a>
        </Button>
      </div>
    </div>
  )
}
```

---

## 3. 测试

### 3.1 单元测试

创建文件 `/tests/utils/format.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { formatDistanceToNow } from '@/lib/utils'

describe('formatDistanceToNow', () => {
  it('formats dates correctly', () => {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    expect(formatDistanceToNow(oneMinuteAgo)).toContain('minute')
    expect(formatDistanceToNow(oneHourAgo)).toContain('hour')
    expect(formatDistanceToNow(oneDayAgo)).toContain('day')
  })
})
```

---

### 3.2 API 路由测试

创建文件 `/tests/api/reports.test.ts`：

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { POST as createTask } from '@/app/api/v1/tools/product-insight/tasks/route'
import { GET as getReports } from '@/app/api/v1/reports/route'

describe('Reports API', () => {
  let authToken: string
  let reportId: string

  beforeAll(async () => {
    // 设置测试认证
    authToken = 'test-token'
  })

  it('should create a task', async () => {
    const request = new Request('http://localhost/api/v1/tools/product-insight/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ input_text: 'AI for freelancers' }),
    })

    const response = await createTask(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveProperty('task_id')
    expect(data.data).toHaveProperty('report_id')

    reportId = data.data.report_id
  })

  it('should get user reports', async () => {
    const request = new Request(`http://localhost/api/v1/reports?page=1&size=20`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    })

    const response = await getReports(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.meta).toHaveProperty('pagination')
  })
})
```

---

### 3.3 E2E 测试

使用 Playwright 进行端到端测试：

创建文件 `/tests/e2e/analysis-flow.spec.ts`：

```typescript
import { test, expect } from '@playwright/test'

test.describe('Analysis Flow', () => {
  test('should complete full analysis flow', async ({ page }) => {
    // 访问主页
    await page.goto('/')

    // 检查页面加载
    await expect(page.locator('h1')).toContainText('AI Product Insight')

    // 输入分析方向
    await page.fill('input[placeholder*="product direction"]', 'AI for freelancers')

    // 点击分析按钮
    await page.click('button:has-text("Analyze")')

    // 等待跳转到分析页面
    await page.waitForURL(/\/analysis\//)

    // 等待分析完成（最多 5 分钟）
    await page.waitForURL(/\/report\//, { timeout: 300000 })

    // 检查报告页面
    await expect(page.locator('h1')).toContainText('Product Insight Report')
    await expect(page.locator('text=300')).toBeVisible() // 总机会数

    // 测试导出 PDF
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export")')
    await page.click('text=Export as PDF')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })
})
```

---

### 3.4 负载测试

使用 k6 进行负载测试：

创建文件 `/tests/load/api-load-test.js`：

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // 2 分钟内从 0 到 10 用户
    { duration: '5m', target: 10 },   // 10 用户持续 5 分钟
    { duration: '2m', target: 50 },   // 2 分钟内增加到 50 用户
    { duration: '5m', target: 50 },   // 50 用户持续 5 分钟
    { duration: '2m', target: 0 },    // 2 分钟内减少到 0 用户
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 请求在 500ms 内完成
    http_req_failed: ['rate<0.01'],    // 错误率 < 1%
  },
}

const BASE_URL = 'http://localhost:3000'

export default function () {
  // 测试获取报告列表
  const reportsResponse = http.get(`${BASE_URL}/api/v1/reports`, {
    headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` },
  })

  check(reportsResponse, {
    'reports status is 200': (r) => r.status === 200,
    'reports has data': (r) => JSON.parse(r.body).data !== undefined,
  })

  sleep(1)
}
```

---

## 4. 监控和日志

### 4.1 错误追踪（Sentry）

创建文件 `/lib/sentry.ts`：

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% 请求追踪
  replaysSessionSampleRate: 0.1, // 10% 会话录制
  replaysOnErrorSampleRate: 1.0, // 错误时 100% 录制
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
})

export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, { extra: context })
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, { level })
}
```

---

### 4.2 性能监控（Vercel Analytics）

已在项目中配置，确保正确使用：

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

### 4.3 自定义日志

创建文件 `/lib/logger.ts`：

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const entry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    }

    if (this.isDevelopment) {
      const consoleMethod = level === 'debug' ? 'log' : level
      console[consoleMethod](`[${timestamp}] ${level.toUpperCase()}:`, message, data || '')
    } else {
      // 生产环境可以发送到日志服务
      // this.sendToLogService(entry)
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, error?: any) {
    this.log('error', message, error?.stack || error)
  }
}

export const logger = new Logger()
```

---

## 5. 部署检查清单

### 5.1 环境变量检查

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY` (可选)
- [ ] `REDIS_URL`
- [ ] `GOOGLE_DOCS_CREDENTIALS` (可选)
- [ ] `SENTRY_DSN` (可选)

### 5.2 数据库检查

- [ ] 所有迁移已执行
- [ ] RLS 策略已启用
- [ ] 索引已创建
- [ ] 触发器已配置

### 5.3 外部服务检查

- [ ] Supabase 项目运行正常
- [ ] Redis 连接正常
- [ ] Worker 进程运行中
- [ ] Google OAuth 配置正确

### 5.4 性能指标

- [ ] API 响应时间 < 200ms (分页查询)
- [ ] 报告加载 < 1秒
- [ ] 并发能力达到 50 任务
- [ ] PDF 生成 < 30 秒
- [ ] Google Docs 导出 < 20 秒

---

## 验收标准

- [ ] API 响应时间达标
- [ ] 报告加载时间达标
- [ ] 并发能力达标
- [ ] 测试覆盖率 > 80%
- [ ] 无严重 bug
- [ ] 错误处理完善
- [ ] 监控配置完成
- [ ] 日志记录正常
- [ ] 部署检查清单完成

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `/lib/supabase/performance.ts` | 查询性能监控 |
| `/lib/cache.ts` | 缓存工具 |
| `/lib/error-handler.ts` | 错误处理 |
| `/app/error.tsx` | 全局错误页面 |
| `/app/not-found.tsx` | 404 页面 |
| `/tests/` | 测试文件 |
| `/lib/sentry.ts` | Sentry 配置 |
| `/lib/logger.ts` | 日志工具 |

---

## 常见问题

### Q: 测试覆盖率低
**A**: 优先测试关键路径：认证、任务创建、报告生成、导出功能。

### Q: 性能监控显示慢查询
**A**: 检查 Supabase 查询计划，确保使用了正确的索引，考虑添加更多索引。

### Q: Sentry 报告太多错误
**A**: 配置错误过滤，忽略开发环境的错误，设置合理的采样率。

---

## 总结

完成所有 7 个阶段后，GuruBox.ai 将具备：

1. **完整的后端架构**: Supabase 数据库、AI 模型集成、任务队列
2. **真实的用户认证**: Google OAuth 登录
3. **强大的 AI 分析**: 300 个机会生成，专家级摘要
4. **完善的导出功能**: PDF 和 Google Docs 导出
5. **优秀的用户体验**: 实时更新、错误处理、性能优化
6. **可靠的质量保证**: 全面的测试、监控和日志

项目已准备好部署到生产环境！
