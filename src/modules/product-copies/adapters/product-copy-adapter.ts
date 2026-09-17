import type { LLMProvider, LLMRequest, LLMResponse } from "@/core/ports/llm-provider";
import type { AiModelCandidate } from "@/core/ai/domain/routing";
import type { AdapterOutcome } from "@/core/ai/gateway";

import type { HinhChieuPhanTich } from "../domain/analysis-projection";
import {
  chamBaKenh,
  DAI_MO_TA,
  DAI_THE,
  TEN_TOI_DA,
  type CopyOutput,
  type NgữCảnhChấm,
} from "../domain/copy-scoring";

export interface ProductCopyInput {
  /**
   * Hình chiếu của hợp đồng Vision — dựng bằng `projectAnalysisForCopy`,
   * KHÔNG đọc thẳng `raw`. Hợp đồng dùng khoá tiếng Việt và đọc sai tên
   * trường không làm đỏ ca thử nào, chỉ đưa `undefined` vào lời nhắc.
   */
  analysis: HinhChieuPhanTich;
  brand: {
    tone_of_voice?: string | null;
    hashtags?: string[] | null;
    cta_templates?: string[] | null;
    forbidden_styles?: string[] | null;
  };
  occasions: Array<{ code: string; name: string }>;
}

export type ProductCopyOutput = CopyOutput & {
  suggested_price_segment: "budget" | "standard" | "premium" | "luxury";
};

const PHAN_KHUC = ["budget", "standard", "premium", "luxury"] as const;

function dong(nhan: string, gia_tri: string | number | null): string {
  return `- ${nhan}: ${gia_tri === null || gia_tri === "" ? "chưa xác định" : gia_tri}`;
}

export function buildPrompt(input: ProductCopyInput): string {
  const { analysis, brand, occasions } = input;
  const bom = analysis.bom;

  const ke = (ds: Array<{ name: string; quantity: number | null }>) =>
    ds.length === 0
      ? "không có"
      : ds.map((x) => (x.quantity ? `${x.name} (${x.quantity})` : x.name)).join(", ");

  const goi =
    bom.wrapping.length === 0
      ? "không có"
      : bom.wrapping
          .map((w) => [w.layer, w.material, w.color].filter(Boolean).join(" "))
          .filter((x) => x.length > 0)
          .join(", ") || "không có";

  const tenDip = occasions.map((o) => o.name);

  return `Bạn là chuyên viên viết nội dung bán hàng cho cửa hàng hoa.

SẢN PHẨM
${dong("Phân loại", analysis.identity.category)}
${dong("Hình dáng", analysis.identity.shape)}
${dong("Vật chứa", analysis.identity.container)}
${dong("Phong cách thiết kế", analysis.identity.phong_cach)}
${dong("Dịp sử dụng đã nhận diện", analysis.identity.dip_su_dung)}
${dong("Tông màu chủ đạo", analysis.tone_mau.length > 0 ? analysis.tone_mau.join(", ") : null)}
${dong("Tổng số cành", analysis.flower_count)}
${dong("Số nụ", analysis.bud_count)}
${dong("Độ tin cậy phân tích", analysis.confidence === null ? null : `${analysis.confidence}%`)}

ĐỊNH MỨC VẬT TƯ
${dong("Hoa", ke(bom.flowers))}
${dong("Lá và cành", ke(bom.foliage))}
${dong("Phụ kiện", ke(bom.accessories))}
${dong("Gói và trang trí", goi)}

THƯƠNG HIỆU
${dong("Giọng thương hiệu", brand.tone_of_voice ?? null)}
${dong("Hashtag của cửa hàng", brand.hashtags?.join(", ") ?? null)}
${dong("Mẫu kêu gọi hành động", brand.cta_templates?.join(" | ") ?? null)}
${dong("Cụm từ KHÔNG được dùng", brand.forbidden_styles?.join(", ") ?? null)}

DANH MỤC DỊP CỦA CỬA HÀNG
${tenDip.length > 0 ? tenDip.join(", ") : "cửa hàng chưa khai dịch nào"}

RÀNG BUỘC
- Chỉ viết về những gì có trong ĐỊNH MỨC VẬT TƯ ở trên. Không thêm loại hoa,
  màu sắc hay chi tiết nào không có trong danh sách đó.
- Không nêu con số nào ngoài những con số đã cho. Đặc biệt không tự đặt ra
  số cành, số bông hay kích thước.
- Trường nào ghi "chưa xác định" thì bỏ qua, không đoán thay.
- suggested_name: tối đa ${TEN_TOI_DA} ký tự, tiếng Việt có dấu.
- suggested_description: ${DAI_MO_TA.min}–${DAI_MO_TA.max} ký tự.
- suggested_tags: ${DAI_THE.min}–${DAI_THE.max} thẻ, tiếng Việt KHÔNG dấu, viết thường, nối bằng dấu gạch ngang.
- suggested_occasions: chỉ chọn từ DANH MỤC DỊP CỦA CỬA HÀNG, chép đúng tên.
- suggested_price_segment: đúng một trong ${PHAN_KHUC.join(" | ")}.

Trả về JSON đúng lược đồ đã cho, không thêm lời dẫn.`;
}

