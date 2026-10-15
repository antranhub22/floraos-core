import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { getPublicGreetingCatalog } from "./get-public-greeting-catalog"
import { getPublicGreetingCatalogBySlug } from "./get-public-greeting-catalog-by-slug"
import { PUBLIC_IMAGE_MAX_BYTES, isSafePublicImageUrl } from "../domain/public-image-url"
import { getGreetingCatalogForCustomer } from "./get-greeting-catalog"
import { webpToJpegDataUrl } from "../adapters/collage-image-transcoder"

export const COLLAGE_MAX_IMAGES = 3

export interface CatalogCollageData {
  catalogName: string
  shopName: string | null
  priceLabel: string | null
  /** Logo tiệm dạng data URL; null → dùng chữ cái đầu tên tiệm */
  logo: string | null
  /** Tổng số mẫu trong bộ sưu tập — ảnh hiện tối đa 3, phần còn lại thành nhãn "+N" */
  productCount: number
  /** Ảnh dạng data URL JPG/PNG — ảnh WEBP đã được đổi sang JPG vì bộ dựng ảnh không đọc được WEBP. */
  images: string[]
}

type PublicData = Awaited<ReturnType<typeof getPublicGreetingCatalog>>

const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }

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

/** JPG/PNG giữ nguyên; WEBP đổi sang JPG; định dạng khác → null. */
async function toDataUrl(bytes: Uint8Array, mime: string): Promise<string | null> {
  if (mime === "image/webp") return webpToJpegDataUrl(bytes)
  if (mime === "image/jpeg" || mime === "image/png") return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`
  return null
}

function mimeOfContentType(contentType: string): string | null {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "image/jpeg"
  if (contentType.includes("png")) return "image/png"
  if (contentType.includes("webp")) return "image/webp"
  return null
}

async function loadFromStorage(url: string): Promise<string | null> {
  const key = storageKeyOf(url)
  const mime = key ? MIME_BY_EXT[key.split(".").pop()?.toLowerCase() ?? ""] : undefined
  if (!key || !mime) return null
  try {
    return await toDataUrl(await getStorageProvider().get(key), mime)
  } catch {
    return null // ảnh hỏng/mất: thử nguồn khác
  }
}

// Hỗ trợ ảnh từ URL tuyệt đối (CDN hoặc proxy ảnh công khai)
async function loadFromPublicUrl(url: string): Promise<string | null> {
  if (!isSafePublicImageUrl(url)) return null
  try {
    // Không theo chuyển hướng: một URL công khai có thể chuyển sang địa chỉ nội bộ
    const res = await fetch(url, { signal: AbortSignal.timeout(2500), redirect: "error" })
    const size = Number(res.headers.get("content-length") ?? "0")
    const mime = mimeOfContentType(res.headers.get("content-type")?.toLowerCase() || "")
    if (!res.ok || size > PUBLIC_IMAGE_MAX_BYTES || !mime) return null
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > PUBLIC_IMAGE_MAX_BYTES) return null
    return await toDataUrl(new Uint8Array(buffer), mime)
  } catch {
    return null // bỏ qua nếu lỗi mạng hoặc timeout
  }
}

async function loadImages(urls: string[]): Promise<string[]> {
  const out: string[] = []
  for (const url of urls) {
    if (out.length >= COLLAGE_MAX_IMAGES) break
    const image = (await loadFromStorage(url)) ?? (await loadFromPublicUrl(url))
    if (image) out.push(image)
  }
  return out
}

type CollageSource = {
  catalog: { name: string }
  shop?: { name: string; logoUrl?: string | null } | null
  products: Array<{ price: number | null; imageUrl: string | null }>
}

async function buildCollage(data: CollageSource): Promise<CatalogCollageData> {
  const logoUrl = data.shop?.logoUrl
  return {
    catalogName: data.catalog.name,
    shopName: data.shop?.name ?? null,
    priceLabel: priceLabelOf(data.products.map((p) => p.price)),
    logo: logoUrl ? ((await loadImages([logoUrl]))[0] ?? null) : null,
    productCount: data.products.length,
    images: await loadImages(data.products.map((p) => p.imageUrl).filter((u): u is string => !!u)),
  }
}

async function toCollage(data: PublicData): Promise<CatalogCollageData | null> {
  if (data.status !== "ACTIVE") return null
  return buildCollage(data)
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
  return buildCollage(data)
}
