# Checklist — Creative Studio (Chặng 01–14, 6 Khu vực A–F)

> **Quy tắc:** `[x]` = mã đã làm đúng điều ô nói VÀ có kiểm chứng ghi ở cột cuối dòng. `[ ]` = chưa làm hoặc chưa kiểm chứng được. Trước khi tin một ô đã tích, mở đúng tệp ô đó nói tới (AGENTS.md).
> **Phiên bản:** 2.0 — 23/09/2026. Thay bản 1.0 (21/09, "5 tabs", đa số ô chưa tích dù mã đã có, trong khi Khu vực D tích cả ô "Subject Integrity 99.8–100%" vốn là số gõ tay).
> **Kiểm chứng máy thật 23/09 (máy anh Tony, VM Linux):** `tsc --noEmit` sạch · `vitest` 770/770 (94 tệp) · `eslint` phạm vi Creative Studio 0 lỗi · `pytest` worker 307 ca xanh (trừ `test_audio_worker.py` cần mạng TTS) · `check:docs` khớp. **Chưa chạy:** `test:tenant` (cần Postgres) — bắt buộc trước merge.

---

## 0. Bàn giao & cổng chuyển tiếp

- [x] URL bàn giao chỉ mang định danh, chặn Data URL/blob — `build-handoff-url.ts` + `build-handoff-url.test.ts`
- [x] `validateTransition` 8 trường bắt buộc — `validate-transition.test.ts`
- [x] Trang không bịa passport dự phòng; `category` = hình dáng, không phải phân khúc giá — `page.tsx` (23/09)
- [x] `audioJobId`/`videoJobId` mang qua URL sang Khu vực F — `audio-workspace.tsx`, `video-workspace.tsx`
- [ ] FFprobe tự đo thời lượng video nguồn — chưa làm

## 1. Khu vực A — Chặng 01–05

- [x] Tải ảnh → kho → `assets` ORIGINAL, kiểm `res.ok` từng bước — `product-intelligence-workspace.tsx` (23/09)
- [x] Vision `gpt-4o-mini` bóc tách nguyên tử, sửa được — `openai-vision-adapter.ts`
- [x] Trend Fit từ `trend_signals`, lưu `product_analysis_runs` — nợ #113/#115 đã trả; test tenant `product-intelligence-isolation`
- [x] 10 chủ đề + video tham khảo có nhãn "ước tính" khi không phải số thật — `product-topics-list.tsx` (23/09)
- [ ] Video tham khảo thời gian thực (TikTok/YouTube API) — nợ #122
- [ ] Occasion Intelligence / Positioning / Competitive Context — nợ #117 (PO tạm hoãn)

## 2. Khu vực B — Chặng 06a

- [x] `POST /creative-production/produce`, CREATIVE/AUTHENTIC; `organizationId` từ phiên — `produce/route.ts` (23/09)
- [x] 4 bài đa kênh, sửa được, không còn giá/thành phần bịa — `social-post-generator.ts`, `creative-result-viewer.tsx` (23/09)
- [x] Sửa lỗi rules-of-hooks trong `CreativeResultViewer` (tách vỏ/thân) — eslint 0 lỗi
- [x] "Lưu bài vào gói chiến dịch" — `package-client.ts`
- [ ] Khuôn bài còn câu cam kết dịch vụ chung chưa lấy từ hồ sơ tiệm — nợ #119

## 3. Khu vực C — Chặng 06b

- [x] `Idempotency-Key` bắt buộc, `usage` trả số credit đã trừ thật — `audio/jobs/route.ts`, `create-audio-job.ts`
- [x] Worker nhận `audio.generate`, ghi bản phối lên kho — `audio_worker.py#process_audio_generation_job` + `test_audio_job_lifecycle.py`
- [x] `GET /audio/jobs/:id` + trình nghe trên trang — `get-audio-job.ts`, `audio-workspace.tsx`
- [ ] Chạy thật với nhà cung cấp TTS trên máy có mạng — cần anh Tony chạy `npm run worker:media` + tạo 1 job

## 4. Khu vực D — Chặng 06c

