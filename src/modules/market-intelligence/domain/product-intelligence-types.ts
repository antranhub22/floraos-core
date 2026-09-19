/**
 * Domain Types: Product Intelligence (Trụ cột B của FloraOS Intelligence Engine v2.0).
 * Tuân thủ mục 8-19 của tài liệu FloraOS-Intelligence-Engine_FINAL_v2.0.md.
 * Thuần TypeScript — Zero external dependencies.
 */

import type { TrendLifecycle } from "./trend-lifecycle";

export interface ProductFlowerComponent {
  flowerType: string;
  quantityEstimate: number;
  unit: string;
  role: "dominant" | "supporting" | "foliage";
}

export interface ProductVisualAttributes {
  mainColors: string[];
  secondaryColors: string[];
  style: string;
  shape: string;
  sizeEstimate: string;
}

export interface ProductPackaging {
  wrappingMaterial: string;
  wrappingColor: string;
  ribbon: string;
  accessories: string[];
}

export interface ProductInferredContext {
  likelyOccasions: string[];
  likelyAudience: string;
  suggestedPrice: number;
  confidence: number;
}

export interface ProductTrendFitItem {
  attribute: string;
  productValue: string;
  marketSignal: string;
  matchStatus: "MATCH" | "PARTIAL" | "MISMATCH";
  lifecycle: TrendLifecycle;
  note: string;
}

export interface ProductImprovement {
  keep: string[];
  improve: string[];
  test: string[];
}

export type TopicAngleCategory =
  | "EMOTIONAL"
  | "PROBLEM_SOLUTION"
  | "PRODUCT_SHOWCASE"
  | "EDUCATIONAL"
  | "TREND"
  | "PRICE_VALUE";

export interface ConcreteTopic {
  id: string;
  title: string;
  angleCategory: TopicAngleCategory;
  hook: string;
  format: "REELS_TIKTOK_9_16" | "CAROUSEL_PHOTO_1_1" | "STORY_DAILY";
  cta: string;
  evidenceNote: string;
  referenceUrl?: string;
  platform?: "tiktok" | "youtube" | "google" | "facebook";
}

export interface ProductContentReadiness {
  productRecognition: boolean;
  trendFit: boolean;
  audienceDefined: boolean;
  positioningDefined: boolean;
  visualQuality: "EXCELLENT" | "ACCEPTABLE" | "NEEDS_IMPROVEMENT";
  videoPotential: boolean;
}

export interface ProductIntelligenceReport {
  id: string;
  productName: string;
  imageUrl: string;
  trendFitScore: number;
  audienceFitScore: number;
  contentFitScore: number;
  overallFit: "HIGH" | "MEDIUM" | "LOW";
  components: ProductFlowerComponent[];
  attributes: ProductVisualAttributes;
  packaging: ProductPackaging;
  context: ProductInferredContext;
  trendFitMatrix: ProductTrendFitItem[];
  improvements: ProductImprovement;
  topics: ConcreteTopic[];
  readiness: ProductContentReadiness;
  createdAt: string;
}
