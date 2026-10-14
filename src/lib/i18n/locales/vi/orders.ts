/**
 * orders.ts — Từ điển màn hình Đơn hàng & Kênh chào bán (02-don-hang.md SSOT)
 */

export const ordersVi = {
  header: {
    category: "Bán hàng và xử lý đơn",
    title: "Đơn hàng",
    createOrder: "Tạo đơn mới",
    createFromChat: "Tạo đơn từ tin nhắn",
    refresh: "Làm mới",
    home: "Trang chủ",
    exportExcel: "Xuất file Excel",
  },
  tabs: {
    allOrders: "Tất cả đơn hàng",
    brochureLinks: "Link đặt hoa",
    paymentApproval: "Duyệt thanh toán",
  },
  guidance: {
    badge: "HƯỚNG DẪN XỬ LÝ ĐƠN HÀNG",
    title: "Quy trình cắm hoa và giao hàng",
    description: "Mỗi đơn hàng có phiếu cắm hoa cho thợ và phiếu giao hoa kèm mã QR để xác nhận giao thành công.",
    tips: {
      recipe: "Phiếu cắm hoa ghi rõ số lượng từng loại hoa, giấy gói và tông màu chuẩn",
      qcPhoto: "Chụp ảnh thành phẩm gửi khách duyệt trước khi giao",
      deliverySlip: "In phiếu giao hoa kèm thiệp và thông tin người nhận",
    },
  },
  filters: {
    searchPlaceholder: "Tìm theo mã đơn, người nhận hoặc số điện thoại…",
    totalCount: "{count} đơn hàng",
    mobile: {
      all: "Tất cả",
      new: "Mới tiếp nhận",
      arranging: "Đang cắm hoa",
      delivering: "Đang giao",
      completed: "Hoàn tất",
    },
  },
  columns: {
    newOrders: "Mới tiếp nhận",
    inProduction: "Đang cắm hoa",
    outForDelivery: "Đang giao hàng",
    delivered: "Đã giao thành công",
  },
  card: {
    code: "Mã đơn: {code}",
    deadline: "Hạn giao: {time}",
    recipient: "Người nhận: {name}",
    phone: "Số điện thoại: {phone}",
    address: "Địa chỉ: {address}",
    printTicket: "In phiếu thợ",
    printSlip: "In phiếu giao",
  },
  modal: {
    createTitle: "Tạo đơn hàng mới",
    detailsTitle: "Chi tiết đơn hàng",
    customerInfo: "Thông tin khách hàng & người nhận",
    productInfo: "Sản phẩm & Công thức cắm hoa",
    deliveryInfo: "Thời gian & Địa chỉ giao hoa",
    notes: "Ghi chú nội bộ cho thợ",
  },
} as const

export type OrdersDictionary = typeof ordersVi
