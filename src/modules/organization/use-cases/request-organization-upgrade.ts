import { conflict, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"

const REQUESTABLE_TYPES = ["SINGLE", "CHAIN"] as const

export type RequestedOrganizationType = (typeof REQUESTABLE_TYPES)[number]

export function isRequestableOrganizationType(value: string): value is RequestedOrganizationType {
  return (REQUESTABLE_TYPES as readonly string[]).includes(value)
}

export type RequestOrganizationUpgradeInput = {
  requestedType: RequestedOrganizationType
  note?: string | null
}

/**
 * Ghi lại yêu cầu chuyển từ tổ chức Trải nghiệm sang tổ chức thật (1 cửa
 * hàng hoặc Chuỗi cửa hàng) — nhánh "Chuyển sang tổ chức thật" ở Experience
 * Grid (đặc tả 03 mục 6).
 *
 * KHÔNG tự đổi `organizations.type`/`workspaces.kind` ngay lập tức: cùng
 * nguyên tắc đã chốt với việc nạp credit
 * (`OrganizationRepository.topUpCredit` — "chưa có khái niệm quản trị nền
 * tảng qua API", chỉ chạy tay qua `scripts/nap-credit.ts`). Chuyển đổi tổ
 * chức kéo theo thu phí/xuất hoá đơn, đang ngoài phạm vi giai đoạn này (PRD
 * mục 4). Ghi vào `audit_logs` — hạ tầng đã có sẵn (dùng lại thay vì dựng
 * bảng riêng) — để người vận hành nền tảng thấy yêu cầu và xử lý thủ công.
 */
export async function requestOrganizationUpgrade(
  ctx: TenantContext,
  input: RequestOrganizationUpgradeInput
): Promise<{ recorded: true }> {
  const organization = await new OrganizationRepository().current(ctx)
  if (!organization) throw validationFailed({ organization: "Không tìm thấy tổ chức" })
  if (organization.type !== "EXPERIENCE") {
    throw conflict("Tổ chức của bạn không còn ở trạng thái dùng thử")
  }

  await recordAuditLog(ctx, {
    action: "organization.upgrade_requested",
    entityType: "organizations",
    entityId: organization.id,
    before: { type: organization.type },
    after: { requested_type: input.requestedType, note: input.note ?? null },
  })

  return { recorded: true }
}
