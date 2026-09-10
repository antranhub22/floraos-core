import { z } from "zod"

/**
 * Cấu hình kiểm lúc khởi động. Thiếu biến thì tiến trình không lên —
 * chạy tiếp với giá trị mặc định âm thầm là cách hỏng khó tìm nhất.
 */
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
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const thieu = parsed.error.issues.map((i) => i.path.join(".")).join(", ")
  throw new Error(`Cấu hình thiếu hoặc sai: ${thieu}. Xem .env.example.`)
}

export const env = parsed.data
