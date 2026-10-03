import { CatalogLinkRepository } from "../infra/catalog-link-repository"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"

export interface PublicCatalogShop {
  name: string
  legalName: string | null
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  primaryColor: string
  logoUrl: string | null
}

export interface PublicCatalogProduct {
  id: string
  code: string
  name: string
  category: string | null
  shape: string | null
  container: string | null
  price: number | null
  imageUrl: string | null
  stemCount: number | null
  occasions: string[]
  description: string | null
}

export type PublicCatalogResult =
  | {
      status: "ACTIVE"
      catalog: {
        slug: string
        name: string
        description: string | null
        createdAt: string
      }
      shop: PublicCatalogShop
      products: PublicCatalogProduct[]
      campaignConfig?: {
        occasion?: string | undefined
        archetype?: string | undefined
        customHeroImageUrl?: string | undefined
        videoUrl?: string | undefined
        generatedPackage?: Record<string, unknown> | undefined
        enabledSections?: Record<string, boolean> | undefined
        styleVariant?: string | undefined
      } | undefined
    }
  | {
      status: "REVOKED"
      catalogName: string
    }
  | {
      status: "NOT_FOUND"
    }

const STORAGE_URL_TTL_SECONDS = 7 * 24 * 3600 // 7 ngày

/**
 * Helper: Ký bảo mật URL nếu đầu vào là đường dẫn kho lưu trữ /api/v1/storage/... hoặc storage key.
 * Đảm bảo 100% người dùng công khai truy cập link /c/[slug] luôn nhận được chữ ký HMAC hợp lệ,
 * giải quyết triệt để lỗi 400 Bad Request ("URL ký sẵn không hợp lệ hoặc đã hết hạn").
 */
function extractStorageKey(urlOrKey: string): string | null {
  const clean = urlOrKey.split("?")[0]!.split("#")[0]!.trim()
  if (!clean) return null

  const storageIdx = clean.indexOf("/api/v1/storage/")
  if (storageIdx !== -1) {
    const key = clean.slice(storageIdx + "/api/v1/storage/".length).replace(/^\/+/, "")
    return key || null
  }

  if (
    clean.startsWith("org/") ||
    clean.startsWith("videos/") ||
    clean.startsWith("assets/") ||
    clean.startsWith("products/")
  ) {
    return clean
  }

  return null
}

async function signStoragePath(
  storage: ReturnType<typeof getStorageProvider>,
  urlOrKey: string | null | undefined
): Promise<string | null> {
  if (!urlOrKey || typeof urlOrKey !== "string") return null
  const trimmed = urlOrKey.trim()
  if (!trimmed) return null

  // Blob/data url chỉ có trong RAM của trình duyệt người tạo, không dùng được công khai
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return null

  const storageKey = extractStorageKey(trimmed)
  if (storageKey) {
    try {
      return await storage.signedUrl(storageKey, STORAGE_URL_TTL_SECONDS)
    } catch {
      return trimmed
    }
  }

  return trimmed
}

/**
 * Use-case: Lấy thông tin catalog công khai cho khách hàng duyệt web.
 *
 * Tự động tổng hợp thông tin tiệm, danh mục hoa đã duyệt, ký URL ảnh hợp lệ,
 * và trích xuất đầy đủ thông tin bán hàng (mô tả, dịp, định lượng cành, giá).
 */
