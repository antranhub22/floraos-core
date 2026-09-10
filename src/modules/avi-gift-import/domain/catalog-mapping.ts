/**
 * Luật thuần cho nạp danh mục AVI GIFT vào Product Master (P8, H7 — đặc tả
 * 08 mục 6, `HARVEST_MANIFEST.md` A3). Không import Prisma (`AGENTS.md`:
 * `domain/` không import hạ tầng) — đầu vào là JSON trung gian do
 * `scripts/nap-avi-gift/doc-excel.py` sinh ra từ `01_NHAP-LIEU.xlsx` +
 * `02_KET-QUA.xlsx` thật của AVI GIFT, không phải chính tệp Excel.
 *
 * Đồng bộ MỘT CHIỀU: các hàm ở đây chỉ đọc và biến đổi, không có đường nào
 * ghi ngược lại nguồn Excel.
 *
 * `category`/`shape`/`facing`/`container` của `products` là "enum
 * identity.category của hợp đồng Vision" (đặc tả 07 mục 9) — dữ liệu do MÁY
 * nhận dạng từ ảnh qua M01, đã qua duyệt. Danh mục AVI GIFT (`Kiểu`/`Cỡ`/
 * `Mã kiểu chi tiết`) là từ vựng NGHIỆP VỤ do CON NGƯỜI khai ở v1, không đi
 * qua Vision — gán thẳng vào bốn cột đó sẽ giả mạo một kết quả AI chưa từng
 * chạy. Giữ nguyên trong `attributes.catalog`, để `category` thật chờ M01
 * phân tích ảnh thật (nếu sau này AVI GIFT chụp ảnh bổ sung).
 */

export type BomSourceRow = {
  group: string | null
  componentCode: string | null
  componentName: string | null
  unit: string | null
  qty: number | null
  qtyMin: number | null
  qtyMax: number | null
  source: string | null
  confidencePercent: number | null
  lockStatus: string | null
  unitPriceVnd: number | null
  lineTotalVnd: number | null
}

export type CatalogSourceRow = {
  code: string
  name: string
  styleRaw: string | null
  styleDetailCode: string | null
  sizeCode: string | null
  templateCode: string | null
  styleSource: string | null
  occasion: string | null
  sellPriceVnd: number | null
  costVnd: number | null
  laborCostVnd: number | null
  priceStatus: string | null
  priceWarning: string | null
  floorVnd: number | null
  ceilingVnd: number | null
  profileStatus: string | null
  componentCount: number | null
  ingredientCount: number | null
  bom: BomSourceRow[]
}

export type ProductImportAttributes = {
  aviGiftImport: { source: string; importedAt: string }
  catalog: {
    styleRaw: string | null
    styleDetailCode: string | null
    sizeCode: string | null
    templateCode: string | null
    styleSource: string | null
    occasion: string | null
  }
  pricing: {
    sellPriceVnd: number | null
    costVnd: number | null
    laborCostVnd: number | null
    priceStatus: string | null
    priceWarning: string | null
    componentCount: number | null
    ingredientCount: number | null
  }
  priceGuard: { floorVnd: number; ceilingVnd: number } | null
  bom: BomSourceRow[]
}

export type ProductImportRow = {
  code: string
  name: string
  status: "DRAFT" | "ACTIVE"
  attributes: ProductImportAttributes
}

export const CATALOG_IMPORT_SOURCE =
  "01_NHAP-LIEU.xlsx sheet '09 Danh mục sản phẩm' + 02_KET-QUA.xlsx sheet '20 Giá chào'/'21 Cấu thành giá vốn'"

/**
 * `Trạng thái hồ sơ` của v1 nói sản phẩm đã có ảnh chưa. Tất cả 1.316 dòng
 * ở lần nạp 09/10 đều "Chưa có ảnh" — nhưng hàm này đọc chính giá trị đó
 * thay vì hằng số cứng, để một lượt nạp SAU (khi AVI GIFT đã chụp thêm ảnh
 * và cập nhật cột này) tự nâng đúng sản phẩm lên `ACTIVE` mà không phải sửa
 * mã. `ACTIVE` ở đây KHÔNG có nghĩa "đã duyệt qua M01" (Luật sản phẩm #3,
 * #7 vẫn còn nguyên) — chỉ nói "có ảnh", để `GET /integration/products`
 * (lọc `status=ACTIVE`, đặc tả 08 mục 4) không đẩy ra ngoài sản phẩm chưa
 * ai nhìn thấy ảnh.
 */
