import { type TenantContext } from "@/core/tenancy";
import { requireCapability } from "@/core/rbac/capabilities";
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory";
import { ASSET_VIEW_URL_TTL_SECONDS } from "@/modules/assets/use-cases/get-asset-view-url";
import {
  VideoJobRepository,
  type VideoJobWithScenes,
} from "../infra/video-job-repository";

export class GetVideoJobUseCase {
  constructor(private readonly repo: VideoJobRepository = new VideoJobRepository()) {}

  async execute(
    ctx: TenantContext,
    jobId: string
  ): Promise<VideoJobWithScenes> {
    requireCapability(ctx, "I1");

    const job = await this.repo.findById(ctx, jobId);
    if (!job) {
      throw new Error(`Không tìm thấy tác vụ video với mã: ${jobId}`);
    }

    return job;
  }
}

const STORAGE_PREFIX = "/api/v1/storage/";

/**
 * URL ký có hạn để XEM video đã render (24/09/2026). Worker ghi
 * `final_video_url = /api/v1/storage/videos/<org>/<id>.mp4` KHÔNG kèm chữ ký,
 * nên trình duyệt không mở được và Khu vực E không có gì để xem. Chỉ ký khoá
 * nằm dưới `videos/<tổ chức của phiên>/` — không ký hộ tổ chức khác.
 */
export async function videoViewUrl(
  ctx: TenantContext,
  finalVideoUrl: string | null | undefined
): Promise<string | null> {
  if (!finalVideoUrl || !finalVideoUrl.startsWith(STORAGE_PREFIX)) return null;
  const key = finalVideoUrl.slice(STORAGE_PREFIX.length).split("?")[0]!;
  if (!key.startsWith(`videos/${ctx.organizationId}/`) || key.includes("..")) return null;
  return getStorageProvider().signedUrl(key, ASSET_VIEW_URL_TTL_SECONDS, "GET");
}
