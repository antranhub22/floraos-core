/**
 * Khai báo trường lõi CỦA ĐIỀU PHỐI cho Sổ đăng ký trường nền tảng (ĐP-3
 * §6.2 mục 3.2). Coordinator tự khai trường của mình ở đây — không khai ở
 * `field-platform/domain` — để field-platform không phải import ngược vào
 * coordinator (tránh vòng phụ thuộc, giữ field-platform là hạ tầng dùng
 * chung cho mọi module sau này).
 *
 * ĐỢT ĐẦU (26/09/2026, ĐP-3): mới khai một lô đại diện các trường lõi ĐÃ
 * XÂY thật trong `order-view.ts`/`http-schemas.ts` — KHÔNG PHẢI toàn bộ 90
 * mục "CÓ" của Đặc tả trường §18. Khai nốt phần còn lại là việc chép dữ
 * liệu (không phải kiến trúc mới), để làm dần khi mỗi giai đoạn ĐP-4 xây
 * thêm trường — mỗi trường mới bắt buộc khai ở đây CÙNG LƯỢT (quy tắc
 * chung #7 của kế hoạch). `scripts/check-field-registry.ts` không đòi phủ
 * 100% Đặc tả trường; nó chỉ đòi những gì đã khai ở đây phải khớp thật với
 * `order-view.ts` và danh mục hành vi thật — nói cách khác, sổ có thể
 * CHƯA ĐẦY ĐỦ nhưng không được phép SAI.
 */
import type { CoreFieldDefinition } from "@/modules/field-platform/domain/core-field-registry"
import { INTERNAL_ONLY_VISIBILITY } from "@/modules/field-platform/domain/core-field-registry"

const ALL_VISIBLE_EXCEPT_CUSTOMER = { INTERNAL: true, PARTNER: true, SHIPPER: true, CUSTOMER: false } as const
const INTERNAL_AND_PARTNER = { INTERNAL: true, PARTNER: true, SHIPPER: false, CUSTOMER: false } as const

