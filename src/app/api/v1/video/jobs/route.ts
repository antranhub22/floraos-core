import { z } from "zod";
import { validationFailed } from "@/core/http/errors";
import { requireCapability } from "@/core/rbac/capabilities";
import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { CreateVideoJobUseCase } from "@/modules/video-studio/use-cases/create-video-job";
import { ListVideoJobsUseCase } from "@/modules/video-studio/use-cases/list-video-jobs";
import { video_format, video_stage } from "@/modules/video-studio/infra/entities";
import { VideoSceneItem } from "@/modules/video-studio/domain/video-types";

const createSchema = z.object({
  productId: z.string().nullable().optional(),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  format: z.enum([
    "REEL_15S",
    "TIKTOK_30S",
    "STORY_15S",
    "SLIDESHOW",
    "PRODUCT_PAGE",
    "AD_MOTION",
  ]),
  aspectRatio: z.string().optional(),
  musicTrack: z.string().nullable().optional(),
  voiceCode: z.string().nullable().optional(),
  hasSubtitle: z.boolean().optional(),
  captionStyle: z
    .enum(["MODERN_BADGE", "MINIMAL_ELEGANT", "HIGHLIGHT_BOX", "BOTTOM_BANNER", "NONE"])
    .optional(),
  hasWatermark: z.boolean().optional(),
  scenes: z
    .array(
      z.object({
        sceneIndex: z.number().optional(),
        durationSeconds: z.number().min(0.5).max(15),
        imageAssetId: z.string().nullable().optional(),
        textOverlay: z.string().nullable().optional(),
        voiceScript: z.string().nullable().optional(),
        transitionEffect: z.string().optional(),
        motionEffect: z.enum(["ZOOM_IN", "ZOOM_OUT", "PAN_UP", "PAN_RIGHT", "STATIC"]).optional(),
      })
    )
    .optional(),
});

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "I1");

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const format = url.searchParams.get("format") as video_format | null;
  const stage = url.searchParams.get("stage") as video_stage | null;
  const limitStr = url.searchParams.get("limit");

  const filter: {
    productId?: string | undefined;
    format?: video_format | undefined;
    stage?: video_stage | undefined;
    limit?: number | undefined;
  } = {};

  if (productId) filter.productId = productId;
  if (format) filter.format = format;
  if (stage) filter.stage = stage;
  if (limitStr) filter.limit = parseInt(limitStr, 10);

  const useCase = new ListVideoJobsUseCase();
  const jobs = await useCase.execute(ctx, filter);

  return jsonResponse({ data: jobs });
});

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request);
  requireCapability(ctx, "I1");

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues });
  }

  const useCase = new CreateVideoJobUseCase();
  const job = await useCase.execute(ctx, {
    productId: parsed.data.productId ?? null,
    title: parsed.data.title,
    format: parsed.data.format,
    aspectRatio: parsed.data.aspectRatio,
    musicTrack: parsed.data.musicTrack ?? null,
    voiceCode: parsed.data.voiceCode ?? null,
    hasSubtitle: parsed.data.hasSubtitle,
    captionStyle: parsed.data.captionStyle,
    hasWatermark: parsed.data.hasWatermark,
    scenes: (parsed.data.scenes as VideoSceneItem[] | undefined) ?? [],
  });

  return jsonResponse(job, { status: 201 });
});