- [x] 4 phân cảnh, mỗi cảnh một job thật (`scene_index` trong payload/metadata) — `variant-workspace.tsx`
- [x] Nhánh cloud qua `enqueueJob` (`media.variant.cloud`, 2 credit), cổng Master đã duyệt — `request-variants.ts` + `request-cloud-variant.test.ts`
- [x] Worker: Stability chỉ vẽ hậu cảnh, bó hoa dán nguyên khối, integrity ĐO — `stability_background.py`, `variant_worker.py` + `test_variant_cloud.py`
- [x] Nhà cung cấp lỗi → lùi phông cục bộ, ghi `cloud_fallback` — `test_variant_cloud.py`
- [x] Sửa phép đo: co biên 5px > light wrap 4px; REJECTED không ghi asset — `variant_worker.py#DO_SAU_CO_BIEN`
- [x] Gỡ `execFileSync` khỏi tiến trình web; `studio_local` không trả ảnh gốc giả — `studio-local-image-provider.ts` + test router
- [x] Gỡ canvas cutout phía trình duyệt; bỏ số "99.9%/99.8%/100%" gõ tay — `variant-workspace.tsx`
- [x] Tự nạp phân cảnh chỉ của Master đang chọn (`parent_asset_id`) — `assets/route.ts`, `list-assets.ts`
- [x] Ánh xạ Cảnh 2 theo `angleCategory` thật — `package-client.ts#sceneTwoPresetFor`
- [x] Duyệt từng cảnh (`I5`) — `variant-workspace.tsx#handleApproveScene`
- [x] Gỡ bộ chọn "6 bối cảnh" chọn tay + nhãn sai "10 phối cảnh (0đ)"; màn cấu hình = xem trước 4 cảnh + nguồn hậu cảnh + tỉ lệ + watermark — `variant-workspace.tsx#openSceneBoard` (24/09)
- [ ] Đo tốc độ chính thức trên worker production (con số ~0,46s là đo CLI dev)

## 5. Khu vực E — Chặng 06d

- [x] Storyboard dựng ngay khi mở tab; gửi đúng storyboard đang thấy (sửa lỗi gửi rỗng) — `video-workspace.tsx`, `storyboard-editor.tsx#onChange`
- [x] Ken Burns theo cảnh lưu `video_scenes.motion_effect`, vào payload render — migration `20260923161000`, `dispatch-video-render.ts`
- [x] Tự gắn ảnh biến thể của Khu vực D vào cảnh — `video-workspace.tsx`
- [x] Cổng duyệt `P3`/`P4` (đặc tả sửa theo mã)
- [ ] Nhận bản phối âm thanh từ Khu vực C — nợ #123

## 6. Khu vực F — Chặng 07–09

- [x] Bảng `campaign_packages` (TENANT) + migration `20260923160000` + TRUNCATE test — `schema.prisma`, `tests/helpers/database.ts`
- [x] Tạo/sửa gói, kiểm định danh thuộc đúng tổ chức & đúng Master — `manage-campaign-package.ts`
- [x] QA năm trục phía máy chủ — `campaign-package-rules.ts` + `campaign-package-rules.test.ts` (17 ca)
- [x] Duyệt `J5` + `audit_logs` cùng giao dịch + chốt chặn đua — `approve-campaign-package`
- [x] Ca thử cách ly tenant — `tests/tenant/campaign-packages.test.ts` (viết xong, **chưa chạy** — cần Postgres)
- [ ] Năng lực riêng + trần cứng cho duyệt gói — nợ #121 (chờ PO)

## 7. Chặng 10–14

- [x] Kế hoạch đăng + mã bài đã đăng — `PUT /packages/:id/launch`
- [x] Đơn/doanh thu/hội thoại/số liệu kênh THẬT, có ghi giới hạn — `get-campaign-performance.ts`
- [x] Mẫu thắng chỉ khi ≥ 3 gói, ≥ 2 nhóm — `extractWinningPatterns`
- [x] Đề xuất dựa trên dữ kiện thật + dịp cố định 30 ngày — `nextBestActions`
- [x] Gỡ toàn bộ số gõ cứng ("34 đơn", "20.366.000đ", "96%") — `package-downstream-card.tsx`
- [ ] Tự đăng bài từ Creative Studio (hiện đăng ở Lịch đăng/SocialFlow) — ngoài phạm vi, theo ranh giới module
- [ ] Quy đơn hàng về từng bài đăng (mã theo dõi/UTM) — chưa có

## 8. Cắt ngang

- [x] Mọi lượt AI của Creative Studio đi qua `enqueueJob` (trừ Vision/Product Intelligence là lời gọi đồng bộ có sổ riêng)
- [x] Header Studio không còn nút chết `onClick: () => {}` — `page.tsx`
- [ ] Nhánh cloud M04a (`/media/optimizations`) vẫn chạy đồng bộ — nợ #120
- [ ] `npm run lint` toàn repo xanh — nợ #124
- [ ] `npm run test:tenant` xanh trên máy có Postgres — **bắt buộc trước merge**

## 9. Tài liệu

- [x] Architecture v4.0 · IO Spec v4.0 · Journey v3.0 · Checklist v2.0
- [x] Đặc tả 06 §8/§19/§22/§23, đặc tả 07 §20/§23 — `check:docs` khớp
- [x] Registry, TRANG_THAI, TECHNICAL_DEBT (#119–#124), AGENTS.md trạng thái
