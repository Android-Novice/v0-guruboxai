# Phase 4: AI 模型集成 (AI Integration)

**负责 Agent**: AI Agent
**预计时间**: 5-7 天
**依赖**: 阶段 1, 阶段 3
**关联页面**: `/analysis/[task_id]` (核心处理)

---

## 目标

实现 AI 分析引擎，生成 300 个产品机会，包括多模型支持、6 阶段 Pipeline、任务队列和成本控制。

---

## AI Pipeline 6 阶段

| 阶段 | 名称 | 用时 | 推荐模型 | 输出 |
|------|------|------|---------|------|
| 1 | Understanding | 3-8s | gpt-3.5-turbo | 行业理解、用户意图 |
| 2 | Analyzing | 3-8s | gpt-3.5-turbo | 行业结构、市场空间 |
| 3 | Scanning | 3-8s | gpt-4 / claude-3-opus | 灵感来源、信号数据 |
| 4 | Generating | 30-120s | gpt-4 / claude-3-opus | 300 个完整机会数据 |
| 5 | Scoring | 3-8s | gpt-3.5-turbo | 各维度得分 |
| 6 | Finalizing | 3-8s | gpt-4 / claude-3-opus | 专家摘要、统计数据 |

---

## 1. AI Provider 抽象层

创建文件 `/lib/ai/providers/base.ts`：

```typescript
export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface ChatResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

export abstract class AIProvider {
  protected apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 单次对话（非流式）
   */
  abstract chat(
    messages: Message[],
    options?: ChatOptions
  ): Promise<ChatResponse>

  /**
   * 流式对话（用于实时输出）
   */
  abstract *stream(
    messages: Message[],
    options?: ChatOptions
  ): Generator<string, void, unknown>
}
```

---

### 1.1 OpenAI Provider

创建文件 `/lib/ai/providers/openai.ts`：

```typescript
import OpenAI from 'openai'
import type { Message, ChatOptions, ChatResponse } from './base'

export class OpenAIProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      timeout: options.timeout,
    })

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
      model: response.model,
    }
  }

  *stream(messages: Message[], options: ChatOptions = {}): Generator<string> {
    const stream = this.client.chat.completions.create({
      model: options.model || 'gpt-4',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
```

---

### 1.2 Anthropic Provider

创建文件 `/lib/ai/providers/anthropic.ts`：

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { Message, ChatOptions, ChatResponse } from './base'

export class AnthropicProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: options.model || 'claude-3-opus-20240229',
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return {
      content: content.text,
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      } : undefined,
      model: response.model,
    }
  }

  *stream(messages: Message[], options: ChatOptions = {}): Generator<string> {
    const stream = this.client.messages.create({
      model: options.model || 'claude-3-opus-20240229',
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content,
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }
}
```

---

### 1.3 Provider 工厂

创建文件 `/lib/ai/providers/factory.ts`：

```typescript
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'

export type AIProviderType = 'openai' | 'anthropic'

export interface ProviderConfig {
  type: AIProviderType
  apiKey: string
  model?: string
}

const defaultModels: Record<AIProviderType, string> = {
  openai: 'gpt-4',
  anthropic: 'claude-3-opus-20240229',
}

export function createProvider(config: ProviderConfig) {
  switch (config.type) {
    case 'openai':
      return new OpenAIProvider(config.apiKey)
    case 'anthropic':
      return new AnthropicProvider(config.apiKey)
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
}

export function getDefaultProvider() {
  // 根据 DEFAULT_MODEL 环境变量决定使用哪个 provider
  const defaultModel = process.env.DEFAULT_MODEL || 'gpt-4'

  if (defaultModel.startsWith('gpt-')) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set')
    }
    return createProvider({
      type: 'openai',
      apiKey,
      model: defaultModel,
    })
  }

  if (defaultModel.startsWith('claude-')) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set')
    }
    return createProvider({
      type: 'anthropic',
      apiKey,
      model: defaultModel,
    })
  }

  throw new Error(`Unknown default model: ${defaultModel}`)
}

