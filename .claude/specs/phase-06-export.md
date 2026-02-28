# Phase 6: 导出功能 (Export Features)

**负责 Agent**: Export Agent
**预计时间**: 3-4 天
**依赖**: 阶段 3, 阶段 5
**关联页面**: `/report/[report_id]`

---

## 目标

实现 PDF 和 Google Docs 导出功能，包括报告内容格式化、样式设计和大量数据导出优化。

---

## 实现功能

1. **PDF 导出**: 生成包含完整报告的可下载 PDF 文件
2. **Google Docs 导出**: 创建 Google Docs 文档并返回共享链接
3. **导出内容格式化**: 专业报告样式，包括摘要、统计、机会表格
4. **大量数据优化**: 高效处理 300+ 机会数据的导出

---

## 1. PDF 生成器

创建文件 `/lib/export/pdf-generator.ts`：

```typescript
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFDownloadOptions,
  pdf,
} from '@react-pdf/renderer'
import { supabaseAdmin } from '../supabase'

// 注册字体（可选，使用系统字体）
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff',
      fontWeight: 600,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: '#1f2937',
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: '#374151',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    width: '30%',
    padding: 12,
    marginRight: '3%',
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1f2937',
  },
  table: {
    width: '100%',
    marginBottom: 12,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    flexDirection: 'row',
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 600,
    fontSize: 9,
    color: '#1f2937',
  },
  tableRow: {
    padding: 8,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  cellNumber: { flex: 0.3 },
  cellName: { flex: 2 },
  cellScore: { flex: 0.5 },
  cellCategory: { flex: 0.8 },
  cellSignals: { flex: 0.4 },
  premiumBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: 2,
    borderRadius: 2,
    fontSize: 8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
})

interface ReportData {
  id: string
  input_text: string
  status: string
  analysis_time_sec: number
  total_opportunities: number
  premium_ratio: number
  summary_text: string
  created_at: string
}

interface Opportunity {
  index_number: number
  name: string
  core_users: string
  pain_points: string
  user_demands: string
  ai_solution: string
  category: string
  inspiration_source: string
  signal_count: number
  monetization_score: number
  industry_size_score: number
  competition_score: number
  mvp_difficulty_score: number
  final_score: number
}

interface ReportDocumentProps {
  report: ReportData
  opportunities: Opportunity[]
}

/**
 * PDF 文档组件
 */
function ReportDocument({ report, opportunities }: ReportDocumentProps) {
  const premiumCount = Math.round(report.premium_ratio * report.total_opportunities)
  const analysisMinutes = Math.round(report.analysis_time_sec / 60)

  return (
    <Document>
      {/* 封面页 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Product Insight Report</Text>
          <Text style={styles.subtitle}>
            {new Date(report.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Direction</Text>
          <Text style={styles.summaryText}>{report.input_text}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Opportunities</Text>
            <Text style={styles.statValue}>{report.total_opportunities}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Premium Opportunities</Text>
            <Text style={styles.statValue}>{premiumCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Analysis Time</Text>
            <Text style={styles.statValue}>{analysisMinutes}m</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.summaryText}>{report.summary_text}</Text>
        </View>
      </Page>

      {/* 机会列表页 */}
      {opportunities.map((opp, idx) => (
        <Page key={`opp-${idx}`} size="A4" style={styles.page}>
          {/* 页眉 */}
          <View style={styles.header}>
            <Text style={{ fontSize: 14, fontWeight: 600 }}>Opportunities</Text>
            <Text style={styles.subtitle}>Page {Math.floor(idx / 25) + 2}</Text>
          </View>

          {/* 机会列表 */}
          {opportunities.slice(idx, idx + 25).map((opportunity) => (
            <View key={opportunity.id} style={styles.section}>
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>{opportunity.index_number}. {opportunity.name}</Text>
                  {opportunity.final_score > 80 && (
                    <View style={styles.premiumBadge}>
                      <Text>Premium</Text>
                    </View>
                  )}
                </View>
                {opportunity.category && (
                  <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{opportunity.category}</Text>
                )}
              </View>

              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: 600, color: '#6b7280' }}>Core Users:</Text>
                <Text style={{ fontSize: 9 }}>{opportunity.core_users}</Text>
              </View>

              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: 600, color: '#6b7280' }}>Pain Points:</Text>
                <Text style={{ fontSize: 9 }}>{opportunity.pain_points}</Text>
              </View>

              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: 600, color: '#6b7280' }}>AI Solution:</Text>
                <Text style={{ fontSize: 9 }}>{opportunity.ai_solution}</Text>
              </View>

              {opportunity.inspiration_source && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: 600, color: '#6b7280' }}>Inspiration:</Text>
                  <Text style={{ fontSize: 9 }}>{opportunity.inspiration_source}</Text>
                </View>
              )}

              {/* 评分 */}
              <View style={{ flexDirection: 'row', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>Monetization</Text>
                  <Text style={{ fontSize: 10, fontWeight: 600 }}>{opportunity.monetization_score}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>Market Size</Text>
                  <Text style={{ fontSize: 10, fontWeight: 600 }}>{opportunity.industry_size_score}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>Competition</Text>
                  <Text style={{ fontSize: 10, fontWeight: 600 }}>{opportunity.competition_score}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>MVP Difficulty</Text>
                  <Text style={{ fontSize: 10, fontWeight: 600 }}>{opportunity.mvp_difficulty_score}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>Final Score</Text>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: opportunity.final_score > 80 ? '#92400e' : '#1f2937' }}>
                    {opportunity.final_score}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} fixed />
        </Page>
      ))}
    </Document>
  )
}

/**
 * 生成 PDF
 */
export async function generatePDF(reportId: string): Promise<Buffer> {
  // 获取报告数据
  const { data: report, error: reportError } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (reportError || !report) {
    throw new Error('Report not found')
  }

  // 获取所有机会（不分页）
  const { data: opportunities, error: oppsError } = await supabaseAdmin
    .from('opportunities')
    .select('*')
    .eq('report_id', reportId)
    .order('final_score', { ascending: false })

  if (oppsError || !opportunities) {
    throw new Error('Failed to fetch opportunities')
  }

  // 生成 PDF
  const blob = await pdf(
    <ReportDocument report={report} opportunities={opportunities} />
  ).toBuffer()

  return Buffer.from(blob)
}

/**
 * 生成 PDF 下载选项
 */
export function getPDFDownloadOptions(reportId: string): PDFDownloadOptions {
  const fileName = `gurubox-report-${reportId.slice(0, 8)}.pdf`

  return {
    filename: fileName,
  }
}
```

