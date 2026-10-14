import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { getPublicGreetingCatalog } from "./get-public-greeting-catalog"
import { getPublicGreetingCatalogBySlug } from "./get-public-greeting-catalog-by-slug"
import { PUBLIC_IMAGE_MAX_BYTES, isSafePublicImageUrl } from "../domain/public-image-url"
import { getGreetingCatalogForCustomer } from "./get-greeting-catalog"

export const COLLAGE_MAX_IMAGES = 4

export interface CatalogCollageData {
  catalogName: string
  shopName: string | null
  priceLabel: string | null
  /** Ảnh dạng data URL (chỉ JPG/PNG — bộ dựng ảnh không đọc được WEBP). */
  images: string[]
}

type PublicData = Awaited<ReturnType<typeof getPublicGreetingCatalog>>

const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" }

/** Khoá kho từ URL ký `/api/v1/storage/<key>?exp=…` do repository sinh. */
function storageKeyOf(url: string): string | null {
  const match = /^\/api\/v1\/storage\/([^?]+)/.exec(url)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")}đ`
}

/** "Từ 350.000đ" / "350.000đ – 1.200.000đ"; không mẫu nào có giá → null. */
export function priceLabelOf(prices: Array<number | null>): string | null {
  const known = prices.filter((p): p is number => typeof p === "number" && p > 0)
  if (known.length === 0) return null
  const min = Math.min(...known)
  const max = Math.max(...known)
  return min === max ? formatVnd(min) : `${formatVnd(min)} – ${formatVnd(max)}`
}

async function loadImages(urls: string[]): Promise<string[]> {
  const out: string[] = []
  for (const url of urls) {
    if (out.length >= COLLAGE_MAX_IMAGES) break
    const key = storageKeyOf(url)
    const mime = key ? MIME_BY_EXT[key.split(".").pop()?.toLowerCase() ?? ""] : undefined
    if (key && mime) {
      try {
        const bytes = await getStorageProvider().get(key)
        out.push(`data:${mime};base64,${Buffer.from(bytes).toString("base64")}`)
        continue
      } catch {
        // ảnh hỏng/mất: thử tiếp các nguồn khác
      }
    }
    // Hỗ trợ ảnh từ URL tuyệt đối (CDN hoặc proxy ảnh công khai)
    if (isSafePublicImageUrl(url)) {
      try {
        // Không theo chuyển hướng: một URL công khai có thể chuyển sang địa chỉ nội bộ
        const res = await fetch(url, { signal: AbortSignal.timeout(2500), redirect: "error" })
        const size = Number(res.headers.get("content-length") ?? "0")
        if (res.ok && size <= PUBLIC_IMAGE_MAX_BYTES) {
          const contentType = res.headers.get("content-type")?.toLowerCase() || ""
          if (contentType.includes("jpeg") || contentType.includes("jpg") || contentType.includes("png")) {
            const buffer = await res.arrayBuffer()
            if (buffer.byteLength > PUBLIC_IMAGE_MAX_BYTES) continue
            const imageMime = contentType.includes("png") ? "image/png" : "image/jpeg"
            out.push(`data:${imageMime};base64,${Buffer.from(buffer).toString("base64")}`)
          }
        }
      } catch {
        // bỏ qua nếu lỗi mạng hoặc timeout
      }
    }
  }
  return out
}

async function toCollage(data: PublicData): Promise<CatalogCollageData | null> {
  if (data.status !== "ACTIVE") return null
  return {
    catalogName: data.catalog.name,
    shopName: data.shop?.name ?? null,
    priceLabel: priceLabelOf(data.products.map((p) => p.price)),
    images: await loadImages(data.products.map((p) => p.imageUrl).filter((u): u is string => !!u)),
  }
}

export async function catalogCollageById(catalogId: string): Promise<CatalogCollageData | null> {
  return toCollage(await getPublicGreetingCatalog(catalogId))
}

export async function catalogCollageBySlug(orgSlug: string, catalogCode: string): Promise<CatalogCollageData | null> {
  return toCollage(await getPublicGreetingCatalogBySlug(orgSlug, catalogCode))
}

export async function catalogCollageBySendCode(sendCode: string): Promise<CatalogCollageData | null> {
  const data = await getGreetingCatalogForCustomer(sendCode)
  if (data.status !== "ACTIVE") return null
  return {
    catalogName: data.catalog.name,
    shopName: data.shop?.name ?? null,
    priceLabel: priceLabelOf(data.products.map((p) => p.price)),
    images: await loadImages(data.products.map((p) => p.imageUrl).filter((u): u is string => !!u)),
  }
}
