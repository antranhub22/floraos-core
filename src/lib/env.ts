import { z } from "zod"

/**
 * Cấu hình kiểm lúc khởi động. Thiếu biến thì tiến trình không lên —
 * chạy tiếp với giá trị mặc định âm thầm là cách hỏng khó tìm nhất.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
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