// 根据模型名称获取 provider
export function getProviderForModel(model: string) {
  if (model.startsWith('gpt-')) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set')
    }
    return createProvider({ type: 'openai', apiKey, model })
  }

  if (model.startsWith('claude-')) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set')
    }
    return createProvider({ type: 'anthropic', apiKey, model })
  }

  throw new Error(`Unknown model: ${model}`)
}
```

---

## 2. Prompt 模板

创建文件 `/lib/ai/prompts.ts`：

```typescript
import { z } from 'zod'

// AI 角色定义
const AI_ROLE = `You are an expert AI Product Researcher with 15 years of experience in global markets.

Your expertise includes:
- Discovering opportunities from user complaints, negative reviews, and developer trends
- Identifying overlooked essential needs
- Finding workflows that require 3-5 tools to be stitched together
- Discovering product opportunities where Web is strong but Mobile is weak

Your analysis is based on cross-validation from 10 intelligence sources:
1. Reddit user complaints (100+ communities)
2. App Store negative reviews (1-3 star ratings)
3. SaaS review platforms (G2, Capterra, Trustpilot)
4. Workflow complexity signals
5. Developer ecosystem trends
6. SEO demand signals
7. Content creator workflows
8. Indie developer signals
9. Web strong Mobile weak opportunities
10. New trend signals

Each opportunity must be validated by at least 3 signal sources.`

