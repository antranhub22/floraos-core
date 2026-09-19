import { describe, expect, it } from "vitest"

import { khai, MOI_MA } from "@/lib/maChucNang"

import {
  ALL_CAPABILITY_CODES,
  CAPABILITIES,
  HARD_CAPPED_CODES,
  SPLIT_CAPABILITY_PAIRS,
  capability,
  defaultCodesForSystemRole,
  isCapabilityCode,
} from "./capability-catalog"

const VAI_TO_KEY: Record<string, "dieu_hanh" | "dieu_phoi" | "sale"> = {
  ADMIN: "dieu_hanh",
  COORDINATOR: "dieu_phoi",
  SALES: "sale",
}

const HARVESTED_CODES = MOI_MA.filter((ma) => /^[A-E]\d+$/.test(ma))

describe("danh mục năng lực — đặc tả 02", () => {
  it("146 mã: 76 thu hoạch (A–E) cộng 70 mã mới (F–L, U1–U4, H5–H6, R1–R8, Q1–Q9, T1–T4, I4–I5, P3–P4) — soát 18/09 (RS-1/RS-10) thêm P3/P4 (cổng duyệt video tách khỏi I2) và Q9 (consent, tách khỏi Q6 cũ)", () => {
    expect(HARVESTED_CODES.length).toBe(76)
    expect(ALL_CAPABILITY_CODES.length).toBe(146)
  })

  it("18 mã thu hoạch có trần cứng, tổng cả catalog là 41 — P4 (duyệt video final) và Q5 (xuất khách hàng, đổi nghĩa 18/09) thêm trần cứng", () => {
    const harvestedHardCap = HARVESTED_CODES.filter((ma) => khai(ma).tranCung)
    expect(harvestedHardCap.length).toBe(18)
    expect(HARD_CAPPED_CODES.length).toBe(41)
  })

  it("mỗi mã A–E khớp nguyên vẹn với bản harvest — không lệch khi mã nguồn đổi", () => {
    for (const ma of HARVESTED_CODES) {
      const source = khai(ma)
      const cat = capability(ma)
      const expectedDefaults = source.macDinh.map((v: keyof typeof VAI_TO_KEY) => VAI_TO_KEY[v]).sort()
      expect([...cat.defaultRoles].sort()).toEqual(expectedDefaults)

      if (source.tranCung) {
        const expectedHardCap = source.tranCung.map((v: keyof typeof VAI_TO_KEY) => VAI_TO_KEY[v]).sort()
        expect([...(cat.hardCap ?? [])].sort()).toEqual(expectedHardCap)
      } else {
        expect(cat.hardCap).toBeUndefined()
      }
    }
  })

  it("mọi mã có tên đọc được duy nhất, không trùng nhau", () => {
    const names = ALL_CAPABILITY_CODES.map((code) => capability(code).name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("`isCapabilityCode` nhận đúng mã, từ chối mã lạ", () => {
    expect(isCapabilityCode("B6")).toBe(true)
    expect(isCapabilityCode("H3")).toBe(true)
    expect(isCapabilityCode("Z99")).toBe(false)
  })

  it("bản mặc định không vượt trần cứng của chính mã đó", () => {
    for (const code of ALL_CAPABILITY_CODES) {
      const def = capability(code)
      if (!def.hardCap) continue
      for (const role of def.defaultRoles) {
        expect(def.hardCap).toContain(role)
      }
    }
  })

  it("Điều hành là tập cha của Sale và Điều phối, trừ nhóm Trải nghiệm (`YC-Q8`)", () => {
    for (const code of ALL_CAPABILITY_CODES) {
      const def = capability(code)
      const hasNonAdminOrgRole =
        def.defaultRoles.includes("dieu_phoi") || def.defaultRoles.includes("sale")
      if (hasNonAdminOrgRole) {
        expect(def.defaultRoles, `${code} (${def.name}) thiếu dieu_hanh`).toContain("dieu_hanh")
      }
    }
  })

  it("sáu cặp chạy/duyệt tách rời, không cặp nào gói chung (`YC-Q6`)", () => {
    expect(SPLIT_CAPABILITY_PAIRS).toHaveLength(6)
    for (const pair of SPLIT_CAPABILITY_PAIRS) {
      expect(pair.run).not.toBe(pair.approve)
      expect(isCapabilityCode(pair.run)).toBe(true)
      expect(isCapabilityCode(pair.approve)).toBe(true)
      // Duyệt luôn là hành động riêng — không role nào có approve chỉ vì có run.
      expect(capability(pair.approve).name).not.toBe(capability(pair.run).name)
    }
  })

  it("mặc định lớp một của vai hệ thống khớp danh sách defaultRoles", () => {
    const dieuHanh = defaultCodesForSystemRole("dieu_hanh")
    // Điều hành có mặt ở mọi mã trừ K1 (trải nghiệm thuần).
    expect(dieuHanh.length).toBe(ALL_CAPABILITY_CODES.length - 1)
    expect(dieuHanh).not.toContain("K1")

    const sale = defaultCodesForSystemRole("sale")
    expect(sale).toContain("A1")
    expect(sale).not.toContain("B6")
  })

  it("mọi mã đều thuộc `CAPABILITIES` với đúng `code`", () => {
    for (const code of ALL_CAPABILITY_CODES) {
      expect(CAPABILITIES[code]?.code).toBe(code)
    }
  })
})
