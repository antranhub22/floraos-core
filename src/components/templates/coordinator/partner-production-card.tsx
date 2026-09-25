"use client"

import React from "react"
import { Clock, Printer, CheckCircle2, MessageSquare, Layers } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FlowerBomItem, FoliageBomItem, WrappingLayer, AccessoryBomItem } from "@/modules/products/domain/product-master-index"

export interface PartnerProductionCardProps {
  orderCode: string
  recipeTitle: string
  targetReadyTime: string
  sampleImageUrl?: string | null | undefined
  flowers: FlowerBomItem[]
  foliage?: FoliageBomItem[] | undefined
  wrapping?: WrappingLayer[] | undefined
  accessories?: AccessoryBomItem[] | undefined
  cardMessage?: string | null | undefined
  internalNote?: string | null | undefined
  partnerName?: string | undefined
  onMarkReady?: () => void
  onPrint?: () => void
}

export function PartnerProductionCard({
  orderCode,
  recipeTitle,
  targetReadyTime,
  sampleImageUrl,
  flowers,
  foliage = [],
  wrapping = [],
  accessories = [],
  cardMessage,
  internalNote,
  partnerName,
  onMarkReady,
  onPrint,
}: PartnerProductionCardProps) {
  return (
    <Card className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-dashed border-border pb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Lệnh Cắm Hoa & Phiếu Xưởng (T07)
          </div>
          <h3 className="text-lg font-extrabold text-text">
            Đơn #{orderCode}: {recipeTitle}
          </h3>
          {partnerName && (
            <div className="text-xs text-text-muted mt-0.5">Đối tác / Thợ cắm: <strong className="text-text">{partnerName}</strong></div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone="danger" className="gap-1 font-bold px-3 py-1 text-xs">
            <Clock size={13} />
            Hạn cắm xong: {targetReadyTime}
          </Badge>
          {onPrint && (
            <Button variant="ghost" size="sm" onClick={onPrint} className="h-7 text-xs gap-1 text-text-muted">
              <Printer size={12} />
              In phiếu xưởng
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sampleImageUrl && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-text-muted">ẢNH MẪU THAM CHIẾU</span>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-border bg-surface-alt">
              <img src={sampleImageUrl} alt="Mẫu cắm hoa" className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        <div className={sampleImageUrl ? "md:col-span-2 flex flex-col gap-4" : "md:col-span-3 flex flex-col gap-4"}>
          <div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-red-600" />
              <span>CÔNG THỨC HOA NGUYÊN TỬ (MASTER INDEX BOM)</span>
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
                <tbody className="divide-y divide-border/60">
                  {flowers.map((f, i) => (
                    <tr key={i} className="hover:bg-surface-alt/40">
                      <td className="px-3 py-2 font-bold text-text">{f.flowerName}</td>
                      <td className="px-3 py-2 text-rose-700 font-extrabold">
                        {f.quantity} {f.unit}
                      </td>
                      <td className="px-3 py-2 text-text-muted">{f.color}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          f.role === "Chủ đạo"
                            ? "bg-rose-100 text-rose-800"
                            : f.role === "Điểm xuyến"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-neutral-100 text-neutral-800"
                        }`}>
                          {f.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(foliage.length > 0 || wrapping.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {foliage.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-alt border border-border/60">
                  <span className="font-bold text-text block mb-1">🌿 Lá & Cành đệm:</span>
                  <div className="text-text-muted space-y-0.5">
                    {foliage.map((fol, i) => (
                      <div key={i}>• {fol.name} ({fol.role})</div>
                    ))}
                  </div>
                </div>
              )}
              {wrapping.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-alt border border-border/60">
                  <span className="font-bold text-text block mb-1">🎁 Giấy gói & Nơ:</span>
                  <div className="text-text-muted space-y-0.5">
                    {wrapping.map((w, i) => (
                      <div key={i}>• {w.material} - {w.color}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {cardMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs">
              <div className="font-bold text-rose-950 flex items-center gap-1.5 mb-1">
                <MessageSquare size={13} className="text-rose-600" />
                <span>Nội dung thiệp chúc mừng (In nguyên văn):</span>
              </div>
              <p className="text-rose-900 font-medium italic">&ldquo;{cardMessage}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-dashed border-border">
        <div className="text-xs text-text-muted">
          {internalNote && <span>Lưu ý thợ: <strong>{internalNote}</strong></span>}
        </div>
        {onMarkReady && (
          <Button onClick={onMarkReady} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
            <CheckCircle2 size={15} />
            <span>Hoàn tất cắm hoa & Chuyển QC</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
