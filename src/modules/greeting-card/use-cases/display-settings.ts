import { notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { getCurrentOrganization } from "@/modules/organization/use-cases/get-current-organization"
import { updateCurrentOrganization } from "@/modules/organization/use-cases/update-current-organization"
import {
  DISPLAY_SETTINGS_KEY,
  OPTIONAL_DISPLAY_FIELDS,
  REQUIRED_DISPLAY_FIELDS,
  readDisplaySettings,
  sanitizeEnabledFields,
  type DisplaySettings,
} from "../domain/display-fields"
import { GREETING_TEMPLATES } from "../domain/greeting-template-registry"

export interface DisplaySettingsView {
  required: readonly string[]
  fields: readonly { key: string; label: string }[]
  /** Chỉ các mẫu cửa hàng đã chỉnh; mẫu vắng mặt = mặc định bật tất cả */
  settings: DisplaySettings
}

/** Cấu hình trường hiển thị Thẻ chào của cửa hàng hiện tại. */
export async function getDisplaySettings(ctx: TenantContext): Promise<DisplaySettingsView> {
  const org = await getCurrentOrganization(ctx)
  if (!org) throw notFound()
  return { required: REQUIRED_DISPLAY_FIELDS, fields: OPTIONAL_DISPLAY_FIELDS, settings: readDisplaySettings(org.settings) }
}

/** Lưu các trường bật cho một mẫu; giữ nguyên cấu hình các mẫu khác và các khoá cài đặt khác. */
export async function updateDisplaySettings(
  ctx: TenantContext,
  input: { templateId: string; fields: unknown },
): Promise<DisplaySettingsView> {
  if (!(input.templateId in GREETING_TEMPLATES)) throw validationFailed({ templateId: "Mẫu không tồn tại" })
  const org = await getCurrentOrganization(ctx)
  if (!org) throw notFound()
  const next: DisplaySettings = {
    ...readDisplaySettings(org.settings),
    [input.templateId]: sanitizeEnabledFields(input.fields),
  }
  const updated = await updateCurrentOrganization(ctx, { settings: { [DISPLAY_SETTINGS_KEY]: next } })
  return { required: REQUIRED_DISPLAY_FIELDS, fields: OPTIONAL_DISPLAY_FIELDS, settings: readDisplaySettings(updated.settings) }
}
