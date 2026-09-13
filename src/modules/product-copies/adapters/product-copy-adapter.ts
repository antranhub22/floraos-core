import type { LLMProvider, LLMRequest, LLMResponse } from "@/core/ports/llm-provider";
import type { AiModelCandidate } from "@/core/ai/domain/routing";
import type { AdapterOutcome } from "@/core/ai/gateway";

export interface ProductCopyInput {
  analysis: {
    identity: {
      category: string;
      style: string;
      color_tone: string;
      flower_count: number;
      bud_count: number;
      damaged_count: number;
    };
    bom: {
      flowers: Array<{ name: string; quantity: number; confidence: number }>;
      foliage: Array<{ name: string; quantity: number }>;
      accessories: Array<{ name: string; quantity: number }>;
      wrapping: Array<{ layer: string; material: string; color: string }>;
    };
    confidence: number;
  };
  brand: {
    tone_of_voice?: string | null;
    hashtags?: string[] | null;
    cta_templates?: string[] | null;
  };
  occasions: Array<{ code: string; name: string }>;
}

export interface ProductCopyOutput {
  suggested_name: string;
  suggested_description: string;
  suggested_tags: string[];
  suggested_occasions: string[];
  suggested_price_segment: "budget" | "standard" | "premium" | "luxury";
}

function buildPrompt(input: ProductCopyInput): string {
  const { analysis, brand, occasions } = input;
  
  const flowerNames = analysis.bom.flowers.map(f => `${f.name} (${f.quantity})`).join(", ") || "không có";
  const foliageNames = analysis.bom.foliage.map(f => `${f.name} (${f.quantity})`).join(", ") || "không có";
  const accessoryNames = analysis.bom.accessories.map(a => `${a.name} (${a.quantity})`).join(", ") || "không có";
  const wrappingNames = analysis.bom.wrapping.map(w => `${w.layer}: ${w.material} ${w.color}`).join(", ") || "không có";

  const occasionNames = occasions.map(o => o.name).join(", ") || "không có";

  return `Bạn là chuyên viên viết nội dung bán hàng cho cửa hàng hoa.

THÔNG TIN SẢN PHẨM:
- Danh mục: ${analysis.identity.category}
- Phong cách: ${analysis.identity.style}
- Tông màu: ${analysis.identity.color_tone}
- Số lượng hoa chính: ${analysis.identity.flower_count}
- Số lượng nụ: ${analysis.identity.bud_count}
- Số lượng hỏng: ${analysis.identity.damaged_count}
- Độ tin cậy phân tích: ${Math.round(analysis.confidence * 100)}%

BILL OF MATERIALS:
- Hoa chính: ${flowerNames}
- Lá/cành: ${foliageNames}
- Phụ kiện: ${accessoryNames}
- Gói/Trang trí: ${wrappingNames}

THƯƠNG HIỆU:
- Tone of voice: ${brand.tone_of_voice || "Chưa cấu hình"}
- Hashtags gợi ý: ${brand.hashtags?.join(", ") || "Chưa cấu hình"}
- CTA templates: ${brand.cta_templates?.join(" | ") || "Chưa cấu hình"}

DỊP GỢI Ý (từ dữ liệu cửa hàng):
${occasionNames}

HÃY TRẢ VỀ JSON THEO ĐÚNG SCHEMA SAU:
{
  "suggested_name": "Tên sản phẩm hấp dẫn, ngắn gọn",
  "suggested_description": "Mô tả chi tiết, cảm xúc, bán được",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "suggested_occasions": ["dip1", "dip2"],
  "suggested_price_segment": "budget|standard|premium|luxury"
}

LƯU Ý:
- suggested_name: Tối đa 100 ký tự, tiếng Việt, không ký tự đặc biệt
- suggested_description: 200-500 ký tự, viết như người bán hàng thật
- suggested_tags: 3-8 tag, tiếng Việt không dấu, lowercase
- suggested_occasions: Chỉ chọn từ danh sách dịp gợi ý ở trên
- suggested_price_segment: Chỉ một trong 4 giá trị cho phép
`;
}

export function createProductCopyAdapter(
  llmProvider: LLMProvider,
  input: ProductCopyInput,
  organizationId: string
): (model: AiModelCandidate) => Promise<AdapterOutcome<ProductCopyOutput>> {
  return async (_model: AiModelCandidate) => {
    try {
      const prompt = buildPrompt(input);
      
      const request: LLMRequest = {
        organizationId,
        prompt,
        jsonSchema: {
          type: "object",
          properties: {
            suggested_name: { type: "string", maxLength: 100 },
            suggested_description: { type: "string", minLength: 200, maxLength: 500 },
            suggested_tags: { 
              type: "array", 
              items: { type: "string" },
              minItems: 3,
              maxItems: 8
            },
            suggested_occasions: { 
              type: "array", 
              items: { type: "string" }
            },
            suggested_price_segment: { 
              type: "string", 
              enum: ["budget", "standard", "premium", "luxury"]
            },
          },
          required: ["suggested_name", "suggested_description", "suggested_tags", "suggested_occasions", "suggested_price_segment"],
          additionalProperties: false,
        },
        maxTokens: 1000,
      };

      const response: LLMResponse = await llmProvider.complete(request);
      
      let output: ProductCopyOutput;
      try {
        output = JSON.parse(response.text);
      } catch {
        throw new Error("AI trả về không phải JSON hợp lệ");
      }

      // Validate output
      if (!output.suggested_name || !output.suggested_description || 
          !Array.isArray(output.suggested_tags) || 
          !Array.isArray(output.suggested_occasions) ||
          !["budget", "standard", "premium", "luxury"].includes(output.suggested_price_segment)) {
        throw new Error("Kết quả AI thiếu trường bắt buộc hoặc giá trị không hợp lệ");
      }

      const result: AdapterOutcome<ProductCopyOutput> = {
        ok: true,
        output,
        scores: {
          factual: 0.8,
          brand: 0.8,
          readability: 0.8,
        },
        latencyMs: 0,
      };
      if (response.costUsd !== undefined) {
        Object.assign(result, { costUsd: response.costUsd });
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      };
    }
  };
}