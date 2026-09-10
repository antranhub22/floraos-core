import { randomBytes } from "node:crypto"

import { conflict } from "@/core/http/errors"
import { isAcceptablePassword, isValidEmail, normalizeEmail } from "@/modules/organization/domain/credentials"
import { FOUNDER_ROLE_KEY } from "@/modules/organization/domain/system-roles"
import { slugCandidates } from "@/modules/organization/domain/slug"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import { hashPassword } from "@/modules/organization/infra/password-hasher"
import { RoleRepository } from "@/modules/organization/infra/role-repository"
import { runInTransaction } from "@/modules/organization/infra/transaction"
import { UserRepository } from "@/modules/organization/infra/user-repository"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"

export type BootstrapAviGiftOrganizationInput = {
  organizationName: string
  adminEmail: string
  adminName?: string | null | undefined
}

export type BootstrapAviGiftOrganizationResult = {
  organizationId: string
  workspaceId: string
  userId: string
  /** Mật khẩu tạm, RÕ, chỉ có trong bộ nhớ của lượt chạy này — không bao giờ
   *  ghi ra tệp hay console log ở nơi khác ngoài lệnh gọi hàm này. Người
   *  nhận phải đổi ngay sau lần đăng nhập đầu (P8, chưa có luồng "buộc đổi
   *  mật khẩu lần đầu" ở core — nợ kỹ thuật, xem TECHNICAL_DEBT.md). */
  temporaryPassword: string
}

function randomTemporaryPassword(): string {
  // 18 ký tự base64url — vượt xa MIN_PASSWORD_LENGTH, không cần người nhớ,
  // chỉ dùng để đăng nhập một lần rồi đổi ngay.
  return randomBytes(18).toString("base64url")
}

/**
 * Dựng tổ chức AVI GIFT — "tổ chức đầu tiên" của floraos-core (đặc tả 08 mục
 * 6, P8/H7). KHÔNG tái dùng `signUp()` (P1): hàm đó cố định
 * `type: "EXPERIENCE"` + cấp `TRIAL_CREDIT_BALANCE`, đúng cho một người tự
 * đăng ký dùng thử, sai cho một tổ chức SẢN XUẤT thật đang có dữ liệu vận
 * hành thật đứng sau. AVI GIFT là `SINGLE` (chốt với anh Tony 09/10 — một
 * cửa hàng; các "shop A/B" ở `BAN_GIAO.md` là đối tác nhận đơn bên ngoài,
 * không phải chi nhánh nội bộ), workspace `PRODUCTION`, không có hạn mức
 * dùng thử.
 *
 * Vẫn tái dùng NGUYÊN các repository của module `organization` (P1) — cùng
 * một giao dịch bốn bảng (user/organization/workspace/membership), cùng luật
 * băm mật khẩu, cùng cách sinh slug — chỉ khác tham số truyền vào.
 */
export async function bootstrapAviGiftOrganization(
  input: BootstrapAviGiftOrganizationInput
): Promise<BootstrapAviGiftOrganizationResult> {
  const email = normalizeEmail(input.adminEmail)
  if (!isValidEmail(email)) throw new Error(`Địa chỉ thư không hợp lệ: ${input.adminEmail}`)

  const temporaryPassword = randomTemporaryPassword()
  if (!isAcceptablePassword(temporaryPassword)) {
    // Không thể xảy ra với 18 byte ngẫu nhiên — chỉ để không lặng lẽ ghi một
    // mật khẩu không hợp lệ nếu luật `isAcceptablePassword` đổi sau này.
    throw new Error("Mật khẩu tạm sinh ra không đạt luật hiện hành — sửa randomTemporaryPassword()")
  }

  const passwordHash = await hashPassword(temporaryPassword)
  const now = new Date()

  return runInTransaction(async (tx) => {
    const users = new UserRepository(tx)
    const organizations = new OrganizationRepository(tx)
    const workspaces = new WorkspaceRepository(tx)
    const roles = new RoleRepository(tx)
    const memberships = new MembershipRepository(tx)

    if (await users.findByEmail(email)) {
      throw conflict(`Địa chỉ thư này đã có tài khoản: ${email}`)
    }

    const user = await users.create({
      email,
      password_hash: passwordHash,
      name: input.adminName?.trim() || null,
    })

    let slug: string | null = null
    for (const candidate of slugCandidates(input.organizationName)) {
      if (await organizations.findBySlug(candidate)) continue
      slug = candidate
      break
    }
    if (!slug) throw conflict("Không sinh được định danh cho tên tổ chức này")

    const organization = await organizations.create({
      name: input.organizationName,
      slug,
      type: "SINGLE",
      credit_balance: 0,
    })

    const workspace = await workspaces.createForNewOrganization({
      organizationId: organization.id,
      name: input.organizationName,
      kind: "PRODUCTION",
      trial_limit: null,
      trial_status: null,
    })

    const founderRole = await roles.findSystemRoleByKey(FOUNDER_ROLE_KEY)
    if (!founderRole) {
      throw new Error(`Thiếu vai hệ thống ${FOUNDER_ROLE_KEY}. Chạy \`npm run db:seed\` trước.`)
    }

    await memberships.createForNewOrganization({
      organizationId: organization.id,
      userId: user.id,
      roleId: founderRole.id,
      status: "ACTIVE",
      joinedAt: now,
    })

    return {
      organizationId: organization.id,
      workspaceId: workspace.id,
      userId: user.id,
      temporaryPassword,
    }
  })
}
