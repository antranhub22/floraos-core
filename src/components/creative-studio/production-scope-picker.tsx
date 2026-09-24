"use client"

/**
 * Chọn PHẠM VI SẢN XUẤT (PO 24/09/2026) — cuối Chặng 04 và đầu Chặng 05.
 *
 * - Nền tảng đăng: mặc định TikTok + Reels (9:16) mỗi lần mở; "Tất cả" = mọi nền tảng.
 * - Loại kết quả: content / audio / hình ảnh / video; mặc định cả 4.
 * - Mỗi khung hình khác nhau sinh một bộ ảnh + một video riêng (credit × số khung).
 * - Chọn video tự kéo theo hình ảnh + âm thanh (video cần chúng).
 * - Luôn ít nhất một mục ở mỗi nhóm.
 */

import React from "react"
import {
  ALL,
  DEFAULT_PLATFORMS,
  PLATFORM_SPECS,
  PRODUCTION_OUTPUTS,
  PUBLISH_PLATFORMS,
  resolvePublishing,
  type ProductionOutput,
  type PublishPlatform,
} from "@/modules/creative-production/domain/publishing-rules"

export interface ProductionScope {
  platforms: PublishPlatform[] | typeof ALL
  outputs: ProductionOutput[] | typeof ALL
}

export const DEFAULT_PRODUCTION_SCOPE: ProductionScope = {
  platforms: [...DEFAULT_PLATFORMS],
  outputs: ALL,
}

export const OUTPUT_LABELS: Record<ProductionOutput, string> = {
  content: "Nội dung bài đăng",
  audio: "Âm thanh",
  image: "Hình ảnh",
  video: "Video",
}

function toggle<T extends string>(current: T[] | typeof ALL, all: readonly T[], item: T): T[] | typeof ALL {
  const list = current === ALL ? [...all] : current
  const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
  if (next.length === 0) return list // luôn giữ ít nhất một mục
  return next.length === all.length ? ALL : next
}

export function ProductionScopePicker({
  value,
  onChange,
  compact = false,
}: {
  value: ProductionScope
  onChange: (next: ProductionScope) => void
  compact?: boolean
}) {
  const pub = resolvePublishing(value.platforms, value.outputs)
  const chip = (on: boolean, derived = false) =>
    `rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
      on
        ? "border-primary bg-rose-50 text-primary"
        : derived
          ? "border-dashed border-amber-300 bg-amber-50 text-amber-700"
          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
    }`

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3 rounded-xl border border-stone-200 bg-white p-4"}>
      {!compact && (
        <div>
          <p className="text-[12.5px] font-bold text-stone-900">Phạm vi sản xuất</p>
          <p className="text-[11px] text-stone-500">
            Hệ thống chỉ sinh đúng những gì bạn chọn. Chọn &ldquo;Tất cả&rdquo; để sản xuất cho mọi nền tảng.
          </p>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-stone-700">Nền tảng sẽ đăng</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...value, platforms: [...DEFAULT_PLATFORMS] })}
              className="text-[10.5px] font-semibold text-stone-500 hover:text-primary"
            >
              Mặc định
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, platforms: ALL })}
              className={chip(value.platforms === ALL)}
            >
              Tất cả
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PUBLISH_PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={pub.platforms.includes(p)}
              onClick={() => onChange({ ...value, platforms: toggle(value.platforms, PUBLISH_PLATFORMS, p) })}
              className={chip(pub.platforms.includes(p))}
            >
              {PLATFORM_SPECS[p].label} · {PLATFORM_SPECS[p].ratio}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-stone-700">Loại kết quả</span>
          <button type="button" onClick={() => onChange({ ...value, outputs: ALL })} className={chip(value.outputs === ALL)}>
            Tất cả
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRODUCTION_OUTPUTS.map((o) => {
            const chosen = pub.outputs.includes(o)
            const derived = !chosen && pub.derivedOutputs.includes(o)
            return (
              <button
                key={o}
                type="button"
                aria-pressed={chosen}
                title={derived ? "Tự thêm vì video cần" : undefined}
                onClick={() => onChange({ ...value, outputs: toggle(value.outputs, PRODUCTION_OUTPUTS, o) })}
                className={chip(chosen, derived)}
              >
                {OUTPUT_LABELS[o]}
                {derived ? " · cần cho video" : ""}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-stone-600">
        Sẽ sản xuất: <b>{pub.produce.map((o) => OUTPUT_LABELS[o]).join(", ")}</b>
        {pub.produce.includes("image") || pub.produce.includes("video") ? (
          <>
            {" "}· khung <b>{pub.ratios.join(", ")}</b>
            {pub.ratios.length > 1 && ` (mỗi khung một bộ ảnh${pub.produce.includes("video") ? " + một video" : ""} — credit ảnh/video × ${pub.ratios.length})`}
          </>
        ) : null}
        {pub.produce.includes("video") && (
          <>
            {" "}· {pub.videoVariants.length} video (
            {pub.videoVariants.map((v) => `${v.ratio} ~${v.targetSeconds}s`).join(", ")})
          </>
        )}
        {pub.produce.includes("content") && pub.postChannels.length > 0 && <> · bài đăng cho {pub.postChannels.join(", ")}</>}
        .
      </p>
    </div>
  )
}
