/** Chặng 06c — CREATE / Khu vực D: ảnh biến thể theo cảnh (job `media.variant[.cloud]`). */

import { z } from "zod"

import {
  MAX_SCENE_PROMPT_LENGTH,
  NARRATIVE_SCENE_INDEXES,
  VARIANT_CLOUD_PROVIDERS,
  VARIANT_PRESET_IDS,
  VARIANT_RATIOS,
} from "@/modules/media/domain/variant-rules"
import {
  FILL_MODES,
  LIGHT_DIRECTIONS,
  MAX_PALETTE_COLORS,
  MAX_VARIANT_SEED,
  VARIANT_PLACEMENTS,
  VARIANT_SHOTS,
} from "@/modules/media/domain/variant-direction-rules"
import { defineStage } from "./define-stage"
import { jobStatusSchema, usageSchema } from "./common"
import { EXAMPLE_JOB_ID } from "./examples-shared"

/** Thân `POST /api/v1/media/variants` (header `Idempotency-Key` bắt buộc). */
export const mediaVariantBodySchema = z.object({
  master_asset_id: z.string().min(1).describe("Master Image đã duyệt"),
  engine: z.enum(["local_studio", "cloud_provider"]).default("local_studio"),
  preset: z.enum(VARIANT_PRESET_IDS),
  ratio: z.enum(VARIANT_RATIOS),
  watermark: z.boolean().default(true),
  auto_enhance: z.boolean().default(false).describe("AIC-14 — chỉ chỉnh vùng nền"),
  // min/max thay cho refine để JSON Schema hiện đúng khoảng 1..5 (refine không biểu diễn được).
  scene_index: z
    .number()
    .int()
    .min(Math.min(...NARRATIVE_SCENE_INDEXES), "scene_index 1..5")
    .max(Math.max(...NARRATIVE_SCENE_INDEXES), "scene_index 1..5")
    .optional()
    .describe("Cảnh 1..5 của kịch bản (CREATIVE 5, AUTHENTIC 3)"),
  scene_plan_id: z.string().trim().min(1).max(160).optional(),
  scene_plan_revision: z.number().int().min(1).max(100000).optional(),
  provider_key: z.enum(VARIANT_CLOUD_PROVIDERS).default("stability").describe("Chỉ nhánh cloud_provider"),
  scene_prompt: z.string().max(MAX_SCENE_PROMPT_LENGTH).optional().describe("Chỉ nhánh cloud_provider — backgroundPrompt của cảnh"),
  // ── Chỉ đạo khung hình (Đợt 1 nâng cấp chất lượng ảnh, 24/09/2026) ──
  // Ý định của FloraOS, KHÔNG phải tên tham số của nhà cung cấp — adapter worker
  // tự dịch. Bỏ trống thì máy chủ lấy từ đúng cảnh trong kịch bản Chặng 05.
  fill_mode: z
    .enum(FILL_MODES)
    .default("full_frame")
    .describe("full_frame = hậu cảnh dựng đúng khung đích (mặc định); pad = cách cũ, đệm màu trơn"),
  composition: z
    .object({
      shot: z.enum(VARIANT_SHOTS).optional().describe("Cỡ cảnh: cận / trung / toàn — mặc định theo kịch bản, không có thì medium"),
      placement: z.enum(VARIANT_PLACEMENTS).optional().describe("Vị trí bó hoa — mặc định center"),
    })
    .optional(),
  lighting: z
    .object({
      direction: z.enum(LIGHT_DIRECTIONS).optional().describe("Hướng nguồn sáng — quyết định hướng bóng; mặc định suy từ kịch bản, không có thì left"),
      mood: z.string().trim().max(120).optional().describe("Mô tả không khí ánh sáng (tiếng Anh) — ghép vào prompt nhà cung cấp"),
    })
    .optional(),
  palette: z
    .array(z.string().trim().min(1).max(40))
    .max(MAX_PALETTE_COLORS)
    .optional()
    .describe("Bảng màu hậu cảnh — mặc định palette của cảnh; màu tiếng Việt thông dụng tự dịch"),
  seed: z
    .number()
    .int()
    .min(0)
    .max(MAX_VARIANT_SEED)
    .optional()
    .describe("Cùng seed → tái tạo đúng hậu cảnh; bỏ trống thì tự bốc và ghi lại vào asset (nhà cung cấp hỗ trợ seed)"),
})

export const mediaVariantResultSchema = z.object({
  job_id: z.string(),
  status: jobStatusSchema.describe("Trạng thái generation_jobs lúc nhận"),
  engine: z.enum(["local_studio", "cloud_provider"]),
  deduped: z.boolean(),
  usage: usageSchema,
})

export const stage06cMedia = defineStage({
  id: "06c",
  stage: 6,
  code: "CREATE_MEDIA",
  slug: "create-media",
  title: "Chặng 06c — CREATE · Khu vực D: Ảnh biến thể theo cảnh",
  summary:
    "Mỗi cảnh một job; qua cổng Subject Integrity. Kết quả là assets MARKETING (PENDING) có cha là Master — đọc qua GET /media/variants/:id.",
  endpoint: { method: "POST", path: "/api/v1/media/variants", capability: "I4", idempotencyKey: true },
  input: mediaVariantBodySchema,
  output: mediaVariantResultSchema,
  examples: {
    input: {
      master_asset_id: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
      engine: "cloud_provider",
      preset: "wedding",
      ratio: "9:16",
      scene_index: 2,
      scene_plan_id: EXAMPLE_JOB_ID,
      scene_plan_revision: 1,
      scene_prompt: "warm bokeh restaurant table at dusk, soft candle light, empty space in the center",
      fill_mode: "full_frame",
      composition: { shot: "wide", placement: "center" },
      lighting: { direction: "right" },
      palette: ["đỏ", "kem"],
    },
    output: {
      job_id: "e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8c",
      status: "PENDING",
      engine: "cloud_provider",
      deduped: false,
      usage: { cost_credit: 2, balance_after: 245 },
    },
  },
})
