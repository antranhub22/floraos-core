/**
 * PUT /api/v1/platform/organizations/:id/field-overrides (`N12`, ĐP-3
 * 3.13) — ghi đè theo tổ chức, cho MỘT trường (`target: "field"`) hoặc MỘT
 * giá trị danh mục (`target: "catalogValue"`), chọn qua khoá body.
 */
import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import {
  setFieldOverrideForOrganization,
  setCatalogValueOverrideForOrganization,
} from "@/modules/field-platform/use-cases/set-org-override"
import { setFieldOverrideSchema, setCatalogValueOverrideSchema, parseBody } from "@/modules/field-platform/adapters/http-schemas"

const bodySchema = z.union([
  z.object({ target: z.literal("field") }).merge(setFieldOverrideSchema),
  z.object({ target: z.literal("catalogValue") }).merge(setCatalogValueOverrideSchema),
])

export const PUT = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const pctx = await requirePlatformContext(request)
  const { id } = await context.params
  const body = await parseBody(request, bodySchema)

  if (body.target === "field") {
    return jsonResponse({
      data: await setFieldOverrideForOrganization(pctx, { organizationId: id, ...body }),
    })
  }
  return jsonResponse({
    data: await setCatalogValueOverrideForOrganization(pctx, { organizationId: id, ...body }),
  })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
