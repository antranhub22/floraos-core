import { driveThumbProxySrc } from "@/components/greeting-card/drive-thumb-image"
import {
  CATEGORIES,
  SHAPES,
  FACINGS,
  type ProductFormValues,
  type FlowerItem,
} from "./ai-product-helpers"

export interface InitialProductInput {
  id: string
  name: string
  code: string
  category: string | null
  shape: string | null
  facing?: string | null | undefined
  container?: string | null | undefined
  status: "ACTIVE" | "DRAFT" | "ARCHIVED"
  attributes?: Record<string, unknown> | null | undefined
  masterImageUrl?: string | undefined
  price_vnd?: number | null | undefined
  driveLink?: string | undefined
}

/**
 * Trích xuất các giá trị form ban đầu từ dữ liệu sản phẩm CSDL
 * Hỗ trợ nhận diện đầy đủ: storage image, imageUrl, và link Google Drive.
 */
export function extractInitialFormValues(product: InitialProductInput): {
  values: ProductFormValues
  previewUrl: string | null
} {
  const attrs = (product.attributes as Record<string, unknown> | null) ?? {}
  const rawBom = (attrs.bom as Record<string, unknown> | undefined) ?? {}
  const rawFlowers = Array.isArray(rawBom.flowers) ? rawBom.flowers : []

  const flowers: FlowerItem[] = rawFlowers.map((f: unknown, i: number) => {
    const row = (f as Record<string, unknown>) ?? {}
    return {
      id: `flower-init-${i}-${Date.now()}`,
      name: String(row.name ?? ""),
      quantity: Number(row.quantity ?? 1),
      unit: String(row.unit ?? "cành"),
      color: String(row.color ?? "Tiêu chuẩn"),
      role: String(row.role ?? "Chủ đạo"),
    }
  })

  const initialPrice =
    typeof attrs.price === "number" && attrs.price > 0
      ? attrs.price.toLocaleString("vi-VN")
      : typeof product.price_vnd === "number" && product.price_vnd > 0
      ? product.price_vnd.toLocaleString("vi-VN")
      : ""

  const assetId = (attrs.image_asset_id as string) ?? null
  const driveLink = product.driveLink || (typeof attrs.drive_link === "string" ? attrs.drive_link : null)
  const existingUrl =
    product.masterImageUrl ||
    (typeof attrs.imageUrl === "string" ? attrs.imageUrl : null) ||
    (driveLink ? driveThumbProxySrc(driveLink) : null)

  const values: ProductFormValues = {
    name: product.name || "",
    code: product.code || "",
    category: product.category || CATEGORIES[0] || "Bó hoa",
    shape: product.shape || SHAPES[0] || "Tròn",
    facing: product.facing || FACINGS[0] || "Một mặt",
    container: product.container || "",
    priceVnd: initialPrice,
    primaryColor: (attrs.color as string) || "",
    description: (attrs.description as string) || "",
    status: product.status === "DRAFT" ? "DRAFT" : "ACTIVE",
    flowers: flowers.length > 0 ? flowers : [
      { id: "init-1", name: "", quantity: 1, unit: "cành", color: "", role: "Chủ đạo" },
    ],
    imageAssetId: assetId,
    imageUrl: existingUrl,
    driveLink,
  }

  return { values, previewUrl: existingUrl }
}
