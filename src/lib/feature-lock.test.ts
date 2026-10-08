import { describe, expect, it } from "vitest"
import { isFeatureLockEnabled, isJourneyLocked, isRouteLocked } from "./feature-lock"
import { STORE_JOURNEYS } from "@/modules/journey/domain/journey-catalog"

describe("feature-lock", () => {
  it("chỉ bật khi NEXT_PUBLIC_APP_ENV=production", () => {
    expect(isFeatureLockEnabled("production")).toBe(true)
    expect(isFeatureLockEnabled("staging")).toBe(false)
    expect(isFeatureLockEnabled(undefined)).toBe(false)
  })

  it("khóa tuyến, tuyến con và tuyến kèm query khi bật", () => {
    expect(isRouteLocked("/creative-studio?tab=area-d", true)).toBe(true)
    expect(isRouteLocked("/hoi-thoai/kenh-tich-hop", true)).toBe(true)
    expect(isRouteLocked("/kho-templates", true)).toBe(true)
  })

  it("không khóa tuyến khác hoặc tuyến chỉ trùng tiền tố chữ", () => {
    expect(isRouteLocked("/khach-hang", true)).toBe(false)
    expect(isRouteLocked("/videos", true)).toBe(false)
    expect(isRouteLocked("/", true)).toBe(false)
  })

  it("không khóa gì khi tắt (dev/staging)", () => {
    expect(isRouteLocked("/creative-studio", false)).toBe(false)
    expect(isJourneyLocked("manage-customers", false)).toBe(false)
  })

  it("khóa đúng thẻ trang chủ khi bật", () => {
    expect(isJourneyLocked("manage-customers", true)).toBe(true)
    expect(isJourneyLocked("view-store-overview", true)).toBe(true)
  })

  it("production: trang chủ cửa hàng chỉ mở Thẻ chào mẫu hoa", () => {
    const open = STORE_JOURNEYS.filter((j) => !isJourneyLocked(j.id, true)).map((j) => j.id)
    expect(open).toEqual(["greeting-card-hub"])
    expect(isJourneyLocked("view-platform-overview", true)).toBe(false)
  })
})
