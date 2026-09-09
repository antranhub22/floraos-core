import path from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Bộ test cách ly dùng chung một cơ sở dữ liệu và dọn bảng giữa các
    // trường hợp, nên chạy tuần tự trong một tiến trình.
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
})
