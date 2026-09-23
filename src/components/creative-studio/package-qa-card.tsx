"use client"
/**
 * PackageQACard — hiển thị báo cáo QA THẬT của Chặng 08 (23/09/2026).
 * Bản trước nhận một mảng hằng "PASSED 99.9%" từ giao diện.
 */

import React from "react"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

import type { CampaignPackageDto } from "./package-client"

type Report = NonNullable<CampaignPackageDto["qa_report"]>

const VERDICT_STYLE: Record<Report["verdict"], { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  PASS: { label: "Đạt", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle2 },
  NEEDS_REVIEW: { label: "Cần xem lại", cls: "text-amber-700 bg-amber-50 border-amber-200", Icon: AlertCircle },
  REJECTED: { label: "Từ chối", cls: "text-rose-700 bg-rose-50 border-rose-200", Icon: XCircle },
}

export function PackageQACard({ report }: { report: Report }) {
  const overall = VERDICT_STYLE[report.verdict]
  return (
    <div className="space-y-3">
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold ${overall.cls}`}>
        <overall.Icon size={14} /> Kết luận QA: {overall.label}
        <span className="font-normal opacity-80">· {new Date(report.checkedAt).toLocaleString("vi-VN")}</span>
      </div>
      <div className="space-y-2">
        {report.checks.map((c) => {
          const st = VERDICT_STYLE[c.verdict]
          return (
            <div key={c.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-text">{c.title}</span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>
                  <st.Icon size={12} /> {st.label}
                </span>
              </div>
              {c.reasons.length > 0 && (
                <ul className="mt-1.5 list-disc pl-5 text-[12px] text-text-muted space-y-0.5">
                  {c.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
