"use client"

import { useI18n } from "@/components/i18n/i18n-provider"

export function HeroSection() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center gap-4 text-center page-fade">
      <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {t("tool_title")}
      </h1>
      <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg leading-relaxed">
        {t("tool_subtitle")}
      </p>
    </div>
  )
}
