import { ImageResponse } from "next/og"
import type { CatalogCollageData } from "@/modules/greeting-card/use-cases/catalog-collage"

export const COLLAGE_SIZE = { width: 1200, height: 630 }

// Bộ dựng ảnh (satori) không đọc CSS token — màu viết thẳng theo bảng màu "điện ảnh" của thumbnail.
const C = { ink: "#120A0D", wine: "#6B1A2E", champ: "#D9B877", cream: "#FBF5EE", bar: "#000000" }

const GALLERY = { width: 560, height: 482, gap: 12 }
const MAIN_WIDTH = Math.round((GALLERY.width - GALLERY.gap) * 0.7)
const SIDE_WIDTH = GALLERY.width - GALLERY.gap - MAIN_WIDTH

function Photo({ src, width, height, dim }: { src: string; width: number; height: number; dim?: boolean }) {
  return (
    <div style={{ display: "flex", position: "relative", width, height, borderRadius: 6, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={width} height={height} style={{ objectFit: "cover" }} alt="" />
      {dim && <div style={{ position: "absolute", inset: 0, background: "rgba(18,10,13,0.22)" }} />}
    </div>
  )
}

function MoreBadge({ count }: { count: number }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        display: "flex",
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 22,
        fontWeight: 700,
        color: C.cream,
        background: "rgba(18,10,13,0.75)",
        border: `1px solid ${C.champ}`,
      }}
    >
      +{count}
    </div>
  )
}

/** Logo thật của tiệm: đặt trọn trong khung sáng (không cắt — logo chữ ngang vẫn đủ); chưa có logo → chữ cái đầu. */
function LogoMark({ logo, shopName, size, wide }: { logo: string | null; shopName: string | null; size: number; wide?: boolean }) {
  if (logo) {
    const width = wide ? size * 2.6 : size
    return (
      <div style={{ display: "flex", padding: size * 0.12, borderRadius: size * 0.18, background: C.cream }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={width} height={size} style={{ objectFit: "contain" }} alt="" />
      </div>
    )
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size / 2,
        background: "rgba(251,245,238,0.12)",
        border: `2px solid ${C.champ}`,
        color: C.champ,
        fontSize: size / 2,
      }}
    >
      {(shopName?.trim()[0] ?? "✿").toUpperCase()}
    </div>
  )
}

/** 1 ảnh: phủ kín · 2 ảnh: chính + 1 phụ · từ 3 ảnh: chính 70% + 2 phụ, nhãn "+N" khi còn mẫu. */
function Gallery({ images, productCount }: { images: string[]; productCount: number }) {
  const shown = images.slice(0, 3)
  const [main, ...sides] = shown
  const more = productCount - shown.length
  if (!main) return null
  if (sides.length === 0) return <Photo src={main} width={GALLERY.width} height={GALLERY.height} />
  const sideHeight = sides.length === 1 ? GALLERY.height : (GALLERY.height - GALLERY.gap) / 2
  return (
    <div style={{ display: "flex", gap: GALLERY.gap }}>
      <Photo src={main} width={MAIN_WIDTH} height={GALLERY.height} />
      <div style={{ display: "flex", flexDirection: "column", gap: GALLERY.gap }}>
        {sides.map((src, i) => (
          <div key={i} style={{ display: "flex", position: "relative" }}>
            <Photo src={src} width={SIDE_WIDTH} height={sideHeight} dim />
            {i === sides.length - 1 && more > 0 && <MoreBadge count={more} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyGallery({ logo, shopName }: { logo: string | null; shopName: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: GALLERY.width,
        height: GALLERY.height,
        borderRadius: 6,
        backgroundImage: `radial-gradient(circle at 70% 30%, #7A2238 0%, #3A0F1C 55%, ${C.ink} 100%)`,
      }}
    >
      <LogoMark logo={logo} shopName={shopName} size={130} wide />
    </div>
  )
}

/** Thumbnail 1200×630 kiểu poster phim cho link bộ sưu tập: ảnh mẫu thật, logo, tên, khoảng giá. */
export function renderCatalogCollage(data: CatalogCollageData, init?: ResponseInit) {
  const hasImages = data.images.length > 0
  const longTitle = data.catalogName.length > 22
  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: C.ink, color: C.cream }}>
        {data.images[0] && (
          // Nền là chính ảnh chính, phóng to và phủ tối: tông màu luôn ăn theo màu hoa
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.images[0]} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.45 }} alt="" />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(90deg, rgba(18,10,13,0.97) 0%, rgba(18,10,13,0.85) 45%, rgba(18,10,13,0.45) 100%)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 34, background: C.bar }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 34, background: C.bar }} />

        <div style={{ position: "absolute", left: 64, top: 66, display: "flex", alignItems: "center", gap: 16 }}>
          <LogoMark logo={data.logo} shopName={data.shopName} size={64} wide />
          {/* Logo thường đã có tên tiệm — chỉ viết tên khi chưa có logo */}
          {!data.logo && data.shopName && <div style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase" }}>{data.shopName}</div>}
        </div>

        <div style={{ position: "absolute", left: 64, top: 170, width: 470, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 17, letterSpacing: 5, color: C.champ }}>BỘ SƯU TẬP</div>
          <div style={{ display: "block", fontSize: longTitle ? 52 : 72, lineHeight: 1.08, lineClamp: 2 }}>{data.catalogName}</div>
          <div style={{ width: 64, height: 2, background: C.champ }} />
          {data.priceLabel && <div style={{ fontSize: 30 }}>{data.priceLabel}</div>}
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 6,
              padding: "14px 28px",
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              color: C.ink,
              background: C.champ,
            }}
          >
            {data.priceLabel ? "Xem mẫu và đặt hoa" : "Xem mẫu hoa"}
          </div>
        </div>

        <div style={{ position: "absolute", right: 56, top: 74, display: "flex" }}>
          {hasImages ? (
            <Gallery images={data.images} productCount={data.productCount} />
          ) : (
            <EmptyGallery logo={data.logo} shopName={data.shopName} />
          )}
        </div>
      </div>
    ),
    { ...COLLAGE_SIZE, ...init }
  )
}
