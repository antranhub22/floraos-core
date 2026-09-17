import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { StorageProvider, StorageMethod } from "@/core/ports"

import { signStorageUrl } from "@/modules/assets/infra/storage-signing"

const STORAGE_ROOT = path.join(process.cwd(), "var", "storage")

function absolutePathFor(key: string): string {
  const normalized = path.normalize(key)
  if (normalized.startsWith("..")) throw new Error(`storage_key không hợp lệ: ${key}`)
  return path.join(STORAGE_ROOT, normalized)
}

/**
 * Adapter kho tệp tạm cho phát triển cục bộ — `POST /assets/upload-url` cần
 * MỘT adapter thật để URL trả về dùng được, và bản này chưa có khoá S3/R2
 * thật (`.env.example` đã có ô, chưa có giá trị). Cổng `StorageProvider`
 * không đổi khi thay bằng adapter S3 thật (kiến trúc V2 mục 3, đặc tả 05 mục
 * 5) — chỉ thay tệp này.
 *
 * Ghi ở `docs/dac-ta/TECHNICAL_DEBT.md`: không dùng được qua nhiều tiến
 * trình/máy chủ (đĩa cục bộ), phải thay trước khi lên production thật.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  readonly name = "local-disk"

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    const target = absolutePathFor(key)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, body)
    await writeFile(`${target}.meta.json`, JSON.stringify({ contentType }))
  }

  async get(key: string): Promise<Uint8Array> {
    return readFile(absolutePathFor(key))
  }

  /** `_method` bỏ qua: route `/api/v1/storage/[...key]` nhận cả PUT lẫn GET
   *  trên cùng một đường đã ký. */
  async signedUrl(
    key: string,
    expiresInSeconds: number,
    _method: StorageMethod = "GET"
  ): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000
    const signature = signStorageUrl(key, expiresAt)
    return `/api/v1/storage/${key}?exp=${expiresAt}&sig=${signature}`
  }
}
