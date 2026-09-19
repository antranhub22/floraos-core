/**
 * POST /api/v1/product-copies/:id/reject
 * Từ chối dữ liệu bán hàng — H6
 * Body: { reason?: string }
 * Quyền H6 gác ở use-case `rejectProductCopy` (RS-9 18/09).
 */
import { handle } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { rejectProductCopy } from "@/modules/product-copies/use-cases/approve-product-copy";
import { getProductCopy } from "@/modules/product-copies/use-cases/get-product-copy";

async function rejectHandler(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { ctx } = await requireTenantContext(request);
  const { id } = await context.params;

  const body = await request.json().catch(() => ({}));
  const reason = body.reason ?? null;

  await rejectProductCopy(ctx, id, reason ?? undefined);

  // Return updated product copy
  const copy = await getProductCopy(ctx, id);

  return new Response(JSON.stringify(copy), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST = handle(rejectHandler);
export const dynamic = "force-dynamic" as const;
export const revalidate = 0 as const;