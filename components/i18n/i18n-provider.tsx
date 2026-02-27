"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Language } from "@/lib/types"
import { translations, type TranslationKeys } from "@/lib/translations"

interface I18nContextType {
  locale: Language
  setLocale: (locale: Language) => void
  t: (key: keyof TranslationKeys) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Language>("en")

  useEffect(() => {
    const saved = localStorage.getItem("gurubox_locale") as Language | null
    if (saved && translations[saved]) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((newLocale: Language) => {
    setLocaleState(newLocale)
    localStorage.setItem("gurubox_locale", newLocale)
  }, [])

  const t = useCallback(
    (key: keyof TranslationKeys): string => {
      return translations[locale]?.[key] ?? translations.en[key] ?? key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
