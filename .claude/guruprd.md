# GuruBox.ai – AI Product Insight PRD v1.2 (Final)

# 1. Product Vision

**GuruBox.ai** 是一个 AI 专家级工具箱平台（AI Expert Toolbox）。

首个工具 **AI Product Insight** 用于从用户输入方向生成 **专家级 AI 产品机会分析报告（300条机会 + 专家Summary）**。

核心定位：

```
Expert AI Product Research Tool
```

核心价值：

* 专家级行业洞察
* 高密度机会输出
* 可沉淀知识资产
* 可扩展工具平台

核心指标：

```
300 opportunities / report
20 opportunities per page
30s–5min runtime
50 concurrent tasks
```

支持能力：

* Google Login
* 多语言支持
* 永久保存报告
* Google Docs导出
* PDF导出

支持语言：

```
English（Default）
中文
Deutsch
Français
Italiano
Español
Português
```

任务限制：

```
每用户最多1个运行任务
```

报告数据：

```
永久保存
用户可删除
```

---

# 2. Product Experience

设计目标：

```
Professional
Futuristic
Effortless
Expert-level
```

核心用户路径：

```
Input → Analyze → Insight → Export → Reuse
```

体验原则：

* 用户只需要输入方向
* 系统自动完成复杂分析
* 输出专家级结果
* 报告可长期复用

体验特征：

```
Minimal Input
Deep Insight
High Density Output
Persistent Knowledge
```

---

# 2.1 Visual & Motion Design Principles

GuruBox.ai 必须体现 **专家级 AI 工具气质**。

整体视觉风格：

```
Clean
Premium
Futuristic
Professional
```

设计参考：

* Linear
* Vercel
* Perplexity

避免：

```
Neon风格
强烈对比色
复杂粒子动画
高频动画
视觉噪音
```

---

## 背景动效（确定方案）

采用：

### Slow Gradient Motion（方案A）

特征：

```
渐变缓慢流动
周期10–30秒
低对比度
柔和颜色
```

设计目标：

```
静态看干净
动态有生命力
长期使用不疲劳
```

要求：

```
不可花哨
不可吸引注意力
不可干扰阅读
```

技术要求：

```
GPU加速
60FPS
```

移动端：

```
自动关闭背景动画
```

---

## 页面动效要求

### 输入框动效

Focus时：

```
Soft glow
Smooth border animation
```

目标：

```
高级工具感
```

---

### 按钮动效

Hover：

```
Subtle glow
Gradient shift
```

Click：

```
Soft compression
```

禁止：

```
弹跳效果
剧烈变化
```

---

### 表格动效

分页：

```
Smooth transition
```

行加载：

```
Fade-in
150–250ms
```

Hover：

```
Row highlight
```

---

## Analysis Loading动效

Analysis Page必须有高级Loading动效。

推荐：

```
Signal scanning style animation
```

例如：

* 微粒扫描
* 线性流动
* 数据扫描感

禁止：

```
普通Spinner
```

原因：

```
这是产品核心价值展示阶段
```

---

# 3. Navigation

顶部导航：

```
GuruBox

Tools

Account
```

说明：

* 当前只有一个Tool
* Tools页面使用Hero布局
* History在Account内部

---

## Language Switch

位置：

```
Account Dropdown Top
```

默认：

```
English
```

切换：

```
即时生效
无需刷新
```

---

# 4. Pages

---

# 4.1 Tool Page

路径：

```
/tools/product-insight
```

用途：

产品核心入口。

采用：

```
Hero Tool Layout
```

避免单Tool页面空洞。

---

## Hero区

显示：

```
AI Product Insight

Expert-level AI opportunity discovery.
```

按钮：

```
Start Analysis
```

---

## 输入区

Single Input Box。

支持：

* 自然语言
* 多字段描述

例如：

```
AI tools for freelancers in India
```

系统自动语义理解。

---

## Suggestions

显示3–6个默认建议：

```
AI tools for freelancers

AI SaaS opportunities

AI video products

AI productivity tools

AI tools for small businesses
```

点击自动填充。

---

## 登录行为

未登录点击Start：

弹出：

```
Login with Google required
```

---

# 4.2 Analysis Page

路径：

```
/analysis/{task_id}
```

用途：

显示AI分析进度。

无百分比。

仅步骤。

---

## Steps

显示：

```
Understanding idea

Analyzing markets

Scanning signals

Generating opportunities

Scoring opportunities

Finalizing report
```

