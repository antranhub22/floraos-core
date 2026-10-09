/**
 * Trạng thái giao diện của "Theo dõi tiến độ": view đang xem + bộ lọc/sắp xếp/cột DÙNG CHUNG cho
 * mọi view (đổi view không mất bộ lọc). Không chứa dữ liệu đơn — chỉ là tham số gửi lên lớp truy vấn
 * `/api/v1/greeting-card/tracking`. View tự lưu nằm trên máy người dùng (PO 06/10/2026).
 */
import type { SlaState, SortField } from "@/modules/greeting-card/domain/tracking-views"
import type { TrackingCategory } from "@/modules/greeting-card/domain/tracking-filters"
import type { StepOwner } from "@/modules/greeting-card/domain/step-sla"

export type ViewKind = "kanban" | "list" | "calendar" | "timeline" | "queue" | "dashboard"

export const VIEW_TABS: Array<{ id: ViewKind; label: string }> = [
  { id: "kanban", label: "Kanban" },
  { id: "list", label: "Danh sách" },
  { id: "calendar", label: "Lịch" },
  { id: "timeline", label: "Timeline" },
  { id: "queue", label: "Công việc" },
  { id: "dashboard", label: "Dashboard" },
]

export const LIST_COLUMNS = [
  { id: "code", label: "Mã đơn/link" },
  { id: "customer", label: "Khách" },
  { id: "sale", label: "Nhân sự phụ trách" },
  { id: "step", label: "Bước hiện tại" },
  { id: "age", label: "Ở bước" },
  { id: "sla", label: "Thời gian chuẩn" },
  { id: "total", label: "Giá trị" },
  { id: "delivery", label: "Giao" },
  { id: "product", label: "Mẫu" },
  { id: "channel", label: "Kênh" },
  { id: "phone", label: "SĐT khách" },
] as const
export type ListColumn = (typeof LIST_COLUMNS)[number]["id"]
export const DEFAULT_COLUMNS: ListColumn[] = ["code", "customer", "sale", "step", "age", "sla", "total", "delivery"]

export interface TrackingViewState {
  view: ViewKind
  q: string
  category: TrackingCategory | ""
  saleId: string
  type: "" | "ORDER" | "SESSION"
  sla: "" | SlaState | "ATTENTION"
  owner: "" | StepOwner
  deliveryFrom: string
  deliveryTo: string
  sort: SortField
  dir: "asc" | "desc"
  columns: ListColumn[]
}

export const DEFAULT_STATE: TrackingViewState = {
  view: "kanban", q: "", category: "", saleId: "", type: "", sla: "", owner: "",
  deliveryFrom: "", deliveryTo: "", sort: "urgency", dir: "desc", columns: DEFAULT_COLUMNS,
}

/** Tham số lớp truy vấn — chỉ gửi trường có giá trị. `view` là view của máy chủ (timeline dùng list). */
export function queryString(s: TrackingViewState, extra: Record<string, string | number | undefined> = {}): string {
  const p = new URLSearchParams()
  const add = (k: string, v: string | number | undefined) => { if (v !== undefined && v !== "") p.set(k, String(v)) }
  add("q", s.q.trim()); add("category", s.category); add("saleId", s.saleId); add("type", s.type); add("sla", s.sla)
  add("owner", s.owner); add("deliveryFrom", s.deliveryFrom); add("deliveryTo", s.deliveryTo); add("sort", s.sort); add("dir", s.dir)
  for (const [k, v] of Object.entries(extra)) add(k, v)
  return p.toString()
}

export interface SavedView {
  id: string
  name: string
  state: Partial<TrackingViewState>
  /** `me` = người đang đăng nhập (Đơn của tôi) */
  scope?: "me" | undefined
}

const today = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)

/** View mẫu có sẵn. "Đơn của Sale X" = chọn sale ở bộ lọc rồi lưu thành view riêng. */
export function presetViews(): SavedView[] {
  const d = today()
  return [
    { id: "mine", name: "Đơn của tôi", scope: "me", state: { view: "list" } },
    { id: "today", name: "Đơn giao hôm nay", state: { view: "calendar", deliveryFrom: d, deliveryTo: d } },
    { id: "stuck", name: "Đơn đang kẹt", state: { view: "list", category: "STUCK", sort: "urgency", dir: "desc" } },
    { id: "overdue", name: "Đơn quá thời gian chuẩn", state: { view: "list", sla: "OVERDUE", sort: "age", dir: "desc" } },
    { id: "todo", name: "Đơn cần xử lý", state: { view: "queue" } },
  ]
}

const STORE_KEY_PREFIX = "floraos:tracking:saved-views"
function getStoreKey(orgId?: string | null): string {
  return orgId ? `${STORE_KEY_PREFIX}__${orgId}` : STORE_KEY_PREFIX
}

export function loadSavedViews(orgId?: string | null): SavedView[] {
  try {
    const raw = window.localStorage.getItem(getStoreKey(orgId))
    const list = raw ? (JSON.parse(raw) as SavedView[]) : []
    return Array.isArray(list) ? list.filter((v) => v && typeof v.name === "string").slice(0, 30) : []
  } catch {
    return []
  }
}

export function storeSavedViews(list: SavedView[], orgId?: string | null): void {
  try {
    window.localStorage.setItem(getStoreKey(orgId), JSON.stringify(list.slice(0, 30)))
  } catch {
    // bộ nhớ trình duyệt bị chặn — view tự lưu không giữ được, trang vẫn chạy
  }
}
