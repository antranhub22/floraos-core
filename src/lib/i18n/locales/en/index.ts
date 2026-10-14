/**
 * en/index.ts — English locale dictionary (Foundation for multi-language scalability)
 */

import { commonEn } from "./common"
import { homeEn } from "./home"
import { ordersEn } from "./orders"
import { greetingCardEn } from "./greeting-card"
import { productsEn } from "./products"
import { storageEn } from "./storage"
import { profileEn } from "./profile"
import { settingsEn } from "./settings"
import { notificationsEn } from "./notifications"

export const enDictionary = {
  common: commonEn,
  home: homeEn,
  orders: ordersEn,
  greetingCard: greetingCardEn,
  products: productsEn,
  storage: storageEn,
  profile: profileEn,
  settings: settingsEn,
  notifications: notificationsEn,
} as const
