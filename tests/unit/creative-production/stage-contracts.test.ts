/**
 * Hợp đồng input/output 14 chặng Creative Studio (24/09/2026).
 *
 * Khoá bốn điều:
 *  1. Đủ 14 chặng, mỗi chặng có input + output (+ ví dụ hợp lệ theo chính schema).
 *  2. Tệp JSON Schema trên đĩa khớp zod — lệch thì chạy `npm run gen:schemas:creative`.
 *  3. Đầu ra thật của hàm domain (kịch bản, QA, số đo, mẫu thắng, hành động) qua được schema.
 *  4. Route dùng CHÍNH hợp đồng (không tự khai lại zod cục bộ).
 */

import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  CREATIVE_STUDIO_SCHEMA_DIR,
  buildCreativeStudioSchemaFiles,
  serializeSchemaFile,
} from "@/modules/creative-production/contracts/json-schema"
import { CREATIVE_STUDIO_STAGES } from "@/modules/creative-production/contracts/registry"
import { scenePlanSchema } from "@/modules/creative-production/contracts/scene-plan"
import {
  campaignPerformanceSchema,
  learnSchema,
  nextActionSchema,
  qaReportSchema,
} from "@/modules/creative-production/contracts/campaign-package"
import { buildRuleScenePlan } from "@/modules/creative-production/domain/scene-plan-rules"
import {
  evaluateCampaignQa,
  extractWinningPatterns,
  nextBestActions,
  summarizePerformance,
} from "@/modules/creative-production/domain/campaign-package-rules"

const ROOT = path.resolve(__dirname, "../../..")
const SCHEMA_DIR = path.join(ROOT, CREATIVE_STUDIO_SCHEMA_DIR)

