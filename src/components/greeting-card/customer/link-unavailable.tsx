import { MessageCircle, Phone } from "lucide-react"
import type { ShopContact } from "@/modules/greeting-card/domain/shop-contact"
import { ShopContactBar } from "./shop-contact-bar"

/**
 * Link đã hết hạn, bị thu hồi hoặc bộ sưu tập đã ngừng — thay cho trang 404 chung,
 * để khách vẫn liên hệ được đúng cửa hàng thay vì bỏ đi.
 */
export function LinkUnavailable({ shop }: { shop: ShopContact }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ShopContactBar shop={shop} />
      <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-title font-bold">Bộ sưu tập này không còn mở</h1>
        <p className="text-body text-text-muted">
          Link có thể đã hết hạn hoặc cửa hàng đã cập nhật mẫu mới. Liên hệ {shop.name} để nhận bộ sưu tập mới nhất.
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          {shop.zaloUrl && (
            <a href={shop.zaloUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-body font-bold text-surface hover:bg-primary-dark">
              <MessageCircle size={18} aria-hidden="true" />
              Nhắn Zalo cho cửa hàng
            </a>
          )}
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border text-body font-bold text-foreground hover:bg-surface-muted">
              <Phone size={18} aria-hidden="true" />
              Gọi {shop.phone}
            </a>
          )}
          {shop.address && <p className="mt-2 text-body-sm text-text-muted">Địa chỉ: {shop.address}</p>}
        </div>
      </main>
    </div>
  )
}
