/**
 * Codemod an toàn chuyển đổi token cỡ chữ và màu ngữ nghĩa (T4.4)
 *
 * Cách chạy:
 *   npx tsx scripts/codemod-ux-tokens.ts --dir src/components/ui          # dry-run mặc định
 *   npx tsx scripts/codemod-ux-tokens.ts --dir src/components/ui --write  # ghi file thật
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { extname, join, relative } from "node:path"

export const FONT_TOKEN_MAP: Record<string, string> = {
  "text-[9px]": "text-caption",
  "text-[9.5px]": "text-caption",
  "text-[10px]": "text-caption",
  "text-[10.5px]": "text-caption",
  "text-[11px]": "text-caption",
  "text-[11.5px]": "text-caption",
  "text-[12px]": "text-meta",
  "text-[12.5px]": "text-meta",
  "text-[13px]": "text-body-sm",
  "text-[13.5px]": "text-body",
  "text-[14px]": "text-body",
  "text-[14.5px]": "text-title-sm",
  "text-[15px]": "text-title-sm",
  "text-[16px]": "text-title",
  "text-[17px]": "text-title",
  "text-[18px]": "text-title",
  "text-[19px]": "text-display",
  "text-[20px]": "text-display",
}

export interface TransformResult {
  modified: boolean
  content: string
  replacements: Array<{ from: string; to: string; reason: string }>
}

export function transformContent(content: string, filePath?: string): TransformResult {
  const replacements: Array<{ from: string; to: string; reason: string }> = []
  let modifiedContent = content

  // 1. Thay thế cỡ chữ font token map
  for (const [from, to] of Object.entries(FONT_TOKEN_MAP)) {
    // Regex khớp class độc lập trong chuỗi
    const regex = new RegExp(`(?<=["'\`\\s])${from.replace(/\[/g, "\\[").replace(/\]/g, "\\]")}(?=["'\`\\s])`, "g")
    if (regex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(regex, () => {
        replacements.push({ from, to, reason: "Font token mapping (T4.2)" })
        return to
      })
    }
  }

  // 2. Thay thế màu xám thô (neutral/slate/gray/zinc) chuẩn hóa về token nền tảng
  // Chữ phụ: -400 / -500 -> text-text-muted
  const neutralTextRegex = /(?<=["'`\s])text-(?:slate|gray|zinc|neutral)-(?:400|500)(?=["'`\s])/g
  if (neutralTextRegex.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(neutralTextRegex, (match) => {
      replacements.push({ from: match, to: "text-text-muted", reason: "Neutral text-muted mapping" })
      return "text-text-muted"
    })
  }

  // Nền phụ: -50 / -100 -> bg-surface-alt
  const neutralBgRegex = /(?<=["'`\s])bg-(?:slate|gray|zinc|neutral)-(?:50|100)(?=["'`\s])/g
  if (neutralBgRegex.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(neutralBgRegex, (match) => {
      replacements.push({ from: match, to: "bg-surface-alt", reason: "Neutral surface-alt mapping" })
      return "bg-surface-alt"
    })
  }

  // Viền: -200 -> border-border
  const neutralBorderRegex = /(?<=["'`\s])border-(?:slate|gray|zinc|neutral)-200(?=["'`\s])/g
  if (neutralBorderRegex.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(neutralBorderRegex, (match) => {
      replacements.push({ from: match, to: "border-border", reason: "Neutral border mapping" })
      return "border-border"
    })
  }

  // 3. Màu chức năng có ngữ cảnh lỗi/cảnh báo/thành công
  // Quét theo khối hoặc dòng có dấu hiệu alert/error/warning/success
  const lines = modifiedContent.split("\n")
  const modifiedLines = lines.map((line) => {
    const isErrorContext =
      line.includes('role="alert"') ||
      /loi|error|danger/i.test(line) ||
      line.includes("AlertTriangle") ||
      line.includes("XCircle")

    const isSuccessContext =
      /success|thanhCong/i.test(line) ||
      line.includes("CheckCircle2")

    const isWarningContext =
      /warning|canhBao/i.test(line) ||
      line.includes("AlertCircle")

    let newLine = line

    if (isErrorContext) {
      if (newLine.includes("text-red-600")) {
        newLine = newLine.replace(/\btext-red-600\b/g, "text-danger")
        replacements.push({ from: "text-red-600", to: "text-danger", reason: "Contextual error color" })
      }
      if (newLine.includes("text-red-700")) {
        newLine = newLine.replace(/\btext-red-700\b/g, "text-danger")
        replacements.push({ from: "text-red-700", to: "text-danger", reason: "Contextual error color" })
      }
      if (newLine.includes("bg-red-50")) {
        newLine = newLine.replace(/\bbg-red-50\b/g, "bg-danger-bg")
        replacements.push({ from: "bg-red-50", to: "bg-danger-bg", reason: "Contextual error background" })
      }
      if (newLine.includes("border-red-200")) {
        newLine = newLine.replace(/\bborder-red-200\b/g, "border-danger/30")
        replacements.push({ from: "border-red-200", to: "border-danger/30", reason: "Contextual error border" })
      }
    }

    if (isSuccessContext) {
      if (newLine.includes("text-emerald-600") || newLine.includes("text-green-600")) {
        newLine = newLine.replace(/\btext-(?:emerald|green)-600\b/g, "text-success")
        replacements.push({ from: "text-emerald-600", to: "text-success", reason: "Contextual success color" })
      }
      if (newLine.includes("bg-emerald-50") || newLine.includes("bg-green-50")) {
        newLine = newLine.replace(/\bbg-(?:emerald|green)-50\b/g, "bg-success-bg")
        replacements.push({ from: "bg-emerald-50", to: "bg-success-bg", reason: "Contextual success background" })
      }
    }

    if (isWarningContext) {
      if (newLine.includes("text-amber-600") || newLine.includes("text-amber-700")) {
        newLine = newLine.replace(/\btext-amber-(?:600|700)\b/g, "text-warning")
        replacements.push({ from: "text-amber-600", to: "text-warning", reason: "Contextual warning color" })
      }
      if (newLine.includes("bg-amber-50")) {
        newLine = newLine.replace(/\bbg-amber-50\b/g, "bg-warning-bg")
        replacements.push({ from: "bg-amber-50", to: "bg-warning-bg", reason: "Contextual warning background" })
      }
    }

    return newLine
  })

  modifiedContent = modifiedLines.join("\n")

  return {
    modified: replacements.length > 0,
    content: modifiedContent,
    replacements,
  }
}

export function runCodemod(targetDir: string, writeMode: boolean) {
  const root = join(__dirname, "..")
  const fullDir = join(root, targetDir)

  function getTsxFiles(dir: string): string[] {
    const res: string[] = []
    if (!existsSync(dir)) return res
    for (const ent of readdirSync(dir)) {
      const p = join(dir, ent)
      if (statSync(p).isDirectory()) {
        res.push(...getTsxFiles(p))
      } else if (extname(ent) === ".tsx" && !ent.includes(".test.")) {
        res.push(p)
      }
    }
    return res
  }

  const files = getTsxFiles(fullDir)
  console.log(`\n=== CODEMOD UX TOKENS (${writeMode ? "WRITE" : "DRY-RUN"}) ===`)
  console.log(`Mục tiêu: ${targetDir} (${files.length} tệp .tsx)`)

  let totalReplacements = 0
  let modifiedFiles = 0

  for (const f of files) {
    const rel = relative(root, f).replace(/\\/g, "/")
    const raw = readFileSync(f, "utf8")
    const res = transformContent(raw, f)

    if (res.modified) {
      modifiedFiles++
      totalReplacements += res.replacements.length
      console.log(`\n[${rel}] (${res.replacements.length} thay đổi):`)
      for (const r of res.replacements.slice(0, 5)) {
        console.log(`  - \`${r.from}\` -> \`${r.to}\` (${r.reason})`)
      }
      if (res.replacements.length > 5) {
        console.log(`  ... và ${res.replacements.length - 5} thay đổi khác`)
      }

      if (writeMode) {
        writeFileSync(f, res.content, "utf8")
      }
    }
  }

  console.log(`\nTổng kết: ${totalReplacements} thay đổi trên ${modifiedFiles}/${files.length} tệp.`)
  if (!writeMode && totalReplacements > 0) {
    console.log(`Chạy lại với cờ --write để áp dụng thay đổi thật.`)
  }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const dirIndex = args.indexOf("--dir")
  const targetDir = dirIndex !== -1 ? args[dirIndex + 1]! : "src/components/ui"
  const writeMode = args.includes("--write")

  runCodemod(targetDir, writeMode)
}
