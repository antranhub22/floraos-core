"use client"

import React from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

import type { TransitionValidationResult, TransitionField } from "@/modules/creative-production/domain/validate-transition"

// ============================================================
// PROPS
// ============================================================

export interface ValidationScreenProps {
  /** Kết quả validate */
  readonly result: TransitionValidationResult
  /** Callback khi user nhấn "Tiếp tục" (chỉ khi valid) */
  readonly onContinue: () => void
  /** Callback khi user nhấn "Quay lại" */
  readonly onGoBack: () => void
}

// ============================================================
// COMPONENT
// ============================================================

export function ValidationScreen({
  result,
  onContinue,
  onGoBack,
}: ValidationScreenProps) {
  const { valid, fields, errors, warnings, completionPercent } = result

  const requiredFields = fields.filter((f) => f.required)
  const optionalFields = fields.filter((f) => !f.required)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white mx-auto">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-[18px] font-extrabold text-stone-900">
          Kiểm tra dữ liệu Chặng 1-4
        </h2>
        <p className="text-[13px] text-stone-500 max-w-md mx-auto">
          Đảm bảo tất cả dữ liệu carry-forward đã sẵn sàng trước khi bắt đầu sáng tạo nội dung.
        </p>
      </div>

      {/* ── Progress Bar ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-stone-600 uppercase tracking-wider">
            Mức độ hoàn thiện
          </span>
          <span className={`text-[14px] font-extrabold ${
            completionPercent >= 80 ? "text-emerald-600" : "text-amber-600"
          }`}>
            {completionPercent}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completionPercent >= 80
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : "bg-gradient-to-r from-amber-400 to-amber-600"
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-red-700 uppercase tracking-wider">
            <XCircle className="h-4 w-4" />
            Thiếu dữ liệu bắt buộc ({errors.length})
          </div>
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-[12px] text-red-700 flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Required Fields ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h4 className="text-[13px] font-bold text-stone-800 mb-3">
          ✅ Dữ liệu bắt buộc
        </h4>
        <div className="space-y-1.5">
          {requiredFields.map((f) => (
            <FieldRow key={f.field} field={f} />
          ))}
        </div>
      </div>

      {/* ── Optional Fields ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h4 className="text-[13px] font-bold text-stone-800 mb-3">
          💡 Dữ liệu tùy chọn (nâng cao chất lượng)
        </h4>
        <div className="space-y-1.5">
          {optionalFields.map((f) => (
            <FieldRow key={f.field} field={f} />
          ))}
        </div>
      </div>

      {/* ── Warnings ── */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-amber-700 uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            Gợi ý cải thiện ({warnings.length})
          </div>
          <ul className="space-y-1">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i} className="text-[11px] text-amber-700 flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={onContinue}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          {valid ? "Tiếp tục Creative Studio" : "Bỏ qua & Tiếp tục sáng tạo"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPONENT
// ============================================================

function FieldRow({ field }: { field: TransitionField }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-stone-50 transition-colors">
      {/* Status icon */}
      {field.present ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      ) : field.required ? (
        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-stone-300 flex-shrink-0" />
      )}

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-stone-700">{field.label}</div>
        <div className="text-[10px] text-stone-400">{field.source}</div>
      </div>

      {/* Value summary */}
      <span className={`text-[11px] truncate max-w-[180px] ${
        field.present ? "text-stone-600" : "text-stone-400 italic"
      }`}>
        {field.summary}
      </span>
    </div>
  )
}
