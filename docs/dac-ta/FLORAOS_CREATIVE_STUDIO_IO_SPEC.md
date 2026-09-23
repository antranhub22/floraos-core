# Input/Output Specification — Creative Studio (Chặng 01–14)

> **Mục đích:** Chuẩn hoá đầu vào/đầu ra THẬT của từng chặng trong `/creative-studio`, đúng tên trường và kiểu như mã nguồn.
> **Phiên bản:** 4.0 — 23/09/2026. Viết lại toàn bộ: bản 3.0 mô tả một schema không tồn tại trong mã (vd. `foliageComponents`, `greetingCards`, `trendScore`, `videoEvidences`, `TopicProductionBrief` phẳng).
> **Nguồn sự thật:** `src/modules/market-intelligence/domain/product-intelligence-types.ts`, `src/modules/creative-production/domain/{production-types,validate-transition,build-handoff-url,campaign-package-rules}.ts`, `src/modules/media/domain/variant-rules.ts`, `src/modules/audio-studio/domain/audio-types.ts`, `src/modules/video-studio/domain/video-types.ts`, các `route.ts` tương ứng. Lệch với tài liệu này thì mã thắng (Hiến pháp §2 quy tắc 2) — và tài liệu phải sửa trong cùng commit.

---

## 1. Khu vực A — Chặng 01 → 05

### 1.1. Chặng 01 — BRING

| Bước | Gọi | Vào | Ra |
|---|---|---|---|
| Xin URL | `POST /api/v1/assets/upload-url` (`G2`) | `{ mime_type, product_id? }` | `{ upload_url, asset_id, storage_key }` |
| Tải lên | `PUT upload_url` | byte ảnh | 2xx (kiểm `res.ok`) |
| Đăng ký | `POST /api/v1/assets` (`G2`) | `{ asset_id, kind: "ORIGINAL", storage_key, mime_type, file_size }` | asset |
| Xem | `GET /api/v1/assets/:id/view-url` (`G1`) | — | `{ url }` ký có hạn |

`storage_key` = `org/<organization_id>/<product_id | "unfiled">/<asset_id>.<ext>` (`buildStorageKey`). Máy chủ chưa giới hạn dung lượng tệp.

### 1.2. Chặng 02 — UNDERSTAND

`POST /api/v1/market-intelligence/vision-extract` (`V1`), thân `{ image_url, asset_id, product_title }`, mô hình `gpt-4o-mini`. Trả các khối dưới (người dùng sửa được từng trường nguyên tử):

`ProductFlowerComponent`: `{ id?, flowerType: string, quantityEstimate: number, unit: string, role: "dominant" | "supporting" | "foliage", color? }` — lá/cành đệm là `role: "foliage"`, không có mảng riêng.

`ProductVisualAttributes`: `{ mainColors: string[], secondaryColors: string[], style, shape, sizeEstimate }`.

`ProductPackaging`: `{ wrappingMaterial, wrappingColor, ribbon, accessories: string[], card?: { hasCard, cardType?, printedText? (OCR), color? }, ribbonDetail?: { ribbonColor?, ribbonMaterial?, bowStyle? }, otherAccessories?: { name, quantity, unit, color?, note? }[] }`.

`ProductInferredContext`: `{ likelyOccasions: string[], likelyAudience, suggestedPrice: number, confidence: number }`.

### 1.3. Chặng 03 + 04 — DISCOVER + IDEATE

`POST /api/v1/market-intelligence/product-intelligence` (`V1`), thân gồm `product_name`, `asset_id` (BẮT BUỘC), `components`, `attributes`, `packaging`, `context`, `commercial_passport?`. Lưu mỗi lượt vào `product_analysis_runs`. Trả `ProductIntelligenceReport`:

| Trường | Kiểu |
|---|---|
| `id` | id lượt phân tích (`product_analysis_runs.id`) |
| `trendFitScore`, `audienceFitScore`, `contentFitScore` | `number` 0–100 |
| `overallFit` | `"HIGH" \| "MEDIUM" \| "LOW"` |
| `trendFitMatrix` | `{ attribute, productValue, marketSignal, matchStatus: "MATCH"\|"PARTIAL"\|"MISMATCH", lifecycle, note }[]` |
| `improvements` | `{ keep: string[], improve: string[], test: string[] }` |
| `commercialPassport?` | `{ suggestedName, shortHeadline, description, style, tags[], seoKeywords[], occasions[], targetAudience: { recipient, buyerPersona }, flowerMeaningStory, keySellingPoints[], cardMessageSuggestions, careInstructions[], priceSegment: "budget"\|"standard"\|"premium"\|"luxury", priceRange: { minPrice, targetPrice, maxPrice }, recommendedUpsells[] }` |
| `topics` | `ConcreteTopic[]` — 10 phần tử |
| `readiness` | `ProductContentReadiness` |

`ConcreteTopic`: `{ id, title, angleCategory: "EMOTIONAL"|"PROBLEM_SOLUTION"|"PRODUCT_SHOWCASE"|"EDUCATIONAL"|"TREND"|"PRICE_VALUE", hook, format: "REELS_TIKTOK_9_16"|"CAROUSEL_PHOTO_1_1"|"STORY_DAILY", cta, evidenceNote, referenceUrl?, platform?, dualVideoEvidence?: { youtube, tiktok } }`. Mỗi video: `{ thumbnailUrl, videoUrl, title, author, metrics, alt?, isLiveEvidence? }`. `isLiveEvidence = false` nghĩa là danh mục tham khảo (metrics ước tính, TikTok là trang tìm kiếm) — giao diện phải ghi "ước tính".

Đọc lại: `GET /api/v1/product-intelligence/:id` (`V2`) → `{ report }`.

### 1.4. Chặng 05 — CHOOSE và bàn giao

`buildHandoffSearchParams(HandoffUrlInput)` → query của `/creative-studio`:

| Param | Nguồn | Ghi chú |
|---|---|---|
| `topic` | `report.id` (hoặc id topic khi không qua Product Intelligence) | bắt buộc |
| `selectedTopic` | `ConcreteTopic.id` | |
| `mode` | `"CREATIVE" \| "AUTHENTIC"` | bắt buộc |
| `source` | `"image" \| "video" \| "both"` | |
| `assetId` | asset đã lưu kho | bắt buộc — thiếu thì ném `MissingAssetIdError` |
| `area` | `a..f` | tab mở ra |
| `productName`, `productId` | | tuỳ chọn |
| `audioJobId`, `videoJobId` | ghi thêm bởi Khu vực C/E | tuỳ chọn |

Cấm `imageUrl`/Data URL/blob; tổng query ≤ 2.000 ký tự (`isSafeHandoffQueryString`).

---

## 2. Cổng chuyển tiếp & ngữ cảnh

### 2.1. `validateTransition(TransitionInput)`
Bắt buộc: `topicId`, `mode`, `sourceImageUrl`, `productName`, `assetId`, `commercialPassport.category`, `.style`, `.components`, `.colors`. Tuỳ chọn (cảnh báo): `sourceVideoUrl`, `commercialPassport.priceRange/targetAudience/suggestedOccasions`, `productId`, `hasReport`, `hasTopics`, `voiceId`, `musicMood`. Trả `{ valid, fields[], errors[], warnings[], completionPercent }`.

### 2.2. `CreativeStudioContext` (page.tsx)
`{ topicId, mode, sourceImageUrl (ký lại từ assetId), sourceVideoUrl?, productName, productId?, assetId?, voiceId?, musicMood?, report, topics, selectedTopic, commercialPassport? }`. `commercialPassport` dựng CHỈ từ report thật: `category = attributes.shape || passport.tags[0]`, `style`, `components = components[].flowerType`, `colors = main + secondary`, `priceRange = "min – max VNĐ"`, `targetAudience = buyerPersona`, `suggestedOccasions = occasions`.

### 2.3. `TopicProductionBrief` (đầu vào `POST /creative-production/produce`)
```ts
{
  organizationId: string            // máy chủ gán từ phiên — client KHÔNG gửi
  productId?: string
  mode: "AUTHENTIC" | "CREATIVE"
  productContext: {
    sourceImageUrl: string
    sourceImageStorageKey?: string
    commercialPassport: { productName, category, style, components: string[], colors: string[],
                          priceRange?, targetAudience?, suggestedOccasions?: string[] }
    sourceVideoUrl?: string
    sourceVideoDurationSeconds?: number
  }
  selectedTopics: { topicId, topicTitle, topicAngle, topicCategory, topicHook, topicCta,
                    topicEmotionalTone, researchKeywords?, trendScore? }[]   // 1–3
  voiceId?: string
  musicMood?: string
  targetVideoDurationSeconds?: number
}
```
Brief không mang `assetId` — ảnh được neo ở gói chiến dịch (Chặng 07) qua `master_asset_id`.

