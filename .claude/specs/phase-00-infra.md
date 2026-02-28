# Phase 0: 基础设施准备 (Infrastructure Setup)

**负责 Agent**: 无（手动配置）
**预计时间**: 1-2 天
**关联页面**: 所有页面（基础设施）

---

## 目标

搭建开发环境，安装必要依赖，配置外部服务和环境变量。

---

## 任务清单

### 1. 安装依赖包

运行以下命令安装所有必需的依赖：

```bash
npm install @supabase/supabase-js \
            @supabase/auth-helpers-nextjs \
            next-auth@beta \
            @auth/core \
            openai \
            @anthropic-ai/sdk \
            @react-pdf/renderer \
            googleapis \
            bullmq \
            ioredis \
            zod
```

#### 依赖说明

| 包名 | 用途 | 版本要求 |
|------|------|---------|
| @supabase/supabase-js | Supabase 客户端 | latest |
| @supabase/auth-helpers-nextjs | Next.js Auth Helpers | latest |
| next-auth@beta | NextAuth v5 (beta) | latest beta |
| @auth/core | Auth.js 核心 | latest |
| openai | OpenAI API SDK | latest |
| @anthropic-ai/sdk | Anthropic Claude SDK | latest |
| @react-pdf/renderer | PDF 生成 | latest |
| googleapis | Google Docs API | latest |
| bullmq | 任务队列 | latest |
| ioredis | Redis 客户端 | latest |
| zod | 数据验证 | latest |

---

### 2. 配置环境变量

创建或更新 `.env.example` 文件：

```env
# ========================================
# Supabase Configuration
# ========================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ========================================
# NextAuth Configuration
# ========================================
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# ========================================
# AI Providers Configuration
# ========================================
# OpenAI
OPENAI_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Default Model (gpt-4, gpt-3.5-turbo, claude-3-opus, claude-3-haiku)
DEFAULT_MODEL=gpt-4

# ========================================
# Google Docs Configuration
# ========================================
# Service account credentials JSON (base64 encoded or path)
GOOGLE_DOCS_CREDENTIALS=

# ========================================
# Redis Configuration
# ========================================
# For BullMQ queue
REDIS_URL=redis://localhost:6379

# Alternatively, use Upstash:
# REDIS_URL=rediss://xxx:xxx@xxx.upstash.io:xxxxx

# ========================================
# App Configuration
# ========================================
# Application URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment (development, production)
NODE_ENV=development
```

创建本地环境变量文件 `.env.local`：

```bash
cp .env.example .env.local
```

然后填充 `.env.local` 中的值。

---

### 3. 外部服务设置

#### 3.1 Supabase 项目配置

1. 访问 https://supabase.com 并创建新项目
2. 在项目 Dashboard 中获取以下信息：
   - **Project URL**: Settings → API → Project URL
   - **Anon Key**: Settings → API → anon/public key
   - **Service Role Key**: Settings → API → service_role key

3. 配置 Google OAuth Provider：
   - Authentication → Providers → Google
   - 启用 Google provider
   - 添加 Redirect URL: `{YOUR_APP_URL}/auth/callback`

#### 3.2 Google OAuth 凭证获取

1. 访问 Google Cloud Console: https://console.cloud.google.com
2. 创建新项目或选择现有项目
3. 启用 Google+ API:
   - APIs & Services → Library → 搜索 "Google+ API" → Enable
4. 创建 OAuth 2.0 客户端 ID:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (开发环境)
     - `{PRODUCTION_URL}/auth/callback` (生产环境)
5. 复制 Client ID 和 Client Secret

6. 在 Supabase 中配置：
   - Authentication → Providers → Google
   - 粘贴 Client ID 和 Client Secret

#### 3.3 OpenAI API Key 获取

1. 访问 https://platform.openai.com
2. 注册/登录账号
3. 获取 API Key:
   - API Keys → Create new secret key
   - 复制生成的 key（只显示一次）
4. 设置 usage limits 和 billing

#### 3.4 Anthropic API Key 获取

1. 访问 https://console.anthropic.com
2. 注册/登录账号
3. 获取 API Key:
   - API Keys → Create Key
   - 复制生成的 key

#### 3.5 Redis 实例配置

