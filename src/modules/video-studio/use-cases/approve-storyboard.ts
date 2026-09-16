import { type TenantContext } from "@/core/tenancy";
import { requireCapability } from "@/core/rbac/capabilities";
import {
  VideoJobRepository,
  type VideoJobWithScenes,
} from "../infra/video-job-repository";
import { video_scenes } from "../infra/entities";
import { canApproveScript } from "../domain/video-approval-rules";
import { VideoSceneItem } from "../domain/video-types";

export class ApproveStoryboardUseCase {
  constructor(private readonly repo: VideoJobRepository = new VideoJobRepository()) {}

  async execute(
    ctx: TenantContext,
    jobId: string
  ): Promise<VideoJobWithScenes> {
    // Cổng duyệt 1 đòi hỏi quyền phê duyệt Media (I2)
    requireCapability(ctx, "I2");

    const job = await this.repo.findById(ctx, jobId);
    if (!job) {
      throw new Error(`Không tìm thấy tác vụ video với mã: ${jobId}`);
    }

    const check = canApproveScript({
      stage: job.stage,
      scriptApproval: job.script_approval,
      format: job.format,
      scenes: job.scenes.map((s: video_scenes) => ({
        sceneIndex: s.scene_index,
        durationSeconds: s.duration_seconds,
        imageAssetId: s.image_asset_id,
        textOverlay: s.text_overlay,
        voiceScript: s.voice_script,
        transitionEffect: (s.transition_effect as VideoSceneItem["transitionEffect"]) ?? "fade",
      })),
    });

    if (!check.allowed) {
      throw new Error(check.reason || "Không đủ điều kiện để phê duyệt kịch bản");
    }

    await this.repo.approveScript(ctx, jobId, ctx.userId ?? "system");

    const updated = await this.repo.findById(ctx, jobId);
    if (!updated) {
      throw new Error("Lỗi khi tải lại thông tin sau khi duyệt kịch bản");
    }

    return updated;
  }
}
