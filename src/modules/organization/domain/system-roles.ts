/**
 * Vai là **bản ghi**, không phải enum (`YC-Q5`). Bảng này chỉ là danh sách vai
 * hệ thống mà mọi tổ chức đều có sẵn; tổ chức thêm vai riêng của mình bằng
 * cách ghi thêm dòng vào `roles` với `organization_id` của nó.
 *
 * Năng lực gắn vào vai thuộc P2. Ở P1 vai mới chỉ là định danh.
 */

export const SYSTEM_ROLES = [
  { key: "dieu_hanh", name: "Điều hành" },
  { key: "dieu_phoi", name: "Điều phối" },
  { key: "sale", name: "Sale" },
  { key: "experience_user", name: "Experience User" },
] as const

export type SystemRoleKey = (typeof SYSTEM_ROLES)[number]["key"]

/** Vai gán cho người mở tổ chức: họ điều hành chính tổ chức mình vừa tạo. */
export const FOUNDER_ROLE_KEY: SystemRoleKey = "dieu_hanh"

export function isSystemRoleKey(value: string): value is SystemRoleKey {
  return SYSTEM_ROLES.some((role) => role.key === value)
}
