"use client"

import Link from "next/link"
import { useI18n } from "@/components/i18n/i18n-provider"

export function Footer() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="relative z-10 mt-auto border-t border-border/50 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          &copy; {year} {t("footer_copyright")}
        </p>
        <nav className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("footer_privacy")}
          </Link>
          <Link
            href="/terms"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("footer_terms")}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
