import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { listMembers } from "@/modules/organization/use-cases/list-members"
import { createStaffAccount } from "@/modules/organization/use-cases/staff-accounts"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F1")
  return jsonResponse({ data: await listMembers(ctx), next_cursor: null })
})

const createSchema = z.object({
  name: z.string().max(100),
  email: z.string().max(200),
  role_id: z.string().min(1).max(64),
  branch_id: z.string().min(1).max(64).nullish(),
})

/**
 * `POST /members` (`A3`, trần cứng Điều hành — PO 08/10/2026): tạo tài khoản nhân viên dùng được ngay,
 * trả mật khẩu tạm MỘT lần để Điều hành chép gửi nhân viên.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "A3")
  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const account = await createStaffAccount(ctx, {
    name: parsed.data.name,
    email: parsed.data.email,
    roleId: parsed.data.role_id,
    branchId: parsed.data.branch_id ?? null,
  })
  return jsonResponse({ data: account }, { status: 201, headers: { "cache-control": "no-store" } })
})
