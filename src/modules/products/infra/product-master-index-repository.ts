/**
 * Product Master Index Repository (Infra)
 * Thực hiện truy vấn cơ sở dữ liệu để lấy toàn bộ thông tin sản phẩm từ Product Master,
 * Product Images, Assets, Product Analyses (BOM Vision M01), và Pricing Rules (M02).
 *
 * QUY TẮC DỮ LIỆU (rà soát 17/09/2026 — xem mục 7 trong tài liệu rà soát):
 * Hợp đồng Vision (`workers/vision/contracts/Schema.json`) lồng `phong_cach`/`dip_su_dung`
 * bên trong `identity`, và mã màu chuẩn nằm ở `bom.flowers[].mau`/`mo_ta_mau`, KHÔNG có ở
 * cấp cao nhất của bản ghi phân tích. `bom.wrapping` là một MẢNG các lớp gói
 * (`{layer, material, color, texture}`), không phải một object đơn. Không đọc các trường
 * này bằng tên tự nghĩ ra (`analysisData.style`, `attrs.primaryColor`...) — những khoá đó
 * không tồn tại ở đâu trong hệ thống và chỉ lặng lẽ trả về giá trị mặc định bịa.
 * Khi không có dữ liệu thật, hàm này trả về mảng rỗng / chuỗi "chưa rõ" thay vì bịa số
 * liệu cụ thể trông như thật — cùng nguyên tắc đã áp dụng cho Thẻ chào A6 (Giai đoạn 0).
 */

import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { ProductMasterIndex, FlowerBomItem } from "../domain/product-master-index"
import { mauChuDao } from "../domain/product-analysis-rules"
import { toneChuDao } from "@/modules/product-copies/domain/analysis-projection"

/** Hình dạng lỏng lẻo của một dòng `bom.flowers`/`bom.foliage` theo hợp đồng Vision — chỉ khai những khoá hàm này thật sự đọc. */
interface RawFlowerRow {
  name?: string | null
  nhom_hoa?: string | null
  flowerName?: string | null
  quantity?: number | null
  dvt_dem?: string | null
  unit?: string | null
  mo_ta_mau?: string | null
  mau?: string | null
  color?: string | null
  role?: string | null
  shade?: string | null
}

interface RawAccessoryRow {
  name?: string | null
}

interface RawWrappingLayer {
  layer?: string | null
  material?: string | null
  color?: string | null
}

/** `dvt_dem` của hợp đồng Vision là "Bông"|"Cành"|"Lá"|"Cây" (viết hoa chữ cái đầu). */
function normalizeUnit(raw: string | null | undefined): string | null {
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim().toLowerCase() : null
}

/** `bom.flowers[].role` của hợp đồng Vision là "Hoa chủ đạo"|"Hoa phụ"|"Hoa điểm xuyết"|"Hoa lấp đầy"|null — không phải "Chủ đạo"/"Phụ" trần trụi. */
function mapFlowerRole(raw: string | null | undefined): FlowerBomItem["role"] {
  switch (raw) {
    case "Hoa chủ đạo":
      return "Chủ đạo"
    case "Hoa phụ":
      return "Phụ"
    case "Hoa điểm xuyết":
      return "Lá điểm"
    case "Hoa lấp đầy":
      return "Lấp đầy"
    default:
      // AI chưa xác định được vai trò (null/thiếu) — xếp tạm vào nhóm ít quan trọng nhất
      // thay vì đoán "Chủ đạo", để không đánh lừa thợ cắm hoa về hoa nào là hoa chính.
      return "Lấp đầy"
  }
}

function asRowArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export class ProductMasterIndexRepository {
  async getById(ctx: TenantContext, productId: string): Promise<ProductMasterIndex | null> {
    const row = await prisma.products.findFirst({
      where: { id: productId, organization_id: ctx.organizationId },
      include: {
        images: { where: { role: "MAIN" }, take: 1 },
        analyses: {
          where: { approval_state: "APPROVED" },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    })

    if (!row) return null
    return this.mapToMasterIndex(ctx, row)
  }

  async list(ctx: TenantContext, limit = 50): Promise<ProductMasterIndex[]> {
    const rows = await prisma.products.findMany({
      where: { organization_id: ctx.organizationId },
      include: {
        images: { where: { role: "MAIN" }, take: 1 },
        analyses: {
          where: { approval_state: "APPROVED" },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: { updated_at: "desc" },
      take: limit,
    })

    return Promise.all(rows.map((row) => this.mapToMasterIndex(ctx, row)))
  }

  private async mapToMasterIndex(ctx: TenantContext, row: any): Promise<ProductMasterIndex> {
    const attrs = (row.attributes as Record<string, unknown>) ?? {}
    const analysis = row.analyses?.[0]
    const analysisData = ((analysis?.edited ?? analysis?.raw) as Record<string, unknown>) ?? {}
    const identity = (analysisData.identity as Record<string, unknown>) ?? {}
    const bomData = (analysisData.bom as Record<string, unknown>) ?? {}
    const attrsBom = (attrs.bom as Record<string, unknown>) ?? {}
    // Ưu tiên BOM của lượt phân tích APPROVED gắn với sản phẩm; nếu sản phẩm không có lượt
    // phân tích nào (hiếm — ví dụ tạo tay), thử `products.attributes.bom` đã ghi lúc duyệt.
    const rawFlowers = asRowArray<RawFlowerRow>(bomData.flowers ?? attrsBom.flowers)

    const flowers: FlowerBomItem[] = rawFlowers.map((f) => ({
      flowerName: f.name ?? f.nhom_hoa ?? "Hoa (chưa rõ tên)",
      quantity: Number(f.quantity ?? 1),
      unit: normalizeUnit(f.dvt_dem) ?? normalizeUnit(f.unit) ?? "cành",
      color: f.mo_ta_mau ?? f.mau ?? f.color ?? "Chưa rõ màu",
      role: mapFlowerRole(f.role),
      ...(f.shade ? { shade: f.shade } : {}),
    }))

    const rawFoliage = asRowArray<RawFlowerRow | string>(bomData.foliage ?? attrsBom.foliage)
    const foliage = rawFoliage.map((l) =>
      typeof l === "string" ? l : (l.name ?? l.nhom_hoa ?? "Lá (chưa rõ tên)")
    )

    const rawAccessories = asRowArray<RawAccessoryRow | string>(bomData.accessories ?? attrsBom.accessories)
    const accessories = rawAccessories.map((a) => (typeof a === "string" ? a : (a.name ?? "Phụ kiện (chưa rõ tên)")))

    // `bom.wrapping` là MẢNG các lớp gói {layer, material, color, texture}, không phải object đơn.
    const wrappingList = asRowArray<RawWrappingLayer>(bomData.wrapping ?? attrsBom.wrapping)
    const outerWrap = wrappingList.find((w) => w.layer === "Lớp ngoài") ?? wrappingList[0]
    const wrapStyle = outerWrap
      ? [outerWrap.material, outerWrap.color].filter(Boolean).join(" ") || "Chưa rõ kiểu gói"
      : String(attrs.wrapStyle ?? "Chưa rõ kiểu gói")

    const tieWrap = wrappingList.find((w) => w.layer === "Đai buộc")
    const ribbonFromAccessories = accessories.find((a) => a.includes("ruy") || a.includes("nơ"))
    const ribbon = tieWrap
      ? [tieWrap.material, tieWrap.color].filter(Boolean).join(" ") || "Chưa rõ ruy băng"
      : (ribbonFromAccessories ?? "Chưa rõ ruy băng")

    // Chưa có nguồn "giá bán lẻ chính thức" nào trong hệ thống cho một sản phẩm (xác nhận
    // ở Giai đoạn 0: `products.attributes.price_vnd` chưa từng được ghi ở đâu). Bảng
    // `pricing_rules` chỉ lưu một số ít luật giá CHUNG CHO CẢ TỔ CHỨC (vd `floor_ceiling_ratio`),
    // không lưu giá theo từng mã sản phẩm — nên KHÔNG tra bảng đó bằng `key = mã sản phẩm`
    // (câu tra cứu cũ luôn thất bại và ngầm rơi về số bịa 500.000đ cho mọi sản phẩm).
    // Trả 0 khi chưa có giá thật — đây là cùng nguyên tắc "không bịa số" đã chốt cho Thẻ
    // chào A6 (Giai đoạn 0); các nơi hiển thị/dùng số này phải tự xử lý giá trị 0 là
    // "chưa có giá, liên hệ shop" thay vì hiển thị thẳng "0 đ" cho khách.
    const priceFromAttrs = typeof attrs.price_vnd === "number" && attrs.price_vnd > 0 ? attrs.price_vnd : null
    const quotePriceVnd = priceFromAttrs ?? 0

    let masterImageUrl: string | undefined = undefined
    if (row.images?.[0]) {
      const asset = await prisma.assets.findUnique({ where: { id: row.images[0].asset_id } })
      if (asset?.storage_key) {
        masterImageUrl = `/api/v1/storage/${asset.storage_key}`
      }
    }

    const toneMau = toneChuDao(analysisData)
    const primaryColorFromAttrs = typeof attrs.color === "string" && attrs.color ? attrs.color : null

    return {
      id: row.id,
      organizationId: row.organization_id,
      code: row.code,
      name: row.name,
      status: row.status,
      category: row.category ?? "Bó hoa",
      shape: row.shape ?? "Tròn",
      facing: row.facing ?? "Một mặt",
      container: row.container ?? undefined,
      style: String(identity.phong_cach ?? "Chưa rõ phong cách"),
      occasions: identity.dip_su_dung ? [String(identity.dip_su_dung)] : [],
      masterImageUrl,
      colorPalette: {
        primaryColor: toneMau[0] ?? primaryColorFromAttrs ?? mauChuDao(analysisData) ?? "Chưa rõ màu chủ đạo",
        secondaryColor: toneMau[1] ?? undefined,
        // Không có nơi nào trong hệ thống tính "tông hài hoà" (Pastel/Rực rỡ/Trầm ấm/Đơn sắc)
        // từ dữ liệu AI — để trống thay vì bịa "Nổi bật" cho mọi sản phẩm.
      },
      bom: {
        flowers,
        foliage,
        wrapStyle,
        ribbon,
        accessories,
      },
      pricing: {
        quotePriceVnd,
        pricingRuleRef: undefined,
      },
    }
  }
}
