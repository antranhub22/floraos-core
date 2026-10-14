"use client"

import React from "react"
import { Layers } from "lucide-react"
import type { FlowerBomItem, FoliageBomItem, WrappingLayer, AccessoryBomItem } from "@/modules/products/domain/product-master-index"

export function formatAddress(addr: unknown): string {
  if (addr && typeof addr === "object") {
    const a = addr as Record<string, unknown>
    if (typeof a.formattedAddress === "string" && a.formattedAddress) return a.formattedAddress
    return [a.street, a.ward, a.district, a.city].filter((v) => typeof v === "string" && Boolean(v)).join(", ")
  }
  return typeof addr === "string" ? addr : "Theo hướng dẫn của Điều phối"
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return "—"
  const clean = phone.replace(/\s+/g, "")
  if (clean.length < 7) return clean
  return `${clean.slice(0, 4)}***${clean.slice(-3)}`
}

/** Nguyên phụ liệu cắm hoa của Thẻ Gia Công: bảng hoa chính + lá, giấy gói, phụ kiện. */
export function FloristJobBom({
  flowers,
  foliage,
  wrapping,
  accessories,
}: {
  flowers: FlowerBomItem[]
  foliage: FoliageBomItem[]
  wrapping: WrappingLayer[]
  accessories: AccessoryBomItem[]
}) {
  return (
    <>
    {/* BOM Flowers */}
    <div>
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Layers size={13} className="text-primary" />
        <span>NGUYÊN PHỤ LIỆU CẮM HOA CHI TIẾT</span>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-alt border-b border-border text-text-muted font-bold">
            <tr>
              <th className="px-3 py-2">Loài hoa</th>
              <th className="px-3 py-2">Số lượng</th>
              <th className="px-3 py-2">Màu sắc</th>
              <th className="px-3 py-2">Vai trò</th>
            </tr>
          </thead>
          <tbody className="divide-y border-border">
            {flowers.map((f, i) => (
              <tr key={i} className="hover:bg-surface-alt/40">
                <td className="px-3 py-2 font-bold text-text">{f.flowerName}</td>
                <td className="px-3 py-2 text-primary font-extrabold">
                  {f.quantity} {f.unit}
                </td>
                <td className="px-3 py-2 text-text-muted">{f.color}</td>
                <td className="px-3 py-2">
                  <span className="inline-block px-1.5 py-0.5 rounded text-caption font-bold bg-surface-alt text-text">
                    {f.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Foliage, Wrapping, Accessories */}
    {(foliage.length > 0 || wrapping.length > 0 || accessories.length > 0) && (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {foliage.length > 0 && (
          <div className="p-2.5 rounded-xl bg-surface-alt border border-border">
            <span className="font-bold text-text block mb-1">🌿 Lá & cành đệm:</span>
            <div className="text-text-muted space-y-0.5 text-caption">
              {foliage.map((fol, i) => (
                <div key={i}>• {fol.name} ({fol.role})</div>
              ))}
            </div>
          </div>
        )}
        {wrapping.length > 0 && (
          <div className="p-2.5 rounded-xl bg-surface-alt border border-border">
            <span className="font-bold text-text block mb-1">🎁 Giấy gói & Nơ:</span>
            <div className="text-text-muted space-y-0.5 text-caption">
              {wrapping.map((w, i) => (
                <div key={i}>• {w.layer}: {w.material} - {w.color}</div>
              ))}
            </div>
          </div>
        )}
        {accessories.length > 0 && (
          <div className="p-2.5 rounded-xl bg-surface-alt border border-border">
            <span className="font-bold text-text block mb-1">✨ Phụ kiện kèm:</span>
            <div className="text-text-muted space-y-0.5 text-caption">
              {accessories.map((a, i) => (
                <div key={i}>• {a.name} ({a.material})</div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
    </>
  )
}
