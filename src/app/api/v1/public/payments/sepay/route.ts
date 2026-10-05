import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { handleSepayWebhook } from "@/modules/greeting-card/use-cases/payment-webhook"

// Hình dạng webhook SePay (https://docs.sepay.vn) — chỉ giữ trường cần cho đối soát
const bodySchema = z.object({
  id: z.union([z.number().int(), z.string().min(1).max(64)]),
  transferType: z.string().max(10),
  transferAmount: z.number().nonnegative().max(100_000_000_000),
  content: z.string().max(2000).default(""),
  accountNumber: z.string().max(40).nullish(),
  transactionDate: z.string().max(40).nullish(),
  referenceCode: z.string().max(100).nullish(),
})

function apiKeyFrom(request: Request): string | null {
  const header = request.headers.get("authorization") ?? ""
  const m = /^apikey\s+(\S+)$/i.exec(header.trim())
  return m?.[1] ?? null
}

/**
 * POST /api/v1/public/payments/sepay — SePay báo có giao dịch vào tài khoản.
 * Xác thực bằng `Authorization: Apikey <khoá>` do tiệm sinh trong tab Điều hành;
 * tổ chức suy ra TỪ KHOÁ, không từ thân yêu cầu.
 */
export const POST = handle(async (request) => {
  await enforceRateLimit(request, { scope: "sepay-webhook", limit: 600, windowMs: 60_000 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ body: "Dữ liệu webhook không hợp lệ" })
  const result = await handleSepayWebhook(apiKeyFrom(request), parsed.data)
  return jsonResponse({ success: true, ...result })
})

export const dynamic = "force-dynamic"
