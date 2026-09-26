/**
 * Công cụ đo tần suất cỡ chữ tùy tiện và màu thô (T4.1)
 *
 * Cách chạy:
 *   npx tsx scripts/ux-lint/measure-tokens.ts
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"
import ts from "typescript"

const REPO_ROOT = join(__dirname, "../..")
const TARGET_DIRS = [join(REPO_ROOT, "src/app"), join(REPO_ROOT, "src/components")]

function findTsxFiles(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = relative(REPO_ROOT, full).replace(/\\/g, "/")

    if (
      rel.includes("src/generated") ||
      rel.includes(".test.tsx") ||
      rel.includes("preview-data") ||
      rel.includes("node_modules")
    ) {
      continue
    }

    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...findTsxFiles(full))
    } else if (extname(entry) === ".tsx") {
      files.push(full)
    }
  }
  return files
}

function extractStringLiterals(node: ts.Node): string[] {
  const strings: string[] = []
  function visit(n: ts.Node) {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      strings.push(n.text)
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return strings
}

interface FontUsage {
  size: string
  count: number
  files: Map<string, number>
}

interface ColorUsage {
  cls: string
  prefix: string
  colorName: string
  shade: string
  count: number
  files: Map<string, number>
}

const RAW_PALETTES = [
  "red",
  "amber",
  "emerald",
  "green",
  "rose",
  "blue",
  "indigo",
  "purple",
  "violet",
  "yellow",
  "orange",
  "cyan",
  "teal",
  "sky",
  "pink",
  "fuchsia",
  "lime",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
]

const COLOR_REGEX = new RegExp(
  `^(bg|text|border|from|to|via|ring|outline|divide)-(${RAW_PALETTES.join("|")})-(\\d+)(?:\\/(\\d+))?$`
)

const FONT_REGEX = /^text-\[(\d+(?:\.\d+)?(?:px|rem)?)\]$/

export function runMeasurement() {
  const allFiles: string[] = []
  for (const dir of TARGET_DIRS) {
    allFiles.push(...findTsxFiles(dir))
  }

  const fontMap = new Map<string, FontUsage>()
  const colorMap = new Map<string, ColorUsage>()

  for (const file of allFiles) {
    const relFile = relative(REPO_ROOT, file).replace(/\\/g, "/")
    const content = readFileSync(file, "utf8")
    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    function visit(node: ts.Node) {
      if (ts.isJsxAttribute(node)) {
        const attrName = node.name.getText(sf)
        if (attrName === "className" && node.initializer) {
          const strings = extractStringLiterals(node.initializer)
          for (const s of strings) {
            const classes = s.split(/\s+/).filter(Boolean)
            for (const cls of classes) {
              // 1. Kiểm tra cỡ chữ
              const fontMatch = cls.match(FONT_REGEX)
              if (fontMatch) {
                const size = fontMatch[1]!
                if (!fontMap.has(size)) {
                  fontMap.set(size, { size, count: 0, files: new Map() })
                }
                const entry = fontMap.get(size)!
                entry.count++
                entry.files.set(relFile, (entry.files.get(relFile) || 0) + 1)
              }

              // 2. Kiểm tra màu thô
              const colorMatch = cls.match(COLOR_REGEX)
              if (colorMatch) {
                const prefix = colorMatch[1]!
                const colorName = colorMatch[2]!
                const shade = colorMatch[3]!
                const normCls = `${prefix}-${colorName}-${shade}`

                if (!colorMap.has(normCls)) {
                  colorMap.set(normCls, {
                    cls: normCls,
                    prefix,
                    colorName,
                    shade,
                    count: 0,
                    files: new Map(),
                  })
                }
                const entry = colorMap.get(normCls)!
                entry.count++
                entry.files.set(relFile, (entry.files.get(relFile) || 0) + 1)
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit)
    }

    visit(sf)
  }

  // In bảng 1: Cỡ chữ
  const sortedFonts = Array.from(fontMap.values()).sort((a, b) => b.count - a.count)
  const totalFonts = sortedFonts.reduce((sum, f) => sum + f.count, 0)

  console.log("### BẢNG 1: TẦN SUẤT CỠ CHỮ TÙY TIỆN (`text-[Npx]`)")
  console.log(`Tổng số lần xuất hiện: ${totalFonts} lần across ${allFiles.length} tệp\n`)
  console.log("| Cỡ chữ | Số lần | Tỷ lệ % | Đề xuất gộp Token | Top 3 tệp dùng nhiều nhất |")
  console.log("|---|---|---|---|---|")

  function suggestToken(sizeStr: string): string {
    const num = parseFloat(sizeStr.replace("px", ""))
    if (isNaN(num)) return "tùy biến"
    if (num <= 10.5) return "`--text-caption` (10-11px)"
    if (num <= 11.5) return "`--text-caption` (11px)"
    if (num <= 12.5) return "`--text-meta` (12px)"
    if (num <= 13.2) return "`--text-body-sm` (13px)"
    if (num <= 14.0) return "`--text-body` (13.5-14px)"
    if (num <= 15.5) return "`--text-title-sm` (14.5-15px)"
    if (num <= 18.0) return "`--text-title` (17px)"
    if (num <= 22.0) return "`--text-display` (20px)"
    return "`--text-hero` / lớn (>20px)"
  }

  for (const f of sortedFonts) {
    const pct = ((f.count / totalFonts) * 100).toFixed(1)
    const topFiles = Array.from(f.files.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([file, count]) => `\`${file.split("/").slice(-2).join("/")}\` (${count})`)
      .join(", ")
    const token = suggestToken(f.size)
    console.log(`| \`text-[${f.size}]\` | ${f.count} | ${pct}% | ${token} | ${topFiles} |`)
  }

  console.log("\n---\n")

  // In bảng 2: Màu thô
  const sortedColors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count)
  const totalColors = sortedColors.reduce((sum, c) => sum + c.count, 0)

  console.log("### BẢNG 2: TẦN SUẤT MÀU THÔ THEO TIỀN TỐ")
  console.log(`Tổng số lần xuất hiện: ${totalColors} lần\n`)
  console.log("| Lớp màu | Tiền tố | Gam màu | Số lần | Đề xuất Token Ngữ nghĩa | Top 3 tệp |")
  console.log("|---|---|---|---|---|---|")

  function suggestColorToken(c: ColorUsage): string {
    if (c.colorName === "red" || c.colorName === "rose") {
      if (c.prefix === "bg" && (c.shade === "50" || c.shade === "100")) return "`bg-danger-bg` / `bg-guidance-bg`"
      if (c.prefix === "text" && (c.shade === "600" || c.shade === "700" || c.shade === "900")) return "`text-danger` / `text-primary`"
      if (c.prefix === "border") return "`border-danger/30` / `border-guidance-border`"
      return "`primary` / `danger`"
    }
    if (c.colorName === "amber" || c.colorName === "yellow") {
      if (c.prefix === "bg") return "`bg-warning-bg`"
      if (c.prefix === "text") return "`text-warning`"
      return "`warning`"
    }
    if (c.colorName === "emerald" || c.colorName === "green") {
      if (c.prefix === "bg") return "`bg-success-bg`"
      if (c.prefix === "text") return "`text-success`"
      return "`success`"
    }
    if (c.colorName === "blue" || c.colorName === "sky" || c.colorName === "cyan") {
      if (c.prefix === "bg") return "`bg-info-bg`"
      if (c.prefix === "text") return "`text-info`"
      return "`info`"
    }
    if (["slate", "gray", "zinc", "neutral", "stone"].includes(c.colorName)) {
      if (c.prefix === "text") return "`text-text-muted`"
      if (c.prefix === "bg") return "`bg-surface-alt`"
      if (c.prefix === "border") return "`border-border`"
    }
    return "`semantic-token`"
  }

  for (const c of sortedColors.slice(0, 50)) {
    const topFiles = Array.from(c.files.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([file, count]) => `\`${file.split("/").slice(-2).join("/")}\` (${count})`)
      .join(", ")
    const token = suggestColorToken(c)
    console.log(`| \`${c.cls}\` | \`${c.prefix}\` | \`${c.colorName}-${c.shade}\` | ${c.count} | ${token} | ${topFiles} |`)
  }
}

if (require.main === module) {
  runMeasurement()
}
