"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useI18n } from "@/components/i18n/i18n-provider"
import { UserInfo } from "@/components/account/user-info"
import { LanguageSwitch } from "@/components/account/language-switch"
import { HistoryTable } from "@/components/account/history-table"

export default function AccountPage() {
  const { isLoggedIn } = useAuth()
  const { t } = useI18n()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/tools/product-insight")
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 page-fade">
      <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t("account_title")}
        </h1>

        <UserInfo />
        <LanguageSwitch />

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("account_history")}
          </h2>
          <HistoryTable />
        </div>
      </div>
    </div>
  )
}
