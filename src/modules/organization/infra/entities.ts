/**
 * Kiểu bản ghi sinh từ lược đồ, tái xuất ở tầng `infra/`.
 *
 * Nhờ tệp này, chuỗi `@/generated/prisma` chỉ xuất hiện trong `infra/`, và luật
 * "không module nào import client ngoài `infra/`" kiểm được bằng một phép quét
 * đơn giản thay vì bằng review — xem
 * `tests/tenant/khong-import-prisma-ngoai-infra.test.ts`.
 */
export type {
  branches,
  capability_overrides,
  capability_scope,
  membership_status,
  memberships,
  organization_type,
  organizations,
  role_capabilities,
  roles,
  sessions,
  trial_status,
  users,
  workspace_kind,
  workspaces,
} from "@/generated/prisma/client"
