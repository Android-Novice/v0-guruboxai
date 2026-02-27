"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useI18n } from "@/components/i18n/i18n-provider"
import { LoginDialog } from "@/components/auth/login-dialog"
import { Button } from "@/components/ui/button"
import { SUGGESTIONS } from "@/lib/constants"
import type { Report, Task } from "@/lib/types"
import Link from "next/link"

export function InputSection() {
  const [input, setInput] = useState("")
  const [showLogin, setShowLogin] = useState(false)
  const [pendingStart, setPendingStart] = useState(false)
  const { isLoggedIn, runningTask, addReport, addTask } = useAuth()
  const { t } = useI18n()
  const router = useRouter()

  const createAnalysis = useCallback(() => {
    if (!input.trim()) return

    const taskId = `task_${Date.now()}`
    const reportId = `report_${Date.now()}`

    const newReport: Report = {
      id: reportId,
      user_id: "user_001",
      input_text: input.trim(),
      status: "generating",
      analysis_time_sec: 0,
      total_opportunities: 0,
      premium_ratio: 0,
      summary_text: "",
      created_at: new Date().toISOString(),
      is_deleted: false,
    }

    const newTask: Task = {
      id: taskId,
      user_id: "user_001",
      report_id: reportId,
      status: "running",
      current_stage: "understanding",
      stages_completed: [],
      created_at: new Date().toISOString(),
    }

    addReport(newReport)
    addTask(newTask)

    // Store task/report relationship for the analysis page
    localStorage.setItem(`gurubox_task_${taskId}`, JSON.stringify({
      taskId,
      reportId,
      inputText: input.trim(),
    }))

    router.push(`/analysis/${taskId}`)
  }, [input, addReport, addTask, router])

  const handleStart = () => {
    if (!input.trim()) return

    if (!isLoggedIn) {
      setPendingStart(true)
      setShowLogin(true)
      return
    }

    if (runningTask) return

    createAnalysis()
  }

  const handleLoginSuccess = () => {
    if (pendingStart) {
      setPendingStart(false)
      // Delay to let auth state propagate
      setTimeout(() => {
        createAnalysis()
      }, 100)
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 page-fade">
      {/* Input area */}
      <div className="input-glow rounded-xl border border-border bg-card p-1 transition-all duration-300">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("tool_placeholder")}
          rows={3}
          className="w-full resize-none rounded-lg bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
        />
        <div className="flex items-center justify-end px-2 pb-2">
          <Button
            onClick={handleStart}
            disabled={!input.trim()}
            className="btn-glow gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {t("tool_start")}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Running task warning */}
      {isLoggedIn && runningTask && (
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          {t("tool_running_task")}{" "}
          <Link
            href={`/analysis/${runningTask.id}`}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {t("tool_go_to_analysis")}
          </Link>
        </div>
      )}

      {/* Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <LoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
