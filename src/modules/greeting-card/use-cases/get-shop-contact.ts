import { toShopContact, type ShopContact } from "../domain/shop-contact"
import { ShopContactRepository } from "../infra/shop-contact-repository"

export async function getShopContact(
  organizationId: string,
  repo = new ShopContactRepository(),
): Promise<ShopContact | null> {
  const raw = await repo.findByOrganizationId(organizationId)
  return raw ? toShopContact(raw) : null
}

export async function getShopContactBySlug(
  orgSlug: string,
  repo = new ShopContactRepository(),
): Promise<ShopContact | null> {
  const id = await repo.findOrganizationIdBySlug(orgSlug)
  return id ? getShopContact(id, repo) : null
}
