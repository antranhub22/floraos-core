/**
 * Đọc một khoá từ `.env` ở thư mục làm việc khi `process.env` chưa có — dùng
 * chung cho ba adapter xu hướng (SerpApi/YouTube/TikTok). Tiến trình ngoài
 * Next (script `tsx`, worker) không tự nạp `.env`.
 *
 * `process.getBuiltinModule` (Node ≥ 22.3) thay cho `require("fs")`: không đi
 * qua bộ đóng gói nên tệp vẫn nhập được ở phía trình duyệt, nơi hàm này trả
 * `undefined` ngay. Tìm thấy thì ghi ngược vào `process.env` để lần sau khỏi đọc.
 */
export function readDotenvKey(name: string): string | undefined {
  if (typeof process === "undefined") return undefined
  const fromEnv = process.env[name]
  if (fromEnv) return fromEnv
  if (typeof window !== "undefined" || typeof process.getBuiltinModule !== "function") return undefined

  try {
    const fs = process.getBuiltinModule("node:fs")
    const path = process.getBuiltinModule("node:path")
    const envPath = path.resolve(process.cwd(), ".env")
    if (!fs.existsSync(envPath)) return undefined
    const content = fs.readFileSync(envPath, "utf-8")
    const match = content.match(new RegExp(`^${name}=(.+)$`, "m"))
    if (!match?.[1]) return undefined
    const value = match[1].trim().replace(/^["']|["']$/g, "")
    process.env[name] = value
    return value
  } catch {
    // Bỏ qua lỗi đọc tệp — adapter tự báo thiếu khoá.
    return undefined
  }
}
