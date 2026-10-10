import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { validationFailed } from "@/core/http/errors"
import { assertBrochureOwner } from "@/modules/greeting-card/use-cases/brochure-owner"
import { uploadPaymentProof } from "@/modules/greeting-card/use-cases/upload-payment-proof"

/** POST /api/v1/public/brochure/[sendCode]/payment-proof — khách tải ảnh chuyển khoản. */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-proof", limit: 5, windowMs: 60_000 })
  const { sendCode } = await context.params
  assertBrochureOwner(request, sendCode)

  const formData = await request.formData()
  const file = formData.get("file")
  if (!file || typeof file === "string") {
    throw validationFailed({ file: "Vui lòng chọn tệp ảnh chuyển khoản" })
  }

  const purposeRaw = formData.get("purpose")
  const purpose = purposeRaw === "BALANCE" ? "BALANCE" : "DEPOSIT"

  const result = await uploadPaymentProof({
    sendCode,
    file,
    purpose,
  })

  return jsonResponse(result)
})

export const dynamic = "force-dynamic"
