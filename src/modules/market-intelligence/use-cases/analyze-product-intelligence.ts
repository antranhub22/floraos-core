/**
 * Use-case: Phân tích Product Intelligence từ ảnh và thông số sản phẩm.
 * Tuân thủ Clean Architecture — Phụ thuộc Domain, kiểm tra Tenant Isolation.
 * Thực hiện mắt xích đồng bộ: Output Vision -> Keyword Synthesizer -> Query Real Trends -> 10 Topics.
 */

import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";
import { evaluateProductTrendFit, type RealTrendSignalInput } from "../domain/trend-fit";
import { synthesizeProductResearchQueries } from "../domain/synthesize-product-queries";
import type {
  ProductFlowerComponent,
  ProductVisualAttributes,
  ProductPackaging,
  ProductInferredContext,
  ProductIntelligenceReport,
  CommercialPassport,
} from "../domain/product-intelligence-types";

export interface AnalyzeProductIntelligenceParams {
  organizationId: string;
  productName: string;
  imageUrl: string;
  assetId?: string | undefined;
  components?: ProductFlowerComponent[] | undefined;
  attributes?: ProductVisualAttributes[] | ProductVisualAttributes | undefined;
  packaging?: ProductPackaging | undefined;
  context?: ProductInferredContext | undefined;
  commercialPassport?: CommercialPassport | undefined;
}

export async function analyzeProductIntelligence(
  params: AnalyzeProductIntelligenceParams
): Promise<ProductIntelligenceReport> {
  // BẮT BUỘC: Vision AI (Chặng 02 UNDERSTAND) phải trả dữ liệu thật, không fallback cứng
  if (!params.components || params.components.length === 0) {
    throw new Error(
      "[analyzeProductIntelligence] Thiếu components — Vision AI chưa bóc tách thành phần hoa. " +
      "Hãy chạy Chặng 02 UNDERSTAND (analyzeProductVision) trước."
    );
  }
  const components = params.components;

  const rawAttributes = Array.isArray(params.attributes) ? params.attributes[0] : params.attributes;
  if (!rawAttributes) {
    throw new Error(
      "[analyzeProductIntelligence] Thiếu attributes — Vision AI chưa trả thuộc tính thị giác."
    );
  }
  const attributes: ProductVisualAttributes = rawAttributes;

  if (!params.packaging) {
    throw new Error(
      "[analyzeProductIntelligence] Thiếu packaging — Vision AI chưa trả thông tin đóng gói."
    );
  }
  const packaging: ProductPackaging = params.packaging;

  if (!params.context) {
    throw new Error(
      "[analyzeProductIntelligence] Thiếu context — Vision AI chưa trả ngữ cảnh sản phẩm."
    );
  }
  const context: ProductInferredContext = params.context;

  // MẮC XÍCH ĐỒNG BỘ: Sinh từ khóa có chủ đích từ Vision output
  const synthesized = synthesizeProductResearchQueries({
    productName: params.productName,
    components,
    attributes,
    packaging,
    context,
  });

  // Truy vấn các xu hướng thực tế trong CSDL của tổ chức (Tenant Isolation qua Repository)
  let realSignals: RealTrendSignalInput[] = [];
  try {
    const opps = await marketIntelligenceRepo.findTenantOpportunities(params.organizationId, 10);

    realSignals = opps.map((o) => ({
      topicName: o.topic.canonical_name,
      trendScore: o.trend_score,
      viralScore: o.viral_score,
      commercialScore: o.commercial_score,
      summary: o.opportunity_summary,
      marketSignal: `Tương tác cao trên nền tảng (Cơ hội nội dung ${Math.round(o.content_opportunity_score)}/100)`,
    }));
  } catch {
    // Dự phòng an toàn nếu CSDL chưa nạp opportunities
  }

  // Nếu chưa có opportunities riêng của tenant, tra cứu bảng topics chung
  if (realSignals.length === 0) {
    try {
      const topTopics = await marketIntelligenceRepo.findTopTopics(10);

      realSignals = topTopics.map((t) => ({
        topicName: t.canonical_name,
        trendScore: t.scores[0]?.trend_score ?? 70,
        viralScore: t.scores[0]?.viral_score ?? 65,
        summary: t.description ?? undefined,
        marketSignal: `Chủ đề thịnh hành trên thị trường (${t.status})`,
      }));
    } catch {
      // Dự phòng an toàn
    }
  }

  if (!params.productName) {
    throw new Error(
      "[analyzeProductIntelligence] Thiếu productName — Vision AI chưa trả tên sản phẩm."
    );
  }

  const report = evaluateProductTrendFit({
    productName: params.productName,
    imageUrl: params.imageUrl,
    components,
    attributes,
    packaging,
    context,
    commercialPassport: params.commercialPassport,
    realTrendSignals: realSignals,
  });

  return report;
}
