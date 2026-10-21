import type { Situation } from "./situation-types"

/** Link gửi khách, khách đang xem, đơn mới đặt. Mỗi câu đối chiếu với mã thật (17/10/2026). */
export const LINK_SITUATIONS = [
  {
    id: "LINK_CREATED_NOT_SENT",
    group: "LINK",
    title: "Đã tạo link — chưa gửi khách",
    recognize: "Link riêng đã tạo nhưng chưa ai bấm sao chép để gửi khách.",
    owners: ["SALE"],
    steps: {
      SALE: [{ do: "Sao chép link và gửi khách qua Zalo/Messenger. Link gắn tên bạn — đơn từ link tính cho bạn.", where: { tab: "sales", button: "Copy link" } }],
    },
    automation: "Khách không mở trong thời gian Điều hành đặt (mặc định 24 giờ từ lúc tạo) thì link tự thu hồi.",
    next: ["LINK_SENT_NOT_OPENED", "LINK_EXPIRED"],
  },
  {
    id: "LINK_SENT_NOT_OPENED",
    group: "LINK",
    title: "Đã gửi link — khách chưa mở",
    recognize: "Link đã được sao chép gửi đi, khách chưa mở.",
    owners: ["SALE"],
    steps: {
      SALE: [{ do: "Nhắc khách mở link (gọi, Zalo hoặc nhắn tin từ thẻ đơn ở tab Bán hàng)." }],
    },
    deadline: "Mặc định 5 phút sau khi gửi — quá hạn thì Hộp việc báo kẹt.",
    automation: "Chưa mở quá thời gian Điều hành đặt (mặc định 24 giờ) thì link tự thu hồi.",
    next: ["CUSTOMER_BROWSING", "LINK_EXPIRED"],
  },
  {
    id: "CUSTOMER_BROWSING",
    group: "LINK",
    title: "Khách đang xem / đã chọn mẫu nhưng chưa đặt",
    recognize: "Khách đã mở link, đang lướt mẫu hoặc đã chọn một mẫu mà chưa gửi đơn.",
    owners: ["SALE"],
    steps: {
      SALE: [
        { do: "Hỏi khách cần tư vấn mẫu nào, giải đáp giá, giờ giao." },
        { do: "Ghi tên (và SĐT) khách lên link để nhớ đã gửi cho ai.", where: { tab: "orderDetail", button: "Ghi tên khách" } },
      ],
    },
    deadline: "Mặc định 30 phút từ lúc khách mở link.",
    automation: "Khách bỏ dở quá thời gian Điều hành đặt (mặc định 12 giờ không thao tác) thì link tự thu hồi.",
    next: ["ORDER_PLACED_AWAITING_TRANSFER", "ORDER_AWAITING_QUOTE", "LINK_EXPIRED"],
  },
  {
    id: "LINK_EXPIRED",
    group: "LINK",
    title: "Link hết hạn hoặc đã thu hồi",
    recognize: "Thẻ ghi \"Hết hạn mở link\", \"Hết hạn chọn mẫu\" hoặc \"Tự huỷ: …\"; khách mở lại sẽ không vào được.",
    owners: [],
    informed: ["SALE"],
    steps: {
      SALE: [{ do: "Khách vẫn muốn mua: tạo link mới và gửi lại.", where: { tab: "sales", button: "Tạo Link Ngay" } }],
    },
    next: ["LINK_CREATED_NOT_SENT"],
    notes: ["Link đã hết hạn không mở lại được; chỉ link bị bỏ hiển thị mới khôi phục được."],
  },
  {
    id: "ORDER_UNASSIGNED_SALE",
    group: "ORDER_INTAKE",
    title: "Đơn mới chưa có Sale phụ trách",
    recognize: "Đơn đặt từ link chung không gắn Sale nào (và tiệm chưa có người phụ trách mặc định).",
    owners: ["SALE"],
    steps: {
      SALE: [
        { do: "Bấm nhận đơn ngay trong Hộp việc để ghi tên mình làm Sale phụ trách.", where: { tab: "inbox", button: "Nhận đơn" } },
        { do: "Mở đơn và liên hệ khách xác nhận thông tin." },
      ],
    },
    next: ["ORDER_PLACED_AWAITING_TRANSFER"],
    notes: [
      "Hai người bấm cùng lúc thì chỉ một người nhận được; người sau thấy báo \"Đơn đã có Sale khác nhận\".",
      "Sale chỉ xem khách của mình vẫn thấy và nhận được đơn chưa có ai phụ trách.",
    ],
  },
  {
    id: "ORDER_PLACED_AWAITING_TRANSFER",
    group: "ORDER_INTAKE",
    title: "Đã đặt đơn — chờ khách chuyển khoản",
    recognize: "Khách đã gửi đơn có giá, chưa báo chuyển khoản, đơn chưa thu đồng nào.",
    owners: ["SALE"],
    informed: ["ADMIN"],
    steps: {
      SALE: [{ do: "Nhắc khách quét mã QR chuyển khoản trên thẻ chào (gọi, Zalo hoặc nhắn tin) — tiền cọc hoặc trả đủ tuỳ đơn.", where: { tab: "inbox", button: "Nhắc chuyển khoản" } }],
      ADMIN: [{ do: "Tiền đã vào tài khoản dù khách chưa báo: ghi nhận ngay trên dòng đơn ở tab Điều hành (nút \"Thu tiền…\").", where: { tab: "operation" } }],
    },
    deadline: "Mặc định 15 phút — quá hạn Hộp việc của Sale báo kẹt.",
    automation: "Quá hạn giữ đơn: hệ thống nhắc khách một lần; tiệm bật tự huỷ hoặc hạn thanh toán thì đơn tự huỷ (khách đã báo chuyển khoản thì không huỷ).",
    next: ["FIRST_PAYMENT_REPORTED", "PAYMENT_TIMEOUT_CANCELLED"],
  },
  {
    id: "ORDER_AWAITING_QUOTE",
    group: "ORDER_INTAKE",
    title: "Đơn chọn mẫu chưa niêm yết giá — chờ báo giá",
    recognize: "Khách đặt mẫu chưa có giá; tổng đơn bằng 0.",
    owners: ["ADMIN"],
    informed: ["SALE"],
    steps: {
      ADMIN: [{ do: "Nhập giá cho đơn — khách nhận báo giá và mã QR thanh toán.", where: { tab: "operation", button: "Báo giá" } }],
    },
    automation: "Sau khi báo giá, hạn giữ đơn tính từ lúc báo giá.",
    next: ["ORDER_PLACED_AWAITING_TRANSFER"],
    notes: ["Chưa báo giá thì không thu tiền, không xuất VAT, không xin giảm giá được."],
  },
  {
    id: "PAYMENT_TIMEOUT_CANCELLED",
    group: "ORDER_INTAKE",
    title: "Đơn tự huỷ vì quá hạn thanh toán",
    recognize: "Thẻ ghi \"Tự huỷ: Hết hạn thanh toán cọc\" — khách không chuyển khoản trong hạn tiệm đặt.",
    owners: [],
    informed: ["SALE", "ADMIN"],
    steps: {
      SALE: [{ do: "Khách vẫn muốn mua: tạo link mới. Khách báo đã chuyển khoản trễ: báo Điều hành kiểm tài khoản." }],
    },
    automation: "Tiền chuyển trễ vào tài khoản (nếu tiệm nối ngân hàng) hiện ở mục \"khoản tiền vào chưa khớp đơn\".",
    next: ["UNMATCHED_BANK_TRANSFER"],
  },
] as const satisfies readonly Situation[]