export const PROMPTS = {
  /**
   * Stage 1: Understanding
   * 理解用户输入的产品方向，解析关键概念
   */
  understanding: (input: string) => `${AI_ROLE}

Analyze the following product direction:
"${input}"

Your task is to understand and extract:
1. Key concepts and themes
2. Target user segments
3. Core problems being addressed
4. Market context

Output as JSON:
{
  "key_concepts": ["concept1", "concept2"],
  "target_users": ["segment1", "segment2"],
  "core_problems": ["problem1", "problem2"],
  "market_context": "brief description of the market landscape"
}`,

  /**
   * Stage 2: Analyzing
   * 研究市场趋势和行业动态
   */
  analyzing: (context: string) => `${AI_ROLE}

Based on the product understanding:
${context}

Research and analyze:
1. Industry structure and dynamics
2. Market size and growth potential
3. Key players and competitive landscape
4. Technology trends

Output as JSON:
{
  "industry_structure": "description of industry structure",
  "market_size": "estimated market size and growth",
  "key_players": ["player1", "player2"],
  "technology_trends": ["trend1", "trend2"]
}`,

  /**
   * Stage 3: Scanning
   * 检测新兴模式和机会信号（10 大信号源）
   */
  scanning: (direction: string) => `${AI_ROLE}

Scan across 10 intelligence sources for "${direction}":

1. Reddit user complaints (100+ communities)
2. App Store negative reviews (1-3 stars)
3. SaaS review platforms (G2, Capterra, Trustpilot)
4. Workflow complexity signals (Zapier, Make, Airtable templates)
5. Developer ecosystem trends (GitHub, LangChain, HuggingFace)
6. SEO demand signals (Google search intent analysis)
7. Content creator workflows (YouTube, TikTok, Instagram)
8. Indie developer signals (IndieHackers, TAAFT, Product Hunt)
9. Web strong Mobile weak opportunities
10. New trend signals (Exploding Topics, Google Trends)

Output signal data as JSON:
{
  "categories": [
    {
      "name": "category_name",
      "description": "brief description"
    }
  ],
  "signals": [
    {
      "source": "source_name",
      "description": "signal description",
      "urgency": "high|medium|low",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "inspiration_sources": [
    {
      "platform": "platform_name",
      "community": "specific community/thread",
      "pain_point": "the pain point"
    }
  ]
}`,

  /**
   * Stage 4: Generating (批处理)
   * 批量生成机会（每批 50 个）
   */
  generating: (batchNumber: number, totalBatches: number, direction: string, signals: string) => `${AI_ROLE}

Generate batch ${batchNumber} of ${totalBatches} for "${direction}".

Based on the signal analysis:
${signals}

Requirements:
1. Generate 50 UNIQUE AI Native Mobile-First product opportunities
2. Each opportunity must have 3+ signal source cross-validation
3. Each must be:
   - Mobile-first design
   - AI Native (AI is core to the product)
   - Implementable as MVP in 3 months
4. No generic concepts (be specific)
5. Must reference real pain points from signals
6. Focus on underserved niches and specific use cases

Output as JSON array:
[
  {
    "index_number": 1,
    "name": "Specific, catchy product name",
    "core_users": "Specific target user profile (e.g., 'freelance graphic designers with ADHD')",
    "pain_points": "Real pain point with source reference (e.g., 'Reddit/r/freelance: \"I lose track of time...\"')",
    "user_demands": "What users explicitly want or need",
    "ai_solution": "Specific AI-based solution (not just 'AI-powered', but how AI is used)",
    "category": "Specific category (e.g., 'Time Management', 'Content Creation', etc.)",
    "inspiration_source": "Specific community/platform where this pain point was found",
    "signal_count": 3
  }
]`,

  /**
   * Stage 5: Scoring
   * 评估每个机会的 5 个维度评分
   */
  scoring: (opportunities: any[]) => `${AI_ROLE}

Score each opportunity on 5 dimensions (0-100):

1. Monetization potential: How easy to monetize and potential revenue
2. Industry size: Total addressable market size
3. Competition: Higher score = MORE competitive (easier market)
4. MVP difficulty: Higher score = HARDER to build
5. Final score: Composite weighted score (monetization 30%, industry 25%, competition inverted 20%, difficulty inverted 25%)

Opportunities:
${JSON.stringify(opportunities, null, 2)}

Output as JSON array with added scores:
[
  {
    ...original fields,
    "monetization_score": 75,
    "industry_size_score": 60,
    "competition_score": 40,
    "mvp_difficulty_score": 50,
    "final_score": 70
  }
]`,

  /**
   * Stage 6: Finalizing
   * 编写专家摘要和最终排名
   */
  finalizing: (opportunities: any[], direction: string) => `${AI_ROLE}

Generate an expert summary for "${direction}" based on ${opportunities.length} opportunities.

Your summary should include:
1. Industry structure assessment
2. Unmet user needs gaps
3. Core opportunity directions (top 3-5)
4. Risk considerations and challenges

Calculate and include:
- Premium ratio: percentage of opportunities with final_score > 80

Also provide a concise summary text (200-300 words) that captures the essence of the analysis.

Output as JSON:
{
  "summary_text": "Concise 200-300 word expert summary...",
  "industry_assessment": "Brief assessment of industry structure",
  "unmet_needs": ["need1", "need2"],
  "core_opportunities": ["opp1", "opp2", "opp3"],
  "risks": ["risk1", "risk2"],
  "premium_ratio": 0.0,
  "premium_count": 0
}`,
}

// Zod schemas for validation
export const OpportunitySchema = z.object({
  index_number: z.number(),
  name: z.string().min(1),
  core_users: z.string().min(1),
  pain_points: z.string().min(1),
  user_demands: z.string().min(1),
  ai_solution: z.string().min(1),
  category: z.string().optional(),
  inspiration_source: z.string().optional(),
  signal_count: z.number().min(3),
  monetization_score: z.number().min(0).max(100),
  industry_size_score: z.number().min(0).max(100),
  competition_score: z.number().min(0).max(100),
  mvp_difficulty_score: z.number().min(0).max(100),
  final_score: z.number().min(0).max(100),
})

export const UnderstandingOutputSchema = z.object({
  key_concepts: z.array(z.string()),
  target_users: z.array(z.string()),
  core_problems: z.array(z.string()),
  market_context: z.string(),
})

export const AnalyzingOutputSchema = z.object({
  industry_structure: z.string(),
  market_size: z.string(),
  key_players: z.array(z.string()),
  technology_trends: z.array(z.string()),
})

