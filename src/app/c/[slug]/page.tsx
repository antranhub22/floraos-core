import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicCatalog } from "@/modules/catalog-links/use-cases/get-public-catalog"
import { CatalogStorefront } from "@/components/catalog/catalog-storefront"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getPublicCatalog(slug)

  if (data.status !== "ACTIVE") {
    return {
      title: "Catalog Mẫu Hoa — FloraOS",
      description: "Xem bộ sưu tập hoa tươi trực tuyến.",
    }
  }

  const firstImage = data.products.find((p) => p.imageUrl)?.imageUrl

  return {
    title: `${data.catalog.name} — ${data.shop.name}`,
    description: data.catalog.description || `Xem bộ sưu tập hoa tươi mới nhất từ ${data.shop.name}`,
    openGraph: {
      title: `${data.catalog.name} — ${data.shop.name}`,
      description: data.catalog.description || `Xem bộ sưu tập hoa tươi mới nhất từ ${data.shop.name}`,
      type: "website",
      images: firstImage ? [{ url: firstImage }] : [],
    },
  }
}

export default async function PublicCatalogPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getPublicCatalog(slug)

  if (data.status === "NOT_FOUND") {
    notFound()
  }

  return <CatalogStorefront initialData={data} />
}

export const dynamic = "force-dynamic"
