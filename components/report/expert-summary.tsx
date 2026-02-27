"use client"

import { useI18n } from "@/components/i18n/i18n-provider"

interface ExpertSummaryProps {
  summary: string
}

export function ExpertSummary({ summary }: ExpertSummaryProps) {
  const { t } = useI18n()

  // Simple markdown-to-JSX for the summary
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []

    lines.forEach((line, i) => {
      const trimmed = line.trim()
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3 key={i} className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wider text-primary first:mt-0">
            {trimmed.replace("## ", "")}
          </h3>
        )
      } else if (trimmed === "") {
        elements.push(<div key={i} className="h-2" />)
      } else {
        // Handle bold text
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/)
        elements.push(
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <span key={j} className="font-semibold text-foreground">
                    {part.slice(2, -2)}
                  </span>
                )
              }
              return part
            })}
          </p>
        )
      }
    })

    return elements
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        {t("report_expert_summary")}
      </h2>
      <div className="space-y-0">
        {renderMarkdown(summary)}
      </div>
    </div>
  )
}
