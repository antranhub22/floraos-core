/**
 * home.ts — Từ điển màn hình Trang chủ & Hành trình tác vụ (01-trang-chu.md SSOT)
 */

export const homeVi = {
  header: {
    badge: "Bắt đầu nhanh",
    title: "Hôm nay bạn muốn làm gì cho cửa hàng?",
    description: "Chọn một công việc bên dưới để bắt đầu.",
    expertModeButton: "Xem bảng số liệu",
    journeyModeButton: "Về trang chọn công việc",
    expertModeBanner: "Bạn đang xem bảng số liệu trực tiếp.",
  },
  filters: {
    all: "Tất cả ({count})",
    singleTask: "Việc đơn lẻ",
    workflow: "Quy trình trọn gói",
    aiAssistant: "Trợ lý AI",
    searchPlaceholder: "Tìm công việc…",
    emptySearch: "Không có kết quả cho “{query}”. Hãy thử từ khóa khác.",
  },
  spotlight: {
    badge: "Nổi bật",
    readyStatus: "Sẵn sàng sử dụng",
    title: "Thẻ chào mẫu hoa",
    description: "Gửi bộ sưu tập hoa cho khách chọn mẫu, đặt hàng và thanh toán ngay trên điện thoại.",
    features: {
      zalo: "Gửi link qua Zalo",
      customerPick: "Khách tự chọn mẫu và gửi lời chúc",
      autoOrder: "Đơn vào hệ thống và giao việc cho thợ",
    },
    cta: "Tạo link đặt hoa",
    note: "Nên dùng mỗi ngày cho cửa hàng",
  },
  actionCards: {
    report: {
      title: "Xem báo cáo",
      desc: "Xem doanh thu, số đơn hàng và hoạt động trên FloraOS của cửa hàng.",
    },
    trends: {
      title: "Xem mẫu hoa được ưa chuộng",
      desc: "Biết khách thích kiểu hoa, màu sắc và mức giá nào để chuẩn bị hàng.",
    },
    scanPhoto: {
      title: "Tạo mẫu hoa từ ảnh chụp",
      desc: "Chụp ảnh hoa, AI nhận diện các loại hoa và tạo sẵn mẫu hoa để bán.",
    },
    quote: {
      title: "Tạo báo giá",
      desc: "Soạn báo giá hoa cho khách mua hoặc cho đối tác của cửa hàng.",
    },
    writeCopy: {
      title: "Viết bài đăng",
      desc: "Soạn bài cho Facebook, Instagram, TikTok đúng giọng văn của cửa hàng, kèm gợi ý hashtag.",
    },
    voiceover: {
      title: "Tạo giọng đọc cho bài đăng",
      desc: "Chuyển bài viết thành giọng đọc để ghép vào video giới thiệu mẫu hoa.",
    },
    mockup: {
      title: "Tạo ảnh quảng cáo từ ảnh gốc",
      desc: "Tách nền và đặt hoa vào không gian studio hoặc sự kiện để có ảnh quảng cáo đẹp hơn.",
    },
    video: {
      title: "Tạo video từ ảnh hoa",
      desc: "Tạo video ngắn từ ảnh hoa để đăng lên TikTok hoặc Reel.",
    },
  },
} as const

export type HomeDictionary = typeof homeVi
