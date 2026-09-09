import { AppError } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"

/**
 * Cổng năng lực. Bảng 76 mã, ba lớp cắt và trần cứng thuộc **P2** — xem
 * `src/core/rbac/README.md` và `docs/dac-ta/02-function-catalog.md`.
 *
 * Ở P1, `TenantContext.capabilities` luôn rỗng, nên hàm này từ chối mọi mã.
 * Đó là trạng thái đúng của một cổng chưa có bảng quyền: **chặn hết**, không
 * mở tạm. Endpoint nào cần một mã năng lực thì endpoint đó thuộc P2 — mở tạm
 * ở đây rồi quên đóng là cách hỏng im lặng đắt nhất của cả lộ trình.
 *
 * Kiểm bằng mã năng lực, không bằng vai giao diện. Không có `if (role === …)`
 * ở bất kỳ đâu (`YC-Q7`).
 */
export function hasCapability(ctx: TenantContext, code: string): boolean {
  return ctx.capabilities.has(code)
}

export function requireCapability(ctx: TenantContext, code: string): void {
  if (hasCapability(ctx, code)) return
  throw new AppError("CAPABILITY_DENIED", `Thiếu năng lực ${code}`, {
    capability: code,
  })
}
