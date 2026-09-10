import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import {
  requireIntegrationContext,
  toTenantContext,
} from "@/modules/integration/use-cases/resolve-integration-context"
import { recordExternalUsage } from "@/modules/usage/use-cases/record-external-usage"

const postSchema = z.object({
  feature: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  cost_usd: z.number().nullable().optional(),
  status: z.enum(["COMPLETED", "REFUNDED"]),
  job_id: z.string().min(1).nullable().optional(),
})

/** `POST /integration/usage` (đặc tả 06 mục 11): "Ghi mức dùng phát sinh ở engine ngoài". */
export const POST = handle(async (request) => {
  const ic = await requireIntegrationContext(request)
  const ctx = await toTenantContext(ic)

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const row = await recordExternalUsage(ctx, {
    feature: parsed.data.feature,
    quantity: parsed.data.quantity,
    costUsd: parsed.data.cost_usd,
    status: parsed.data.status,
    jobId: parsed.data.job_id,
  })

  return jsonResponse(row, { status: 201 })
})
