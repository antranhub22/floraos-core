import { Metadata } from "next"
import { getPublicGreetingCatalog } from "@/modules/greeting-card/use-cases/get-public-greeting-catalog"
import { ShopContactBar } from "@/components/greeting-card/customer/shop-contact-bar"
import { BrochurePublicView } from "@/components/greeting-card/customer/brochure-public-view"
import { LinkUnavailable } from "@/components/greeting-card/customer/link-unavailable"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getPublicGreetingCatalog(id)
  if (data.status !== "ACTIVE") {
    return { title: "Bộ Sưu Tập Mẫu Hoa" }
  }
  const title = `${data.catalog.name} — Bộ Sưu Tập Mẫu Hoa`
  const description = data.catalog.description ?? `Xem bộ sưu tập hoa tươi ${data.catalog.name}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: data.shop?.name ?? undefined,
      // Ảnh xem trước: ảnh ghép nhiều mẫu ở opengraph-image.tsx cùng thư mục
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function PublicGreetingCatalogPage({ params }: PageProps) {
  const { id } = await params
  const data = await getPublicGreetingCatalog(id)

  if (data.status === "NOT_FOUND") {
    return (
      <LinkUnavailable
        title="Link không tồn tại hoặc đã hết hạn"
        message="Bộ sưu tập mẫu hoa này không còn hiệu lực. Vui lòng liên hệ cửa hàng để nhận link mới."
      />
    )
  }

  return (
    <>
      {data.shop && <ShopContactBar shop={data.shop} />}
      <BrochurePublicView catalog={data.catalog} products={data.products} shipping={data.shipping} />
    </>
  )
}

export const dynamic = "force-dynamic"