---

## 3. Khu vực B — Chặng 06a

`POST /api/v1/creative-production/produce` (`I1`) `{ brief }` → `produceCreative` (CREATIVE) / `produceAuthentic` (AUTHENTIC). Kết quả gồm `topicResults[]` (mỗi phần tử có `arc: NarrativeArcOutput` và `briefs.contentBrief` — `captionRequests[]`, `hashtagSuggestions[]`) và `totalEstimatedCredits`.

`NarrativeArcOutput`: `{ topicId, topicTitle, mode, emotionalTone, narrativeReasoning, scenes: NarrativeSceneSpec[] (3–5), totalDurationSeconds }`; `NarrativeBeat` = `SETUP | RISING | CLIMAX | RESOLUTION | CTA`.

4 bài đăng (Facebook, Instagram, TikTok, Zalo) sinh phía trình duyệt bằng `generateAllPlatformPosts()`; thiếu giá thật thì ghi "Liên hệ tiệm để nhận báo giá" (không còn giá bịa). Nút "Lưu bài vào gói chiến dịch" → `PackagePost[]` vào gói (§7).

---

## 4. Khu vực C — Chặng 06b

`POST /api/v1/audio/jobs` (`I1`, header `Idempotency-Key` bắt buộc):

| Trường | Kiểu |
|---|---|
| `taskType?` | `"VOICEOVER" \| "MUSIC_SELECT" \| "AUDIO_MIX" \| "VOICE_CLONE"` |
| `scenes` | `{ sceneIndex, voiceScript, targetDurationSeconds }[]` |
| `totalDurationSeconds?` | mặc định = tổng cảnh |
| `voiceId?` | mặc định `flora-nu-truyen-cam` |
| `providerKey?` | `openai \| elevenlabs \| minimax \| edge_tts \| google_cloud \| local_fallback` |
| `qualityTier?` | `standard \| hd \| premium` |
| `musicTrackId?`, `musicMood?` | `romantic \| upbeat \| chill \| warm \| luxury \| none` |
| `topicAngleCategory?` | gợi ý mood khi không chọn |

Ra (201): `{ jobId, generationJobId, creditsCost (ước tính), voiceDisplayName, providerKey, musicTrackName, usage: { costCredit (đã trừ thật), balanceAfter }, deduped }`.

Worker (`audio.generate`) ghi bản phối lên kho: `generation_jobs.output = { audio_storage_key, mime_type, total_duration_seconds, provider_used, has_voice, scenes }`.

`GET /api/v1/audio/jobs/:id` (`I1`) → `{ job_id, stage: DRAFT|GENERATING|COMPLETED|FAILED, task_type, voice_id, music_mood, total_duration_seconds, audio_url (ký 1 giờ), audio_storage_key, error, created_at }`.

---

## 5. Khu vực D — Chặng 06c

### 5.0. Kịch bản bối cảnh (24/09/2026)

`POST /api/v1/creative-production/scene-plans` (`I1`, `Idempotency-Key` bắt buộc, feature `creative.scene_plan`, 1 credit):

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `mode` | `CREATIVE \| AUTHENTIC` | 5 hoặc 3 cảnh |
| `asset_id?` · `product_id?` | uuid | khoá tra lại `scene-plan:<asset>:<topic>:<mode>` |
| `product` | `{ name, category?, style?, colors[], components[], occasions[], target_audience?, price_range? }` | từ Chặng 01–03 |
| `topic` | `{ id, title, angle_category?, hook?, cta?, format? }` | chủ đề Chặng 05 |

