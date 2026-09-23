import { z } from "zod"

import { PACKAGE_CHANNELS } from "@/modules/creative-production/domain/campaign-package-rules"

/** Bài đăng theo kênh — giới hạn độ dài thật kiểm ở QA (Chặng 08). */
export const packagePostsSchema = z
  .array(
    z.object({
      channel: z.enum(PACKAGE_CHANNELS),
      text: z.string().max(70000),
      hashtags: z.array(z.string().max(100)).max(60).default([]),
    })
  )
  .max(PACKAGE_CHANNELS.length)
  .refine((posts) => new Set(posts.map((p) => p.channel)).size === posts.length, "Mỗi kênh một bài")

export const topicSnapshotSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().max(500),
  angleCategory: z.string().max(50).optional(),
  hook: z.string().max(1000).optional(),
  cta: z.string().max(1000).optional(),
  scene2Preset: z.string().max(50).optional(),
})

export const launchPlanSchema = z.object({
  channels: z.array(z.enum(PACKAGE_CHANNELS)).min(1).max(PACKAGE_CHANNELS.length),
  scheduled_at: z.string().datetime().nullish(),
  post_refs: z
    .array(z.object({ platform: z.enum(PACKAGE_CHANNELS), content_id: z.string().trim().min(1).max(200) }))
    .max(50)
    .default([]),
})
