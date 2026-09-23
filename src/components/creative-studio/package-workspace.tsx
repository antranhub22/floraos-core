"use client"
/**
 * PackageWorkspace — Khu vực F (Chặng 07 PACKAGE → 08 QA → 09 APPROVE, rồi 10–14).
 *
 * 23/09/2026 — viết lại trên dữ liệu thật. Bản trước: tài sản luôn "READY",
 * QA là bốn hằng "PASSED 99.9%", duyệt chỉ đổi state trình duyệt, bài đăng mẫu
 * gõ cứng. Nay:
 *   07 — gói lưu ở bảng `campaign_packages`, chỉ giữ ĐỊNH DANH tài sản thật
 *        (biến thể của đúng Master, video job, audio job) + bài đăng người dùng soạn.
 *   08 — QA chạy phía máy chủ (`POST /packages/:id/qa`), năm trục, số đo thật.
 *   09 — duyệt qua endpoint riêng (`J5`), ghi `audit_logs` cùng giao dịch.
 *   10–14 — `<PackageDownstreamCard />` đọc số liệu thật (`/performance`).
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, Loader2, Package, RefreshCw, Save, ShieldCheck } from "lucide-react"

import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PackageQACard } from "./package-qa-card"
import { PackageDownstreamCard } from "./package-downstream-card"
import {
  apiJson,
  findLatestPackage,
  promoteToMaster,
  resolveApprovedMaster,
  sceneTwoPresetFor,
  type CampaignPackageDto,
  type PackageChannel,
  type PackagePostDto,
} from "./package-client"

const CHANNELS: { id: PackageChannel; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "zalo", label: "Zalo OA" },
]

const STATUS_LABEL: Record<CampaignPackageDto["status"], string> = {
  DRAFT: "Nháp — chưa chạy QA",
  QA_PASSED: "QA đạt",
  QA_NEEDS_REVIEW: "QA cần xem lại",
  QA_REJECTED: "QA từ chối",
  APPROVED: "Đã duyệt (Chặng 09)",
}

interface MarketingAsset {
  id: string
  url: string | null
  aspect_ratio: string | null
  identity_score: number | null
  approval_state: string
  metadata?: Record<string, unknown> | null
}

interface VideoJobSummary {
  id: string
  title: string
  stage: string
  video_approval: string
  aspect_ratio: string
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
}

export function PackageWorkspace() {
  const ctx = useContext(CreativeStudioContext)
  const searchParams = useSearchParams()
  const urlVideoJobId = searchParams?.get("videoJobId") ?? null
  const urlAudioJobId = searchParams?.get("audioJobId") ?? null

  const [masterId, setMasterId] = useState<string | null>(null)
  const [resolving, setResolving] = useState(true)
  const [pkg, setPkg] = useState<CampaignPackageDto | null>(null)
  const [marketing, setMarketing] = useState<MarketingAsset[]>([])
  const [videoJobs, setVideoJobs] = useState<VideoJobSummary[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [acknowledge, setAcknowledge] = useState(false)

  // Bản nháp chỉnh sửa (Chặng 07) — lưu bằng PATCH.
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])
  const [videoJobId, setVideoJobId] = useState<string | null>(null)
  const [audioJobId, setAudioJobId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Record<PackageChannel, { on: boolean; text: string; tags: string }>>({
    facebook: { on: false, text: "", tags: "" },
    instagram: { on: false, text: "", tags: "" },
    tiktok: { on: false, text: "", tags: "" },
    zalo: { on: false, text: "", tags: "" },
  })

  const loadDraftFrom = useCallback((p: CampaignPackageDto) => {
    setPkg(p)
    setSelectedVariants(p.variant_asset_ids)
    setVideoJobId(p.video_job_id)
    setAudioJobId(p.audio_job_id)
    setPosts((prev) => {
      const next = { ...prev }
      for (const c of CHANNELS) next[c.id] = { on: false, text: "", tags: "" }
      for (const post of p.posts) next[post.channel] = { on: true, text: post.text, tags: post.hashtags.join(" ") }
      return next
    })
  }, [])

  // 1. Master đã duyệt + gói mới nhất của Master.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setResolving(true)
      setError(null)
      try {
        const id = await resolveApprovedMaster(ctx?.assetId)
        if (cancelled) return
        setMasterId(id)
        if (id) {
          const latest = await findLatestPackage(id)
          if (!cancelled && latest) loadDraftFrom(latest)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được gói chiến dịch")
      } finally {
        if (!cancelled) setResolving(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ctx?.assetId, loadDraftFrom])

  // 2. Tài sản thật để chọn vào gói.
  useEffect(() => {
    if (!masterId) return
    fetch(`/api/v1/assets?kind=MARKETING&parent_asset_id=${encodeURIComponent(masterId)}&limit=100`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((b: { data?: MarketingAsset[] }) => setMarketing(b.data ?? []))
      .catch(() => setMarketing([]))
  }, [masterId])

  useEffect(() => {
    const productId = pkg?.product_id ?? ctx?.productId
    const q = productId ? `productId=${encodeURIComponent(productId)}&` : ""
    fetch(`/api/v1/video/jobs?${q}limit=20`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((b: { data?: VideoJobSummary[] }) => setVideoJobs(b.data ?? []))
      .catch(() => setVideoJobs([]))
  }, [pkg?.product_id, ctx?.productId])

  // Định danh mang từ Khu vực C/E qua URL — gợi ý sẵn khi gói chưa có.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ state từ nguồn ngoài (URL/API), chủ đích
    if (urlVideoJobId && !videoJobId && pkg?.status !== "APPROVED") setVideoJobId(urlVideoJobId)
    if (urlAudioJobId && !audioJobId && pkg?.status !== "APPROVED") setAudioJobId(urlAudioJobId)
  }, [urlVideoJobId, urlAudioJobId, videoJobId, audioJobId, pkg?.status])

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác thất bại")
    } finally {
      setBusy(null)
    }
  }

  const handlePromote = () =>
    run("promote", async () => {
      if (!ctx?.assetId) throw new Error("Chưa có ảnh từ Khu vực A.")
      setMasterId(await promoteToMaster(ctx.assetId))
    })

  const handleCreate = () =>
    run("create", async () => {
      if (!masterId) return
      const topic = ctx?.selectedTopic
      const created = await apiJson<CampaignPackageDto>("/api/v1/creative-production/packages", {
        method: "POST",
        body: JSON.stringify({
          name: `${ctx?.productName || "Sản phẩm"}${topic ? ` — ${topic.title}` : ""}`.slice(0, 200),
          mode: ctx?.mode ?? "CREATIVE",
          master_asset_id: masterId,
          ...(topic
            ? {
                topic: {
                  id: topic.id,
                  title: topic.title,
                  angleCategory: topic.angleCategory,
                  hook: topic.hook,
                  cta: topic.cta,
                  scene2Preset: sceneTwoPresetFor(topic.angleCategory),
                },
              }
            : {}),
          ...(urlVideoJobId ? { video_job_id: urlVideoJobId } : {}),
          ...(urlAudioJobId ? { audio_job_id: urlAudioJobId } : {}),
        }),
      })
      loadDraftFrom(created)
    })

  const draftPosts: PackagePostDto[] = useMemo(
    () =>
      CHANNELS.filter((c) => posts[c.id].on).map((c) => ({
        channel: c.id,
        text: posts[c.id].text,
        hashtags: parseHashtags(posts[c.id].tags),
      })),
    [posts]
  )

  const handleSave = () =>
    run("save", async () => {
      if (!pkg) return
      loadDraftFrom(
        await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            posts: draftPosts,
            variant_asset_ids: selectedVariants,
            video_job_id: videoJobId,
            audio_job_id: audioJobId,
          }),
        })
      )
    })

  const handleQa = () =>
    run("qa", async () => {
      if (!pkg) return
      loadDraftFrom(await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}/qa`, { method: "POST" }))
    })

  const handleApprove = () =>
    run("approve", async () => {
      if (!pkg) return
      loadDraftFrom(
        await apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${pkg.id}/approve`, {
          method: "POST",
          body: JSON.stringify({ acknowledge_warnings: acknowledge }),
        })
      )
    })

  const approved = pkg?.status === "APPROVED"
  const dirty =
    !!pkg &&
    !approved &&
    (JSON.stringify(draftPosts) !== JSON.stringify(pkg.posts) ||
      JSON.stringify([...selectedVariants].sort()) !== JSON.stringify([...pkg.variant_asset_ids].sort()) ||
      videoJobId !== pkg.video_job_id ||
      audioJobId !== pkg.audio_job_id)

  // ── Trạng thái tải / thiếu Master ─────────────────────────────────────────
  if (resolving) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
        <Loader2 size={16} className="animate-spin" /> Đang tải gói chiến dịch...
      </div>
    )
  }

  if (!masterId) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-6 space-y-3">
        <h3 className="text-[15px] font-bold text-text">Cần Master Image đã duyệt trước khi đóng gói</h3>
        <p className="text-[13px] text-text-muted">
          Gói chiến dịch neo vào Master Image đã duyệt (cổng 2). Bạn có thể dùng ngay ảnh gốc từ Khu vực A làm
          Master (không chỉnh sửa ảnh), hoặc tối ưu ảnh trước ở Tải ảnh.
        </p>
        {ctx?.assetId ? (
          <Button onClick={handlePromote} disabled={busy !== null} className="gap-2">
            {busy === "promote" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Skip — Dùng ảnh gốc làm Master (I2)
          </Button>
        ) : (
          <p className="text-[13px] text-danger">Chưa có ảnh sản phẩm — bắt đầu ở Khu vực A.</p>
        )}
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
      </Card>
    )
  }

  if (!pkg) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Package size={18} className="text-primary" />
          <h3 className="text-[15px] font-bold text-text">Chặng 07 — Tạo gói chiến dịch</h3>
        </div>
        <p className="text-[13px] text-text-muted">
          Chưa có gói nào cho Master Image này. Tạo gói nháp rồi chọn ảnh biến thể, video, âm thanh và bài đăng thật
          đã sản xuất ở Khu vực B–E.
        </p>
        <Button onClick={handleCreate} disabled={busy !== null} className="gap-2">
          {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
          Tạo gói chiến dịch
        </Button>
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
      </Card>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Tiêu đề + trạng thái */}
      <Card className="p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Khu vực F — Gói chiến dịch</div>
          <h3 className="text-[16px] font-bold text-text">{pkg.name}</h3>
          <p className="text-[12px] text-text-muted">
            Mode {pkg.mode} · Master #{pkg.master_asset_id.slice(0, 8)}
            {pkg.topic ? ` · Chủ đề: ${pkg.topic.title}` : ""}
          </p>
        </div>
        <Badge
          tone={approved ? "success" : pkg.status === "QA_REJECTED" ? "danger" : pkg.status === "QA_NEEDS_REVIEW" ? "warning" : "neutral"}
          className="text-xs px-3 py-1 font-bold"
        >
          {STATUS_LABEL[pkg.status]}
        </Badge>
      </Card>

      {error && (
        <div className="rounded-xl border border-danger bg-danger-bg px-4 py-3 text-[13px] text-danger flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* ── Chặng 07 — PACKAGE ── */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-[14px] font-bold text-text">Chặng 07 — Chọn tài sản & bài đăng</h4>
          {!approved && (
            <Button size="sm" onClick={handleSave} disabled={!dirty || busy !== null} className="gap-1.5">
              {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Lưu gói
            </Button>
          )}
        </div>

        <section className="space-y-2">
          <div className="text-[12px] font-bold text-text">Ảnh biến thể của Master này (Khu vực D)</div>
          {marketing.length === 0 ? (
            <p className="text-[12px] text-text-muted">Chưa có biến thể nào — sinh ở Khu vực D.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {marketing.map((a) => {
                const on = selectedVariants.includes(a.id)
                const score = typeof a.identity_score === "number" ? `${(a.identity_score * 100).toFixed(2)}%` : "chưa đo"
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={approved}
                    onClick={() =>
                      setSelectedVariants((prev) => (on ? prev.filter((x) => x !== a.id) : [...prev, a.id]))
                    }
                    className={`rounded-lg border-2 overflow-hidden text-left ${on ? "border-primary" : "border-border"} disabled:cursor-default`}
                  >
                    {a.url ? <img src={a.url} alt="" className="aspect-square w-full object-contain bg-stone-50" /> : null}
                    <div className="p-1.5 text-[10.5px] leading-tight">
                      <div className="font-bold">{a.aspect_ratio ?? "?"} · {score}</div>
                      <div className={a.approval_state === "APPROVED" ? "text-success" : "text-text-muted"}>
                        {a.approval_state === "APPROVED" ? "Đã duyệt (I5)" : "Chưa duyệt"}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="text-[12px] font-bold text-text">Video (Khu vực E)</div>
          <select
            value={videoJobId ?? ""}
            disabled={approved}
            onChange={(e) => setVideoJobId(e.target.value || null)}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs"
          >
            <option value="">— Không kèm video —</option>
            {videoJobs.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} · {v.aspect_ratio} · {v.stage} · duyệt: {v.video_approval}
              </option>
            ))}
          </select>
        </section>

        <section className="space-y-2">
          <div className="text-[12px] font-bold text-text">Âm thanh (Khu vực C)</div>
          {audioJobId ? (
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-mono">Audio job #{audioJobId.slice(0, 8)} {pkg.audio?.stage ? `· ${pkg.audio.stage}` : ""}</span>
              {!approved && (
                <button type="button" className="text-danger underline" onClick={() => setAudioJobId(null)}>
                  Bỏ khỏi gói
                </button>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-text-muted">Chưa kèm âm thanh — phối ở Khu vực C.</p>
          )}
          {pkg.audio?.audio_url && <audio controls src={pkg.audio.audio_url} className="w-full" />}
        </section>

        <section className="space-y-3">
          <div className="text-[12px] font-bold text-text">Bài đăng theo kênh (lưu từ Khu vực B hoặc soạn tại đây)</div>
          {CHANNELS.map((c) => {
            const p = posts[c.id]
            return (
              <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
                <label className="flex items-center gap-2 text-[12px] font-bold">
                  <input
                    type="checkbox"
                    checked={p.on}
                    disabled={approved}
                    onChange={(e) => setPosts((prev) => ({ ...prev, [c.id]: { ...prev[c.id], on: e.target.checked } }))}
                  />
                  {c.label}
                </label>
                {p.on && (
                  <>
                    <textarea
                      value={p.text}
                      disabled={approved}
                      onChange={(e) => setPosts((prev) => ({ ...prev, [c.id]: { ...prev[c.id], text: e.target.value } }))}
                      rows={5}
                      className="w-full rounded border border-border px-2 py-1.5 text-xs"
                      placeholder={`Nội dung bài ${c.label}`}
                    />
                    <input
                      value={p.tags}
                      disabled={approved}
                      onChange={(e) => setPosts((prev) => ({ ...prev, [c.id]: { ...prev[c.id], tags: e.target.value } }))}
                      className="w-full rounded border border-border px-2 py-1.5 text-xs"
                      placeholder="#hashtag cách nhau bằng dấu cách"
                    />
                    <div className="text-[10.5px] text-text-muted">{p.text.length} ký tự</div>
                  </>
                )}
              </div>
            )
          })}
        </section>
      </Card>

      {/* ── Chặng 08 — QA ── */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[14px] font-bold text-text flex items-center gap-2">
            <ShieldCheck size={16} /> Chặng 08 — Kiểm định QA (chạy phía máy chủ)
          </h4>
          {!approved && (
            <Button size="sm" variant="outline" onClick={handleQa} disabled={dirty || busy !== null} className="gap-1.5">
              {busy === "qa" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {pkg.qa_report ? "Chạy lại QA" : "Chạy QA"}
            </Button>
          )}
        </div>
        {dirty && <p className="text-[12px] text-warning">Có thay đổi chưa lưu — lưu gói trước khi chạy QA.</p>}
        {pkg.qa_report ? (
          <PackageQACard report={pkg.qa_report} />
        ) : (
          <p className="text-[12px] text-text-muted">Chưa chạy QA cho phiên bản gói hiện tại.</p>
        )}
      </Card>

      {/* ── Chặng 09 — APPROVE ── */}
      <Card className="p-5 space-y-3">
        <h4 className="text-[14px] font-bold text-text">Chặng 09 — Chủ shop duyệt chốt</h4>
        {approved ? (
          <p className="text-[13px] text-success flex items-center gap-2">
            <CheckCircle2 size={15} /> Đã duyệt lúc {pkg.approved_at ? new Date(pkg.approved_at).toLocaleString("vi-VN") : ""} — đã ghi nhật ký kiểm toán.
          </p>
        ) : (
          <>
            {pkg.status === "QA_NEEDS_REVIEW" && (
              <label className="flex items-start gap-2 text-[12.5px]">
                <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} />
                Tôi đã xem các cảnh báo QA ở trên và chấp nhận đăng gói này.
              </label>
            )}
            <Button
              onClick={handleApprove}
              disabled={
                busy !== null ||
                dirty ||
                !(pkg.status === "QA_PASSED" || (pkg.status === "QA_NEEDS_REVIEW" && acknowledge))
              }
              className="gap-2"
            >
              {busy === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Duyệt chốt gói chiến dịch (J5)
            </Button>
            <p className="text-[11.5px] text-text-muted">
              Chỉ duyệt được sau khi QA đạt, hoặc QA cần xem lại và bạn đã xác nhận. QA từ chối thì phải sửa rồi chạy lại.
            </p>
          </>
        )}
      </Card>

      {approved && <PackageDownstreamCard pkg={pkg} onUpdated={loadDraftFrom} />}
    </div>
  )
}
