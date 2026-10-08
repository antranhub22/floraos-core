import { conflict } from "@/core/http/errors"
import { DEMO_SHOP_PROFILE_MESSAGE, isDemoShopContact, toShopContact, type ShopContact } from "../domain/shop-contact"
import { ShopContactRepository } from "../infra/shop-contact-repository"
import { parseStorePolicies } from "../domain/store-policy"

export async function getShopContact(
  organizationId: string,
  repo = new ShopContactRepository(),
): Promise<ShopContact | null> {
  const raw = await repo.findByOrganizationId(organizationId)
  if (!raw) return null
  const { settings, ...contact } = raw
  // Cam kết lấy từ Chính sách trong Hồ sơ tiệm (PO 08/10/2026), áp chung mọi link của tiệm
  return toShopContact({ ...contact, commitments: parseStorePolicies(settings).commitments })
}

export async function getShopContactBySlug(
  orgSlug: string,
  repo = new ShopContactRepository(),
): Promise<ShopContact | null> {
  const id = await repo.findOrganizationIdBySlug(orgSlug)
  return id ? getShopContact(id, repo) : null
}

/** Chặn gửi link cho khách khi hồ sơ tiệm còn là dữ liệu mẫu (PO 08/10/2026) — 409 kèm việc cần làm. */
export async function assertShopReadyForCustomers(organizationId: string, repo = new ShopContactRepository()): Promise<void> {
  const contact = await getShopContact(organizationId, repo)
  if (contact && isDemoShopContact(contact)) throw conflict(DEMO_SHOP_PROFILE_MESSAGE)
}
