"use client"

import React, { useRef, useState } from "react"
import {
  Clock,
  Printer,
  Copy,
  Check,
  Eye,
  EyeOff,
  MessageSquare,
  Layers,
  MapPin,
  Phone,
  Sparkles,
  Ban,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FlowerBomItem, FoliageBomItem, WrappingLayer, AccessoryBomItem, StructuredAddress } from "@/modules/products/domain/product-master-index"
import type { VisibleCustomField } from "@/components/coordinator/custom-fields-section"

export interface FloristJobCardProps {
  orderCode: string
  recipeTitle: string
  unitPriceVnd: number
  targetReadyTime: string
  deliveryTargetTime?: string | undefined
  sampleImageUrl?: string | null | undefined
  flowers: FlowerBomItem[]
  foliage?: FoliageBomItem[] | undefined
  wrapping?: WrappingLayer[] | undefined
  accessories?: AccessoryBomItem[] | undefined
  cardMessage?: string | null | undefined
  partnerInstruction?: string | null | undefined
  partnerName?: string | undefined
  recipientName?: string | undefined
  recipientPhone?: string | undefined
  deliveryAddress?: StructuredAddress | string | unknown
  customFields?: VisibleCustomField[] | undefined
  onConfirmAcceptance?: (suggestedFee: number) => void
  onCancelOrder?: () => void
  onPrint?: () => void
}

function formatAddress(addr: unknown): string {
  if (addr && typeof addr === "object") {
    const a = addr as Record<string, unknown>
    if (typeof a.formattedAddress === "string" && a.formattedAddress) return a.formattedAddress
    return [a.street, a.ward, a.district, a.city].filter((v) => typeof v === "string" && Boolean(v)).join(", ")
  }
  return typeof addr === "string" ? addr : "Theo hướng dẫn của Điều phối"
}

function maskPhoneNumber(phone?: string): string {
  if (!phone) return "—"
  const clean = phone.replace(/\s+/g, "")
  if (clean.length < 7) return clean
  return `${clean.slice(0, 4)}***${clean.slice(-3)}`
}

