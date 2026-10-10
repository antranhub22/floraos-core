import type { Metadata } from "next"
import { shareLinkPreview } from "@/modules/greeting-card/use-cases/share-links"
import { ShareLinkRedirect } from "@/components/greeting-card/share/share-link-redirect"
import { LinkUnavailable } from "@/components/greeting-card/customer/link-unavailable"

interface PageProps {
  params: Promise<{ code: string }>
}

/** Ảnh và tiêu đề xem trước khi dán link vào Zalo/Facebook — giống link bộ sưu tập gốc. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const preview = await shareLinkPreview((await params).code.toUpperCase())
  if (!preview) return { title: "Bộ Sưu Tập Mẫu Hoa" }
  const title = `${preview.name} — Bộ Sưu Tập Mẫu Hoa`
  const description = preview.description ?? `Xem bộ sưu tập hoa tươi ${preview.name}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      // Ảnh xem trước: ảnh ghép tự động tại opengraph-image.tsx cùng thư mục
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

/**
 * /s/<mã> — link bộ sưu tập mang tên người đã sao chép. Máy quét xem trước chỉ đọc thẻ meta ở đây;
 * trình duyệt của khách tự chuyển sang /s/<mã>/mo để mở phiên riêng tính cho người sao chép.
 */
export default async function ShareLinkPage({ params }: PageProps) {
  const code = (await params).code.toUpperCase()
  const preview = await shareLinkPreview(code)
  if (!preview) {
    return (
      <LinkUnavailable
        title="Link không tồn tại hoặc đã hết hạn"
        message="Đường dẫn xem bộ sưu tập này không còn hiệu lực hoặc đã hết thời gian sử dụng. Vui lòng liên hệ người gửi hoặc cửa hàng để nhận link mới."
      />
    )
  }
  return <ShareLinkRedirect href={`/s/${code}/mo`} name={preview.name} />
}

export const dynamic = "force-dynamic"
