import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { permanentDelete } from "@/modules/storage/use-cases/manage-trash"
import type { TrashItemType } from "@/modules/storage/domain/trash-types"

type Context = { params: Promise<{ id: string }> }

export const DELETE = handle(async (request: Request, context: Context) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  const url = new URL(request.url)
  const type = url.searchParams.get("type") as TrashItemType | null

  if (!type || !["RAW_ASSET", "APPROVED_ANALYSIS", "PRODUCT"].includes(type)) {
    throw validationFailed({ type: "Tham số type không hợp lệ" })
  }

  await permanentDelete(ctx, { id, type })
  return jsonResponse({ success: true })
})
