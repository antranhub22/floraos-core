/**
 * Chặng 02 — lời nhắc + bộ đọc JSON cho bước bóc tách ảnh sản phẩm hoa.
 *
 * 25/09/2026 (nợ #155): KHÔNG còn gọi thẳng API nhà cung cấp ở đây. Lời gọi đi
 * qua cổng AI (`callCapability`, `product-vision-ai-adapter.ts`) với nhiều nhà
 * cung cấp tương đương (OpenAI / Claude / Gemini) theo thứ tự ưu tiên của tiệm.
 * Tệp này chỉ giữ phần THUẦN: lời nhắc hệ thống, lời dặn cho ảnh, và ánh xạ
 * JSON mô hình trả về sang kiểu miền.
 */

import type {
  ProductFlowerComponent,
  ProductVisualAttributes,
  ProductPackaging,
  ProductInferredContext,
  ProductCardAccessory,
} from "../domain/product-intelligence-types";

/** Một dòng hoa / lá / phụ kiện trong JSON mô hình Vision trả về (chưa kiểm dạng). */
interface VisionBomItem {
  name?: string;
  count?: string | number;
  quantity?: string | number;
  unit?: string;
  role?: string;
  color?: string;
  note?: string;
}

export interface VisionExtractionResult {
  productName: string;
  components: ProductFlowerComponent[];
  attributes: ProductVisualAttributes;
  packaging: ProductPackaging;
  context: ProductInferredContext;
}

export const PRODUCT_VISION_SYSTEM_PROMPT = `Bạn là chuyên gia thẩm định thị giác hoa nghệ thuật cao cấp của FloraOS.
Nhiệm vụ của bạn là quan sát thật kỹ bức ảnh sản phẩm hoa tươi được cung cấp, nhận diện chính xác từng chi tiết và xuất ra định dạng JSON thuần túy (không markdown, không giải thích ngoài JSON) theo đúng cấu trúc sau:
{
  "product_name": "Tên thương mại cuốn hút cho sản phẩm (ví dụ: Bó hoa hồng đỏ Passionate Love, Bó hoa tulip cam cháy vintage...)",
  "flowers": [
    {
      "name": "Tên loại hoa chính xác bằng tiếng Việt (ví dụ: Hoa hồng đỏ Ohara, Hoa baby trắng, Hoa cúc tana...)",
      "count": 15, // ước tính số bông / cành nhìn thấy trong ảnh
      "unit": "cành", // hoặc "bông", "nhánh"
      "role": "dominant" // "dominant" cho hoa chủ đạo, "supporting" cho hoa phụ
    }
  ],
  "foliage": [
    {
      "name": "Tên loại lá phụ hoặc cành đệm (ví dụ: Lá bạc Eucalyptus, Lá chanh, Lá đuôi chồn...)",
      "count": 3,
      "unit": "cành"
    }
  ],
  "card": {
    "has_card": true, // true nếu nhìn thấy thiệp chúc mừng, tag cắm, biển mica, dải băng chữ; ngược lại false
    "card_type": "Thiệp gập thiết kế", // "Thiệp gập thiết kế" | "Tag cắm mini" | "Biển mica nghệ thuật" | "Banner dải băng chữ" | "Không có"
    "printed_text": "Chúc mừng sinh nhật em yêu", // BẮT BUỘC: Đọc chính xác chữ in hoặc viết tay nhìn thấy trên thiệp/banner qua OCR thị giác. Nếu không có thiệp hoặc thiệp trắng chưa viết chữ thì để null
    "color": "Tone màu của thiệp (ví dụ: Trắng viền ép kim, Hồng pastel...)"
  },
  "ribbon_detail": {
    "material": "Chất liệu nơ ruy băng (ví dụ: Ruy băng satin lụa bóng, Ruy băng voan mờ, Dây thừngi thô vintage, Ruy băng gân ren...)",
    "color": "Màu sắc của ruy băng (ví dụ: Đỏ ruby, Xanh rêu, Trắng kem, Hồng phấn...)",
    "bow_style": "Kiểu dáng nơ (ví dụ: Nơ cánh bướm 2 tầng, Nơ rủ dài Hàn Quốc, Thắt nút đơn...)"
  },
  "other_accessories": [
    {
      "name": "Tên phụ kiện trang trí đi kèm nếu có (ví dụ: Đèn LED đom đóm, Gấu bông mini tốt nghiệp, Que cắm trái tim, Bóng bay jumbo mica, Vương miện mini...)",
      "quantity": 1,
      "unit": "cái",
      "note": "Ghi chú màu sắc/đặc điểm"
    }
  ],
  "dominant_colors": ["Màu chính 1", "Màu chính 2"], // ví dụ: ["Đỏ nhung", "Trắng kem"]
  "secondary_colors": ["Màu phụ 1"], // ví dụ: ["Xanh rêu", "Xanh lá"]
  "style": "Phong cách thiết kế (ví dụ: Classic Romantic & Sang trọng, Vintage Cổ điển, Hiện đại Hàn Quốc, Tự nhiên mộc mạc...)",
  "shape": "Dáng cắm (ví dụ: Bó tròn tự nhiên, Bó dáng dài, Giỏ hoa để bàn, Hộp hoa trái tim...)",
  "size": "Kích thước ước tính (ví dụ: Tiêu chuẩn (M), Cao cấp (L), Khổng lồ (XL)...)",
  "wrapping_material": "Chất liệu giấy gói (ví dụ: Giấy lụa mờ Kraft gấp nếp, Giấy xi măng, Giấy xốp chống nước...)",
  "wrapping_color": "Màu sắc giấy gói (ví dụ: Trắng kem xếp tầng, Nâu mộc, Đen huyền bí...)",
  "ribbon": "Màu và loại nơ / ruy băng ngắn gọn (ví dụ: Ruy băng voan trắng kem, Ruy băng satin đỏ nhung...)",
  "occasions": ["Dịp tặng phù hợp 1", "Dịp tặng phù hợp 2"], // ví dụ: ["Tỏ tình lãng mạn", "Kỷ niệm tình yêu", "Sinh nhật bạn gái", "Valentine"]
  "audience": "Mô tả tệp khách hàng phù hợp nhất (ví dụ: Nam giới 20–35 tuổi tặng bạn gái / vợ)",
  "suggested_price": 650000, // Giá bán đề xuất thực tế (VND)
  "confidence": 0.9 // Độ tin cậy mô hình tự đánh giá (0–1), KHÔNG làm tròn lên
}`;

