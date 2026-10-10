/**
 * common.ts — Từ điển các thuật ngữ và tác vụ dùng chung trong FloraOS (Tiếng Việt SSOT)
 */

export const commonVi = {
  terms: {
    shop: "Cửa hàng",
    florist: "Thợ cắm hoa",
    customer: "Khách hàng",
    order: "Đơn hàng",
    product: "Sản phẩm",
    flowerRecipe: "Công thức cành hoa",
    sampleProduct: "Mẫu hoa chuẩn",
    greetingCard: "Thiệp chúc mừng",
    brochure: "Thẻ chào & Giới thiệu",
    storage: "Kho dữ liệu",
    settings: "Cài đặt hệ thống",
    journey: "Hành trình tác nghiệp",
  },
  actions: {
    confirm: "Xác nhận",
    save: "Lưu lại",
    saveDraft: "Lưu bản nháp",
    cancel: "Hủy bỏ",
    delete: "Xóa",
    edit: "Chỉnh sửa",
    create: "Tạo mới",
    add: "Thêm",
    close: "Đóng",
    back: "Quay lại",
    next: "Tiếp tục",
    approve: "Duyệt",
    reject: "Từ chối",
    exportFile: "Xuất dữ liệu",
    importFile: "Nhập dữ liệu",
    search: "Tìm kiếm...",
    filter: "Bộ lọc",
    refresh: "Làm mới",
    viewDetails: "Xem chi tiết",
    uploadImage: "Tải ảnh lên",
  },
  status: {
    all: "Tất cả",
    draft: "Bản nháp",
    pending: "Đang chờ duyệt",
    approved: "Đã duyệt",
    processing: "Đang thực hiện",
    completed: "Hoàn tất",
    failed: "Thất bại",
    cancelled: "Đã hủy",
    active: "Đang hoạt động",
    inactive: "Tạm dừng",
  },
  pagination: {
    showing: "Hiển thị {from} - {to} trên tổng số {total}",
    previous: "Trang trước",
    next: "Trang sau",
    rowsPerPage: "Số dòng mỗi trang",
  },
  validation: {
    required: "Trường này là bắt buộc",
    invalidEmail: "Email không hợp lệ",
    invalidPhone: "Số điện thoại không hợp lệ",
    minCharacters: "Tối thiểu {min} ký tự",
    uploadFailed: "Tải lên không thành công, vui lòng thử lại",
  },
} as const

export type CommonDictionary = typeof commonVi