Ra: `{ job_id, status, error, plan, deduped, usage }`. `plan = { version: 1, source: "ai"|"rule", mode, topicId, topicTitle, emotionalTone, reasoning, scenes[] }`, mỗi cảnh `{ sceneIndex, beat, title, setting, lighting, palette[], purpose, backgroundPrompt, localBackdrop, voiceScript, textOverlay, motionEffect }`. Tra không tạo job: `GET /creative-production/scene-plans?asset_id&topic_id&mode`, `GET /creative-production/scene-plans/:id`. Sinh ở Chặng 05 khi bấm "Bắt đầu sáng tạo" (`creative-handoff-modal.tsx`); URL Creative Studio mang `scenePlanId` (job id hoặc `rule`), B/C/D/E chỉ tra.

### 5.1. Biến thể từng cảnh

`POST /api/v1/media/variants` (`I4`, header `Idempotency-Key` bắt buộc):

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `master_asset_id` | string | Master `APPROVED` — ngược lại `409` |
| `engine` | `"local_studio" \| "cloud_provider"` | mặc định `local_studio` |
| `preset` | `transparent \| studio_white \| wedding \| living_room \| wood_minimal \| luxury_hotel` | bắt buộc |
| `ratio` | `1:1 \| 4:5 \| 9:16 \| 16:9` | bắt buộc |
| `watermark` | boolean | mặc định `true` |
| `auto_enhance` | boolean | mặc định `false`, chỉ chỉnh vùng nền |
| `scene_index` | 1–5 | phân cảnh theo kịch bản của chủ đề |
| `scene_plan_id` | string ≤ 160 | job `creative.scene_plan` hoặc `rule:<topic>:<mode>` |
| `provider_key` | `"stability"` | chỉ nhánh cloud |
| `scene_prompt` | string ≤ 600 | chỉ nhánh cloud — `backgroundPrompt` của cảnh (KHÔNG GIAN hậu cảnh) |

Ra (201): `{ job_id, status, engine, deduped, usage: { cost_credit, balance_after } }`. Feature: `media.variant` (1 credit) / `media.variant.cloud` (2 credit).

`GET /api/v1/media/variants/:job_id` (`I4`) → `{ job_id, status, stage, error, result, source: { master_asset_id, master_url, preset, ratio, watermark, engine, scene_index, cloud_fallback }, subject_integrity: { subject_pixel_identity, result, ly_do[] } | null, variants: { asset_id, variant_key: "transparent"|"styled"|"branded", title, background, ratio, watermark, generative_fill_used, url, approval_state, approved_at }[], approval: { can_approve, requires_warning } }`.

Asset biến thể (`kind = MARKETING`, `approval_state = PENDING`, `parent_asset_id = master`): `identity_score` = số đo; `metadata` gồm `job_id, variant_key, preset, ratio, watermark, subject_pixel_identity, engine, background_provider, cloud_fallback, cloud_fallback_reason, scene_index, scene_plan_id`.

Ngưỡng: SAFE ≥ 0,999 · WARNING ≥ 0,99 · REJECTED < 0,99 (không ghi asset).

---

## 6. Khu vực E — Chặng 06d

`POST /api/v1/video/jobs` (`I1`):

| Trường | Kiểu |
|---|---|
| `productId?`, `title` | |
| `format` | `REEL_15S \| TIKTOK_30S \| STORY_15S \| SLIDESHOW \| PRODUCT_PAGE \| AD_MOTION` |
| `aspectRatio?` | theo khuôn |
| `musicTrack?`, `voiceCode?` | để trống = worker tự chọn |
| `hasSubtitle?`, `hasWatermark?` | |
| `captionStyle?` | `MODERN_BADGE \| MINIMAL_ELEGANT \| HIGHLIGHT_BOX \| BOTTOM_BANNER \| NONE` |
| `scenes?[]` | `{ sceneIndex?, durationSeconds (0,5–15), imageAssetId?, textOverlay?, voiceScript?, transitionEffect?, motionEffect?: ZOOM_IN \| ZOOM_OUT \| PAN_UP \| PAN_RIGHT \| STATIC }` |

Tạo ra `video_jobs` ở `DRAFT`. Tiếp theo: `PATCH …/storyboard` (`I1`), `POST …/approve-script` (`P3`), `POST …/render` (`I1`, job `video.render` 5 credit), `POST …/approve-video` (`P4`). `video_stage`: `DRAFT, SCRIPT_GENERATING, SCRIPT_READY, SCRIPT_APPROVED, RENDERING, RENDER_COMPLETED, APPROVED, REJECTED, FAILED`.

