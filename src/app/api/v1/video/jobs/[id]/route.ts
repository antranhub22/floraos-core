import { requireCapability } from "@/core/rbac/capabilities";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { GetVideoJobUseCase, videoViewUrl } from "@/modules/video-studio/use-cases/get-video-job";

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "I1");

  const { id } = await context.params;
  const useCase = new GetVideoJobUseCase();
  const job = await useCase.execute(ctx, id);

  // `final_video_view_url`: URL ký có hạn để phát video trên giao diện.
  return jsonResponse({ ...job, final_video_view_url: await videoViewUrl(ctx, job.final_video_url) });
});
