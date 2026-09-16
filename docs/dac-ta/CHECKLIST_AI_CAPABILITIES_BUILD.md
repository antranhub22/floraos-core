# CHECKLIST BUILD AI CAPABILITIES — FloraOS Core

> [!NOTE]
> **VAI TRÒ TÀI LIỆU — PHỤ LỤC KỸ THUẬT 34 AI CAPABILITIES (AIC-01 → AIC-34)**  
> Tệp này theo dõi chi tiết kỹ thuật chuyên sâu cho tầng AI Orchestration Engine, AI Registry, Cổng Provider và Bộ định tuyến.  
> **Checklist điều hành tổng thể toàn bộ dự án (P0 → P23, Tuyến B, Tuyến C AI-1 → AI-4)** là nguồn sự thật duy nhất (OSOT) nằm tại: [`docs/dac-ta/Checklist_Thuc_Thi.md`](file:///Users/tuan/Projects/floraos-core/docs/dac-ta/Checklist_Thuc_Thi.md).

> Dựa trên 34 AI Capabilities (AIC-01 → AIC-34) trong `src/core/ai/domain/ai-capabilities.ts` và lộ trình Tuyến B (P13–P23) + Tuyến C (AI-1–AI-4). Mỗi ô = một task có thể verify riêng.

---

## PHASE 0: FOUNDATION (Backend sẵn sàng)

### 0.1 Core AI Infrastructure (AI-1 đợt 1 — ĐÃ XONG 09/12)
- [x] 34 AI Capabilities defined in `ai-capabilities.ts`
- [x] 10 Provider ports tại `src/core/ports/`
- [x] `ai_capabilities`, `ai_models` tables + 4-field license gate
- [x] Routing engine (5 constraints), evaluation, privacy floor
- [x] `callCapability` gateway + `wiring.ts`
- [x] `ai_policies` per org, `GET/PUT /ai-policy` (U1/U2)
- [x] `ai_requests` logging, `ai_evaluations` scoring
- [x] RBAC: U1–U4 added (119 capabilities, 34 hard caps)

### 0.2 Job Infrastructure (P3 — ĐÃ XONG)
- [x] `generation_jobs` 3 axes (status/stage/result)
- [x] `enqueueJob` (quota check → usage → job → NOTIFY, 1 TX)
- [x] Worker `claimNext` = `SKIP LOCKED` + `LISTEN/NOTIFY`
- [x] SSE `/jobs/:id/events` (Last-Event-ID)
- [x] `usage` table single, written at enqueue only

### 0.3 Integration API Write Paths (P15 — ĐÃ XONG 09/12)
- [x] `POST /integration/assets` (child of APPROVED, PENDING)
- [x] `POST /integration/content-metrics` (idempotent 4 cols)
- [x] `POST /integration/usage` (cost_credit=0)
- [x] `GET /integration/products` extended filters

### 0.4 Dashboard Proxy (P15+ — ĐÃ XONG 09/12)
- [x] `/api/v1/proxy/[...path]` with whitelist (`src/modules/proxy/`)
- [x] Forward `X-FloraOS-SSO` + `Authorization: Bearer`
- [x] Creative Studio calling SocialFlow M04b (AIC-11)

---

## PHASE 1: FEATURE CATALOG & UI (FE — ĐÃ XÓNG)

### 1.1 Feature Catalog Library
- [x] `src/lib/feature-catalog.ts` (990 lines) — 34 SubFeature entries mapping AIC→RBAC→Module, types `SubFeature`/`ModuleFeatureGroup`/`SelectionState`, helpers `getFeaturesByModule`/`getRunnableFeatures`/`estimateCredits`/`getJobFeatureForModule`/`checkFeatureDependencies`
- [x] `src/lib/credit-estimator.ts` (339 lines) — credit estimates per feature (D14 placeholder: M01=10, M01b=5-8, M04a=15, M04b=1-5, M04c=15-40, M07=1-4)
- [x] Types: `SubFeature`, `ModuleFeatureGroup`, `SelectionState`
- [x] Unit tests: **chưa có** (`feature-catalog.test.ts`, `credit-estimator.test.ts`) — cần tạo

### 1.2 FeaturePicker Component
- [x] `src/components/dashboard/FeaturePicker.tsx` (682 lines) — main orchestrator
- [x] `ModuleSection` — collapsible per module (M01, M01b, M04a, M04b, M04c, M07, M09, M06, M05)
- [x] `FeatureCard` — checkbox + label + description + badges (AIC, privacy, credit, approval)
- [x] Dependency checks: `requiresApprovedInput`, `dependsOnMasterImage`, `requiresConsent`
- [x] RBAC gating: disable if `!capabilities.includes(rbacRun)`
- [x] Credit estimation summary bar
- [x] "Create Jobs" button → calls `POST /api/v1/jobs/batch`

### 1.3 Product Feature Dashboard Page
- [x] `src/app/(app)/san-pham/[id]/tinh-nang/page.tsx` — Load product + check Master Image approval status, FeaturePicker, SSE job progress, approval queue links
- [x] Sub-page: `src/app/(app)/san-pham/[id]/tinh-nang/product-copy/` — M01b copy management

### 1.4 Navigation & Mock Data Updates
- [x] `src/lib/mock-data.ts` — `phân-tích-sản-phẩm` + `creative-studio` = `hoat_dong`, `waiting: false`
- [x] Feature grid renders 10 modules with correct routes
- [ ] `src/lib/mock-data.ts` — add `ai-features` feature, update all statuses (pending UI design)
- [ ] Add route to `desktop-nav.tsx` or `experience-grid.tsx` for `ai-features`

---

## PHASE 2: BATCH JOB API (BE — ĐÃ XÓNG)

### 2.1 Batch Job Creation Endpoint
- [x] `POST /api/v1/jobs/batch` (`src/app/api/v1/jobs/batch/route.ts`) — accept `{ productId, feature, capabilities[], module }`, validate RBAC, group by module, return `{ jobs: [{ jobId, feature, module }] }`, Idempotency-Key required
- [x] Module → feature mapping via `MODULE_TO_JOB_FEATURE` in feature-catalog.ts
- [ ] Integration tests: `tests/tenant/batch-jobs.test.ts` — **chưa có**

### 2.2 Job Feature Payload Mapping
| Module | Job Feature | Capabilities in Payload |
|--------|-------------|------------------------|
| M01 | `vision.analyze` | AIC-01..06 (always all) |
| M01b | `product.copy.generate` | AIC-07..10 (selected) |
| M04a | `media.optimize` | AIC-06,08,09,10 (always all) |
| M04b | `creative.compose` | AIC-11..17 (selected) |
| M04c | `video.generate` | AIC-18..22 (selected) |
| M07 | `content.generate` | AIC-23..24, 26..32 (selected) |
| M09 | `customer.reminder` | AIC-29..30 (selected) |
| M06 | `catalog.generate` | AIC-25 (selected) |
| M05 | `landing.generate` | AIC-26 (selected) |

---

## PHASE 3: WORKER IMPLEMENTATION (Python — THEO LỘ TRÌNH)

### 3.1 M01 Vision Worker (P5 — HOÀN TẤT 09/12)
- [x] `workers/vision/jobs/worker.py` — `vision.analyze` job handler
- [x] Call `VisionAnalyzer.analyze()` with capabilities list
- [x] Store results in `product_analyses` (raw/edited split)
- [x] Job stage: `DETECTING` → `COMPLETED`
- [x] Result: `OK`/`LOW_CONFIDENCE`

### 3.2 M01b Product Copy Worker (P14 — HOÀN TẤT 09/12)
- [x] Product copy generation via `product.copy.generate` (direct `callCapability`, not queued worker)
- [x] Input: approved `product_analyses` + `occasions` + `brand_profile`
- [x] Capabilities: AIC-04 (product_copy) wrapping AIC-07/08/09/10
- [x] Output: `product_copies` (raw/edited), needs `H5`/`H6` approval

### 3.3 M04a Media Optimization Worker (P13 — ĐÃ XONG 09/12)
- [x] `workers/media_ai/jobs/worker.py` (370 lines) — `media.optimize` handler
- [x] Real-ESRGAN enhancement + Identity Guard + Smart Reframe 4 ratios (1:1, 4:5, 9:16, 16:9)
- [x] Output: 1 MASTER (`PENDING`) + 4 RATIO (`APPROVED`) assets
- [x] Job stages: `ANALYZING` → `ENHANCING` → `SMART_REFRAME` → `VERIFYING` → `GENERATING_OUTPUTS`
- [ ] Unit tests: `workers/tests/media_ai/` — existed, need verify current state

### 3.4 M04b Creative Worker (P16 — ĐỢT 1 XONG, ĐỢT 2 TIẾP)
- [ ] `SocialFlow/backend/m04b/` — FastAPI handlers
- [ ] ✅ AIC-11 `background_removal` (rembg + PIL fallback)
- [ ] 🔄 AIC-12 `background_generation` (studio/room/hotel/wedding backgrounds)
- [ ] 🔄 AIC-13 `image_expansion` (generative fill outpainting)
- [ ] 🔄 AIC-14 `image_retouch_deterministic` (brightness/contrast/color)
- [ ] 🔄 AIC-15 `image_retouch_generative` (AI retouch)
- [ ] 🔄 AIC-16 `watermark` (org logo config)
- [ ] 🔄 AIC-17 `creative_variants` (channel variants: FB/IG/TikTok/Story)
- [ ] Register results via `POST /integration/assets`

### 3.5 M04c Video Worker (P17 — HOÀN TẤT 09/16)
- [x] `workers/media_ai/video/` — video render worker daemon (Python listen/notify + skip locked)
- [x] AIC-18 `video_storyboard` (kịch bản storyboard linh hoạt 2–15 cảnh từ Master Image)
- [x] AIC-19 `video_shot_generation` (Ken Burns Camera Motion: Zoom In/Out, Pan Up/Right, Static; Option B Standby: Google Veo & HeyGen)
- [x] AIC-20 `video_assembly` (FFmpeg zoompan ghép cảnh ~0.45s/cảnh, audio ducking, phụ đề 4 phong cách)
- [x] AIC-21 `text_to_speech` (Edge TTS tiếng Việt tự nhiên đồng bộ lời thoại)
- [x] AIC-22 `speech_to_text` (căn chỉnh phụ đề theo thời gian phân cảnh)
- [x] 6 templates: Reel 30s 9:16, TikTok 15s/30s/45s 9:16, Feed 15s/30s 1:1, Landscape 30s 16:9 (`VIDEO_FORMAT_SPECS`)
- [x] `video_jobs` table với `organization_id NOT NULL`, tracking usage, status/stage/result chuẩn SaaS

### 3.6 M07 Content Worker (P18 — SAU P16)
- [ ] `SocialFlow/backend/m07/` — content generation
- [ ] AIC-23 `content_generation` (FB/IG/TikTok/Zalo/SEO/Hashtag/Ad/Livestream/DM)
- [ ] AIC-24 `content_qa` (factual/brand/platform/readability scoring)
- [ ] Zalo OA adapter, auto-approve switch (O7), credential per org
- [ ] Schedule/publish workflow, content library

### 3.7 M09 Customer Worker (P21)
- [ ] `floraos-core/workers/customer/` — segmentation + reminders
- [ ] AIC-29 `customer_segmentation` (SENSITIVE privacy floor)
- [ ] AIC-30 `reminder_message` (needs approval, consent-gated)
- [ ] D13 consent framework must be decided first

### 3.8 M08 Chat Worker (P23)
- [ ] New repo for messaging
- [ ] AIC-31 `chat_intent_routing` + AIC-32 `chat_answer`
- [ ] Grounded on Product Master + Pricing Engine + Delivery zones
- [ ] Handoff to human (T4 hard cap)

### 3.9 M11 Analytics/Learning Worker (P20 + AI-4)
- [ ] `campaign_rollups` rebuild from SocialFlow metrics
- [ ] ROI join with core `orders`
- [ ] AIC-33 `analytics_interpretation`, AIC-34 `learning_pattern`
- [ ] 4-phase learning loop, `content_features` + `visual_style`

---

## PHASE 4: APPROVAL WORKFLOWS (FE + BE)

### 4.1 M01b Approval (P14)
- [x] `product_copies` table (raw/edited, analysis_id FK) — schema in `prisma/schema.prisma`
- [x] `H5` run / `H6` approve capabilities — `capability-catalog.ts`
- [x] Approve → write to Product Master + `audit_logs` (1 TX) — `approveProductCopy` use-case, `runInTransaction`, `recordAuditLog`
- [x] Reject → mark `REJECTED` + audit log — `rejectProductCopy` use-case
- [x] Test: `tests/tenant/product-copies.test.ts` (14 ca)

### 4.2 M04b Approval (P16)
- [ ] Creative variants → assets `PENDING` → `P1`/`P2` approve
- [ ] Download before approve (I3 equivalent)

### 4.3 M04c Approval (P17 — HOÀN TẤT 09/16)
- [x] Videos → assets `PENDING` → `P3` (approve-script) / `P4` (approve-video) duyệt độc lập
- [x] Cost confirmation modal (`VideoCreateModal`) trước khi tạo job

### 4.4 M07 Approval (P18)
- [ ] Content drafts → `O1`/`O3` approve
- [ ] Auto-approve after 24h (O7 toggle, default off)

---

## PHASE 5: PRICING & QUOTA (D14 — CHỐT TRƯỚC GO-LIVE)

- [ ] Credit cost table per feature (D14 decision)
- [ ] Quota check at enqueue for all job types
- [ ] Credit balance UI in dashboard
- [ ] Trial vs Production workspace limits

---

## PHASE 6: TENANT ISOLATION VERIFICATION

- [ ] `npm run test:tenant` passes for all new tables/routes
- [ ] Cross-org job submission blocked (404)
- [ ] Cross-org asset access blocked (404)
- [ ] Worker only sees jobs for its org (SKIP LOCKED + org_id filter)

---

## PHASE 7: E2E VERIFICATION (MÁY THẬT)

- [ ] Start all 3 services: Core 3100, LocalBudd 3000, SocialFlow 8000
- [ ] Login Core → Product Feature Dashboard → Select features → Create jobs
- [ ] Workers pick up jobs → Process → Results appear in dashboard
- [ ] Approve results → Verify Product Master / Assets updated
- [ ] Test 401/403/502 proxy error states
- [ ] Test quota exhaustion → job blocked at enqueue

---

## MILESTONES

| Milestone | Target | Status | Blockers |
|-----------|--------|--------|----------|
| Feature Catalog + UI (Phase 1) | Tuần này | **HOÀN TẤT** ✅ | — |
| Batch Job API (Phase 2) | Tuần này | **HOÀN TẤT** ✅ | Phase 1 |
| ~~M01b Worker (Phase 3.2)~~ | ~~P14~~ | **HOÀN TẤT** ✅ 09/12 | ~~Bộ ảnh vàng~~ |
| M04b Creative full (Phase 3.4) | P16 | Chờ | M04a Master Image approved |
| M04c Video (Phase 3.5) | P17 | **HOÀN TẤT** ✅ 09/16 | — |
| M07 Content (Phase 3.6) | P18 | Chờ | D14, AI-2, P16 |
| Go-live MVP (P13–P19) | Theo lộ trình | Chờ | D13, D14, AI-2 |

---

## TECHNICAL DEBT TRACKING (GHI NỢ KHI BUILD)

| # | Nợ | Điều kiện trả |
|---|-----|--------------|
| #24 | **ĐÃ TRẢ 09/12 + 09/14.** 8 ảnh gán nhãn + OpenAI Structured API thật trên 4/8 ảnh → `golden/ai-accuracy-report-openai.csv` | Đã trả |
| #24a | OpenAI API thật trên 4/8 ảnh vàng còn lại (g003–g007, g009) | Trả khi đủ 8 ảnh → chốt provider |
| #56 | `local_cv` counting accuracy thấp | Cải thiện SAM2+Florence2 hoặc bỏ |
| #61 | Fallback chain thiếu → worker crash | AI-2 fallback chain |
| #69 | Privacy level chưa truyền trong job call | Trước P21 (M09) |
| #70 | Không có fallback model config | AI-2 routing cascade |
| #72 | Threshold tạm cho AIC-11..34 (chưa đo) | AI-2 benchmark |
| #75 | FFmpeg build config in ai_models registry | Trước P17 video |

---

## CHECKLIST FORMAT

Mỗi task khi làm xong: tích `[x]` + commit message reference.
Ví dụ: `- [x] feat: add feature-catalog.ts library (commit: abc1234)`