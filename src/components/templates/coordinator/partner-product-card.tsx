"use client"

import React, { useRef, useCallback, useState } from "react"
import {
  Flower2,
  Clock,
  MapPin,
  Copy,
  Send,
  Download,
  CheckCircle2,
  Banknote,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  Image as ImageIcon,
  Scissors,
  AlertTriangle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FlowerBomItem, StructuredAddress } from "@/modules/products/domain/product-master-index"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PartnerProductCardProps {
  /** Mã đơn hàng */
  orderCode: string
  /** Tên sản phẩm */
  productTitle: string
  /** URL ảnh mẫu sản phẩm */
  sampleImageUrl?: string | null | undefined
  /** BOM — Công thức cành hoa */
  flowers: FlowerBomItem[]
  /** Giá bán ra khách (VNĐ) */
  unitPriceVnd?: number | undefined
  /** Giá công trả đối tác (VNĐ) */
  partnerPayoutVnd?: number | undefined
  /** Thời gian yêu cầu hoàn thành */
  deliveryTargetTime: string
  /** Địa chỉ giao hàng */
  deliveryAddress: StructuredAddress | string
  /** Tên người nhận */
  recipientName: string
  /** SĐT người nhận */
  recipientPhone: string
  /** Nội dung thiệp */
  cardMessage?: string | undefined
  /** Ghi chú kỹ thuật từ điều phối viên */
  technicalNotes?: string | undefined
  /** Tên đối tác xưởng đã phân công */
  partnerName?: string | undefined
  /** Mức độ rủi ro */
  riskLevel?: "NORMAL" | "ATTENTION" | "AT_RISK" | "CRITICAL" | undefined
  /** Lý do rủi ro */
  riskReason?: string | null | undefined
  /** Callback chuyển bước */
  onAdvanceStage?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAddress(addr: StructuredAddress | string): string {
  if (typeof addr === "string") return addr
  return [addr.street, addr.ward, addr.district, addr.city].filter(Boolean).join(", ")
}

function buildZaloText(props: PartnerProductCardProps): string {
  const lines: string[] = [
    `🌸 PHIẾU ĐẶT HOA — ĐƠN #${props.orderCode}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📋 Sản phẩm: ${props.productTitle}`,
  ]

  if (props.partnerPayoutVnd) {
    lines.push(`💰 Giá công: ${props.partnerPayoutVnd.toLocaleString("vi-VN")}đ`)
  }

  if (props.flowers.length > 0) {
    lines.push(``)
    lines.push(`🌿 Công thức cành hoa (BOM):`)
    props.flowers.forEach((fl) => {
      lines.push(`   • ${fl.quantity} ${fl.unit} ${fl.flowerName} (${fl.color})`)
    })
  }

  lines.push(``)
  lines.push(`⏰ Hoàn thành trước: ${props.deliveryTargetTime}`)
  lines.push(`📍 Giao tới: ${formatAddress(props.deliveryAddress)}`)
  lines.push(`👤 Người nhận: ${props.recipientName} (${props.recipientPhone})`)

  if (props.cardMessage) {
    lines.push(``)
    lines.push(`💌 Nội dung thiệp: "${props.cardMessage}"`)
  }

  if (props.technicalNotes) {
    lines.push(``)
    lines.push(`📝 Ghi chú kỹ thuật:`)
    lines.push(`${props.technicalNotes}`)
  }

  lines.push(``)
  lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`FloraOS • Hệ thống Điều phối Tự động`)

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerProductCard(props: PartnerProductCardProps) {
  const {
    orderCode,
    productTitle,
    sampleImageUrl,
    flowers,
    unitPriceVnd,
    partnerPayoutVnd,
    deliveryTargetTime,
    deliveryAddress,
    recipientName,
    recipientPhone,
    cardMessage,
    technicalNotes,
    partnerName,
    riskLevel,
    riskReason,
    onAdvanceStage,
  } = props

  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const formattedAddress = formatAddress(deliveryAddress)

  // ── Copy text Zalo ──
  const handleCopyZalo = useCallback(async () => {
    const text = buildZaloText(props)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [props])

  // ── Gửi Zalo đối tác (deep-link) ──
  const handleSendZalo = useCallback(() => {
    const text = encodeURIComponent(buildZaloText(props))
    window.open(`https://zalo.me/?text=${text}`, "_blank")
  }, [props])

  // ── Tải Product Card PNG ──
  const handleDownloadPng = useCallback(async () => {
    if (!cardRef.current) return
    try {
      // `html-to-image` đã là phụ thuộc của dự án (thẻ chào Sales). Bản trước
      // import động `html2canvas` — gói không có trong package.json — nên nút
      // này luôn rơi vào nhánh báo lỗi.
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true })
      const link = document.createElement("a")
      link.download = `FloraOS_T02_${orderCode}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.warn("Tải PNG thất bại:", err)
      alert("Không tạo được ảnh PNG của thẻ (ảnh mẫu có thể chặn tải chéo nguồn). Dùng Copy Zalo thay thế.")
    }
  }, [orderCode])

  const riskTone =
    riskLevel === "CRITICAL"
      ? "danger"
      : riskLevel === "AT_RISK"
      ? "warning"
      : riskLevel === "ATTENTION"
      ? "neutral"
      : "success"

  return (
    <div className="flex flex-col gap-4">
      {/* ── Thanh tác vụ góc trên bên phải ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-black uppercase border border-red-200 tracking-wider">
            T02 • PRODUCT CARD
          </span>
          <span className="text-xs font-bold text-text-muted">PHIẾU ĐẶT HOA GỬI ĐỐI TÁC</span>
          <span className="text-sm font-extrabold text-text">#{orderCode}</span>
        </div>

        {/* Primary Visible Buttons + Overflow Menu */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyZalo}
            className="h-7 text-[11px] px-2.5 font-bold gap-1 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
          >
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            <span>{copied ? "Đã copy!" : "Copy Zalo"}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendZalo}
            className="h-7 text-[11px] px-2.5 font-bold gap-1 border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-100"
          >
            <Send size={12} />
            <span>Gửi Zalo</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPng}
            className="h-7 text-[11px] px-2.5 font-bold gap-1 border-zinc-300 text-zinc-700 bg-zinc-50 hover:bg-zinc-100"
          >
            <Download size={12} />
            <span>Tải PNG</span>
          </Button>
        </div>
      </div>

      {/* ── Product Card chính (ref cho PNG export) ── */}
      <Card
        ref={cardRef}
        className="rounded-2xl border-2 border-red-200 bg-white p-0 shadow-lg overflow-hidden"
      >
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Flower2 size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
                Phiếu Đặt Hoa Đối Tác
              </div>
              <div className="text-white text-sm font-extrabold">
                ĐƠN #{orderCode}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-bold">
              <Clock size={12} />
              <span>Hoàn thành trước:</span>
            </div>
            <div className="text-white text-sm font-black">
              {deliveryTargetTime}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Rủi ro cảnh báo */}
          {riskLevel && riskLevel !== "NORMAL" && riskReason && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
              <AlertTriangle size={14} className="shrink-0 text-amber-600 mt-0.5" />
              <span>{riskReason}</span>
            </div>
          )}

          {/* Row 1: Ảnh + Thông tin sản phẩm */}
          <div className="flex gap-4">
            {/* Ảnh mẫu lớn */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl border-2 border-red-200 overflow-hidden shrink-0 relative bg-zinc-50 shadow-sm">
              {sampleImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sampleImageUrl}
                  alt={productTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                  <ImageIcon size={32} />
                  <span className="text-[10px] font-medium">Chưa có ảnh mẫu</span>
                </div>
              )}
              {/* Badge ảnh mẫu */}
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-black uppercase backdrop-blur-sm">
                Ảnh Mẫu
              </div>
            </div>

            {/* Thông tin sản phẩm */}
            <div className="flex-1 flex flex-col gap-2.5 min-w-0">
              <div>
                <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-0.5">
                  Tên sản phẩm
                </div>
                <div className="text-base font-extrabold text-zinc-900 leading-snug">
                  {productTitle}
                </div>
              </div>

              {/* Giá */}
              <div className="flex items-center gap-3 flex-wrap">
                {partnerPayoutVnd != null && partnerPayoutVnd > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <Banknote size={14} className="text-emerald-600" />
                    <div>
                      <div className="text-[9px] font-bold text-emerald-700 uppercase">Giá công đối tác</div>
                      <div className="text-sm font-black text-emerald-800">
                        {partnerPayoutVnd.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>
                )}
                {unitPriceVnd != null && unitPriceVnd > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <Banknote size={14} className="text-zinc-500" />
                    <div>
                      <div className="text-[9px] font-bold text-zinc-500 uppercase">Giá bán khách</div>
                      <div className="text-sm font-bold text-zinc-600">
                        {unitPriceVnd.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Đối tác đã phân công */}
              {partnerName && (
                <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800 inline-flex items-center gap-1.5 self-start">
                  🏪 Xưởng: {partnerName}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: BOM — Công thức cành hoa */}
          {flowers.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Scissors size={13} className="text-rose-600" />
                <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">
                  Công Thức Cành Hoa (BOM)
                </span>
                <Badge tone="danger" className="text-[9px] font-black ml-1">
                  {flowers.length} loại
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {flowers.map((fl, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-rose-100 shadow-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-zinc-900 truncate">
                        {fl.flowerName}
                      </div>
                      <div className="text-[10.5px] text-zinc-500 font-medium">
                        {fl.quantity} {fl.unit} • {fl.color}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 3: Thông tin giao hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Địa chỉ giao */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-red-600" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Địa chỉ giao hàng</span>
                {typeof deliveryAddress === "object" && deliveryAddress !== null && (
                  <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    Chuẩn 5 tầng
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-zinc-900 leading-relaxed">
                {formattedAddress}
              </div>
              {typeof deliveryAddress === "object" && deliveryAddress !== null && (
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">
                    {deliveryAddress.ward}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                    {deliveryAddress.district}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                    {deliveryAddress.city}
                  </span>
                </div>
              )}
            </div>

            {/* Người nhận */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">👤 Người nhận hoa</span>
              </div>
              <div className="text-xs font-bold text-zinc-900">
                {recipientName}
              </div>
              <div className="text-[11px] text-zinc-600 font-medium">
                📞 {recipientPhone}
              </div>
            </div>
          </div>

          {/* Row 4: Thiệp */}
          {cardMessage && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-start gap-2">
              <MessageSquare size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">
                  Nội dung thiệp chúc mừng
                </div>
                <div className="text-xs text-amber-900 font-semibold italic leading-relaxed">
                  &ldquo;{cardMessage}&rdquo;
                </div>
              </div>
            </div>
          )}

          {/* Row 5: Ghi chú kỹ thuật */}
          {technicalNotes && (
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 flex items-start gap-2">
              <ClipboardList size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-indigo-700 uppercase mb-0.5">
                  Ghi chú kỹ thuật từ Điều phối
                </div>
                <div className="text-xs text-indigo-900 font-medium leading-relaxed whitespace-pre-line">
                  {technicalNotes}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500">
          <span>FloraOS Coordinator • Phiếu T02 tự động</span>
          <span className="font-bold">
            {new Date().toLocaleDateString("vi-VN")} {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </Card>

      {/* ── Nút chuyển bước ── */}
      {onAdvanceStage && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={onAdvanceStage}
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5 px-4 font-bold shadow-sm"
          >
            <span>Chuyển bước</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
