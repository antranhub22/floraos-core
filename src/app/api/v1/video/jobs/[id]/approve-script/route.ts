import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { ApproveStoryboardUseCase } from "@/modules/video-studio/use-cases/approve-storyboard";

// Gác quyền (P3) ở use-case — RS-9, thống nhất 18/09: route không lặp lại
// phép kiểm mà use-case đã làm.
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request);
  const { id } = await context.params;
  const useCase = new ApproveStoryboardUseCase();
  const approved = await useCase.execute(ctx, id);

  return jsonResponse(approved);
});
