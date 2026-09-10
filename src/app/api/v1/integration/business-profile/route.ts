import { AppError } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import {
  requireIntegrationContext,
  toTenantContext,
} from "@/modules/integration/use-cases/resolve-integration-context"
import { getBusinessProfile } from "@/modules/profiles/use-cases/get-business-profile"

/**
 * `GET /integration/business-profile` (đặc tả 08 mục 4: "BusinessProfile |
 * LocalBudd"). Chỉ token `LOCALBUDD` đọc được — `SocialFlow` không cần hồ
 * sơ kinh doanh (địa chỉ, giờ mở cửa…) cho M04b/M07, nên bị chặn ngay ở đây
 * thay vì lặng lẽ trả dữ liệu vượt phạm vi đã định trong đặc tả.
 */
export const GET = handle(async (request) => {
  const ic = await requireIntegrationContext(request)
  if (ic.client !== "LOCALBUDD") {
    throw new AppError("CAPABILITY_DENIED", "Token này không đọc được BusinessProfile")
  }
  const ctx = await toTenantContext(ic)
  return jsonResponse(await getBusinessProfile(ctx))
})
