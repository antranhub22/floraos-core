import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicGreetingCatalogBySlug } from "@/modules/greeting-card/use-cases/get-public-greeting-catalog-by-slug"
import { LinkUnavailable } from "@/components/greeting-card/customer/link-unavailable"
import { ShopContactBar } from "@/components/greeting-card/customer/shop-contact-bar"
import { getShopContactBySlug } from "@/modules/greeting-card/use-cases/get-shop-contact"
import { BrochurePublicView } from "@/components/greeting-card/customer/brochure-public-view"

interface PageProps {
  params: Promise<{ orgSlug: string; catalogCode: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orgSlug, catalogCode } = await params
  const data = await getPublicGreetingCatalogBySlug(orgSlug, catalogCode)
  if (data.status !== "ACTIVE") {
    return { title: "Bộ Sưu Tập Mẫu Hoa — FloraOS" }
  }
  return {
    title: `${data.catalog.name} — Bộ Sưu Tập Mẫu Hoa`,
    description: data.catalog.description ?? `Xem bộ sưu tập hoa tươi ${data.catalog.name}`,
    openGraph: {
      title: `${data.catalog.name} — Bộ Sưu Tập Mẫu Hoa`,
      description: data.catalog.description ?? `Xem bộ sưu tập hoa tươi ${data.catalog.name}`,
      type: "website",
      // Ảnh xem trước: ảnh ghép nhiều mẫu ở opengraph-image.tsx cùng thư mục
    },
  }
}

export default async function PublicGreetingCatalogSlugPage({ params }: PageProps) {
  const { orgSlug, catalogCode } = await params
  const data = await getPublicGreetingCatalogBySlug(orgSlug, catalogCode)

  if (data.status === "NOT_FOUND") {
    // Đúng cửa hàng nhưng bộ sưu tập đã ngừng/sai mã: hiện liên hệ tiệm thay vì 404 chung
    const shop = await getShopContactBySlug(orgSlug)
    if (shop) return <LinkUnavailable shop={shop} />
    notFound()
  }

  return (
    <>
      {data.shop && <ShopContactBar shop={data.shop} />}
      <BrochurePublicView catalog={data.catalog} products={data.products} shipping={data.shipping} />
    </>
  )
}

export const dynamic = "force-dynamic"
