import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicGreetingCatalogBySlug } from "@/modules/greeting-card/use-cases/get-public-greeting-catalog-by-slug"
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

export default async function PublicGreetingCatalogSlugPage({ params }: PageProps) {
  const { orgSlug, catalogCode } = await params
  const data = await getPublicGreetingCatalogBySlug(orgSlug, catalogCode)

  if (data.status === "NOT_FOUND") {
    notFound()
  }

  return <BrochurePublicView catalog={data.catalog} products={data.products} shipping={data.shipping} />
}

export const dynamic = "force-dynamic"
