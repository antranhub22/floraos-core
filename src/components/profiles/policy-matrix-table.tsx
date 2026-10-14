"use client"

import React from "react"
import {
  Sparkles,
  Truck,
  Users,
  Clock,
  AlertTriangle,
  Camera,
} from "lucide-react"
import {
  applyHolidayAutoPreset,
  type BrochurePaymentPolicy,
} from "@/modules/greeting-card/domain/brochure-payment-policy"
import { PolicyRow } from "./policy-row"

interface Props {
  policy: BrochurePaymentPolicy
  onChange: (patch: Partial<BrochurePaymentPolicy>) => void
  disabled?: boolean
}

export function PolicyMatrixTable({ policy, onChange, disabled }: Props) {
  const isHoliday = policy.holidayAutoMode === true
  const isPaidBeforeShip = policy.requireFullBeforeDispatch === true
  const isCoordinatorAllowed = policy.trackingTriggerPolicy !== "PAYMENT_ONLY"
  const isAutoApproveProof = policy.autoApprovePaymentWithProof === true
  const isAutoCancelUnpaid = (policy.paymentTimeoutMinutes ?? 0) > 0
  const isProofRequired = policy.requirePaymentProof !== false
  const isQCRequired = policy.requireProductPhotoQC !== false
  const isRecipientPhotoRequired = policy.requireRecipientPhoto !== false

  const handleToggleHoliday = (enable: boolean) => {
    onChange(applyHolidayAutoPreset(policy, enable))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Banner chế độ cao điểm nếu đang bật */}
      {isHoliday && (
        <div className="p-3.5 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-between gap-3 text-body-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary shrink-0 animate-pulse" />
            <div>
              <span className="font-extrabold text-foreground">ĐANG BẬT: CHẾ ĐỘ AUTO NGÀY LỄ / CAO ĐIỂM</span>
              <p className="text-caption text-text-muted mt-0.5">
                Các quy tắc kiểm duyệt đã tự động được nới lỏng và tối ưu để xưởng xuất hoa nhanh nhất, chống nghẽn luồng.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleToggleHoliday(false)}
            className="px-3 py-1.5 rounded-xl border border-border bg-surface text-caption font-bold text-foreground hover:bg-surface-muted transition-colors shrink-0"
          >
            Tắt chế độ cao điểm
          </button>
        </div>
      )}

      {/* Bảng ma trận Chính sách & Cam kết */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-caption font-extrabold text-foreground uppercase tracking-wider">
                <th scope="col" className="py-3 px-4">Hạng mục chính sách & Quy tắc vận hành</th>
                <th scope="col" className="py-3 px-3 text-center w-28">Bật</th>
                <th scope="col" className="py-3 px-3 text-center w-28">Tắt</th>
                <th scope="col" className="py-3 px-4 text-left w-52 sm:w-64">Cấu hình chi tiết / SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-body-sm">
              {/* 1. AUTO NGÀY LỄ */}
              <PolicyRow
                icon={<Sparkles size={17} className="text-primary" />}
                title="Chế độ AUTO Ngày Lễ / Cao điểm"
                badge="Tự động 1-chạm"
                description="Tự động kích hoạt toàn bộ cơ chế giải phóng đơn, ủy quyền cho Điều phối và bỏ chặn chụp ảnh khi cao điểm."
                isOn={isHoliday}
                onToggle={handleToggleHoliday}
                statusText={isHoliday ? "Đang áp dụng bộ quy tắc cao điểm" : "Đang áp dụng tiêu chuẩn ngày thường"}
                highlight={isHoliday}
                disabled={disabled}
              />

              {/* 2. THU ĐỦ 100% TIỀN TRƯỚC KHI GIAO */}
              <PolicyRow
                icon={<Truck size={17} className="text-foreground" />}
                title="Bắt buộc thu đủ 100% trước khi Giao Ship"
                description="Đơn đặt cọc bắt buộc phải thanh toán nốt phần còn lại (Lần 2) trước khi tài xế xuất giao hoa."
                isOn={isPaidBeforeShip}
                onToggle={(val) => onChange({ requireFullBeforeDispatch: val })}
                statusText={isPaidBeforeShip ? "Khóa nút Giao nếu còn nợ tiền" : "Cho phép giao cọc, thu sau"}
                disabled={disabled}
              />

              {/* 3. ĐIỀU PHỐI ĐƯỢC DUYỆT BILL & XÁC NHẬN */}
              <PolicyRow
                icon={<Users size={17} className="text-foreground" />}
                title="Cho phép Điều phối duyệt bill & nhận đơn"
                description="Khi thấy ảnh bill khách gửi, Điều phối được phép bấm xác nhận (cả cọc và lần 2) để đơn vào xưởng ngay."
                isOn={isCoordinatorAllowed}
                onToggle={(val) =>
                  onChange({
                    trackingTriggerPolicy: val ? "PAYMENT_OR_COORDINATOR" : "PAYMENT_ONLY",
                    balancePaymentTriggerPolicy: val ? "PAYMENT_OR_COORDINATOR" : "PAYMENT_ONLY",
                  })
                }
                statusText={isCoordinatorAllowed ? "Điều hành HOẶC Điều phối" : "Chỉ Điều hành (người giữ TK)"}
                disabled={disabled}
              />

              {/* 4. TỰ ĐỘNG DUYỆT BILL SAU 15 PHÚT */}
              <PolicyRow
                icon={<Clock size={17} className="text-foreground" />}
                title="Tự động duyệt thanh toán khi có ảnh chụp bill"
                description="Bill khách tải lên khớp đúng tài khoản và số tiền mà quá thời gian chọn chưa ai bấm duyệt, hệ thống tự xác nhận để đơn vào cắm hoa kịp giờ. Bill lệch hoặc không đọc được luôn chờ người duyệt."
                isOn={isAutoApproveProof}
                onToggle={(val) => onChange({ autoApprovePaymentWithProof: val })}
                extraControl={
                  <select
                    disabled={disabled || !isAutoApproveProof}
                    value={policy.autoApprovePaymentWithProofMinutes ?? 15}
                    onChange={(e) => onChange({ autoApprovePaymentWithProofMinutes: Number(e.target.value) })}
                    className="h-8 px-2 rounded-lg border border-border bg-background text-caption disabled:opacity-50"
                  >
                    <option value={10}>10 phút</option>
                    <option value={15}>15 phút (Chuẩn)</option>
                    <option value={30}>30 phút</option>
                  </select>
                }
                disabled={disabled}
              />

              {/* 5. TỰ ĐỘNG HỦY & HOÀN TIỀN KHI ĐIỀU PHỐI TỪ CHỐI */}
              <PolicyRow
                icon={<AlertTriangle size={17} className="text-warning" />}
                title="Tự động hủy & hoàn tiền khi Điều phối từ chối (SLA)"
                description="Khi xưởng hết hoa/quá tải, Điều phối báo từ chối. Quá thời gian quy định sẽ tự hủy & tạo lệnh hoàn tiền."
                isOn={Boolean(policy.cancellationApprovalTimeoutMinutes && policy.cancellationApprovalTimeoutMinutes <= 120)}
                onToggle={(val) => onChange({ cancellationApprovalTimeoutMinutes: val ? 30 : 1440 })}
                extraControl={
                  <select
                    disabled={disabled}
                    value={policy.cancellationApprovalTimeoutMinutes ?? 15}
                    onChange={(e) => onChange({ cancellationApprovalTimeoutMinutes: Number(e.target.value) })}
                    className="h-8 px-2 rounded-lg border border-border bg-background text-caption"
                  >
                    <option value={5}>5 phút</option>
                    <option value={10}>10 phút</option>
                    <option value={15}>15 phút (Ngày thường)</option>
                    <option value={30}>30 phút (Cao điểm)</option>
                    <option value={60}>60 phút</option>
                  </select>
                }
                disabled={disabled}
              />

              {/* 6. HẠN THANH TOÁN GIỮ ĐƠN */}
              <PolicyRow
                icon={<Clock size={17} className="text-foreground" />}
                title="Hạn thanh toán giữ đơn (Tự hủy đơn nháp)"
                description="Hết giờ mà khách chưa chuyển khoản ➔ Đơn tự hủy để giải phóng nguyên liệu hoa cho khách khác."
                isOn={isAutoCancelUnpaid}
                onToggle={(val) => onChange({ paymentTimeoutMinutes: val ? 30 : 0, autoCancelUnpaid: val })}
                extraControl={
                  <select
                    disabled={disabled || !isAutoCancelUnpaid}
                    value={policy.paymentTimeoutMinutes || 30}
                    onChange={(e) => onChange({ paymentTimeoutMinutes: Number(e.target.value) })}
                    className="h-8 px-2 rounded-lg border border-border bg-background text-caption disabled:opacity-50"
                  >
                    <option value={15}>15 phút</option>
                    <option value={30}>30 phút (Chuẩn)</option>
                    <option value={45}>45 phút</option>
                    <option value={60}>60 phút</option>
                  </select>
                }
                disabled={disabled}
              />

              {/* 7. BẮT BUỘC KHÁCH TẢI ẢNH BILL */}
              <PolicyRow
                icon={<Camera size={17} className="text-foreground" />}
                title="Bắt buộc khách tải ảnh chụp bill chuyển khoản"
                description="Khách bắt buộc phải tải ảnh bill giao dịch thành công mới bấm được nút 'Tôi đã chuyển khoản'."
                isOn={isProofRequired}
                onToggle={(val) => onChange({ requirePaymentProof: val })}
                statusText={isProofRequired ? "Khuyên dùng BẬT để chống bill ảo" : "Cho phép báo chuyển không ảnh"}
                disabled={disabled}
              />

              {/* 8. ẢNH THÀNH PHẨM QC */}
              <PolicyRow
                icon={<Camera size={17} className="text-foreground" />}
                title="Bắt buộc ảnh hoa thành phẩm (QC) trước khi Giao"
                description="Thợ cắm hoa phải tải ảnh QC lên hệ thống mới mở nút Giao Ship. Tắt = không chặn xuất giao."
                isOn={isQCRequired}
                onToggle={(val) => onChange({ requireProductPhotoQC: val })}
                statusText={isQCRequired ? "Kiểm định hoa chặt chẽ" : "Tự do giao (Thợ vẫn có thể tải ảnh)"}
                disabled={disabled}
              />

              {/* 9. ĐẾM NGƯỢC DUYỆT ẢNH HOA THÀNH PHẨM */}
              <PolicyRow
                icon={<Clock size={17} className="text-foreground" />}
                title="Đếm ngược duyệt ảnh hoa thành phẩm (SLA)"
                description="Khách xem ảnh trên link theo dõi. Hết thời gian đếm ngược sẽ tự động duyệt để kịp giờ bàn giao tài xế."
                isOn={(policy.productPhotoReviewMinutes ?? 10) > 0}
                onToggle={(val) => onChange({ productPhotoReviewMinutes: val ? 10 : 0 })}
                extraControl={
                  <select
                    disabled={disabled || (policy.productPhotoReviewMinutes ?? 10) === 0}
                    value={policy.productPhotoReviewMinutes || 10}
                    onChange={(e) => onChange({ productPhotoReviewMinutes: Number(e.target.value) })}
                    className="h-8 px-2 rounded-lg border border-border bg-background text-caption disabled:opacity-50"
                  >
                    <option value={5}>5 phút</option>
                    <option value={10}>10 phút (Chuẩn)</option>
                    <option value={15}>15 phút</option>
                    <option value={20}>20 phút</option>
                  </select>
                }
                disabled={disabled}
              />

              {/* 10. ẢNH NGƯỜI NHẬN HOA */}
              <PolicyRow
                icon={<Camera size={17} className="text-foreground" />}
                title="Bắt buộc ảnh người nhận hoa lúc giao thành công"
                description="Shipper phải chụp ảnh người nhận mới bấm Hoàn tất. Tắt = cho phép bấm Hoàn tất trực tiếp."
                isOn={isRecipientPhotoRequired}
                onToggle={(val) => onChange({ requireRecipientPhoto: val })}
                statusText={isRecipientPhotoRequired ? "Bảo đảm bằng chứng giao" : "Tự do hoàn tất (Shipper vẫn chụp được)"}
                disabled={disabled}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
