/**
 * Đọc số và làm sạch văn bản nhập tay — ba hàm thuần từ
 * `FloraOS/floraos-web/src/lib/locTraCuu.ts` (thu hoạch R... M03, phần
 * KHÔNG phụ thuộc dữ liệu "thẻ chào giá"): `docSo` → `parseFlexibleNumber`,
 * `docTyLeUuDai` → `normalizePercent`, `lamSachCanhBao` → `sanitizeWarningText`.
 *
 * Ba hàm này KHÔNG mang theo hàm `locTraCuu()` (bản gốc) — hàm đó lọc một
 * BẢN GHI GIÁ ĐÃ TÍNH SẴN (giá bán công bố, khoảng giá chào khách/shop…) mà
 * v1 đọc trực tiếp từ Excel; dữ liệu ấy chỉ tồn tại một khi luồng "thẻ chào
 * giá" (nhóm năng lực `pricing_card`, ngoài phạm vi P6 — xem `pricing.ts`)
 * được xây. Ba hàm ở đây tự đứng được và có ích ngay: `normalizePercent`
 * dùng để nhận giá trị người dùng gõ vào `PUT /pricing-rules` (chấp nhận
 * "10%", "10" hay "0.1" cho một tỷ lệ), `parseFlexibleNumber` là hàng phòng
 * thủ chung khi một giá trị số tới từ nhập tay. `sanitizeWarningText` chưa
 * có điểm nối trong P6 (hợp đồng Vision hiện không có trường cảnh báo tự do
 * nhắc tới giá vốn) — giữ lại kèm test vì luật của nó ("không được lộ giá
 * vốn qua một câu cảnh báo tự do") vẫn đúng bất cứ khi nào một trường như
 * vậy xuất hiện, ghi ở `TECHNICAL_DEBT.md` #26.
 */

const WHITESPACE = /[\s ]/g

/**
 * Đổi một ô nhập tay thành số, hoặc `null` khi không đổi được.
 *
 * Chấp nhận đủ kiểu: số thật, `"1.234.567"` (chấm phân cách nghìn kiểu Việt),
 * `"1,234,567"` (phẩy phân cách nghìn kiểu Anh), `"0,1"`/`"0.1"` (thập phân),
 * `"10%"` (phần trăm), ô trống.
 */
export function parseFlexibleNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string") return null

  let text = value.replace(WHITESPACE, "")
  if (!text) return null

  const isPercent = text.endsWith("%")
  if (isPercent) text = text.slice(0, -1)
  if (!text) return null

  const dotIndex = text.lastIndexOf(".")
  const commaIndex = text.lastIndexOf(",")

  if (dotIndex >= 0 && commaIndex >= 0) {
    // Cả hai dấu cùng có: dấu đứng sau là dấu thập phân, dấu kia phân cách nghìn.
    const decimalSep = dotIndex > commaIndex ? "." : ","
    const thousandSep = dotIndex > commaIndex ? "," : "."
    text = text.split(thousandSep).join("").replace(decimalSep, ".")
  } else if (dotIndex >= 0 || commaIndex >= 0) {
    const pos = dotIndex >= 0 ? dotIndex : commaIndex
    const sep = dotIndex >= 0 ? "." : ","
    // Đúng ba chữ số phía sau và còn chữ số phía trước thì đó là phân cách nghìn.
    const looksLikeThousandSep = /^\d{3}$/.test(text.slice(pos + 1)) && /\d/.test(text.slice(0, pos))
    text = looksLikeThousandSep ? text.split(sep).join("") : text.replace(sep, ".")
  }

  const n = Number(text)
  return Number.isFinite(n) ? (isPercent ? n / 100 : n) : null
}

export interface NormalizedPercent {
  ratio: number
  /** Giá trị nằm ngoài khoảng hợp lệ `[0, 1)` — đã rơi về mặc định, cần người soát lại. */
  suspicious: boolean
}

/**
 * Chuẩn hoá một tỷ lệ (vd tỷ lệ ưu đãi, tỷ lệ thưởng) về khoảng `[0, 1)`.
 *
 * Ô ghi `10` (ý là mười phần trăm) mà dùng thẳng thì `1 − 10 = −9` — một tỷ
 * lệ lớn hơn 1 được hiểu ngầm là phần trăm và chia lại cho 100.
 */
export function normalizePercent(value: unknown, fallback: number): NormalizedPercent {
  const n = parseFlexibleNumber(value)
  if (n === null) return { ratio: fallback, suspicious: false }
  const normalized = n > 1 ? n / 100 : n
  if (!(normalized >= 0 && normalized < 1)) return { ratio: fallback, suspicious: true }
  return { ratio: normalized, suspicious: false }
}

const COST_RELATED_CLAUSE = /giá\s*vốn|chi\s*phí\s*(công|bổ\s*sung)|thành\s*tiền/i

/**
 * Bỏ mệnh đề nhắc tới giá vốn khỏi một câu cảnh báo tự do, nối bằng dấu gạch
 * ngang dài. Dùng khi màn hình hiển thị câu này không hiện giá vốn — một câu
 * tự do do máy sinh ra có ngày mang theo cả con số.
 */
export function sanitizeWarningText(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value).trim()
  if (!raw) return ""
  const kept = raw
    .split(/\s*[—–]\s*/)
    .filter((clause) => !COST_RELATED_CLAUSE.test(clause))
    .map((clause) => clause.trim())
    .filter(Boolean)
  return kept.join(" — ")
}
