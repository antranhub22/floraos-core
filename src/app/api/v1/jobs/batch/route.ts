/**
 * Batch Job Creation API — POST /api/v1/jobs/batch
 * 
 * Tạo job cho một module cụ thể với danh sách capabilities được chọn.
 * Endpoint này được gọi từ FeaturePicker khi user bấm "Tạo tác vụ".
 * 
 * Body:
 * {
 *   productId: string,
 *   masterImageId?: string,
 *   feature: string,           // job feature string (vision.analyze, creative.compose, etc.)
 *   capabilities: string[],    // AIC codes: ["AIC-11", "AIC-12", ...]
 *   module: string             // M01, M01b, M04a, M04b, M04c, M07, M09, M06, M05
 * }
 * 
 * Response:
 * { job_id: string, status: JobStatus, usage: { cost_credit: number, balance_after: number } }
 */

import { handle } from "@/core/http/response";
import { AppError } from "@/core/http/errors";
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job";
import { resolveSession, requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { getJobFeatureForModule } from "@/lib/feature-catalog";

const MODULE_RUN_CAPABILITY: Record<string, string> = {
  M01: "H1",
  M01b: "H5",
  M04a: "I1",
  M04b: "P1",
  M04c: "P3",
  M07: "O1",
  M09: "Q3",
  M06: "J1",
  M05: "L1",
};

async function batchJobHandler(request: Request) {
  const { resolved, ctx } = await requireTenantContext(request);
  
  const body = await request.json().catch(() => null);
  if (!body) throw new AppError("VALIDATION_FAILED", "Thân yêu cầu không hợp lệ");

  const { productId, masterImageId, feature, capabilities, module } = body as {
    productId: string;
    masterImageId?: string;
    feature: string;
    capabilities: string[];
    module: string;
  };

  // Validate required fields
  if (!productId) throw new AppError("VALIDATION_FAILED", "Thiếu productId");
  if (!feature) throw new AppError("VALIDATION_FAILED", "Thiếu feature");
  if (!module) throw new AppError("VALIDATION_FAILED", "Thiếu module");
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    throw new AppError("VALIDATION_FAILED", "Danh sách capabilities rỗng");
  }

  // Validate module -> feature mapping matches
  const expectedFeature = getJobFeatureForModule(module as any);
  if (feature !== expectedFeature) {
    throw new AppError("VALIDATION_FAILED", `Feature không khớp module: kỳ vọng ${expectedFeature}, nhận ${feature}`);
  }

  // Check RBAC run capability for this module
  const requiredRunCap = MODULE_RUN_CAPABILITY[module];
  if (requiredRunCap && !ctx.capabilities.has(requiredRunCap)) {
    throw new AppError("CAPABILITY_DENIED", `Thiếu quyền ${requiredRunCap} để chạy module ${module}`);
  }

  // Build payload for job
  const payload: Record<string, any> = {
    productId,
    capabilities, // AIC codes for worker to process
  };
  if (masterImageId) payload.masterImageId = masterImageId;

  // Enqueue job (quota check + usage write + job create + NOTIFY in 1 TX)
  const idempotencyKey = request.headers.get("idempotency-key") ?? crypto.randomUUID();
  const result = await enqueueJob(ctx, {
    feature,
    payload,
    productId,
    idempotencyKey,
  });

  return new Response(JSON.stringify({
    job_id: result.job.id,
    status: result.job.status,
    usage: {
      cost_credit: result.usage.costCredit,
      balance_after: result.usage.balanceAfter,
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST = handle(batchJobHandler);

export const dynamic = "force-dynamic" as const;
export const revalidate = 0 as const;