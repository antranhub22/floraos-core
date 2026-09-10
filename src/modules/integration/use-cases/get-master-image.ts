import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import type { assets } from "@/modules/assets/infra/entities"
import { ProductRepository } from "@/modules/products/infra/product-repository"

/**
 * Hình dạng an toàn để lộ ra ngoài core — không mang `prompt`/`parameters`/
 * `cost_usd`/`provider`/`model` (nội bộ vận hành, không phải dữ liệu bàn
 * giao M04a→M04b, đặc tả 08 mục 5).
 */
export type IntegrationAsset = {
  id: string
  version: number
  storage_key: string
  thumb_key: string | null
  mime_type: string
  width: number | null
  height: number | null
  aspect_ratio: string | null
  created_at: Date
}

export type MasterImageResult = {
  master: IntegrationAsset
  ratios: IntegrationAsset[]
}

function toIntegrationAsset(asset: assets): IntegrationAsset {
  return {
    id: asset.id,
    version: asset.version,
    storage_key: asset.storage_key,
    thumb_key: asset.thumb_key,
    mime_type: asset.mime_type,
    width: asset.width,
    height: asset.height,
    aspect_ratio: asset.aspect_ratio,
    created_at: asset.created_at,
  }
}

/**
 * `GET /integration/products/:id/master-image` (đặc tả 06 mục 11, đặc tả 08
 * mục 4). Chỉ đọc — không nhánh nào ở đây tự đặt `approval_state` (nợ #30,
 * `TECHNICAL_DEBT.md`; P9/Identity Guard mới đặt).
 *
 * `NOT_FOUND` cho cả ba trường hợp — sản phẩm không tồn tại, sản phẩm không
 * `ACTIVE`, chưa có Master Image nào `APPROVED` — cùng lý do `YC-T4`: phân
 * biệt chúng là rò thông tin về sự tồn tại của bản ghi.
 */
export async function getMasterImage(ctx: TenantContext, productId: string): Promise<MasterImageResult> {
  const product = await new ProductRepository().findById(ctx, productId)
  if (!product || product.status !== "ACTIVE") throw notFound()

  const assets = new AssetRepository()
  const master = await assets.findApprovedMaster(ctx, productId)
  if (!master) throw notFound()

  const ratios = await assets.listDerivedFrom(ctx, master.id)

  return {
    master: toIntegrationAsset(master),
    ratios: ratios.map(toIntegrationAsset),
  }
}
