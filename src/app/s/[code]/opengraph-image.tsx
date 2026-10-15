import { shareLinkPreview } from "@/modules/greeting-card/use-cases/share-links"
import { catalogCollageById } from "@/modules/greeting-card/use-cases/catalog-collage"
import { COLLAGE_SIZE, renderCatalogCollage } from "@/components/greeting-card/og/catalog-collage-image"

export const size = COLLAGE_SIZE
export const contentType = "image/png"
export const alt = "Bộ sưu tập mẫu hoa"

/** Ảnh xem trước khi dán link /s/... vào Zalo/Messenger/Facebook: ghép các mẫu hoa nổi bật. */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const preview = await shareLinkPreview(code.toUpperCase())
  if (!preview) {
    return renderCatalogCollage({ catalogName: "Bộ Sưu Tập Mẫu Hoa", shopName: null, priceLabel: null, logo: null, productCount: 0, images: [] })
  }
  const data = await catalogCollageById(preview.catalogId)
  return renderCatalogCollage(data ?? { catalogName: preview.name, shopName: null, priceLabel: null, logo: null, productCount: 0, images: [] })
}
