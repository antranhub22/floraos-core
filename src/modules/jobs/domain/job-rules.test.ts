import { describe, expect, it } from "vitest"

import { canCancel, canRetry, isStuck, isTerminalStatus } from "./job-rules"

describe("job-rules", () => {
  it("chỉ PENDING huỷ được", () => {
    expect(canCancel("PENDING")).toBe(true)
    expect(canCancel("PROCESSING")).toBe(false)
    expect(canCancel("COMPLETED")).toBe(false)
  })

  it("chỉ FAILED retry được — COMPLETED/REJECTED không phải job lỗi", () => {
    expect(canRetry("FAILED")).toBe(true)
    expect(canRetry("COMPLETED")).toBe(false)
    expect(canRetry("CANCELLED")).toBe(false)
    expect(canRetry("PENDING")).toBe(false)
  })

  it("trạng thái cuối", () => {
    expect(isTerminalStatus("COMPLETED")).toBe(true)
    expect(isTerminalStatus("FAILED")).toBe(true)
    expect(isTerminalStatus("CANCELLED")).toBe(true)
    expect(isTerminalStatus("PENDING")).toBe(false)
    expect(isTerminalStatus("PROCESSING")).toBe(false)
  })

  it("treo quá 15 phút mới coi là stuck", () => {
    const startedAt = new Date("2026-01-01T00:00:00Z")
    const at14min = new Date(startedAt.getTime() + 14 * 60 * 1000)
    const at16min = new Date(startedAt.getTime() + 16 * 60 * 1000)

    expect(isStuck({ status: "PROCESSING", started_at: startedAt }, at14min)).toBe(false)
    expect(isStuck({ status: "PROCESSING", started_at: startedAt }, at16min)).toBe(true)
    expect(isStuck({ status: "PENDING", started_at: null }, at16min)).toBe(false)
    expect(isStuck({ status: "COMPLETED", started_at: startedAt }, at16min)).toBe(false)
  })
})
