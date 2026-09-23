import { z } from "zod";
import { validationFailed } from "@/core/http/errors";
import { requireCapability } from "@/core/rbac/capabilities";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { UpdateStoryboardUseCase } from "@/modules/video-studio/use-cases/update-storyboard";
import { VideoSceneItem } from "@/modules/video-studio/domain/video-types";

const patchSchema = z.object({
  scenes: z.array(
    z.object({
      sceneIndex: z.number().optional(),
      durationSeconds: z.number().min(0.5).max(15),
      imageAssetId: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      textOverlay: z.string().nullable().optional(),
      voiceScript: z.string().nullable().optional(),
      transitionEffect: z.enum([
        "fade",
        "slide_left",
        "slide_right",
        "zoom_in",
        "zoom_out",
        "dissolve",
      ]).optional(),
      motionEffect: z.enum(["ZOOM_IN", "ZOOM_OUT", "PAN_UP", "PAN_RIGHT", "STATIC"]).optional(),
    })
  ).min(1, "Phải có ít nhất 1 cảnh trong kịch bản"),
});

export const PATCH = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "I1");

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues });
  }

  const useCase = new UpdateStoryboardUseCase();
  const updated = await useCase.execute(ctx, {
    jobId: id,
    scenes: parsed.data.scenes as VideoSceneItem[],
  });

  return jsonResponse(updated);
});
