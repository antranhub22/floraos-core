"use client"
/**
 * PackageDownstreamCard — Chặng 10 LAUNCH → 14 NEXT BEST ACTION (23/09/2026).
 *
 * Bản trước hiển thị "34 đơn", "20.366.000đ", "Độ tin cậy 96%" gõ cứng trong mã
 * — chủ tiệm sẽ đọc như số của chính mình. Nay:
 *   10 — lưu kế hoạch đăng + mã bài đã đăng bên Lịch đăng (SocialFlow M07)
 *        qua `PUT /packages/:id/launch`. Việc đăng thật diễn ra ở Lịch đăng.
 *   11–14 — `GET /packages/:id/performance`: đơn hàng/doanh thu của sản phẩm kể
 *        từ ngày duyệt, hội thoại, `content_metrics` của bài đã gắn, mẫu thắng
 *        (chỉ khi đủ ≥ 3 gói có số liệu), đề xuất dựa trên dữ kiện thật.
 */

import React, { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BarChart3, Brain, Loader2, MessageCircle, Plus, Rocket, Save, Target, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { apiJson, type CampaignPackageDto, type PackageChannel } from "./package-client"

const CHANNELS: { id: PackageChannel; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "zalo", label: "Zalo OA" },
]

interface Performance {
  sell: { conversations_since_approval: number; orders: number }
  measure: {
    since: string | null
    orders: { count: number; quantity: number; revenueVnd: number }
    conversations: number
    channel: {
      linkedPosts: number
      postsWithData: number
      reach: number | null
      impressions: number | null
      engagement: number | null
      clicks: number | null
      conversions: number | null
    }
    caveats: string[]
  }
  learn:
    | { status: "INSUFFICIENT_DATA"; have: number; need: number }
    | {
        status: "OK"
        basedOn: number
        patterns: Array<{ dimension: string; value: string; packages: number; avgRevenueVnd: number; avgOrders: number }>
      }
  next_best_actions: Array<{ id: string; title: string; why: string; target: string }>
  computed_at: string
}

const DIMENSION_LABEL: Record<string, string> = {
  angleCategory: "Góc tiếp cận chủ đề",
  scene2Preset: "Bối cảnh Cảnh 2",
  hasVideo: "Có video",
}

