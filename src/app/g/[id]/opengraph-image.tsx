import { catalogCollageById } from "@/modules/greeting-card/use-cases/catalog-collage"
import { COLLAGE_SIZE, renderCatalogCollage } from "@/components/greeting-card/og/catalog-collage-image"

export const size = COLLAGE_SIZE
export const contentType = "image/png"
export const alt = "Bộ sưu tập mẫu hoa"

/** Ảnh xem trước khi dán link /g/... vào Zalo/Facebook: ghép nhiều mẫu thay vì 1 ảnh. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await catalogCollageById(id)
  return renderCatalogCollage(data ?? { catalogName: "Bộ sưu tập mẫu hoa", shopName: null, priceLabel: null, images: [] })
}
