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

/**
 * 6 Cam kết cốt lõi — nội dung PO chốt 08/10/2026. Chỉ là mặc định: tiệm sửa/thêm/xóa trong
 * Hồ sơ tiệm; đã lưu `store_policies` thì không còn dùng bộ này.
 */
export const DEFAULT_COMMITMENTS: CommitmentItem[] = [
  { id: "commit-match-sample", title: "Đúng mẫu – đúng tone màu", customerText: "Sản phẩm được thực hiện theo mẫu quý khách đã chọn, giữ đúng phong cách, tone màu và bố cục chính của thiết kế.", internalText: "Thợ cắm đối chiếu chặt chẽ với ảnh mẫu (phong cách, tone màu, bố cục) trước khi chuyển QC." },
  { id: "commit-match-value", title: "Đúng hoa chính – đúng cấu phần", customerText: "Đúng loại hoa chính, số lượng và các hạng mục đã được xác nhận trong đơn hàng.", internalText: "Đảm bảo đúng chủng loại, số lượng hoa chính và các hạng mục đã xác nhận theo BOM." },
  { id: "commit-qc", title: "Hoa tươi – kiểm tra trước khi giao", customerText: "Hoa và sản phẩm hoàn thiện đều được kiểm tra chất lượng, độ tươi và hình thức trước khi rời tiệm.", internalText: "Chụp ảnh QC và đối chiếu checklist kiểm định." },
  { id: "commit-send-photo", title: "Xem ảnh hoa thật trước khi giao", customerText: "Quý khách được xem ảnh sản phẩm thực tế sau khi hoàn thiện, trước khi đơn hàng được giao đi.", internalText: "Tải ảnh sản phẩm hoàn thiện lên hệ thống cho khách xem." },
  { id: "commit-delivery-time", title: "Giao đúng khung giờ đã xác nhận", customerText: "Tiệm chủ động chuẩn bị và điều phối để giao hoa trong khung giờ quý khách đã chọn và được xác nhận.", internalText: "Điều phối điều xe trước 45 phút so với mốc hẹn khách." },
  { id: "commit-support", title: "Tiệm chịu trách nhiệm đến cùng", customerText: "Mọi phản hồi về sản phẩm hoặc giao hàng đều được tiệm tiếp nhận và phối hợp xử lý nhanh chóng.", internalText: "Chăm sóc sau giao trong vòng 24h." },
]

/** 7 Thỏa thuận minh bạch với khách hàng — nội dung PO chốt 08/10/2026; tiệm được sửa như Cam kết. */
export const DEFAULT_AGREEMENTS: AgreementItem[] = [
  { id: "agree-substitute-flowers", title: "Hoa phụ có thể thay tương đương", customerText: "Nếu hoa phụ hoặc phụ kiện không có sẵn hay chưa đạt độ đẹp tại thời điểm thực hiện, tiệm có thể thay bằng loại tương đương, giữ nguyên tone màu, phong cách và tổng thể thiết kế.", internalText: "Chỉ thay hoa phụ/phụ kiện có màu sắc tương đồng." },
  { id: "agree-color-variation", title: "Màu sắc có thể khác nhẹ", customerText: "Hoa tươi là sản phẩm tự nhiên nên màu sắc, kích thước và độ nở từng bông có thể khác nhẹ so với hình ảnh trên màn hình. Tiệm ưu tiên giữ đúng tone màu tổng thể của mẫu.", internalText: "Giải thích rõ yếu tố tự nhiên nếu khách thắc mắc." },
  { id: "agree-natural-variance", title: "Sản phẩm làm thủ công", customerText: "Mỗi sản phẩm được cắm và hoàn thiện bằng tay nên có thể khác nhỏ về hình dáng hoặc bố cục so với ảnh mẫu, nhưng vẫn giữ phong cách và tinh thần thiết kế đã chọn.", internalText: "Tôn trọng tính thủ công độc bản của nghệ nhân." },
  { id: "agree-main-flower-replacement", title: "Hoa chính chỉ thay sau khi trao đổi", customerText: "Nếu hoa chính không đạt tiêu chuẩn hoặc không thể cung cấp, tiệm sẽ liên hệ để cùng quý khách thống nhất phương án thay thế trước khi thực hiện.", internalText: "Bắt buộc liên hệ và được khách đồng ý trước khi thay hoa chính." },
  { id: "agree-delivery-adjustment", title: "Giờ giao có thể điều chỉnh", customerText: "Khi không liên lạc được người nhận, thông tin giao hàng thay đổi, thời tiết xấu hoặc có sự cố ngoài khả năng kiểm soát, giờ giao có thể được điều chỉnh. Tiệm sẽ chủ động thông báo và cùng quý khách chọn phương án phù hợp.", internalText: "Tài xế gọi tối thiểu 3 cuộc trước khi hẹn lại." },
  { id: "agree-order-change", title: "Thay đổi thông tin đơn hàng", customerText: "Sau khi đơn đã được xác nhận hoặc bắt đầu thực hiện, việc đổi mẫu, địa chỉ, giờ giao hay nội dung đơn có thể ảnh hưởng đến chi phí và thời gian giao. Tiệm sẽ thông báo trước khi áp dụng.", internalText: "Báo khách chi phí/thời gian phát sinh và chờ khách đồng ý trước khi áp dụng thay đổi." },
  { id: "agree-cancellation-policy", title: "Hủy đơn và hoàn tiền", customerText: "Quý khách có thể yêu cầu hủy đơn trước khi tiệm bắt đầu thực hiện. Sau khi đơn đã được chuẩn bị hoặc hoàn thiện, việc hủy hoặc hoàn tiền sẽ được giải quyết theo tình trạng thực tế của đơn.", internalText: "Áp dụng theo workflow duyệt của Điều hành." },
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
