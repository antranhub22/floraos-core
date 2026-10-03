import { validationFailed } from "@/core/http/errors";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { requireCapability } from "@/core/rbac/capabilities";
import { analyzeProductVision } from "@/modules/market-intelligence/use-cases/analyze-product-vision";
import { visionExtractBodySchema } from "@/modules/creative-production/contracts/stage-02-understand";

/** Hợp đồng Chặng 02 — nguồn chuẩn ở `contracts/stage-02-understand.ts`. */
const visionExtractSchema = visionExtractBodySchema;

/**
 * POST /api/v1/market-intelligence/vision-extract
 * Gác quyền V1 (market-intel.research.run), giải quyết tổ chức qua TenantContext.
 * Thu `product.vision_extract` (1 credit) khi mô hình thật sự đọc ảnh — xem use-case.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "V1");

  const parsed = visionExtractSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues });

  // Ảnh đọc từ kho theo `asset_id` của đúng tổ chức — `image_url` client gửi bị bỏ qua (25/09/2026).
  const result = await analyzeProductVision(ctx, {
    assetId: parsed.data.asset_id,
    productTitle: parsed.data.product_title,
  });

  return jsonResponse(
    {
      ...result,
      ...(result.usage ? { usage: { cost_credit: result.usage.costCredit, balance_after: result.usage.balanceAfter } } : {}),
    },
    { status: 200 }
  );
});