export function FloristJobCard({
  orderCode,
  recipeTitle,
  unitPriceVnd,
  targetReadyTime,
  deliveryTargetTime,
  sampleImageUrl,
  flowers,
  foliage = [],
  wrapping = [],
  accessories = [],
  cardMessage,
  partnerInstruction,
  partnerName,
  recipientName = "Khách hàng",
  recipientPhone,
  deliveryAddress,
  customFields = [],
  onConfirmAcceptance,
  onCancelOrder,
  onPrint,
}: FloristJobCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const defaultFee = Math.round(unitPriceVnd * 0.5)
  const [suggestedCraftFee, setSuggestedCraftFee] = useState<number>(defaultFee)
  const [maskPhone, setMaskPhone] = useState(true)
  const [copiedImage, setCopiedImage] = useState(false)
  const [copiedText, setCopiedText] = useState(false)

  const handleCopyText = async () => {
    const phoneDisplay = maskPhone ? maskPhoneNumber(recipientPhone) : recipientPhone || "Chưa có"
    const flowerSummary = flowers.map((f) => `${f.flowerName} (${f.quantity} ${f.unit})`).join(", ")
    const textBrief = [
      `📋 THẺ GIA CÔNG — ĐƠN #${orderCode}`,
      `🌸 Mẫu: ${recipeTitle}`,
      `⏰ Hạn cắm xong: ${targetReadyTime}${deliveryTargetTime ? ` (Giao lúc: ${deliveryTargetTime})` : ""}`,
      `💰 Giá gia công: ${suggestedCraftFee.toLocaleString("vi-VN")}đ`,
      `🌿 Hoa chính: ${flowerSummary || "Theo mẫu"}`,
      cardMessage ? `💌 Thiệp: "${cardMessage}"` : "",
      `📍 Giao tới: ${recipientName} · ${phoneDisplay} · ${formatAddress(deliveryAddress)}`,
      partnerInstruction ? `⚠️ Lưu ý: ${partnerInstruction}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    try {
      await navigator.clipboard.writeText(textBrief)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2500)
    } catch {
      // Fallback
    }
  }

  const handleCopyImage = async () => {
    if (!cardRef.current) return
    try {
      const { toBlob } = await import("html-to-image")
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        skipFonts: true,
      })
      if (blob && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setCopiedImage(true)
        setTimeout(() => setCopiedImage(false), 2500)
        return
      }
      throw new Error("Không hỗ trợ clipboard blob")
    } catch {
      try {
        const html2canvasModule = await import("html2canvas").catch(() => null)
        if (html2canvasModule && html2canvasModule.default) {
          const canvas = await html2canvasModule.default(cardRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
          })
          canvas.toBlob(async (blob) => {
            if (blob && navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
              setCopiedImage(true)
              setTimeout(() => setCopiedImage(false), 2500)
            } else {
              await handleCopyText()
            }
          })
          return
        }
      } catch {
        // Fallback
      }
      await handleCopyText()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Actions Bar (Thao tác điều phối, không đưa vào ảnh gửi thợ) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-5 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-caption font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Thẻ Gia Công Cắm Hoa
            </span>
            <span className="text-caption font-bold text-text-muted">Đơn #{orderCode}</span>
          </div>
          <h3 className="text-lg font-extrabold text-text mt-1">{recipeTitle}</h3>
          {partnerName && (
            <div className="text-xs text-text-muted mt-0.5">
              Xưởng / Thợ phụ trách: <strong className="text-text">{partnerName}</strong>
            </div>
          )}
        </div>

        {/* Top-Right Action Header */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="text-xs gap-1.5 h-8 font-semibold text-text"
          >
            {copiedText ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
            <span>{copiedText ? "Đã chép text" : "Copy text Zalo"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyImage}
            className="text-xs gap-1.5 h-8 font-semibold text-text"
          >
            {copiedImage ? <Check size={13} className="text-primary" /> : <Sparkles size={13} className="text-primary" />}
            <span>{copiedImage ? "Đã chép ảnh" : "Copy ảnh thẻ"}</span>
          </Button>

          {onPrint && (
            <Button variant="ghost" size="sm" onClick={onPrint} className="h-8 text-xs gap-1 text-text-muted">
              <Printer size={13} />
              <span className="hidden sm:inline">In PDF</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Card (Chỉ chụp vùng này từ Ảnh mẫu tham chiếu trở xuống) */}
      <Card ref={cardRef} className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sample Image */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-text-muted flex items-center justify-between">
              <span>ẢNH MẪU THAM CHIẾU</span>
              {deliveryTargetTime && (
                <span className="text-caption font-normal text-text-muted">Giao: {deliveryTargetTime}</span>
              )}
            </span>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-border bg-surface-alt">
              {sampleImageUrl ? (
                <img src={sampleImageUrl} alt="Mẫu hoa" crossOrigin="anonymous" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-text-muted text-xs">
                  Chưa có ảnh mẫu
                </div>
              )}
            </div>

            {/* Target Ready Time Badge */}
            <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-between text-xs">
              <span className="font-bold text-danger flex items-center gap-1.5">
                <Clock size={14} />
                Hạn cắm xong:
              </span>
              <span className="font-extrabold text-danger text-body-sm">{targetReadyTime}</span>
            </div>

            {/* Editable Suggested Craft Fee (Đã loại bỏ Giá bán đơn và Đặt lại 50% bảo mật nội bộ) */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-caption font-bold text-text">Giá gia công trên thẻ:</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step={10000}
                  value={suggestedCraftFee || ""}
                  onChange={(e) => setSuggestedCraftFee(Number(e.target.value))}
                  placeholder={`${defaultFee.toLocaleString("vi-VN")}đ`}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text font-bold text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-2.5 top-1.5 text-caption font-bold text-text-muted">VNĐ</span>
              </div>
            </div>
          </div>

        {/* Recipe & Details */}
        <div className="md:col-span-2 flex flex-col gap-4">
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

          {/* Card Message */}
          {cardMessage && (
            <div className="p-3 rounded-xl bg-surface-alt/70 border border-border text-xs">
              <div className="font-bold text-text flex items-center gap-1.5 mb-1">
                <MessageSquare size={13} className="text-primary" />
                <span>Nội dung thiệp / Banner (In nguyên văn):</span>
              </div>
              <p className="text-text font-medium italic">&ldquo;{cardMessage}&rdquo;</p>
            </div>
          )}

          {/* Delivery & Recipient Information */}
          <div className="p-3 rounded-xl bg-surface-alt/70 border border-border text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-text">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" />
                <span>Thông tin giao nhận cho bộ phận cắm hoa:</span>
              </span>
              <button
                type="button"
                onClick={() => setMaskPhone(!maskPhone)}
                className="inline-flex items-center gap-1 text-caption text-text-muted hover:text-text font-medium"
              >
                {maskPhone ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{maskPhone ? "Hiện số đầy đủ" : "Che số ĐT"}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text">
              <div>
                <span className="text-text-muted font-medium">Người nhận:</span>{" "}
                <strong>{recipientName}</strong>
              </div>
              <div>
                <span className="text-text-muted font-medium">Số điện thoại:</span>{" "}
                <strong>{maskPhone ? maskPhoneNumber(recipientPhone) : recipientPhone || "Chưa có"}</strong>
              </div>
            </div>
            <div className="text-text">
              <span className="text-text-muted font-medium">Địa chỉ:</span>{" "}
              <span>{formatAddress(deliveryAddress)}</span>
            </div>
          </div>

          {/* Special Instructions & Custom Fields */}
          {partnerInstruction && (
            <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20 text-xs">
              <span className="font-bold text-warning">Lưu ý kỹ thuật cho thợ:</span>{" "}
              <span className="text-text font-medium">{partnerInstruction}</span>
            </div>
          )}

          {customFields.length > 0 && (
            <div className="p-2.5 rounded-xl bg-surface-alt border border-border text-xs">
              <span className="font-bold text-text-muted uppercase text-caption block mb-1">Thông tin bổ sung</span>
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

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
        <div className="text-caption text-text-muted">
          Điều phối gửi Thẻ Gia công để thợ thẩm định. Sau khi chốt giá, bấm Xác nhận nhận đơn.
        </div>
        <div className="flex items-center gap-2">
          {onCancelOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelOrder}
              className="text-xs h-8 text-danger border-danger/30 hover:bg-danger/10 gap-1.5 font-bold"
            >
              <Ban size={13} />
              <span>Hủy không nhận đơn</span>
            </Button>
          )}

          {onConfirmAcceptance && (
            <Button
              size="sm"
              onClick={() => onConfirmAcceptance(suggestedCraftFee)}
              className="bg-primary hover:bg-primary-dark text-white text-xs h-8 gap-1.5 font-bold shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Xác nhận nhận đơn</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
    </div>
  )
}