export const ScanningOutputSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  signals: z.array(z.object({
    source: z.string(),
    description: z.string(),
    urgency: z.enum(['high', 'medium', 'low']),
    keywords: z.array(z.string()),
  })),
  inspiration_sources: z.array(z.object({
    platform: z.string(),
    community: z.string(),
    pain_point: z.string(),
  })),
})

export const FinalizingOutputSchema = z.object({
  summary_text: z.string().min(200).max(500),
  industry_assessment: z.string(),
  unmet_needs: z.array(z.string()),
  core_opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  premium_ratio: z.number(),
  premium_count: z.number(),
})
```

---

## 3. Redis 配置

创建文件 `/lib/redis.ts`：

```typescript
import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
})

// 连接测试
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis connection failed:', error)
    return false
  }
}

// 优雅关闭
export async function closeRedisConnection() {
  await redis.quit()
}
```

---

## 4. 任务队列 Worker

创建文件 `/lib/queue/worker.ts`：

```typescript
import { Worker, Job } from 'bullmq'
import { redis } from '../redis'
import { AIEngine } from '../ai/engine'
import { supabaseAdmin } from '../supabase'

const aiEngine = new AIEngine()

export interface AnalysisJobData {
  input: string
  taskId: string
  reportId: string
  userId: string
}

