/**
 * greeting-card.ts — Từ điển màn hình Thẻ chào mẫu hoa & Thiệp số (03-the-chao.md SSOT)
 */

export const greetingCardVi = {
  header: {
    breadcrumb: "Đơn hàng",
    title: "Thẻ chào mẫu hoa",
    description: "Gửi khách bộ sưu tập hoa để xem, chọn mẫu, đặt hàng và thanh toán ngay trên điện thoại.",
    guideButton: "Hướng dẫn thẻ chào",
    todoButton: "Việc cần làm",
    modes: {
      quickSend: "Gửi nhanh",
      manage: "Quản lý",
    },
    refresh: "Làm mới",
    exportExcel: "Xuất file Excel",
  },
  tabs: {
    catalogs: "Bộ sưu tập",
    tracking: "Theo dõi đơn",
    sales: "Bán hàng",
    operation: "Điều hành",
    coordination: "Điều phối",
  },
  readiness: {
    openProfile: "Mở hồ sơ cửa hàng",
    warning: "Hồ sơ cửa hàng chưa đủ thông tin. Hãy báo Điều hành cập nhật để tạo link đặt hoa.",
  },
  catalogs: {
    title: "Quản lý bộ sưu tập",
    description: "Tạo và chỉnh sửa các bộ sưu tập mẫu hoa để gửi cho khách hàng.",
    createButton: "Tạo bộ sưu tập",
    copyChannelLabel: "Sao chép link cho kênh",
    channelNote: "Link này gắn với tên bạn. Đơn khách đặt từ link sẽ được tính cho bạn.",
    noChannel: "Không chọn kênh",
  },
  guideModal: {
    title: "Hướng dẫn sử dụng Thẻ chào",
    step1: "Tạo bộ sưu tập mẫu hoa phù hợp với dịp lễ hoặc sự kiện",
    step2: "Sao chép link và gửi cho khách qua Zalo hoặc Facebook",
    step3: "Khách lướt xem mẫu, chọn lời chúc thiệp và đặt hàng trực tiếp",
    step4: "Đơn tự động đổ về xưởng để thợ cắm hoa thực hiện",
  },
} as const

export type GreetingCardDictionary = typeof greetingCardVi
