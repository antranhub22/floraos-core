import { type TenantContext } from "@/core/tenancy";
import { requireCapability } from "@/core/rbac/capabilities";
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
