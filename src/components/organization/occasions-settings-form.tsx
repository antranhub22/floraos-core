"use client"

/**
 * occasions-settings-form.tsx — Quản lý danh mục "Dịp lễ" của tổ chức, mỗi
 * dịp mang một TÔNG GIỌNG (nợ #104, "giọng theo dịp" — Tony chốt xây đầy đủ
 * qua AskUserQuestion 17/09). Tông giọng ảnh hưởng kịch bản Zalo sinh ra ở
 * M01c (`generateZaloPitchScript()`, `sales-pitch-template.ts`) khi dịp đầu
 * tiên của một lượt chào hàng khớp CHÍNH XÁC tên dịp ở đây.
 *
 * Tự nạp dữ liệu riêng (không qua `useTenantProfile()`) vì đây là một DANH
 * SÁCH nhiều dòng, không phải hồ sơ đơn như business/brand profile.
 */

import React, { useEffect, useState } from "react"
import { CalendarHeart, Plus, Check, AlertCircle, CheckCircle2, Power } from "lucide-react"
import { OCCASION_REGISTER_LABELS, type OccasionRegisterValue } from "@/modules/organization/domain/occasion-rules"

interface OccasionRow {
  id: string
  code: string
  name: string
  sort_order: number
  is_active: boolean
  register: OccasionRegisterValue
}

const REGISTER_BADGE_CLASS: Record<OccasionRegisterValue, string> = {
  FESTIVE: "bg-amber-500/10 text-amber-700 border-amber-200",
  NEUTRAL: "bg-slate-500/10 text-slate-700 border-slate-200",
  SOLEMN: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
}

export function OccasionsSettingsForm() {
  const [occasions, setOccasions] = useState<OccasionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [newName, setNewName] = useState("")
  const [newCode, setNewCode] = useState("")
  const [newRegister, setNewRegister] = useState<OccasionRegisterValue>("FESTIVE")

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/occasions")
      if (!res.ok) throw new Error(`Không tải được danh mục dịp (${res.status})`)
      const json = await res.json()
      setOccasions(json.data ?? [])
    } catch (err: any) {
      setError(err?.message || "Lỗi tải danh mục dịp")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newCode.trim()) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch("/api/v1/occasions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode, name: newName, register: newRegister, sortOrder: occasions.length + 1 }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.error?.message || `Thêm dịp thất bại (${res.status})`)
      }
      setNewName("")
      setNewCode("")
      setNewRegister("FESTIVE")
      setSuccessMessage("Đã thêm dịp mới thành công!")
      await load()
    } catch (err: any) {
      setError(err?.message || "Lỗi khi thêm dịp")
    } finally {
      setSaving(false)
    }
  }

  const patchOccasion = async (id: string, patch: Partial<{ name: string; register: OccasionRegisterValue; isActive: boolean }>) => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch(`/api/v1/occasions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.error?.message || `Cập nhật dịp thất bại (${res.status})`)
      }
      await load()
    } catch (err: any) {
      setError(err?.message || "Lỗi khi cập nhật dịp")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs sm:text-sm font-medium text-emerald-800 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs sm:text-sm font-medium text-red-800 shadow-xs">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Khối 1: Thêm dịp mới */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarHeart size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Thêm dịp mới</h3>
            <p className="text-xs text-text-muted">Mỗi dịp mang một tông giọng — dùng để chỉnh kịch bản Zalo tự động</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1.4fr_1.4fr_auto] gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên dịp (VD: Ngày Nhà giáo)"
            className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs sm:text-sm text-text focus:border-primary focus:outline-none"
          />
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Mã (VD: teacher_day)"
            className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs sm:text-sm text-text focus:border-primary focus:outline-none"
          />
          <select
            value={newRegister}
            onChange={(e) => setNewRegister(e.target.value as OccasionRegisterValue)}
            className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs sm:text-sm text-text focus:border-primary focus:outline-none"
          >
            {Object.entries(OCCASION_REGISTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || !newName.trim() || !newCode.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary/95 transition-all disabled:opacity-60"
          >
            <Plus size={15} />
            <span>Thêm</span>
          </button>
        </div>
      </form>

      {/* Khối 2: Danh sách dịp hiện có */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-text pb-4 border-b border-border mb-4">Danh mục dịp của cửa hàng</h3>

        {loading ? (
          <p className="text-xs text-text-muted text-center py-6">Đang tải...</p>
        ) : occasions.length === 0 ? (
          <p className="text-xs text-text-muted italic text-center py-6">Chưa có dịp nào — thêm dịp đầu tiên ở trên</p>
        ) : (
          <div className="space-y-2.5">
            {occasions.map((o) => (
              <div
                key={o.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-border p-3 ${o.is_active ? "bg-surface" : "bg-surface-alt opacity-60"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-text truncate">{o.name}</p>
                  <p className="text-[11px] text-text-muted">Mã: {o.code}</p>
                </div>

                <select
                  value={o.register}
                  onChange={(e) => patchOccasion(o.id, { register: e.target.value as OccasionRegisterValue })}
                  disabled={saving}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${REGISTER_BADGE_CLASS[o.register]}`}
                >
                  {Object.entries(OCCASION_REGISTER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => patchOccasion(o.id, { isActive: !o.is_active })}
                  disabled={saving}
                  title={o.is_active ? "Tắt dịp này" : "Bật lại dịp này"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex-shrink-0 ${
                    o.is_active
                      ? "border-border text-text-muted hover:text-red-600 hover:border-red-200"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <Power size={13} />
                  <span>{o.is_active ? "Đang bật" : "Đã tắt"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 text-[11px] text-text-muted px-1">
        <Check size={14} className="mt-0.5 flex-shrink-0 text-primary" />
        <span>
          Dịp ở tông <strong>&quot;Trang trọng, chia buồn&quot;</strong> sẽ tự động bớt biểu tượng cảm xúc ăn mừng trong
          kịch bản Zalo khi đúng dịp đó được chọn cho một lượt chào hàng.
        </span>
      </p>
    </div>
  )
}
