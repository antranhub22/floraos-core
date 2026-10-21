import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { greetingCardVi } from "@/lib/i18n/locales/vi/greeting-card"
import { inboxActions, type PipelineLike } from "../../inbox"
import type { MessageRole } from "../../internal-message"
import { STEP_SLA_RULES } from "../../step-sla"
import { PIPELINE_STEPS, type TrackingPipelineStepId } from "../../tracking-pipeline-types"
import { INBOX_KIND_SITUATIONS, SITUATIONS, STEP_SITUATIONS } from "../situation-catalog"
import { GUIDE_ROLES, GUIDE_TAB_LABEL, type GuideRole } from "../situation-types"
import { SITUATION_GUIDE_DOC_PATH, renderSituationGuideMarkdown } from "../render-situation-guide"

/**
 * Giữ danh mục tình huống (SSOT) khớp mã thật — PO 17/10/2026: đổi/nâng cấp tính năng thì hướng dẫn
 * phải tự bị buộc cập nhật. Lỗi ở đây = hướng dẫn đã cũ; sửa danh mục, rồi `npm run gen:guide:the-chao`.
 */
const ROOT = path.resolve(__dirname, "../../../../../..")
const byId = new Map(SITUATIONS.map((s) => [s.id, s]))

// Vai mới trong Hộp việc phải có trong danh sách vai hướng dẫn (lỗi biên dịch nếu thiếu).
const roleCovered: Record<MessageRole, GuideRole> = { ADMIN: "ADMIN", SALE: "SALE", COORDINATOR: "COORDINATOR" }

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) sourceFiles(p, out)
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

