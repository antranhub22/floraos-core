import { describe, it, expect } from "vitest"
import {
  buildSalesPitchData,
  generateZaloPitchScript,
  formatCurrencyVnd,
  DEFAULT_FREE_GIFTS,
  DEFAULT_GUARANTEES,
} from "../sales-pitch-template"

describe("sales-pitch-template (M01c - Thẻ Chào Sản Phẩm & Kịch bản Zalo)", () => {
  it("formatCurrencyVnd định dạng đúng số tiền", () => {
    expect(formatCurrencyVnd(null)).toBe("Liên hệ báo giá")
    expect(formatCurrencyVnd(850000)).toContain("850.000")
  })

  it("buildSalesPitchData tổng hợp chuẩn từ M01a và M01b", () => {
    const analysisRaw = {
      product_name: "Bó hoa hồng đỏ",
      identity: {
        category: "Bó hoa",
        container: "Bình gốm",
        phong_cach: "Cổ điển",
        dip_su_dung: "Valentine",
      },
      bom: {
        flowers: [
          { name: "Hoa hồng đỏ", quantity: 12, dvt_dem: "bông", mau: "TM01 Đỏ" },
        ],
        foliage: [{ name: "Lá chanh", quantity: 4, dvt_dem: "cành" }],
        accessories: [{ name: "Nơ nhung", quantity: 1 }],
        wrapping: [{ material: "Giấy lụa đỏ" }],
      },
    }

    const copyRaw = {
      suggested_name: "Tình Yêu Nồng Cháy",
      suggested_description: "Bó hoa thể hiện tình yêu bất diệt.",
      suggested_style: "Lãng mạn & Quý phái",
      suggested_occasions: ["Valentine", "Kỷ niệm ngày cưới"],
      suggested_price_segment: "premium",
    }

    const pitch = buildSalesPitchData(analysisRaw, copyRaw, { priceVnd: 990000 }, "https://example.com/flower.jpg")

    expect(pitch.productName).toBe("Tình Yêu Nồng Cháy")
    expect(pitch.style).toBe("Lãng mạn & Quý phái")
    expect(pitch.occasions).toEqual(["Valentine", "Kỷ niệm ngày cưới"])
    expect(pitch.description).toBe("Bó hoa thể hiện tình yêu bất diệt.")
    expect(pitch.imageUrl).toBe("https://example.com/flower.jpg")
    expect(pitch.mainFlowers.length).toBe(1)
    expect(pitch.mainFlowers[0]?.name).toBe("Hoa hồng đỏ")
    expect(pitch.mainFlowers[0]?.quantity).toBe(12)
    expect(pitch.priceVnd).toBe(990000)
    expect(pitch.freeGifts).toEqual(DEFAULT_FREE_GIFTS)
    expect(pitch.guarantees).toEqual(DEFAULT_GUARANTEES)
    expect(pitch.status).toBe("DRAFT")
  })

  it("cho phép chỉnh sửa 100% tất cả các trường trước khi chốt duyệt xuất bản final", () => {
    const analysisRaw = {
      product_name: "Hoa mẫu ban đầu",
      bom: {
        flowers: [{ name: "Cúc vàng", quantity: 5, dvt_dem: "cành" }],
      },
    }

    const customPitch = buildSalesPitchData(
      analysisRaw,
      null,
      {
        productName: "Bình Hoa Khởi Sắc 2026",
        style: "Hoàng Gia Châu Âu",
        occasions: ["Khai trương hồng phát", "Đại hội"],
        description: "Thiết kế sang trọng đón tài lộc cho doanh nghiệp.",
        mainFlowers: [
          { name: "Lan Hồ Điệp trắng", quantity: 8, unit: "cành", color: "Trắng tuyết", role: "Chủ đạo" },
          { name: "Hồng Ohara", quantity: 15, unit: "bông", color: "Hồng pastel", role: "Điểm nhấn" },
        ],
        foliageItems: [
          { name: "Lá bạc Eucalyptus", quantity: 6, unit: "cành" },
        ],
        accessoryItems: [
          { name: "Ruy băng gân in logo nhũ vàng", quantity: 1, unit: "cuộn" },
        ],
        wrapping: "Không dùng giấy, cắm bình nghệ thuật",
        container: "Bình gốm Bát Tràng men rạn",
        heightCm: 70,
        widthCm: 50,
        priceVnd: 2800000,
        originalPriceVnd: 3200000,
        freeGifts: ["Tặng biển tên đồng cao cấp", "Tặng đế xoay hoa"],
        guarantees: ["Cam kết hoa tươi trên 7 ngày", "Giao xe hơi chuyên dụng"],
        shopHotline: "0909 888 999",
        customNote: "Áp dụng giảm 10% cho khách hàng thân thiết",
        status: "FINALIZED",
        finalizedAt: "2026-09-14T10:30:00Z",
      },
      "https://example.com/custom.jpg"
    )

    expect(customPitch.productName).toBe("Bình Hoa Khởi Sắc 2026")
    expect(customPitch.style).toBe("Hoàng Gia Châu Âu")
    expect(customPitch.occasions).toEqual(["Khai trương hồng phát", "Đại hội"])
    expect(customPitch.mainFlowers.length).toBe(2)
    expect(customPitch.mainFlowers[0]?.name).toBe("Lan Hồ Điệp trắng")
    expect(customPitch.mainFlowers[0]?.quantity).toBe(8)
    expect(customPitch.foliageItems[0]?.name).toBe("Lá bạc Eucalyptus")
    expect(customPitch.container).toBe("Bình gốm Bát Tràng men rạn")
    expect(customPitch.priceVnd).toBe(2800000)
    expect(customPitch.originalPriceVnd).toBe(3200000)
    expect(customPitch.freeGifts.length).toBe(2)
    expect(customPitch.status).toBe("FINALIZED")
    expect(customPitch.finalizedAt).toBe("2026-09-14T10:30:00Z")

    const script = generateZaloPitchScript(customPitch)
    expect(script).toContain("BÌNH HOA KHỞI SẮC 2026")
    expect(script).toContain("Lan Hồ Điệp trắng (8 cành)")
    expect(script).toContain("Hồng Ohara (15 bông)")
    expect(script).toContain("Lá đệm: Lá bạc Eucalyptus (6 cành)")
    expect(script).toContain("Bình gốm Bát Tràng men rạn")
    expect(script).toContain("2.800.000")
    expect(script).toContain("3.200.000")
    expect(script).toContain("Tặng biển tên đồng cao cấp")
    expect(script).toContain("Cam kết hoa tươi trên 7 ngày")
    expect(script).toContain("0909 888 999")
    expect(script).toContain("Áp dụng giảm 10% cho khách hàng thân thiết")
  })

  it("generateZaloPitchScript sinh đầy đủ nội dung tư vấn khách hàng", () => {
    const pitch = buildSalesPitchData(
      {
        bom: {
          flowers: [{ name: "Hoa Tulip", quantity: 10, dvt_dem: "bông" }],
        },
      },
      {
        suggested_name: "Bó Tulip Vàng Nắng",
        suggested_description: "Mang lại năng lượng tươi mới.",
      },
      { priceVnd: 850000 }
    )

    const script = generateZaloPitchScript(pitch)

    expect(script).toContain("BÓ TULIP VÀNG NẮNG")
    expect(script).toContain("850.000")
    expect(script).toContain("Hoa Tulip (10 bông)")
    expect(script).toContain("QUÀ TẶNG KÈM THEO")
    expect(script).toContain("CAM KẾT DỊCH VỤ TỪ SHOP")
    expect(script).toContain("Cao ~55cm × Rộng ~40cm")
  })
})
