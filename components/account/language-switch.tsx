"use client"

import { useI18n } from "@/components/i18n/i18n-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SUPPORTED_LANGUAGES } from "@/lib/constants"

export function LanguageSwitch() {
  const { t, locale, setLocale } = useI18n()

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <span className="text-sm font-medium text-foreground">{t("account_language")}</span>
      <Select value={locale} onValueChange={(v) => setLocale(v as typeof locale)}>
        <SelectTrigger className="w-40 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
