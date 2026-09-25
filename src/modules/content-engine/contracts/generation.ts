/**
 * Hợp đồng request/response cho API sinh bài (P27, mục 6 kế hoạch, Đợt 2).
 * Nguồn chuẩn là zod — route chỉ `.parse`/`.safeParse`, không tự khai lại
 * hình dạng dữ liệu (cùng nguyên tắc `brief.ts`).
 *
 * Thuần — không import Prisma, không gọi mạng.
 */

import { z } from "zod"

import { briefChannelSchema } from "./brief"

export const GENERATE_CONTENT_VERSION = 1 as const

/** `POST /api/v1/content-engine/generations` — cần ít nhất một trong các nguồn dữ liệu để dựng Brief. */
export const generateContentBodySchema = z
  .object({
    asset_id: z.string().uuid().nullish(),
    product_id: z.string().uuid().nullish(),
    analysis_run_id: z.string().min(1).nullish(),
    topic_id: z.string().min(1).nullish(),
    scene_plan_id: z.string().min(1).nullish(),
    channels: z.array(briefChannelSchema).min(1).max(4),
  })
  .refine((d) => Boolean(d.asset_id || d.product_id), {
    message: "Cần asset_id hoặc product_id để dựng Content Brief",
    path: ["product_id"],
  })

export type GenerateContentBody = z.infer<typeof generateContentBodySchema>

/** `GET /api/v1/content-engine/generations?asset_id&topic_id&mode` — tra bản mới nhất, KHÔNG tạo job. */
export const generationLookupQuerySchema = z.object({
  asset_id: z.string().uuid().nullish(),
  topic_id: z.string().min(1).nullish(),
  scene_plan_id: z.string().min(1).nullish(),
  mode: z.enum(["AUTHENTIC", "CREATIVE"]).nullish(),
})

export type GenerationLookupQuery = z.infer<typeof generationLookupQuerySchema>
