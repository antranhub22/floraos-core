/**
 * Ảnh từng cảnh cho Khu vực E (và bất kỳ nơi nào cần "ảnh Khu vực D của cảnh N").
 *
 * 24/09/2026 (tối) — sửa lỗi "Cảnh #1…#5 chưa có ảnh sản phẩm": trước đây E
 * chỉ tìm Master ĐÃ DUYỆT của ảnh gốc và biến thể có `scene_plan_id` KHỚP
 * TUYỆT ĐỐI với kịch bản đang mở. Hỏng một trong hai (chưa nâng ảnh gốc thành
 * Master, hoặc kịch bản được AI viết lại ở D nên mã khác) là cả storyboard
 * trống ảnh — dù D đã sinh ảnh. Nay:
 *   1. Master: đã duyệt → nếu chưa có thì nâng ảnh gốc thành Master như Khu vực
 *      D làm → vẫn không được (thiếu quyền I2) thì dùng chính ảnh gốc.
 *   2. Biến thể: ưu tiên đúng kịch bản; không có thì bản MỚI NHẤT cùng số cảnh
 *      (bất kỳ kịch bản nào của Master này) — vẫn là ảnh thật do D sinh.
 */

import { promoteToMaster, resolveApprovedMaster } from "./package-client"

export type SceneImage = { assetId: string; url: string }

export interface SceneImageSet {
  master: SceneImage | null
  /** true khi "master" thực ra là ảnh gốc (chưa có Master đã duyệt). */
  masterIsOriginal: boolean
  byScene: Record<number, SceneImage>
  /** Cảnh lấy ảnh của kịch bản KHÁC (kịch bản đã được viết lại sau khi sinh ảnh). */
  fromOtherPlan: number[]
}

async function viewUrl(assetId: string): Promise<string | null> {
  const r = await fetch(`/api/v1/assets/${encodeURIComponent(assetId)}/view-url`).catch(() => null)
  if (!r?.ok) return null
  return ((await r.json()) as { url?: string }).url ?? null
}

type ListedAsset = { id: string; url?: string | null; approval_state?: string | null; metadata?: Record<string, unknown> | null }

export async function resolveSceneImages(assetId: string | undefined, planRef: string | null): Promise<SceneImageSet> {
  const empty: SceneImageSet = { master: null, masterIsOriginal: false, byScene: {}, fromOtherPlan: [] }
  if (!assetId) return empty

  let masterId = await resolveApprovedMaster(assetId).catch(() => null)
  if (!masterId) masterId = await promoteToMaster(assetId).catch(() => null)

  const masterRef = masterId ?? assetId
  const masterUrl = await viewUrl(masterRef)
  const master = masterUrl ? { assetId: masterRef, url: masterUrl } : null

  const byScene: Record<number, SceneImage> = {}
  const fromOtherPlan: number[] = []
  if (masterId) {
    const r = await fetch(`/api/v1/assets?kind=MARKETING&parent_asset_id=${encodeURIComponent(masterId)}&limit=200`).catch(() => null)
    if (r?.ok) {
      const rows = ((await r.json()) as { data?: ListedAsset[] }).data ?? []
      const usable = rows.filter((a) => {
        const m = a.metadata ?? {}
        return (
          typeof m.scene_index === "number" &&
          (m.variant_key === "styled" || m.variant_key === "branded") &&
          a.approval_state !== "REJECTED" &&
          Boolean(a.url)
        )
      })
      // Danh sách đã xếp mới nhất trước: lượt 1 lấy đúng kịch bản, lượt 2 lấp chỗ trống.
      for (const a of usable) {
        const m = a.metadata ?? {}
        const idx = m.scene_index as number
        if (!byScene[idx] && planRef && m.scene_plan_id === planRef) byScene[idx] = { assetId: a.id, url: a.url as string }
      }
      for (const a of usable) {
        const idx = (a.metadata ?? {}).scene_index as number
        if (!byScene[idx]) {
          byScene[idx] = { assetId: a.id, url: a.url as string }
          fromOtherPlan.push(idx)
        }
      }
    }
  }
  return { master, masterIsOriginal: !masterId && Boolean(master), byScene, fromOtherPlan }
}
