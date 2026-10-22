import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { STORE_EXPORT_MAX_ROWS } from "../domain/store-export"

type Row = Record<string, unknown>
type Finder = { findMany(args: { where: Row; take: number; orderBy?: Row }): Promise<Row[]> }

function finder(model: unknown): Finder {
  return model as Finder
}

/**
 * Bảng đưa vào `data.json`. CỐ Ý không có bảng chứa khoá/bí mật kết nối
 * (`integration_tokens`, `greeting_integrations`, `chat_channel_integrations`)
 * và không có nhật ký nội bộ (`audit_logs`, `generation_jobs`).
 */
const TABLES = {
  business_profiles: () => finder(prisma.business_profiles),
  brand_profiles: () => finder(prisma.brand_profiles),
  branches: () => finder(prisma.branches),
  products: () => finder(prisma.products),
  product_variants: () => finder(prisma.product_variants),
  product_images: () => finder(prisma.product_images),
  product_inventory: () => finder(prisma.product_inventory),
  pricing_rules: () => finder(prisma.pricing_rules),
  customers: () => finder(prisma.customers),
  customer_occasions: () => finder(prisma.customer_occasions),
  customer_consents: () => finder(prisma.customer_consents),
  vouchers: () => finder(prisma.vouchers),
  orders: () => finder(prisma.orders),
  order_items: () => finder(prisma.order_items),
  order_payments: () => finder(prisma.order_payments),
  greeting_catalogs: () => finder(prisma.greeting_catalogs),
  greeting_catalog_products: () => finder(prisma.greeting_catalog_products),
  catalog_links: () => finder(prisma.catalog_links),
  content_drafts: () => finder(prisma.content_drafts),
  campaign_packages: () => finder(prisma.campaign_packages),
  partners: () => finder(prisma.partners),
} as const

export type StoreExportTable = keyof typeof TABLES
export type StoreExportData = Record<StoreExportTable, Row[]>

export interface ExportImageRef {
  id: string
  storageKey: string
  mimeType: string
  fileSize: number | null
  name: string
}

export class StoreExportQuery {
  /** Đọc lần lượt từng bảng (không song song) — giữ tải DB thấp khi tiệm lớn. */
  async loadData(ctx: TenantContext): Promise<StoreExportData> {
    const data = {} as StoreExportData
    for (const [table, model] of Object.entries(TABLES) as Array<[StoreExportTable, () => Finder]>) {
      data[table] = await model().findMany({ where: scopedWhere(ctx), take: STORE_EXPORT_MAX_ROWS })
    }
    return data
  }

  /** Ảnh gốc đang dùng (không nằm trong Thùng rác), mới nhất trước. */
  async listOriginalImages(ctx: TenantContext): Promise<ExportImageRef[]> {
    const rows = await prisma.assets.findMany({
      where: scopedWhere(ctx, { kind: "ORIGINAL" as const, deleted_at: null, state: { not: "ARCHIVED" as const } }),
      select: { id: true, storage_key: true, mime_type: true, file_size: true, metadata: true },
      orderBy: { created_at: "desc" },
      take: STORE_EXPORT_MAX_ROWS,
    })
    return rows.map((row) => {
      const meta = (row.metadata as Record<string, unknown> | null) ?? {}
      const name = typeof meta["filename"] === "string" ? meta["filename"] : row.id
      return { id: row.id, storageKey: row.storage_key, mimeType: row.mime_type, fileSize: row.file_size, name }
    })
  }
}
