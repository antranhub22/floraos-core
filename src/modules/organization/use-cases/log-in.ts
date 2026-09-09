import { AppError } from "@/core/http/errors"
import { normalizeEmail } from "@/modules/organization/domain/credentials"
import { expiresAt } from "@/modules/organization/domain/session-policy"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"
import { verifyPassword } from "@/modules/organization/infra/password-hasher"
import { SessionRepository } from "@/modules/organization/infra/session-repository"
import { hashSessionToken, newSessionToken } from "@/modules/organization/infra/session-token"
import { UserRepository } from "@/modules/organization/infra/user-repository"

export type LogInInput = { email: string; password: string }

export type LogInResult = { token: string; userId: string; organizationId: string | null }

/**
 * Sai email và sai mật khẩu trả về cùng một câu trả lời. Phân biệt hai trường
 * hợp là cho phép dò xem địa chỉ nào đã có tài khoản.
 */
function rejected(): AppError {
  return new AppError("UNAUTHENTICATED", "Email hoặc mật khẩu không đúng")
}

export async function logIn(input: LogInInput): Promise<LogInResult> {
  const users = new UserRepository()
  const memberships = new MembershipRepository()
  const sessions = new SessionRepository()

  const email = normalizeEmail(input.email)
  const user = await users.findByEmail(email)
  if (!user || !user.password_hash) throw rejected()
  if (!(await verifyPassword(input.password, user.password_hash))) throw rejected()

  // Tổ chức đang hoạt động của phiên chọn phía máy chủ, không nhận từ client.
  // Người dùng đổi nó về sau qua `POST /session/organization`.
  const membership = await memberships.findFirstActiveForUser(user.id)

  const now = new Date()
  const token = newSessionToken()
  await sessions.create({
    user_id: user.id,
    token_hash: hashSessionToken(token),
    organization_id: membership?.organization_id ?? null,
    expires_at: expiresAt(now),
  })

  return { token, userId: user.id, organizationId: membership?.organization_id ?? null }
}
