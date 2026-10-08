/**
 * Mở Thẻ chào thì vào thẳng chỗ làm việc của vai (kế hoạch lễ 20/10, J): người xác nhận tiền
 * (Điều hành) → bảng Điều hành; người điều phối đơn → bảng Điều phối; còn lại (Sale) → Gửi nhanh.
 * Suy từ năng lực, không từ tên vai — đây chỉ là ẩn hiện giao diện, máy chủ vẫn kiểm ở mọi endpoint.
 */
export type TheChaoDefaultView =
  | { viewMode: "wizard"; activeTab: "catalog" }
  | { viewMode: "manager"; activeTab: "payment" | "coordinator" }

export function defaultTheChaoView(can: (code: string) => boolean): TheChaoDefaultView {
  if (can("R11")) return { viewMode: "manager", activeTab: "payment" }
  if (can("R3") || can("R4") || can("R5")) return { viewMode: "manager", activeTab: "coordinator" }
  return { viewMode: "wizard", activeTab: "catalog" }
}
