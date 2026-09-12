import type { SystemRoleKey } from "@/modules/organization/domain/system-roles"

/**
 * Từ vựng năng lực của toàn hệ thống — đặc tả 02.
 *
 * 76 mã đầu (`A1`…`E8`) là thu hoạch R2 nguyên vẹn từ
 * `FloraOS/floraos-web/src/lib/maChucNang.ts`, chép lại ở `src/lib/maChucNang.ts`
 * kèm `tests/maChucNang.test.ts` (`npm run test:harvest`, xanh không sửa một
 * dòng). Bảng dưới đây SINH LẠI từ chính tệp harvest đó — không gõ tay — nên
 * `macDinh`/`tranCung` luôn khớp mã nguồn, không khớp trí nhớ (xem bài học ở
 * `docs/kien-truc/RA_SOAT_THU_HOACH.md` mục 1, dòng 3).
 *
 * 38 mã còn lại (`F1`…`L6`, cộng `F9` thêm ở P7) là năng lực mới của core,
 * không tồn tại ở FloraOS v1 — đặc tả 02 mục 4 và đặc tả 08 mục 3 (P7).
 *
 * Mỗi năng lực có hai định danh: mã chữ cái (`code`, định danh chính, giữ
 * nguyên để `maChucNang.test.ts` không phải sửa) và tên đọc được (`name`,
 * dùng trong mã nguồn và tài liệu — đặc tả 02 mục 2).
 */

export type CapabilityGroup =
  | "access"
  | "vision_run"
  | "pricing_card"
  | "config"
  | "system"
  | "org_member"
  | "asset_job"
  | "vision"
  | "media"
  | "channel"
  | "product_pricing"
  | "experience"
  | "ai_policy"

export interface CapabilityDefinition {
  /** Mã chữ cái — định danh chính, ví dụ `B5`. */
  readonly code: string
  /** Tên đọc được, ví dụ `vision.analyze` — đặc tả 02 mục 2. */
  readonly name: string
  /** Nhãn tiếng Việt, dùng cho giao diện và tài liệu. */
  readonly label: string
  readonly group: CapabilityGroup
  /** Vai được phép khi chưa ai đụng vào bảng công tắc (lớp một). */
  readonly defaultRoles: readonly SystemRoleKey[]
  /**
   * Trần cứng (lớp ba): dù bảng công tắc ghi khác, quyền cũng không vượt ra
   * ngoài tập này. Bỏ trống nghĩa là không có trần — hằng trong mã, không
   * trong cơ sở dữ liệu (`YC-Q3`).
   */
  readonly hardCap?: readonly SystemRoleKey[]
}