describe("sổ đăng ký hợp đồng chặng", () => {
  it("phủ đủ chặng 1..14, định danh không trùng", () => {
    const stages = new Set(CREATIVE_STUDIO_STAGES.map((c) => c.stage))
    expect([...stages].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    const ids = CREATIVE_STUDIO_STAGES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    // Chặng 06 CREATE = bốn khu vực B/C/D/E.
    expect(CREATIVE_STUDIO_STAGES.filter((c) => c.stage === 6).map((c) => c.id)).toEqual(["06a", "06b", "06c", "06d"])
  })

  it.each(CREATIVE_STUDIO_STAGES.map((c) => [c.id, c] as const))("chặng %s: ví dụ input/output hợp lệ theo schema", (_id, c) => {
    const input = c.input.safeParse(c.examples.input)
    expect(input.success, JSON.stringify(input.error?.issues)).toBe(true)
    const output = c.output.safeParse(c.examples.output)
    expect(output.success, JSON.stringify(output.error?.issues)).toBe(true)
    // zod gọt trường lạ khi parse, còn JSON Schema đầu ra cấm trường lạ — ví dụ phải
    // đi qua NGUYÊN VẸN, nếu không hợp đồng đang thiếu trường mà mã thật trả về.
    expect(output.data).toEqual(c.examples.output)
    for (const [name, extra] of Object.entries(c.extras ?? {})) {
      const r = extra.schema.safeParse(extra.example)
      expect(r.success, `${name}: ${JSON.stringify(r.error?.issues)}`).toBe(true)
    }
  })

  it("mỗi chặng khai endpoint + mã năng lực", () => {
    for (const c of CREATIVE_STUDIO_STAGES) {
      expect(c.endpoint.path).toMatch(/^\/api\/v1\//)
      expect(c.endpoint.capability).toMatch(/^[A-Z]\d+$/)
    }
  })
})

describe("tệp JSON Schema sinh từ zod", () => {
  const files = buildCreativeStudioSchemaFiles()

  it("mỗi chặng đúng một cặp input/output (+ index.json)", () => {
    for (const c of CREATIVE_STUDIO_STAGES) {
      const base = `stage-${c.id}-${c.slug}`
      expect(files.some((f) => f.file === `${base}.input.schema.json`)).toBe(true)
      expect(files.some((f) => f.file === `${base}.output.schema.json`)).toBe(true)
    }
    expect(files[0]?.file).toBe("index.json")
  })

  it("khung JSON Schema 2020-12 đầy đủ: $schema, $id, title, type object, examples", () => {
    for (const f of files.filter((x) => x.file !== "index.json")) {
      expect(f.json.$schema).toBe("https://json-schema.org/draft/2020-12/schema")
      expect(f.json.$id).toBe(f.file)
      expect(typeof f.json.title).toBe("string")
      expect(f.json.type).toBe("object")
      expect(Array.isArray(f.json.examples)).toBe(true)
    }
  })

  it("tệp trên đĩa khớp zod — lệch thì chạy `npm run gen:schemas:creative`", () => {
    const stale = files.filter((f) => {
      const p = path.join(SCHEMA_DIR, f.file)
      return !existsSync(p) || readFileSync(p, "utf8") !== serializeSchemaFile(f)
    })
    expect(stale.map((f) => f.file)).toEqual([])
    const wanted = new Set(files.map((f) => f.file))
    const extra = readdirSync(SCHEMA_DIR).filter((n) => n.endsWith(".json") && !wanted.has(n))
    expect(extra).toEqual([])
  })
})

describe("đầu ra thật của domain qua được hợp đồng", () => {
  const topic = { id: "t1", title: "Hồng đỏ kỷ niệm", angleCategory: "EMOTIONAL", hook: "Hook", cta: "Nhắn tiệm" }

  it.each(["CREATIVE", "AUTHENTIC"] as const)("kịch bản cơ bản %s (Chặng 05)", (mode) => {
    const plan = buildRuleScenePlan({ mode, productName: "Bó hồng", colors: ["đỏ"], components: ["hồng"], occasions: [], topic })
    const raw = JSON.parse(JSON.stringify(plan))
    const r = scenePlanSchema.safeParse(raw)
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true)
    expect(r.data).toEqual(raw)
  })

  it("QA từ chối (Chặng 08)", () => {
    const report = evaluateCampaignQa({
      posts: [{ channel: "instagram", text: "x".repeat(3000), hashtags: [] }],
      variants: [{ assetId: "a", approvalState: "PENDING", identityScore: 0.5, aspectRatio: "16:9", watermark: false }],
      video: null,
      audio: null,
      brand: { hasLogo: false, forbiddenStyles: null },
      now: new Date("2026-09-24T00:00:00Z"),
    })
    const r = qaReportSchema.safeParse(JSON.parse(JSON.stringify(report)))
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true)
  })

  it("số đo, mẫu thắng, hành động kế tiếp (Chặng 11–14)", () => {
    const performance = summarizePerformance({ approvedAt: null, orders: [], conversationsSince: 0, postRefs: [], metrics: [] })
    const outcomes = [1, 2, 3].map((i) => ({
      packageId: `p${i}`,
      angleCategory: i === 1 ? "EMOTIONAL" : "TREND",
      scene2Preset: "wedding",
      hasVideo: i !== 2,
      revenueVnd: i * 500000,
      orderCount: i,
    }))
    const learnOk = extractWinningPatterns(outcomes)
    expect(learnOk.status).toBe("OK")
    expect(learnSchema.safeParse(JSON.parse(JSON.stringify(learnOk))).success).toBe(true)
    const actions = nextBestActions({
      now: new Date("2026-09-24T00:00:00Z"),
      status: "DRAFT",
      approvedAt: null,
      hasVideo: false,
      postRefs: 0,
      performance,
      learn: learnOk,
      packageAngle: null,
    })
    for (const a of actions) expect(nextActionSchema.safeParse(a).success).toBe(true)
    const full = campaignPerformanceSchema.safeParse(
      JSON.parse(
        JSON.stringify({
          package_id: "p",
          status: "DRAFT",
          sell: { conversations_since_approval: 0, orders: 0 },
          measure: performance,
          learn: learnOk,
          next_best_actions: actions,
          computed_at: "2026-09-24T00:00:00.000Z",
        })
      )
    )
    expect(full.success, JSON.stringify(full.error?.issues)).toBe(true)
  })
})

describe("route dùng chính hợp đồng", () => {
  const WIRING: Record<string, string> = {
    "src/app/api/v1/assets/route.ts": "contracts/stage-01-bring",
    "src/app/api/v1/market-intelligence/vision-extract/route.ts": "contracts/stage-02-understand",
    "src/app/api/v1/market-intelligence/product-intelligence/route.ts": "contracts/stage-03-discover",
    "src/app/api/v1/creative-production/scene-plans/route.ts": "contracts/stage-05-choose",
    "src/app/api/v1/creative-production/content-drafts/route.ts": "contracts/stage-06a-content",
    "src/app/api/v1/audio/jobs/route.ts": "contracts/stage-06b-audio",
    "src/app/api/v1/media/variants/route.ts": "contracts/stage-06c-media",
    "src/app/api/v1/video/jobs/route.ts": "contracts/stage-06d-video",
    "src/app/api/v1/creative-production/packages/route.ts": "contracts/stage-07-package",
    "src/app/api/v1/creative-production/packages/[id]/approve/route.ts": "contracts/stage-09-approve",
    "src/app/api/v1/creative-production/packages/schemas.ts": "contracts/campaign-package",
  }

  it.each(Object.entries(WIRING))("%s import %s", (file, contract) => {
    const src = readFileSync(path.join(ROOT, file), "utf8")
    expect(src).toContain(`@/modules/creative-production/${contract}`)
  })
})
