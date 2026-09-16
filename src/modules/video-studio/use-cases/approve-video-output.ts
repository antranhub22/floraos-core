import { type TenantContext } from "@/core/tenancy";
import { requireCapability } from "@/core/rbac/capabilities";
import { AssetRepository } from "@/modules/assets/infra/asset-repository";
import {
  VideoJobRepository,
  type VideoJobWithScenes,
} from "../infra/video-job-repository";
import { canApproveVideo } from "../domain/video-approval-rules";

export class ApproveVideoOutputUseCase {
  constructor(
    private readonly repo: VideoJobRepository = new VideoJobRepository(),
    private readonly assetRepo: AssetRepository = new AssetRepository()
  ) {}

  async execute(
    ctx: TenantContext,
    jobId: string
  ): Promise<VideoJobWithScenes> {
    // Cổng duyệt 2 đòi hỏi quyền phê duyệt Media (I2)
    requireCapability(ctx, "I2");

    const job = await this.repo.findById(ctx, jobId);
    if (!job) {
      throw new Error(`Không tìm thấy tác vụ video với mã: ${jobId}`);
    }

    const check = canApproveVideo({
      stage: job.stage,
      videoApproval: job.video_approval,
      finalVideoUrl: job.final_video_url,
      finalAssetId: job.final_asset_id,
    });

    if (!check.allowed) {
      throw new Error(check.reason || "Video chưa đủ điều kiện để phê duyệt");
    }

    // Đánh dấu duyệt video
    await this.repo.approveVideo(ctx, jobId, ctx.userId ?? "system");

    // Đăng ký Asset chính thức loại VIDEO nếu chưa có final_asset_id
    if (job.final_video_url && !job.final_asset_id) {
      const assetId = `asset-video-${job.id}`;
      try {
        await this.assetRepo.create(ctx, {
          id: assetId,
          productId: job.product_id,
          parentAssetId: null,
          kind: "VIDEO",
          version: 1,
          storageKey: job.final_video_url,
          mimeType: "video/mp4",
          aspectRatio: job.aspect_ratio,
          createdBy: ctx.userId ?? "system",
        });

        await this.repo.updateStage(ctx, jobId, "APPROVED", {
          finalAssetId: assetId,
        });
      } catch (err) {
        console.error("Asset registration warning:", err);
      }
    }

    const updated = await this.repo.findById(ctx, jobId);
    if (!updated) {
      throw new Error("Lỗi khi tải lại thông tin sau khi duyệt video");
    }

    return updated;
  }
}
