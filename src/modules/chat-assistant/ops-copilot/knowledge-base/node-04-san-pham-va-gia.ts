import type { OpsKnowledgeNode } from "./schema"

export const NODE_04_SAN_PHAM_VA_GIA: OpsKnowledgeNode = {
  id: "node-04-san-pham-va-gia",
  moduleIndex: 4,
  moduleTitle: "Chức năng 04: Sản Phẩm & Giá",
  topicTitle: "Quản Lý Danh Mục Mẫu Hoa & Bảng Giá Niêm Yết",
  routePath: "/san-pham",
  targetRoles: ["ALL", "QUAN_LY", "BAN_HANG"],
  keywords: [
    "sản phẩm", "bảng giá", "giá hoa", "danh mục hoa", "mẫu hoa", "giá niêm yết",
    "đang bán", "active", "draft", "bản nháp", "lưu trữ", "archived", "grid view",
    "table view", "khoảng giá", "lọc hoa", "mã hoa", "code", "thùng rác", "xóa sản phẩm"
  ],
  intents: ["quan_ly_san_pham_gia", "loc_mau_hoa", "thay_doi_trang_thai_ban", "xoa_san_pham_thung_rac"],
  summary: "Kho lưu trữ toàn bộ mẫu hoa và bảng giá niêm yết của tiệm: Tra cứu nhanh theo mã hoa, dịp lễ, khoảng giá; xem dạng lưới ảnh hoặc bảng giá chi tiết, và tính năng chuyển vào thùng rác an toàn.",
  stepByStepSOP: [
    {
      stepNumber: 1,
      actionText: "Mở mục 'Sản phẩm' ở menu bên trái để xem danh sách mẫu hoa hiện có của tiệm",
      expectedResult: "Màn hình hiển thị kho hoa cùng thanh tìm kiếm và bộ lọc",
    },
    {
      stepNumber: 2,
      actionText: "Tìm kiếm & Lọc hoa: Gõ tên hoa hoặc mã hoa vào ô tìm kiếm, hoặc chọn Dịp lễ và Khoảng giá mong muốn",
      expectedResult: "Hệ thống lọc ra đúng mẫu hoa cần tìm trong vài giây để báo giá cho khách",
    },
    {
      stepNumber: 3,
      actionText: "Đổi cách xem: Bấm biểu tượng Lưới để xem ảnh tư vấn khách, hoặc bấm biểu tượng Bảng để rà soát giá hàng loạt",
      expectedResult: "Danh sách hiển thị trực quan và cuộn xem thêm mượt mà",
    },
    {
      stepNumber: 4,
      actionText: "Thao tác nhanh ở góc trên: Bấm 'Thêm sản phẩm' để tạo mẫu mới, hoặc bấm 'Nhập từ Excel' để nạp hàng loạt",
      expectedResult: "Chuyển nhanh đến chức năng tạo dữ liệu mong muốn",
    },
    {
      stepNumber: 5,
      actionText: "Xóa mẫu hoa: Bấm biểu tượng Thùng rác trên mẫu hoa, sau đó xác nhận để chuyển vào thùng rác tạm 30 ngày",
      expectedResult: "Mẫu hoa được lưu tạm an toàn trong thùng rác, tránh xóa nhầm",
    },
  ],
  caveatsAndGotchas: [
    "Chỉ tài khoản Quản lý hoặc Chủ tiệm mới có quyền xóa mẫu hoa vào thùng rác để bảo vệ dữ liệu của tiệm.",
    "Mẫu hoa ở trạng thái 'Bản nháp' sẽ không hiển thị trên link gửi cho khách xem.",
    "Mẫu hoa cần ở trạng thái 'Đang bán' và có ảnh chụp rõ nét thì mới xuất hiện trên catalog bán hàng.",
  ],
  actionLabel: "Mở Danh Mục Sản Phẩm & Giá",
  quickPrompts: [
    "Cách lọc và tra cứu mẫu hoa theo mã, dịp lễ và khoảng giá?",
    "Ai có quyền xóa mẫu hoa vào Thùng rác và khôi phục ra sao?",
    "Xem bảng giá hàng loạt ở đâu?",
  ],
}
