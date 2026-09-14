/**
 * GET /api/v1/product-copies
 * List product copies — query params: product_id?, approval_state?
 */
import { handle } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { listProductCopies } from "@/modules/product-copies/use-cases/get-product-copy";

async function listHandler(request: Request) {
  const { ctx } = await requireTenantContext(request);
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id") ?? undefined;
  const approvalState = url.searchParams.get("approval_state") ?? undefined;

  const copies = await listProductCopies(ctx, productId);

  // Filter by approval_state if provided
  const filtered = approvalState
    ? copies.filter(c => c.approval_state === approvalState)
    : copies;

  return new Response(JSON.stringify({ data: filtered }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET = handle(listHandler);
export const dynamic = "force-dynamic" as const;
export const revalidate = 0 as const;