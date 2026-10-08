"use client"

import { useState, useEffect } from "react"
import { ChevronDown, MessageCircle, QrCode, X } from "lucide-react"
import type { ShopContact } from "@/modules/greeting-card/domain/shop-contact"
import { generateQRCodeDataUrl } from "@/core/media/qr-engine"
import { SHOP_INFO_EVENT, ShopInfoSheet, ShopLogo, type ShopInfoSection } from "./shop-info-sheet"

interface ShopContactBarProps {
  shop: ShopContact
  /** Mẫu khách đang xem: bấm Zalo thì chép sẵn tin nhắn hỏi đúng mẫu này */
  inquiry?: { onZalo: () => void; onCall?: () => void } | undefined
}

/**
 * Thanh thông tin cửa hàng trên mọi màn khách: logo + tên, nút Chat Zalo và QR Code kết nối Zalo.
 * Không hiển thị nút Gọi điện thoại (theo yêu cầu #11). Chạm logo/tên → khung "Thông tin cửa hàng"
 * (hotline, email, website, cam kết — PO 08/10/2026).
 */
export function ShopContactBar({ shop, inquiry }: ShopContactBarProps) {
  const [showQrModal, setShowQrModal] = useState(false)
  const [generatedQr, setGeneratedQr] = useState<string | null>(null)
  const [infoSection, setInfoSection] = useState<ShopInfoSection | null>(null)

  // Nơi khác trên trang (bước xác nhận đơn) mở khung cam kết qua sự kiện
  useEffect(() => {
    const open = (e: Event) => setInfoSection((e as CustomEvent<ShopInfoSection>).detail ?? "info")
    window.addEventListener(SHOP_INFO_EVENT, open)
    return () => window.removeEventListener(SHOP_INFO_EVENT, open)
  }, [])

  // Nếu tiệm chưa upload ảnh QR riêng nhưng có zaloUrl, tự sinh QR code từ zaloUrl
  useEffect(() => {
    if (!shop.zaloQrUrl && shop.zaloUrl) {
      void generateQRCodeDataUrl(shop.zaloUrl, { width: 320, margin: 2 }).then(setGeneratedQr)
    }
  }, [shop.zaloQrUrl, shop.zaloUrl])

  const qrImageUrl = shop.zaloQrUrl || generatedQr

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center gap-2.5 px-4">
          <button
            type="button"
            onClick={() => setInfoSection("info")}
            aria-haspopup="dialog"
            aria-label={`Thông tin cửa hàng ${shop.name}`}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full text-left"
          >
            <ShopLogo shop={shop} />
            <span className="min-w-0 truncate text-body font-bold text-foreground">{shop.name}</span>
            <ChevronDown size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
          </button>

          {/* Nút xem QR Code Zalo (từ hồ sơ cửa hàng) */}
          {qrImageUrl && (
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              aria-label="Mã QR Zalo"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-3 text-body-sm font-semibold text-foreground hover:bg-surface-muted transition-colors"
            >
              <QrCode size={16} aria-hidden="true" />
              <span>Mã QR</span>
            </button>
          )}

          {/* Nút Chat Zalo */}
          {shop.zaloUrl && (
            <a
              href={shop.zaloUrl}
              target="_blank"
              rel="noreferrer"
              onClick={
                inquiry
                  ? (e) => {
                      e.preventDefault()
                      inquiry.onZalo()
                    }
                  : undefined
              }
              aria-label={`Chat Zalo với ${shop.name}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-3.5 text-body-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              <MessageCircle size={16} aria-hidden="true" />
              <span>Zalo</span>
            </a>
          )}
        </div>
      </header>

      {infoSection && <ShopInfoSheet shop={shop} section={infoSection} onClose={() => setInfoSection(null)} />}

      {/* Modal hiển thị QR Code Zalo */}
      {showQrModal && qrImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="zalo-qr-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-xs rounded-2xl border border-border bg-surface p-6 shadow-xl text-center flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              aria-label="Đóng mã QR"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              <X size={18} />
            </button>
            <h3 id="zalo-qr-title" className="text-title-sm font-extrabold text-foreground mb-1">
              Quét mã kết nối Zalo
            </h3>
            <p className="text-caption text-text-muted mb-4">
              Mở Zalo trên điện thoại và quét mã để liên hệ với {shop.name}
            </p>
            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt={`Mã QR Zalo của ${shop.name}`}
                className="h-56 w-56 object-contain"
              />
            </div>
            {shop.phone && (
              <p className="mt-3 text-caption text-text-muted font-medium">
                SĐT Zalo: <span className="font-bold text-foreground">{shop.phone}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
