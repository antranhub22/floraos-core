/**
 * Use-case: Plan Narrative Arc — Sinh cung truyện từ Topic + Product.
 *
 * Gọi AI qua cổng để sinh NarrativeArcOutput.
 * Phân nhánh hoàn toàn theo ProductionMode:
 * - AUTHENTIC: 2–3 cảnh đơn giản, giữ ảnh gốc, Ken Burns nhẹ
 * - CREATIVE: 3–5 cảnh sáng tạo, bối cảnh mới, cốt truyện phong phú
 */

import type {
  ProductionMode,
  SelectedTopicInfo,
  ProductContext,
  NarrativeArcOutput,
  NarrativeSceneSpec,
  NarrativeBeat,
  VideoMotionEffect,
  TransitionEffect,
  CropRatio,
} from "../domain/production-types"

// ============================================================
// INPUT / OUTPUT
// ============================================================

export interface PlanNarrativeArcInput {
  readonly mode: ProductionMode
  readonly topic: SelectedTopicInfo
  readonly productContext: ProductContext
  readonly targetDurationSeconds: number
}

// ============================================================
// USE-CASE
// ============================================================

/**
 * Sinh cung truyện cho 1 topic.
 *
 * Phase 1: Dùng rule-based engine (thuần logic).
 * Phase 2 (tương lai): Gọi AI qua narrative-ai-adapter.ts
 */
export function planNarrativeArc(
  input: PlanNarrativeArcInput,
): NarrativeArcOutput {
  if (input.mode === "AUTHENTIC") {
    return buildAuthenticArc(input)
  }
  return buildCreativeArc(input)
}

// ============================================================
// AUTHENTIC ARC — Đơn giản, chân thật
// ============================================================

function buildAuthenticArc(input: PlanNarrativeArcInput): NarrativeArcOutput {
  const { topic, productContext, targetDurationSeconds } = input
  const productName = productContext.commercialPassport.productName
  const components = productContext.commercialPassport.components.join(", ")
  const price = productContext.commercialPassport.priceRange

  // AUTHENTIC: 3 cảnh cố định, ảnh gốc, Ken Burns nhẹ
  const sceneDurations = distributeSceneDurations(targetDurationSeconds, 3)

  const scenes: NarrativeSceneSpec[] = [
    {
      sceneIndex: 1,
      beat: "SETUP",
      beatTitle: `Giới thiệu ${productName}`,
      sceneDescription: "Ảnh gốc toàn cảnh sản phẩm",
      voiceScript: `Xin chào, hôm nay mình muốn giới thiệu ${productName} — ${topic.topicAngle}...`,
      textOverlay: `🌿 ${productName}`,
      durationSeconds: sceneDurations[0]!,
      transitionEffect: "fade",
      motionEffect: "zoom_in",
      connectionToNext: "Hãy cùng ngắm chi tiết nhé...",
      authenticEffect: {
        cropRatio: "9:16",
        motionEffect: "zoom_in",
        showBrandBadge: true,
        showPrice: false,
        overlayText: `🌿 ${productName}`,
        overlayPosition: "top",
      },
    },
    {
      sceneIndex: 2,
      beat: "CLIMAX",
      beatTitle: "Chi tiết sản phẩm",
      sceneDescription: "Cận cảnh, nhấn vào thành phần & chất lượng",
      voiceScript: `${productName} được kết hợp từ ${components}. Mỗi bông hoa đều được chọn lọc kỹ càng...`,
      textOverlay: components,
      durationSeconds: sceneDurations[1]!,
      transitionEffect: "fade",
      motionEffect: "pan_right",
      connectionToNext: "Để sở hữu bó hoa này...",
      authenticEffect: {
        cropRatio: "4:5",
        motionEffect: "pan_right",
        showBrandBadge: false,
        showPrice: !!price,
        overlayText: price ? `Giá: ${price}` : undefined,
        overlayPosition: "bottom",
      },
    },
    {
      sceneIndex: 3,
      beat: "CTA",
      beatTitle: "Kêu gọi đặt hoa",
      sceneDescription: "Ảnh gốc + CTA rõ ràng",
      voiceScript: topic.topicCta || "Inbox mình để đặt hoa tươi ngay hôm nay nhé!",
      textOverlay: topic.topicCta || "Đặt hoa ngay! 🌹",
      durationSeconds: sceneDurations[2]!,
      transitionEffect: "fade",
      motionEffect: "static",
      connectionToNext: "",
      authenticEffect: {
        cropRatio: "1:1",
        motionEffect: "static",
        showBrandBadge: true,
        showPrice: true,
        overlayText: "Đặt ngay!",
        overlayPosition: "bottom",
      },
    },
  ]

  return {
    topicId: topic.topicId,
    topicTitle: topic.topicTitle,
    mode: "AUTHENTIC",
    emotionalTone: topic.topicEmotionalTone || "Ấm áp, chân thật",
    narrativeReasoning:
      "AUTHENTIC mode: giữ ảnh gốc 100%, 3 cảnh đơn giản (giới thiệu → chi tiết → CTA) " +
      "với Ken Burns nhẹ và caption chân thực.",
    scenes,
    totalDurationSeconds: targetDurationSeconds,
  }
}

