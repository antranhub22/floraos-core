import { z } from "zod";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { requireCapability } from "@/core/rbac/capabilities";
import { analyzeProductVision } from "@/modules/market-intelligence/use-cases/analyze-product-vision";

const visionExtractSchema = z.object({
  image_url: z.string().optional(),
  asset_id: z.string().optional(),
  product_title: z.string().optional(),
});

/**
 * POST /api/v1/market-intelligence/vision-extract
 * Gác quyền V1 (market-intel.research.run), giải quyết tổ chức qua TenantContext.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "V1");

  const body = await request.json().catch(() => ({}));
  const parsed = visionExtractSchema.safeParse(body);

  const imageUrl = parsed.success && parsed.data.image_url ? parsed.data.image_url : undefined;
  const assetId = parsed.success && parsed.data.asset_id ? parsed.data.asset_id : undefined;
  const productTitle = parsed.success && parsed.data.product_title ? parsed.data.product_title : undefined;

  const result = await analyzeProductVision({
    organizationId: ctx.organizationId,
    imageUrl,
    assetId,
    productTitle,
  });

  return jsonResponse(result, { status: 200 });
});
