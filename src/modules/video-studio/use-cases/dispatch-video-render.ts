import { type TenantContext } from "@/core/tenancy";
import { requireCapability } from "@/core/rbac/capabilities";
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job";
import {
  VideoJobRepository,
  type VideoJobWithScenes,
} from "../infra/video-job-repository";
import { video_scenes } from "../infra/entities";
import { canStartRender } from "../domain/video-approval-rules";
import { AssetRepository } from "@/modules/assets/infra/asset-repository";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // Ảnh cảnh lưu bằng MÃ ASSET (Khu vực D / Master Image); worker chỉ đọc
    // được đường dẫn kho — đổi mã asset thành `storage_key` của ĐÚNG tổ chức
    // (24/09/2026). Trước đây worker không tìm được ảnh theo mã asset và lặng lẽ
    // dựng video bằng ảnh mẫu có sẵn trong kho.
    const assetRepo = new AssetRepository();
    const resolvedImages = new Map<string, string>();
    for (const s of job.scenes as video_scenes[]) {
      const ref = s.image_asset_id;
      if (!ref || !UUID_RE.test(ref) || resolvedImages.has(ref)) continue;
      const asset = await assetRepo.findById(ctx, ref);
      if (!asset) throw new Error(`Ảnh của cảnh #${s.scene_index} không còn trong kho (asset ${ref})`);
      resolvedImages.set(ref, asset.storage_key);
    }
    const missing = (job.scenes as video_scenes[]).filter((s) => !s.image_asset_id);
    if (missing.length > 0) {
      throw new Error(
        `Cảnh ${missing.map((s) => `#${s.scene_index}`).join(", ")} chưa có ảnh sản phẩm — gắn ảnh trước khi render`
      );
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
          imageAssetId: (s.image_asset_id && resolvedImages.get(s.image_asset_id)) || s.image_asset_id,
          textOverlay: s.text_overlay,
          voiceScript: s.voice_script,
          transitionEffect: s.transition_effect,
          // Worker (`local_cinematic.py`) đọc `motionEffect`; vắng thì tự xoay vòng.
          motionEffect: s.motion_effect ?? undefined,
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
