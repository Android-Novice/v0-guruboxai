"use client"

import { useParams } from "next/navigation"
import { useMemo, useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useI18n } from "@/components/i18n/i18n-provider"
import { ExpertSummary } from "@/components/report/expert-summary"
import { AnalysisInfo } from "@/components/report/analysis-info"
import { OpportunitiesTable } from "@/components/report/opportunities-table"
import { ExportButtons } from "@/components/report/export-buttons"
import { getOpportunitiesForReport } from "@/lib/mock-data"
import { TOTAL_OPPORTUNITIES } from "@/lib/constants"
import Link from "next/link"

export default function ReportPage() {
  const params = useParams()
  const reportId = params.report_id as string
  const { getReport, reports } = useAuth()
  const { t } = useI18n()
  const [ready, setReady] = useState(false)

  const report = getReport(reportId)

  // Check if report was just completed from analysis
  const reportReady = typeof window !== "undefined"
    ? localStorage.getItem(`gurubox_report_ready_${reportId}`)
    : null

  // Update report data from analysis completion
  useEffect(() => {
    if (reportReady && report && report.status === "generating") {
      const data = JSON.parse(reportReady)
      // Report will be updated via the auth provider
      // For now, we'll use the localStorage data
    }
    setReady(true)
  }, [reportReady, report])

  const opportunities = useMemo(() => getOpportunitiesForReport(reportId), [reportId])

  const premiumCount = useMemo(
    () => opportunities.filter((o) => o.final_score >= 80).length,
    [opportunities]
  )

  const premiumRatio = opportunities.length > 0 ? premiumCount / opportunities.length : 0

  // Build summary and time from report or from localStorage
  const summaryText = report?.summary_text || (reportReady ? JSON.parse(reportReady).summaryText : "")
  const analysisTime = report?.analysis_time_sec || (reportReady ? JSON.parse(reportReady).analysisTimeSec : 0)
  const inputText = report?.input_text || (reportReady ? JSON.parse(reportReady).inputText : "")

  if (!ready) return null

  if (!report && !reportReady) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Report not found.</p>
        <Link href="/tools/product-insight" className="text-primary underline underline-offset-4">
          Back to Tools
        </Link>
      </div>
    )
  }

  if (report?.is_deleted) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">This report has been deleted.</p>
        <Link href="/account" className="text-primary underline underline-offset-4">
          Back to Account
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 page-fade">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t("report_title")}
          </h1>
          {inputText && (
            <p className="mt-1 text-sm text-muted-foreground">{inputText}</p>
          )}
        </div>

        {/* Expert Summary */}
        {summaryText && <ExpertSummary summary={summaryText} />}

        {/* Stats */}
        <AnalysisInfo
          analysisTimeSec={analysisTime || 155}
          totalOpportunities={opportunities.length || TOTAL_OPPORTUNITIES}
          premiumRatio={premiumRatio}
        />

        {/* Export buttons */}
        <ExportButtons reportId={reportId} />

        {/* Opportunities table */}
        <OpportunitiesTable opportunities={opportunities} />
      </div>
    </div>
  )
}