export function deriveProductStatus(profileStatus: string | null): "DRAFT" | "ACTIVE" {
  if (!profileStatus) return "DRAFT"
  const normalized = profileStatus.trim().toLowerCase()
  if (normalized === "chưa có ảnh" || normalized.length === 0) return "DRAFT"
  return "ACTIVE"
}

/**
 * Sàn/Trần TRA ĐƯỢC theo mã (`checkPriceGuard`, `price-guard.ts`) là quyết
 * định chốt với anh Tony 09/10: lưu trong `products.attributes.priceGuard`,
 * KHÔNG mở rộng `pricing_rules` sang phạm vi theo-sản-phẩm ở lượt này — đó
 * là thay đổi kiến trúc M02 nói chung, ngoài phạm vi P8. Cả hai giá trị
 * phải dương thì mới đáng lưu; giá trị 0 nghĩa là "không có gì để so",
 * giống đúng luật `checkPriceGuard` đã viết (`limits.floorVnd === 0 &&
 * limits.ceilingVnd === 0` → không cảnh báo).
 */
function derivePriceGuard(
  floorVnd: number | null,
  ceilingVnd: number | null
): { floorVnd: number; ceilingVnd: number } | null {
  if (floorVnd === null || ceilingVnd === null) return null
  if (floorVnd <= 0 && ceilingVnd <= 0) return null
  return { floorVnd, ceilingVnd }
}

export class InvalidCatalogRowError extends Error {}

/**
 * Một dòng JSON trung gian → một dòng nạp `products`. Ném lỗi khi thiếu
 * `code`/`name` — hai trường bắt buộc của `products` (`code String`,
 * `name String`, không `?`) — thay vì lặng lẽ bỏ qua, để lượt nạp dừng
 * ngay và báo đúng dòng hỏng thay vì để Postgres từ chối ở giữa chừng một
 * giao dịch 1.316 dòng.
 */
export function mapCatalogRowToProduct(
  row: CatalogSourceRow,
  importedAt: Date
): ProductImportRow {
  const code = row.code?.trim()
  if (!code) throw new InvalidCatalogRowError("Thiếu code")
  const name = row.name?.trim()
  if (!name) throw new InvalidCatalogRowError(`Mã ${code} thiếu name`)

  return {
    code,
    name,
    status: deriveProductStatus(row.profileStatus),
    attributes: {
      aviGiftImport: { source: CATALOG_IMPORT_SOURCE, importedAt: importedAt.toISOString() },
      catalog: {
        styleRaw: row.styleRaw,
        styleDetailCode: row.styleDetailCode,
        sizeCode: row.sizeCode,
        templateCode: row.templateCode,
        styleSource: row.styleSource,
        occasion: row.occasion,
      },
      pricing: {
        sellPriceVnd: row.sellPriceVnd,
        costVnd: row.costVnd,
        laborCostVnd: row.laborCostVnd,
        priceStatus: row.priceStatus,
        priceWarning: row.priceWarning,
        componentCount: row.componentCount,
        ingredientCount: row.ingredientCount,
      },
      priceGuard: derivePriceGuard(row.floorVnd, row.ceilingVnd),
      bom: row.bom,
    },
  }
}

/**
 * Cảnh báo tham khảo cho người soát lượt nạp (in ra console, không chặn
 * nạp) — không phải `checkPriceGuard` (đó là đối soát MỘT mức giá cụ thể
 * lúc báo giá, việc này là soát chất lượng DỮ LIỆU NGUỒN lúc nạp).
 */
export function validateCatalogRow(row: CatalogSourceRow): string[] {
  const warnings: string[] = []
  if (row.sellPriceVnd === null || row.sellPriceVnd <= 0) {
    warnings.push(`${row.code}: không có Giá bán`)
  }
  if (
    row.floorVnd !== null &&
    row.ceilingVnd !== null &&
    row.floorVnd > 0 &&
    row.ceilingVnd > 0 &&
    row.floorVnd > row.ceilingVnd
  ) {
    warnings.push(`${row.code}: Sàn (${row.floorVnd}) lớn hơn Trần (${row.ceilingVnd})`)
  }
  if (row.bom.length === 0 && row.priceStatus !== "CHƯA CÓ GIÁ VỐN") {
    warnings.push(`${row.code}: có giá vốn nhưng không có dòng BOM nào`)
  }
  return warnings
}
