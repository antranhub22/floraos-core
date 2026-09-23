# Kiến Trúc AI Creative Studio — SSOT Architecture Document

> **Module:** AI Creative Studio — Chặng 01–14 của hành trình Product-to-Market, gói trong 6 Khu vực tab (A–F)
> **Route:** `/creative-studio`
> **Phiên bản:** 4.0 — 23/09/2026 — Đồng bộ lại 100% theo mã (rà soát `claude/ra-soat-dong-bo-creative-studio-14-chang-23-09-2026.md` trong project)
> **Trạng thái:** Đã triển khai trên nhánh `fix/creative-studio-production-ready`. Nghiệm thu trên máy thật còn thiếu: `npm run test:tenant` (cần Postgres), chạy thử worker với `STABILITY_API_KEY` thật, `lint` toàn repo (xem §9).
>
> **Quy tắc đọc:** chi tiết thi công (tên tệp, đường dẫn, method, mã năng lực, enum) lấy mã nguồn làm chuẩn (Hiến pháp Tài liệu §2, quy tắc 2). Tài liệu này mô tả đúng những gì mã đang làm, kể cả giới hạn.

---

## 1. Tổng Quan & Vai Trò

Creative Studio gom hành trình "1 sản phẩm hoa → 1 chiến dịch" vào một màn hình 6 khu vực. Khu vực A là điểm khởi đầu; B–E sản xuất; F đóng gói, kiểm định, duyệt và theo dõi hiệu quả.

| Khu vực | Tab ID | Nhãn | Icon | Chặng | Component | Việc thật mã đang làm |
|---|---|---|---|---|---|---|
| A | `area-a` | Quét theo ảnh sản phẩm | Camera | 01–05 | `<ProductIntelligenceWorkspace />` | Tải ảnh → `assets` (ORIGINAL) · Vision `gpt-4o-mini` bóc tách nguyên tử · Trend Fit (đối chiếu `trend_signals`) · 10 chủ đề (sinh theo luật trong `trend-fit.ts`) · chọn chủ đề + Mode → bàn giao qua URL chỉ mang định danh |
| B | `area-b` | Viết contents | FileText | 06a | `<ContentsWorkspace />` | `POST /creative-production/produce` → cung truyện + 4 bài (Facebook, Instagram, TikTok, Zalo) sinh theo khuôn (`social-post-generator.ts`); lưu bài vào gói chiến dịch |
| C | `area-c` | Tạo audio | Headphones | 06b | `<AudioWorkspace />` | `POST /audio/jobs` → job `audio.generate` → worker Python phối voice + nhạc nền, ghi kho → nghe lại qua `GET /audio/jobs/:id` |
| D | `area-d` | Tạo biến thể ảnh | Wand2 | 06c | `<VariantWorkspace />` | 4 phân cảnh Narrative Arc, mỗi cảnh là một job `media.variant` (Studio cục bộ) hoặc `media.variant.cloud` (hậu cảnh Stability) — Subject Integrity ĐO bởi worker |
| E | `area-e` | Tạo video | Film | 06d | `<VideoWorkspace />` | Tạo `video_jobs` (bản nháp) theo 6 khuôn M04c với storyboard + Ken Burns theo cảnh; duyệt P3/P4 và render ở màn Video |
| F | `area-f` | Gói chiến dịch | Package | 07–09 (+10–14) | `<PackageWorkspace />` | Gói lưu ở `campaign_packages`; QA năm trục phía máy chủ; duyệt `J5` + `audit_logs`; kế hoạch đăng; số liệu thật Chặng 11–14 |

### 1.1. Downstream (Chặng 10 → 14) — `<PackageDownstreamCard />`

Chỉ hiện sau khi gói ở trạng thái `APPROVED`. Mọi số liệu đọc từ `GET /creative-production/packages/:id/performance`:

- **10 LAUNCH** — lưu kế hoạch đăng (kênh, giờ) và **mã bài đã đăng** (`PUT /packages/:id/launch`). Việc đăng/lên lịch thật diễn ra ở **Lịch đăng** (`/lich-dang`, SocialFlow M07) — Creative Studio không tự đăng bài.
- **11 SELL** — số hội thoại mới (`chat_conversations`) kể từ ngày duyệt (toàn tiệm).
- **12 MEASURE** — đơn và doanh thu của **sản phẩm trong gói** kể từ ngày duyệt (`orders`/`order_items`, bỏ `DRAFT`/`CANCELLED`) + tổng `content_metrics` của các mã bài đã gắn. Chưa quy được đơn về từng bài đăng — giao diện ghi rõ.
- **13 LEARN** — so doanh thu trung bình theo góc tiếp cận chủ đề, preset Cảnh 2, có/không video trên các gói đã duyệt của tiệm; **chỉ kết luận khi ≥ 3 gói**, và chỉ khi có ≥ 2 nhóm để so.
- **14 NEXT BEST ACTION** — luật dựa trên dữ kiện thật (chưa gắn bài, chưa có video, 7 ngày không đơn, có hội thoại chưa chốt, góc thắng của tiệm, dịp cố định trong 30 ngày tới: 14/2, 8/3, 20/10, 20/11, 24/12).

