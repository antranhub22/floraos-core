import { z } from "zod";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { requireCapability } from "@/core/rbac/capabilities";
import { analyzeProductIntelligence } from "@/modules/market-intelligence/use-cases/analyze-product-intelligence";

const productIntelligenceSchema = z.object({
  product_name: z.string().optional(),
  image_url: z.string().optional(),
  asset_id: z.string().optional(),
  components: z.array(z.any()).optional(),
  attributes: z.any().optional(),
  packaging: z.any().optional(),
  context: z.any().optional(),
  commercial_passport: z.any().optional(),
});

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request);
  // Gác quyền V1: market-intel.research.run
  requireCapability(ctx, "V1");

  const body = await request.json().catch(() => ({}));
  const parsed = productIntelligenceSchema.safeParse(body);

  const productName = parsed.success && parsed.data.product_name ? parsed.data.product_name : "Bó hoa tươi phong cách lãng mạn";
  const imageUrl = parsed.success && parsed.data.image_url ? parsed.data.image_url : "/images/sample-flower.jpg";
  const assetId = parsed.success && parsed.data.asset_id ? parsed.data.asset_id : undefined;

  const result = await analyzeProductIntelligence({
    organizationId: ctx.organizationId,
    productName,
    imageUrl,
    assetId,
    components: parsed.success ? parsed.data.components : undefined,
    attributes: parsed.success ? parsed.data.attributes : undefined,
    packaging: parsed.success ? parsed.data.packaging : undefined,
    context: parsed.success ? parsed.data.context : undefined,
    commercialPassport: parsed.success && parsed.data.commercial_passport ? parsed.data.commercial_passport : undefined,
  });

  return jsonResponse(result, { status: 200 });
});
