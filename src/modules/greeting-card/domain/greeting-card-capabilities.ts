/**
 * Mã năng lực gác từng nhóm thao tác Thẻ chào (catalog tại
 * `src/core/rbac/capability-catalog.ts`). Dùng lại mã sẵn có của nhóm Sản
 * phẩm / Đơn hàng thay vì đặt mã mới — Thẻ chào là kênh bán hàng tạo đơn.
 * Bản cũ không gác gì: mọi thành viên (kể cả vai chỉ xem) đều xác nhận
 * được thanh toán.
 */
export const GREETING_CARD_CAPABILITY = {
  /** Xem bộ sưu tập — L1 product.read */
  read: "L1",
  /** Tạo/sửa bộ sưu tập, sinh link gửi khách — R2 order.create */
  manage: "R2",
  /** Xem đơn + bảng theo dõi + nhắn nội bộ — R1 order.read */
  orderRead: "R1",
  /** Xác nhận đã nhận tiền — R9 order.payment.record */
  paymentRecord: "R9",
  /** Phân công florist — R4 order.assign */
  assignFlorist: "R4",
  /** Chụp ảnh thành phẩm — R3 order.update */
  productionUpdate: "R3",
  /** Giao ship, ảnh người nhận — R5 delivery.manage */
  deliveryManage: "R5",
} as const
