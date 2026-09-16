import { requireCapability } from "@/core/rbac/capabilities";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { GetVideoJobUseCase } from "@/modules/video-studio/use-cases/get-video-job";

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "I1");

  const { id } = await context.params;
  const useCase = new GetVideoJobUseCase();
  const job = await useCase.execute(ctx, id);

  return jsonResponse(job);
});
