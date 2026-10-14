"use client"

/**
 * context.tsx — React Context & Hook đa ngôn ngữ cho Client Components
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { getDictionary, translate, interpolate } from "./server"
import type { SupportedLocale, I18nContextValue, TranslationKey, InterpolationParams } from "./types"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types"

const STORAGE_KEY = "floraos_locale"

const I18nContext = createContext<I18nContextValue | null>(null)

export interface I18nProviderProps {
  children: React.ReactNode
  initialLocale?: SupportedLocale
}

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
      if (saved && SUPPORTED_LOCALES.includes(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc ngôn ngữ đã lưu sau hydrate để tránh lệch SSR, chủ đích
        setLocaleState(saved)
      }
    } catch {
      // Bỏ qua lỗi nếu môi trường không có localStorage
    }
  }, [])

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    setLocaleState(nextLocale)
    try {
      localStorage.setItem(STORAGE_KEY, nextLocale)
    } catch {
      // Bỏ qua lỗi
    }
  }, [])

  const dict = useMemo(() => getDictionary(locale), [locale])

  const t = useCallback(
    (key: TranslationKey, params?: InterpolationParams): string => {
      return translate(locale, key, params)
    },
    [locale]
  )

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      dict,
    }),
    [locale, setLocale, t, dict]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * Hook đa ngôn ngữ dùng trong mọi React component:
 * const { t, locale, setLocale, dict } = useI18n()
 * <h1>{t('home.header.title')}</h1>
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    // Dự phòng an toàn nếu component nằm ngoài I18nProvider (Render SSR hoặc Standalone test)
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: TranslationKey, params?: InterpolationParams) => translate(DEFAULT_LOCALE, key, params),
      dict: getDictionary(DEFAULT_LOCALE),
    }
  }
  return context
}

export { interpolate }
