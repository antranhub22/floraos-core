import { type TenantContext } from "@/core/tenancy";
import { requireCapability } from "@/core/rbac/capabilities";
import {
  VideoJobRepository,
  type VideoJobWithScenes,
} from "../infra/video-job-repository";
import { VideoSceneItem } from "../domain/video-types";
import {
  normalizeScenes,
  validateStoryboard,
} from "../domain/video-storyboard";

export class UpdateStoryboardUseCase {
  constructor(private readonly repo: VideoJobRepository = new VideoJobRepository()) {}

  async execute(
    ctx: TenantContext,
    input: {
      jobId: string;
      scenes: VideoSceneItem[];
    }
  ): Promise<VideoJobWithScenes> {
    requireCapability(ctx, "I1");

    const job = await this.repo.findById(ctx, input.jobId);
    if (!job) {
      throw new Error(`Không tìm thấy tác vụ video với mã: ${input.jobId}`);
    }

    if (job.stage === "RENDERING") {
      throw new Error("Không thể chỉnh sửa kịch bản khi tiến trình đang render video");
    }

    const normalized = normalizeScenes(input.scenes);
    const validation = validateStoryboard(normalized, job.format);
    if (!validation.isValid) {
      throw new Error(`Kịch bản phân cảnh không hợp lệ: ${validation.errors.join("; ")}`);
    }

    const updated = await this.repo.updateScenes(ctx, input.jobId, normalized);
    if (!updated) {
      throw new Error("Không thể cập nhật kịch bản phân cảnh");
    }

    return updated;
  }
}
