import { prisma } from "@/core/tenancy/infra/prisma";
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy";
import {
  video_jobs,
  video_scenes,
  video_format,
  video_stage,
  approval_state,
  PrismaClient,
} from "./entities";
import { VideoSceneItem } from "../domain/video-types";

export type DbClient = Pick<
  PrismaClient,
  "video_jobs" | "video_scenes" | "$transaction"
>;

export interface CreateVideoJobDbInput {
  productId?: string | null | undefined;
  title: string;
  format: video_format;
  durationSeconds?: number | undefined;
  aspectRatio?: string | undefined;
  musicTrack?: string | null | undefined;
  voiceCode?: string | null | undefined;
  hasSubtitle?: boolean | undefined;
  captionStyle?: string | undefined;
  hasWatermark?: boolean | undefined;
  costCredits?: number | undefined;
  scenes: VideoSceneItem[];
}

export type VideoJobWithScenes = video_jobs & {
  scenes: video_scenes[];
};

export class VideoJobRepository {
  constructor(private readonly db: DbClient = prisma) {}

  /**
   * Tạo một video job mới kèm danh sách scenes ban đầu (nếu có) trong 1 transaction.
   */
  async create(
    ctx: TenantContext,
    input: CreateVideoJobDbInput
  ): Promise<VideoJobWithScenes> {
    const jobData = scopedData(ctx, {
      product_id: input.productId ?? null,
      title: input.title,
      format: input.format,
      stage: "DRAFT" as video_stage,
      duration_seconds: input.durationSeconds ?? 15,
      aspect_ratio: input.aspectRatio ?? "9:16",
      music_track: input.musicTrack ?? null,
      voice_code: input.voiceCode ?? null,
      has_subtitle: input.hasSubtitle ?? true,
      caption_style: input.captionStyle ?? "MODERN_BADGE",
      has_watermark: input.hasWatermark ?? false,
      cost_credits: input.costCredits ?? 0,
      script_approval: "PENDING" as approval_state,
      video_approval: "PENDING" as approval_state,
    });

    const job = await this.db.video_jobs.create({
      data: {
        ...jobData,
        scenes: {
          create: input.scenes.map((scene, idx) => ({
            scene_index: scene.sceneIndex ?? idx + 1,
            duration_seconds: scene.durationSeconds || 3.0,
            image_asset_id: scene.imageUrl || scene.imageAssetId || null,
            text_overlay: scene.textOverlay ?? null,
            voice_script: scene.voiceScript ?? null,
            transition_effect: scene.transitionEffect ?? "fade",
            motion_effect: scene.motionEffect ?? null,
          })),
        },
      },
      include: {
        scenes: {
          orderBy: { scene_index: "asc" },
        },
      },
    });

    return job;
  }

  /**
   * Tìm job theo ID có gác cách ly tenant.
   */
  async findById(
    ctx: TenantContext,
    id: string
  ): Promise<VideoJobWithScenes | null> {
    return this.db.video_jobs.findFirst({
      where: scopedWhere(ctx, { id }),
      include: {
        scenes: {
          orderBy: { scene_index: "asc" },
        },
      },
    });
  }

  /**
   * Lấy danh sách jobs của tổ chức.
   */
  async list(
    ctx: TenantContext,
    options: {
      productId?: string | undefined;
      format?: video_format | undefined;
      stage?: video_stage | undefined;
      limit?: number | undefined;
    }
  ): Promise<VideoJobWithScenes[]> {
    const limit = Math.min(options.limit ?? 20, 50);

    return this.db.video_jobs.findMany({
      where: scopedWhere(ctx, {
        ...(options.productId ? { product_id: options.productId } : {}),
        ...(options.format ? { format: options.format } : {}),
        ...(options.stage ? { stage: options.stage } : {}),
      }),
      include: {
        scenes: {
          orderBy: { scene_index: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  /**
   * Cập nhật danh sách kịch bản phân cảnh (xóa cảnh cũ, tạo lại cảnh mới theo thứ tự).
   */
  async updateScenes(
    ctx: TenantContext,
    jobId: string,
    scenes: VideoSceneItem[]
  ): Promise<VideoJobWithScenes | null> {
    const job = await this.findById(ctx, jobId);
    if (!job) return null;

    // Xóa cảnh cũ và ghi cảnh mới
    await this.db.video_scenes.deleteMany({
      where: { video_job_id: jobId },
    });

    await this.db.video_scenes.createMany({
      data: scenes.map((s, idx) => ({
        video_job_id: jobId,
        scene_index: idx + 1,
        duration_seconds: s.durationSeconds || 3.0,
        image_asset_id: s.imageUrl || s.imageAssetId || null,
        text_overlay: s.textOverlay ?? null,
        voice_script: s.voiceScript ?? null,
        transition_effect: s.transitionEffect ?? "fade",
        motion_effect: s.motionEffect ?? null,
      })),
    });

    const totalDuration = scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

    return this.db.video_jobs.update({
      where: scopedWhere(ctx, { id: jobId }),
      data: {
        duration_seconds: Math.round(totalDuration),
        stage: "SCRIPT_READY" as video_stage,
      },
      include: {
        scenes: {
          orderBy: { scene_index: "asc" },
        },
      },
    });
  }

  /**
   * Phê duyệt Kịch bản (Cổng 1).
   */
  async approveScript(
    ctx: TenantContext,
    jobId: string,
    approverUserId: string
  ): Promise<video_jobs | null> {
    const job = await this.findById(ctx, jobId);
    if (!job) return null;

    return this.db.video_jobs.update({
      where: scopedWhere(ctx, { id: jobId }),
      data: {
        script_approval: "APPROVED" as approval_state,
        script_approved_at: new Date(),
        script_approved_by: approverUserId,
        stage: "SCRIPT_APPROVED" as video_stage,
      },
    });
  }

  /**
   * Cập nhật tiến độ / trạng thái render của job.
   */
  async updateStage(
    ctx: TenantContext,
    jobId: string,
    stage: video_stage,
    extra?: {
      finalVideoUrl?: string | undefined;
      finalAssetId?: string | undefined;
      errorMessage?: string | undefined;
    }
  ): Promise<video_jobs | null> {
    const job = await this.findById(ctx, jobId);
    if (!job) return null;

    return this.db.video_jobs.update({
      where: scopedWhere(ctx, { id: jobId }),
      data: {
        stage,
        ...(extra?.finalVideoUrl ? { final_video_url: extra.finalVideoUrl } : {}),
        ...(extra?.finalAssetId ? { final_asset_id: extra.finalAssetId } : {}),
        ...(extra?.errorMessage !== undefined ? { error_message: extra.errorMessage } : {}),
      },
    });
  }

  /**
   * Phê duyệt Video thành phẩm (Cổng 2).
   */
  async approveVideo(
    ctx: TenantContext,
    jobId: string,
    approverUserId: string
  ): Promise<video_jobs | null> {
    const job = await this.findById(ctx, jobId);
    if (!job) return null;

    return this.db.video_jobs.update({
      where: scopedWhere(ctx, { id: jobId }),
      data: {
        video_approval: "APPROVED" as approval_state,
        video_approved_at: new Date(),
        video_approved_by: approverUserId,
        stage: "APPROVED" as video_stage,
      },
    });
  }
}