---

## 任务规则

每用户：

```
最多1个运行任务
```

否则提示：

```
You already have an analysis running.
Go to current analysis.
```

---

## Resume机制

刷新：

```
恢复任务
```

重新登录：

```
恢复任务
```

---

# 4.3 Report Page

路径：

```
/report/{report_id}
```

用途：

展示分析报告。

---

## Expert Summary

专家视角分析。

内容包括：

* 行业结构判断
* 用户需求缺口
* 核心机会方向
* 风险提示

风格：

```
Experienced industry expert
```

用于：

* 页面
* PDF
* Google Docs

---

## Analysis Info

显示：

```
Analysis Time

Total Opportunities: 300

Premium Ratio
```

Premium定义：

```
FinalScore > 80
```

---

## Opportunities Table

分页：

```
20条/页
300总数
```

---

### 展示列

```
#

Opportunity Name

Core Users

Pain Points

User Demands

AI Solution

Final Score
```

---

### 隐藏列（导出包含）

```
Category

Inspiration Source

Signal Count

Monetization Score

Industry Size Score

Competition Score

MVP Difficulty Score
```

---

## 操作按钮

```
Export PDF

Export Google Docs

Delete Report
```

删除：

```
软删除
```

---

# 4.4 Account Page

路径：

```
/account
```

---

## 用户信息

显示：

```
Avatar

Name

Email
```

---

## Language Switch

支持：

```
EN
ZH
DE
FR
IT
ES
PT
```

默认：

```
EN
```

---

## Analysis History

字段：

```
Report Name

Input Direction

Created Time

Total Opportunities

Top Score

Status
```

操作：

```
Open

Export

Delete
```

---

# 4.5 Privacy Page

# 4.6 Terms Page

# 5. System Design

---

## Architecture

GuruBox采用：

```
Tool-based Architecture
```

结构：

```
GuruBox

 Tools

  product-insight
```

API结构：

```
/api/v1/tools/{tool_id}
```

支持未来工具扩展。

---

## AI Pipeline

单任务流程：

---

### Stage1

Idea Understanding

模型：

```
Low-cost model
```

输出：

* 行业理解
* 用户意图

---

### Stage2

Market Analysis

输出：

* 行业结构
* 市场空间

---

### Stage3

Signal Mining

输出：

* 灵感来源
* 社区信号

---

### Stage4

Opportunity Generation

分批生成：

```
1–50
51–100
101–150
151–200
201–250
251–300
```

目的：

```
控制Token成本
提高稳定性
```

---

### Stage5

Expert Summary

生成专家级报告总结。

用于：

```
Summary
PDF
Docs
```

---

### Stage6

Finalize

计算：

```
Premium Ratio
```

保存数据。

---

## API

Create Task

```
POST /api/v1/tools/product-insight/tasks
```

---

Task Status

```
GET /api/v1/tasks/{task_id}
```

---

Get Report

```
GET /api/v1/reports/{report_id}
```

---

Get Opportunities

```
GET /api/v1/reports/{report_id}/opportunities
?page=1
size=20
```

---

Delete Report

```
DELETE /api/v1/reports/{report_id}
```

---

Export PDF

```
POST /api/v1/reports/{report_id}/export/pdf
```

---

Export Google Docs

```
POST /api/v1/reports/{report_id}/export/gdocs
```

---

## Data Model

Users

```
id
google_id
email
name
avatar
language
created_at
```

---

Reports

```
id
user_id
input_text
status
analysis_time_sec
total_opportunities
premium_ratio
summary_text
created_at
is_deleted
```

---

Tasks

```
id
user_id
report_id
status
current_stage
created_at
```

---

Opportunities

```
id
report_id
index_number
name
core_users
pain_points
user_demands
ai_solution

category
inspiration_source
signal_count

monetization_score
industry_size_score
competition_score
mvp_difficulty_score

final_score
```

---

Prompt Templates

```
id
tool_id
version
prompt_text
model
is_active
```

支持：

```
Prompt动态配置
Prompt版本管理
```

---

Model Config

```
id
model_name
provider
stage
is_active
```

支持：

```
多模型策略
成本控制
```

---

# 6. Reliability

并发能力：

```
50任务
```

队列：

```
Redis Worker Queue
```

---

自动重试：

```
最多3次
```

---

Timeout：

```
10分钟
```

---

性能目标：

```
分页查询 <200ms

报告加载 <1秒
```