export async function getPublicCatalog(slug: string): Promise<PublicCatalogResult> {
  const repo = new CatalogLinkRepository()
  const rawData = await repo.getPublicCatalogRaw(slug)

  if (!rawData) {
    return { status: "NOT_FOUND" }
  }

  if (rawData.revoked) {
    return {
      status: "REVOKED",
      catalogName: rawData.link.name,
    }
  }

  const { link, org, bizProfile, brandProfile, productRows, assetRecords } = rawData
  const storage = getStorageProvider()

  // Tải thông tin assets và ký URL hợp lệ
  const assetMap = new Map<string, string>()
  if (assetRecords.length > 0) {
    await Promise.all(
      assetRecords.map(async (asset) => {
        try {
          const signedUrl = await storage.signedUrl(asset.storage_key, STORAGE_URL_TTL_SECONDS)
          assetMap.set(asset.id, signedUrl)
        } catch {
          // Bỏ qua nếu lỗi ký URL
        }
      })
    )
  }

  let logoUrl: string | null = null
  if (brandProfile?.logo_asset_id && assetMap.has(brandProfile.logo_asset_id)) {
    logoUrl = assetMap.get(brandProfile.logo_asset_id) ?? null
  }

  const shop: PublicCatalogShop = {
    name: bizProfile?.display_name || org?.name || "Tiệm hoa FloraOS",
    legalName: bizProfile?.legal_name ?? null,
    phone: bizProfile?.phone ?? null,
    email: bizProfile?.email ?? null,
    address: bizProfile?.address ?? null,
    website: bizProfile?.website ?? null,
    primaryColor: brandProfile?.primary_color ?? "#e11d48",
    logoUrl,
  }

  const products: PublicCatalogProduct[] = await Promise.all(
    productRows.map(async (p) => {
      const attr = (p.attributes as Record<string, unknown>) || {}
      const catalogAttr = (attr.catalog as Record<string, unknown>) || {}
      const salesData = (attr.salesData as Record<string, unknown>) || {}
      const analysisRaw = (p.analyses[0]?.raw as Record<string, unknown>) || {}
      const analysisBom = (analysisRaw.bom as Record<string, unknown>) || {}
      const attrBom = (attr.bom as Record<string, unknown>) || {}

      // 1. Resolve price
      let price: number | null = null
      if (typeof attr.price === "number") price = attr.price
      else if (typeof salesData.price === "number") price = salesData.price
      else if (typeof catalogAttr.sellPriceVnd === "number") price = catalogAttr.sellPriceVnd
      else if (typeof attr.gia_ban === "number") price = attr.gia_ban

      // 2. Resolve image
      let imageUrl: string | null = null
      const firstImg = p.images[0]
      const firstAnalysis = p.analyses[0]
      if (firstImg && assetMap.has(firstImg.asset_id)) {
        imageUrl = assetMap.get(firstImg.asset_id) ?? null
      } else if (firstAnalysis && assetMap.has(firstAnalysis.asset_id)) {
        imageUrl = assetMap.get(firstAnalysis.asset_id) ?? null
      } else if (typeof attr.imageUrl === "string") {
        imageUrl = attr.imageUrl
      } else if (typeof attr.image_url === "string") {
        imageUrl = attr.image_url
      }

      // Ký bảo mật URL nếu là storage path hoặc key
      if (imageUrl) {
        imageUrl = await signStoragePath(storage, imageUrl)
      }

      // 3. Resolve occasions
      const occasions: string[] = []
      if (Array.isArray(salesData.occasions)) {
        occasions.push(...(salesData.occasions as string[]))
      } else if (Array.isArray(attr.occasions)) {
        occasions.push(...(attr.occasions as string[]))
      } else if (typeof catalogAttr.occasion === "string" && catalogAttr.occasion) {
        occasions.push(catalogAttr.occasion)
      } else {
        const dipSuDung = (analysisRaw.identity as { dip_su_dung?: unknown } | null | undefined)?.dip_su_dung
        if (typeof dipSuDung === "string") occasions.push(dipSuDung)
      }

      // 4. Resolve description
      let description: string | null = null
      if (typeof salesData.description === "string" && salesData.description) {
        description = salesData.description
      } else if (typeof attr.description === "string" && attr.description) {
        description = attr.description
      } else if (typeof catalogAttr.description === "string" && catalogAttr.description) {
        description = catalogAttr.description
      }

      // 5. Stem count
      let stemCount: number | null = null
      if (typeof attr.stemCount === "number") {
        stemCount = attr.stemCount
      } else if (typeof catalogAttr.componentCount === "number") {
        stemCount = catalogAttr.componentCount
      } else if (typeof attrBom.flower_count === "number") {
        stemCount = attrBom.flower_count
      } else if (typeof analysisBom.flower_count === "number") {
        stemCount = analysisBom.flower_count
      } else if (Array.isArray(analysisBom.flowers)) {
        const count = (analysisBom.flowers as Array<{ quantity?: unknown } | null>).reduce(
          (sum, f) => sum + (Number(f?.quantity) || 0),
          0,
        )
        if (count > 0) stemCount = count
      }

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        shape: p.shape,
        container: p.container,
        price,
        imageUrl,
        stemCount,
        occasions,
        description,
      }
    })
  )

  const filters = (link.filters as Record<string, unknown>) || {}

  let resolvedHeroImageUrl: string | undefined = undefined
  if (typeof filters.customHeroImageUrl === "string") {
    const signed = await signStoragePath(storage, filters.customHeroImageUrl)
    if (signed) resolvedHeroImageUrl = signed
  }

  return {
    status: "ACTIVE",
    catalog: {
      slug: link.slug,
      name: link.name,
      description: link.description,
      createdAt: link.created_at.toISOString(),
    },
    shop,
    products,
    campaignConfig:
      filters.occasion || filters.archetype || filters.generatedPackage || resolvedHeroImageUrl || filters.videoUrl
        ? {
            occasion: typeof filters.occasion === "string" ? filters.occasion : undefined,
            archetype: typeof filters.archetype === "string" ? filters.archetype : undefined,
            customHeroImageUrl: resolvedHeroImageUrl,
            videoUrl: typeof filters.videoUrl === "string" ? filters.videoUrl : undefined,
            generatedPackage: (filters.generatedPackage as Record<string, unknown>) || undefined,
            enabledSections: (filters.enabledSections as Record<string, boolean>) || undefined,
            styleVariant: typeof filters.styleVariant === "string" ? filters.styleVariant : undefined,
          }
        : undefined,
  }
}