export const analysisWorker = new Worker<AnalysisJobData>(
  'analysis-queue',
  async (job: Job<AnalysisJobData>) => {
    const { input, taskId, reportId, userId } = job.data

    console.log(`Starting analysis job: ${taskId}`)

    try {
      // 标记任务为运行中
      await supabaseAdmin
        .from('tasks')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', taskId)

      // 执行 AI 分析
      await aiEngine.analyze(input, taskId, reportId)

      console.log(`Analysis job completed: ${taskId}`)
    } catch (error) {
      console.error(`Analysis job failed: ${taskId}`, error)

      // 标记任务为失败
      await supabaseAdmin
        .from('tasks')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', taskId)

      // 标记报告为失败
      await supabaseAdmin
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', reportId)

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 5, // 最大并发任务数
    attempts: 3,    // 最大重试次数
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  }
)

// Worker 事件监听
analysisWorker.on('completed', (job) => {
  console.log(`Job completed: ${job.id}`)
})

analysisWorker.on('failed', (job, err) => {
  console.error(`Job failed: ${job?.id}`, err.message)
})

analysisWorker.on('error', (err) => {
  console.error('Worker error:', err)
})

// 优雅关闭
process.on('SIGTERM', async () => {
  await analysisWorker.close()
})

process.on('SIGINT', async () => {
  await analysisWorker.close()
})
```

---

## 5. AI Engine 核心

创建文件 `/lib/ai/engine.ts`：

```typescript
import { getProviderForModel } from './providers/factory'
import { PROMPTS, OpportunitySchema, UnderstandingOutputSchema, AnalyzingOutputSchema, ScanningOutputSchema, FinalizingOutputSchema } from './prompts'
import { supabaseAdmin } from '../supabase'
import type { Message } from './providers/base'

export class AIEngine {
  /**
   * 执行完整的 6 阶段分析
   */
  async analyze(input: string, taskId: string, reportId: string) {
    const startTime = Date.now()
    const results: Record<string, any> = {}

    // Stage 1: Understanding
    await this.updateTaskStage(taskId, 'understanding')
    const understanding = await this.callAI(
      PROMPTS.understanding(input),
      { model: 'gpt-3.5-turbo' },
      UnderstandingOutputSchema
    )
    results.understanding = understanding
    await this.completeStage(taskId, 'understanding')

    // Stage 2: Analyzing
    await this.updateTaskStage(taskId, 'analyzing')
    const analysis = await this.callAI(
      PROMPTS.analyzing(JSON.stringify(understanding)),
      { model: 'gpt-3.5-turbo' },
      AnalyzingOutputSchema
    )
    results.analysis = analysis
    await this.completeStage(taskId, 'analyzing')

    // Stage 3: Scanning
    await this.updateTaskStage(taskId, 'scanning')
    const signals = await this.callAI(
      PROMPTS.scanning(input),
      { model: 'gpt-4' },
      ScanningOutputSchema
    )
    results.signals = signals
    await this.completeStage(taskId, 'scanning')

    // Stage 4: Generating (6 batches)
    await this.updateTaskStage(taskId, 'generating')
    const opportunities: any[] = []

    for (let batch = 1; batch <= 6; batch++) {
      const batchOpportunities = await this.callAI(
        PROMPTS.generating(batch, 6, input, JSON.stringify(signals)),
        { model: 'gpt-4', temperature: 0.8 },
        z.array(OpportunitySchema)
      )

      // 更新 index_number
      const indexed = batchOpportunities.map((opp: any, idx: number) => ({
        ...opp,
        index_number: (batch - 1) * 50 + idx + 1,
      }))

      opportunities.push(...indexed)
    }
    results.opportunities = opportunities
    await this.completeStage(taskId, 'generating')

    // Stage 5: Scoring
    await this.updateTaskStage(taskId, 'scoring')
    const scored = await this.callAI(
      PROMPTS.scoring(opportunities),
      { model: 'gpt-3.5-turbo' },
      z.array(OpportunitySchema)
    )
    results.scored = scored
    await this.completeStage(taskId, 'scoring')

    // Stage 6: Finalizing
    await this.updateTaskStage(taskId, 'finalizing')
    const finalData = await this.callAI(
      PROMPTS.finalizing(scored, input),
      { model: 'gpt-4' },
      FinalizingOutputSchema
    )
    results.finalizing = finalData

    // 保存机会到数据库
    await this.saveOpportunities(reportId, scored)

    // 更新报告
    const analysisTime = Math.floor((Date.now() - startTime) / 1000)

    // 计算 premium_ratio
    const premiumCount = scored.filter((o: any) => o.final_score > 80).length
    const premiumRatio = premiumCount / scored.length

    await supabaseAdmin
      .from('reports')
      .update({
        status: 'completed',
        summary_text: finalData.summary_text,
        premium_ratio: premiumRatio,
        analysis_time_sec: analysisTime,
      })
      .eq('id', reportId)

    // 更新任务状态
    await supabaseAdmin
      .from('tasks')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', taskId)

    await this.completeStage(taskId, 'finalizing')

    return results
  }

  /**
   * 调用 AI 模型
   */
  private async callAI<T>(
    prompt: string,
    options: { model?: string; temperature?: number },
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const model = options.model || 'gpt-4'
    const provider = getProviderForModel(model)

    const messages: Message[] = [
      { role: 'system', content: 'You are a helpful AI assistant. Always respond with valid JSON.' },
      { role: 'user', content: prompt },
    ]

    const response = await provider.chat(messages, {
      model,
      temperature: options.temperature ?? 0.7,
      maxTokens: 4096,
    })

    // 解析 JSON
    let jsonContent: any
    try {
      // 提取 JSON（处理可能的 markdown 代码块）
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, response.content]

      jsonContent = JSON.parse(jsonMatch[1] || response.content)
    } catch (error) {
      console.error('Failed to parse AI response:', response.content)
      throw new Error('Invalid AI response format')
    }

    // 验证 schema
    try {
      return schema.parse(jsonContent)
    } catch (error) {
      console.error('Validation error:', error)
      console.error('Invalid data:', jsonContent)
      throw new Error('AI response validation failed')
    }
  }

  /**
   * 更新任务当前阶段
   */
  private async updateTaskStage(taskId: string, stage: string) {
    await supabaseAdmin
      .from('tasks')
      .update({
        current_stage: stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  }

  /**
   * 标记阶段完成
   */
  private async completeStage(taskId: string, stage: string) {
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('stages_completed')
      .eq('id', taskId)
      .single()

    const stagesCompleted = [...(task?.stages_completed || []), stage]

    await supabaseAdmin
      .from('tasks')
      .update({
        stages_completed: stagesCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  }

  /**
   * 保存机会到数据库
   */
  private async saveOpportunities(reportId: string, opportunities: any[]) {
    const toInsert = opportunities.map((opp) => ({
      report_id: reportId,
      index_number: opp.index_number,
      name: opp.name,
      core_users: opp.core_users,
      pain_points: opp.pain_points,
      user_demands: opp.user_demands,
      ai_solution: opp.ai_solution,
      category: opp.category,
      inspiration_source: opp.inspiration_source,
      signal_count: opp.signal_count,
      monetization_score: opp.monetization_score,
      industry_size_score: opp.industry_size_score,
      competition_score: opp.competition_score,
      mvp_difficulty_score: opp.mvp_difficulty_score,
      final_score: opp.final_score,
    }))

    const { error } = await supabaseAdmin
      .from('opportunities')
      .insert(toInsert)

    if (error) {
      console.error('Failed to save opportunities:', error)
      throw error
    }
  }
}
```

---

## 6. AI Service

创建文件 `/lib/ai/service.ts`：

```typescript
import { Queue } from 'bullmq'
import { redis } from '../redis'
import { supabaseAdmin } from '../supabase'
import type { AnalysisJobData } from '../queue/worker'

const analysisQueue = new Queue<AnalysisJobData>('analysis-queue', {
  connection: redis,
})

export class AIService {
  /**
   * 开始新的分析
   */
  async startAnalysis(input: string, userId: string) {
    // 检查并发任务限制
    const { data: runningTask } = await supabaseAdmin
      .from('tasks')
      .select('id, report_id')
      .eq('user_id', userId)
      .eq('status', 'running')
      .single()

    if (runningTask) {
      throw new Error('CONCURRENT_TASK_LIMIT')
    }

    // 创建报告
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id: userId,
        input_text: input,
        status: 'generating',
      })
      .select()
      .single()

    if (reportError) {
      console.error('Failed to create report:', reportError)
      throw new Error('Failed to create report')
    }

    // 创建任务
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert({
        user_id: userId,
        report_id: report.id,
        status: 'pending',
        current_stage: 'understanding',
      })
      .select()
      .single()

    if (taskError) {
      console.error('Failed to create task:', taskError)
      // 回滚报告
      await supabaseAdmin.from('reports').delete().eq('id', report.id)
      throw new Error('Failed to create task')
    }

    // 添加到队列
    await analysisQueue.add(
      'analyze',
      {
        input,
        taskId: task.id,
        reportId: report.id,
        userId,
      },
      {
        jobId: task.id,
        timeout: 10 * 60 * 1000, // 10 分钟超时
      }
    )

    return {
      taskId: task.id,
      reportId: report.id,
    }
  }
}

export const aiService = new AIService()
```

---

## 验收标准

- [ ] AI Pipeline 各阶段正常执行
- [ ] 多模型切换功能正常（OpenAI, Anthropic）
- [ ] 成功生成 300 个机会
- [ ] 评分逻辑正确（5 维度）
- [ ] 专家摘要质量达标（200-300 字）
- [ ] 任务状态实时更新到 Supabase
- [ ] BullMQ 队列正常工作
- [ ] 超时和重试机制生效
- [ ] Prompt 符合 InsightPrompt.md 要求
- [ ] 数据验证正确（Zod schemas）

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `/lib/ai/providers/base.ts` | AI Provider 基类 |
| `/lib/ai/providers/openai.ts` | OpenAI Provider |
| `/lib/ai/providers/anthropic.ts` | Anthropic Provider |
| `/lib/ai/providers/factory.ts` | Provider 工厂 |
| `/lib/ai/prompts.ts` | Prompt 模板和验证 schemas |
| `/lib/ai/engine.ts` | AI 引擎核心 |
| `/lib/ai/service.ts` | AI 服务类 |
| `/lib/queue/worker.ts` | 队列 worker |
| `/lib/redis.ts` | Redis 配置 |

---

## 下一步

完成此阶段后，进入 **阶段 5: 前端集成和实时更新**。
