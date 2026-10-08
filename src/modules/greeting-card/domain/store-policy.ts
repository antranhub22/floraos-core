/**
 * Quản lý Ưu đãi, Cam kết & Thỏa thuận (Task #2 & Task #5).
 * - Ưu đãi = Khách được nhận gì (khách chọn tối đa 01 ưu đãi khi đặt).
 * - Cam kết = Cửa hàng chắc chắn thực hiện/cung cấp đúng chuẩn công bố.
 * - Thỏa thuận = Tình huống có thể xảy ra và khách đã được thông báo trước (bắt buộc xác nhận trước khi đặt).
 * Pure TypeScript.
 */
import { promotionPricingOf, type PromotionKind } from "./promotion-pricing"

export interface PromotionItem {
  id: string
  title: string
  description: string
  /** Loại tính tiền (PO 08/10/2026); thiếu → suy từ `config.percent`, còn lại là Tặng kèm. */
  kind?: PromotionKind | undefined
  /** Ví dụ: `{ percent: 10 }` cho Giảm %. */
  config?: Record<string, unknown> | undefined
  /** Điều hành bật/tắt theo từng thời điểm trong Hồ sơ tiệm (PO 08/10/2026); thiếu = đang áp dụng. */
  active?: boolean | undefined
}

export interface CommitmentItem {
  id: string
  title: string
  customerText: string
  internalText?: string | undefined
}

export interface AgreementItem {
  id: string
  title: string
  customerText: string
  internalText?: string | undefined
}

export interface StorePoliciesConfig {
  promotions: PromotionItem[]
  commitments: CommitmentItem[]
  agreements: AgreementItem[]
}

/**
 * Ưu đãi mặc định — đúng 3 lựa chọn PO chốt 08/10/2026 (khách chọn tối đa 01): Giảm 10% trên tổng
 * đơn (trừ tiền thật), Tặng thiệp, Thêm phụ liệu. Thay 9 ưu đãi mẫu cũ chỉ ghi chú mà không trừ tiền.
 */
export const DEFAULT_PROMOTIONS: PromotionItem[] = [
  { id: "promo-discount-10", title: "Giảm 10%", description: "Giảm 10% trên tổng giá trị đơn hàng.", kind: "PERCENT_OFF", config: { percent: 10 } },
  { id: "promo-free-card", title: "Tặng thiệp", description: "Tặng 01 thiệp chúc mừng kèm lời nhắn của bạn.", kind: "GIFT" },
  { id: "promo-accessory", title: "Thêm phụ liệu", description: "Thêm phụ liệu trang trí để bó hoa đẹp hơn.", kind: "GIFT" },
]

/** 6 Cam kết cốt lõi */
export const DEFAULT_COMMITMENTS: CommitmentItem[] = [
  { id: "commit-match-sample", title: "Đúng mẫu đã chọn", customerText: "Sản phẩm được thực hiện theo đúng mẫu, phong cách và thiết kế đã lựa chọn.", internalText: "Thợ cắm đối chiếu chặt chẽ với ảnh mẫu trước khi chuyển QC." },
  { id: "commit-match-value", title: "Đúng giá trị sản phẩm", customerText: "Sản phẩm được cung cấp đúng giá trị và khối lượng hoa tương xứng với mức giá.", internalText: "Đảm bảo đúng chủng loại và số lượng hoa chính theo BOM." },
  { id: "commit-delivery-time", title: "Giao trong khung giờ đã chọn", customerText: "Giao hoa đúng khung giờ quý khách đã chọn khi đặt hàng.", internalText: "Điều phối điều xe trước 45 phút so với mốc hẹn khách." },
  { id: "commit-qc", title: "Kiểm tra trước khi giao", customerText: "Sản phẩm được kiểm tra chất lượng và độ tươi nghiêm ngặt trước khi xuất xưởng.", internalText: "Chụp ảnh QC và đối chiếu checklist kiểm định." },
  { id: "commit-send-photo", title: "Gửi ảnh sản phẩm", customerText: "Gửi hình ảnh sản phẩm hoàn thiện để quý khách xem trước khi giao hàng.", internalText: "Tải ảnh sản phẩm hoàn thiện lên hệ thống cho khách xem." },
  { id: "commit-support", title: "Hỗ trợ khách hàng", customerText: "Tiếp nhận và hỗ trợ mọi phản hồi nhanh chóng theo chính sách chăm sóc của tiệm.", internalText: "Chăm sóc sau giao trong vòng 24h." },
]

