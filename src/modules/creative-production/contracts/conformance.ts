/**
 * Khoá tầng kiểu (tsc) giữa hợp đồng zod và kiểu domain/use-case thật.
 * Lệch một trường là `npm run typecheck` đỏ — sửa zod (nguồn chuẩn) hoặc sửa
 * mã cho khớp, rồi `npm run gen:schemas:creative`.
 *
 * Hai chiều khi làm được: "Fits" = dữ liệu mã trả khớp hợp đồng; "Covers" =
 * hợp đồng không thiếu trường bắt buộc nào của kiểu domain.
 * Tệp chỉ chứa kiểu — không chạy gì lúc runtime.
 */

import type { z } from "zod"

import type { AnalyzeProductVisionOutput } from "@/modules/market-intelligence/use-cases/analyze-product-vision"
import type { ProductIntelligenceReport } from "@/modules/market-intelligence/domain/product-intelligence-types"
import type { CreateAudioJobResult } from "@/modules/audio-studio/use-cases/create-audio-job"
import type { ScenePlan, ScenePlanShot, ScenePlanTransition, LocalBackdrop } from "../domain/scene-plan-rules"
import type { VariantShot } from "@/modules/media/domain/variant-direction-rules"
import type { PublishVideoFormat } from "../domain/publishing-rules"
import type { HandoffUrlInput } from "../domain/build-handoff-url"
import type {
  CampaignPackageStatus,
  LaunchPlan,
  LearnResult,
  NextAction,
  PerformanceSummary,
  QaReport,
} from "../domain/campaign-package-rules"
import type { ContentDraftDto } from "../use-cases/content-draft"
import type { CampaignTopicSnapshot } from "../use-cases/manage-campaign-package"
import type { DeepMutable } from "./deep-mutable"
import type { topicSnapshotSchema, campaignPackageStatusSchema } from "./common"
import type { productIntelligenceReportSchema } from "./product-intelligence"
import type { localBackdropSchema, scenePlanSchema, scenePlanTransitionSchema, videoFormatSchema } from "./scene-plan"
import type { campaignPerformanceSchema, launchPlanSchema, qaReportSchema } from "./campaign-package"
import type { visionExtractResultSchema } from "./stage-02-understand"
import type { handoffQuerySchema } from "./stage-05-choose"
import type { contentDraftSchema } from "./stage-06a-content"
import type { audioJobResultSchema } from "./stage-06b-audio"

type Out<S extends z.ZodType> = z.output<S>
type Fits<Actual, Contract> = [DeepMutable<Actual>] extends [Contract] ? true : false
/** Bỏ `| undefined` mà zod `.optional()` gắn vào trường tuỳ chọn (giữ dấu `?`) — khác biệt vô hại dưới exactOptionalPropertyTypes. */
type StripOptionalUndefined<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? StripOptionalUndefined<U>[]
    : T extends object
      ? { [K in keyof T]: StripOptionalUndefined<Exclude<T[K], undefined>> }
      : T
type Covers<Contract, Actual> = [StripOptionalUndefined<Contract>] extends [DeepMutable<Actual>] ? true : false
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

export type CreativeStudioContractConformance = [
  // Chặng 02–04
  Expect<Fits<AnalyzeProductVisionOutput, Out<typeof visionExtractResultSchema>>>,
  Expect<Covers<Out<typeof visionExtractResultSchema>, AnalyzeProductVisionOutput>>,
  Expect<Fits<ProductIntelligenceReport, Out<typeof productIntelligenceReportSchema>>>,
  Expect<Covers<Out<typeof productIntelligenceReportSchema>, ProductIntelligenceReport>>,
  // Chặng 05 — kịch bản sản xuất tổng + query bàn giao
  Expect<Fits<ScenePlan, Out<typeof scenePlanSchema>>>,
  Expect<Covers<Out<typeof scenePlanSchema>, ScenePlan>>,
  Expect<Same<ScenePlanTransition, Out<typeof scenePlanTransitionSchema>>>,
  Expect<Same<LocalBackdrop, Out<typeof localBackdropSchema>>>,
  Expect<Same<PublishVideoFormat, Out<typeof videoFormatSchema>>>,
  Expect<Same<HandoffUrlInput["mode"], Out<typeof handoffQuerySchema>["mode"]>>,
  Expect<Same<HandoffUrlInput["area"], Out<typeof handoffQuerySchema>["area"]>>,
  Expect<Same<HandoffUrlInput["source"], Out<typeof handoffQuerySchema>["source"]>>,
  // Chặng 06 — cỡ cảnh của ảnh biến thể = cỡ cảnh của kịch bản (Đợt 1, 24/09/2026)
  Expect<Same<VariantShot, ScenePlanShot>>,
  Expect<Fits<ContentDraftDto, Out<typeof contentDraftSchema>>>,
  Expect<Fits<CreateAudioJobResult, Out<typeof audioJobResultSchema>>>,
  Expect<Covers<Out<typeof audioJobResultSchema>, CreateAudioJobResult>>,
  Expect<Covers<Out<typeof contentDraftSchema>, ContentDraftDto>>,
  // Chặng 07–10
  Expect<Fits<CampaignTopicSnapshot, Out<typeof topicSnapshotSchema>>>,
  Expect<Same<CampaignPackageStatus, Out<typeof campaignPackageStatusSchema>>>,
  Expect<Fits<QaReport, Out<typeof qaReportSchema>>>,
  Expect<Covers<Out<typeof qaReportSchema>, QaReport>>,
  Expect<Fits<LaunchPlan, Out<typeof launchPlanSchema>>>,
  Expect<Covers<Out<typeof launchPlanSchema>, LaunchPlan>>,
  // Chặng 11–14
  Expect<Fits<PerformanceSummary, Out<typeof campaignPerformanceSchema>["measure"]>>,
  Expect<Covers<Out<typeof campaignPerformanceSchema>["measure"], PerformanceSummary>>,
  Expect<Fits<LearnResult, Out<typeof campaignPerformanceSchema>["learn"]>>,
  Expect<Fits<NextAction, Out<typeof campaignPerformanceSchema>["next_best_actions"][number]>>,
  Expect<Covers<Out<typeof campaignPerformanceSchema>["next_best_actions"][number], NextAction>>,
]
