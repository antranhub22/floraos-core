import { z } from "zod";
import { handle, jsonResponse } from "@/core/http/response";
import { validationFailed } from "@/core/http/errors";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { requireCapability } from "@/core/rbac/capabilities";
import { analyzeProductIntelligence } from "@/modules/market-intelligence/use-cases/analyze-product-intelligence";

const productIntelligenceSchema = z.object({
  product_name: z.string().optional(),
  image_url: z.string().optional(),
  // BẮT BUỘC từ 22/09/2026 (nợ #118) — ảnh phải đã lưu vào kho trước khi
  // đối soát; xem `analyzeProductIntelligence` và `validate-transition.ts`.
  asset_id: z.string().min(1, "Thiếu asset_id — ảnh chưa được lưu vào kho ảnh"),
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
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues });
  }

  const productName = parsed.data.product_name ?? "Bó hoa tươi phong cách lãng mạn";
  const imageUrl = parsed.data.image_url ?? "/images/sample-flower.jpg";

  const result = await analyzeProductIntelligence({
    organizationId: ctx.organizationId,
    productName,
    imageUrl,
    assetId: parsed.data.asset_id,
    components: parsed.data.components,
    attributes: parsed.data.attributes,
    packaging: parsed.data.packaging,
    context: parsed.data.context,
    commercialPassport: parsed.data.commercial_passport ?? undefined,
  });

  return jsonResponse(result, { status: 200 });
});
