/**
 * Từ vựng năng lực CỦA RIÊNG console vận hành nền tảng — dải `N1`–`N8`
 * (đặc tả 02 mục "Vận hành nền tảng — dải N").
 *
 * TÁCH HẲN khỏi `src/core/rbac/capability-catalog.ts` (D-N6, chốt 19/09).
 * Không dùng `capability_scope`, không có "trần cứng" theo `SystemRoleKey`
 * — người vận hành nền tảng không phải một vai của tenant, và tập mã ở
 * đây không bao giờ xuất hiện trong `role_capabilities`/
 * `capability_overrides` của tenant.
 *
 * `N9`–`N11` (sổ đăng ký mô hình AI, sổ ngưỡng, chi phí theo mô hình)
 * thuộc tuyến AI-1 — KHÔNG khai ở đây, xem
 * docs/kien-truc/KE_HOACH_CONSOLE_VAN_HANH.md mục 0.
 */

export interface PlatformCapabilityDefinition {
  readonly code: string
  readonly name: string
  readonly label: string
}

const DEFINITIONS: Record<string, Omit<PlatformCapabilityDefinition, "code">> = {
  N1: { name: "platform.organizations.read", label: "Xem danh sách & chi tiết mọi tổ chức" },
  N2: { name: "platform.upgrade_requests.manage", label: "Duyệt/từ chối yêu cầu nâng cấp" },
  N3: { name: "platform.credit.manage", label: "Nạp/hoàn credit cho một tổ chức" },
  N4: { name: "platform.usage.read", label: "Usage & chi phí tổng hợp toàn hệ thống" },
  N5: { name: "platform.health.read", label: "Sức khoẻ hệ thống (chỉ đọc)" },
  N6: { name: "platform.audit.read", label: "Nhật ký xuyên tổ chức" },
  N7: { name: "platform.organizations.create", label: "Tạo tổ chức mới" },
  N8: { name: "platform.integration_tokens.manage", label: "Token tích hợp theo tổ chức" },
}

export const PLATFORM_CAPABILITIES: Record<string, PlatformCapabilityDefinition> = Object.fromEntries(
  Object.entries(DEFINITIONS).map(([code, def]) => [code, { code, ...def }])
)

export const ALL_PLATFORM_CAPABILITY_CODES: readonly string[] = Object.keys(PLATFORM_CAPABILITIES).sort()

export function isPlatformCapabilityCode(value: string): boolean {
  return value in PLATFORM_CAPABILITIES
}

export function platformCapability(code: string): PlatformCapabilityDefinition {
  const found = PLATFORM_CAPABILITIES[code]
  if (!found) throw new Error(`Mã năng lực nền tảng không tồn tại: ${code}`)
  return found
}
