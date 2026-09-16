import { prisma } from "@/core/tenancy/infra/prisma"
import { LocalDiskStorageProvider } from "@/modules/assets/adapters/local-disk-storage-provider"

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
 * Use-case: Lấy thông tin catalog công khai cho khách hàng duyệt web.
 *
 * Tự động tổng hợp thông tin tiệm, danh mục hoa đã duyệt, ký URL ảnh hợp lệ,
 * và trích xuất đầy đủ thông tin bán hàng (mô tả, dịp, định lượng cành, giá).
 */
export async function getPublicCatalog(slug: string): Promise<PublicCatalogResult> {
  const link = await prisma.catalog_links.findUnique({
    where: { slug },
  })

  if (!link) {
    return { status: "NOT_FOUND" }
  }

  if (link.is_revoked || link.revoked_at) {
    return {
      status: "REVOKED",
      catalogName: link.name,
    }
  }

  const storage = new LocalDiskStorageProvider()

  // Fetch shop details
  const [org, bizProfile, brandProfile] = await Promise.all([
    prisma.organizations.findUnique({
      where: { id: link.organization_id },
      select: { name: true },
    }),
    prisma.business_profiles.findUnique({
      where: { organization_id: link.organization_id },
    }),
    prisma.brand_profiles.findUnique({
      where: { organization_id: link.organization_id },
    }),
  ])

  // Parse filters
  const filters = (link.filters as Record<string, unknown>) || {}
  const productIds = Array.isArray(filters.product_ids) ? (filters.product_ids as string[]) : []

  // Query products
  const productRows = await prisma.products.findMany({
    where: {
      organization_id: link.organization_id,
      status: "ACTIVE",
      ...(productIds.length > 0 ? { id: { in: productIds } } : {}),
    },
    orderBy: { created_at: "desc" },
    take: 100,
    include: {
      images: {
        orderBy: { position: "asc" },
        take: 1,
      },
      analyses: {
        where: { approval_state: "APPROVED" },
        orderBy: { approved_at: "desc" },
        take: 1,
        select: { asset_id: true, raw: true, edited: true },
      },
    },
  })

  // Thu thập tất cả asset IDs (từ ảnh sản phẩm, phân tích M01a, và logo tiệm)
  const assetIdSet = new Set<string>()
  if (brandProfile?.logo_asset_id) {
    assetIdSet.add(brandProfile.logo_asset_id)
  }

  for (const p of productRows) {
    if (p.images[0]?.asset_id) {
      assetIdSet.add(p.images[0].asset_id)
    } else if (p.analyses[0]?.asset_id) {
      assetIdSet.add(p.analyses[0].asset_id)
    }
  }

  // Tải thông tin assets và ký URL hợp lệ
  const assetMap = new Map<string, string>()
  if (assetIdSet.size > 0) {
    const assetRecords = await prisma.assets.findMany({
      where: { id: { in: Array.from(assetIdSet) } },
      select: { id: true, storage_key: true },
    })

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

  const products: PublicCatalogProduct[] = productRows.map((p) => {
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

    // 3. Resolve occasions
    const occasions: string[] = []
    if (Array.isArray(salesData.occasions)) {
      occasions.push(...(salesData.occasions as string[]))
    } else if (Array.isArray(attr.occasions)) {
      occasions.push(...(attr.occasions as string[]))
    } else if (typeof catalogAttr.occasion === "string" && catalogAttr.occasion) {
      occasions.push(catalogAttr.occasion)
    } else if (typeof (analysisRaw.identity as any)?.dip_su_dung === "string") {
      occasions.push((analysisRaw.identity as any).dip_su_dung)
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
      const count = (analysisBom.flowers as any[]).reduce((sum, f) => sum + (Number(f.quantity) || 0), 0)
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
      filters.occasion || filters.archetype
        ? {
            occasion: typeof filters.occasion === "string" ? filters.occasion : undefined,
            archetype: typeof filters.archetype === "string" ? filters.archetype : undefined,
          }
        : undefined,
  }
}
