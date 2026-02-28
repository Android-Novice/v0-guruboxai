# Phase 2: Supabase Auth + Google OAuth (Authentication)

**负责 Agent**: Authentication Agent
**预计时间**: 2-3 天
**依赖**: 阶段 1
**关联页面**: `/tools/product-insight`, `/account`

---

## 目标

实现真实的 Google 登录功能，使用 Supabase Auth，包括 Session 管理、路由保护和用户信息更新。

---

## 实现功能

### 1. 配置 Supabase Auth Google OAuth Provider

在 Supabase Dashboard 中配置：

1. 访问 **Authentication** → **Providers** → **Google**
2. 启用 Google provider
3. 配置以下信息：
   - **Client ID**: 从 Google Cloud Console 获取
   - **Client Secret**: 从 Google Cloud Console 获取
   - **Redirect URL**: `{YOUR_APP_URL}/auth/callback`

**开发环境示例**:
```
http://localhost:3000/auth/callback
```

**生产环境示例**:
```
https://yourdomain.com/auth/callback
```

---

### 2. 创建 Auth 工具类

创建文件 `/lib/auth.ts`：

```typescript
import { supabase } from './supabase'
import type { User } from './types'

/**
 * 使用 Google OAuth 登录
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  return { data, error }
}

/**
 * 登出当前用户
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // 获取扩展用户信息
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError) {
    // 如果扩展用户信息不存在，使用 Auth 用户信息
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata.full_name || user.email?.split('@')[0],
      avatar: user.user_metadata.avatar_url,
      language: 'en',
    } as User
  }

  return userData as User
}

/**
 * 获取当前 Session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * 更新用户语言偏好
 */
export async function updateUserLanguage(language: string) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('users')
    .update({ language })
    .eq('id', user.id)
    .select()
    .single()

  return { user: data, error }
}

/**
 * 确保/创建用户记录
 */
export async function ensureUserExists(userId: string, metadata: {
  email: string
  name?: string
  avatar?: string
}) {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: metadata.email,
      name: metadata.name,
      avatar: metadata.avatar,
    }, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  return { user: data, error }
}
```

---

### 3. 创建 OAuth 回调路由

创建文件 `/app/auth/callback/route.ts`：

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/tools/product-insight'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })

    // 交换 code 为 session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(
        new URL('/auth/error', requestUrl.origin)
      )
    }

    // 获取用户信息
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // 确保用户记录存在
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata.full_name,
          avatar: user.user_metadata.avatar_url,
        }, {
          onConflict: 'id',
        })

      if (upsertError) {
        console.error('User upsert error:', upsertError)
      }
    }
  }

  // 重定向到目标页面
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
```

创建文件 `/app/auth/error/page.tsx`：

```tsx
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Authentication Error</h1>
        <p className="mt-2 text-muted-foreground">
          There was an error during the authentication process.
        </p>
        <Button
          className="mt-6"
          onClick={() => (window.location.href = '/')}
        >
          Return to Home
        </Button>
      </div>
    </div>
  )
}
```

---

### 4. 创建中间件（路由保护）

创建文件 `/middleware.ts`：

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAccountPage = req.nextUrl.pathname.startsWith('/account')

  // 保护 /account 路由
  if (isAccountPage && !session) {
    const redirectUrl = new URL('/tools/product-insight', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 5. 更新 AuthProvider 组件

更新文件 `/components/auth/auth-provider.tsx`：

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AppUser } from '@/lib/types'

interface AuthContextType {
  user: AppUser | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取初始 session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        await loadUser(session.user.id)
      }

      setSession(session)
      setLoading(false)
    }

    getInitialSession()

    // 监听 auth 变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)

      if (session?.user) {
        await loadUser(session.user.id)
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUser = async (userId: string) => {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userData) {
      setUser(userData as AppUser)
    } else {
      // 使用 session 用户信息作为后备
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          id: user.id,
          email: user.email!,
          name: user.user_metadata.full_name || user.email?.split('@')[0],
          avatar: user.user_metadata.avatar_url,
          language: 'en',
        })
      }
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

---

### 6. 创建 Server Actions（用于服务端认证检查）

创建文件 `/app/actions/auth.ts`：

```typescript
'use server'

import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { AppUser } from '@/lib/types'

export async function getServerUser(): Promise<AppUser | null> {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userData) {
    return userData as AppUser
  }

  // 返回基本用户信息
  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata.full_name || user.email?.split('@')[0],
    avatar: user.user_metadata.avatar_url,
    language: 'en',
  }
}

export async function requireAuth(): Promise<AppUser> {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
```

---

### 7. 更新类型定义

更新 `/lib/types.ts`，添加用户类型：

```typescript
export interface AppUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  language: string
  created_at?: string
  updated_at?: string
}

export interface AuthContextType {
  user: AppUser | null
  session: any
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}
```

---

### 8. 创建导航栏登录/登出组件

更新 `/components/layout/navbar.tsx`，集成认证：

```tsx
'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronDown, LogOut, User } from 'lucide-react'
import Link from 'next/link'

export function NavbarUserMenu() {
  const { user, signInWithGoogle, signOut, loading } = useAuth()

  if (loading) {
    return <div className="h-9 w-32 animate-pulse rounded bg-muted" />
  }

  if (!user) {
    return (
      <Button onClick={signInWithGoogle}>
        Sign in with Google
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback>
              {user.name?.[0] || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.name || user.email}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 验收标准

- [ ] Supabase Auth Google 登录正常（点击登录按钮 → Google 授权页面 → 回调成功）
- [ ] 登录成功后用户记录创建/更新到 Supabase
- [ ] Session 正确管理和持久化（页面刷新后保持登录状态）
- [ ] 登出功能正常（清除 session 和本地状态）
- [ ] `/account` 路由受保护（未登录自动重定向）
- [ ] 用户语言更新正常（API 调用成功）
- [ ] AuthProvider 正确监听 session 变化
- [ ] 导航栏正确显示登录状态和用户信息

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `/lib/auth.ts` | 认证工具函数 |
| `/app/auth/callback/route.ts` | OAuth 回调路由 |
| `/app/auth/error/page.tsx` | 认证错误页面 |
| `/middleware.ts` | Next.js 中间件（路由保护） |
| `/components/auth/auth-provider.tsx` | 认证 Provider 组件 |
| `/app/actions/auth.ts` | Server Actions（服务端认证） |
| `/components/layout/navbar.tsx` | 导航栏（更新登录状态显示） |
| `/lib/types.ts` | 类型定义（更新） |

---

## 常见问题

### Q: 登录后没有跳转回应用
**A**: 检查 Supabase Auth 配置中的 Redirect URL 是否正确。

### Q: Session 在页面刷新后丢失
**A**: 确保使用了 Supabase Auth 的 `persistSession: true` 选项，并且 AuthProvider 正确监听 auth 状态变化。

### Q: 用户扩展信息没有创建
**A**: 检查回调路由中的 upsert 逻辑，确保在 exchangeCodeForSession 后正确执行。

---

## 下一步

完成此阶段后，进入 **阶段 3: API 路由实现**。