/** 7 Thỏa thuận minh bạch với khách hàng */
export const DEFAULT_AGREEMENTS: AgreementItem[] = [
  { id: "agree-substitute-flowers", title: "Hoa có thể được thay thế", customerText: "Một số loại hoa phụ có thể được thay thế nếu không có sẵn hoặc không đạt độ nở đẹp nhất tại thời điểm thực hiện.", internalText: "Chỉ thay hoa phụ có màu sắc tương đồng." },
  { id: "agree-color-variation", title: "Màu sắc có thể sai khác nhẹ", customerText: "Màu sắc thực tế có thể có sai khác tự nhiên do đặc tính sinh học của hoa tươi và ánh sáng hiển thị.", internalText: "Giải thích rõ yếu tố tự nhiên nếu khách thắc mắc." },
  { id: "agree-natural-variance", title: "Sản phẩm có thể khác mẫu", customerText: "Sản phẩm thủ công thực tế có thể có khác biệt tự nhiên so với ảnh mẫu nhưng vẫn giữ nguyên phong cách và tổng thể thiết kế.", internalText: "Tôn trọng tính thủ công độc bản của nghệ nhân." },
  { id: "agree-seasonal", title: "Hoa theo mùa", customerText: "Một số loại hoa nhập hoặc phụ kiện trang trí có thể thay đổi tùy thuộc vào mùa vụ và nguồn cung ứng.", internalText: "Báo khách nếu có giống hoa theo mùa đặc thù." },
  { id: "agree-main-flower-replacement", title: "Thay thế hoa chính", customerText: "Nếu cần thay thế hoa chính do chất lượng hoa không đạt, cửa hàng sẽ ưu tiên loại hoa tương đương hoặc có giá trị cao hơn.", internalText: "Phải liên hệ xin ý kiến khách nếu thay hoa chính." },
  { id: "agree-delivery-adjustment", title: "Thời gian giao có thể thay đổi", customerText: "Thời gian giao hoa có thể xê dịch trong trường hợp thời tiết bất khả kháng hoặc người nhận chưa kịp nghe máy.", internalText: "Tài xế gọi tối thiểu 3 cuộc trước khi hẹn lại." },
  { id: "agree-cancellation-policy", title: "Chính sách Hủy / Hoàn tiền", customerText: "Việc hủy hoặc hoàn tiền áp dụng theo tiến độ thực tế (khi xưởng chưa cắm hoa hoặc theo thỏa thuận cụ thể).", internalText: "Áp dụng theo workflow duyệt của Điều hành." },
]

export const STORE_POLICIES_SETTINGS_KEY = "store_policies"

export function parseStorePolicies(settings: unknown): StorePoliciesConfig {
  const root = settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {}
  const raw = root[STORE_POLICIES_SETTINGS_KEY] as Partial<StorePoliciesConfig> | undefined
  const promotions = cleanItems<PromotionItem>(raw?.promotions, "description")
  const commitments = cleanItems<CommitmentItem>(raw?.commitments, "customerText")
  const agreements = cleanItems<AgreementItem>(raw?.agreements, "customerText")
  return {
    promotions: promotions.length > 0 ? promotions : DEFAULT_PROMOTIONS,
    commitments: commitments.length > 0 ? commitments : DEFAULT_COMMITMENTS,
    agreements: agreements.length > 0 ? agreements : DEFAULT_AGREEMENTS,
  }
}

const MAX_POLICY_ITEMS = 50

/** Bỏ mục hỏng (thiếu id/tiêu đề/nội dung dạng chuỗi) — dữ liệu này hiện ra trang công khai. */
function cleanItems<T>(value: unknown, textKey: "description" | "customerText"): T[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is Record<string, unknown> =>
      Boolean(v) && typeof v === "object" &&
      typeof (v as Record<string, unknown>).id === "string" &&
      typeof (v as Record<string, unknown>).title === "string" &&
      typeof (v as Record<string, unknown>)[textKey] === "string")
    .slice(0, MAX_POLICY_ITEMS) as T[]
}

export type PublicAppliedPolicies = {
  promotions: Array<{ id: string; title: string; customerText: string; kind: PromotionKind; percent: number | null }>
  commitments: Array<{ id: string; title: string; customerText: string }>
  agreements: Array<{ id: string; title: string; customerText: string }>
  allowCustomerPromotionChoice: boolean
}

export function resolveAppliedPolicies(
  catalogFilters: unknown,
  orgSettings: unknown,
): PublicAppliedPolicies {
  const all = parseStorePolicies(orgSettings)
  const filters = catalogFilters && typeof catalogFilters === "object" ? (catalogFilters as Record<string, unknown>) : {}
  const applied = filters.appliedPolicies as {
    promotionIds?: string[]
    commitmentIds?: string[]
    agreementIds?: string[]
    allowCustomerPromotionChoice?: boolean
  } | undefined

  const promoFilter = applied?.promotionIds
  const commitFilter = applied?.commitmentIds
  const agreeFilter = applied?.agreementIds

  const activePromotions = all.promotions.filter((p) => p.active !== false)
  const promotions = (promoFilter ? activePromotions.filter((p) => promoFilter.includes(p.id)) : activePromotions).map(
    (p) => ({ id: p.id, title: p.title, customerText: p.description, ...promotionPricingOf(p) })
  )
  const commitments = (commitFilter ? all.commitments.filter((c) => commitFilter.includes(c.id)) : all.commitments).map(
    ({ id, title, customerText }) => ({ id, title, customerText })
  )
  const agreements = (agreeFilter ? all.agreements.filter((a) => agreeFilter.includes(a.id)) : all.agreements).map(
    ({ id, title, customerText }) => ({ id, title, customerText })
  )

  return {
    promotions,
    commitments,
    agreements,
    allowCustomerPromotionChoice: applied?.allowCustomerPromotionChoice ?? true,
  }
}