describe("danh mục tình huống Thẻ chào", () => {
  it("mã tình huống không trùng, mọi 'tiếp theo' trỏ tới tình huống có thật", () => {
    expect(byId.size).toBe(SITUATIONS.length)
    for (const s of SITUATIONS) for (const n of s.next) expect(byId.has(n), `${s.id} → ${n}`).toBe(true)
  })

  it("vai phải làm nào cũng có bước tiếp theo; vai trong danh sách vai hướng dẫn", () => {
    for (const s of SITUATIONS) {
      for (const r of s.owners) expect(s.steps[r]?.length ?? 0, `${s.id} thiếu bước cho ${r}`).toBeGreaterThan(0)
      for (const r of [...s.owners, ...(s.informed ?? []), ...Object.keys(s.steps)]) expect(GUIDE_ROLES).toContain(r)
    }
    expect(Object.values(roleCovered)).toEqual(expect.arrayContaining([...GUIDE_ROLES]))
  })

  it("không tình huống nào bị bỏ rơi: đều gắn với việc Hộp việc, bước quy trình hoặc là bước kế của tình huống khác", () => {
    const linked = new Set<string>([...Object.values(INBOX_KIND_SITUATIONS).flat(), ...Object.values(STEP_SITUATIONS).flat(), ...SITUATIONS.flatMap((s) => s.next)])
    const orphans = SITUATIONS.filter((s) => !linked.has(s.id) && s.group !== "CANCELLATION" && s.group !== "CHANGE").map((s) => s.id)
    expect(orphans).toEqual([])
  })

  it("mỗi bước có thời gian chuẩn: người phụ trách bước có việc trong ít nhất một tình huống của bước đó", () => {
    for (const rule of STEP_SLA_RULES) {
      const ids = STEP_SITUATIONS[rule.stepId]
      const owners = ids.flatMap((id) => [...(byId.get(id)?.owners ?? []), ...Object.keys(byId.get(id)?.steps ?? {})])
      expect(owners, `${rule.stepId} (${rule.owner})`).toContain(rule.owner)
    }
    expect(Object.keys(STEP_SITUATIONS).sort()).toEqual(PIPELINE_STEPS.map((s) => s.id).sort())
  })

  it("mọi việc Hộp việc sinh ra cho một vai đều có hướng dẫn cho đúng vai đó", () => {
    const steps = PIPELINE_STEPS.map((s) => s.id)
    const items: PipelineLike[] = []
    let n = 0
    for (const currentStepId of steps as TrackingPipelineStepId[]) {
      for (const paidVnd of [0, 300_000, 1_000_000]) {
        for (const reported of [false, true]) {
          for (const productionStatus of ["WAITING", "ASSIGNED", "ARRANGING", "READY"]) {
            for (const deliveryFailed of [false, true]) {
              for (const saleId of ["sale-1", null]) {
                for (const type of ["ORDER", "SESSION"] as const) {
                  for (const totalVnd of [1_000_000, 0]) {
                    n += 1
                    items.push({
                      id: `i${n}`, type, orderId: type === "ORDER" ? `o${n}` : null, sessionId: `s${n}`, orderCode: `DH${n}`, sendCode: `S${n}`,
                      customerName: "Khách", productName: "Bó hoa", totalVnd, paidVnd, balanceVnd: Math.max(0, totalVnd - paidVnd),
                      currentStepId, currentStepTitle: "", productionStatus, deliveryStatus: deliveryFailed ? "FAILED" : currentStepId === "STEP_9_COMPLETED" ? "DELIVERED" : "PENDING",
                      stepStartedAt: new Date().toISOString(), stuck: null, saleId, coordinatorId: null, deliveryFailed,
                      sessionStatus: reported ? "PAYMENT_REPORTED" : "ORDER_SUBMITTED", customerReportedPaid: reported,
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
    for (const rule of STEP_SLA_RULES) items.push({ ...items[0]!, id: `stuck-${rule.stepId}`, currentStepId: rule.stepId, stuck: { stepId: rule.stepId, owner: rule.owner, overdueMinutes: 5, message: rule.action } })

    const seen = new Set<string>()
    for (const role of GUIDE_ROLES) {
      for (const a of inboxActions(items, role, "sale-1")) {
        seen.add(a.kind)
        const guided = INBOX_KIND_SITUATIONS[a.kind].some((id) => byId.get(id)?.steps[role]?.length)
        expect(guided, `${role} nhận "${a.kind}" nhưng tình huống ${INBOX_KIND_SITUATIONS[a.kind].join("/")} không có bước cho ${role}`).toBe(true)
      }
    }
    expect(seen.size).toBeGreaterThan(10)
  })

  it("nhãn nút trong hướng dẫn còn đúng trên màn hình", () => {
    const text = [...sourceFiles(path.join(ROOT, "src/components")), ...sourceFiles(path.join(ROOT, "src/app/(app)"))].map((f) => readFileSync(f, "utf8")).join("\n")
    const missing = SITUATIONS.flatMap((s) => Object.values(s.steps).flat().flatMap((st) => (st?.where?.button && !text.includes(st.where.button) ? [`${s.id}: "${st.where.button}"`] : [])))
    expect(missing).toEqual([])
  })

  it("tên tab trùng tên trên màn hình; lời hướng dẫn không lộ mã kỹ thuật", () => {
    const tabs = greetingCardVi.tabs
    expect([GUIDE_TAB_LABEL.catalogs, GUIDE_TAB_LABEL.tracking, GUIDE_TAB_LABEL.sales, GUIDE_TAB_LABEL.operation, GUIDE_TAB_LABEL.coordination])
      .toEqual([tabs.catalogs, tabs.tracking, tabs.sales, tabs.operation, tabs.coordination])
    const texts = SITUATIONS.flatMap((s) => [s.title, s.recognize, s.deadline ?? "", s.automation ?? "", ...(s.notes ?? []), ...Object.values(s.steps).flat().map((st) => st?.do ?? "")])
    const leaks = texts.filter((t) => /\b([RLF]\d{1,2}|STEP_\d|[A-Z]{3,}_[A-Z_]+)\b/.test(t))
    expect(leaks).toEqual([])
  })

  it(`tài liệu ${SITUATION_GUIDE_DOC_PATH} khớp danh mục (chạy npm run gen:guide:the-chao nếu lệch)`, () => {
    expect(readFileSync(path.join(ROOT, SITUATION_GUIDE_DOC_PATH), "utf8")).toBe(renderSituationGuideMarkdown())
  })
})
