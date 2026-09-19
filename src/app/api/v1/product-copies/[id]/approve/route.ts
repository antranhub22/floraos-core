/**
 * POST /api/v1/product-copies/:id/approve
 * Duyệt dữ liệu bán hàng → ghi Product Master + audit_logs — H6
 * Quyền H6 gác ở use-case `approveProductCopy` (RS-9 18/09).
 */
import { handle } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { approveProductCopy } from "@/modules/product-copies/use-cases/approve-product-copy";
import { getProductCopy } from "@/modules/product-copies/use-cases/get-product-copy";

async function approveHandler(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { ctx } = await requireTenantContext(request);
  const { id } = await context.params;

  await approveProductCopy(ctx, id);

  // Return full product copy with approval state
  const copy = await getProductCopy(ctx, id);

  return new Response(JSON.stringify(copy), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST = handle(approveHandler);
export const dynamic = "force-dynamic" as const;
export const revalidate = 0 as const;