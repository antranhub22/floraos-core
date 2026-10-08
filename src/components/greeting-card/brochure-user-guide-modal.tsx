"use client"

import React, { useState } from "react"
import { HelpCircle, X, BookOpen, CheckCircle2, Shield, Users, Sparkles, Clock, AlertTriangle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

type RoleGuideTab = "admin" | "sales" | "coordinator"

export function BrochureUserGuideModal() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<RoleGuideTab>("admin")

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
            className="bg-surface rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                <h2 id="guide-modal-title" className="text-title-sm font-extrabold text-foreground">
                  Cẩm nang nghiệp vụ Thẻ Chào & Link Đặt Hoa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng hướng dẫn"
                className="text-text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-surface-alt"
              >
                <X size={20} />
              </button>
            </header>

            {/* Role Tabs */}
            <div className="flex border-b border-border bg-surface-alt px-5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-body-sm font-bold transition-colors ${
                  activeTab === "admin"
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-foreground"
                }`}
              >
                <Shield size={16} />
                <span>Điều hành / Chủ tiệm</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sales")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-body-sm font-bold transition-colors ${
                  activeTab === "sales"
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-foreground"
                }`}
              >
                <Users size={16} />
                <span>Bán hàng (Sale)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("coordinator")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-body-sm font-bold transition-colors ${
                  activeTab === "coordinator"
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-foreground"
                }`}
              >
                <Sparkles size={16} />
                <span>Điều phối & Xưởng</span>
              </button>
            </div>

            {/* Nội dung chi tiết theo tab */}
            <div className="flex-1 overflow-y-auto p-5 text-body-sm text-foreground space-y-4">
              {activeTab === "admin" && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-1.5">
                    <h4 className="font-extrabold text-primary flex items-center gap-1.5">
                      <Shield size={16} /> Quản trị tài chính & Kiểm soát thanh toán
                    </h4>
                    <p className="text-caption text-text-muted leading-relaxed">
                      Cổng thanh toán là chốt chặn cứng: Khi khách gửi đơn và báo chuyển khoản, nút &quot;Theo dõi tiến độ&quot; trên màn hình khách sẽ ở trạng thái vô hiệu hóa (deactivated). Chỉ khi Điều hành kiểm tra tài khoản và bấm <strong>&quot;Xác nhận tiền về&quot;</strong>, nút này mới được kích hoạt sáng lên cho khách.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
                    <h4 className="font-extrabold text-foreground">Quy trình Điều hành cần nắm:</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-caption sm:text-body-sm text-text-muted">
                      <li><strong>Duyệt thanh toán tiền về:</strong> Vào tab Điều hành để đối soát các đơn khách báo chuyển khoản. Bấm xác nhận để đơn tự động chuyển vào hàng đợi cắm hoa của xưởng.</li>
                      <li><strong>Xử lý đề xuất Hủy / Hoàn tiền:</strong> Sale hoặc Điều phối chỉ có quyền đề xuất; Điều hành là người quyết định cuối cùng (Approve/Reject). Hệ thống lưu vết đầy đủ lý do và người duyệt.</li>
                      <li><strong>Giải quyết tranh chấp nhờ Sơ đồ Milestones:</strong> Nhấp vào bất kỳ đơn hàng nào để mở Pop-up chi tiết → chọn tab <em>&quot;Sơ đồ Lịch sử Milestones&quot;</em>. Tại đây có đủ timestamp khách chọn mẫu, chấp nhận thỏa thuận, ảnh thành phẩm khách duyệt, ảnh giao hoa tận tay. Bấm <em>&quot;Sao chép tóm tắt đối soát&quot;</em> để gửi khách qua Zalo.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "sales" && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-info/20 bg-info-bg/10 p-4 flex flex-col gap-1.5">
                    <h4 className="font-extrabold text-info flex items-center gap-1.5">
                      <Users size={16} /> Quy trình Sale & Theo dõi khách hàng 9 bước
                    </h4>
                    <p className="text-caption text-text-muted leading-relaxed">
                      Bảng Kanban của Sale đồng bộ 100% với 9 bước chuẩn của tab Theo dõi tiến độ. Mọi link chào do bạn sao chép gửi khách sẽ tự động gắn <strong>Mã nhân viên phụ trách</strong> của bạn để tính hoa hồng doanh số.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
                    <h4 className="font-extrabold text-foreground">Kỹ năng vận hành cho Sale:</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-caption sm:text-body-sm text-text-muted">
                      <li><strong>Xem nhanh mốc giờ giao hàng:</strong> Mỗi thẻ đơn trên Kanban hiển thị khung giờ giao to, đậm (ví dụ: <em>10:00 - 12:00</em>) và được sắp xếp ưu tiên đơn giao sớm nhất lên đầu để bạn dễ theo sát.</li>
                      <li><strong>Click vào thẻ đơn để xem toàn bộ thông tin:</strong> Xem người đặt, người nhận, số điện thoại, địa chỉ cụ thể, lời chúc thiệp mừng và mẫu hoa đã chọn mà không cần hỏi lại khách.</li>
                      <li><strong>Chủ động gỡ kẹt:</strong> Thẻ có huy hiệu đỏ &quot;Cần bạn&quot; (khách mở link chưa chọn, bỏ dở điền form, chưa chuyển khoản) cần bạn bấm nút <em>Gọi</em> hoặc <em>Zalo</em> ngay trên thẻ để hỗ trợ khách kịp thời.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "coordinator" && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-success/20 bg-success-bg/10 p-4 flex flex-col gap-1.5">
                    <h4 className="font-extrabold text-success flex items-center gap-1.5">
                      <Sparkles size={16} /> Vận hành xưởng hoa & Nghiệm thu chất lượng
                    </h4>
                    <p className="text-caption text-text-muted leading-relaxed">
                      Bảng Kanban Điều phối phân nhóm 6 cột công đoạn xưởng, tự động sắp xếp đơn có giờ giao sớm nhất lên đầu để thợ ưu tiên hoàn thiện kịp hẹn cho khách.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
                    <h4 className="font-extrabold text-foreground">Quy trình xưởng & Bàn giao:</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-caption sm:text-body-sm text-text-muted">
                      <li><strong>Xem chi tiết công thức cắm hoa:</strong> Click vào thẻ đơn hàng trên Kanban để xem ảnh mẫu hoa to rõ, ghi chú đơn và lời chúc thiệp để chuẩn bị đúng kích thước và phụ kiện.</li>
                      <li><strong>Nghiệm thu ảnh & Đồng hồ đếm ngược:</strong> Khi hoa cắm xong, tải ảnh hoa thành phẩm lên hệ thống. Khách có 10 phút đếm ngược trực tiếp trên link để duyệt ảnh. Hết 10 phút hệ thống tự động xác nhận để bạn bàn giao cho shipper kịp giờ.</li>
                      <li><strong>Xử lý khẩn cấp (Giao gấp):</strong> Trường hợp khách cần gấp hoặc sự kiện diễn ra ngay, Điều phối có thể bấm <em>&quot;Bỏ qua ảnh&quot;</em> để chuyển thẳng sang giao hàng. Hệ thống sẽ ghi nhận trạng thái &quot;Skipped&quot; minh bạch.</li>
                      <li><strong>Hoàn tất & Màn hình Cảm ơn:</strong> Khi shipper giao hoa thành công và tải ảnh người nhận, đơn chuyển sang trạng thái Hoàn tất. Khách hàng sẽ thấy Màn hình Cảm ơn với các nút Xem lại đơn, Xem bằng chứng tiến độ và Đặt đơn mới.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-between border-t border-border bg-surface-alt p-4">
              <span className="text-caption text-text-muted">
                Hệ thống Thẻ Chào Mẫu Hoa · Chuẩn hóa quy trình FloraOS
              </span>
              <Button type="button" onClick={() => setOpen(false)} className="h-9 px-5 text-caption font-bold">
                Đã hiểu
              </Button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
