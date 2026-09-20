/**
 * OpenAI Vision Adapter cho phân hệ Market Intelligence.
 * Sử dụng mô hình gpt-4o-mini đa phương thức (multimodal) để bóc tách cấu trúc hoa thực tế từ ảnh
 * (Data URL base64 hoặc Web URL).
 */

import { env } from "@/lib/env";
import type {
  ProductFlowerComponent,
  ProductVisualAttributes,
  ProductPackaging,
  ProductInferredContext,
} from "../domain/product-intelligence-types";

export interface VisionExtractionResult {
  productName: string;
  components: ProductFlowerComponent[];
  attributes: ProductVisualAttributes;
  packaging: ProductPackaging;
  context: ProductInferredContext;
}

export async function extractProductVisionWithAI(params: {
  imageUrl: string;
  productTitle?: string | undefined;
}): Promise<VisionExtractionResult | null> {
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const { imageUrl, productTitle } = params;

  // Chỉ gửi sang OpenAI nếu URL là Data URL base64 hoặc URL công khai http/https
  const isEligibleUrl =
    imageUrl.startsWith("data:image/") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("http://");

  if (!isEligibleUrl || imageUrl.startsWith("blob:")) {
    return null;
  }

  // Trong môi trường test tự động, không gọi mạng bên ngoài trừ khi có LIVE_AI_TEST
  if (process.env.NODE_ENV === "test" && !process.env.LIVE_AI_TEST) {
    return null;
  }

  const systemPrompt = `Bạn là chuyên gia thẩm định thị giác hoa nghệ thuật cao cấp của FloraOS.
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
  "dominant_colors": ["Màu chính 1", "Màu chính 2"], // ví dụ: ["Đỏ nhung", "Trắng kem"]
  "secondary_colors": ["Màu phụ 1"], // ví dụ: ["Xanh rêu", "Xanh lá"]
  "style": "Phong cách thiết kế (ví dụ: Classic Romantic & Sang trọng, Vintage Cổ điển, Hiện đại Hàn Quốc, Tự nhiên mộc mạc...)",
  "shape": "Dáng cắm (ví dụ: Bó tròn tự nhiên, Bó dáng dài, Giỏ hoa để bàn, Hộp hoa trái tim...)",
  "size": "Kích thước ước tính (ví dụ: Tiêu chuẩn (M), Cao cấp (L), Khổng lồ (XL)...)",
  "wrapping_material": "Chất liệu giấy gói (ví dụ: Giấy lụa mờ Kraft gấp nếp, Giấy xi măng, Giấy xốp chống nước...)",
  "wrapping_color": "Màu sắc giấy gói (ví dụ: Trắng kem xếp tầng, Nâu mộc, Đen huyền bí...)",
  "ribbon": "Màu và loại nơ / ruy băng (ví dụ: Ruy băng satin xanh rêu, Dây thừng thô, Nơ voan trắng...)",
  "occasions": ["Dịp tặng phù hợp 1", "Dịp tặng phù hợp 2"], // ví dụ: ["Tỏ tình lãng mạn", "Kỷ niệm tình yêu", "Sinh nhật bạn gái", "Valentine"]
  "audience": "Mô tả tệp khách hàng phù hợp nhất (ví dụ: Nam giới 20–35 tuổi tặng bạn gái / vợ)",
  "suggested_price": 650000, // Giá bán đề xuất thực tế (VND)
  "confidence": 0.95 // Độ tin cậy (0.85 - 0.98)
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Hãy phân tích sản phẩm hoa trong bức ảnh này.${
                  productTitle ? ` Gợi ý tiêu đề ban đầu: ${productTitle}.` : ""
                } Bóc tách chi tiết thành phần hoa, màu sắc, phong cách, bao bì và giá đề xuất.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1200,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(20000), // Timeout 20s
    });

    if (!response.ok) {
      console.warn("OpenAI Vision API response error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    const components: ProductFlowerComponent[] = [];
    if (Array.isArray(parsed.flowers)) {
      parsed.flowers.forEach((f: any, idx: number) => {
        components.push({
          flowerType: f.name || `Hoa tươi #${idx + 1}`,
          quantityEstimate: parseInt(f.count) || (idx === 0 ? 12 : 5),
          unit: f.unit || "cành",
          role: f.role === "supporting" ? "supporting" : "dominant",
        });
      });
    }

    if (Array.isArray(parsed.foliage)) {
      parsed.foliage.forEach((fol: any) => {
        components.push({
          flowerType: fol.name || "Lá phụ trang trí",
          quantityEstimate: parseInt(fol.count) || 3,
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
        : ["Đỏ nhung", "Trắng"],
      secondaryColors: Array.isArray(parsed.secondary_colors) ? parsed.secondary_colors : ["Xanh rêu"],
      style: parsed.style || "Classic Romantic & Tinh tế",
      shape: parsed.shape || "Bó tròn nở rộ",
      sizeEstimate: parsed.size || "Tiêu chuẩn (M)",
    };

    const packaging: ProductPackaging = {
      wrappingMaterial: parsed.wrapping_material || "Giấy lụa mờ cao cấp",
      wrappingColor: parsed.wrapping_color || "Trắng kem xếp tầng",
      ribbon: parsed.ribbon || "Ruy băng voan thắt nơ",
      accessories: ["Thiệp chúc mừng cao cấp"],
    };

    const context: ProductInferredContext = {
      likelyOccasions: Array.isArray(parsed.occasions) && parsed.occasions.length > 0
        ? parsed.occasions
        : ["Sinh nhật bạn gái", "Kỷ niệm tình yêu", "Tỏ tình lãng mạn"],
      likelyAudience: parsed.audience || "Khách hàng mua tặng người yêu, phân khúc hiện đại",
      suggestedPrice: parseInt(parsed.suggested_price) || 699000,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
    };

    return {
      productName: parsed.product_name || productTitle || "Bó hoa tươi nghệ thuật",
      components,
      attributes,
      packaging,
      context,
    };
  } catch (error) {
    console.error("Lỗi khi thực hiện OpenAI Vision analysis:", error);
    return null;
  }
}