---

## 2. Google Docs 服务

创建文件 `/lib/export/gdocs-service.ts`：

```typescript
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import { supabaseAdmin } from '../supabase'

interface ReportData {
  id: string
  input_text: string
  summary_text: string
  premium_ratio: number
  total_opportunities: number
  analysis_time_sec: number
  created_at: string
}

interface Opportunity {
  index_number: number
  name: string
  core_users: string
  pain_points: string
  user_demands: string
  ai_solution: string
  category: string
  inspiration_source: string
  signal_count: number
  monetization_score: number
  industry_size_score: number
  competition_score: number
  mvp_difficulty_score: number
  final_score: number
}

/**
 * 获取认证客户端
 */
function getAuthClient() {
  const credentialsBase64 = process.env.GOOGLE_DOCS_CREDENTIALS

  if (!credentialsBase64) {
    throw new Error('GOOGLE_DOCS_CREDENTIALS not set')
  }

  const credentials = JSON.parse(
    Buffer.from(credentialsBase64, 'base64').toString('utf-8')
  )

  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'],
  })

  return auth
}

/**
 * 导出报告到 Google Docs
 */
export async function exportToGoogleDocs(reportId: string): Promise<{ documentId: string; url: string }> {
  const auth = getAuthClient()
  const docs = google.docs({ version: 'v1', auth })
  const drive = google.drive({ version: 'v3', auth })

  // 获取报告数据
  const { data: report, error: reportError } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (reportError || !report) {
    throw new Error('Report not found')
  }

  // 获取所有机会
  const { data: opportunities, error: oppsError } = await supabaseAdmin
    .from('opportunities')
    .select('*')
    .eq('report_id', reportId)
    .order('final_score', { ascending: false })

  if (oppsError || !opportunities) {
    throw new Error('Failed to fetch opportunities')
  }

  // 创建新文档
  const createdDoc = await docs.documents.create({
    requestBody: {
      title: `GuruBox Report: ${report.input_text.slice(0, 50)}...`,
    },
  })

  const documentId = createdDoc.data.documentId!
  const requests: any[] = []

  // 删除默认段落
  requests.push({
    deleteContentRange: {
      range: {
        startIndex: 1,
        endIndex: 2,
      },
    },
  })

  // 添加标题
  requests.push({
    insertText: {
      location: { index: 1 },
      text: 'AI Product Insight Report\n',
    },
  })
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: 1, endIndex: 25 },
      paragraphStyle: {
        namedStyleType: 'HEADING_1',
        alignment: 'CENTER',
      },
      fields: 'namedStyleType,alignment',
    },
  })

  // 添加日期
  let currentIndex = 25
  const dateString = new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: `${dateString}\n\n`,
    },
  })
  currentIndex += dateString.length + 2

  // 添加分析方向
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: 'Analysis Direction\n',
    },
  })
  currentIndex += 19
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: currentIndex - 19, endIndex: currentIndex },
      paragraphStyle: { namedStyleType: 'HEADING_2' },
      fields: 'namedStyleType',
    },
  })
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: `${report.input_text}\n\n`,
    },
  })
  currentIndex += report.input_text.length + 2

  // 添加统计
  const premiumCount = Math.round(report.premium_ratio * report.total_opportunities)
  const analysisMinutes = Math.round(report.analysis_time_sec / 60)

  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: `Statistics\n`,
    },
  })
  currentIndex += 11
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: currentIndex - 11, endIndex: currentIndex },
      paragraphStyle: { namedStyleType: 'HEADING_2' },
      fields: 'namedStyleType',
    },
  })
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: `• Total Opportunities: ${report.total_opportunities}\n`,
    },
  })
  currentIndex += `• Total Opportunities: ${report.total_opportunities}\n`.length
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: `• Premium Opportunities: ${premiumCount} (${Math.round(report.premium_ratio * 100)}%)\n`,
    },
  })
  currentIndex += `• Premium Opportunities: ${premiumCount} (${Math.round(report.premium_ratio * 100)}%)\n`.length
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: `• Analysis Time: ${analysisMinutes} minutes\n\n`,
    },
  })
  currentIndex += `• Analysis Time: ${analysisMinutes} minutes\n\n`.length

  // 添加专家摘要
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: 'Executive Summary\n',
    },
  })
  currentIndex += 18
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: currentIndex - 18, endIndex: currentIndex },
      paragraphStyle: { namedStyleType: 'HEADING_2' },
      fields: 'namedStyleType',
    },
  })
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: `${report.summary_text}\n\n`,
    },
  })
  currentIndex += report.summary_text.length + 2

  // 添加机会表格
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: 'Opportunities\n\n',
    },
  })
  currentIndex += 15
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: currentIndex - 15, endIndex: currentIndex },
      paragraphStyle: { namedStyleType: 'HEADING_2' },
      fields: 'namedStyleType',
    },
  })

  // 添加机会列表
  opportunities.forEach((opp) => {
    const isPremium = opp.final_score > 80

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `${opp.index_number}. ${opp.name}`,
      },
    })

    if (isPremium) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: currentIndex, endIndex: currentIndex + `${opp.index_number}. ${opp.name}`.length },
          textStyle: {
            bold: true,
            foregroundColor: { color: { rgbColor: { red: 0.6, green: 0.3, blue: 0 } } },
          },
          fields: 'bold,foregroundColor',
        },
      })
    }

    currentIndex += `${opp.index_number}. ${opp.name}`.length

    if (opp.category) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: ` (${opp.category})`,
        },
      })
      currentIndex += ` (${opp.category})`.length
    }

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `\n`,
      },
    })
    currentIndex += 1

    if (opp.core_users) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `   Core Users: ${opp.core_users}\n`,
        },
      })
      currentIndex += `   Core Users: ${opp.core_users}\n`.length
    }

    if (opp.pain_points) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `   Pain Points: ${opp.pain_points}\n`,
        },
      })
      currentIndex += `   Pain Points: ${opp.pain_points}\n`.length
    }

    if (opp.ai_solution) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `   AI Solution: ${opp.ai_solution}\n`,
        },
      })
      currentIndex += `   AI Solution: ${opp.ai_solution}\n`.length
    }

    if (opp.inspiration_source) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `   Inspiration: ${opp.inspiration_source}\n`,
        },
      })
      currentIndex += `   Inspiration: ${opp.inspiration_source}\n`.length
    }

    // 评分
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `   Scores: Monetization ${opp.monetization_score} | Market Size ${opp.industry_size_score} | Competition ${opp.competition_score} | MVP Difficulty ${opp.mvp_difficulty_score} | Final: ${opp.final_score}\n\n`,
      },
    })
    currentIndex += `   Scores: Monetization ${opp.monetization_score} | Market Size ${opp.industry_size_score} | Competition ${opp.competition_score} | MVP Difficulty ${opp.mvp_difficulty_score} | Final: ${opp.final_score}\n\n`.length
  })

  // 批量执行请求
  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  })

  // 设置共享权限（任何人可查看）
  await drive.permissions.create({
    fileId: documentId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  // 生成分享链接
  const url = `https://docs.google.com/document/d/${documentId}/edit`

  return { documentId, url }
}
```

---

## 3. 更新 API 路由

更新文件 `/app/api/v1/reports/[report_id]/export/pdf/route.ts`：

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { generatePDF } from '@/lib/export/pdf-generator'

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

    // 生成 PDF
    const pdfBuffer = await generatePDF(params.report_id)

    // 返回 PDF 文件
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gurubox-report-${params.report_id.slice(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export PDF error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate PDF',
        },
      },
      { status: 500 }
    )
  }
}
```