---

## 2. Nguyên Tắc Thiết Kế Bất Biến

### 2.1. Khu vực A là điểm khởi đầu, không bao giờ bị chặn
`ValidationScreen` chỉ hiện khi vào B–F mà `validateTransition()` báo thiếu. Khu vực A không bao giờ bị chặn. Người dùng có thể bấm "tiếp tục" để bỏ qua màn cảnh báo (không chặn cứng).

### 2.2. Cổng chuyển tiếp `validateTransition()`
Tám trường bắt buộc: `topicId`, `mode`, `sourceImageUrl`, `productName`, `assetId`, `commercialPassport.category`, `commercialPassport.style`, `commercialPassport.components`, `commercialPassport.colors` (tệp `src/modules/creative-production/domain/validate-transition.ts`). Từ 23/09/2026 trang **không còn bịa** passport dự phòng ("Hoa tươi thiết kế", "Tone màu hài hòa") — thiếu dữ liệu thật thì cổng báo thiếu. `category` là hình dáng (`attributes.shape`), không phải phân khúc giá.

### 2.3. `assetId` bất biến, URL chỉ mang định danh (chống lỗi 431)
- Ảnh tải lên: `POST /api/v1/assets/upload-url` → `PUT` lên kho → `POST /api/v1/assets` (đăng ký `ORIGINAL`). Từng bước kiểm `res.ok`; lỗi thì dừng, không gán `assetId`.
- `buildHandoffSearchParams()` (`build-handoff-url.ts`) chỉ cho phép định danh; `isSafeHandoffQueryString()` kiểm lại. Ảnh luôn ký lại qua `GET /api/v1/assets/:id/view-url`.
- Định danh sinh ở C/E cũng đi qua URL: `audioJobId`, `videoJobId` — Khu vực F đọc lại qua API.

### 2.4. Subject Integrity (M04b)
- Worker đo tỷ lệ điểm ảnh LÕI chủ thể trùng khít TUYỆT ĐỐI với Master Image trên mặt nạ co biên. Độ sâu co biên = `StudioBackdropEngine.LIGHT_WRAP_DEPTH_PX + 1` = 5px (sửa 23/09/2026 — trước đó 3px < light wrap 4px nên mọi biến thể hợp lệ bị đo ~0,96).
- Ngưỡng (`variant-rules.ts`): `≥ 0,999` SAFE · `≥ 0,99` WARNING · `< 0,99` REJECTED.
- **REJECTED thì không ghi asset nào** (job `COMPLETED` + `result = REJECTED`). Nhánh "vẫn ghi, dán nhãn WARNING" đã gỡ 23/09/2026.

### 2.5. Tenant Isolation
`organization_id` chỉ từ phiên máy chủ. `POST /creative-production/produce` không còn nhận `organizationId` trong body (23/09/2026). Bảng mới `campaign_packages` là TENANT, đi qua `scopedWhere`/`scopedData`.

### 2.6. Biến thể chỉ dựng từ MASTER đã duyệt
Cả hai nhánh M04b kiểm `kind = MASTER && approval_state = APPROVED` phía TS (`requestVariants`/`requestCloudVariant`, trả `409`) và kiểm lại ở worker. Ảnh ORIGINAL từ Khu vực A đi qua "Skip — Dùng ảnh gốc" (`POST /media/promote-to-master`, `I2`) — hàm này nay tìm đúng MASTER con của ảnh gốc để không tạo trùng.

### 2.7. Không chạy mô hình trong request HTTP
Mọi lượt dựng ảnh/âm thanh/video đi qua `enqueueJob` (hạn mức → trừ credit → `usage` → `generation_jobs` → `NOTIFY` trong một giao dịch, `Idempotency-Key` bắt buộc). `StudioLocalImageProvider` (TS) không còn `execFileSync` Python — luôn ném lỗi rõ ràng; Studio Backdrop Engine chỉ chạy trong worker.

