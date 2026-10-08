"use client"

import React, { useState } from "react"
import { HelpCircle, X, ExternalLink, BookOpen, CheckCircle2, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BrochureUserGuideModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-caption font-bold text-foreground hover:bg-surface-alt hover:text-primary transition-colors"
        title="Hướng dẫn sử dụng link đặt hoa"
      >
        <HelpCircle size={16} className="text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">Hướng dẫn link đặt hoa</span>
      </button>

      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-modal-title"
            className="bg-surface rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                <h2 id="guide-modal-title" className="text-title-sm font-extrabold text-foreground">
                  Hướng dẫn sử dụng Thẻ chào & Link đặt hoa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng hướng dẫn"
                className="text-text-muted hover:text-foreground p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nội dung theo từng vai trò */}
            <div className="flex flex-col gap-4 text-body-sm text-foreground">
              {/* Điều hành */}
              <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Shield size={16} />
                  <span>1. Dành cho Điều hành / Chủ tiệm</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-text-muted text-caption sm:text-body-sm">
                  <li>Cấu hình <strong>Hồ sơ cửa hàng</strong>: QR Zalo kết nối, tài khoản ngân hàng VietQR, và các chính sách ưu đãi/cam kết/thỏa thuận.</li>
                  <li>Duyệt thanh toán đơn: Khi khách báo đã chuyển khoản, kiểm tra biến động số dư và bấm <strong>Xác nhận tiền về</strong>.</li>
                  <li>Xử lý đề xuất hủy/hoàn tiền: Điều phối hoặc Sale gửi yêu cầu sẽ vào danh sách quyết định của Điều hành.</li>
                </ul>
              </div>

              {/* Sale */}
              <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-info font-bold">
                  <Users size={16} />
                  <span>2. Dành cho Nhân viên Bán hàng (Sale)</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-text-muted text-caption sm:text-body-sm">
                  <li>Tạo link từ <strong>Bộ sưu tập mẫu</strong>: Chọn mẫu hoặc gán theo nhu cầu khách rồi bấm <strong>Sao chép link gửi khách</strong>.</li>
                  <li>Theo dõi tương tác: Biết ngay khi khách mở link, thả tim mẫu hoa, hoặc bắt đầu điền form.</li>
                  <li>Đơn hàng tạo từ link bạn gửi sẽ tự động ghi nhận <strong>Mã nhân viên phụ trách</strong> của bạn.</li>
                </ul>
              </div>

              {/* Điều phối */}
              <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-success font-bold">
                  <CheckCircle2 size={16} />
                  <span>3. Dành cho Điều phối & Xưởng hoa</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-text-muted text-caption sm:text-body-sm">
                  <li>Sử dụng chế độ <strong>Kanban Điều phối</strong> để theo dõi các cột tiến trình: Chờ xử lý → Phân công florist → Cắm hoa → Chụp ảnh thành phẩm → Giao ship → Đã giao.</li>
                  <li>Chụp ảnh thành phẩm & nghiệm thu: Khách có thời gian đếm ngược trực tiếp trên link để duyệt ảnh trước khi ship.</li>
                  <li>Trường hợp khẩn cấp: Bấm <strong>Giao gấp — Bỏ qua ảnh</strong> để ưu tiên giao hoa đúng giờ cam kết cho khách.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="button" onClick={() => setOpen(false)} className="h-9 px-5">
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
