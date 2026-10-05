import { MessageCircle, Phone } from "lucide-react"
import type { ShopContact } from "@/modules/greeting-card/domain/shop-contact"

/**
 * Thanh thông tin cửa hàng trên mọi màn khách: logo + tên, nút Gọi và Chat Zalo.
 * Khách biết đang mua của ai và hỏi được ngay khi phân vân.
 */
export function ShopContactBar({ shop }: { shop: ShopContact }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center gap-2.5 px-4">
        {shop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full border border-border object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-body font-bold text-primary">
            {shop.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <p className="min-w-0 flex-1 truncate text-body font-bold text-foreground">{shop.name}</p>
        {shop.phone && (
          <a
            href={`tel:${shop.phone}`}
            aria-label={`Gọi ${shop.name}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-3 text-body-sm font-semibold text-foreground hover:bg-surface-muted"
          >
            <Phone size={16} aria-hidden="true" />
            Gọi
          </a>
        )}
        {shop.zaloUrl && (
          <a
            href={shop.zaloUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Chat Zalo với ${shop.name}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-3 text-body-sm font-semibold text-surface hover:bg-primary-dark"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Zalo
          </a>
        )}
      </div>
    </header>
  )
}
