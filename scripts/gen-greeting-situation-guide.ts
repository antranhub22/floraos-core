/**
 * gen-greeting-situation-guide.ts — sinh tài liệu hướng dẫn tình huống Thẻ chào từ danh mục SSOT.
 *
 *   npm run gen:guide:the-chao          ghi lại tài liệu
 *   npm run check:guide:the-chao        chỉ kiểm, thoát 1 nếu tài liệu lệch danh mục
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { SITUATION_GUIDE_DOC_PATH, renderSituationGuideMarkdown } from "../src/modules/greeting-card/domain/guidance/render-situation-guide"

const target = path.resolve(__dirname, "..", SITUATION_GUIDE_DOC_PATH)
const text = renderSituationGuideMarkdown()
const current = existsSync(target) ? readFileSync(target, "utf8") : null

if (process.argv.includes("--check")) {
  if (current !== text) {
    console.error(`[guide:the-chao] ${SITUATION_GUIDE_DOC_PATH} lệch danh mục. Chạy \`npm run gen:guide:the-chao\` rồi commit.`)
    process.exit(1)
  }
  console.log("[guide:the-chao] Tài liệu khớp danh mục.")
} else if (current !== text) {
  writeFileSync(target, text)
  console.log(`[guide:the-chao] Đã ghi ${SITUATION_GUIDE_DOC_PATH}`)
} else {
  console.log("[guide:the-chao] Không có gì thay đổi.")
}
