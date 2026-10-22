import { describe, expect, it } from "vitest"

import {
  PREVIOUS_STATUS_KEY,
  buildTrashItem,
  calculateDaysRemaining,
  isTrashItemType,
  readLegacyTrashedAt,
  readPreviousStatus,
  stripTrashKeys,
  trashPurgeCutoff,
} from "@/modules/storage/domain/trash-types"

const DAY_MS = 86_400_000

describe("trash-types", () => {
  it("mốc dọn rác là đúng 30 ngày trước thời điểm hiện tại", () => {
    const now = new Date("2026-10-17T00:00:00.000Z")
    expect(trashPurgeCutoff(now).toISOString()).toBe("2026-09-17T00:00:00.000Z")
  })

  it("buildTrashItem tính hạn 30 ngày và số ngày còn lại", () => {
    const trashedAt = new Date("2026-10-01T00:00:00.000Z")
    const item = buildTrashItem({
      id: "c1",
      type: "CUSTOMER",
      name: "Chị Lan",
      trashedAt,
      now: trashedAt.getTime() + 10 * DAY_MS,
    })
    expect(item.expiresAt).toBe("2026-10-31T00:00:00.000Z")
    expect(item.daysRemaining).toBe(20)
    expect(item.retained).toBeUndefined()
  })

  it("số ngày còn lại không âm khi đã quá hạn", () => {
    expect(calculateDaysRemaining("2026-01-01T00:00:00.000Z", Date.parse("2026-02-01T00:00:00.000Z"))).toBe(0)
  })

  it("đọc được dấu thùng rác cũ trong JSON; JSON sai hình dạng trả null", () => {
    expect(readLegacyTrashedAt({ trashed_at: "2026-09-01T00:00:00.000Z" })?.toISOString()).toBe("2026-09-01T00:00:00.000Z")
    expect(readLegacyTrashedAt({ trashed_at: "không phải ngày" })).toBeNull()
    expect(readLegacyTrashedAt(null)).toBeNull()
    expect(readLegacyTrashedAt(["x"])).toBeNull()
  })

  it("khôi phục đúng trạng thái trước; trạng thái lạ thì về mặc định", () => {
    expect(readPreviousStatus({ [PREVIOUS_STATUS_KEY]: "DRAFT" }, ["DRAFT", "ACTIVE"], "ACTIVE")).toBe("DRAFT")
    expect(readPreviousStatus({ [PREVIOUS_STATUS_KEY]: "ARCHIVED" }, ["DRAFT", "ACTIVE"], "ACTIVE")).toBe("ACTIVE")
    expect(readPreviousStatus(null, ["DRAFT", "ACTIVE"], "ACTIVE")).toBe("ACTIVE")
  })

  it("gỡ dấu thùng rác nhưng giữ nguyên các khoá khác", () => {
    expect(
      stripTrashKeys({ price: 300000, trashed_at: "x", trashed_by: "u", expires_at: "y", [PREVIOUS_STATUS_KEY]: "DRAFT" })
    ).toEqual({ price: 300000 })
  })

  it("chỉ nhận đúng các loại mục đã đăng ký", () => {
    expect(isTrashItemType("VOUCHER")).toBe(true)
    expect(isTrashItemType("ORDER")).toBe(false)
    expect(isTrashItemType(null)).toBe(false)
  })
})
