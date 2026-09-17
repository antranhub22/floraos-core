/**
 * FloraOS SaaS System Knowledge Base (Bộ Cẩm Nang Tri Thức Vận Hành SSOT).
 * Đóng gói toàn bộ tài liệu hướng dẫn và đặc tả các module vào từ điển tri thức.
 */

export interface SaasKnowledgeItem {
  id: string
  moduleCode: string
  title: string
  keywords: string[]
  summary: string
  steps: string[]
  routePath: string
  actionLabel: string
}

export const SAAS_KNOWLEDGE_BASE: SaasKnowledgeItem[] = [
  // 1. M10 — ĐƠN HÀNG VẬN HÀNH & IN PHIẾU
  {
    id: "m10_florist_ticket",
    moduleCode: "M10",
    title: "In phiếu cắm hoa xưởng (ẩn giá tiền)",
    keywords: ["phiếu cắm hoa", "thợ cắm", "giấu giá", "ẩn giá", "phiếu xưởng", "florist ticket", "công thức hoa"],
    summary: "Hệ thống tự động trích xuất công thức hoa nguyên tử (BOM) và ảnh mẫu từ M01 sang phiếu xưởng, đồng thời ẩn 100% giá vốn và giá bán để bảo mật thông tin tài chính của tiệm.",
    steps: [
      "Vào mục 'Đơn hàng' trên thanh điều hướng bên trái",
      "Nhấp chọn đơn hàng cần in phiếu",
      "Chọn tab 'Lát cắt Thợ Cắm Hoa (Ẩn Giá)'",
      "Bấm nút 'In phiếu A6' ở góc dưới",
    ],
    routePath: "/don-hang",
    actionLabel: "Mở Bảng Đơn Hàng M10",
  },
  {
    id: "m10_delivery_receipt",
    moduleCode: "M10",
    title: "In phiếu giao vận và thiệp chúc mừng A6",
    keywords: ["giao hàng", "phiếu giao", "shipper", "in thiệp", "lời chúc", "khổ a6", "thu cod", "delivery slip"],
    summary: "Phiếu giao hàng chuẩn khổ A6 hiển thị tên người nhận, số điện thoại, địa chỉ chi tiết, nội dung thiệp chúc mừng và số tiền cần thu hộ COD.",
    steps: [
      "Vào mục 'Đơn hàng'",
      "Mở chi tiết đơn hàng",
      "Chọn tab 'Lát cắt Giao Hàng & Thiệp (A6)'",
      "Bấm nút 'In phiếu A6'",
    ],
    routePath: "/don-hang",
    actionLabel: "Mở Bảng Đơn Hàng M10",
  },
  {
    id: "m10_order_kanban",
    moduleCode: "M10",
    title: "Quản lý tiến độ đơn hàng và đo lường SLA",
    keywords: ["kanban", "tiến độ đơn", "đo sla", "thời gian xử lý", "trạng thái đơn", "quá hạn"],
    summary: "Bảng Kanban 4 cột (Chờ xử lý, Đang cắm hoa, Đang giao hàng, Hoàn tất) tự động bấm giờ đo SLA và cảnh báo màu đỏ nếu đơn bị chậm tiến độ mục tiêu (180 phút).",
    steps: [
      "Vào mục 'Đơn hàng'",
      "Nhấn các nút thao tác nhanh: 'Nhận cắm hoa' -> 'Đã cắm xong' -> 'Bắt đầu giao' -> 'Giao thành công'",
      "Hệ thống ghi nhận chuỗi sự kiện Event Sourcing để đối soát",
    ],
    routePath: "/don-hang",
    actionLabel: "Xem Bảng Kanban Đơn Hàng",
  },

  // 2. M09 — CRM & QUẢN LÝ KHÁCH HÀNG
  {
    id: "m09_rfm_tiers",
    moduleCode: "M09",
    title: "Phân tầng khách hàng tự động (RFM Tiers)",
    keywords: ["phân hạng khách", "phân tầng", "khách vip", "vàng", "bạc", "đồng", "rfm", "tổng chi tiêu"],
    summary: "Hệ thống tự động tính toán tổng chi tiêu và số đơn hàng từ M10 để xếp hạng khách hàng: VIP (>= 10tr hoặc >= 10 đơn), Vàng (>= 5tr), Bạc (>= 2tr), Đồng (>= 500k), Mới (chưa phát sinh đơn).",
    steps: [
      "Vào mục 'Khách hàng' trên thanh điều hướng",
      "Sử dụng bộ lọc phân tầng (VIP, GOLD, SILVER, BRONZE, NEW)",
      "Bấm 'Hồ sơ Master' để xem chi tiết lịch sử mua sắm và giá trị trung bình đơn (AOV)",
    ],
    routePath: "/khach-hang",
    actionLabel: "Mở CRM Khách Hàng",
  },
  {
    id: "m09_occasions_reminder",
    moduleCode: "M09",
    title: "Quét và nhắc nhở ngày kỷ niệm của khách hàng",
    keywords: ["ngày kỷ niệm", "nhắc sinh nhật", "nhắc hẹn", "quét dịp", "ngày của mẹ", "kỷ niệm ngày cưới"],
    summary: "FloraOS tự động quét các ngày kỷ niệm diễn ra trong 14 ngày tới của khách hàng và đưa ra gợi ý loài hoa, tone màu phù hợp nhất để nhân viên chủ động liên hệ tư vấn.",
    steps: [
      "Vào mục 'Khách hàng'",
      "Ở góc trên bên phải, bấm nút '⚡ Quét dịp sắp tới (14 ngày)'",
      "Xem danh sách khách hàng sắp có dịp để liên hệ tư vấn hoa",
      "Để thêm dịp mới: Mở hồ sơ khách -> Chọn tab 'Dịp kỷ niệm' -> Bấm '+ Thêm ngày kỷ niệm'",
    ],
    routePath: "/khach-hang",
    actionLabel: "Quét Dịp Kỷ Niệm Ngay",
  },
  {
    id: "m09_consent_privacy",
    moduleCode: "M09",
    title: "Bảo vệ quyền riêng tư và tiếp thị (Consent Engine)",
    keywords: ["quyền riêng tư", "consent", "đồng ý nhận tin", "chặn spam", "zalo zns", "sms brandname"],
    summary: "FloraOS tuân thủ chính sách bảo vệ người tiêu dùng, chỉ cho phép gửi tin nhắn Zalo ZNS hoặc SMS tiếp thị khi khách hàng đã được cấp phép (Granted Consent).",
    steps: [
      "Vào mục 'Khách hàng'",
      "Chọn khách hàng cần kiểm tra -> Chọn tab 'Quyền riêng tư (Consent)'",
      "Bật hoặc tắt quyền gửi tin qua Zalo ZNS, SMS, Cuộc gọi hoặc Khuyến mãi",
    ],
    routePath: "/khach-hang",
    actionLabel: "Xem Quản Lý Consent",
  },

  // 3. M01 / M01b — PHÂN TÍCH ẢNH & VISION
  {
    id: "m01_vision_analysis",
    moduleCode: "M01",
    title: "Nhận diện ảnh hoa và đếm cành nguyên tử (Vision AI)",
    keywords: ["nhận diện ảnh", "phân tích hoa", "đếm cành", "bom hoa", "vision", "tải ảnh hoa", "bóc tách hoa"],
    summary: "Vision AI tự động nhận diện dáng hoa (bó/giỏ/kệ/bình), tone màu sắc, phong cách và đếm chính xác số lượng từng cành hoa (Hoa hồng, Baby, Cúc mâm xôi...) để tạo công thức cắm hoa.",
    steps: [
      "Vào mục 'Tải ảnh' trên thanh điều hướng",
      "Tải ảnh sản phẩm hoa tươi lên hệ thống",
      "AI tự động phân tích và đưa ra bảng thành phần BOM cành hoa",
      "Bấm 'Chốt duyệt' để lưu vào Product Master Index",
    ],
    routePath: "/tai-anh",
    actionLabel: "Tải Ảnh Phân Tích Ngay",
  },

  // 4. M04c — AI VIDEO STUDIO
  {
    id: "m04c_video_studio",
    moduleCode: "M04c",
    title: "Dựng video marketing hoa tươi dọc 9:16 (Video Studio)",
    keywords: ["dựng video", "video marketing", "tiktok", "reels", "storyboard", "video 9:16", "ken burns"],
    summary: "Dựng video hoa tươi chuyên nghiệp cho TikTok/Reels với hiệu ứng chuyển cảnh điện ảnh Ken Burns, giọng đọc thuyết minh Edge TTS tự động ducking nhạc nền, hỗ trợ 6 khuôn định dạng.",
    steps: [
      "Vào mục 'Video Studio' trên thanh điều hướng",
      "Chọn mẫu hoa và kịch bản Storyboard 2–15 cảnh",
      "Tùy chỉnh góc máy chuyển động (Zoom In/Out, Pan Left/Right)",
      "Chọn phong cách phụ đề và giọng đọc -> Bấm 'Xuất video HD'",
    ],
    routePath: "/video",
    actionLabel: "Mở AI Video Studio",
  },

  // 5. M05 / M06 — CATALOG & MÃ QR
  {
    id: "m06_qr_catalog",
    moduleCode: "M06",
    title: "Chia sẻ E-Catalog trực tuyến và tạo mã QR 500px",
    keywords: ["e-catalog", "mã qr", "chia sẻ catalog", "menu hoa", "link xem hoa", "landing page"],
    summary: "Tạo trang catalog hoa tươi trực tuyến theo tên thương hiệu của tiệm và xuất mã QR sắc nét chuẩn 500px để in để bàn hoặc gửi qua Zalo cho khách hàng tự chọn mẫu.",
    steps: [
      "Vào mục 'Catalog'",
      "Bấm nút 'Chia sẻ & Mã QR' ở góc trên",
      "Tải ảnh mã QR 500px hoặc sao chép đường link /c/[slug] gửi cho khách",
    ],
    routePath: "/catalog",
    actionLabel: "Mở Quản Trị Catalog",
  },

  // 6. M02 — BẢNG GIÁ & ĐỊNH GIÁ
  {
    id: "m02_pricing_rules",
    moduleCode: "M02",
    title: "Thiết lập quy tắc định giá và giá sàn/trần",
    keywords: ["cài đặt giá", "định giá", "giá sàn", "giá trần", "giá chào khách", "chiết khấu", "chi phí cành", "markup"],
    summary: "Thiết lập công thức tính giá bán dựa trên giá vốn cành hoa, phụ kiện đóng gói và biên lợi nhuận mục tiêu của từng chi nhánh.",
    steps: [
      "Vào mục 'Sản phẩm' hoặc 'Bảng giá' trên thanh điều hướng",
      "Xem và chỉnh sửa các quy tắc giá bán niêm yết",
      "Bấm 'Lưu quy tắc giá' để áp dụng ngay vào Master Index",
    ],
    routePath: "/san-pham",
    actionLabel: "Mở Cài Đặt Bảng Giá",
  },

  // 7. M08 — TÍCH HỢP ĐA KÊNH & BIỂU PHÍ CHAT ASSISTANT
  {
    id: "m08_channel_integration",
    moduleCode: "M08",
    title: "Cấu hình AI Chat Đa Kênh (Facebook, Zalo, Web Widget)",
    keywords: ["tích hợp đa kênh", "kết nối facebook", "kết nối zalo", "nhúng website", "biểu phí chat", "credit", "page id", "oa id", "script nhúng"],
    summary: "Kết nối AI Chatbot vào Fanpage Messenger, Zalo OA và Website tiệm hoa với biểu phí 0–70 credit/tháng và 1 credit/10 tin nhắn.",
    steps: [
      "Vào mục 'Chat Assistant' -> Chọn 'Tích Hợp Đa Kênh & Biểu Phí'",
      "Nhập Page ID / Zalo OA ID và Token tương ứng",
      "Với Website: Chọn màu chủ đạo, điền domain cho phép và sao chép mã script nhúng",
      "Bật công tắc kích hoạt kênh",
    ],
    routePath: "/hoi-thoai/kenh-tich-hop",
    actionLabel: "Cấu Hình Kênh Chat M08",
  },

  // 8. TỔNG HỢP — CẨM NANG NHẬP LIỆU CHUẨN SSOT
  {
    id: "kb_input_guide",
    moduleCode: "KB",
    title: "Cẩm nang quy chuẩn nhập liệu dữ liệu SSOT 7 phân hệ",
    keywords: ["cần nhập gì", "hướng dẫn nhập liệu", "nhập thông tin gì", "nhập liệu", "chuẩn bị dữ liệu", "dữ liệu đầu vào", "tri thức", "cẩm nang"],
    summary: "Cẩm nang hướng dẫn chi tiết từng trường dữ liệu nguyên tử (Atomic Disaggregated Fields) cần nhập cho 7 phân hệ: M01 Vision, M02 Giá, M04 Video, M06 Catalog, M08 Chat, M09 CRM, M10 Đơn hàng.",
    steps: [
      "Vào mục 'Tri thức & Nhập liệu' trên thanh điều hướng bên trái",
      "Chọn phân hệ cần nhập liệu để xem bảng đặc tả các trường bắt buộc",
      "Xem ví dụ chuẩn vs sai lệch (Good vs Bad Practice)",
      "Bấm nút '👉 Đi đến nhập liệu ngay' để vào thẳng màn hình nhập liệu",
    ],
    routePath: "/tri-thuc",
    actionLabel: "Mở Cẩm Nang Nhập Liệu SSOT",
  },
]