---

## 7. Khu vực F — Chặng 07 → 09

`PackagePost`: `{ channel: "facebook"|"instagram"|"tiktok"|"zalo", text: string, hashtags: string[] }` — mỗi kênh tối đa một bài.

| Chặng | Gọi | Vào | Ra / hiệu ứng |
|---|---|---|---|
| 07 | `POST /creative-production/packages` (`I1`) | `{ name, mode, master_asset_id, topic?: { id, title, angleCategory?, hook?, cta?, scene2Preset? }, posts?, variant_asset_ids?, video_job_id?, audio_job_id? }` | gói `DRAFT` |
| 07 | `PATCH /creative-production/packages/:id` (`I1`) | các trường trên (trừ master/mode/topic) | về `DRAFT`, xoá QA |
| — | `GET /creative-production/packages/:id` (`G1`) | — | `CampaignPackageView` (dưới) |
| 08 | `POST /creative-production/packages/:id/qa` (`I1`) | — | `qa_report` + `status` |
| 09 | `POST /creative-production/packages/:id/approve` (`J5`) | `{ acknowledge_warnings?: boolean }` | `APPROVED`, `audit_logs` |

`CampaignPackageView`: `{ id, name, mode, status, master_asset_id, product_id, topic, posts, variant_asset_ids, video_job_id, audio_job_id, variants: { asset_id, url, aspect_ratio, identity_score, approval_state, scene_index, watermark }[], video: { id, title, stage, video_approval, aspect_ratio, final_video_url } | null, audio: { job_id, stage, audio_url } | null, qa_report, qa_checked_at, approved_by, approved_at, launch_plan, created_at, updated_at }`.

`QaReport`: `{ verdict: "PASS"|"NEEDS_REVIEW"|"REJECTED", checks: { id: product_integrity|approvals|platform_specs|content|brand, title, verdict, reasons[] }[], checkedAt }`. Luật chi tiết: Arch §8.

---

## 8. Downstream — Chặng 10 → 14

| Chặng | Gọi | Vào | Ra |
|---|---|---|---|
| 10 | `PUT /creative-production/packages/:id/launch` (`J5`) | `{ channels: PackageChannel[] (≥1), scheduled_at?: ISO, post_refs: { platform, content_id }[] }` | `launch_plan = { channels, scheduledAt, postRefs }` (gói phải `APPROVED`) |
| 11–14 | `GET /creative-production/packages/:id/performance` (`R1`) | — | dưới |

```ts
{
  package_id, status,
  sell: { conversations_since_approval, orders },
  measure: {
    since: ISO | null,
    orders: { count, quantity, revenueVnd },       // sản phẩm của gói, từ approved_at, bỏ DRAFT/CANCELLED
    conversations,                                 // toàn tiệm, từ approved_at
    channel: { linkedPosts, postsWithData, reach, impressions, engagement, clicks, conversions },  // null = chưa có số
    caveats: string[]                              // giới hạn của phép đo — hiển thị nguyên văn
  },
  learn: { status: "INSUFFICIENT_DATA", have, need: 3 }
       | { status: "OK", basedOn, patterns: { dimension: angleCategory|scene2Preset|hasVideo, value, packages, avgRevenueVnd, avgOrders }[] },
  next_best_actions: { id, title, why, target: area-b|area-d|area-e|area-f|/lich-dang|/hoi-thoai }[],
  computed_at
}
```

---

## 9. Sơ đồ dữ liệu

```
assets(ORIGINAL) ─▶ product_analysis_runs(report) ─▶ URL định danh ─▶ CreativeStudioContext
                                                                    │
   B: produce (không lưu) ──"Lưu bài vào gói"──────────────────────┐ │
   C: generation_jobs(audio.generate).output.audio_storage_key ──┐ │ │
   D: generation_jobs(media.variant[.cloud]) → assets(MARKETING) ┤ │ │
   E: video_jobs + video_scenes(motion_effect)  ─────────────────┤ │ │
                                                                  ▼ ▼ ▼
                                                     campaign_packages (07–10)
                                                                  │
                           orders/order_items · chat_conversations · content_metrics ─▶ 11–14
```
