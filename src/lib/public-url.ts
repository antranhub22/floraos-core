/**
 * Địa chỉ công khai của ứng dụng (không có "/" cuối): `PUBLIC_APP_URL`, nếu trống
 * thì `RENDER_EXTERNAL_URL` do Render cấp. Rỗng khi chạy local chưa cấu hình.
 */
export function publicAppUrl(): string {
  return (process.env["PUBLIC_APP_URL"] || process.env["RENDER_EXTERNAL_URL"] || "").trim().replace(/\/$/, "")
}
