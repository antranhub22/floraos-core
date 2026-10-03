/**
 * GET /api/v1/platform/behaviors?kind=… (`N12`, ĐP-3 3.15) — liệt kê mã
 * hành vi có thật trong `field-platform/domain/behaviors.ts` cho một
 * `behavior_kind`, để Console gợi ý khi thêm giá trị vào danh mục loại
 * CÓ HÀNH VI (§16.2). Chỉ đọc — không có ý nghĩa gì ngoài UI, luật thật
 * vẫn kiểm ở `upsert-catalog-value.ts` lúc ghi.
 */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { requirePlatformCapability } from "@/core/platform/platform-capabilities"
import { validationFailed } from "@/core/http/errors"
import { ALL_BEHAVIOR_KINDS, isKnownBehaviorKind, listBehaviorCodes } from "@/modules/field-platform/domain/behaviors"

export const GET = handle(async (request) => {
  const pctx = await requirePlatformContext(request)
  requirePlatformCapability(pctx, "N12")
  const url = new URL(request.url)
  const kind = url.searchParams.get("kind")
  if (!kind) return jsonResponse({ data: { kinds: ALL_BEHAVIOR_KINDS } })
  if (!isKnownBehaviorKind(kind)) throw validationFailed({ kind })
  return jsonResponse({ data: { kind, codes: listBehaviorCodes(kind) } })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