export const COORDINATOR_CORE_FIELDS: readonly CoreFieldDefinition[] = [
  // ── Người mua (Sales Order Intake, T01) ───────────────────────────────
  {
    key: "customerName",
    entity: "ORDER",
    dataType: "TEXT",
    label: "Tên người mua",
    requirement: "REQUIRED",
    requiredAtStage: "INTAKE",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.buyer", order: 1 }],
  },
  {
    key: "customerPhone",
    entity: "ORDER",
    dataType: "PHONE",
    label: "SĐT người mua",
    requirement: "REQUIRED",
    requiredAtStage: "INTAKE",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "PII",
    placements: [{ placement: "T01.buyer", order: 2 }],
  },
  {
    key: "customerId",
    entity: "ORDER",
    dataType: "TEXT",
    label: "Khách hàng (từ Customer Master Index)",
    description: "Có thì tên/SĐT/hạng lấy từ CMI, bỏ qua giá trị nhập tay (ĐP-2.9).",
    requirement: "OPTIONAL",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.buyer", order: 0 }],
  },
  // ── Người nhận ─────────────────────────────────────────────────────────
  {
    key: "recipientName",
    entity: "ORDER",
    dataType: "TEXT",
    label: "Tên người nhận",
    requirement: "REQUIRED",
    requiredAtStage: "INTAKE",
    visibility: ALL_VISIBLE_EXCEPT_CUSTOMER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.recipient", order: 1 }],
  },
  {
    key: "recipientPhone",
    entity: "ORDER",
    dataType: "PHONE",
    label: "SĐT người nhận",
    requirement: "REQUIRED",
    requiredAtStage: "INTAKE",
    visibility: { INTERNAL: true, PARTNER: false, SHIPPER: true, CUSTOMER: false },
    sensitivity: "PII",
    placements: [{ placement: "T01.recipient", order: 2 }],
  },
  // ── Sản phẩm ───────────────────────────────────────────────────────────
  {
    key: "productId",
    entity: "ORDER",
    dataType: "TEXT",
    label: "Sản phẩm (Product Master Index)",
    description: "Tuỳ chọn — vẫn tạo được đơn mẫu ngoài danh mục (ĐP-2.6).",
    requirement: "OPTIONAL",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.product", order: 1 }],
  },
  {
    key: "productTitle",
    entity: "ORDER",
    dataType: "TEXT",
    label: "Tên sản phẩm hiển thị trên đơn",
    requirement: "REQUIRED",
    requiredAtStage: "INTAKE",
    visibility: ALL_VISIBLE_EXCEPT_CUSTOMER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.product", order: 2 }],
  },
  {
    key: "sampleAssetId",
    entity: "ORDER",
    dataType: "ASSET_REF",
    label: "Ảnh mẫu",
    requirement: "RECOMMENDED",
    visibility: INTERNAL_AND_PARTNER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.product", order: 3 }],
  },
  // ── Địa chỉ giao ───────────────────────────────────────────────────────
  {
    key: "deliveryAddress",
    entity: "ORDER",
    dataType: "STRUCTURED_ADDRESS",
    label: "Địa chỉ giao (4 tầng)",
    requirement: "REQUIRED",
    requiredAtStage: "INTAKE",
    visibility: { INTERNAL: true, PARTNER: false, SHIPPER: true, CUSTOMER: false },
    sensitivity: "PII",
    placements: [{ placement: "T01.delivery", order: 1 }],
  },
  {
    key: "deliveryTargetAt",
    entity: "ORDER",
    dataType: "DATETIME",
    label: "Thời điểm giao mong muốn",
    requirement: "RECOMMENDED",
    visibility: ALL_VISIBLE_EXCEPT_CUSTOMER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.delivery", order: 2 }],
  },
  // ── Thiệp ──────────────────────────────────────────────────────────────
  {
    key: "cardRequired",
    entity: "ORDER",
    dataType: "BOOLEAN",
    label: "Có thiệp không",
    requirement: "OPTIONAL",
    visibility: INTERNAL_AND_PARTNER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.card", order: 1 }],
  },
  {
    key: "cardMessage",
    entity: "ORDER",
    dataType: "LONG_TEXT",
    label: "Lời thiệp",
    description: "Bắt buộc khi cardRequired = true — luật điều kiện nằm ở http-schemas.ts, chưa chuyển vào cổng bắt buộc-theo-bước (3.10) ở đợt này.",
    requirement: "RECOMMENDED",
    visibility: INTERNAL_AND_PARTNER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.card", order: 2 }],
  },
  // ── Ghi chú — hai kênh tách biệt (ĐP-1.7) ────────────────────────────────
  {
    key: "internalNote",
    entity: "ORDER",
    dataType: "LONG_TEXT",
    label: "Ghi chú nội bộ",
    requirement: "OPTIONAL",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "NORMAL",
    placements: [{ placement: "T01.note", order: 1 }],
  },
  {
    key: "partnerInstruction",
    entity: "ORDER",
    dataType: "LONG_TEXT",
    label: "Ghi chú phân công cho đối tác",
    requirement: "OPTIONAL",
    visibility: INTERNAL_AND_PARTNER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T06.assign", order: 1 }],
  },
  // ── Tiền — mức sàn: giá bán/trả đối tác không hiện ra ngoài INTERNAL/PARTNER phù hợp ──
  {
    key: "unitPriceVnd",
    entity: "ORDER",
    dataType: "MONEY_VND",
    label: "Giá bán cho khách",
    description: "Mức sàn: KHÔNG hiện với PARTNER/SHIPPER/CUSTOMER (ĐP-1.1 — gỡ khỏi PNG T07).",
    requirement: "REQUIRED",
    requiredAtStage: "INTAKE",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "NORMAL",
    floorInternalOnly: true,
    placements: [{ placement: "T01.pricing", order: 1 }],
  },
  {
    key: "partnerPayoutVnd",
    entity: "ORDER",
    dataType: "MONEY_VND",
    label: "Số tiền trả đối tác",
    requirement: "OPTIONAL",
    visibility: INTERNAL_AND_PARTNER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T06.assign", order: 2 }],
  },
  // ── Đối tác (PARTNER entity) ─────────────────────────────────────────────
  {
    key: "partnerName",
    entity: "PARTNER",
    dataType: "TEXT",
    label: "Tên đối tác",
    requirement: "REQUIRED",
    visibility: INTERNAL_AND_PARTNER,
    sensitivity: "NORMAL",
    placements: [{ placement: "T06.candidate", order: 1 }],
  },
  {
    key: "partnerPhone",
    entity: "PARTNER",
    dataType: "PHONE",
    label: "SĐT đối tác",
    requirement: "REQUIRED",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "PII",
    placements: [{ placement: "T06.candidate", order: 2 }],
  },
  {
    key: "partnerAddress",
    entity: "PARTNER",
    dataType: "TEXT",
    label: "Địa chỉ đối tác",
    requirement: "OPTIONAL",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "NORMAL",
    placements: [{ placement: "T06.candidate", order: 3 }],
  },
  {
    key: "partnerCapacityDaily",
    entity: "PARTNER",
    dataType: "NUMBER",
    label: "Công suất mỗi ngày",
    requirement: "OPTIONAL",
    visibility: INTERNAL_ONLY_VISIBILITY,
    sensitivity: "NORMAL",
    placements: [{ placement: "T06.candidate", order: 4 }],
  },
] as const
