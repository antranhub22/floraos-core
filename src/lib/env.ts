import { z } from "zod"

/**
 * Cấu hình kiểm lúc khởi động. Thiếu biến thì tiến trình không lên —
 * chạy tiếp với giá trị mặc định âm thầm là cách hỏng khó tìm nhất.
 */

/**
 * Helper: chuyển empty string "" thành undefined trước khi validate URL.
 * Cần thiết khi deploy trên Render/Vercel — platform có thể set env var
 * thành "" thay vì bỏ trống, khiến z.string().url() reject dù là optional.
 */
const optionalUrl = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.string().url().optional()
)

const schema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
  // P7 — khoá ký token máy gọi máy (YC-T8). Tách khỏi SESSION_SECRET: xoay
  // khoá của người dùng và của engine ngoài là hai việc vận hành độc lập,
  // dùng chung một khoá sẽ buộc xoay cả hai cùng lúc mỗi khi chỉ một phía
  // cần xoay.
  INTEGRATION_TOKEN_SECRET: z.string().min(16),
  // Unified Shell (B1) — khoá ký JWT phiên liên-app đọc được bởi LocalBudd
  // (Node) và SocialFlow (Python), xác minh tại chỗ không cần gọi lại CSDL
  // floraos-core mỗi request. Tách khỏi SESSION_SECRET/INTEGRATION_TOKEN_SECRET
  // cùng lý do đã ghi ở INTEGRATION_TOKEN_SECRET — ba khoá, ba vòng đời xoay
  // độc lập.
  SSO_SESSION_SECRET: z.string().min(16),
  OPENAI_API_KEY: z.string().optional(),
  // Nhà cung cấp nội dung tương đương OpenAI (PO 25/09/2026) — thiếu khoá thì
  // bên đó bị bỏ qua trong chuỗi lùi, không làm hỏng khởi động.
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  // Proxy sang engine ngoài (P15+). Ba app ba cổng theo bảng cổng cục bộ đã chốt
  // 2026-09-10 (core 3100 / LocalBudd 3000 / SocialFlow 8000). Dashboard core
  // gọi sibling qua proxy server-side để tránh rào cản CORS trình duyệt — xem
  // `src/modules/proxy/`. Trống khi không chạy engine ngoài (vd. test đơn lẻ).
  SOCIALFLOW_URL: optionalUrl,
  LOCALBUDD_URL: optionalUrl,
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  // === FEATURE FLAGS ===
  // Thẻ chào / Swipe Brochure (§34.16). Mặc định bật (“true”) — đặt "false"
  // để tắt module mà không cần xóa code hay deploy lại.
  GREETING_CARD_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false")
    .default(true),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const thieu = parsed.error.issues.map((i) => i.path.join(".")).join(", ")
  throw new Error(`Cấu hình thiếu hoặc sai: ${thieu}. Xem .env.example.`)
}

export const env = parsed.data
