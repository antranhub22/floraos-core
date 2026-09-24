/** Chặng 02 — UNDERSTAND: Vision AI bóc tách cấu trúc sản phẩm từ ảnh đã lưu kho. */

import { z } from "zod"

import { defineStage } from "./define-stage"
import {
  productFlowerComponentSchema,
  productInferredContextSchema,
  productPackagingSchema,
  productVisualAttributesSchema,
} from "./product-intelligence"
import {
  EXAMPLE_ASSET_ID,
  exampleAttributes,
  exampleComponents,
  exampleContext,
  examplePackaging,
} from "./examples-shared"

export const visionExtractBodySchema = z.object({
  image_url: z.string().optional().describe("URL ảnh (ký có hạn); bỏ trống khi đã có asset_id"),
  asset_id: z.string().optional(),
  product_title: z.string().optional(),
})

export const visionExtractResultSchema = z.object({
  productName: z.string(),
  imageUrl: z.string(),
  assetId: z.string().optional(),
  components: z.array(productFlowerComponentSchema).describe("Hoa + lá đệm (role foliage) — không có mảng riêng"),
  attributes: productVisualAttributesSchema,
  packaging: productPackagingSchema,
  context: productInferredContextSchema,
})

export const stage02Understand = defineStage({
  id: "02",
  stage: 2,
  code: "UNDERSTAND",
  slug: "understand",
  title: "Chặng 02 — UNDERSTAND: Nhận diện cấu trúc & định tính thương mại",
  summary: "Mô hình thị giác (gpt-4o-mini) trả thành phần hoa, thuộc tính thị giác, bao bì, bối cảnh; người dùng sửa được từng trường.",
  endpoint: { method: "POST", path: "/api/v1/market-intelligence/vision-extract", capability: "V1" },
  input: visionExtractBodySchema,
  output: visionExtractResultSchema,
  examples: {
    input: { asset_id: EXAMPLE_ASSET_ID, product_title: "Bó hồng đỏ 12 bông" },
    output: {
      productName: "Bó hồng đỏ 12 bông",
      imageUrl: "https://storage.example/signed/3f1c9a52.jpg",
      assetId: EXAMPLE_ASSET_ID,
      components: exampleComponents,
      attributes: exampleAttributes,
      packaging: examplePackaging,
      context: exampleContext,
    },
  },
})
