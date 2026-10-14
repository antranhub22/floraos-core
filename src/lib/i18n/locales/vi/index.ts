/**
 * index.ts — Bộ từ điển Tiếng Việt gốc (SSOT 100% của FloraOS)
 */

import { commonVi } from "./common"
import { homeVi } from "./home"
import { ordersVi } from "./orders"
import { greetingCardVi } from "./greeting-card"
import { productsVi } from "./products"
import { storageVi } from "./storage"
import { profileVi } from "./profile"
import { settingsVi } from "./settings"
import { notificationsVi } from "./notifications"

export const viDictionary = {
  common: commonVi,
  home: homeVi,
  orders: ordersVi,
  greetingCard: greetingCardVi,
  products: productsVi,
  storage: storageVi,
  profile: profileVi,
  settings: settingsVi,
  notifications: notificationsVi,
} as const

export type I18nSchema = typeof viDictionary