---

## 3. Cấu Trúc Thư Mục

```
src/app/(app)/creative-studio/page.tsx          # Shell 6 khu vực + CreativeStudioContext (~470 dòng)

src/components/creative-studio/
├── contents-workspace.tsx        # B
├── creative-result-viewer.tsx    # B — hiển thị 4 bài, "Lưu bài vào gói chiến dịch"
├── audio-workspace.tsx           # C — tạo job + chờ + nghe lại
├── variant-workspace.tsx         # D — 4 phân cảnh qua job thật
├── source-picker.tsx             # D — chọn Master / Skip dùng ảnh gốc
├── video-workspace.tsx           # E
├── package-workspace.tsx         # F — Chặng 07/08/09
├── package-qa-card.tsx           # F — hiển thị báo cáo QA thật
├── package-downstream-card.tsx   # F — Chặng 10–14
├── package-client.ts             # F/B/E — helper gọi API gói chiến dịch
├── validation-screen.tsx         # cổng chuyển tiếp B–F
├── use-creative-studio-data.ts   # state + API M04a/M04b dùng chung
├── types.ts
├── optimize-workspace.tsx        # M04a — CHƯA gắn vào Studio (M04a chạy ở /tai-anh)
└── asset-picker-grid.tsx         # chỉ optimize-workspace dùng

src/components/market-intelligence/
├── product-intelligence-workspace.tsx   # A — Chặng 01–05
├── creative-handoff-modal.tsx           # A — Chặng 05 CHOOSE, bàn giao
└── product-topics-list.tsx              # A — 10 chủ đề + video tham khảo (nhãn "ước tính" khi không phải số liệu thật)

src/modules/creative-production/
├── domain/  production-types · validate-transition · build-handoff-url · content-brief-builder ·
│            social-post-generator · topic-to-{audio,content,media,video}-bridge ·
│            campaign-package-rules (QA, duyệt, số đo, mẫu thắng, đề xuất)
├── use-cases/  produce-creative · produce-authentic · plan-narrative-arc · dispatch-production-jobs ·
│               package-campaign (ước tính, không lưu) · manage-campaign-package · get-campaign-performance
├── infra/   campaign-package-repository (Prisma) · creative-production-repository (port in-memory cũ, chưa dùng)
└── adapters/ narrative-ai-adapter

src/modules/media/
├── domain/variant-rules.ts                 # feature, preset, ratio, ngưỡng, cổng Master
├── use-cases/request-variants.ts           # requestVariants · requestVariantBatch · requestCloudVariant
├── use-cases/get-variant-job.ts            # trả thêm engine / scene_index / cloud_fallback
├── adapters/multi-image-provider-router.ts # dùng bởi M04a cloud (execute-cloud-creative) — xem nợ #120
└── adapters/studio-local-image-provider.ts # luôn ném lỗi (không chạy Python trong web)

src/modules/audio-studio/  use-cases/create-audio-job · get-audio-job · infra/audio-job-repository

workers/media_ai/
├── jobs/worker.py              # một vòng claim: media.optimize → media.variant → media.variant.cloud → audio.generate → video.render
├── jobs/variant_worker.py      # M04b cả hai nhánh (local + cloud)
├── providers/background/stability_background.py   # hậu cảnh trống do Stability sinh
├── providers/segmentation/rembg_segmenter.py
├── image/studio_backdrop.py    # StudioBackdropEngine (composite(backdrop_image=...))
├── audio/audio_worker.py       # process_audio_generation_job
└── generate_scene.py           # CLI đo tốc độ cho dev — KHÔNG nằm trên đường chạy production
```

---

## 4. Luồng 6 Khu Vực

```
A (01–05) ──bàn giao URL định danh──▶ B · C · D · E (06a–06d, thứ tự tự do)
                                         │  B lưu bài vào gói; C/E mang audioJobId/videoJobId qua URL
                                         ▼
                                F: 07 PACKAGE ─▶ 08 QA (máy chủ) ─▶ 09 APPROVE (J5 + audit)
                                         ▼
                   10 LAUNCH (kế hoạch + mã bài) ─▶ 11–12 số liệu thật ─▶ 13 mẫu thắng ─▶ 14 đề xuất
```

---

## 5. API Contracts (đầy đủ ở `06-api-specification.md` §8, §19, §22, §23)

