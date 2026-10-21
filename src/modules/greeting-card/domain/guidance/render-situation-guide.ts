/**
 * Dựng tài liệu `docs/dac-ta/HUONG_DAN_TINH_HUONG_THE_CHAO.md` từ danh mục tình huống.
 * Tài liệu KHÔNG sửa tay: sửa danh mục rồi chạy `npm run gen:guide:the-chao`. Pure TypeScript.
 */
import { GUIDE_ROLES, GUIDE_ROLE_LABEL, GUIDE_TAB_LABEL, SITUATION_GROUP_LABEL, type GuideStep, type Situation, type SituationGroup } from "./situation-types"
import { SITUATIONS } from "./situation-catalog"

export const SITUATION_GUIDE_DOC_PATH = "docs/dac-ta/HUONG_DAN_TINH_HUONG_THE_CHAO.md"

const anchor = (id: string) => id.toLowerCase().replace(/_/g, "-")
const roles = (list: readonly string[] | undefined) =>
  (list ?? []).map((r) => GUIDE_ROLE_LABEL[r as keyof typeof GUIDE_ROLE_LABEL]).join(", ")

function stepLine(s: GuideStep): string {
  const where = [s.where?.tab ? GUIDE_TAB_LABEL[s.where.tab] : null, s.where?.button ? `nút "${s.where.button}"` : null].filter(Boolean).join(" → ")
  return where ? `${s.do} *(${where})*` : s.do
}

function situationBlock(s: Situation, titleOf: (id: string) => string): string[] {
  const out = [`### ${s.title}`, "", `<a id="${anchor(s.id)}"></a>Mã: \`${s.id}\``, "", `- **Nhận biết:** ${s.recognize}`]
  out.push(`- **Ai làm:** ${s.owners.length > 0 ? roles(s.owners) : "Không ai — chờ khách hoặc hệ thống"}`)
  if (s.informed?.length) out.push(`- **Cần biết:** ${roles(s.informed)}`)
  const stepRoles = GUIDE_ROLES.filter((r) => s.steps[r]?.length)
  if (stepRoles.length > 0) {
    out.push("- **Bước tiếp theo:**")
    for (const r of stepRoles) for (const st of s.steps[r] ?? []) out.push(`  - **${GUIDE_ROLE_LABEL[r]}:** ${stepLine(st)}`)
  }
  if (s.deadline) out.push(`- **Hạn:** ${s.deadline}`)
  if (s.automation) out.push(`- **Hệ thống tự làm:** ${s.automation}`)
  if (s.next.length > 0) out.push(`- **Tiếp theo có thể là:** ${s.next.map((id) => `[${titleOf(id)}](#${anchor(id)})`).join(" · ")}`)
  for (const n of s.notes ?? []) out.push(`- **Lưu ý:** ${n}`)
  out.push("")
  return out
}

export function renderSituationGuideMarkdown(list: readonly Situation[] = SITUATIONS): string {
  const titleOf = (id: string) => list.find((s) => s.id === id)?.title ?? id
  const lines = [
    "# Hướng dẫn xử lý tình huống — Thẻ chào mẫu hoa",
    "",
    "> **Tài liệu sinh tự động — không sửa tay.** Nguồn duy nhất (SSOT): `src/modules/greeting-card/domain/guidance/`.",
    "> Sửa danh mục rồi chạy `npm run gen:guide:the-chao`; test `npm test` báo lỗi nếu tài liệu lệch danh mục,",
    "> nếu loại việc trong Hộp việc / bước quy trình mới chưa có hướng dẫn, hoặc nhãn nút trong hướng dẫn không còn trên màn hình.",
    "> Dành cho 3 vai nhân viên: Điều hành, Sale, Điều phối. Giao diện đọc cùng dữ liệu này để hiện \"Bước tiếp theo\".",
    "",
    "## Theo vai",
    "",
  ]
  for (const r of GUIDE_ROLES) {
    const mine = list.filter((s) => s.owners.includes(r))
    lines.push(`**${GUIDE_ROLE_LABEL[r]}** (${mine.length}): ${mine.map((s) => `[${s.title}](#${anchor(s.id)})`).join(" · ")}`, "")
  }
  for (const g of Object.keys(SITUATION_GROUP_LABEL) as SituationGroup[]) {
    const inGroup = list.filter((s) => s.group === g)
    if (inGroup.length === 0) continue
    lines.push(`## ${SITUATION_GROUP_LABEL[g]}`, "")
    for (const s of inGroup) lines.push(...situationBlock(s, titleOf))
  }
  return `${lines.join("\n").trimEnd()}\n`
}
