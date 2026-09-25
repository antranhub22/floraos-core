/**
 * Creative Studio — Shared Types & Interfaces
 *
 * Rút từ `page.tsx` monolith cũ. Mọi workspace component dùng chung các type
 * này qua custom hook `useCreativeStudioData`.
 */

import type { ResultField, JudgmentState } from "@/components/result/result-card"
import type { FlowStep } from "@/components/flow/flow-steps"
import type {
  CameraAngleType,
  HumanInteractionType,
  StorylineMode,
} from "@/modules/media/domain/creative-studio-schemas"

// ============================================================
// Tab & Engine types
// ============================================================

export type CreativeStudioTab = "optimize" | "variant"

export type OptimizationEngine = "local_studio" | "cloud_provider"

export type VariantEngineMode = "local_studio" | "cloud_provider"

export type CloudProvider = "photoroom" | "imagen" | "fal" | "stability"

// ============================================================
// Phase (internal state machine)
// ============================================================

/** M04a phases */
export type OptimizePhase = "select" | "confirm-a" | "running-a" | "result-a"

/** M04b phases */
export type VariantPhase = "config-b" | "running-b" | "result-b"

/** Global phases */
export type GlobalPhase = "saved" | "error"

export type Phase = OptimizePhase | VariantPhase | GlobalPhase

// ============================================================
// Data types (from API responses)
// ============================================================

export interface AssetItem {
  id: string
  name: string
  storage_key: string
  url?: string | null
  product_name?: string | null
  created_at?: string | null
}

export interface MasterItem {
  id: string
  name: string
  storage_key: string
  url?: string | null
  product_id?: string | null
  product_name?: string | null
}

export interface M04bVariantItem {
  asset_id: string
  variant_key: string
  title: string
  background: string
  ratio: string
  watermark: boolean
  generative_fill_used: boolean
  url: string
  approval_state: "pending" | "approved" | "rejected"
  approved_at: string | null
}

export interface M04bIntegrity {
  subject_pixel_identity: number
  generative_fill_used: boolean
  source_master_asset_id: string
  result: "SAFE" | "GOOD" | "WARNING" | "REJECTED"
  ly_do: string[]
  /** 25/09/2026: `perceptual` = luồng nhà cung cấp trọn gói (đo hình dáng + cấu trúc + màu). */
  method?: "pixel_exact" | "perceptual"
  perceptual?: { structure_ssim: number | null; color_delta_e: number | null; shape_iou: number | null }
  ai_relit?: boolean
}

/** Mô tả số đo của cổng cho người dùng — theo cách đo. */
export function describeIntegrity(t: Pick<M04bIntegrity, "subject_pixel_identity" | "result" | "method" | "perceptual" | "ai_relit">): string {
  if (t.method === "perceptual") {
    const p = t.perceptual
    const iou = typeof p?.shape_iou === "number" ? `hình dáng ${(p.shape_iou * 100).toFixed(1)}%` : "hình dáng —"
    const ssim = typeof p?.structure_ssim === "number" ? `cấu trúc ${(p.structure_ssim * 100).toFixed(1)}%` : "cấu trúc —"
    const de = typeof p?.color_delta_e === "number" ? `lệch màu ΔE ${p.color_delta_e.toFixed(1)}` : "lệch màu —"
    return `Giữ nguyên bó hoa: ${iou} · ${ssim} · ${de} (${t.result})${t.ai_relit ? " · đã chỉnh sáng bằng AI" : ""}`
  }
  return `Lõi trùng khít ${(t.subject_pixel_identity * 100).toFixed(2)}% (${t.result})`
}

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null

// ============================================================
// Flow step definitions
// ============================================================

export const FLOW_M04A: FlowStep[] = [
  { key: "ANALYZING", label: "Phân tích chất lượng" },
  { key: "ENHANCING", label: "Tách sản phẩm & Tăng cường" },
  { key: "SMART_REFRAME", label: "Dựng bố cục & Smart Reframe" },
  { key: "VERIFYING", label: "Kiểm duyệt Identity Guard" },
]

