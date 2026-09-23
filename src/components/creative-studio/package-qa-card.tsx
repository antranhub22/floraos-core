"use client"

import React from "react"
import { ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react"

export interface QACheckItem {
  id: string
  title: string
  description: string
  status: "PASSED" | "WARNING" | "CHECKING"
  score?: string | undefined
}

interface PackageQACardProps {
  checks: QACheckItem[]
  allPassed: boolean
}

export function PackageQACard({ checks, allPassed }: PackageQACardProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-stone-900">
              Chặng 08 — QA · Kiểm tra chất lượng & Tiêu chuẩn thương hiệu
            </h4>
            <p className="text-[11.5px] text-stone-500">
              Hệ thống AI Guard tự động thẩm định bản quyền, độ toàn vẹn chủ thể và tiêu chuẩn kỹ thuật
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            allPassed
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {allPassed ? "Đạt chuẩn 100% QA" : "Đang kiểm định QA"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {checks.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2.5 rounded-xl border border-stone-100 bg-stone-50/50 p-3 hover:bg-stone-50 transition"
          >
            {item.status === "PASSED" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">{item.title}</span>
                {item.score && (
                  <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {item.score}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-stone-500 mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