| Khu vực | Method · Path | Năng lực |
|---|---|---|
| A | `POST /assets/upload-url` · `POST /assets` · `GET /assets/:id/view-url` | `G2` · `G2` · `G1` |
| A | `POST /market-intelligence/vision-extract` · `POST /market-intelligence/product-intelligence` | `V1` · `V1` |
| A | `GET /product-intelligence/:id` | `V2` |
| B | `POST /creative-production/produce` · `/plan` · `/package` (ước tính) | `I1` |
| C | `POST /audio/jobs` (Idempotency-Key) · `GET /audio/jobs/:id` | `I1` |
| D | `POST /media/variants` (`engine` local/cloud, Idempotency-Key) · `GET /media/variants/:id` | `I4` |
| D | `POST /media/variants/:id/approve` · `GET /media/variants` | `I5` |
| D | `POST /media/promote-to-master` | `I2` |
| D | `GET /assets?kind=MARKETING&parent_asset_id=` (lọc theo Master — thêm 23/09/2026) | `G1` |
| E | `GET·POST /video/jobs` · `PATCH /video/jobs/:id/storyboard` · `POST /video/jobs/:id/render` | `I1` |
| E | `POST /video/jobs/:id/approve-script` · `approve-video` | `P3` · `P4` |
| F | `POST·GET /creative-production/packages` | `I1` · `G1` |
| F | `GET·PATCH /creative-production/packages/:id` | `G1` · `I1` |
| F | `POST /creative-production/packages/:id/qa` | `I1` |
| F | `POST /creative-production/packages/:id/approve` · `PUT …/launch` | `J5` |
| F | `GET /creative-production/packages/:id/performance` | `R1` |

---

## 6. Năng Lực (theo `src/core/rbac/capability-catalog.ts`)

