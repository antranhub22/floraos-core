import { describe, expect, it, vi } from "vitest"

import type { TrashRepository } from "@/modules/storage/infra/trash-repository"
import { PURGE_BATCH_PER_TYPE, purgeExpiredTrash } from "@/modules/storage/use-cases/purge-expired-trash"

function fakeRepo(outcomes: Record<string, "purged" | "retained" | "not_found" | Error>) {
  return {
    findExpired: vi.fn(async () =>
      Object.keys(outcomes).map((id) => ({ id, organizationId: `org-${id}`, type: "CUSTOMER" as const }))
    ),
    permanentDelete: vi.fn(async (_ctx: unknown, input: { id: string }) => {
      const outcome = outcomes[input.id]
      if (outcome instanceof Error) throw outcome
      return outcome ?? "not_found"
    }),
  } as unknown as TrashRepository & {
    findExpired: ReturnType<typeof vi.fn>
    permanentDelete: ReturnType<typeof vi.fn>
  }
}

describe("purgeExpiredTrash", () => {
  it("xoá hẳn mục quá hạn, đếm mục giữ lại, ghi audit đúng tổ chức của từng mục", async () => {
    const repo = fakeRepo({ a: "purged", b: "retained", c: "not_found" })
    const audit = { record: vi.fn(async () => ({}) as never) }
    const now = new Date("2026-10-17T00:00:00.000Z")

    const result = await purgeExpiredTrash(now, repo, audit)

    expect(result).toEqual({ purged: 1, retained: 1, failed: 0 })
    expect(repo.findExpired).toHaveBeenCalledWith(new Date("2026-09-17T00:00:00.000Z"), PURGE_BATCH_PER_TYPE)
    expect(audit.record).toHaveBeenCalledTimes(1)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-a", userId: "system:trash-purge" }),
      expect.objectContaining({ action: "trash.auto_purge", entityId: "a" })
    )
  })

  it("lỗi ở một mục không chặn các mục khác", async () => {
    const repo = fakeRepo({ a: new Error("khoá ngoại"), b: "purged" })
    const audit = { record: vi.fn(async () => ({}) as never) }

    const result = await purgeExpiredTrash(new Date(), repo, audit)

    expect(result).toEqual({ purged: 1, retained: 0, failed: 1 })
  })
})
