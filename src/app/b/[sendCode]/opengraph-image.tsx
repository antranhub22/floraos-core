import { catalogCollageBySendCode } from "@/modules/greeting-card/use-cases/catalog-collage"
import { COLLAGE_SIZE, renderCatalogCollage } from "@/components/greeting-card/og/catalog-collage-image"

export const size = COLLAGE_SIZE
export const contentType = "image/png"
export const alt = "Thẻ chào mẫu hoa tươi"

/** Ảnh xem trước khi dán link /b/... vào Zalo/Messenger/Facebook: ghép các mẫu hoa nổi bật. */
export default async function Image({ params }: { params: Promise<{ sendCode: string }> }) {
  const { sendCode } = await params
  const data = await catalogCollageBySendCode(sendCode)
  return renderCatalogCollage(data ?? { catalogName: "Thẻ Chào Mẫu Hoa", shopName: null, priceLabel: null, images: [] })
}
