/**
 * POST /api/v1/product-copies/generate
 * Tạo dữ liệu bán hàng từ phân tích đã duyệt — H5
 * Body: { analysisId: string, productId?: string }
 */
import { handle } from "@/core/http/response";
import { AppError } from "@/core/http/errors";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { generateProductCopy } from "@/modules/product-copies/use-cases/generate-product-copy";

async function generateHandler(request: Request) {
  const { ctx } = await requireTenantContext(request);

  // Check H5 capability
  if (!ctx.capabilities.has("H5")) {
    throw new AppError("CAPABILITY_DENIED", "Thiếu quyền H5 để tạo dữ liệu bán hàng");
  }

  const body = await request.json().catch(() => null);
  if (!body?.analysisId) {
    throw new AppError("VALIDATION_FAILED", "Thiếu analysisId");
  }

  const result = await generateProductCopy(ctx, {
    analysisId: body.analysisId,
    productId: body.productId ?? null,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST = handle(generateHandler);
export const dynamic = "force-dynamic" as const;
export const revalidate = 0 as const;