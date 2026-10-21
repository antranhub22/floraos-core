import type { Situation } from "./situation-types"

/** Khách xin đổi thông tin, xin giảm giá, đơn kẹt quá giờ. Mỗi câu đối chiếu với mã thật (17/10/2026). */
export const CHANGE_SITUATIONS = [
  {
    id: "CUSTOMER_CHANGE_REQUEST_PENDING",
    group: "CHANGE",
    title: "Khách xin đổi thông tin đơn",
    recognize: "Khách gửi yêu cầu đổi giờ giao, người nhận, địa chỉ, lời chúc… từ thẻ chào (thợ chưa bắt đầu cắm, hoặc vừa giao không thành công).",
    owners: ["COORDINATOR", "ADMIN"],
    informed: ["SALE"],
    steps: {
      COORDINATOR: [
        { do: "Xem thay đổi và phí phát sinh ngay trong Hộp việc rồi đồng ý.", where: { tab: "inbox", button: "Đồng ý cập nhật" } },
        { do: "Không đổi được thì từ chối kèm lời nhắn cho khách.", where: { tab: "inbox", button: "Không đồng ý" } },
      ],
      ADMIN: [{ do: "Duyệt như Điều phối khi cần.", where: { tab: "inbox", button: "Đồng ý cập nhật" } }],
    },
    automation: "Duyệt xong khách thấy thông tin mới trên thẻ chào; Sale phụ trách nhận tin kết quả.",
    next: [],
    notes: ["Thợ đã bắt đầu cắm thì không duyệt được nữa — hãy từ chối và liên hệ khách."],
  },
  {
    id: "DISCOUNT_REQUEST_PENDING",
    group: "CHANGE",
    title: "Sale xin giảm giá cho đơn",
    recognize: "Sale gửi \"Xin giảm giá\" (phần trăm hoặc số tiền, kèm lý do) trong trao đổi của đơn.",
    owners: ["ADMIN"],
    informed: ["SALE"],
    steps: {
      ADMIN: [{ do: "Chọn duyệt như xin, duyệt mức khác hoặc không duyệt (bắt buộc ghi chú) rồi xác nhận ngay trong Hộp việc.", where: { tab: "inbox", button: "Xác nhận duyệt" } }],
      SALE: [{ do: "Gửi yêu cầu: mở \"Nhắn tin\" của đơn, bật \"Xin giảm giá\", ghi lý do.", where: { tab: "orderDetail", button: "Gửi Điều hành duyệt" } }],
    },
    next: [],
    notes: ["Mức giảm không vượt trần Điều hành đặt (mặc định 25%) và không làm tổng nhỏ hơn số đã thu."],
  },
  {
    id: "VAT_INVOICE_REQUEST",
    group: "CHANGE",
    title: "Khách cần hoá đơn VAT",
    recognize: "Khách xin xuất hoá đơn; đơn chưa huỷ, chưa hoàn tất và đã có giá.",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [{ do: "Mở chi tiết đơn, nhập thông tin công ty, chọn thuế suất rồi lưu — tổng đơn tự tính lại.", where: { tab: "orderDetail", button: "Lưu hoá đơn VAT" } }],
    },
    next: [],
    notes: ["Đổi VAT sau khi khách đã gửi bill: đối chiếu tay vì số tiền khách chuyển sẽ lệch tổng mới."],
  },
  {
    id: "STEP_STUCK",
    group: "ORDER_INTAKE",
    title: "Đơn kẹt quá thời gian chuẩn của bước",
    recognize: "Hộp việc hiện \"<việc cần làm> — quá N phút\"; thẻ đơn có viền đỏ \"Quá hạn\".",
    owners: ["SALE", "ADMIN", "COORDINATOR"],
    steps: {
      SALE: [{ do: "Bước của Sale (khách chưa mở link, chưa đặt, chưa chuyển khoản): liên hệ khách ngay.", where: { tab: "inbox", button: "Xử lý" } }],
      ADMIN: [{ do: "Bước của Điều hành (khách đã báo chuyển khoản): kiểm tài khoản và xác nhận tiền.", where: { tab: "inbox", button: "Xử lý" } }],
      COORDINATOR: [{ do: "Bước của Điều phối (nhận đơn, cắm, giao ship, đang giao): làm ngay việc ghi trong tin.", where: { tab: "inbox", button: "Xử lý" } }],
    },
    deadline: "Thời gian chuẩn từng bước do Điều hành đặt trong Cài đặt (bật/tắt từng bước).",
    next: [],
  },
] as const satisfies readonly Situation[]
