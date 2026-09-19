/**
 * Domain Entities & Value Objects cho Market Intelligence.
 * Thuần TypeScript, không import Prisma hay hạ tầng.
 */

export type TrendTopicStatus =
  | "EMERGING"
  | "RISING"
  | "STABLE"
  | "DECLINING"
  | "SEASONAL"
  | "BREAKOUT";

export interface CanonicalTopic {
  readonly id: string;
  readonly canonicalName: string;
  readonly description?: string | null;
  readonly language: string;
  readonly industry: string;
  readonly status: TrendTopicStatus;
  readonly firstSeenAt: Date;
  readonly lastSeenAt: Date;
}

export interface TopicScores {
  readonly trendScore: number;
  readonly viralScore: number;
  readonly commercialScore: number;
  readonly contentOpportunityScore: number;
  readonly confidence: number;
  readonly calculatedAt: Date;
  readonly modelVersion: string;
}

export interface ContentAngle {
  readonly angleTitle: string;
  readonly perspective: string;
  readonly targetAudience: string;
}

export interface EvidenceReference {
  readonly title: string;
  readonly type: "ARTICLE" | "TIKTOK_REELS" | "IMAGE_PINTEREST" | "GOOGLE_TRENDS" | "YOUTUBE";
  readonly url: string;
  readonly platform: string;
  readonly engagementNote?: string;
}

export interface ContentOpportunity {
  readonly id: string;
  readonly organizationId: string;
  readonly topicId: string;
  readonly audience?: string | null;
  readonly opportunitySummary: string;
  readonly contentAngles: readonly ContentAngle[];
  readonly recommendedFormats: readonly string[];
  readonly recommendedHooks: readonly string[];
  readonly evidenceReferences?: readonly EvidenceReference[];
  readonly scores: TopicScores;
  readonly expiresAt?: Date | null;
}