function hopLe(output: unknown): output is ProductCopyOutput {
  const o = output as Partial<ProductCopyOutput> | null;
  return (
    !!o &&
    typeof o.suggested_name === "string" &&
    o.suggested_name.length > 0 &&
    typeof o.suggested_description === "string" &&
    o.suggested_description.length > 0 &&
    Array.isArray(o.suggested_tags) &&
    Array.isArray(o.suggested_occasions) &&
    typeof o.suggested_price_segment === "string" &&
    (PHAN_KHUC as readonly string[]).includes(o.suggested_price_segment)
  );
}

export function createProductCopyAdapter(
  llmProvider: LLMProvider,
  input: ProductCopyInput,
  organizationId: string
): (model: AiModelCandidate) => Promise<AdapterOutcome<ProductCopyOutput>> {
  return async (model: AiModelCandidate) => {
    const batDau = Date.now();
    try {
      const request: LLMRequest = {
        organizationId,
        prompt: buildPrompt(input),
        // Khoá mô hình mà bộ định tuyến của cổng AI vừa chọn. Bỏ qua tham số
        // này là ghi vào `ai_requests` một quyết định chưa từng được thi hành.
        model: model.key,
        jsonSchema: {
          type: "object",
          properties: {
            suggested_name: { type: "string", maxLength: TEN_TOI_DA },
            suggested_description: {
              type: "string",
              minLength: DAI_MO_TA.min,
              maxLength: DAI_MO_TA.max,
            },
            suggested_tags: {
              type: "array",
              items: { type: "string" },
              minItems: DAI_THE.min,
              maxItems: DAI_THE.max,
            },
            suggested_occasions: {
              type: "array",
              items:
                input.occasions.length > 0
                  ? { type: "string", enum: input.occasions.map((o) => o.name) }
                  : { type: "string" },
            },
            suggested_price_segment: { type: "string", enum: [...PHAN_KHUC] },
          },
          required: [
            "suggested_name",
            "suggested_description",
            "suggested_tags",
            "suggested_occasions",
            "suggested_price_segment",
          ],
          additionalProperties: false,
        },
        maxTokens: 1000,
      };

      const response: LLMResponse = await llmProvider.complete(request);

      let output: unknown;
      try {
        output = JSON.parse(response.text);
      } catch {
        throw new Error("Mô hình trả về không phải JSON hợp lệ");
      }

      if (!hopLe(output)) {
        throw new Error("Kết quả thiếu trường bắt buộc hoặc phân khúc giá không hợp lệ");
      }

      const ngu_canh: NgữCảnhChấm = {
        analysis: input.analysis,
        occasionNames: input.occasions.map((o) => o.name),
        forbidden: input.brand.forbidden_styles ?? [],
      };

      const result: AdapterOutcome<ProductCopyOutput> = {
        ok: true,
        output,
        // Ba kênh mà `AIC-04` khai, chấm bằng luật tất định trên chính dữ
        // liệu đã có — không phải ba hằng số.
        scores: chamBaKenh(output, ngu_canh),
        latencyMs: Date.now() - batDau,
      };
      if (response.costUsd !== undefined) Object.assign(result, { costUsd: response.costUsd });
      if (response.inputTokens !== undefined) {
        Object.assign(result, { inputTokens: response.inputTokens });
      }
      if (response.outputTokens !== undefined) {
        Object.assign(result, { outputTokens: response.outputTokens });
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
