import { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { brochureViewer } from "@/modules/greeting-card/use-cases/brochure-owner"
import { staffOrganizationId } from "@/modules/greeting-card/use-cases/staff-viewer"
import { ownerCookieName } from "@/modules/greeting-card/domain/session-owner"
import { BrochureClaimGate } from "@/components/greeting-card/customer/brochure-claim-gate"
import { BrochureUnlockGate } from "@/components/greeting-card/customer/brochure-unlock-gate"
import { getGreetingCatalogForCustomer } from "@/modules/greeting-card/use-cases/get-greeting-catalog"
import type { ShopContact } from "@/modules/greeting-card/domain/shop-contact"
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
  // của người trước. Dữ liệu phiên chỉ được dựng ra HTML sau khi đã xác định là chủ phiên.
  const data = await getGreetingCatalogForCustomer(sendCode)
  if (data.status === "NOT_FOUND") notFound()
  // Link hết hạn / đóng: báo ngay cho mọi người mở, không cần nhận chủ phiên
  if (data.status === "UNAVAILABLE") return <UnavailableLink reason={data.reason} shop={data.shop} />

  const viewer = await brochureViewer(sendCode, {
    ownerToken: (await cookies()).get(ownerCookieName(sendCode))?.value ?? null,
    staffOrganizationId: await staffOrganizationId(await headers()),
  })
  // Phiên đã có đơn: trình duyệt khác mở lại bằng 4 số cuối SĐT người đặt (PO 08/10/2026)
  if (viewer?.viewer === "OTHER" && data.order) return <BrochureUnlockGate sendCode={sendCode} shop={data.shop} />
  if (viewer?.viewer === "OTHER" && viewer.shareCode) redirect(`/s/${viewer.shareCode}/mo`)
  if (viewer?.viewer === "UNCLAIMED") return <BrochureClaimGate sendCode={sendCode} />
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

function UnavailableLink({ reason, shop }: { reason: "EXPIRED" | "CLOSED"; shop: ShopContact }) {
  if (reason === "CLOSED") return <LinkUnavailable shop={shop} />
  return (
    <LinkUnavailable
      shop={shop}
      title="Link đã hết hạn"
      message={`Link xem mẫu hoa này đã hết thời gian sử dụng. Vui lòng liên hệ ${shop.name} để nhận link mới.`}
    />
  )
}

export const dynamic = "force-dynamic"
