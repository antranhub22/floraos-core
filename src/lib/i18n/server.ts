/**
 * server.ts — Trợ lý i18n cho React Server Components & Backend functions
 */

import { viDictionary } from "./locales/vi"
import { enDictionary } from "./locales/en"
import type { SupportedLocale, I18nDictionary, TranslationKey, InterpolationParams } from "./types"

const DICTIONARIES: Record<SupportedLocale, I18nDictionary> = {
  vi: viDictionary,
  en: enDictionary,
}

/**
 * Lấy toàn bộ từ điển theo ngôn ngữ (mặc định 'vi')
 */
export function getDictionary(locale: SupportedLocale = "vi"): I18nDictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.vi
}

/**
 * Thay thế các biến nội suy trong chuỗi văn bản:
 * "Chào {name}" + { name: "An" } -> "Chào An"
 */
export function interpolate(text: string, params?: InterpolationParams): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`
  })
}

/**
 * Tra cứu khóa dạng dot-notation trong từ điển và áp dụng nội suy
 */
export function translate(
  locale: SupportedLocale = "vi",
  key: TranslationKey,
  params?: InterpolationParams
): string {
  const dict = getDictionary(locale)
  const segments = key.split(".")
  let current: unknown = dict

  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      // Fallback về từ điển tiếng Việt gốc nếu ngôn ngữ phụ chưa có
      let fallbackCurrent: unknown = DICTIONARIES.vi
      for (const fallbackSeg of segments) {
        if (fallbackCurrent && typeof fallbackCurrent === "object" && fallbackSeg in fallbackCurrent) {
          fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[fallbackSeg]
        } else {
          return key
        }
      }
      return typeof fallbackCurrent === "string" ? interpolate(fallbackCurrent, params) : key
    }
  }

  return typeof current === "string" ? interpolate(current, params) : key
}
