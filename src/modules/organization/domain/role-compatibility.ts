import type { RoleUxGroup, RoleUxKey } from "./role-ux-catalog"

/**
 * Cầu nối tương thích ngược (Backward-Compatibility Bridge) cho kiến trúc Role UX & Scope.
 * Hỗ trợ chuyển tiếp êm từ:
 * - `ONE_STORE` -> `STORE`
 * - `CHAIN` -> `FLOWER_NETWORK`
 * - `store_manager` -> `store_admin`
 */

export function toCanonicalRoleUxGroup(group: string | null | undefined): RoleUxGroup {
  if (!group) return "STORE"
  const upper = group.toUpperCase()
  if (upper === "ONE_STORE" || upper === "SINGLE" || upper === "STORE") {
    return "STORE"
  }
  if (upper === "CHAIN" || upper === "FLOWER_NETWORK") {
    return "FLOWER_NETWORK"
  }
  if (upper === "PLATFORM") {
    return "PLATFORM"
  }
  return "STORE"
}

export function toCanonicalRoleUxKey(key: string | null | undefined): RoleUxKey {
  if (!key) return "store_admin"
  if (key === "store_manager") return "store_admin"
  return key as RoleUxKey
}

export function isFlowerNetworkScope(scopeOrType: string | null | undefined): boolean {
  if (!scopeOrType) return false
  const upper = scopeOrType.toUpperCase()
  return upper === "FLOWER_NETWORK" || upper === "CHAIN"
}

export function isStoreScope(scopeOrType: string | null | undefined): boolean {
  if (!scopeOrType) return false
  const upper = scopeOrType.toUpperCase()
  return upper === "STORE" || upper === "ONE_STORE" || upper === "SINGLE"
}
