import { notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"

import { getCurrentOrganization, type OrganizationDetail } from "./get-current-organization"

export type UpdateCurrentOrganizationInput = {
  name?: string | undefined
  /**
   * Hợp nhất nông vào `organizations.settings` — không thay cả khối. Một
   * `PATCH` chỉ sửa `{ cho_phep_tu_duyet: false }` không được xoá mất các
   * khoá công tắc khác mà tổ chức đã đặt trước đó.
   */
  settings?: Record<string, unknown> | undefined
}

/** `PATCH /organizations/current` (`F2`, đặc tả 06 mục 3). */
export async function updateCurrentOrganization(
  ctx: TenantContext,
  input: UpdateCurrentOrganizationInput
): Promise<OrganizationDetail> {
  const repository = new OrganizationRepository()

  if (input.name === undefined && input.settings === undefined) {
    throw validationFailed({ body: "Không có trường nào để sửa" })
  }
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw validationFailed({ name: "Tên tổ chức không được để trống" })
  }

  let mergedSettings: Record<string, unknown> | undefined
  if (input.settings) {
    const current = await repository.current(ctx)
    if (!current) throw notFound()
    mergedSettings = {
      ...((current.settings as Record<string, unknown> | null) ?? {}),
      ...input.settings,
    }
  }

  const updated = await repository.update(ctx, {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(mergedSettings !== undefined ? { settings: mergedSettings } : {}),
  })
  if (!updated) throw notFound()

  const detail = await getCurrentOrganization(ctx)
  if (!detail) throw notFound()
  return detail
}
