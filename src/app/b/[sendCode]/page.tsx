import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGreetingCatalogForCustomer } from "@/modules/greeting-card/use-cases/get-greeting-catalog"
import { LinkUnavailable } from "@/components/greeting-card/customer/link-unavailable"
import { BrochureCustomerExperience } from "@/components/greeting-card/customer/brochure-customer-experience"

interface PageProps {
  params: Promise<{ sendCode: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sendCode } = await params
  const data = await getGreetingCatalogForCustomer(sendCode)

  if (data.status !== "ACTIVE") {
    return {
      title: "Thẻ Chào Mẫu Hoa — FloraOS",
      description: "Xem bộ sưu tập hoa tươi trực tuyến.",
    }
  }

  const firstImage = data.products.find((p) => p.imageUrl)?.imageUrl

  return {
    title: `${data.catalog.name} — Thẻ Chào Hoa Tươi`,
    description: data.catalog.description || `Xem bộ sưu tập hoa tươi mới nhất`,
    openGraph: {
      title: `${data.catalog.name} — Thẻ Chào Hoa Tươi`,
      description: data.catalog.description || `Xem bộ sưu tập hoa tươi mới nhất`,
      type: "website",
      images: firstImage ? [{ url: firstImage }] : [],
    },
  }
}

export default async function PublicBrochurePage({ params }: PageProps) {
  const { sendCode } = await params
  const data = await getGreetingCatalogForCustomer(sendCode)

  if (data.status === "NOT_FOUND") {
    notFound()
  }
  if (data.status === "UNAVAILABLE") return <LinkUnavailable shop={data.shop} />

  return <BrochureCustomerExperience initialData={data} />
}

export const dynamic = "force-dynamic"
