import { randomUUID } from "node:crypto"

import type { TenantContext } from "@/core/tenancy"
import { LocalDiskStorageProvider } from "@/modules/assets/adapters/local-disk-storage-provider"
import { buildStorageKey, extensionForMimeType } from "@/modules/assets/domain/storage-key"

const UPLOAD_URL_TTL_SECONDS = 15 * 60

/**
 * `POST /assets/upload-url` (`G2`, đặc tả 06 mục 6). Tự sinh `storage_key`
 * theo `org/<organization_id>/<product_id>/<asset_id>.<ext>` — client không
 * đề xuất đường dẫn, nhận đường dẫn từ client là mở đường ghi đè chéo tổ
 * chức. `asset_id` cấp ở đây, dùng lại nguyên vẹn ở `POST /assets`
 * (`register-asset.ts`) để id bản ghi khớp với đường dẫn đã ký.
 */
export async function createUploadUrl(
  ctx: TenantContext,
  input: { productId: string | null; mimeType: string }
) {
  const extension = extensionForMimeType(input.mimeType)
  const assetId = randomUUID()
  const storageKey = buildStorageKey({
    organizationId: ctx.organizationId,
    productId: input.productId,
    assetId,
    extension,
  })

  const uploadUrl = await new LocalDiskStorageProvider().signedUrl(storageKey, UPLOAD_URL_TTL_SECONDS)

  return {
    asset_id: assetId,
    storage_key: storageKey,
    upload_url: uploadUrl,
    expires_in: UPLOAD_URL_TTL_SECONDS,
  }
}
