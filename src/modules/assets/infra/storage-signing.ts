import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "@/lib/env"

/**
 * Ký URL tạm cho `LocalDiskStorageProvider` (`adapters/local-disk-storage-provider.ts`)
 * — cùng kỹ thuật HMAC như `session-token.ts`, dùng lại `SESSION_SECRET` thay
 * vì đòi thêm biến môi trường mới. Đây là adapter tạm cho tới khi có khoá
 * kho thật (`STORAGE_ENDPOINT`/`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY`
 * trong `.env.example` đã có sẵn ô nhưng chưa có adapter đọc) — ghi ở
 * `docs/dac-ta/TECHNICAL_DEBT.md`.
 */
function signaturePayload(key: string, expiresAt: number): string {
  return `${key}:${expiresAt}`
}

export function signStorageUrl(key: string, expiresAt: number): string {
  return createHmac("sha256", env.SESSION_SECRET).update(signaturePayload(key, expiresAt)).digest("hex")
}

export function verifyStorageSignature(key: string, expiresAt: number, signature: string): boolean {
  if (Date.now() > expiresAt) return false
  const expected = Buffer.from(signStorageUrl(key, expiresAt))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