function fmt(n: number | null): string {
  return n === null ? "chưa có số liệu" : n.toLocaleString("vi-VN")
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export interface PackageDownstreamCardProps {
  pkg: CampaignPackageDto
  onUpdated: (pkg: CampaignPackageDto) => void
}

export function PackageDownstreamCard({ pkg, onUpdated }: PackageDownstreamCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [channels, setChannels] = useState<PackageChannel[]>(
    pkg.launch_plan?.channels ?? pkg.posts.map((p) => p.channel)
  )
  const [scheduledAt, setScheduledAt] = useState<string>(toLocalInput(pkg.launch_plan?.scheduledAt ?? null))
  const [refs, setRefs] = useState<Array<{ platform: PackageChannel; contentId: string }>>(
    pkg.launch_plan?.postRefs ?? []
  )
  const [perf, setPerf] = useState<Performance | null>(null)
  const [loadingPerf, setLoadingPerf] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPerformance = useCallback(async () => {
    setLoadingPerf(true)
    try {
      setPerf(await apiJson<Performance>(`/api/v1/creative-production/packages/${pkg.id}/performance`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được số liệu")
    } finally {
      setLoadingPerf(false)
    }
  }, [pkg.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ state từ nguồn ngoài (URL/API), chủ đích
    loadPerformance()
  }, [loadPerformance, pkg.launch_plan])

  const saveLaunch = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}/launch`, {
        method: "PUT",
        body: JSON.stringify({
          channels,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          post_refs: refs
            .filter((r) => r.contentId.trim())
            .map((r) => ({ platform: r.platform, content_id: r.contentId.trim() })),
        }),
      })
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được kế hoạch đăng")
    } finally {
      setSaving(false)
    }
  }

  const goTarget = (target: string) => {
    if (target.startsWith("area-")) {
      const params = new URLSearchParams(searchParams?.toString() || "")
      params.set("area", target.replace("area-", ""))
      router.push(`/creative-studio?${params.toString()}` as never)
    } else {
      router.push(target as never)
    }
  }

  const m = perf?.measure

  return (
    <div className="space-y-5">
      {error && <p className="text-[12.5px] text-danger">{error}</p>}

      {/* Chặng 10 — LAUNCH */}
      <Card className="p-5 space-y-3">
        <h4 className="text-[14px] font-bold text-text flex items-center gap-2">
          <Rocket size={16} /> Chặng 10 — Kế hoạch đăng
        </h4>
        <p className="text-[12px] text-text-muted">
          Đăng hoặc lên lịch bài ở <strong>Lịch đăng</strong> (SocialFlow M07), rồi gắn mã bài vào đây để Chặng 12 đo
          được số liệu kênh thật.
        </p>
        <div className="flex flex-wrap gap-3">
          {CHANNELS.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-[12.5px]">
              <input
                type="checkbox"
                checked={channels.includes(c.id)}
                onChange={(e) =>
                  setChannels((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))
                }
              />
              {c.label}
            </label>
          ))}
        </div>
        <label className="block text-[12px]">
          Giờ đăng dự kiến
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 block rounded border border-border px-2 py-1 text-xs"
          />
        </label>
        <div className="space-y-2">
          <div className="text-[12px] font-bold">Mã bài đã đăng</div>
          {refs.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={r.platform}
                onChange={(e) =>
                  setRefs((prev) => prev.map((x, j) => (j === i ? { ...x, platform: e.target.value as PackageChannel } : x)))
                }
                className="rounded border border-border px-2 py-1 text-xs"
              >
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                value={r.contentId}
                onChange={(e) => setRefs((prev) => prev.map((x, j) => (j === i ? { ...x, contentId: e.target.value } : x)))}
                placeholder="Mã bài (content_id)"
                className="flex-1 rounded border border-border px-2 py-1 text-xs font-mono"
              />
              <button type="button" onClick={() => setRefs((prev) => prev.filter((_, j) => j !== i))} className="text-danger">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRefs((prev) => [...prev, { platform: channels[0] ?? "facebook", contentId: "" }])}
            className="inline-flex items-center gap-1 text-[12px] text-primary font-bold"
          >
            <Plus size={13} /> Thêm mã bài
          </button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={saveLaunch} disabled={saving || channels.length === 0} className="gap-1.5">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu kế hoạch đăng
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push("/lich-dang" as never)}>
            Mở Lịch đăng
          </Button>
        </div>
      </Card>

      {/* Chặng 11–12 */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[14px] font-bold text-text flex items-center gap-2">
            <BarChart3 size={16} /> Chặng 11–12 — Bán hàng & Đo lường (số liệu thật)
          </h4>
          <Button size="sm" variant="ghost" onClick={loadPerformance} disabled={loadingPerf}>
            {loadingPerf ? <Loader2 size={13} className="animate-spin" /> : "Làm mới"}
          </Button>
        </div>
        {m ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="rounded-lg border border-border p-3">
                <div className="text-[11px] text-text-muted flex items-center justify-center gap-1">
                  <MessageCircle size={11} /> Hội thoại mới
                </div>
                <div className="text-lg font-black">{m.conversations.toLocaleString("vi-VN")}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[11px] text-text-muted">Đơn có sản phẩm</div>
                <div className="text-lg font-black">{m.orders.count.toLocaleString("vi-VN")}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[11px] text-text-muted">Doanh thu sản phẩm</div>
                <div className="text-lg font-black">{m.orders.revenueVnd.toLocaleString("vi-VN")}đ</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[11px] text-text-muted">Bài có số liệu kênh</div>
                <div className="text-lg font-black">
                  {m.channel.postsWithData}/{m.channel.linkedPosts}
                </div>
              </div>
            </div>
            <div className="text-[12px] text-text-muted grid grid-cols-2 sm:grid-cols-5 gap-1">
              <span>Reach: {fmt(m.channel.reach)}</span>
              <span>Hiển thị: {fmt(m.channel.impressions)}</span>
              <span>Tương tác: {fmt(m.channel.engagement)}</span>
              <span>Click: {fmt(m.channel.clicks)}</span>
              <span>Chuyển đổi: {fmt(m.channel.conversions)}</span>
            </div>
            <ul className="list-disc pl-5 text-[11.5px] text-text-muted">
              {m.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[12px] text-text-muted">{loadingPerf ? "Đang tính..." : "Chưa có số liệu."}</p>
        )}
      </Card>

      {/* Chặng 13 */}
      <Card className="p-5 space-y-2">
        <h4 className="text-[14px] font-bold text-text flex items-center gap-2">
          <Brain size={16} /> Chặng 13 — Mẫu thắng (Winning Patterns)
        </h4>
        {!perf ? null : perf.learn.status === "INSUFFICIENT_DATA" ? (
          <p className="text-[12.5px] text-text-muted">
            Chưa đủ dữ liệu: tiệm mới có {perf.learn.have}/{perf.learn.need} gói đã duyệt gắn với sản phẩm. Hệ thống không
            kết luận “mẫu thắng” khi dữ liệu chưa đủ.
          </p>
        ) : perf.learn.patterns.length === 0 ? (
          <p className="text-[12.5px] text-text-muted">
            Đã so {perf.learn.basedOn} gói nhưng chưa thấy khác biệt doanh thu giữa các nhóm.
          </p>
        ) : (
          <ul className="space-y-1.5 text-[12.5px]">
            {perf.learn.patterns.map((p) => (
              <li key={p.dimension} className="rounded-lg border border-border p-2.5">
                <strong>{DIMENSION_LABEL[p.dimension] ?? p.dimension}:</strong> {p.value} — trung bình{" "}
                {p.avgRevenueVnd.toLocaleString("vi-VN")}đ và {p.avgOrders.toFixed(1)} đơn/gói ({p.packages} gói).
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Chặng 14 */}
      <Card className="p-5 space-y-2">
        <h4 className="text-[14px] font-bold text-text flex items-center gap-2">
          <Target size={16} /> Chặng 14 — Việc nên làm tiếp
        </h4>
        {perf && perf.next_best_actions.length === 0 && (
          <p className="text-[12.5px] text-text-muted">Chưa có đề xuất mới.</p>
        )}
        <ul className="space-y-2">
          {perf?.next_best_actions.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <div className="text-[12.5px] font-bold">{a.title}</div>
                <div className="text-[11.5px] text-text-muted">{a.why}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => goTarget(a.target)}>
                Làm ngay
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
