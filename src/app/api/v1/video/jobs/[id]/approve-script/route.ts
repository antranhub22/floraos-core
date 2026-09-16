import { requireCapability } from "@/core/rbac/capabilities";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { ApproveStoryboardUseCase } from "@/modules/video-studio/use-cases/approve-storyboard";

export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request);
  // Cổng 1 đòi hỏi quyền phê duyệt I2
  requireCapability(ctx, "I2");

  const { id } = await context.params;
  const useCase = new ApproveStoryboardUseCase();
  const approved = await useCase.execute(ctx, id);

  return jsonResponse(approved);
});
