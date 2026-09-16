import { type TenantContext } from "@/core/tenancy";
import { requireCapability } from "@/core/rbac/capabilities";
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job";
import {
  VideoJobRepository,
  type VideoJobWithScenes,
} from "../infra/video-job-repository";
import { video_scenes } from "../infra/entities";
import { canStartRender } from "../domain/video-approval-rules";

export interface DispatchRenderResult {
  videoJob: VideoJobWithScenes;
  generationJobId: string;
}

export class DispatchVideoRenderUseCase {
  constructor(private readonly repo: VideoJobRepository = new VideoJobRepository()) {}

  async execute(
    ctx: TenantContext,
    jobId: string
  ): Promise<DispatchRenderResult> {
    requireCapability(ctx, "I1");

    const job = await this.repo.findById(ctx, jobId);
    if (!job) {
      throw new Error(`Không tìm thấy tác vụ video với mã: ${jobId}`);
    }

    const check = canStartRender({
      stage: job.stage,
      scriptApproval: job.script_approval,
    });

    if (!check.allowed) {
      throw new Error(check.reason || "Kịch bản chưa sẵn sàng để render");
    }

    // Đổi trạng thái sang RENDERING
    await this.repo.updateStage(ctx, jobId, "RENDERING");

    // Đưa vào hàng đợi generation_jobs (LISTEN / NOTIFY worker)
    const idempotencyKey = `video-render-${jobId}-${Date.now()}`;
    const enqueued = await enqueueJob(ctx, {
      feature: "video.render",
      idempotencyKey,
      productId: job.product_id,
      payload: {
        videoJobId: job.id,
        title: job.title,
        format: job.format,
        durationSeconds: job.duration_seconds,
        aspectRatio: job.aspect_ratio,
        musicTrack: job.music_track,
        voiceCode: job.voice_code,
        hasSubtitle: job.has_subtitle,
        hasWatermark: job.has_watermark,
        scenes: job.scenes.map((s: video_scenes) => ({
          sceneIndex: s.scene_index,
          durationSeconds: s.duration_seconds,
          imageAssetId: s.image_asset_id,
          textOverlay: s.text_overlay,
          voiceScript: s.voice_script,
          transitionEffect: s.transition_effect,
        })),
      },
    });

    const updatedJob = await this.repo.findById(ctx, jobId);
    if (!updatedJob) {
      throw new Error("Không thể tải lại thông tin video job sau khi đưa vào hàng đợi");
    }

    return {
      videoJob: updatedJob,
      generationJobId: enqueued.job.id,
    };
  }
}
