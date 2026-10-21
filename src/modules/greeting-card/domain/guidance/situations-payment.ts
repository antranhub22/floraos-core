import type { Situation } from "./situation-types"

/** Thanh toán lần 1, cọc, lần 2, nợ sau giao, tiền vào chưa khớp. Mỗi câu đối chiếu với mã thật (17/10/2026). */
export const PAYMENT_SITUATIONS = [
  {
    id: "FIRST_PAYMENT_REPORTED",
    group: "PAYMENT",
    title: "Khách báo đã chuyển khoản — chờ xác nhận tiền",
    recognize: "Khách bấm \"Tôi đã chuyển khoản\" (thường kèm ảnh bill), đơn chưa ghi nhận đồng nào. Lọc \"Khách báo đã chuyển\" ở tab Điều hành.",
    owners: ["ADMIN"],
    informed: ["COORDINATOR", "SALE"],
    steps: {
      ADMIN: [
        { do: "Mở ảnh bill, đối chiếu sao kê ngân hàng (số tiền, tài khoản nhận, nội dung chuyển khoản) rồi bấm \"Phê duyệt…\" trên dòng đơn.", where: { tab: "operation" } },
        { do: "Sao kê không có khoản này: báo khách chưa nhận được tiền — khách được nhắc chuyển lại.", where: { tab: "operation", button: "Chưa nhận được tiền" } },
      ],
      COORDINATOR: [{ do: "Có thể nhận đơn trước khi Điều hành xác nhận tiền (xem tình huống \"Đơn chờ Điều phối nhận\")." }],
    },
    deadline: "Mặc định 15 phút.",
    automation: "Tiệm bật \"AI đọc bill\" và \"tự duyệt bill khớp\": bill khớp 100% được tự xác nhận sau 15 phút. Nhãn bill: Khớp bill / Thiếu–Thừa / Sai STK nhận / Bill nghi vấn / Ảnh mờ; chưa có kết quả đọc tự động thì đối chiếu tay.",
    next: ["DEPOSIT_PAID_WAITING_PRODUCTION", "ORDER_AWAITING_ACCEPT", "COORDINATOR_DEPOSIT_APPROVAL", "ORDER_PLACED_AWAITING_TRANSFER"],
    notes: ["Báo \"Chưa nhận được tiền\" cho khách thêm một hạn thanh toán mới đủ số phút tiệm cài, tính từ lúc báo — quá hạn mới mà vẫn chưa có tiền thì đơn tự huỷ."],
  },
  {
    id: "DEPOSIT_PENDING_ADMIN_APPROVAL",
    group: "PAYMENT",
    title: "Điều phối đã nhận đơn — Điều hành chưa ghi nhận tiền",
    recognize: "Thẻ đơn ghi \"Đơn do Điều phối xác nhận – Điều hành chưa duyệt đã nhận tiền\".",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [{ do: "Đối chiếu sao kê rồi phê duyệt khoản khách đã chuyển trên dòng đơn (lọc \"Khách báo đã chuyển\").", where: { tab: "operation" } }],
    },
    next: ["DEPOSIT_PAID_WAITING_PRODUCTION"],
    notes: ["Việc này chưa hiện trong Hộp việc của Điều hành — cần vào tab Điều hành để thấy."],
  },
  {
    id: "COORDINATOR_DEPOSIT_APPROVAL",
    group: "PAYMENT",
    title: "Điều phối được tự duyệt tiền cọc",
    recognize: "Khách đã gửi bill cọc và tiệm cho Điều phối duyệt cọc (đơn hoả tốc, tiệm không bắt Điều hành duyệt, hoặc đã quá hạn và cho phép uỷ quyền).",
    owners: ["COORDINATOR"],
    steps: {
      COORDINATOR: [{ do: "Xem bill, kiểm tiền về rồi xác nhận ngay trên thẻ đơn.", where: { tab: "coordination", button: "Xác nhận Tiền Cọc Đợt 1" } }],
    },
    next: ["ORDER_AWAITING_ACCEPT"],
  },
  {
    id: "DEPOSIT_PAID_WAITING_PRODUCTION",
    group: "PAYMENT",
    title: "Đã thu tiền (cọc hoặc đủ) — đơn vào xưởng",
    recognize: "Đơn đã ghi nhận tiền lần 1; dòng đơn ghi \"Đã cọc · Chờ hoa xong\", \"Đã cọc · Thu sau giao\" hoặc \"Đã thu đủ\".",
    owners: [],
    informed: ["COORDINATOR", "SALE"],
    steps: {},
    automation: "Khách được báo đã nhận tiền; đơn chờ Điều phối nhận và cắm.",
    next: ["ORDER_AWAITING_ACCEPT", "SECOND_PAYMENT_DUE"],
  },
  {
    id: "SECOND_PAYMENT_DUE",
    group: "PAYMENT",
    title: "Hoa xong — chờ khách trả phần còn lại",
    recognize: "Đơn đặt cọc, hoa đã xong, khách chưa báo chuyển phần còn lại. Nút giao ship của Điều phối ghi \"Chờ TT lần 2\".",
    owners: ["SALE"],
    informed: ["COORDINATOR", "ADMIN"],
    steps: {
      SALE: [{ do: "Gửi ảnh hoa và nhắc khách chuyển phần còn lại.", where: { tab: "inbox", button: "Nhắc thanh toán" } }],
      COORDINATOR: [{ do: "Chép tin nhắc gửi khách nếu cần; chờ tiền về mới giao ship.", where: { tab: "coordination", button: "Chép tin nhắc lần 2" } }],
      ADMIN: [{ do: "Tiền đã về: ghi nhận phần còn lại trên dòng đơn (nút \"Thu lần 2…\").", where: { tab: "operation" } }],
    },
    deadline: "Mặc định 30 phút từ lúc hoa xong (tính chung bước giao ship).",
    next: ["SECOND_PAYMENT_REPORTED"],
    notes: ["Tiệm cho shipper thu tiền mặt và không bắt thu đủ trước khi giao: được giao trước, thu sau giao."],
  },
  {
    id: "SECOND_PAYMENT_REPORTED",
    group: "PAYMENT",
    title: "Khách báo đã chuyển phần còn lại",
    recognize: "Đơn đã cọc, khách báo đã chuyển lần 2 (thường kèm bill).",
    owners: ["ADMIN", "COORDINATOR"],
    steps: {
      ADMIN: [
        { do: "Đối chiếu sao kê rồi bấm \"Phê duyệt đợt 2…\" trên dòng đơn.", where: { tab: "operation" } },
        { do: "Sao kê không có khoản lần 2: báo khách chưa nhận được tiền — bill lần 2 bị bỏ, khách được nhắc chuyển lại.", where: { tab: "operation", button: "Chưa nhận được tiền" } },
      ],
      COORDINATOR: [{ do: "Tiệm cho phép thì xác nhận ngay trên thẻ đơn để giao hoa; nếu thẻ ghi \"Chờ Điều hành xác nhận\" thì chờ Điều hành.", where: { tab: "coordination", button: "Xác nhận Đã Nhận Đủ Tiền (Lần 2)" } }],
    },
    next: ["READY_TO_DISPATCH", "SECOND_PAYMENT_DUE"],
  },
  {
    id: "POST_DELIVERY_DEBT",
    group: "PAYMENT",
    title: "Đã giao còn nợ",
    recognize: "Đơn đã giao xong nhưng chưa thu đủ (lọc \"Đã giao còn nợ\" ở tab Điều hành).",
    owners: ["ADMIN", "SALE"],
    steps: {
      SALE: [{ do: "Liên hệ khách nhắc thanh toán phần còn lại." }],
      ADMIN: [{ do: "Tiền về thì ghi nhận trên dòng đơn (nút \"Thu lần 2…\" / \"Thu tiền…\").", where: { tab: "operation" } }],
    },
    automation: "Việc nằm trong Hộp việc tới khi thu đủ, càng lâu càng xếp lên trên.",
    next: [],
  },
  {
    id: "UNMATCHED_BANK_TRANSFER",
    group: "PAYMENT",
    title: "Có khoản tiền vào chưa khớp đơn",
    recognize: "Tiệm nối ngân hàng; có giao dịch không khớp mã đơn, vào đơn đã huỷ, hoặc đơn đã trả đủ.",
    owners: ["ADMIN"],
    steps: {
      ADMIN: [
        { do: "Tìm đúng đơn theo số tiền, nội dung chuyển khoản; ghi nhận tiền trên dòng đơn đó (hoặc hoàn cho khách nếu đơn đã huỷ).", where: { tab: "operation" } },
        { do: "Xử lý xong thì đánh dấu giao dịch.", where: { tab: "operation", button: "Đánh dấu đã xử lý" } },
      ],
    },
    next: [],
    notes: ["Khách chuyển thừa: hệ thống ghi đúng số còn thiếu và ghi chú phần thừa cần hoàn."],
  },
] as const satisfies readonly Situation[]