// ============================================================
// CREATIVE ARC — Sáng tạo, cốt truyện phong phú
// ============================================================

function buildCreativeArc(input: PlanNarrativeArcInput): NarrativeArcOutput {
  const { topic, productContext, targetDurationSeconds } = input
  const productName = productContext.commercialPassport.productName
  const style = productContext.commercialPassport.style

  // CREATIVE: 5 cảnh, bối cảnh mới, cung truyện đầy đủ
  const sceneDurations = distributeSceneDurations(targetDurationSeconds, 5)

  const presets = selectCreativePresets(style, topic.topicCategory)

  const scenes: NarrativeSceneSpec[] = [
    {
      sceneIndex: 1,
      beat: "SETUP",
      beatTitle: "Mở đầu — Bối cảnh",
      sceneDescription: `${productName} trong không gian ${presets[0]!.name}`,
      voiceScript: `${topic.topicHook}`,
      textOverlay: topic.topicTitle,
      durationSeconds: sceneDurations[0]!,
      transitionEffect: "fade",
      motionEffect: "zoom_in",
      connectionToNext: "Và câu chuyện bắt đầu...",
      creativeConfig: {
        preset: presets[0]!.preset,
        lighting: presets[0]!.lighting,
        surface: presets[0]!.surface,
      },
    },
    {
      sceneIndex: 2,
      beat: "RISING",
      beatTitle: "Phát triển — Khám phá",
      sceneDescription: `Góc nhìn mới về ${productName}`,
      voiceScript: `Mỗi cánh hoa ${productName} đều kể một câu chuyện riêng...`,
      textOverlay: `${productContext.commercialPassport.components[0]} ✨`,
      durationSeconds: sceneDurations[1]!,
      transitionEffect: "slide_left",
      motionEffect: "pan_left",
      connectionToNext: "Nhưng điều đặc biệt nhất...",
      creativeConfig: {
        preset: presets[1]!.preset,
        lighting: presets[1]!.lighting,
        surface: presets[1]!.surface,
      },
    },
    {
      sceneIndex: 3,
      beat: "CLIMAX",
      beatTitle: "Cao trào — Điểm nhấn",
      sceneDescription: `${productName} tỏa sáng rực rỡ`,
      voiceScript: `Đây chính là khoảnh khắc khiến bạn không thể rời mắt — ${topic.topicAngle}...`,
      textOverlay: topic.topicAngle,
      durationSeconds: sceneDurations[2]!,
      transitionEffect: "dissolve",
      motionEffect: "zoom_out",
      connectionToNext: "Và cảm xúc ấy...",
      creativeConfig: {
        preset: presets[2]!.preset,
        lighting: presets[2]!.lighting,
        surface: presets[2]!.surface,
      },
    },
    {
      sceneIndex: 4,
      beat: "RESOLUTION",
      beatTitle: "Kết — Cảm xúc",
      sceneDescription: `${productName} trong không gian sống`,
      voiceScript: `${productName} — không chỉ là hoa, mà là lời yêu thương gửi đến người đặc biệt...`,
      textOverlay: `${productName} 💕`,
      durationSeconds: sceneDurations[3]!,
      transitionEffect: "fade",
      motionEffect: "pan_right",
      connectionToNext: "Hãy để chúng tôi giúp bạn...",
      creativeConfig: {
        preset: presets[3]!.preset,
        lighting: presets[3]!.lighting,
        surface: presets[3]!.surface,
      },
    },
    {
      sceneIndex: 5,
      beat: "CTA",
      beatTitle: "Kêu gọi hành động",
      sceneDescription: `Logo + CTA rõ ràng`,
      voiceScript: topic.topicCta || "Đặt ngay hôm nay để nhận ưu đãi đặc biệt!",
      textOverlay: topic.topicCta || "Đặt hoa ngay! 🌹",
      durationSeconds: sceneDurations[4]!,
      transitionEffect: "fade",
      motionEffect: "static",
      connectionToNext: "",
      creativeConfig: {
        preset: presets[4]!.preset,
        lighting: presets[4]!.lighting,
        surface: presets[4]!.surface,
      },
    },
  ]

  return {
    topicId: topic.topicId,
    topicTitle: topic.topicTitle,
    mode: "CREATIVE",
    emotionalTone: topic.topicEmotionalTone || "Sáng tạo, thu hút",
    narrativeReasoning:
      "CREATIVE mode: 5 cảnh AI biến thể bối cảnh mới, cung truyện SETUP → RISING → " +
      "CLIMAX → RESOLUTION → CTA, transition effects phong phú, voice sáng tạo.",
    scenes,
    totalDurationSeconds: targetDurationSeconds,
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Phân bổ thời lượng đều cho các cảnh.
 * Cảnh CTA cuối ngắn hơn, cảnh CLIMAX dài hơn.
 */
export function distributeSceneDurations(
  totalSeconds: number,
  sceneCount: number,
): readonly number[] {
  if (sceneCount <= 0) return []
  if (sceneCount === 1) return [totalSeconds]

  // CTA cuối = 15% tổng, phần còn lại chia đều
  const ctaDuration = Math.max(3, Math.round(totalSeconds * 0.15))
  const remaining = totalSeconds - ctaDuration
  const perScene = Math.round(remaining / (sceneCount - 1))

  const result: number[] = []
  for (let i = 0; i < sceneCount - 1; i++) {
    result.push(perScene)
  }
  result.push(ctaDuration)

  // Bù rounding: điều chỉnh cảnh đầu tiên để tổng = totalSeconds
  const actualTotal = result.reduce((a, b) => a + b, 0)
  if (actualTotal !== totalSeconds && result.length > 0) {
    result[0] = result[0]! + (totalSeconds - actualTotal)
  }

  return result
}

interface PresetOption {
  readonly name: string
  readonly preset: string
  readonly lighting: string
  readonly surface: string
}

function selectCreativePresets(style: string, category: string): readonly PresetOption[] {
  // Bộ presets theo style/category (mở rộng sau)
  const romanticPresets: PresetOption[] = [
    { name: "Xưởng hoa ấm áp", preset: "workshop_cozy", lighting: "warm_golden", surface: "wooden_table" },
    { name: "Bàn tay thợ hoa", preset: "artisan_hands", lighting: "soft_window", surface: "linen_cloth" },
    { name: "Studio trắng", preset: "studio_white", lighting: "soft_diffused", surface: "marble" },
    { name: "Phòng khách ấm cúng", preset: "living_room", lighting: "natural_window", surface: "wooden_shelf" },
    { name: "Cửa hàng hoa", preset: "flower_shop", lighting: "store_ambient", surface: "display_counter" },
  ]

  const modernPresets: PresetOption[] = [
    { name: "Studio tối giản", preset: "minimal_studio", lighting: "ring_light", surface: "concrete" },
    { name: "Café hiện đại", preset: "modern_cafe", lighting: "neon_accent", surface: "glass_table" },
    { name: "Rooftop city", preset: "rooftop", lighting: "golden_hour", surface: "metal_railing" },
    { name: "Art gallery", preset: "gallery", lighting: "track_lighting", surface: "white_pedestal" },
    { name: "Penthouse", preset: "penthouse", lighting: "city_lights", surface: "marble_counter" },
  ]

  if (style.toLowerCase().includes("hiện đại") || category === "modern") {
    return modernPresets
  }
  return romanticPresets
}
