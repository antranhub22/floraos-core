/**
 * types.ts — Định nghĩa kiểu dữ liệu cho động cơ Đa ngôn ngữ (i18n Engine)
 */

import type { viDictionary } from "./locales/vi"

export type SupportedLocale = "vi" | "en"

export const DEFAULT_LOCALE: SupportedLocale = "vi"

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["vi", "en"] as const

export type DeepString<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepString<T[K]> : string
}

export type I18nDictionary = DeepString<typeof viDictionary>

export type InterpolationParams = Record<string, string | number>

/**
 * Đệ quy trích xuất tất cả các đường dẫn khóa dạng dot-notation từ I18nDictionary
 * Ví dụ: "common.terms.shop" | "home.header.title"
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & (string | number)]

export type TranslationKey = NestedKeyOf<I18nDictionary>

export interface I18nContextValue {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: (key: TranslationKey, params?: InterpolationParams) => string
  dict: I18nDictionary
}
