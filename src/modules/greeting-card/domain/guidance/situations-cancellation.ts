import type { Situation } from "./situation-types"

/** Huỷ đơn, hoàn tiền, bỏ hiển thị. Mỗi câu đối chiếu với mã thật (17/10/2026). */
export const CANCELLATION_SITUATIONS = [
  {
    id: "CANCELLATION_PROPOSAL_PENDING",
    group: "CANCELLATION",
    title: "Đề xuất huỷ / hoàn tiền chờ duyệt",
    recognize: "Sale hoặc Điều phối đã gửi đề xuất huỷ đơn, huỷ và hoàn toàn bộ, hoặc hoàn một phần; Điều hành chưa quyết.",
    owners: ["ADMIN"],
    informed: ["SALE", "COORDINATOR"],
    steps: {
      ADMIN: [
        { do: "Đọc lý do, xem đơn đã thu bao nhiêu rồi phê duyệt hoặc từ chối. Phê duyệt chỉ đổi trạng thái đơn — tiền hoàn chuyển ở bước riêng.", where: { tab: "operation", button: "Phê duyệt" } },
        { do: "Không đồng ý thì từ chối và ghi lý do để người đề xuất biết.", where: { tab: "operation", button: "Từ chối" } },
      ],
    },
    deadline: "Đề xuất của Điều phối: hệ thống tự duyệt sau thời gian Điều hành đặt trong Cài đặt (mặc định 15 phút). Đề xuất của Sale: không có hạn.",
    automation: "Đơn đang giao không tự duyệt — cần Điều hành hoặc một Điều phối khác duyệt. Người đề xuất nhận tin kết quả.",
    next: ["CANCELLATION_REFUND_DUE", "CANCELLATION_AUTO_APPROVED", "SALE_CANCELLATION_REMINDER"],
    notes: [
      "Đơn đang giao: Điều phối có quyền giao hàng duyệt được ở tab Điều phối, nhưng không tự duyệt đề xuất của chính mình.",
      "Hoàn một phần chỉ Điều hành duyệt.",
    ],
  },
  {
    id: "CANCELLATION_PROPOSE",
    group: "CANCELLATION",
    title: "Cần huỷ hoặc hoàn tiền một đơn",
    recognize: "Khách đổi ý, tiệm không làm được, hoặc khách chọn \"Huỷ đơn\" khi được đề xuất mẫu khác. Đơn chưa giao xong và thợ chưa bắt đầu cắm.",
    owners: ["SALE", "COORDINATOR"],
    steps: {
      SALE: [{ do: "Mở chi tiết đơn, gửi đề xuất kèm lý do cho Điều hành duyệt.", where: { tab: "orderDetail", button: "Đề xuất Hủy / Hoàn tiền đơn này" } }],
      COORDINATOR: [{ do: "Trên thẻ đơn ở tab Điều phối (hoặc chi tiết đơn), gửi đề xuất kèm lý do.", where: { tab: "coordination", button: "Đề xuất Hủy / Hoàn tiền đơn này" } }],
      ADMIN: [{ do: "Điều hành huỷ thẳng từ sổ thu (biểu tượng huỷ trên dòng đơn) — không cần đề xuất.", where: { tab: "operation", button: "Huỷ đơn hàng" } }],
    },
    next: ["CANCELLATION_PROPOSAL_PENDING", "LEDGER_DIRECT_CANCEL"],
    notes: [
      "Không đề xuất được khi đơn đã huỷ, đã giao xong, hoặc thợ đang cắm.",
      "Hoàn tiền chỉ chọn được khi đơn đã thu tiền; hoàn một phần phải nhỏ hơn số đã thu.",
    ],
  },
  {
    id: "COORDINATOR_REJECTS_ORDER",
    group: "CANCELLATION",
    title: "Điều phối không nhận được đơn",
    recognize: "Đơn đã thu tiền (hoặc khách đã gửi bill) đang chờ Điều phối nhận, nhưng tiệm không làm được (hết hoa, quá tải…).",
    owners: ["COORDINATOR"],
    steps: {
      COORDINATOR: [{ do: "Bấm từ chối, chọn hoặc ghi lý do — hệ thống gửi đề xuất huỷ (có hoàn tiền nếu đã thu) cho Điều hành.", where: { tab: "coordination", button: "Từ chối (Hoàn tiền)" } }],
    },
    deadline: "Quyết trong thời gian chuẩn bước \"Xác nhận tiền về\" (mặc định 30 phút).",
    next: ["CANCELLATION_PROPOSAL_PENDING"],
  },
  {
    id: "CANCELLATION_AUTO_APPROVED",
    group: "CANCELLATION",
    title: "Đơn tự huỷ vì Điều hành không duyệt kịp",
    recognize: "Đề xuất huỷ của Điều phối quá thời gian duyệt — hệ thống đã tự huỷ đơn và báo Điều hành.",
    owners: ["ADMIN"],
    informed: ["SALE"],
    steps: {
      ADMIN: [{ do: "Xử lý việc \"Cần hoàn tiền\" / \"Đơn tự huỷ — cần liên hệ khách\" trong Hộp việc.", where: { tab: "inbox" } }],
    },
    automation: "Hệ thống kiểm mỗi phút; đơn đang giao hoặc đã giao không tự huỷ.",
    next: ["CANCELLATION_REFUND_DUE", "SALE_CANCELLATION_REMINDER"],
  },
  {
    id: "CANCELLATION_REFUND_DUE",
    group: "CANCELLATION",
    title: "Cần hoàn tiền / liên hệ khách sau khi huỷ",
    recognize: "Đề xuất huỷ đã duyệt (hoặc tự duyệt) và còn tiền phải hoàn, hoặc đơn tự huỷ cần báo khách.",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [
        { do: "Chuyển khoản hoàn cho khách, ghi mã giao dịch vào ô ghi chú rồi xác nhận ngay trong Hộp việc — sổ thu ghi khoản hoàn lúc này.", where: { tab: "inbox", button: "Đã hoàn tiền cho khách" } },
        { do: "Không có tiền phải hoàn: gọi báo khách rồi đánh dấu xong.", where: { tab: "inbox", button: "Đã xử lý xong" } },
      ],
    },
    deadline: "Khách được hứa liên hệ (và hoàn tiền) trong 2 tiếng kể từ lúc duyệt huỷ — khi đơn bị Điều phối huỷ.",
    next: [],
    notes: ["Trong lúc chờ, sổ thu không cho bấm \"Hoàn tiền\" trên đơn này để tránh hoàn hai lần."],
  },
  {
    id: "SALE_CANCELLATION_REMINDER",
    group: "CANCELLATION",
    title: "Sale báo khách: đơn bị Điều phối huỷ",
    recognize: "Sale nhận tin hệ thống \"Đơn #… đã bị Điều phối huỷ (đã được duyệt)\" trong Hộp việc → Tin nhắn.",
    owners: ["SALE"],
    informed: ["ADMIN"],
    steps: {
      SALE: [{ do: "Gọi hoặc nhắn khách báo đơn bị huỷ. Khách đã chuyển tiền thì báo Điều hành hoàn — Sale không tự ghi hoàn.", where: { tab: "inbox" } }],
    },
    deadline: "Trong 2 tiếng kể từ lúc duyệt huỷ (giờ cụ thể ghi trong tin).",
    automation: "Thẻ chào của khách tự hiện thông báo huỷ và hạn liên hệ.",
    next: ["CANCELLATION_REFUND_DUE"],
  },
  {
    id: "CANCELLED_REPORTED_PAYMENT",
    group: "CANCELLATION",
    title: "Đơn đã huỷ nhưng khách báo đã chuyển khoản",
    recognize: "Đơn bị huỷ khi khách đã báo chuyển khoản (hoặc gửi bill) mà tiệm chưa ghi nhận đồng nào — sổ thu 0 đ nên không có việc hoàn tiền thường.",
    owners: ["ADMIN"],
    informed: ["SALE"],
    steps: {
      ADMIN: [
        { do: "Mở ảnh bill, kiểm sao kê. Đã nhận tiền thì chuyển hoàn cho khách, nhập số tiền đã hoàn rồi xác nhận ngay trong Hộp việc — sổ thu ghi cả khoản vào lẫn khoản hoàn.", where: { tab: "inbox", button: "Đã hoàn tiền cho khách" } },
        { do: "Sao kê không có khoản này thì đóng việc.", where: { tab: "inbox", button: "Không nhận được tiền" } },
      ],
    },
    automation: "Việc tự hiện cho mọi đơn huỷ trong 60 ngày gần nhất có tình trạng này, tới khi Điều hành chốt.",
    next: [],
  },
  {
    id: "LEDGER_DIRECT_CANCEL",
    group: "CANCELLATION",
    title: "Điều hành huỷ đơn trực tiếp",
    recognize: "Điều hành cần huỷ một đơn chưa giao xong mà không qua đề xuất.",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [
        { do: "Ở sổ thu tab Điều hành, bấm biểu tượng huỷ trên dòng đơn, ghi lý do rồi xác nhận.", where: { tab: "operation", button: "Huỷ đơn hàng" } },
        { do: "Đơn đã thu tiền: huỷ không tự hoàn — chuyển khoản hoàn cho khách rồi ghi nhận trên dòng đơn.", where: { tab: "operation", button: "Hoàn tiền" } },
      ],
    },
    next: ["LEDGER_REFUND"],
    notes: ["Đơn đang giao phải xác nhận thêm cảnh báo trước khi huỷ."],
  },
  {
    id: "LEDGER_REFUND",
    group: "CANCELLATION",
    title: "Ghi nhận hoàn tiền trên sổ thu",
    recognize: "Đơn đã thu tiền, cần hoàn một phần hoặc toàn bộ, và không có khoản hoàn đang chờ ở Hộp việc.",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [{ do: "Chuyển khoản cho khách trước, rồi ghi số tiền và lý do hoàn trên dòng đơn.", where: { tab: "operation", button: "Hoàn tiền" } }],
    },
    next: [],
    notes: ["Số hoàn không vượt số đã thu. Trạng thái đơn không đổi."],
  },
  {
    id: "DISMISSAL_PENDING",
    group: "CANCELLATION",
    title: "Chờ duyệt bỏ hiển thị đơn/link chưa trả tiền",
    recognize: "Sale hoặc Điều phối đề xuất bỏ hiển thị một link hoặc đơn chưa trả đồng nào (khách đổi ý, chỉ hỏi giá, trùng…).",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [{ do: "Ở chế độ Kanban của tab Theo dõi đơn, xem lý do trên thẻ rồi duyệt hoặc từ chối.", where: { tab: "tracking", button: "Duyệt" } }],
      SALE: [{ do: "Đề xuất: bấm biểu tượng bỏ hiển thị trên thẻ đơn ở Kanban, chọn lý do.", where: { tab: "tracking", button: "Xác nhận bỏ hiển thị" } }],
      COORDINATOR: [{ do: "Đề xuất như Sale.", where: { tab: "tracking", button: "Xác nhận bỏ hiển thị" } }],
    },
    deadline: "5 phút — quá hạn hệ thống tự duyệt.",
    automation: "Duyệt xong: đơn chưa trả tiền chuyển Đã huỷ, link bị khoá.",
    next: ["DISMISSED_RESTORABLE"],
  },
  {
    id: "DISMISSED_RESTORABLE",
    group: "CANCELLATION",
    title: "Đã bỏ hiển thị — có thể khôi phục",
    recognize: "Link/đơn chưa trả tiền đã được bỏ hiển thị, nhưng khách quay lại muốn đặt.",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [{ do: "Bấm khôi phục trên thẻ ở Kanban tab Theo dõi đơn — đơn về trạng thái cũ, link mở lại 7 ngày.", where: { tab: "tracking", button: "Khôi phục" } }],
    },
    next: [],
  },
] as const satisfies readonly Situation[]
