"use client"

import React, { useState } from "react"
import { Loader2, Plus, Save, Trash2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  BROCHURE_SHIPPING_SETTINGS_KEY,
  parseShippingConfig,
  type ShippingConfig,
} from "@/modules/greeting-card/domain/brochure-pricing"
import { enabledSlots, customTimeAllowed } from "@/modules/greeting-card/domain/delivery-schedule"
import { DeliverySlotToggles } from "./delivery-slot-toggles"
import { SlotCapacityFields, type SlotCapacityDraft } from "./slot-capacity-fields"
import { DEFAULT_SLOT_CAPACITY, MAX_SLOT_CAPACITY } from "@/modules/greeting-card/domain/slot-capacity"

interface ZoneDraft {
  id: string
  name: string
  fee: string
}

const FIELD = "h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"

type Draft = {
  zones: ZoneDraft[]; freeOver: string; cutoff: string; prep: string; slotIds: string[]; allowCustomTime: boolean
  freeAll: boolean; vouchers: boolean; capacity: SlotCapacityDraft
}

function toDraft(config: ShippingConfig): Draft {
  return {
    zones: config.zones.map((z) => ({ id: z.id, name: z.name, fee: String(z.feeVnd) })),
    freeOver: config.freeShippingOverVnd ? String(config.freeShippingOverVnd) : "",
    cutoff: config.sameDayCutoffHour != null ? String(config.sameDayCutoffHour) : "",
    prep: config.prepHours ? String(config.prepHours) : "",
    slotIds: enabledSlots(config).map((s) => s.id),
    allowCustomTime: customTimeAllowed(config),
    freeAll: config.freeShippingAll === true,
    vouchers: config.vouchersEnabled === true,
    capacity: {
      all: String(config.slotCapacity?.defaultMax ?? DEFAULT_SLOT_CAPACITY),
      perSlot: Object.fromEntries(Object.entries(config.slotCapacity?.perSlot ?? {}).map(([k, v]) => [k, String(v)])),
    },
  }
}

/** "" → null; số nguyên 0…10.000 (máy chủ cũng bỏ giá trị lạ). */
function capOrNull(v: string): number | null {
  const n = Number(v.replace(/\D/g, ""))
  return v.trim() && Number.isInteger(n) && n >= 0 && n <= MAX_SLOT_CAPACITY ? n : null
}

/** "" → null; ngoài khoảng → null (máy chủ cũng bỏ giá trị lạ). */
function hourOrNull(v: string, min: number, max: number): number | null {
  const n = Number(v.replace(/\D/g, ""))
  return v.trim() && Number.isInteger(n) && n >= min && n <= max ? n : null
}

/**
 * Khu vực giao + phí giao cho đơn Thẻ chào (`organizations.settings.brochure_shipping`).
 * Không khai khu vực nào → form khách không hỏi khu vực, phí giao "cửa hàng báo sau".
 */