/**
 * Bốn bước này là bốn giá trị `generation_jobs.stage` mà worker M04b ghi
 * thật. Bản trước chạy ba nhãn theo `setTimeout(700)` / `setTimeout(1400)`,
 * nên thanh tiến trình vẫn nhích đều kể cả khi worker đã chết.
 */
export const FLOW_M04B: FlowStep[] = [
  { key: "SEGMENTING", label: "Tách chủ thể khỏi nền" },
  { key: "COMPOSING", label: "Ghép bối cảnh & đóng dấu" },
  { key: "VERIFYING", label: "Đo toàn vẹn chủ thể" },
  { key: "GENERATING_OUTPUTS", label: "Ghi vào kho ảnh" },
]

// ============================================================
// Default result fields
// ============================================================

export const FIELDS_M04A_DEFAULT: ResultField[] = [
  { key: "enhancer", label: "Bộ tăng cường AI (Provider)", type: "readonly", editable: false, value: "Studio AI Pipeline (Chuẩn E-commerce)" },
  { key: "resolution", label: "Độ phân giải đầu ra", type: "readonly", editable: false, value: "Chuẩn HD Master (2x Lanczos)" },
  { key: "quality-score", label: "Điểm kiểm duyệt Identity Guard", type: "readonly", editable: false, value: "Đang chờ chấm..." },
  { key: "ratio-1", label: "Tỉ lệ 1:1 (Vuông)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "ratio-2", label: "Tỉ lệ 4:5 (Dọc nhẹ)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "ratio-3", label: "Tỉ lệ 9:16 (Stories/Reels)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "ratio-4", label: "Tỉ lệ 16:9 (Banner)", type: "readonly", editable: false, value: "Sẵn sàng" },
  { key: "brightness", label: "Độ sáng (sửa được)", type: "text", editable: true, value: "Cân bằng tự nhiên" },
  { key: "contrast", label: "Độ tương phản (sửa được)", type: "text", editable: true, value: "Tối ưu tương phản Studio" },
]

export const FIELDS_M04B_DEFAULT: ResultField[] = [
  { key: "background", label: "Bối cảnh đã dùng", type: "readonly", editable: false, value: "—" },
  { key: "ratio", label: "Tỉ lệ khung", type: "readonly", editable: false, value: "—" },
  { key: "watermark", label: "Đóng dấu thương hiệu", type: "readonly", editable: false, value: "—" },
  { key: "generative-fill", label: "Cờ generative fill", type: "readonly", editable: false, value: "—" },
  { key: "integrity", label: "Toàn vẹn lõi chủ thể (đo được)", type: "readonly", editable: false, value: "Đang chờ đo..." },
]

// ============================================================
// Helper functions
// ============================================================

const PROVIDER_DISPLAY_MAP: Record<string, string> = {
  photoroom: "Photoroom AI (Chuẩn E-commerce Quốc tế)",
  fal_flux: "Fal.ai FLUX + IC-Light (Đỉnh cao Studio)",
  studio: "Studio AI Pipeline (Chuẩn E-commerce)",
  openai: "OpenAI Image AI (Cloud)",
  gemini: "Google Gemini Imagen (Cloud)",
  stability_ai: "Stability AI (Stable Image Core)",
  replicate: "Replicate Real-ESRGAN (Cloud GPU)",
  local: "Real-ESRGAN / PIL Lanczos (Local)",
  realesrgan: "Real-ESRGAN (Local)",
  passthrough: "PIL Lanczos 2x (Local)",
}

export function buildFieldsA(data: Record<string, unknown> | null, baseFields: ResultField[]): ResultField[] {
  if (!data) return baseFields
  const guard = data.identity_guard as {
    identity_score?: number
    color_score?: number
    geometry_score?: number
    component_consistency?: number
    result?: string
    ly_do?: string[]
  } | null
  const outputs = data.outputs as { master?: string | null; ratios?: Record<string, string> } | null
  const ratios = outputs?.ratios ?? {}
  const flags = (data.flags as Record<string, unknown>) ?? {}

  const idScore = guard?.identity_score != null ? guard.identity_score : 1
  const colScore = guard?.color_score != null ? guard.color_score : 1
  const geoScore = guard?.geometry_score != null ? guard.geometry_score : 1
  const compScore = guard?.component_consistency != null ? guard.component_consistency : 1

  const diemThapNhat = Math.min(idScore, colScore, geoScore, compScore)
  const diemThapNhatPercent = `${Math.round(diemThapNhat * 100)}%`
  const guardVerdict = (data.result as string) || (guard?.result as string) || "SAFE"

  const rawProvider = String(flags.enhancer_provider || "studio")
  const displayProvider = PROVIDER_DISPLAY_MAP[rawProvider] || rawProvider

  return [
    { key: "enhancer", label: "Bộ tăng cường AI (Provider)", type: "readonly", editable: false, value: displayProvider },
    { key: "resolution", label: "Độ phân giải đầu ra", type: "readonly", editable: false, value: "Chuẩn HD Master (2x Lanczos)" },
    { key: "quality-score", label: "Điểm kiểm duyệt Identity Guard", type: "readonly", editable: false, value: `${guardVerdict} (Điểm thấp nhất: ${diemThapNhatPercent})` },
    { key: "score-id", label: "1. Điểm Nhận dạng (dáng khối, vật chứa)", type: "readonly", editable: false, value: `${Math.round(idScore * 100)}%` },
    { key: "score-geo", label: "2. Điểm Hình học (hướng nhìn, tỉ lệ)", type: "readonly", editable: false, value: `${Math.round(geoScore * 100)}%` },
    { key: "score-color", label: "3. Điểm Màu sắc thành phần", type: "readonly", editable: false, value: `${Math.round(colScore * 100)}%` },
    { key: "score-comp", label: "4. Điểm Nhất quán thành phần (BOM)", type: "readonly", editable: false, value: `${Math.round(compScore * 100)}%` },
    { key: "ratio-1", label: "Tỉ lệ 1:1 (Vuông Instagram/Catalog)", type: "readonly", editable: false, value: ratios["1:1"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "ratio-2", label: "Tỉ lệ 4:5 (Dọc nhẹ Facebook/Feed)", type: "readonly", editable: false, value: ratios["4:5"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "ratio-3", label: "Tỉ lệ 9:16 (Full Story/Reels/TikTok)", type: "readonly", editable: false, value: ratios["9:16"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "ratio-4", label: "Tỉ lệ 16:9 (Ngang Web/Banner)", type: "readonly", editable: false, value: ratios["16:9"] ? "Sẵn sàng" : "Có sẵn" },
    { key: "brightness", label: "Độ sáng (sửa được)", type: "text", editable: true, value: "Cân bằng tự nhiên" },
    { key: "contrast", label: "Độ tương phản (sửa được)", type: "text", editable: true, value: "Tối ưu tương phản Studio" },
  ]
}

/**
 * Năm ô đọc từ đáp ứng máy chủ, không ô nào sửa được.
 */
export function buildFieldsB(
  source: { preset: string | null; ratio: string | null; watermark: boolean } | null,
  toanVen: M04bIntegrity | null,
  getVariantPreset: (id: string) => { name: string },
): ResultField[] {
  if (!source) return FIELDS_M04B_DEFAULT
  const preset = source.preset ? getVariantPreset(source.preset).name : "—"
  const doTrung = toanVen ? describeIntegrity(toanVen) : "Chưa có số đo"
  return [
    { key: "background", label: "Bối cảnh đã dùng", type: "readonly", editable: false, value: preset },
    { key: "ratio", label: "Tỉ lệ khung", type: "readonly", editable: false, value: source.ratio ?? "—" },
    { key: "watermark", label: "Đóng dấu thương hiệu", type: "readonly", editable: false, value: source.watermark ? "Bật (logo của tiệm)" : "Tắt" },
    { key: "generative-fill", label: "Cờ generative fill", type: "readonly", editable: false, value: toanVen?.generative_fill_used ? "Có (chỉ ở phần hậu cảnh)" : "Không" },
    { key: "integrity", label: "Toàn vẹn lõi chủ thể (đo được)", type: "readonly", editable: false, value: doTrung },
  ]
}
