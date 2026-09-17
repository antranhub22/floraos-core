import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { downloadVariant } from "@/modules/media/use-cases/download-variant"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/**
 * `GET /media/variants/:id/download?asset_id=…` (`I3`).
 *
 * Gác bằng `I3` chứ không `I5`: tải về và duyệt là hai việc, hai mã năng lực
 * (M04 mục 5.1).
 */
export const GET = handle(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { ctx } = await requireTenantContext(request)
    requireCapability(ctx, "I3")

    const assetId = new URL(request.url).searchParams.get("asset_id")
    if (!assetId) throw validationFailed({ asset_id: "Bắt buộc — một lượt có nhiều biến thể" })

    const { id } = await params
    return jsonResponse(await downloadVariant(ctx, id, assetId))
  }
)
