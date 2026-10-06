import { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { brochureViewer } from "@/modules/greeting-card/use-cases/brochure-owner"
import { staffOrganizationId } from "@/modules/greeting-card/use-cases/staff-viewer"
import { ownerCookieName } from "@/modules/greeting-card/domain/session-owner"
import { BrochureClaimGate } from "@/components/greeting-card/customer/brochure-claim-gate"
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
  // Phiên thuộc trình duyệt đã mở đầu tiên: người nhận link chuyển tiếp không thấy lựa chọn / đơn
  // của người trước. Kiểm TRƯỚC khi tải dữ liệu phiên để HTML không chứa gì của phiên.
  const viewer = await brochureViewer(sendCode, {
    ownerToken: (await cookies()).get(ownerCookieName(sendCode))?.value ?? null,
    staffOrganizationId: await staffOrganizationId(await headers()),
  })
  if (viewer?.viewer === "OTHER" && viewer.shareCode) redirect(`/s/${viewer.shareCode}/mo`)
  if (viewer?.viewer === "UNCLAIMED") return <BrochureClaimGate sendCode={sendCode} />

  const data = await getGreetingCatalogForCustomer(sendCode)

  if (data.status === "NOT_FOUND") {
    notFound()
  }
  if (data.status === "UNAVAILABLE") return <LinkUnavailable shop={data.shop} />
  if (viewer?.viewer === "OTHER") {
    return (
      <LinkUnavailable
        shop={data.shop}
        title="Link này đã được mở trên thiết bị khác"
        message={`Mỗi link riêng chỉ dùng trên một thiết bị để giữ an toàn cho đơn hàng của khách. Liên hệ ${data.shop.name} để nhận link bộ sưu tập mới.`}
      />
    )
  }

  return <BrochureCustomerExperience initialData={data} preview={viewer?.viewer === "STAFF"} />
}

export const dynamic = "force-dynamic"