// ─── A–E: 76 mã thu hoạch từ FloraOS, sinh từ src/lib/maChucNang.ts ─────────
// prettier-ignore
const HARVESTED: Record<string, Omit<CapabilityDefinition, "code">> = {
  A1: { name: "access.login", group: "access", label: "Đăng nhập bằng tài khoản nội bộ", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  A2: { name: "access.password.change_own", group: "access", label: "Đổi mật khẩu đăng nhập của chính mình", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  A3: { name: "access.user.create", group: "access", label: "Tạo tài khoản nội bộ", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  A4: { name: "access.user.change_role", group: "access", label: "Đổi vai của một tài khoản", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  A5: { name: "access.user.toggle_active", group: "access", label: "Bật tắt trạng thái hoạt động của tài khoản", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  A6: { name: "access.vault.admin_password", group: "access", label: "Đặt và đổi mật khẩu quản trị của kho", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  A7: { name: "access.user.reset_password", group: "access", label: "Đặt lại mật khẩu đăng nhập của người khác", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  B1: { name: "vision_run.image.upload", group: "vision_run", label: "Tải ảnh sản phẩm lên kho", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B2: { name: "vision_run.image.list", group: "vision_run", label: "Xem danh sách ảnh, bỏ từng ảnh trước khi chạy", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B3: { name: "vision_run.precheck", group: "vision_run", label: "Soát điều kiện trước khi chạy", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B4: { name: "vision_run.cost_estimate.view", group: "vision_run", label: "Xem ước phí lượt chạy", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B5: { name: "vision_run.analyze.single", group: "vision_run", label: "Phân tích một ảnh mỗi lượt", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B6: { name: "vision_run.analyze.batch", group: "vision_run", label: "Phân tích nhiều ảnh trong một lượt", defaultRoles: ["dieu_hanh"] },
  B7: { name: "vision_run.analyze.folder", group: "vision_run", label: "Phân tích cả một thư mục ảnh", defaultRoles: ["dieu_hanh"] },
  B8: { name: "vision_run.analyze.all", group: "vision_run", label: "Phân tích cả kho ảnh", defaultRoles: ["dieu_hanh"] },
  B9: { name: "vision_run.stop.own", group: "vision_run", label: "Dừng lượt chạy của chính mình", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B10: { name: "vision_run.stop.others", group: "vision_run", label: "Dừng lượt chạy của người khác", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B11: { name: "vision_run.log.own", group: "vision_run", label: "Xem nhật ký lượt chạy của chính mình", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B12: { name: "vision_run.log.all", group: "vision_run", label: "Xem nhật ký mọi lượt chạy", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B13: { name: "vision_run.unlock_stuck", group: "vision_run", label: "Mở khoá lượt chạy treo", defaultRoles: ["dieu_hanh"] },
  B14: { name: "vision_run.reindex", group: "vision_run", label: "Quét lại chỉ mục ảnh", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B15: { name: "vision_run.result_file.import", group: "vision_run", label: "Nạp 02_KET-QUA.xlsx vào giao diện", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  B16: { name: "vision_run.result_file.download", group: "vision_run", label: "Tải tệp Excel kết quả về máy", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C1: { name: "pricing_card.quote.view", group: "pricing_card", label: "Xem bảng giá chào của sản phẩm đang chọn", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  C2: { name: "pricing_card.handoff_to_coordinator", group: "pricing_card", label: "Chuyển một mã sang Điều phối dựng thẻ", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  C3: { name: "pricing_card.tab.open", group: "pricing_card", label: "Mở tab Tạo thẻ", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C4: { name: "pricing_card.form.load_product", group: "pricing_card", label: "Chọn sản phẩm, nạp dữ liệu vào biểu mẫu", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C5: { name: "pricing_card.form.fill", group: "pricing_card", label: "Điền biểu mẫu, địa chỉ ba cấp, khung giờ giao", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C6: { name: "pricing_card.price_check.view", group: "pricing_card", label: "Xem bảng kiểm giá thời gian thực", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C7: { name: "pricing_card.field.override", group: "pricing_card", label: "Nhập tay đè trường tự động, trừ Giá vốn", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C8: { name: "pricing_card.cost_price.override", group: "pricing_card", label: "Nhập tay đè Giá vốn", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C9: { name: "pricing_card.price.exceed_ceiling", group: "pricing_card", label: "Đặt giá chào chốt vượt Trần", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C10: { name: "pricing_card.price.below_floor", group: "pricing_card", label: "Đặt giá chào chốt dưới Sàn", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  C11: { name: "pricing_card.preview", group: "pricing_card", label: "Xem trước thẻ", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C12: { name: "pricing_card.export", group: "pricing_card", label: "Xuất PNG và PDF A6", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C13: { name: "pricing_card.zalo_script.copy", group: "pricing_card", label: "Copy kịch bản Zalo", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C14: { name: "pricing_card.export_log.own", group: "pricing_card", label: "Xem sổ xuất thẻ của chính mình", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C15: { name: "pricing_card.export_log.all", group: "pricing_card", label: "Xem sổ xuất thẻ toàn công ty", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C16: { name: "pricing_card.export_log.download", group: "pricing_card", label: "Tải exports_log.csv về máy", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C17: { name: "pricing_card.product_image.view_for_sales", group: "pricing_card", label: "Xem ảnh sản phẩm để tư vấn khách", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  C18: { name: "pricing_card.partner.directory_view", group: "pricing_card", label: "Xem danh bạ đối tác và lịch sử bắn đơn", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C19: { name: "pricing_card.partner.dispatch", group: "pricing_card", label: "Bắn đơn cho đối tác", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C20: { name: "pricing_card.partner.confirm", group: "pricing_card", label: "Chốt đối tác nhận hoặc từ chối", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C21: { name: "pricing_card.task.close", group: "pricing_card", label: "Đóng một việc chờ dựng thẻ", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C22: { name: "pricing_card.task.return_to_sales", group: "pricing_card", label: "Trả một việc chờ về cho Sales", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C23: { name: "pricing_card.dispatch_board.view", group: "pricing_card", label: "Xem bảng điều phối trong ngày", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  C24: { name: "pricing_card.catalog.list", group: "pricing_card", label: "Xem danh sách mã toàn kho", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  C25: { name: "pricing_card.bom.view", group: "pricing_card", label: "Xem bảng thành phần nguyên liệu của một mã", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  C26: { name: "pricing_card.vision_data.view", group: "pricing_card", label: "Xem dữ liệu máy đọc được từ ảnh", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  C27: { name: "pricing_card.partner_price.view", group: "pricing_card", label: "Xem giá dành cho Đối tác Shop", defaultRoles: ["dieu_hanh", "dieu_phoi"], hardCap: ["dieu_hanh", "dieu_phoi"] },
  C28: { name: "pricing_card.task.delete_permanent", group: "pricing_card", label: "Xoá vĩnh viễn một việc chờ", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  D1: { name: "config.settings.view", group: "config", label: "Mở màn Cài đặt và đọc toàn bộ tham số", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D2: { name: "config.partner_tier.edit", group: "config", label: "Sửa hạng đối tác và tỷ lệ thưởng", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D3: { name: "config.surcharge.edit", group: "config", label: "Sửa nhóm phụ phí và mức phụ phí", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D4: { name: "config.priority_matrix.edit", group: "config", label: "Sửa nhãn ưu tiên và ma trận ưu tiên", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D5: { name: "config.option_list.edit", group: "config", label: "Sửa danh mục lựa chọn", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D6: { name: "config.dynamic_list.edit", group: "config", label: "Sửa danh sách linh động", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D7: { name: "config.payment_period.edit", group: "config", label: "Sửa kỳ thanh toán", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D8: { name: "config.image_folder.edit", group: "config", label: "Sửa thư mục ảnh", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D9: { name: "config.field_hint.edit", group: "config", label: "Sửa chú giải trường", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D10: { name: "config.role_cost_param.edit", group: "config", label: "Sửa tham số chi phí theo vai", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  D11: { name: "config.export", group: "config", label: "Xuất cấu hình ra tệp", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D12: { name: "config.import", group: "config", label: "Nhập cấu hình từ tệp", defaultRoles: ["dieu_hanh"] },
  D13: { name: "config.reset_default", group: "config", label: "Khôi phục cấu hình mặc định", defaultRoles: ["dieu_hanh"] },
  D14: { name: "config.price.bulk_update", group: "config", label: "Cập nhật giá toàn bộ", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D15: { name: "config.system_audit.run", group: "config", label: "Soát kỹ hệ thống", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  D16: { name: "config.labor_rate.edit", group: "config", label: "Sửa định mức tiền công theo độ khó", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  D17: { name: "config.production_price_param.edit", group: "config", label: "Đặt tham số giá của chiều tính từ giá sản xuất", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  E1: { name: "system.admin_screen.open", group: "system", label: "Mở màn Điều hành", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  E2: { name: "system.status.view", group: "system", label: "Xem trạng thái kho và mã API dạng ✓/✕", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  E3: { name: "system.api_key.view_masked", group: "system", label: "Xem bản che mã API", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  E4: { name: "system.api_key.manage", group: "system", label: "Dán mã API mới hoặc xoá mã API", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  E5: { name: "system.ai_model.change", group: "system", label: "Đổi mô hình AI", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  E6: { name: "system.shared_folder.set", group: "system", label: "Khai đường dẫn kho dùng chung", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  E7: { name: "system.folder.auto_scan", group: "system", label: "Dò kho tự động", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  E8: { name: "system.orphan_image.manage", group: "system", label: "Xem và dọn ảnh mồ côi trong kho", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
}

// ─── F–L: 38 mã mới của core — đặc tả 02 mục 4, cộng F9 (P7, đặc tả 08 mục 3) ──
// prettier-ignore
const CORE_NEW: Record<string, Omit<CapabilityDefinition, "code">> = {
  // F — Tổ chức và thành viên
  F1: { name: "org.read", group: "org_member", label: "Xem hồ sơ tổ chức", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  F2: { name: "org.update", group: "org_member", label: "Sửa hồ sơ tổ chức", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  F3: { name: "member.invite", group: "org_member", label: "Mời thành viên vào tổ chức", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  F4: { name: "member.remove", group: "org_member", label: "Gỡ thành viên khỏi tổ chức", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  F5: { name: "role.manage", group: "org_member", label: "Tạo và sửa vai, gán năng lực cho vai", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  F6: { name: "branch.read", group: "org_member", label: "Xem danh sách chi nhánh", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  F7: { name: "branch.manage", group: "org_member", label: "Tạo, sửa, đóng chi nhánh", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  F8: { name: "workspace.manage", group: "org_member", label: "Tạo và cấu hình workspace", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  // P7 — đặc tả 06 mục 11, đặc tả 08 mục 3: cấp phát/thu hồi/xoay token máy
  // gọi máy (YC-T8). Không thuộc 37 mã "F–L" gốc của đặc tả 02 mục 4 (viết
  // trước P7) — thêm ở đây vì Integration Layer cần một cổng cho CHÍNH việc
  // quản trị token, tách khỏi phạm vi quyền mà token đó mang khi gọi lại.
  F9: { name: "integration.token.manage", group: "org_member", label: "Cấp phát, xoay và thu hồi token tích hợp máy-máy", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  // G — Asset và job
  G1: { name: "asset.read", group: "asset_job", label: "Xem asset của tổ chức", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  G2: { name: "asset.upload", group: "asset_job", label: "Tải asset lên", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  G3: { name: "asset.delete", group: "asset_job", label: "Xoá asset", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  G4: { name: "job.read", group: "asset_job", label: "Xem job của chính mình", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  G5: { name: "job.read.all", group: "asset_job", label: "Xem job của toàn tổ chức", defaultRoles: ["dieu_hanh"] },
  G6: { name: "job.cancel", group: "asset_job", label: "Huỷ job đang chờ", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  G7: { name: "job.retry", group: "asset_job", label: "Chạy lại job thất bại", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  G8: { name: "usage.read", group: "asset_job", label: "Xem mức dùng và hạn mức", defaultRoles: ["dieu_hanh"] },
  G9: { name: "audit.read", group: "asset_job", label: "Đọc nhật ký kiểm toán", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  // H — Vision
  H1: { name: "vision.analyze", group: "vision", label: "Chạy phân tích ảnh sản phẩm", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  H2: { name: "vision.result.edit", group: "vision", label: "Sửa kết quả phân tích trước khi duyệt", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  H3: { name: "product.approve", group: "vision", label: "Duyệt kết quả, ghi vào Product Master", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  H4: { name: "vision.engine.manage", group: "vision", label: "Chọn bộ máy phân tích ảnh dùng cho cả tổ chức", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  // I — Tối ưu ảnh
  I1: { name: "media.optimize", group: "media", label: "Chạy job tối ưu ảnh", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  I2: { name: "media.approve", group: "media", label: "Nâng Master Image thành ảnh chính thức của sản phẩm", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  I3: { name: "media.download", group: "media", label: "Tải ảnh đã tối ưu về máy", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  // J — Kênh bán
  J1: { name: "catalog.create", group: "channel", label: "Tạo catalog", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  J2: { name: "catalog.publish", group: "channel", label: "Xuất bản catalog", defaultRoles: ["dieu_hanh"] },
  J3: { name: "landing.create", group: "channel", label: "Tạo landing page", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  J4: { name: "landing.publish", group: "channel", label: "Xuất bản landing page", defaultRoles: ["dieu_hanh"] },
  J5: { name: "social.publish", group: "channel", label: "Đăng bài lên mạng xã hội", defaultRoles: ["dieu_hanh"] },
  J6: { name: "chat.manage", group: "channel", label: "Quản lý hội thoại khách hàng", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  // L — Sản phẩm và giá
  L1: { name: "product.read", group: "product_pricing", label: "Xem sản phẩm trong Product Master", defaultRoles: ["dieu_hanh", "dieu_phoi", "sale"] },
  L2: { name: "product.create", group: "product_pricing", label: "Thêm sản phẩm mới", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  L3: { name: "product.update", group: "product_pricing", label: "Sửa thông tin sản phẩm", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  L4: { name: "product.archive", group: "product_pricing", label: "Ngừng kinh doanh một sản phẩm", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  L5: { name: "pricing.read", group: "product_pricing", label: "Xem quy tắc giá của tổ chức", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  L6: { name: "pricing.manage", group: "product_pricing", label: "Sửa quy tắc giá của tổ chức", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  // K — Trải nghiệm. Không nằm dưới quy tắc "Điều hành là tập cha": trải
  // nghiệm là một hạn mức dùng thử, không phải một mức quyền trong tổ chức.
  // U — Chính sách AI của tổ chức (đặc tả 02 mục 4, đợt AI-1). `H4` là trường
  // hợp riêng của `U2` cho đúng năng lực phân tích ảnh và giữ nguyên: nó đã có
  // màn hình riêng và luật riêng về việc bày ba bộ máy kèm trạng thái đo lường.
  // Sổ đăng ký mô hình KHÔNG nằm ở dải này — nó là dữ liệu cấp nền tảng, gác
  // bằng dải `N` với phạm vi PLATFORM.
  U1: { name: "ai.policy.read", group: "ai_policy", label: "Xem chính sách AI của tổ chức", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  U2: { name: "ai.policy.manage", group: "ai_policy", label: "Đặt chính sách AI của tổ chức", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  U3: { name: "ai.request.read", group: "ai_policy", label: "Đọc sổ chi phí và chất lượng từng lời gọi mô hình", defaultRoles: ["dieu_hanh"], hardCap: ["dieu_hanh"] },
  U4: { name: "ai.eval.read", group: "ai_policy", label: "Xem điểm chấm của một đầu ra AI", defaultRoles: ["dieu_hanh", "dieu_phoi"] },
  K1: { name: "experience.use", group: "experience", label: "Dùng workspace trải nghiệm trong hạn mức", defaultRoles: ["experience_user"] },
  K2: { name: "experience.convert", group: "experience", label: "Chuyển workspace trải nghiệm thành tổ chức thật", defaultRoles: ["experience_user", "dieu_hanh"] },
}

const ALL: Record<string, Omit<CapabilityDefinition, "code">> = { ...HARVESTED, ...CORE_NEW }

export const CAPABILITIES: Readonly<Record<string, CapabilityDefinition>> = Object.fromEntries(
  Object.entries(ALL).map(([code, def]) => [code, { code, ...def }])
)

export type CapabilityCode = keyof typeof ALL

export const ALL_CAPABILITY_CODES: readonly string[] = Object.keys(CAPABILITIES)

export function isCapabilityCode(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(CAPABILITIES, value)
}

export function capability(code: string): CapabilityDefinition {
  const def = CAPABILITIES[code]
  if (!def) throw new Error(`Mã năng lực không tồn tại: ${code}`)
  return def
}

/** Trần cứng của một mã, hoặc `null` nếu mã không có trần. */
export function hardCapOf(code: string): readonly SystemRoleKey[] | null {
  return capability(code).hardCap ?? null
}

/** Mã nào bị trần cứng chặn — dùng cho `YC-Q3` và tài liệu. */
export const HARD_CAPPED_CODES: readonly string[] = ALL_CAPABILITY_CODES.filter(
  (code) => capability(code).hardCap !== undefined
)

/**
 * Bốn cặp chạy/duyệt tách rời — đặc tả 02 mục 5. Gói chung bất kỳ cặp nào là
 * lỗi chặn ở review (`YC-Q6`); danh sách này là chỗ một bộ test khoá bất biến
 * đó lại.
 */
export const SPLIT_CAPABILITY_PAIRS: ReadonlyArray<{
  readonly run: string
  readonly approve: string
}> = [
  { run: "H1", approve: "H3" },
  { run: "I1", approve: "I2" },
  { run: "J1", approve: "J2" },
  { run: "J3", approve: "J4" },
]

/**
 * Mặc định lớp một, cho một vai HỆ THỐNG cụ thể — dùng để nạp
 * `role_capabilities` lúc `ensureSystemRoles` (đặc tả 07 mục 3). Vai riêng
 * của tổ chức không có mặc định: tổ chức bật thẳng từng mã cho vai đó.
 */
export function defaultCodesForSystemRole(roleKey: SystemRoleKey): string[] {
  return ALL_CAPABILITY_CODES.filter((code) => capability(code).defaultRoles.includes(roleKey))
}
