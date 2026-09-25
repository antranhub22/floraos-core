import { z } from "zod";
import { validationFailed } from "@/core/http/errors";
import { requireCapability } from "@/core/rbac/capabilities";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { DispatchVideoRenderUseCase } from "@/modules/video-studio/use-cases/dispatch-video-render";

const bodySchema = z.object({
  scene_images: z
    .array(z.object({ scene_index: z.number().int().min(1).max(30), asset_id: z.string().uuid() }))
    .max(30)
    .optional(),
  // PO 25/09/2026: nhà cung cấp cho lượt này; vắng = theo thứ tự ưu tiên của tiệm.
  video_provider: z.enum(["veo", "kling", "runway", "luma", "local_cinematic"]).optional(),
});

export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "I1");

  const { id } = await context.params;
  // Thân tuỳ chọn (24/09/2026): ảnh hiện có trên storyboard để lấp cảnh còn
  // trống ảnh của job — không có thì máy chủ tự tìm ảnh Khu vực D / Master.
  const raw = await request.text().catch(() => "");
  const parsed = bodySchema.safeParse(raw ? JSON.parse(raw) : {});
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues });
  const useCase = new DispatchVideoRenderUseCase();
  const result = await useCase.execute(ctx, id, {
    sceneImages: (parsed.data.scene_images ?? []).map((x) => ({ sceneIndex: x.scene_index, assetId: x.asset_id })),
    videoProvider: parsed.data.video_provider ?? null,
  });

  return jsonResponse(result);
});
