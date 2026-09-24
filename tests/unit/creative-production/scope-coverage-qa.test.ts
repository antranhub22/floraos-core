import { describe, expect, test } from "vitest"

import { evaluateCampaignQa, type QaInput } from "@/modules/creative-production/domain/campaign-package-rules"
import { mergeVideoIds } from "@/modules/creative-production/use-cases/manage-campaign-package"

// PO 24/09/2026: QA trục "Đủ phạm vi đã chọn" — chỉ đòi loại kết quả đã chọn,
// mỗi khung một bộ ảnh + một video, mỗi kênh một bài.

const v916 = { stage: "RENDER_COMPLETED", approval: "APPROVED", aspectRatio: "9:16", scenePlanId: "P", scenePlanRevision: 1, usesPlanAudio: true }
const img = (r: string) => ({ assetId: `img-${r}`, approvalState: "APPROVED", identityScore: 1, aspectRatio: r, watermark: true, scenePlanId: "P", scenePlanRevision: 1 })
const base: QaInput = {
  posts: [{ channel: "tiktok", text: "Giỏ hoa sinh nhật tone vàng", hashtags: [] }],
  variants: [img("9:16")],
  video: null,
  videos: [v916],
  audio: { stage: "COMPLETED", scenePlanId: "P", scenePlanRevision: 1 },
  brand: { hasLogo: true, forbiddenStyles: null },
  now: new Date("2026-09-24T12:00:00Z"),
  plan: { scenePlanId: "P", revision: 1, scope: { produce: ["content", "audio", "image", "video"], ratios: ["9:16"], postChannels: ["tiktok"] } },
}
const axis = (i: QaInput) => evaluateCampaignQa(i).checks.find((c) => c.id === "scope_coverage")

describe("QA — đủ phạm vi đã chọn", () => {
  test("đủ mọi thứ đã chọn → đạt", () => {
    expect(axis(base)?.verdict).toBe("PASS")
  })
  test("gói không có phạm vi → không có trục này", () => {
    expect(axis({ ...base, plan: { scenePlanId: "P", revision: 1 } })).toBeUndefined()
  })
  test("hai khung: thiếu ảnh + video 16:9 → từ chối, chỉ rõ khung", () => {
    const r = axis({ ...base, plan: { ...base.plan!, scope: { ...base.plan!.scope!, ratios: ["9:16", "16:9"] } } })
    expect(r?.verdict).toBe("REJECTED")
    expect(r?.reasons.join(" ")).toContain("ảnh khung 16:9")
    expect(r?.reasons.join(" ")).toContain("video khung 16:9")
  })
  test("thiếu bài của kênh trong phạm vi → từ chối", () => {
    const r = axis({ ...base, plan: { ...base.plan!, scope: { ...base.plan!.scope!, postChannels: ["tiktok", "instagram"] } } })
    expect(r?.reasons.join(" ")).toContain("instagram")
  })
  test("chỉ chọn ảnh: gói không có bài / video vẫn đạt, không bị trục nội dung chặn", () => {
    const report = evaluateCampaignQa({
      ...base,
      posts: [],
      videos: [],
      audio: null,
      plan: { scenePlanId: "P", revision: 1, scope: { produce: ["image"], ratios: ["9:16"], postChannels: [] } },
    })
    expect(report.checks.find((c) => c.id === "scope_coverage")?.verdict).toBe("PASS")
    expect(report.checks.find((c) => c.id === "content")?.verdict).toBe("PASS")
  })
  test("nhiều video: duyệt từng video, ghi rõ khung", () => {
    const report = evaluateCampaignQa({ ...base, videos: [v916, { ...v916, aspectRatio: "16:9", approval: "PENDING" }] })
    expect(report.checks.find((c) => c.id === "approvals")?.reasons.join(" ")).toContain("Video 16:9")
  })
})

describe("mergeVideoIds", () => {
  test("gộp video chính + danh sách, bỏ trùng, video chính đứng đầu", () => {
    expect(mergeVideoIds("a", ["b", "a"])).toEqual({ videoJobId: "a", videoJobIds: ["a", "b"] })
    expect(mergeVideoIds(undefined, ["b", "c"])).toEqual({ videoJobId: "b", videoJobIds: ["b", "c"] })
    expect(mergeVideoIds(null, undefined)).toEqual({ videoJobId: null, videoJobIds: [] })
    expect(mergeVideoIds(undefined, undefined)).toBeUndefined()
  })
})
