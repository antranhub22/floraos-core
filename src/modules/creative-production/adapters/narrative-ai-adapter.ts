/**
 * Narrative AI Adapter — Gọi AI qua cổng để sinh cung truyện.
 *
 * Phase hiện tại: Stub — plan-narrative-arc.ts dùng rule-based.
 * Phase tương lai: Gọi AI qua src/core/ai/ để sinh NarrativeArcOutput
 * với narrative reasoning sáng tạo hơn.
 *
 * Tuân thủ D15: Mã nghiệp vụ gọi NĂNG LỰC, không gọi NHÀ CUNG CẤP.
 * Adapter này là lớp trung gian duy nhất được phép gọi AI port.
 */

import type {
  NarrativeArcOutput,
  ProductionMode,
  SelectedTopicInfo,
  ProductContext,
} from "../domain/production-types"

// ============================================================
// PORT INTERFACE
// ============================================================

/**
 * Port interface cho Narrative AI.
 * Sẽ được inject bởi infrastructure layer.
 */
export interface INarrativeAiPort {
  /**
   * Sinh cung truyện từ topic + product context.
   * Gọi AI qua cổng chính thức (src/core/ai/).
   */
  generateNarrativeArc(input: NarrativeAiInput): Promise<NarrativeArcOutput>
}

export interface NarrativeAiInput {
  readonly mode: ProductionMode
  readonly topic: SelectedTopicInfo
  readonly productContext: ProductContext
  readonly targetDurationSeconds: number
  /** Ngôn ngữ đầu ra */
  readonly outputLanguage?: "vi" | "en" | undefined
}

// ============================================================
// ADAPTER — Stub Implementation
// ============================================================

/**
 * Stub adapter: trả về null, signaling caller dùng rule-based.
 *
 * Khi AI port sẵn sàng, thay thế bằng adapter thật gọi
 * src/core/ai/ports/content-generation-port.ts
 */
export class StubNarrativeAiAdapter implements INarrativeAiPort {
  async generateNarrativeArc(
    _input: NarrativeAiInput,
  ): Promise<NarrativeArcOutput> {
    // Stub: throw để caller biết cần fallback về rule-based
    throw new Error(
      "NarrativeAiAdapter chưa được triển khai. " +
      "Sử dụng planNarrativeArc() (rule-based) thay thế."
    )
  }
}

// ============================================================
// PROMPT BUILDER — Chuẩn bị sẵn cho Phase AI
// ============================================================

/**
 * Build prompt sinh cung truyện cho AI.
 * Sẽ được dùng khi triển khai adapter thật.
 */
export function buildNarrativeArcPrompt(input: NarrativeAiInput): string {
  const { mode, topic, productContext } = input
  const passport = productContext.commercialPassport

  if (mode === "AUTHENTIC") {
    return [
      `Sinh cung truyện AUTHENTIC cho video marketing hoa tươi.`,
      `Sản phẩm: ${passport.productName} (${passport.category}).`,
      `Phong cách: ${passport.style}.`,
      `Thành phần: ${passport.components.join(", ")}.`,
      `Màu sắc: ${passport.colors.join(", ")}.`,
      `Chủ đề: ${topic.topicTitle} — ${topic.topicAngle}.`,
      `Thời lượng: ${input.targetDurationSeconds}s.`,
      ``,
      `YÊU CẦU:`,
      `- 3 cảnh đơn giản: Giới thiệu → Chi tiết → CTA`,
      `- KHÔNG cốt truyện phức tạp`,
      `- Giọng văn chân thật, gần gũi như chủ tiệm chia sẻ`,
      `- Ken Burns nhẹ (zoom_in, pan_right, static)`,
      `- Giữ ảnh gốc, KHÔNG biến thể AI`,
    ].join("\n")
  }

  return [
    `Sinh cung truyện CREATIVE cho video marketing hoa tươi.`,
    `Sản phẩm: ${passport.productName} (${passport.category}).`,
    `Phong cách: ${passport.style}.`,
    `Thành phần: ${passport.components.join(", ")}.`,
    `Màu sắc: ${passport.colors.join(", ")}.`,
    `Chủ đề: ${topic.topicTitle} — ${topic.topicAngle}.`,
    `Hook: ${topic.topicHook}.`,
    `CTA: ${topic.topicCta}.`,
    `Thời lượng: ${input.targetDurationSeconds}s.`,
    ``,
    `YÊU CẦU:`,
    `- 5 cảnh: SETUP → RISING → CLIMAX → RESOLUTION → CTA`,
    `- Cốt truyện hấp dẫn, cuốn hút`,
    `- Mỗi cảnh có bối cảnh mới (preset, lighting, surface)`,
    `- Voice script sáng tạo, hook mạnh`,
    `- Transition effects phong phú (dissolve, slide, wipe)`,
  ].join("\n")
}