**选项 A: 本地 Redis（开发环境）**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Docker
docker run -d -p 6379:6379 redis:alpine
```

测试连接：

```bash
redis-cli ping
# 应该返回: PONG
```

**选项 B: Upstash Redis（推荐生产环境）**

1. 访问 https://upstash.com
2. 创建免费 Redis 数据库
3. 获取 REST API URL 或 Redis URL
4. 复制 Redis URL 到 `.env.local`

#### 3.6 Google Docs API 凭证

1. 在 Google Cloud Console 中启用 Google Docs API:
   - APIs & Services → Library → 搜索 "Google Docs API" → Enable
2. 创建 Service Account:
   - APIs & Services → Credentials → Create Credentials → Service account
3. 下载 Service Account JSON 凭证文件
4. 将 JSON 文件转换为 Base64 并存储到环境变量，或直接存储文件路径

**Base64 编码方法：**

```bash
# macOS/Linux
base64 -i your-service-account.json | pbcopy

# 输出即为 GOOGLE_DOCS_CREDENTIALS 的值
```

---

### 4. 验证配置

创建验证脚本 `scripts/verify-env.mjs`：

```javascript
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config({ path: '.env.local' })

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'REDIS_URL',
]

const optional = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'DEFAULT_MODEL',
  'GOOGLE_DOCS_CREDENTIALS',
]

console.log('Checking required environment variables...\n')

let missing = false

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing: ${key}`)
    missing = true
  } else {
    console.log(`✓ ${key}`)
  }
}

console.log('\nChecking optional environment variables...\n')

for (const key of optional) {
  if (!process.env[key]) {
    console.log(`⚠️  Optional: ${key} (not set)`)
  } else {
    console.log(`✓ ${key}`)
  }
}

if (missing) {
  console.error('\n❌ Some required environment variables are missing!')
  process.exit(1)
}

console.log('\n✅ All required environment variables are set!')
```

运行验证：

```bash
node scripts/verify-env.mjs
```

---

### 5. 测试外部服务连接

#### 5.1 测试 Supabase 连接

创建测试脚本 `scripts/test-supabase.mjs`：

```javascript
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test_connection_').select('*').limit(1)

    if (error) {
      console.log('✓ Supabase connection successful (error expected on non-existent table)')
      return true
    }
  } catch (e) {
    console.error('❌ Supabase connection failed:', e.message)
    return false
  }
}

testConnection()
```

#### 5.2 测试 Redis 连接

创建测试脚本 `scripts/test-redis.mjs`：

```javascript
import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const redis = new Redis(process.env.REDIS_URL)

async function testConnection() {
  try {
    await redis.set('_test_key_', 'test_value', 'EX', 5)
    const value = await redis.get('_test_key_')
    await redis.del('_test_key_')

    if (value === 'test_value') {
      console.log('✓ Redis connection successful!')
      return true
    }
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message)
    return false
  } finally {
    redis.disconnect()
  }
}

testConnection()
```

---

## 验收标准

- [ ] 所有依赖正确安装（`npm install` 成功）
- [ ] 环境变量配置完成（`.env.local` 文件存在且所有必需变量已设置）
- [ ] Supabase 项目创建成功并获取到 URL 和 Keys
- [ ] Redis 连接测试成功
- [ ] Google OAuth 凭证获取完成并配置到 Supabase
- [ ] OpenAI API Key 获取
- [ ] Anthropic API Key 获取（可选）
- [ ] Google Docs Service Account 凭证获取（可选）

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `package.json` | 更新依赖 |
| `.env.example` | 环境变量模板 |
| `.env.local` | 本地环境变量（不提交到 Git） |
| `.gitignore` | 确保包含 `.env.local` |

### .gitignore 更新

确保 `.gitignore` 包含以下内容：

```
# Environment variables
.env.local
.env.production

# Supabase
.supabase

# Service credentials
*.json.credentials

# Node
node_modules
```

---

## 常见问题

### Q: Redis 连接失败
**A**: 确保 Redis 服务正在运行。对于 Upstash，使用正确的 REST URL 而不是 Redis URL。

### Q: Supabase Auth 不工作
**A**: 检查 Redirect URL 配置是否正确，确保与 `NEXT_PUBLIC_APP_URL/auth/callback` 匹配。

### Q: OpenAI API 超时
**A**: 检查 API Key 是否有效，确保账户有足够的配额。

---

## 下一步

完成此阶段后，进入 **阶段 1: Supabase 数据库集成**。
