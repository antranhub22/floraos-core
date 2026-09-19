#!/usr/bin/env node
// Đối chiếu đặc tả 06/07 với mã thật. Chạy: node scripts/check-docs.mjs
// Sinh ra ở lượt rà soát 18/09 — xem docs/kien-truc/RA_SOAT_DONG_BO_18_09.md.
// Ý tưởng: tài liệu không tự nhớ con số; CI đọc mã rồi so lại.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const CHUA_XAY = /CHƯA XÂY|chưa gác|chưa xây/i
let loi = 0
const bao = (m) => { console.error("  ✗ " + m); loi++ }

// ── 1. Endpoint ────────────────────────────────────────────────────────────
const spec = readFileSync("docs/dac-ta/06-api-specification.md", "utf8")
const specEps = new Map()
for (const line of spec.split("\n")) {
  if (!line.startsWith("|")) continue
  const c = line.replace(/^\||\|$/g, "").split("|").map((x) => x.trim())
  if (c.length < 2) continue
  for (const m of c[0].toUpperCase().split("·").map((x) => x.trim())) {
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) continue
    const p = c[1].replace(/`/g, "").replace("/api/v1", "").trim()
    if (p.startsWith("/")) specEps.set(`${m} ${p}`, c[2] ?? "")
  }
}
const codeEps = new Set()
const dive = (dir) => {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e)
    if (statSync(f).isDirectory()) dive(f)
    else if (e === "route.ts") {
      const rel = dir.replace("src/app/api/v1", "").replace(/\[\.\.\.(\w+)\]/g, ":$1").replace(/\[(\w+)\]/g, ":$1")
      const src = readFileSync(f, "utf8")
      for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE)\b/g))
        codeEps.add(`${m[1]} ${rel}`)
    }
  }
}
dive("src/app/api/v1")
const chuan = (k) => k.replace(/:\w+/g, "{}").replace(/\/$/, "")
const codeN = new Set([...codeEps].map(chuan))
const specN = new Map([...specEps].map(([k, v]) => [chuan(k), v]))

console.log("── Endpoint")
for (const [k, cap] of specN) if (!codeN.has(k) && !CHUA_XAY.test(cap)) bao(`đặc tả 06 có "${k}" nhưng không có route — thêm route, hoặc đánh dấu **CHƯA XÂY** ở cột năng lực`)
for (const k of codeN) if (!specN.has(k)) bao(`route "${k}" không có trong đặc tả 06`)

// ── 2. Bảng và enum ────────────────────────────────────────────────────────
const doc = readFileSync("docs/dac-ta/07-database-specification.md", "utf8")
const schema = readFileSync("prisma/schema.prisma", "utf8")
const models = (t) => {
  const o = new Map()
  for (const m of t.matchAll(/\bmodel\s+(\w+)\s*\{([\s\S]*?)\n\}/g)) {
    const map = m[2].match(/@@map\("([^"]+)"\)/)
    o.set(map ? map[1] : m[1], m[2])
  }
  return o
}
const enums = (t) => {
  const o = new Map()
  for (const m of t.matchAll(/\benum\s+(\w+)\s*\{([\s\S]*?)\}/g))
    o.set(m[1], [...m[2].matchAll(/\b([A-Z][A-Z0-9_]*)\b/g)].map((x) => x[1]).sort().join(" "))
  return o
}
const dm = models(doc), sm = models(schema), de = enums(doc), se = enums(schema)
const docChuaXay = (n) => new RegExp(`CHƯA XÂY[\\s\\S]{0,200}model\\s+${n}\\b`).test(doc)

console.log("── Bảng")
for (const n of dm.keys()) if (!sm.has(n) && !docChuaXay(n)) bao(`đặc tả 07 khai model "${n}" nhưng lược đồ không có — đánh dấu CHƯA XÂY hoặc bỏ`)
for (const n of sm.keys()) if (!dm.has(n)) bao(`lược đồ có model "${n}" nhưng đặc tả 07 không khai`)

console.log("── Enum")
for (const [n, v] of de) {
  if (!se.has(n)) { bao(`đặc tả 07 khai enum "${n}" nhưng lược đồ không có`); continue }
  if (se.get(n) !== v) bao(`enum "${n}" lệch giá trị — đặc tả: ${v} · lược đồ: ${se.get(n)}`)
}
for (const n of se.keys()) if (!de.has(n)) bao(`lược đồ có enum "${n}" nhưng đặc tả 07 không khai`)

// ── 3. Cách ly tenant ──────────────────────────────────────────────────────
console.log("── Cách ly tenant")
// Bảng có `organization_id` trong lược đồ nhưng KHÔNG có route/use-case nào
// từng ghi vào — soát RS-2 18/09 xác nhận bằng tay, không suy luận tự động
// (đọc mã, không phải một dấu hiệu trong tài liệu). Viết ca thử cách ly cho
// một bảng chết là thử một thứ không tồn tại; danh sách này CHỈ được thêm
// sau khi đọc mã xác nhận, và phải bỏ bớt ngay khi bảng có đường ghi thật.
const SCHEMA_ONLY_CHUA_NOI = new Set([
  "product_variants", // product-master-index-repository.ts: "chưa từng được nối"
  "product_images", // product-master-index-repository.ts: "chưa từng được nối"
  "product_inventory", // nợ #95: "chưa được nối"
  "vouchers", // chỉ có đọc lồng qua customers; chưa có route tạo/sửa
])
const tenant = [...sm].filter(([, b]) => /^\s*organization_id\s/m.test(b)).map(([n]) => n).filter((n) => !SCHEMA_ONLY_CHUA_NOI.has(n))
const thu = readdirSync("tests/tenant").filter((f) => f.endsWith(".ts"))
  .map((f) => readFileSync(join("tests/tenant", f), "utf8")).join("")
const camel = (n) => n.split("_").map((x, i) => (i ? x[0].toUpperCase() + x.slice(1) : x)).join("")
// Bảng thật SỰ có ca thử cách ly, nhưng ca thử gọi qua route công khai
// (đường dẫn HTTP, tên use-case) chứ không bao giờ gõ lại tên bảng snake_case
// — dò chữ đơn thuần bên dưới không thấy được. Xác nhận bằng tay từng dòng,
// trỏ thẳng vào ca thử thật, để không lặp lại kiểu "coi như xong" mà đợt RS-2
// 18/09 vừa sửa (16 bảng tưởng thiếu, hoá ra 8 trong số đó đã có ca thử).
const COVERED_VIA_ROUTE = {
  pricing_rules: "tests/tenant/products-pricing.test.ts — PUT/GET /pricing-rules",
  catalog_links: "tests/tenant/catalog-links.test.ts",
  order_items: "tests/tenant/order-isolation.test.ts — POST/GET /orders (items)",
  order_events: "tests/tenant/order-isolation.test.ts — GET /orders/:id/events",
  customer_occasions: "tests/tenant/customer-isolation.test.ts — POST .../occasions",
  chat_conversations: "tests/tenant/chat-isolation.test.ts",
  chat_messages: "tests/tenant/chat-isolation.test.ts",
  chat_channel_integrations: "tests/tenant/chat-channel-isolation.test.ts",
}
for (const t of tenant) {
  if (t in COVERED_VIA_ROUTE) continue
  const dang = [t, camel(t), t.replace(/s$/, ""), camel(t.replace(/s$/, ""))]
  if (!dang.some((d) => thu.includes(d))) bao(`bảng tenant "${t}" không có ca thử cách ly nào (đặc tả 07 mục 19)`)
}
const helper = readFileSync("tests/helpers/database.ts", "utf8")
const trunc = new Set([...helper.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]))
for (const t of tenant) if (!trunc.has(t)) bao(`bảng tenant "${t}" không nằm trong TENANT_TABLES — không được dọn giữa các ca thử`)

console.log(loi === 0 ? "\n✓ Tài liệu khớp mã." : `\n✗ ${loi} chỗ lệch giữa tài liệu và mã.`)
process.exit(loi === 0 ? 0 : 1)
