/**
 * GET /api/v1/product-copies/:id
 * PATCH /api/v1/product-copies/:id (update edited - H5)
 * Quyền gác ở use-case (RS-8/RS-9 18/09): getProductCopy = H5, updateProductCopy = H5.
 */
import { handle } from "@/core/http/response";
import { AppError } from "@/core/http/errors";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { getProductCopy } from "@/modules/product-copies/use-cases/get-product-copy";
import { updateProductCopy } from "@/modules/product-copies/use-cases/update-product-copy";
import { validateProductCopyEdited } from "@/modules/product-copies/domain/product-copy-rules";

async function getHandler(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { ctx } = await requireTenantContext(request);
  const { id } = await context.params;

  const copy = await getProductCopy(ctx, id);
  return new Response(JSON.stringify(copy), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function patchHandler(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { ctx } = await requireTenantContext(request);
  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  if (!body?.edited) {
    throw new AppError("VALIDATION_FAILED", "Thiếu edited");
  }

  if (!validateProductCopyEdited(body.edited)) {
    throw new AppError("VALIDATION_FAILED", "Dữ liệu sửa không hợp lệ");
  }

  await updateProductCopy(ctx, id, body.edited);

  const copy = await getProductCopy(ctx, id);
  return new Response(JSON.stringify(copy), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET = handle(getHandler);
export const PATCH = handle(patchHandler);
export const dynamic = "force-dynamic" as const;
export const revalidate = 0 as const;