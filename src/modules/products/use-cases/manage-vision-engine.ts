import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import {
  MO_TA_BO_MAY,
  VISION_ENGINES,
  VISION_ENGINE_SETTINGS_KEY,
  resolveVisionEngine,
  type MoTaBoMay,
  type VisionEngine,
} from "@/modules/products/domain/vision-engine"

export type VisionEngineState = {
  dang_dung: VisionEngine
  danh_sach: MoTaBoMay[]
}

/**
 * `GET /vision/engine` (`H1`). Gác bằng `H1` chứ không phải `H4`: người chạy
 * phân tích cần biết bộ máy nào đang chạy để hiểu kết quả mình nhận được,
 * kể cả khi họ không đổi được nó.
 */
export async function getVisionEngine(ctx: TenantContext): Promise<VisionEngineState> {
  const organization = await new OrganizationRepository().current(ctx)
  if (!organization) throw notFound()
  return {
    dang_dung: resolveVisionEngine(organization.settings as Record<string, unknown> | null),
    danh_sach: VISION_ENGINES.map((key) => MO_TA_BO_MAY[key]),
  }
}

/**
 * `PUT /vision/engine` (`H4`, trần cứng `dieu_hanh`). Đổi bộ máy đổi CHẤT
 * LƯỢNG dữ liệu mọi lượt phân tích về sau, nên nó ghi `audit_logs`: sáu
 * tháng nữa, khi ai đó hỏi vì sao kết quả tháng Ba khác kết quả tháng Năm,
 * dòng này là chỗ duy nhất trả lời được.
 *
 * Lượt phân tích đang chạy dở KHÔNG bị ảnh hưởng — bộ máy chốt vào `payload`
 * của job lúc tạo (`requestAnalysis`), không tra lại lúc worker nhận việc.
 */
export async function setVisionEngine(
  ctx: TenantContext,
  engine: VisionEngine
): Promise<VisionEngineState> {
  const repository = new OrganizationRepository()
  const current = await repository.current(ctx)
  if (!current) throw notFound()

  const settings = (current.settings as Record<string, unknown> | null) ?? {}
  const truoc = resolveVisionEngine(settings)

  // Hợp nhất nông, cùng luật với `updateCurrentOrganization`: đổi bộ máy
  // không được xoá `cho_phep_tu_duyet` hay công tắc nào khác của tổ chức.
  const updated = await repository.update(ctx, {
    settings: { ...settings, [VISION_ENGINE_SETTINGS_KEY]: engine },
  })
  if (!updated) throw notFound()

  if (truoc !== engine) {
    await recordAuditLog(ctx, {
      action: "vision.engine.change",
      entityType: "organizations",
      entityId: ctx.organizationId,
      before: { [VISION_ENGINE_SETTINGS_KEY]: truoc },
      after: { [VISION_ENGINE_SETTINGS_KEY]: engine },
    })
  }

  return getVisionEngine(ctx)
}
