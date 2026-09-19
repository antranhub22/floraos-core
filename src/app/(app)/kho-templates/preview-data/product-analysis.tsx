// Dữ liệu mẫu cho popup xem trước — nhóm Product Analysis (M01). Chỉ để
// minh hoạ giao diện trong "Kho Templates", KHÔNG phải dữ liệu thật.
import React from "react"
import { M01aGuidanceCard } from "@/components/templates/product-analysis/m01a-guidance-card"
import { M01bGuidanceCard } from "@/components/templates/product-analysis/m01b-guidance-card"
import { M01cGuidanceCard } from "@/components/templates/product-analysis/m01c-guidance-card"
import { AnalysisResultCard } from "@/components/templates/product-analysis/analysis-result-card"
import { CommercialContentCard } from "@/components/templates/product-analysis/commercial-content-card"
import { SalesPitchCardA6 } from "@/components/templates/product-analysis/sales-pitch-card-a6"
import { ZaloScriptBox } from "@/components/templates/product-analysis/zalo-script-box"
import type { ResultField } from "@/components/result/result-card"
import type { SalesPitchData } from "@/modules/products/domain/sales-pitch-template"

const ANALYSIS_FIELDS: ResultField[] = [
  {
    key: "flowers",
    label: "Loại hoa & số lượng cành",
    type: "list",
    editable: true,
    value: [
      { id: "f1", name: "Hồng đỏ Ecuador", quantity: 15, unit: "cành", color: "Đỏ" },
      { id: "f2", name: "Baby trắng", quantity: 5, unit: "bó", color: "Trắng" },
    ],
  },
  { key: "tone", label: "Tông màu chủ đạo", type: "text", editable: true, value: "Đỏ - Trắng, ấm áp" },
  { key: "style", label: "Phong cách cắm", type: "text", editable: true, value: "Bó tròn cổ điển" },
]

const COMMERCIAL_FIELDS: ResultField[] = [
  { key: "name", label: "Tên gợi ý", type: "text", editable: true, value: "Nồng Nàn Yêu Thương" },
  {
    key: "story",
    label: "Câu chuyện sản phẩm",
    type: "textarea",
    editable: true,
    value: "Bó hồng đỏ Ecuador phối baby trắng, dành tặng người thương trong ngày kỷ niệm đặc biệt.",
  },
  { key: "occasions", label: "Dịp tặng phù hợp", type: "text", editable: true, value: "Kỷ niệm, Valentine, Sinh nhật" },
  { key: "priceSegment", label: "Phân khúc giá", type: "text", editable: true, value: "Trung - Cao cấp" },
]

const SAMPLE_PITCH: SalesPitchData = {
  productName: "Nồng Nàn Yêu Thương",
  sku: "HOA-0142",
  imageUrl: null,
  style: "Bó tròn cổ điển",
  occasions: ["Kỷ niệm", "Valentine"],
  occasionRegister: "FESTIVE",
  description: "Bó hồng đỏ Ecuador phối baby trắng, tôn lên trọn vẹn tình cảm dành tặng người thương.",
  mainFlowers: [
    { name: "Hồng đỏ Ecuador", quantity: 15, unit: "cành", color: "Đỏ" },
    { name: "Baby trắng", quantity: 5, unit: "bó", color: "Trắng" },
  ],
  foliageItems: [{ name: "Lá dương xỉ", quantity: 3, unit: "cành" }],
  accessoryItems: [],
  wrapping: "Giấy Hàn Quốc kraft nâu, nơ lụa đỏ đô",
  container: "Bó cầm tay",
  dimensions: { heightCm: 45, widthCm: 30 },
  priceVnd: 650000,
  originalPriceVnd: 750000,
  priceSegment: "Trung - Cao cấp",
  freeGifts: ["Thiệp chúc mừng thiết kế riêng", "Miễn phí giao trong bán kính 5km"],
  guarantees: ["Hoa tươi trên 5 ngày", "Đổi trả nếu hoa héo trong 24h", "Cam kết đúng mẫu ảnh"],
  shopName: "SiiN Store — Mộc Lan Demo",
  shopHotline: "0909 xxx xxx",
  customNote: "Ưu đãi tặng thêm hộp socola nhỏ trong tuần lễ Valentine",
  status: "FINALIZED",
}

const SAMPLE_ZALO_SCRIPT = `🌹 NỒNG NÀN YÊU THƯƠNG 🌹

✨ Bó hồng đỏ Ecuador phối baby trắng, tôn lên trọn vẹn tình cảm dành tặng người thương.

🌸 Cấu phần:
• Hồng đỏ Ecuador: 15 cành
• Baby trắng: 5 bó
• Lá dương xỉ đệm

💰 Giá ưu đãi: 650.000đ (giá gốc 750.000đ)
🎁 Tặng kèm: Thiệp chúc mừng thiết kế riêng, miễn phí giao trong 5km

📞 Hotline: 0909 xxx xxx
Anh/chị đặt ngay để shop chuẩn bị hoa tươi nhất nhé! ❤️`

export const productAnalysisPreviews: Record<string, React.ReactNode> = {
  "m01a-guidance-card.tsx": <M01aGuidanceCard />,
  "m01b-guidance-card.tsx": <M01bGuidanceCard />,
  "m01c-guidance-card.tsx": <M01cGuidanceCard />,
  "analysis-result-card.tsx": <AnalysisResultCard fields={ANALYSIS_FIELDS} confidence={94} />,
  "commercial-content-card.tsx": <CommercialContentCard fields={COMMERCIAL_FIELDS} qualityScore={89} />,
  "sales-pitch-card-a6.tsx": <SalesPitchCardA6 activePitch={SAMPLE_PITCH} status="FINALIZED" />,
  "zalo-script-box.tsx": <ZaloScriptBox script={SAMPLE_ZALO_SCRIPT} />,
}
