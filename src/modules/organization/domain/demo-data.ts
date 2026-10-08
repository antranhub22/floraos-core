/**
 * Có nạp dữ liệu mẫu ("Tiệm Hoa Mộc Lan") hay không — PO 08/10/2026: máy chủ thật phải SẠCH, tiệm
 * mới không mang hồ sơ mẫu. Bật khi chạy dev, hoặc khi máy chủ demo/staging đặt `SEED_DEV_DATA=true`
 * (cùng luật với `prisma/seed.ts`). Pure TypeScript.
 */
export function demoDataEnabled(env: { NODE_ENV?: string | undefined; SEED_DEV_DATA?: string | undefined }): boolean {
  return env.NODE_ENV !== "production" || env.SEED_DEV_DATA === "true"
}
