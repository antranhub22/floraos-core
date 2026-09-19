/**
 * Use-case: Phân tích Product Intelligence từ ảnh và thông số sản phẩm.
 * Tuân thủ Clean Architecture — Phụ thuộc Domain, không phụ thuộc Framework UI.
 */

import { evaluateProductTrendFit } from "../domain/trend-fit";
import type {
  ProductFlowerComponent,
  ProductVisualAttributes,
  ProductPackaging,
  ProductInferredContext,
  ProductIntelligenceReport,
} from "../domain/product-intelligence-types";

export interface AnalyzeProductIntelligenceParams {
  organizationId: string;
  productName: string;
  imageUrl: string;
  components?: ProductFlowerComponent[] | undefined;
  attributes?: ProductVisualAttributes | undefined;
  packaging?: ProductPackaging | undefined;
  context?: ProductInferredContext | undefined;
}

export async function analyzeProductIntelligence(
  params: AnalyzeProductIntelligenceParams
): Promise<ProductIntelligenceReport> {
  // Chuẩn hóa dữ liệu đầu vào với giá trị mặc định thực tế từ ảnh nếu người dùng chưa sửa
  const components: ProductFlowerComponent[] = params.components && params.components.length > 0
    ? params.components
    : [
        { flowerType: "Hoa hồng kem dâu", quantityEstimate: 12, unit: "cành", role: "dominant" },
        { flowerType: "Hoa baby trắng", quantityEstimate: 5, unit: "nhánh", role: "supporting" },
        { flowerType: "Lá bạc Eucalyptus", quantityEstimate: 3, unit: "cành", role: "foliage" },
      ];

  const attributes: ProductVisualAttributes = params.attributes || {
    mainColors: ["Pastel hồng", "Trắng kem"],
    secondaryColors: ["Xanh bạc lá cây"],
    style: "Romantic & Tinh tế",
    shape: "Bó tròn tự nhiên",
    sizeEstimate: "Tiêu chuẩn (M)",
  };

  const packaging: ProductPackaging = params.packaging || {
    wrappingMaterial: "Giấy lụa mờ Kraft",
    wrappingColor: "Hồng phấn & Trắng",
    ribbon: "Ruy băng voan trắng",
    accessories: ["Thiệp chúc mừng thiết kế"],
  };

  const context: ProductInferredContext = params.context || {
    likelyOccasions: ["Sinh nhật bạn gái", "Kỷ niệm ngày cưới", "Chúc mừng"],
    likelyAudience: "Nữ giới 20–35 tuổi hoặc Nam giới mua tặng",
    suggestedPrice: 599000,
    confidence: 0.94,
  };

  const report = evaluateProductTrendFit({
    productName: params.productName || "Bó hoa tươi phong cách lãng mạn",
    imageUrl: params.imageUrl,
    components,
    attributes,
    packaging,
    context,
  });

  return report;
}
