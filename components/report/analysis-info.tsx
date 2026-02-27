"use client"

import { useEffect, useState } from "react"
import { Clock, Target, Award } from "lucide-react"
import { useI18n } from "@/components/i18n/i18n-provider"

interface AnalysisInfoProps {
  analysisTimeSec: number
  totalOpportunities: number
  premiumRatio: number
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 800
    const start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  return (
    <span className="count-animate text-2xl font-bold text-foreground tabular-nums">
      {display}{suffix}
    </span>
  )
}

export function AnalysisInfo({ analysisTimeSec, totalOpportunities, premiumRatio }: AnalysisInfoProps) {
  const { t } = useI18n()

  const minutes = Math.floor(analysisTimeSec / 60)
  const seconds = analysisTimeSec % 60
  const timeStr = `${minutes}m ${seconds.toString().padStart(2, "0")}s`
  const ratioStr = `${Math.round(premiumRatio * 100)}%`

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("report_analysis_time")}</p>
          <p className="count-animate text-lg font-bold text-foreground tabular-nums">{timeStr}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Target className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("report_total_opportunities")}</p>
          <AnimatedNumber value={totalOpportunities} />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Award className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("report_premium_ratio")}</p>
          <AnimatedNumber value={Math.round(premiumRatio * 100)} suffix="%" />
        </div>
      </div>
    </div>
  )
}
