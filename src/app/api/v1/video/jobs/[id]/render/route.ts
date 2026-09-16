import { requireCapability } from "@/core/rbac/capabilities";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { DispatchVideoRenderUseCase } from "@/modules/video-studio/use-cases/dispatch-video-render";

export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "I1");

  const { id } = await context.params;
  const useCase = new DispatchVideoRenderUseCase();
  const result = await useCase.execute(ctx, id);

  return jsonResponse(result);
});
