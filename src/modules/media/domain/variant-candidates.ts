/**
 * Nhiều phương án cho một cảnh Khu vực D (Đợt 2 nâng cấp chất lượng ảnh,
 * 25/09/2026).
 *
 * `variant_count = n` tạo n job con cùng `job_group_id`; mỗi job con là một
 * PHƯƠNG ÁN đầy đủ (qua cổng Subject Integrity riêng, trừ credit riêng). PO
 * chốt 24/09: mặc định 1 phương án, bấm mới có thêm.
 *
 * Phương án phải KHÁC NHAU THẬT, không phải n bản giống hệt:
 *   - nhà cung cấp có seed (đám mây): giữ nguyên chỉ đạo, mỗi phương án một
 *     seed — cùng ý đồ, hậu cảnh khác;
 *   - phông cục bộ (không có seed, không đọc prompt): đổi vị trí bó hoa và
 *     hướng sáng theo vòng — khác bố cục và hướng bóng.
 *
 * Hai nút trên thẻ cảnh:
 *   - "Sinh lại giống thế này" → `candidateDirections(hiện tại, n, engine)`
 *     với chỉ đạo của ảnh đang chọn (seed mới);
 *   - "Thử hướng khác" → `alternateDirection(hiện tại)`: đổi cỡ cảnh, hướng
 *     sáng và phong cách.
 *
 * Thuần — không Prisma, không mạng, không `node:crypto` (giao diện import được).
 */

import { costCreditForFeature } from "@/modules/usage/domain/pricing"

import {
  MAX_VARIANT_SEED,
  VARIANT_PLACEMENTS,
  VARIANT_SHOTS,
  VARIANT_STYLES,
  type LightDirection,
  type VariantDirection,
  type VariantShot,
  type VariantStyle,
} from "./variant-direction-rules"
import { MEDIA_VARIANT_CLOUD_FEATURE, MEDIA_VARIANT_FEATURE } from "./variant-rules"

export const MIN_VARIANT_COUNT = 1
export const MAX_VARIANT_COUNT = 4
export const DEFAULT_VARIANT_COUNT = 1

export type VariantEngine = "local_studio" | "cloud_provider"

export function clampVariantCount(n: number | undefined): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_VARIANT_COUNT
  return Math.max(MIN_VARIANT_COUNT, Math.min(MAX_VARIANT_COUNT, Math.trunc(n)))
}

/** Credit của MỘT phương án — cùng bảng giá `enqueueJob` dùng để trừ. */
export function variantUnitCostCredit(engine: VariantEngine): number {
  return costCreditForFeature(engine === "cloud_provider" ? MEDIA_VARIANT_CLOUD_FEATURE : MEDIA_VARIANT_FEATURE)
}

/** Credit cả lượt bấm — hiện TRƯỚC khi bấm (Đợt 2). */
export function variantTotalCostCredit(engine: VariantEngine, count: number): number {
  return variantUnitCostCredit(engine) * clampVariantCount(count)
}

/** Khoá idempotency của phương án thứ `index` (0-based). Phương án đầu giữ nguyên
 *  khoá gốc để `variant_count = 1` y hệt hành vi trước Đợt 2. */
export function candidateIdempotencyKey(baseKey: string, index: number): string {
  return index === 0 ? baseKey : `${baseKey}:c${index + 1}`
}

const LIGHT_CYCLE: readonly LightDirection[] = ["left", "right"]

/** Bản sao chỉ đạo không có seed (để worker bốc seed mới). */
function withoutSeed(d: VariantDirection): VariantDirection {
  const out: { -readonly [K in keyof VariantDirection]?: VariantDirection[K] } = { ...d }
  delete out.seed
  return out as VariantDirection
}

function nextInCycle<T>(list: readonly T[], current: T, step = 1): T {
  const i = list.indexOf(current)
  return list[((i < 0 ? 0 : i) + step) % list.length] as T
}

/**
 * Chỉ đạo cho `count` phương án. Phương án 1 luôn là `base` nguyên vẹn.
 *
 * Đám mây: seed `base.seed + i` nếu người gọi đã chốt seed (tái tạo được cả
 * bộ), còn không thì để trống — worker tự bốc và ghi lại seed từng phương án.
 * Cục bộ: xoay vị trí (giữa / một phần ba trái / phải) và hướng sáng.
 */
