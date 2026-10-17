/**
 * Danh mục tình huống nghiệp vụ Thẻ chào — kiểu dữ liệu (PO 17/10/2026).
 * Một tình huống = một trạng thái nhận ra được của link/đơn mà một vai nhân viên phải (hoặc nên) làm
 * bước tiếp theo. Danh mục là SSOT: tài liệu `docs/dac-ta/HUONG_DAN_TINH_HUONG_THE_CHAO.md` sinh ra từ
 * đây, và sau này giao diện đọc đúng dữ liệu này để hiện "Bước tiếp theo". Pure TypeScript.
 */

/**
 * Vai nhân viên có hướng dẫn. Thêm vai mới: thêm vào đây + `GUIDE_ROLE_LABEL` — test buộc mọi vai của
 * Hộp việc (`MessageRole`) đều có mặt, và mọi tình huống giao việc cho vai đó phải có bước cho vai đó.
 */
export const GUIDE_ROLES = ["ADMIN", "SALE", "COORDINATOR"] as const
export type GuideRole = (typeof GUIDE_ROLES)[number]
export const GUIDE_ROLE_LABEL: Record<GuideRole, string> = { ADMIN: "Điều hành", SALE: "Sale", COORDINATOR: "Điều phối" }

/** Nơi thao tác. Nhãn tab lấy từ từ điển màn hình (`greetingCardVi.tabs`) khi dựng tài liệu. */
export type GuideTab = "catalogs" | "tracking" | "sales" | "operation" | "coordination" | "inbox" | "orderDetail" | "customerLink"

export type SituationGroup = "LINK" | "ORDER_INTAKE" | "PAYMENT" | "PRODUCTION" | "DELIVERY" | "CANCELLATION" | "CHANGE"

export const SITUATION_GROUP_LABEL: Record<SituationGroup, string> = {
  LINK: "Link và khách đang xem",
  ORDER_INTAKE: "Tiếp nhận đơn",
  PAYMENT: "Thanh toán",
  PRODUCTION: "Cắm hoa và duyệt ảnh",
  DELIVERY: "Giao hoa",
  CANCELLATION: "Huỷ đơn và hoàn tiền",
  CHANGE: "Khách xin đổi, giảm giá, đổi mẫu",
}

export interface GuideStep {
  /** Việc cần làm — câu ngắn, tiếng Việt tự nhiên, không mã kỹ thuật. */
  do: string
  where?: {
    tab?: GuideTab
    /** Nhãn nút ĐÚNG như trên màn hình — test kiểm nhãn còn tồn tại trong mã giao diện. */
    button?: string
  }
}

export interface Situation {
  id: string
  group: SituationGroup
  title: string
  /** Nhận biết: đơn/link đang thế nào (lời thường). */
  recognize: string
  /** Vai phải làm bước tiếp theo. Rỗng = chỉ chờ khách hoặc hệ thống. */
  owners: readonly GuideRole[]
  /** Vai chỉ cần biết (không phải làm). */
  informed?: readonly GuideRole[]
  /** Bước tiếp theo theo vai — bắt buộc có cho mọi vai trong `owners`. */
  steps: Partial<Record<GuideRole, readonly GuideStep[]>>
  /** Hạn xử lý (lời thường) — nếu có. */
  deadline?: string
  /** Hệ thống tự làm gì nếu không ai xử lý / khi xong. */
  automation?: string
  /** Tình huống kế tiếp có thể xảy ra. */
  next: readonly string[]
  notes?: readonly string[]
}
