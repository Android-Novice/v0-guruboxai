"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useI18n } from "@/components/i18n/i18n-provider"
import { AnalysisSteps } from "@/components/analysis/analysis-steps"
import { ScanningAnimation } from "@/components/analysis/scanning-animation"
import { ANALYSIS_STAGES, STAGE_DURATION_MIN, STAGE_DURATION_MAX } from "@/lib/constants"
import type { AnalysisStage } from "@/lib/types"
import { getOpportunitiesForReport } from "@/lib/mock-data"

const EXPERT_SUMMARY = `## Industry Landscape

The market you've described shows strong signals of emerging demand with relatively low competitive density. Current AI adoption in this segment remains below 20%, creating substantial windows for first movers with differentiated solutions.

## Key Demand Gaps

Our analysis reveals three primary unmet needs: (1) affordable, domain-specific AI automation that reduces manual workload by 50%+, (2) intelligent decision-support tools that synthesize fragmented data sources into actionable insights, and (3) seamless integration layers that connect existing workflows without requiring technical expertise.

## Core Opportunity Directions

The highest-scoring opportunities cluster around **intelligent workflow automation** and **AI-powered analytics dashboards** — two areas where target users report spending 30-45% of their time on low-value repetitive tasks. Solutions combining these capabilities with mobile-first UX show the strongest product-market fit signals.

## Risk Considerations

Key risks include rapid platform commoditization as major AI providers expand their native toolsets, regulatory uncertainty around AI-generated outputs in professional contexts, and the ongoing challenge of achieving domain-specific accuracy without extensive proprietary training data.`

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.task_id as string
  const { getTask, updateTask, reports } = useAuth()
  const { t } = useI18n()

  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [completedStages, setCompletedStages] = useState<AnalysisStage[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const hasInitialized = useRef(false)

  // Get task info from localStorage
  const taskInfo = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(`gurubox_task_${taskId}`) ?? "{}")
    : {}

  const task = getTask(taskId)
  const currentStage = ANALYSIS_STAGES[currentStageIndex]?.id ?? "understanding"

  const advanceStage = useCallback(() => {
    setCurrentStageIndex((prev) => {
      const next = prev + 1
      const completedStageId = ANALYSIS_STAGES[prev]?.id
      if (completedStageId) {
        setCompletedStages((c) => [...c, completedStageId])
      }

      if (next >= ANALYSIS_STAGES.length) {
        setIsComplete(true)
        // Update task status
        if (taskId && taskInfo?.reportId) {
          const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
          // Generate opportunities for this report
          getOpportunitiesForReport(taskInfo.reportId)

          updateTask(taskId, {
            status: "completed",
            current_stage: "finalizing",
            stages_completed: ANALYSIS_STAGES.map((s) => s.id),
          })

          // Update report via a localStorage flag the report page can pick up
          localStorage.setItem(`gurubox_report_ready_${taskInfo.reportId}`, JSON.stringify({
            analysisTimeSec: elapsed,
            inputText: taskInfo.inputText,
            summaryText: EXPERT_SUMMARY,
          }))
        }
        return prev
      }
      return next
    })
  }, [taskId, taskInfo, updateTask])

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Check if this task was already complete
    if (task?.status === "completed") {
      setIsComplete(true)
      setCompletedStages(ANALYSIS_STAGES.map((s) => s.id))
      setCurrentStageIndex(ANALYSIS_STAGES.length - 1)
      return
    }

    // Restore saved progress
    const savedProgress = localStorage.getItem(`gurubox_analysis_progress_${taskId}`)
    if (savedProgress) {
      const progress = JSON.parse(savedProgress)
      setCurrentStageIndex(progress.currentStageIndex ?? 0)
      setCompletedStages(progress.completedStages ?? [])
      startTimeRef.current = progress.startTime ?? Date.now()
    } else {
      startTimeRef.current = Date.now()
    }
  }, [taskId, task?.status])

  // Auto-advance stages
  useEffect(() => {
    if (isComplete) return

    const duration = STAGE_DURATION_MIN + Math.random() * (STAGE_DURATION_MAX - STAGE_DURATION_MIN)

    timerRef.current = setTimeout(() => {
      advanceStage()
    }, duration)

    // Save progress
    localStorage.setItem(`gurubox_analysis_progress_${taskId}`, JSON.stringify({
      currentStageIndex,
      completedStages,
      startTime: startTimeRef.current,
    }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentStageIndex, isComplete, taskId, completedStages, advanceStage])

  // Auto-redirect on complete
  useEffect(() => {
    if (!isComplete || !taskInfo?.reportId) return

    const timer = setTimeout(() => {
      router.push(`/report/${taskInfo.reportId}`)
    }, 2000)

    return () => clearTimeout(timer)
  }, [isComplete, taskInfo?.reportId, router])

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16 page-fade">
      <div className="flex w-full max-w-lg flex-col gap-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {isComplete ? t("analysis_complete") : t("analysis_title")}
          </h1>
          {taskInfo?.inputText && (
            <p className="mt-2 text-sm text-muted-foreground truncate max-w-md mx-auto">
              {taskInfo.inputText}
            </p>
          )}
          {isComplete && (
            <p className="mt-2 text-sm text-primary">
              {t("analysis_redirecting")}
            </p>
          )}
        </div>

        {/* Scanning animation */}
        <ScanningAnimation isActive={!isComplete} />

        {/* Steps */}
        <AnalysisSteps
          currentStage={currentStage}
          completedStages={completedStages}
          isComplete={isComplete}
        />
      </div>
    </div>
  )
}