更新文件 `/app/api/v1/reports/[report_id]/export/gdocs/route.ts`：

```typescript
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { exportToGoogleDocs } from '@/lib/export/gdocs-service'

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

    // 导出到 Google Docs
    const { documentId, url } = await exportToGoogleDocs(params.report_id)

    return NextResponse.json({
      data: {
        document_id: documentId,
        url,
      },
    })
  } catch (error) {
    console.error('Export GDocs error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export to Google Docs',
        },
      },
      { status: 500 }
    )
  }
}
```

---

## 4. 更新 ExportButtons 组件

更新文件 `/components/report/export-buttons.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, Download, Loader2, FileDown } from 'lucide-react'
import { api, ApiError } from '@/lib/api/client'
import { toast } from 'sonner'

interface ExportButtonsProps {
  reportId: string
}

export function ExportButtons({ reportId }: ExportButtonsProps) {
  const [loading, setLoading] = useState<'pdf' | 'gdocs' | null>(null)

  async function handleExportPDF() {
    setLoading('pdf')

    try {
      const response = await fetch(`/api/v1/reports/${reportId}/export/pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to generate PDF')
      }

      // 下载文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gurubox-report-${reportId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('PDF downloaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export PDF')
    } finally {
      setLoading(null)
    }
  }

  async function handleExportGDocs() {
    setLoading('gdocs')

    try {
      const response = await api.post<{ url: string }>(
        `/reports/${reportId}/export/gdocs`
      )

      // 打开 Google Docs
      window.open(response.url, '_blank')

      toast.success('Google Docs created')
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to export to Google Docs')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading !== null}>
          {loading === 'pdf' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : loading === 'gdocs' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Docs...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF} disabled={loading !== null}>
          <FileDown className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportGDocs} disabled={loading !== null}>
          <Download className="mr-2 h-4 w-4" />
          Export to Google Docs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 验收标准

- [ ] PDF 导出正常工作，样式符合设计
- [ ] PDF 包含完整的报告内容（摘要、统计、机会列表）
- [ ] Google Docs 导出正常工作
- [ ] Google Docs 返回正确的分享链接
- [ ] 导出内容完整准确
- [ ] 用户体验流畅（加载状态、错误处理）
- [ ] 文件命名正确
- [ ] 大量数据导出优化（300+ 机会）

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `/lib/export/pdf-generator.ts` | PDF 生成器 |
| `/lib/export/gdocs-service.ts` | Google Docs 服务 |
| `/app/api/v1/reports/[report_id]/export/pdf/route.ts` | PDF 导出路由 |
| `/app/api/v1/reports/[report_id]/export/gdocs/route.ts` | Google Docs 导出路由 |
| `/components/report/export-buttons.tsx` | 导出按钮组件 |

---

## 常见问题

### Q: PDF 生成很慢
**A**: 对于 300 个机会，PDF 生成需要较长时间。考虑添加后台任务或分页导出。

### Q: Google Docs 权限错误
**A**: 确保服务账号具有 Documents 和 Drive API 权限，并且已在 Google Cloud Console 中启用这些 API。

### Q: 中文字符在 PDF 中显示不正确
**A**: 注册支持中文的字体，如 Noto Sans SC。

---

## 下一步

完成此阶段后，进入 **阶段 7: 优化和测试**。
