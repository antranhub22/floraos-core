import type { PlatformContext } from "@/core/platform/platform-context"
import { requirePlatformCapability } from "@/core/platform/platform-capabilities"
import { readSystemHealth as readSystemHealthQuery, type PlatformSystemHealth } from "@/modules/platform/infra/platform-query"

/**
 * `GET /platform/health` (`N5`, P25a). Chỉ đọc + cảnh báo (D-N5) — không
 * nút hành động, không đánh dấu job treo là FAILED. Xem đặc tả 06 mục 21.
 */
export async function readSystemHealth(pctx: PlatformContext): Promise<PlatformSystemHealth> {
  requirePlatformCapability(pctx, "N5")
  return readSystemHealthQuery(pctx)
}