export function BrochureShippingSettings() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // Bản nháp khởi tạo từ dữ liệu đã lưu ở lần sửa đầu tiên — không cần effect đồng bộ.
  const current = draft ?? (org.data ? toDraft(parseShippingConfig(org.data.settings)) : null)
  const edit = (next: Draft) => {
    setDraft(next)
    setMessage(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!current) return
    if (current.slotIds.length === 0 && !current.allowCustomTime) {
      setMessage({ ok: false, text: "Cần bật ít nhất một khung giờ giao hoặc cho nhập giờ cụ thể." })
      return
    }
    const zones = current.zones
      .map((z) => ({ id: z.id, name: z.name.trim(), fee_vnd: Number(z.fee.replace(/\D/g, "")) }))
      .filter((z) => z.name)
    const payload = {
      [BROCHURE_SHIPPING_SETTINGS_KEY]: {
        zones,
        free_shipping_over_vnd: current.freeOver ? Number(current.freeOver.replace(/\D/g, "")) : null,
        same_day_cutoff_hour: hourOrNull(current.cutoff, 1, 23),
        prep_hours: hourOrNull(current.prep, 0, 24) ?? 0,
        delivery_slots: current.slotIds,
        allow_custom_time: current.allowCustomTime,
        free_shipping_all: current.freeAll,
        voucher_enabled: current.vouchers,
        slot_capacity: {
          default: capOrNull(current.capacity.all) ?? DEFAULT_SLOT_CAPACITY,
          per_slot: Object.fromEntries(
            Object.entries(current.capacity.perSlot).flatMap(([k, v]) => (capOrNull(v) === null ? [] : [[k, capOrNull(v)]]))
          ),
        },
      },
    }
    setSaving(true)
    try {
      await apiSend("/api/v1/organizations/current", "PATCH", { settings: payload }, "Không lưu được phí giao hàng")
      await org.mutate()
      setDraft(null)
      setMessage({ ok: true, text: `Đã lưu ${zones.length} khu vực giao hàng.` })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Không lưu được phí giao hàng" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Truck size={18} className="text-primary" />
        <h3 className="text-title-sm font-extrabold text-foreground">Khu vực, phí giao & giờ nhận đơn</h3>
      </div>

      {org.error ? (
        <p role="alert" className="text-body-sm text-danger">{org.error.message}</p>
      ) : !current ? (
        <div className="h-20 rounded-lg bg-surface-muted animate-pulse" aria-busy="true" />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {current.zones.length === 0 && (
              <li className="text-body-sm text-text-muted">Chưa khai khu vực — khách sẽ thấy “phí giao cửa hàng báo sau”.</li>
            )}
            {current.zones.map((z, i) => (
              <li key={z.id} className="flex gap-2 items-center">
                <input
                  aria-label="Tên khu vực"
                  value={z.name}
                  maxLength={80}
                  placeholder="VD: Nội thành Quận 1, 3, 5"
                  onChange={(e) => edit({ ...current, zones: current.zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                  className={`${FIELD} flex-1`}
                />
                <input
                  aria-label="Phí giao (đ)"
                  inputMode="numeric"
                  value={z.fee}
                  placeholder="Phí (đ)"
                  onChange={(e) => edit({ ...current, zones: current.zones.map((x, j) => (j === i ? { ...x, fee: e.target.value } : x)) })}
                  className={`${FIELD} w-32`}
                />
                <button
                  type="button"
                  aria-label={`Xoá khu vực ${z.name || i + 1}`}
                  onClick={() => edit({ ...current, zones: current.zones.filter((_, j) => j !== i) })}
                  className="h-10 w-10 rounded-lg border border-border text-danger flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => edit({ ...current, zones: [...current.zones, { id: `z${Date.now().toString(36)}`, name: "", fee: "" }] })}
              className="gap-1.5"
            >
              <Plus size={14} /> Thêm khu vực
            </Button>
            <label className="flex items-center gap-2 text-body-sm">
              <span className="text-text-muted">Miễn phí giao cho đơn từ</span>
              <input
                inputMode="numeric"
                value={current.freeOver}
                placeholder="Bỏ trống = không miễn"
                onChange={(e) => edit({ ...current, freeOver: e.target.value })}
                className={`${FIELD} w-44`}
              />
              <span className="text-text-muted">đ</span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-body-sm">
              <span className="text-text-muted">Nhận giao trong ngày đến</span>
              <input
                inputMode="numeric"
                value={current.cutoff}
                placeholder="VD: 16"
                onChange={(e) => edit({ ...current, cutoff: e.target.value })}
                className={`${FIELD} w-20`}
              />
              <span className="text-text-muted">giờ (bỏ trống = không giới hạn)</span>
            </label>
            <label className="flex items-center gap-2 text-body-sm">
              <span className="text-text-muted">Cần chuẩn bị</span>
              <input
                inputMode="numeric"
                value={current.prep}
                placeholder="VD: 3"
                onChange={(e) => edit({ ...current, prep: e.target.value })}
                className={`${FIELD} w-16`}
              />
              <span className="text-text-muted">giờ trước khi giao</span>
            </label>
          </div>
          <DeliverySlotToggles
            slotIds={current.slotIds}
            allowCustomTime={current.allowCustomTime}
            onChange={(next) => edit({ ...current, ...next })}
          />
          <SlotCapacityFields value={current.capacity} onChange={(capacity) => edit({ ...current, capacity })} />
          <div className="flex flex-col gap-2 border-t border-border pt-3 text-body-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={current.freeAll} onChange={(e) => edit({ ...current, freeAll: e.target.checked })} className="accent-primary" />
              <span><strong>Miễn phí giao hoa cho mọi đơn</strong> (khách không trả phí giao ở mọi khu vực)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={current.vouchers} onChange={(e) => edit({ ...current, vouchers: e.target.checked })} className="accent-primary" />
              <span>Cho khách nhập <strong>mã giảm giá</strong> (tắt = ẩn ô nhập mã)</span>
            </label>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <p role="status" className={`text-caption font-medium ${message ? (message.ok ? "text-success" : "text-danger") : "text-text-muted"}`}>
          {message?.text ?? "Phí giao được cộng vào tổng tiền và mã QR thanh toán của khách."}
        </p>
        <Button type="submit" size="sm" disabled={saving || !draft} className="gap-1.5 shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Lưu phí giao</span>
        </Button>
      </div>
    </form>
  )
}
