"use client"

import React from "react"
import { X, Sparkles, CheckCircle2, ShieldCheck, Gift, Ruler, Flower2, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface EnterpriseSpecSheetProps {
  product: GreetingCatalogProduct
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

export function EnterpriseSpecSheet({
  product,
  isOpen,
  onClose,
  onSelectProduct,
}: EnterpriseSpecSheetProps) {
  if (!isOpen) return null

  // Trích xuất cấu phần hoa dự phòng nếu không có sẵn trong product.description/flowersSummary
  const flowersList = product.flowersSummary
    ? product.flowersSummary.split(",").map((s) => s.trim())
    : [
        "Hoa chính: Hoa tươi tuyển chọn loại 1",
        "Hoa phụ: Hoa baby & lá chanh đệm thanh lịch",
        "Giấy gói & nơ: Giấy lụa nhập khẩu cao cấp phong cách Hàn Quốc",
      ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng bảng chi tiết hoa"
        className="absolute inset-0 w-full h-full cursor-pointer -z-10"
      />

      <div className="w-full max-w-md bg-surface text-foreground rounded-t-[32px] border-t border-border shadow-2xl p-5 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-3 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Flower2 size={18} />
            </div>
            <div>
              <h3 className="text-body font-extrabold text-foreground line-clamp-1">{product.name}</h3>
              <p className="text-caption text-text-muted">Mã: {product.code} · Chi tiết cấu phần & cam kết</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-body-sm">
          {/* Price & Highlight */}
          <div className="bg-surface-alt/70 rounded-2xl p-3.5 border border-border flex items-center justify-between">
            <div>
              <span className="text-caption font-semibold text-text-muted">Giá chốt niêm yết</span>
              <p className="text-title font-extrabold text-primary">
                {product.price.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-success-bg text-success text-caption font-bold flex items-center gap-1">
              <CheckCircle2 size={13} />
              <span>Hoa tươi loại 1</span>
            </span>
          </div>

          {/* Atomic Flower BOM (Cấu phần hoa) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-text font-bold text-caption uppercase tracking-wider">
              <Sparkles size={14} className="text-accent" />
              <span>Cấu phần hoa tuyển chọn (BOM)</span>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-3 space-y-2">
              {flowersList.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-text-muted text-caption">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
              {product.description && (
                <p className="text-caption text-text-muted pt-1 border-t border-border/60">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          {/* Size simulation */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-text font-bold text-caption uppercase tracking-wider">
              <Ruler size={14} className="text-info" />
              <span>Kích thước thiết kế ước tính</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-surface border border-border text-center">
                <span className="text-caption text-text-muted">Chiều cao tổng thể</span>
                <p className="text-body font-extrabold text-foreground mt-0.5">~55 – 65 cm</p>
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-border text-center">
                <span className="text-caption text-text-muted">Độ xòe tán hoa</span>
                <p className="text-body font-extrabold text-foreground mt-0.5">~40 – 50 cm</p>
              </div>
            </div>
          </div>

          {/* Commitments & Trust Signals */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-text font-bold text-caption uppercase tracking-wider">
              <ShieldCheck size={14} className="text-success" />
              <span>Cam kết & Đặc quyền từ Tiệm hoa</span>
            </div>
            <div className="bg-surface rounded-2xl border border-border divide-y divide-border/60">
              <div className="flex items-center gap-2.5 p-3">
                <Gift size={16} className="text-primary shrink-0" />
                <span className="text-caption text-text leading-snug">
                  Tặng kèm <strong>thiệp viết tay cao cấp</strong> & banner chúc mừng thiết kế riêng.
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <span className="text-caption text-text leading-snug">
                  <strong>Chụp ảnh sản phẩm thực tế</strong> gửi khách duyệt trước khi giao xe.
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3">
                <HeartHandshake size={16} className="text-accent shrink-0" />
                <span className="text-caption text-text leading-snug">
                  Cam kết đổi mới 100% nếu hoa bị héo dập trong quá trình vận chuyển.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA - Strictly "CHỌN MẪU NÀY" */}
        <div className="pt-3 border-t border-border shrink-0">
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={() => {
              onClose()
              onSelectProduct(product)
            }}
            className="w-full h-12 text-body font-extrabold gap-2 rounded-2xl shadow-lg bg-primary hover:bg-primary-dark text-white cursor-pointer"
          >
            <CheckCircle2 size={18} />
            <span>CHỌN MẪU NÀY · {product.price.toLocaleString("vi-VN")} đ</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
