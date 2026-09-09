import { existsSync } from "node:fs"

/**
 * Nạp `.env` khi chạy tại máy. Trên CI biến đã nằm sẵn trong môi trường nên
 * không có tệp và cũng không cần — `src/lib/env.ts` vẫn là chỗ duy nhất kiểm
 * cấu hình, và nó vẫn ném khi thiếu biến.
 */
if (existsSync(".env")) process.loadEnvFile(".env")