export function productVisionUserText(productTitle?: string | undefined): string {
  return `Hãy quan sát thật kỹ và bóc tách toàn diện sản phẩm hoa trong bức ảnh này.${
    productTitle ? ` Gợi ý tiêu đề ban đầu: ${productTitle}.` : ""
  } Đặc biệt chú ý:
1. Nhận diện các loại hoa chính, hoa phụ và cả LÁ PHỤ ĐỆM (foliage).
2. Soi kỹ mặt trước, chân bó và vùng nơ xem CÓ THIỆP / BIỂN CHỮ KHÔNG, đọc chính xác nội dung chữ in/viết trên thiệp (OCR).
3. Bóc tách chi tiết chất liệu giấy gói, màu ruy băng và phụ kiện trang trí đi kèm.`;
}

/** Đọc JSON mô hình trả về → kiểu miền. Không đọc được / không có thành phần hoa → `null`. */
export function parseProductVisionJson(content: string, productTitle?: string | undefined): VisionExtractionResult | null {
  try {
    const parsed = JSON.parse(content);

    const components: ProductFlowerComponent[] = [];
    if (Array.isArray(parsed.flowers)) {
      parsed.flowers.forEach((f: VisionBomItem, idx: number) => {
        components.push({
          id: `flower-${idx}`,
          flowerType: f.name || `Hoa tươi #${idx + 1}`,
          quantityEstimate: parseInt(String(f.count)) || 0,
          unit: f.unit || "cành",
          role: f.role === "supporting" ? "supporting" : "dominant",
        });
      });
    }

    if (Array.isArray(parsed.foliage)) {
      parsed.foliage.forEach((fol: VisionBomItem, idx: number) => {
        components.push({
          id: `foliage-${idx}`,
          flowerType: fol.name || "Lá phụ trang trí",
          quantityEstimate: parseInt(String(fol.count)) || 0,
          unit: fol.unit || "cành",
          role: "foliage",
        });
      });
    }

    if (components.length === 0) {
      return null;
    }

    const attributes: ProductVisualAttributes = {
      mainColors: Array.isArray(parsed.dominant_colors) && parsed.dominant_colors.length > 0
        ? parsed.dominant_colors
        : [],
      secondaryColors: Array.isArray(parsed.secondary_colors) ? parsed.secondary_colors : [],
      style: parsed.style || "",
      shape: parsed.shape || "",
      sizeEstimate: parsed.size || "",
    };

    // Phân rã nguyên tử phụ liệu (Card, Ribbon, Decor)
    const cardData = parsed.card;
    const hasCard = Boolean(cardData?.has_card || cardData?.printed_text);
    const card = hasCard
      ? {
          hasCard: true,
          cardType: (cardData?.card_type as ProductCardAccessory["cardType"]) || "Thiệp gập thiết kế",
          printedText: cardData?.printed_text || undefined,
          color: cardData?.color || undefined,
        }
      : {
          hasCard: false,
        };

    const ribbonDetail = parsed.ribbon_detail
      ? {
          ribbonMaterial: parsed.ribbon_detail.material || parsed.ribbon || "",
          ribbonColor: parsed.ribbon_detail.color || "",
          bowStyle: parsed.ribbon_detail.bow_style || "",
        }
      : {
          ribbonMaterial: parsed.ribbon || "",
          ribbonColor: "",
          bowStyle: "",
        };

    const otherAccessories = Array.isArray(parsed.other_accessories)
      ? parsed.other_accessories.map((acc: VisionBomItem, i: number) => ({
          id: `acc-${i}`,
          name: acc.name || "Phụ kiện",
          quantity: parseInt(String(acc.quantity)) || 1,
          unit: acc.unit || "cái",
          color: acc.color,
          note: acc.note,
        }))
      : [];

    const accessoriesList: string[] = [];
    if (card.hasCard) {
      accessoriesList.push(card.printedText ? `Thiệp: "${card.printedText}"` : "Thiệp chúc mừng thiết kế");
    }
    if (otherAccessories.length > 0) {
      otherAccessories.forEach((acc: { name: string; quantity: number; unit: string }) => accessoriesList.push(`${acc.name} (${acc.quantity} ${acc.unit})`));
    }

    const packaging: ProductPackaging = {
      wrappingMaterial: parsed.wrapping_material || "",
      wrappingColor: parsed.wrapping_color || "",
      ribbon: parsed.ribbon || [ribbonDetail.ribbonMaterial, ribbonDetail.ribbonColor].filter(Boolean).join(" màu "),
      accessories: accessoriesList,
      card,
      ribbonDetail,
      otherAccessories: otherAccessories.length > 0 ? otherAccessories : undefined,
    };

    const inferredOccasions: string[] = Array.isArray(parsed.occasions) && parsed.occasions.length > 0
      ? parsed.occasions
      : [];

    // Nếu chữ trên thiệp có chứa từ khoá dịp cụ thể, đưa lên đầu danh sách dịp
    if (card.printedText) {
      const lower = card.printedText.toLowerCase();
      if (lower.includes("sinh nhật") && !inferredOccasions.some((o) => o.toLowerCase().includes("sinh nhật"))) {
        inferredOccasions.unshift("Sinh nhật");
      } else if (lower.includes("kỷ niệm") && !inferredOccasions.some((o) => o.toLowerCase().includes("kỷ niệm"))) {
        inferredOccasions.unshift("Kỷ niệm ngày cưới");
      } else if (lower.includes("khai trương") && !inferredOccasions.some((o) => o.toLowerCase().includes("khai trương"))) {
        inferredOccasions.unshift("Khai trương chúc mừng");
      }
    }

    const context: ProductInferredContext = {
      likelyOccasions: inferredOccasions,
      likelyAudience: parsed.audience || "",
      // 0 = mô hình không đề xuất — giao diện để trống cho chủ tiệm tự nhập, không bịa giá.
      suggestedPrice: parseInt(parsed.suggested_price) || 0,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };

    return {
      productName: parsed.product_name || productTitle || "Bó hoa tươi nghệ thuật",
      components,
      attributes,
      packaging,
      context,
    };
  } catch {
    return null;
  }
}