/**
 * Nhận diện ý định câu hỏi:
 * - "SAAS_HELP": Câu hỏi về thao tác, cách dùng, in ấn, tính năng, quy trình FloraOS.
 * - "FLOWER_SALES": Câu hỏi về mua hoa, giá mẫu hoa, tìm hoa theo dịp, ngân sách.
 */
export function detectUserIntent(query: string): "SAAS_HELP" | "FLOWER_SALES" {
  const lower = query.toLowerCase()

  const saasHelpKeywords = [
    "làm sao", "làm thế nào", "cách", "hướng dẫn", "chức năng", "tính năng",
    "cần nhập gì", "hướng dẫn nhập liệu", "nhập thông tin gì", "nhập liệu", "chuẩn bị gì",
    "in phiếu", "phiếu xưởng", "phiếu a6", "phiếu giao", "ẩn giá", "giấu giá",
    "thợ cắm", "shipper", "đo sla", "quá hạn", "kanban",
    "ngày kỷ niệm", "nhắc hẹn", "quét dịp", "consent", "quyền riêng tư",
    "phân tầng", "rfm", "hạng vip", "hạng vàng", "khách hàng",
    "dựng video", "video studio", "storyboard", "mã qr", "catalog",
    "đếm cành", "bóc tách", "tải ảnh", "cài đặt giá", "giá sàn", "chi phí",
    "tích hợp đa kênh", "kết nối facebook", "kết nối zalo", "nhúng website", "biểu phí",
  ]

  const matchesSaas = saasHelpKeywords.some((kw) => lower.includes(kw))
  return matchesSaas ? "SAAS_HELP" : "FLOWER_SALES"
}

/**
 * Tra cứu tri thức vận hành hệ thống FloraOS dựa trên câu hỏi của người dùng
 */
export function querySaasKnowledge(query: string): SaasKnowledgeItem | null {
  const lower = query.toLowerCase()

  let bestMatch: SaasKnowledgeItem | null = null
  let maxScore = 0

  for (const item of SAAS_KNOWLEDGE_BASE) {
    let score = 0
    for (const kw of item.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 10
      }
    }
    if (lower.includes(item.title.toLowerCase())) {
      score += 25
    }
    if (score > maxScore) {
      maxScore = score
      bestMatch = item
    }
  }

  // Nếu điểm match >= 10, coi là tìm thấy câu trả lời chính xác
  return maxScore >= 10 ? bestMatch : null
}