| Mã | Tên trong catalog | Dùng ở Creative Studio | Trần cứng |
|---|---|---|---|
| `G1`/`G2` | `asset.read` / `asset.upload` | đọc/tải ảnh, đọc gói | — |
| `V1` | `market_intel.research.run` | Vision + Product Intelligence (A) | — |
| `V2` | `market_intel.opportunity.read` | đọc lại report (A) | — |
| `I1` | `media.optimize` | produce/plan (B), audio (C), video (E), tạo/sửa/QA gói (F) — ⚠ dùng chung, xem nợ #121 | — |
| `I2` | `media.approve` | Skip — promote ORIGINAL → MASTER | **Có** |
| `I4` | `media.variant.run` | biến thể (D) | — |
| `I5` | `media.variant.approve` | duyệt biến thể (D) | **Có** |
| `P3` | `video.approve_script` | duyệt kịch bản video | — |
| `P4` | `video.approve_final` | duyệt video thành phẩm | **Có** |
| `J5` | `social.publish` | duyệt gói (09) + kế hoạch đăng (10) | — (chờ PO, nợ #121) |
| `R1` | `order.read` | số liệu Chặng 11–14 | — |

---

## 7. Khu vực D — 4 Phân Cảnh Narrative Arc

| Cảnh | Beat | Preset API (`VARIANT_PRESET_IDS`) | Style nội bộ worker | Nguồn hậu cảnh |
|---|---|---|---|---|
| 1 | SETUP | `studio_white` | `clean_white` | luôn Studio cục bộ |
| 2 | RISING | `wedding` (góc EMOTIONAL) · `luxury_hotel` (PRODUCT_SHOWCASE/TREND) · `living_room` (còn lại) | `boutique_bokeh` · `warm_gray` · `soft_ambient` | Stability (mặc định) hoặc Studio cục bộ — người dùng chọn |
| 3 | CLIMAX | `wood_minimal` | `wood_warm` | Stability (mặc định) hoặc Studio cục bộ |
| 4 | CTA | `transparent` | `transparent` | luôn cục bộ (tách nền) |

- Mỗi cảnh = một job, `scene_index` 1–4 ghi vào payload và `assets.metadata`. Màn kết quả chỉ hiện ảnh thật đã sinh cho đúng cảnh; cảnh chưa sinh ghi "Chưa sinh — chưa đo" (không mượn ảnh gốc).
- Số toàn vẹn hiển thị là `subject_integrity.subject_pixel_identity` của job hoặc `assets.identity_score`.
- Tự nạp phân cảnh đã sinh bằng `GET /assets?kind=MARKETING&parent_asset_id=<master>` — chỉ của Master đang chọn.
- Duyệt từng cảnh: `POST /media/variants/:job_id/approve` (`I5`).

### 7.1. Nhánh Cloud (`media.variant.cloud`)
1. TS `requestCloudVariant` → `enqueueJob` (2 credit — giá tạm, nợ #64).
2. Worker: `StabilityBackgroundProvider.sinh_hau_canh()` gọi `POST https://api.stability.ai/v2beta/stable-image/generate/core` với lời nhắc **chỉ mô tả không gian**, luôn nối "no flowers, no people, no text…".
3. Tách chủ thể (rembg + defringe, cache đĩa theo `master_asset_id` tại `var/storage/cache/m04b_segmentation/`), `StudioBackdropEngine.composite(backdrop_image=…)` dán nguyên khối bó hoa, đổ bóng, light wrap.
4. Đo Subject Integrity → quyết định ghi asset. Asset ghi `provider=stability_ai`, `metadata.engine=cloud_provider`.
5. Nhà cung cấp lỗi (thiếu `STABILITY_API_KEY`, 402/403/429, mạng, không phải ảnh) → lùi về phông cục bộ của preset, ghi `cloud_fallback=true` + lý do vào asset, sự kiện job và `ai_requests` (`outcome=FAILED`).

### 7.2. Tốc độ
Con số "~0,46s / ảnh 2048×2048" là đo bằng CLI dev `generate_scene.py` khi đã có cache mặt nạ; chưa có phép đo chính thức trên worker production. Không dùng làm cam kết SLA.

---

## 8. Khu vực F — Gói chiến dịch

- Bảng `campaign_packages` (đặc tả 07 §23). Trạng thái: `DRAFT → QA_PASSED | QA_NEEDS_REVIEW | QA_REJECTED → APPROVED`. Sửa gói chưa duyệt → về `DRAFT`, xoá QA cũ.
- **QA (08)** — `evaluateCampaignQa()`: (1) toàn vẹn sản phẩm theo số đo từng ảnh; (2) cổng duyệt từng tài sản (I5, P4, audio hoàn tất); (3) chuẩn tỷ lệ theo kênh (TikTok cần 9:16); (4) nội dung — đủ bài, giới hạn ký tự (FB 63.206, IG 2.200, TikTok 2.200, Zalo 2.000), biến `{{…}}` chưa điền, ≤ 30 hashtag IG, từ điển ngành hoa + `brand_profiles.forbidden_styles` (`checkFlowerContent`); (5) thương hiệu — có logo, có ảnh đóng dấu. Phán quyết xấu nhất thắng.
- **Duyệt (09)** — `canApprovePackage()`: chỉ sau QA; `QA_REJECTED` không duyệt được; `QA_NEEDS_REVIEW` cần xác nhận. Ghi `audit_logs` cùng giao dịch, chốt chặn đua bằng `updateMany where status = <đã đọc>`.
- Bài đăng vào gói từ Khu vực B (nút "Lưu bài vào gói chiến dịch") hoặc soạn trực tiếp ở F.

---

## 9. Giới hạn & nợ còn mở (chi tiết ở `TECHNICAL_DEBT.md`)

- **#119** — Khuôn bài đăng (`social-post-generator.ts`) còn câu cam kết dịch vụ chung ("giao 2 giờ", "tặng thiệp", "freeship nội thành") không lấy từ hồ sơ tiệm — chủ tiệm phải sửa trước khi đăng; QA không bắt được.
- **#120** — Nhánh cloud của **M04a** (`POST /media/optimizations` engine cloud → `executeCloudCreative`) vẫn chạy đồng bộ trong request, integrity ước lượng 0,98/1,0, bản RATIO trỏ cùng tệp. Ngoài phạm vi Creative Studio (M04a chạy ở `/tai-anh`).
- **#121** — Năng lực: B/C/E/F dùng chung `I1`; duyệt gói dùng `J5` (không trần cứng). Chờ PO quyết thêm mã riêng.
- **#122** — 10 chủ đề của Chặng 04 là khuôn theo luật; "video tham khảo" là danh mục tuyển chọn (metrics ước tính, TikTok là trang tìm kiếm) — giao diện đã gắn nhãn; chưa có nguồn video thời gian thực.
- **#123** — Video E: chưa nhận bản phối âm thanh từ Khu vực C; giọng/nhạc để worker chọn mặc định.
- **#124** — `npm run lint` toàn repo còn 235 lỗi (src) + 31 (tests) ngoài phạm vi Creative Studio (CI đỏ ở bước lint); phạm vi Creative Studio đã 0 lỗi.
- Chưa quy được đơn hàng về từng bài đăng (không có mã theo dõi); Chặng 11–12 tính theo sản phẩm kể từ ngày duyệt.
