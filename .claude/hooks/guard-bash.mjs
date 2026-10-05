#!/usr/bin/env node
// PreToolUse (Bash) — biến hai cái bẫy trong CLAUDE.md "Safety traps" thành chặn thật.
// Đọc JSON từ stdin; in quyết định ra stdout. Không đụng mạng, không ghi đĩa.
import { readFileSync } from "node:fs"

let cmd = ""
try {
  cmd = JSON.parse(readFileSync(0, "utf8"))?.tool_input?.command ?? ""
} catch {
  process.exit(0)
}

const decide = (permissionDecision, reason) => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision, permissionDecisionReason: reason },
    })
  )
  process.exit(0)
}

// 1. `vitest run` không chỉ định tệp kéo cả tests/tenant + tests/platform (TRUNCATE mọi bảng).
for (const m of cmd.matchAll(/\bvitest\s+run\b([^;&|]*)/g)) {
  const args = (m[1] ?? "").split(/\s+/).filter((a) => a && !a.startsWith("-"))
  if (args.length === 0) {
    decide("deny", "Không gọi `vitest run` trơn: nó kéo cả bộ test cách ly (TRUNCATE mọi bảng). Dùng `npm test`, `npm run test:tenant`, hoặc chỉ định tệp test cụ thể.")
  }
}

// 2. Lệnh Prisma ghi lược đồ/dữ liệu vào database không phải máy cục bộ → hỏi người dùng.
if (/\bprisma\s+(db\s+(push|execute|seed)|migrate\s+(dev|reset|deploy))\b/.test(cmd)) {
  const inline = cmd.match(/DATABASE_URL=("?)([^\s"]+)\1/)?.[2]
  // Không có trong lệnh/môi trường thì prisma.config.ts nạp `.env` — đọc đúng nguồn đó.
  let fromDotenv = ""
  try {
    const dotenv = readFileSync(`${process.env.CLAUDE_PROJECT_DIR ?? "."}/.env`, "utf8")
    fromDotenv = dotenv.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\s]+)/m)?.[1] ?? ""
  } catch {}
  const url = inline ?? process.env.DATABASE_URL ?? fromDotenv
  let host = ""
  try {
    host = url ? new URL(url).hostname : ""
  } catch {
    host = "?"
  }
  const local = host === "" || host === "localhost" || host === "127.0.0.1" || host === "::1"
  if (!local) {
    decide("ask", `Lệnh Prisma sắp ghi vào database ở "${host}" (không phải máy cục bộ). Xác nhận đúng database trước khi chạy.`)
  }
}

process.exit(0)
