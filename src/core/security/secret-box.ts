import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto"

/**
 * Mã hoá bí mật lưu trong DB (thông tin đăng nhập nhà cung cấp ngoài):
 * AES-256-GCM, khoá dẫn xuất (HKDF-SHA256) từ `INTEGRATION_TOKEN_SECRET`
 * theo từng mục đích (`purpose`) — lộ một loại bản mã không giúp giải loại khác.
 * Định dạng: `v1.<iv>.<tag>.<ciphertext>` (base64url).
 */

function keyFor(purpose: string): Buffer {
  const master = process.env["INTEGRATION_TOKEN_SECRET"]
  if (!master || master.length < 16) throw new Error("Thiếu INTEGRATION_TOKEN_SECRET để mã hoá bí mật tích hợp")
  return Buffer.from(hkdfSync("sha256", master, "floraos-secret-box", purpose, 32))
}

export function sealSecret(plaintext: string, purpose: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", keyFor(purpose), iv)
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".")
}

/** Giải mã; bản mã hỏng/sai khoá/sai mục đích → ném lỗi (GCM xác thực toàn vẹn). */
export function openSecret(sealed: string, purpose: string): string {
  const [version, iv, tag, body] = sealed.split(".")
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Bản mã bí mật không hợp lệ")
  const decipher = createDecipheriv("aes-256-gcm", keyFor(purpose), Buffer.from(iv, "base64url"))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8")
}
