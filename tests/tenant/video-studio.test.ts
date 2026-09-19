import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { createTenant, type Tenant } from "../helpers/fixtures";
import { CreateVideoJobUseCase } from "@/modules/video-studio/use-cases/create-video-job";
import { ListVideoJobsUseCase } from "@/modules/video-studio/use-cases/list-video-jobs";
import { GetVideoJobUseCase } from "@/modules/video-studio/use-cases/get-video-job";
import { UpdateStoryboardUseCase } from "@/modules/video-studio/use-cases/update-storyboard";
import { ApproveStoryboardUseCase } from "@/modules/video-studio/use-cases/approve-storyboard";
import { DispatchVideoRenderUseCase } from "@/modules/video-studio/use-cases/dispatch-video-render";
import { ApproveVideoOutputUseCase } from "@/modules/video-studio/use-cases/approve-video-output";
import { VideoJobRepository } from "@/modules/video-studio/infra/video-job-repository";

describe("Video Studio Tenant Isolation & Approval Lifecycle", () => {
  let tenantA: Tenant;
  let tenantB: Tenant;
  let repo: VideoJobRepository;

  beforeEach(async () => {
    await resetDatabase();
    tenantA = await createTenant("alpha");
    tenantB = await createTenant("beta");

    // Gán quyền Media + duyệt video cho cả 2 tenant (I1: media.optimize/create;
    // P3/P4: duyệt kịch bản/video — tách khỏi I2 ở RS-1 18/09).
    const caps = new Set(["I1", "I2", "P3", "P4"]);
    tenantA = {
      ...tenantA,
      ctx: { ...tenantA.ctx, capabilities: new Set([...tenantA.ctx.capabilities, ...caps]) },
    };
    tenantB = {
      ...tenantB,
      ctx: { ...tenantB.ctx, capabilities: new Set([...tenantB.ctx.capabilities, ...caps]) },
    };
    repo = new VideoJobRepository();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("tenant A cannot see tenant B's video jobs", async () => {
    const createUseCase = new CreateVideoJobUseCase();
    const listUseCase = new ListVideoJobsUseCase();

    // Tenant A tạo 1 job
    await createUseCase.execute(tenantA.ctx, {
      title: "Video Hoa Cưới Tenant A",
      format: "REEL_15S",
    });

    // Tenant B tạo 1 job
    await createUseCase.execute(tenantB.ctx, {
      title: "Video Khai Trương Tenant B",
      format: "TIKTOK_30S",
    });

    const jobsA = await listUseCase.execute(tenantA.ctx, {});
    const jobsB = await listUseCase.execute(tenantB.ctx, {});

    expect(jobsA).toHaveLength(1);
    expect(jobsA[0]?.title).toBe("Video Hoa Cưới Tenant A");
    expect(jobsA[0]?.organization_id).toBe(tenantA.ctx.organizationId);

    expect(jobsB).toHaveLength(1);
    expect(jobsB[0]?.title).toBe("Video Khai Trương Tenant B");
    expect(jobsB[0]?.organization_id).toBe(tenantB.ctx.organizationId);
  });

  it("tenant A cannot fetch or modify tenant B's video job storyboard", async () => {
    const createUseCase = new CreateVideoJobUseCase();
    const getUseCase = new GetVideoJobUseCase();
    const updateUseCase = new UpdateStoryboardUseCase();

    const jobB = await createUseCase.execute(tenantB.ctx, {
      title: "Video Bí Mật Tenant B",
      format: "REEL_15S",
    });

    // Tenant A cố truy cập job của Tenant B -> bị từ chối
    await expect(getUseCase.execute(tenantA.ctx, jobB.id)).rejects.toThrow("Không tìm thấy");

    // Tenant A cố sửa kịch bản của Tenant B -> bị từ chối
    await expect(
      updateUseCase.execute(tenantA.ctx, {
        jobId: jobB.id,
        scenes: [{ sceneIndex: 1, durationSeconds: 3.5, textOverlay: "Hacked" }],
      })
    ).rejects.toThrow("Không tìm thấy");
  });

  it("enforces two-stage approval gate lifecycle", async () => {
    const createUseCase = new CreateVideoJobUseCase();
    const updateUseCase = new UpdateStoryboardUseCase();
    const approveScriptUseCase = new ApproveStoryboardUseCase();
    const dispatchRenderUseCase = new DispatchVideoRenderUseCase();
    const approveVideoUseCase = new ApproveVideoOutputUseCase();

    // 1. Tạo video job
    const job = await createUseCase.execute(tenantA.ctx, {
      title: "Quy trình kiểm định 2 cổng duyệt",
      format: "REEL_15S",
    });
    expect(job.stage).toBe("DRAFT");
    expect(job.script_approval).toBe("PENDING");
    expect(job.video_approval).toBe("PENDING");

    // 2. Chỉnh sửa kịch bản phân cảnh (3 cảnh = 12 giây, hợp lệ với REEL_15S)
    const updated = await updateUseCase.execute(tenantA.ctx, {
      jobId: job.id,
      scenes: [
        { sceneIndex: 1, durationSeconds: 4, textOverlay: "Mở đầu hoa tươi" },
        { sceneIndex: 2, durationSeconds: 4, textOverlay: "Chi tiết cánh hoa" },
        { sceneIndex: 3, durationSeconds: 4, textOverlay: "Đặt ngay hôm nay" },
      ],
    });
    expect(updated.stage).toBe("SCRIPT_READY");
    expect(updated.scenes).toHaveLength(3);

    // 3. Cố tình kích hoạt Render khi chưa duyệt Kịch bản (Cổng 1) -> BỊ CHẶN
    await expect(dispatchRenderUseCase.execute(tenantA.ctx, job.id)).rejects.toThrow(
      "Bắt buộc phải phê duyệt Kịch bản"
    );

    // 4. Phê duyệt Kịch bản (Cổng 1)
    const approvedScript = await approveScriptUseCase.execute(tenantA.ctx, job.id);
    expect(approvedScript.script_approval).toBe("APPROVED");
    expect(approvedScript.stage).toBe("SCRIPT_APPROVED");

    // 5. Kích hoạt Render sau khi Cổng 1 đã duyệt -> THÀNH CÔNG
    const dispatched = await dispatchRenderUseCase.execute(tenantA.ctx, job.id);
    expect(dispatched.videoJob.stage).toBe("RENDERING");
    expect(dispatched.generationJobId).toBeDefined();

    // 6. Mô phỏng worker render hoàn tất
    await repo.updateStage(tenantA.ctx, job.id, "RENDER_COMPLETED", {
      finalVideoUrl: "https://storage.floraos.vn/org/test/video.mp4",
    });

    // 7. Phê duyệt Video thành phẩm (Cổng 2) -> THÀNH CÔNG
    const approvedVideo = await approveVideoUseCase.execute(tenantA.ctx, job.id);
    expect(approvedVideo.video_approval).toBe("APPROVED");
    expect(approvedVideo.stage).toBe("APPROVED");
    expect(approvedVideo.final_asset_id).toBeDefined();
  });
});
