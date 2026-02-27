"use client"

import { Check } from "lucide-react"
import { useI18n } from "@/components/i18n/i18n-provider"
import { ANALYSIS_STAGES } from "@/lib/constants"
import type { AnalysisStage } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { TranslationKeys } from "@/lib/translations"

interface AnalysisStepsProps {
  currentStage: AnalysisStage
  completedStages: AnalysisStage[]
  isComplete: boolean
}

export function AnalysisSteps({ currentStage, completedStages, isComplete }: AnalysisStepsProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3">
      {ANALYSIS_STAGES.map((stage, index) => {
        const isCompleted = completedStages.includes(stage.id) || isComplete
        const isCurrent = stage.id === currentStage && !isComplete

        return (
          <div
            key={stage.id}
            className={cn(
              "flex items-center gap-4 rounded-lg border px-4 py-3 transition-all duration-300",
              isCompleted && "border-primary/20 bg-primary/5",
              isCurrent && "border-[oklch(0.78_0.14_70/0.4)] bg-[oklch(0.82_0.12_85/0.08)]",
              !isCompleted && !isCurrent && "border-border/40 bg-card/40 opacity-50"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Step indicator */}
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && "stage-active border-[oklch(0.78_0.14_70)] bg-[oklch(0.82_0.12_85/0.2)] text-[oklch(0.65_0.14_70)]",
                !isCompleted && !isCurrent && "border-border text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="size-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t(stage.nameKey as keyof TranslationKeys)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(stage.descKey as keyof TranslationKeys)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
