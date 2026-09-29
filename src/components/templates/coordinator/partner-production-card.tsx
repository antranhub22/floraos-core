"use client"

import React from "react"
import { Clock, Printer, CheckCircle2, MessageSquare, Layers } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FlowerBomItem, FoliageBomItem, WrappingLayer, AccessoryBomItem } from "@/modules/products/domain/product-master-index"
import type { VisibleCustomField } from "@/components/coordinator/custom-fields-section"

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
  /**
   * Chỉ dẫn điều phối viên ghi RIÊNG cho đối tác lúc phân công (T06,
   * `order_coordinations.metadata.partnerInstruction`). ĐP-1.7 (26/09/2026):
   * trước bản này khối này hiện `internalNote` — ghi chú NỘI BỘ của điều phối,
   * không phải nội dung dành cho đối tác — nên đổi tên và đổi nguồn cho khớp.
   */
  partnerInstruction?: string | null | undefined
  partnerName?: string | undefined
  /** ĐP-3.16 (26/09/2026): trường tự tạo (entity ORDER) đã lọc theo đối tượng PARTNER — xem `partner-product-card.tsx`. */
  customFields?: VisibleCustomField[] | undefined
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
  partnerInstruction,
  partnerName,
  customFields = [],
  onMarkReady,
  onPrint,
}: PartnerProductionCardProps) {
  return (
    <Card className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-dashed border-border pb-4">
        <div>
          <div className="text-caption font-bold uppercase tracking-wider text-text-muted">
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
              <Layers size={13} className="text-alert-600" />
              <span>CÔNG THỨC HOA NGUYÊN TỬ (MASTER INDEX BOM)</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt border-b border-border text-text-muted font-bold">
                  <tr>
                    <th className="px-3 py-2">Loài hoa</th>
                    <th className="px-3 py-2">Số lượng</th>
                    <th className="px-3 py-2">Màu sắc / Tông</th>
                    <th className="px-3 py-2">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {flowers.map((f, i) => (
                    <tr key={i} className="hover:bg-surface-alt/40">
                      <td className="px-3 py-2 font-bold text-text">
                        {f.flowerName}
                        {f.variety && <span className="text-caption font-medium text-text-muted"> · {f.variety}</span>}
                        {typeof f.budCount === "number" && f.budCount > 0 && (
                          <span className="ml-1.5 px-1 py-0 rounded bg-sand-100 text-sand-700 text-caption font-bold align-middle">
                            {f.budCount} nụ chưa nở
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-blush-700 font-extrabold">
                        {f.quantity} {f.unit}
                        {typeof f.stemLengthCm === "number" && (
                          <span className="ml-1 text-caption font-medium text-text-muted">· dài {f.stemLengthCm}cm</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-text-muted">
                        {f.color}
                        {f.shade && <span className="text-caption text-text-muted/80"> ({f.shade})</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-caption font-bold ${
                          f.role === "Chủ đạo"
                            ? "bg-blush-100 text-blush-800"
                            : f.role === "Điểm xuyến"
                            ? "bg-sand-100 text-sand-800"
                            : "bg-cool-100 text-cool-800"
                        }`}>
                          {f.role}
                        </span>
                        {f.substitutionAllowed && (
                          <span className="ml-1 inline-block px-1 py-0.5 rounded bg-azure-100 text-azure-800 text-caption font-bold">
                            Được thay{typeof f.substitutionPriority === "number" ? ` #${f.substitutionPriority}` : ""}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(foliage.length > 0 || wrapping.length > 0 || accessories.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {foliage.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-alt border border-border/60">
                  <span className="font-bold text-text block mb-1">🌿 Lá & Cành đệm:</span>
                  <div className="text-text-muted space-y-0.5">
                    {foliage.map((fol, i) => (
                      <div key={i}>
                        • {fol.name} ({fol.role})
                        {fol.substitutionAllowed && <span className="text-azure-700"> · được thay thế</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wrapping.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-alt border border-border/60">
                  <span className="font-bold text-text block mb-1">🎁 Giấy gói & Nơ ({wrapping.length} lớp):</span>
                  <div className="text-text-muted space-y-0.5">
                    {wrapping.map((w, i) => (
                      <div key={i}>
                        • {w.layer}: {w.material} - {w.color}
                        {w.pattern && ` (${w.pattern})`}
                        {typeof w.quantity === "number" && ` · SL ${w.quantity}`}
                        {w.substitutionAllowed && <span className="text-azure-700"> · được thay thế</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {accessories.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-alt border border-border/60">
                  <span className="font-bold text-text block mb-1">✨ Phụ kiện:</span>
                  <div className="text-text-muted space-y-0.5">
                    {accessories.map((a, i) => (
                      <div key={i}>
                        • {a.name} ({a.material}, {a.color}){a.unit ? ` · ${a.quantity ?? ""}${a.unit}` : ""}{a.printedText ? ` — "${a.printedText}"` : ""}
                        {a.substitutionAllowed && <span className="text-azure-700"> · được thay thế</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {cardMessage && (
            <div className="p-3.5 rounded-xl bg-blush-50/70 border border-blush-200 text-xs">
              <div className="font-bold text-blush-950 flex items-center gap-1.5 mb-1">
                <MessageSquare size={13} className="text-blush-600" />
                <span>Nội dung thiệp chúc mừng (In nguyên văn):</span>
              </div>
              <p className="text-blush-900 font-medium italic">&ldquo;{cardMessage}&rdquo;</p>
            </div>
          )}

          {customFields.length > 0 && (
            <div className="p-3 rounded-xl bg-surface-alt border border-border/60 text-xs">
              <div className="font-bold text-text-muted uppercase text-caption mb-1">Thông tin bổ sung</div>
              <div className="space-y-0.5 text-text">
                {customFields.map((f) => (
                  <div key={f.key}>
                    <span className="font-semibold">{f.label}:</span> {String(f.value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-dashed border-border">
        <div className="text-xs text-text-muted">
          {partnerInstruction && <span>Lưu ý thợ: <strong>{partnerInstruction}</strong></span>}
        </div>
        {onMarkReady && (
          <Button onClick={onMarkReady} className="bg-mint-600 hover:bg-mint-700 text-white gap-1.5">
            <CheckCircle2 size={15} />
            <span>Hoàn tất cắm hoa & Chuyển QC</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
