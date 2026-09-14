import { AppError } from "@/core/http/errors";
import { ProductCopyRepository } from "../infra/product-copy-repository";
import { ProductAnalysisRepository } from "@/modules/products/infra/product-analysis-repository";
import { BrandProfileRepository } from "@/modules/profiles/infra/brand-profile-repository";
import { OccasionRepository } from "@/modules/organization/infra/occasion-repository";
import { callCapability } from "@/core/ai/gateway";
import { aiGatewayDeps } from "@/core/ai/wiring";
import { createProductCopyAdapter } from "../adapters/product-copy-adapter";
import { OpenAILLMProvider } from "@/core/ai/adapters/openai-llm-provider";
import type { TenantContext } from "@/core/tenancy";
import type { ProductCopyInput } from "../adapters/product-copy-adapter";

interface AnalysisIdentity {
  category: string;
  style: string;
  color_tone: string;
}

interface AnalysisBOMItem {
  name: string;
  quantity: number;
  confidence?: number;
}

interface AnalysisBOM {
  flowers?: AnalysisBOMItem[];
  foliage?: Array<{ name: string; quantity: number }>;
  accessories?: Array<{ name: string; quantity: number }>;
  wrapping?: Array<{ layer: string; material: string; color: string }>;
}

interface AnalysisRaw {
  identity: AnalysisIdentity;
  bom: AnalysisBOM;
  flower_count: number;
  bud_count: number;
  damaged_count: number;
  confidence: number;
}

/**
 * Generate Product Copy — H5 (chạy), H6 (duyệt)
 * 
 * Flow:
 * 1. Verify analysis_id exists and is APPROVED
 * 2. Load brand_profile cho tone_of_voice, hashtags, cta_templates
 * 3. Gọi AI gateway với capabilities: AIC-04 (product_copy)
 * 4. Lưu raw vào product_copies, trả về để user review/approve
 */
export async function generateProductCopy(ctx: TenantContext, input: {
  analysisId: string;
  productId?: string | null;
}): Promise<{ copyId: string; raw: unknown }> {
  const copyRepo = new ProductCopyRepository();
  const analysisRepo = new ProductAnalysisRepository();
  const brandRepo = new BrandProfileRepository();
  const occasionRepo = new OccasionRepository(copyRepo.db);

  const analysis = await analysisRepo.findById(ctx, input.analysisId);
  
  if (!analysis) {
    throw new AppError("NOT_FOUND", "Phân tích không tồn tại");
  }
  if (analysis.approval_state !== "APPROVED") {
    throw new AppError("UNPROCESSABLE_ENTITY", "Phân tích chưa được duyệt");
  }

  if (input.productId && analysis.product_id && analysis.product_id !== input.productId) {
    throw new AppError("CONFLICT", "product_id không khớp với phân tích");
  }

  const existing = await copyRepo.findByAnalysisId(ctx, input.analysisId);
  if (existing) {
    return { copyId: existing.id, raw: existing.raw };
  }

  const brandProfile = await brandRepo.current(ctx);
  const occasions = await occasionRepo.list(ctx);

  const effectiveAnalysis = (analysis.edited ?? analysis.raw) as unknown as AnalysisRaw;
  const identity = effectiveAnalysis.identity;
  const bom = effectiveAnalysis.bom;

  if (!identity || !bom) {
    throw new AppError("VALIDATION_FAILED", "Phân tích thiếu dữ liệu identity hoặc bom");
  }

  const aiPayload: ProductCopyInput = {
    analysis: {
      identity: {
        category: identity.category,
        style: identity.style,
        color_tone: identity.color_tone,
        flower_count: effectiveAnalysis.flower_count,
        bud_count: effectiveAnalysis.bud_count,
        damaged_count: effectiveAnalysis.damaged_count,
      },
      bom: {
        flowers: bom.flowers?.map((f) => ({ name: f.name, quantity: f.quantity, confidence: f.confidence ?? 0 })) ?? [],
        foliage: bom.foliage?.map((f) => ({ name: f.name, quantity: f.quantity })) ?? [],
        accessories: bom.accessories?.map((a) => ({ name: a.name, quantity: a.quantity })) ?? [],
        wrapping: bom.wrapping?.map((w) => ({ layer: w.layer, material: w.material, color: w.color })) ?? [],
      },
      confidence: effectiveAnalysis.confidence,
    },
    brand: {
      tone_of_voice: brandProfile?.tone_of_voice ?? null,
      hashtags: (brandProfile?.hashtags as string[] | null) ?? null,
      cta_templates: (brandProfile?.cta_templates as string[] | null) ?? null,
    },
    occasions: occasions.map(o => ({ code: o.code, name: o.name })),
  };

  const llmProvider = new OpenAILLMProvider();
  const adapterRun = createProductCopyAdapter(llmProvider, aiPayload, ctx.organizationId);
  const deps = aiGatewayDeps(ctx);

  const aiResult = await callCapability(
    {
      capability: "product_copy",
      privacy: "SHOP",
      entity: { type: "product_copy", id: input.analysisId },
      pinnedModelKey: "openai_structured",
    },
    adapterRun,
    deps
  );

  if (aiResult.kind !== "xong") {
    throw new AppError("INTERNAL", `AI không thể chạy: ${aiResult.reason}`);
  }

  const raw = aiResult.output;
  if (!raw || typeof raw !== "object") {
    throw new AppError("INTERNAL", "AI trả về dữ liệu không hợp lệ");
  }

  const rawWithStyle = {
    ...(raw as unknown as Record<string, unknown>),
    suggested_style: (raw as unknown as Record<string, unknown>).suggested_style ?? identity.style ?? null,
  };

  const saved = await copyRepo.createFromAnalysis(ctx, {
    analysisId: input.analysisId,
    productId: analysis.product_id ?? input.productId ?? null,
    raw: rawWithStyle,
    profileVersion: "v1",
  });

  return { copyId: saved.id, raw: saved.raw };
}