export function candidateDirections(
  base: VariantDirection,
  count: number,
  engine: VariantEngine
): VariantDirection[] {
  const n = clampVariantCount(count)
  const out: VariantDirection[] = [base]
  for (let i = 1; i < n; i++) {
    if (engine === "cloud_provider") {
      const rest = withoutSeed(base)
      out.push(
        base.seed !== undefined ? { ...rest, seed: (base.seed + i) % (MAX_VARIANT_SEED + 1) } : rest
      )
    } else {
      out.push({
        ...base,
        composition: {
          ...base.composition,
          placement: nextInCycle(VARIANT_PLACEMENTS, base.composition.placement, i),
        },
        lighting: {
          ...base.lighting,
          direction:
            i % 2 === 1
              ? nextInCycle(LIGHT_CYCLE, base.lighting.direction === "right" ? "right" : "left")
              : base.lighting.direction,
        },
      })
    }
  }
  return out
}

const SHOT_CYCLE: readonly VariantShot[] = ["medium", "wide", "close"]
const LIGHT_OPPOSITE: Readonly<Record<LightDirection, LightDirection>> = {
  left: "right",
  right: "left",
  above: "left",
  front: "right",
}

/**
 * "Thử hướng khác": cỡ cảnh kế tiếp (trung → toàn → cận), hướng sáng đối diện,
 * phong cách kế tiếp; bỏ seed (hướng mới thì hậu cảnh mới). Bảng màu giữ
 * nguyên — đó là màu của thương hiệu/kịch bản, không phải "hướng".
 */
export function alternateDirection(current: VariantDirection): VariantDirection {
  const rest = withoutSeed(current)
  const style: VariantStyle = nextInCycle(VARIANT_STYLES, current.style ?? "natural")
  return {
    ...rest,
    composition: {
      shot: nextInCycle(SHOT_CYCLE, current.composition.shot),
      placement: current.composition.placement,
    },
    lighting: { ...current.lighting, direction: LIGHT_OPPOSITE[current.lighting.direction] },
    style,
    fromPlan: [],
  }
}

/** Đọc lại chỉ đạo đã dùng từ metadata asset / output job (worker ghi snake_case). */
export function directionFromRecord(meta: Record<string, unknown> | null | undefined): VariantDirection {
  const m = meta ?? {}
  const comp = (m.composition && typeof m.composition === "object" ? m.composition : {}) as Record<string, unknown>
  const shot = (VARIANT_SHOTS as readonly string[]).includes(String(comp.shot)) ? (comp.shot as VariantShot) : "medium"
  const placement = (VARIANT_PLACEMENTS as readonly string[]).includes(String(comp.placement))
    ? (comp.placement as VariantDirection["composition"]["placement"])
    : "center"
  const light = ["left", "right", "above", "front"].includes(String(m.light_direction))
    ? (m.light_direction as LightDirection)
    : "left"
  const style = (VARIANT_STYLES as readonly string[]).includes(String(m.style)) ? (m.style as VariantStyle) : undefined
  const seed = typeof m.seed === "number" && Number.isInteger(m.seed) ? m.seed : undefined
  const palette = Array.isArray(m.palette) ? m.palette.filter((c): c is string => typeof c === "string") : []
  return {
    fillMode: m.fill_mode === "pad" ? "pad" : "full_frame",
    composition: { shot, placement },
    lighting: { direction: light },
    palette,
    ...(seed !== undefined ? { seed } : {}),
    ...(style ? { style } : {}),
    fromPlan: [],
  }
}

/** Số phương án mỗi lần bấm "Sinh lại giống thế này". */
export const SIMILAR_CANDIDATE_COUNT = 2

/**
 * Chỉ đạo gốc gửi cho "Sinh lại giống thế này" (`variant_count =
 * SIMILAR_CANDIDATE_COUNT`) sao cho KHÔNG phương án nào trùng ảnh đang xem:
 *   - đám mây: cùng chỉ đạo, bỏ seed → worker bốc seed mới cho từng phương án;
 *   - cục bộ (không seed): dời vị trí bó hoa một nấc — `candidateDirections`
 *     dời tiếp nấc nữa cho phương án 2, nên cả hai khác ảnh đang xem.
 */
export function similarDirection(current: VariantDirection, engine: VariantEngine): VariantDirection {
  const rest = withoutSeed(current)
  if (engine === "cloud_provider") return { ...rest, fromPlan: [] }
  return {
    ...rest,
    composition: { ...current.composition, placement: nextInCycle(VARIANT_PLACEMENTS, current.composition.placement) },
    fromPlan: [],
  }
}

/** Trường chỉ đạo trong thân `POST /media/variants` (snake_case, hợp đồng 06c). */
export function directionRequestFields(d: VariantDirection): Record<string, unknown> {
  return {
    fill_mode: d.fillMode,
    composition: { shot: d.composition.shot, placement: d.composition.placement },
    lighting: { direction: d.lighting.direction, ...(d.lighting.mood ? { mood: d.lighting.mood } : {}) },
    ...(d.palette.length > 0 ? { palette: [...d.palette] } : {}),
    ...(d.seed !== undefined ? { seed: d.seed } : {}),
    ...(d.style ? { style: d.style } : {}),
  }
}
