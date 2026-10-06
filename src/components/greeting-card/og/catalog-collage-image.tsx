import { ImageResponse } from "next/og"
import type { CatalogCollageData } from "@/modules/greeting-card/use-cases/catalog-collage"

export const COLLAGE_SIZE = { width: 1200, height: 630 }

// Bộ dựng ảnh (satori) không đọc CSS token — màu viết thẳng, khớp bảng màu thương hiệu.
const C = { bg: "#FFF8F5", panel: "#FFFFFF", text: "#2B1D1A", muted: "#7A6460", primary: "#C2185B", tile: "#F3E6E2" }

function Tiles({ images }: { images: string[] }) {
  const n = images.length
  // 1 ảnh: phủ kín · 2 ảnh: 2 cột · 3–4 ảnh: lưới 2×2 (ô trống tô nền)
  const cells = n <= 1 ? 1 : n === 2 ? 2 : 4
  const w = cells === 1 ? 630 : 315
  const h = cells === 4 ? 315 : 630
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: 630, height: 630, background: C.tile }}>
      {Array.from({ length: cells }, (_, i) =>
        images[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={images[i]} width={w} height={h} style={{ objectFit: "cover" }} alt="" />
        ) : (
          <div key={i} style={{ width: w, height: h, background: C.tile }} />
        )
      )}
    </div>
  )
}

/** Ảnh ghép 1200×630 cho link bộ sưu tập: tối đa 4 mẫu + tên, khoảng giá, tên tiệm. */
export function renderCatalogCollage(data: CatalogCollageData, init?: ResponseInit) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: C.bg }}>
        {data.images.length > 0 && <Tiles images={data.images} />}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: 56, gap: 20 }}>
          {data.shopName && <div style={{ fontSize: 30, color: C.muted }}>{data.shopName}</div>}
          <div style={{ fontSize: 60, fontWeight: 700, color: C.text, lineHeight: 1.15 }}>{data.catalogName}</div>
          {data.priceLabel && <div style={{ fontSize: 36, fontWeight: 700, color: C.primary }}>{data.priceLabel}</div>}
          <div style={{ display: "flex", marginTop: 12, fontSize: 28, color: C.panel, background: C.primary, borderRadius: 999, padding: "12px 28px", alignSelf: "flex-start" }}>
            Xem mẫu và đặt hoa
          </div>
        </div>
      </div>
    ),
    { ...COLLAGE_SIZE, ...init }
  )
}
