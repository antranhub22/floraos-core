import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { capability } from "@/core/rbac/capability-catalog"

/** PO 14/10/2026: xuất Excel đơn hàng / khách hàng chỉ Điều hành; người khác cần Điều hành cấp quyền R13. */
const ROOT = path.resolve(__dirname, "../../..")
const ROUTES = ["src/app/api/v1/orders/export/route.ts", "src/app/api/v1/crm/customers/export/route.ts"]

describe("xuất dữ liệu ra Excel", () => {
  it("R13 mặc định chỉ Điều hành", () => {
    expect([...capability("R13").defaultRoles]).toEqual(["dieu_hanh"])
  })

  it.each(ROUTES)("%s đòi đúng R13 và không còn lối tắt quyền đọc", (route) => {
    const src = readFileSync(path.join(ROOT, route), "utf8")
    expect(src).toContain('requireCapability(ctx, "R13")')
    expect(src).not.toMatch(/hasCapability\(/)
  })
})
