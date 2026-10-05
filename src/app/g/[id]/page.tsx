import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicGreetingCatalog } from "@/modules/greeting-card/use-cases/get-public-greeting-catalog"
import { ShopContactBar } from "@/components/greeting-card/customer/shop-contact-bar"
import { BrochurePublicView } from "@/components/greeting-card/customer/brochure-public-view"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getPublicGreetingCatalog(id)
  if (data.status !== "ACTIVE") {
    return { title: "Bộ Sưu Tập Mẫu Hoa — FloraOS" }
  }
  const firstImage = data.products.find((p) => p.imageUrl)?.imageUrl
  return {
    title: `${data.catalog.name} — Bộ Sưu Tập Mẫu Hoa`,
    description: data.catalog.description ?? `Xem bộ sưu tập hoa tươi ${data.catalog.name}`,
    openGraph: {
      title: `${data.catalog.name} — Bộ Sưu Tập Mẫu Hoa`,
      description: data.catalog.description ?? `Xem bộ sưu tập hoa tươi ${data.catalog.name}`,
      type: "website",
      images: firstImage ? [{ url: firstImage }] : [],
    },
  }
}

export default async function PublicGreetingCatalogPage({ params }: PageProps) {
  const { id } = await params
  const data = await getPublicGreetingCatalog(id)

  if (data.status === "NOT_FOUND") {
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
