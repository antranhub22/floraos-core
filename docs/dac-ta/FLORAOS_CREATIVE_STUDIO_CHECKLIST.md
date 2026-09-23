# Checklist — Creative Studio Pipeline (Chặng 5-14)

> **Mục đích:** Kế hoạch triển khai chi tiết cho user journey
> "Quét theo Ảnh mẫu → Sáng tạo nội dung".
>
> **Quy tắc:** Mỗi ô [ ] chưa tích = chưa xong. Mỗi ô [x] = đã xong.
> Không tích trước, không tích ô chỉ làm một nửa.
>
> **Phiên bản:** 1.0 — 2026-09-21

---

## 0. Chặng chuyển tiếp — Chuẩn hóa inputs

- [ ] **TopicProductionBrief schema** — finalized, tất cả fields chuẩn hóa (docs/dac-ta/FLORAOS_CREATIVE_STUDIO_IO_SPEC.md)
- [ ] **Validation logic** — kiểm tra tất cả required fields có mặt trước khi vào Creative Studio
- [ ] **Video duration detect** — FFprobe auto-detect `sourceVideoDurationSeconds`
- [ ] **Transition UI** — screen trên `/thi-truong` hiển thị tổng hợp data Chặng 1-4
- [ ] **Data sync check** — đảm bảo `selectedTopics[0]` đồng bộ với topic Chặng 04
- [ ] **Test thuần** — kiểm tra validation, sync, video detect (không cần DB)

---

## 1. Chặng 5 — CHOOSE

### UI

- [ ] **Modal chọn định hướng** trên `/thi-truong` (thay 2 nút "Dựng video" + "Tạo ảnh biến thể" → 1 nút "Sáng tạo nội dung")
- [ ] **Mode selection** — CREATIVE (mặc định) hoặc AUTHENTIC
- [ ] **Đầu vào selection** — ảnh, video, cả hai
- [ ] **Preview topic + product** — hiển thị topic info + ảnh/video preview
- [ ] **URL param** — `/creative-studio?topic={id}&mode={mode}&source={type}`

### Backend

- [ ] **Validation middleware** — validate topic exists, mode valid, required fields present
- [ ] **TopicProductionBrief creation** — tạo brief từ Chặng 4 data + user choices

### Test

- [ ] **Unit test** — Modal component (mock router, mock topic data)
- [ ] **Unit test** — Brief creation (pure function, no DB)
- [ ] **Integration test** — Full flow: topic selection → brief creation → Creative Studio

---

## 2. Creative Studio Shell

### UI

- [ ] **Creative Studio page** (`/creative-studio`) — 5 tabs + Top-Right Action Header
- [ ] **Tab 1: Tối ưu ảnh/video đầu vào** — placeholder/OptimizeWorkspace
- [ ] **Tab 2: Contents** — placeholder/produceCreative/produceAuthentic
- [ ] **Tab 3: Audio** — placeholder/Audio Studio UI
- [ ] **Tab 4: Biến thể ảnh** — placeholder/VariantWorkspace
- [ ] **Tab 5: Video** — placeholder/Video Studio UI
- [ ] **Context provider** — CreativeStudioContext đọc từ URL, truyền qua các tab
- [ ] **Tab navigation** — mỗi tab phải duyệt xong mới sang tab tiếp theo
- [ ] **Mode state** — CREATIVE/AUTHENTIC nhất quán xuyên các tab

### Backend

- [ ] **Creative Studio API** — endpoint tổng hợp context (đọc từ brief)
- [ ] **Auth check** — requireCapability("I1") cho tất cả endpoints

### Test

- [ ] **Unit test** — Shell layout (5 tabs, navigation)
- [ ] **Unit test** — Context provider (read from URL, propagate to tabs)

---

## 3. Tab 1: Tối ưu ảnh/video đầu vào

### UI

- [ ] **OptimizeWorkspace** kết nối CreativeStudioContext
- [ ] **Optimize vs Keep Original** radio/buttons
- [ ] **Ratio selection** (1:1, 4:5, 9:16, 16:9) checkboxes
- [ ] **Preview** ảnh gốc + ảnh tối ưu
- [ ] **Approval gate** — duyệt trước khi sang Tab 2

### Backend

- [ ] **POST /api/v1/media/optimizations** — gọi executeCloudCreative
- [ ] **Identity Integrity** — đo tỷ lệ điểm ảnh lõi (nợ #110 đã fix)

### Test

- [ ] **Unit test** — Optimize vs Keep Original routing
- [ ] **Unit test** — Ratio selection logic

---

## 4. Tab 2: Contents

### UI

- [ ] **Mode selection** — CREATIVE (mặc định) / AUTHENTIC toggle
- [ ] **Content types** checkbox — Caption, Hashtags, Script, Post, Story
- [ ] **CREATIVE mode:** Prompt builder (topic angle, hook, CTA → content)
- [ ] **AUTHENTIC mode:** Upload original content OR use existing
- [ ] **Content preview** — hiển thị content đã tạo
- [ ] **Approval gate** — duyệt trước khi sang Tab 3 hoặc 4

### Backend

- [ ] **POST /api/v1/creative-production/produce** — produceCreative (CREATIVE) / produceAuthentic (AUTHENTIC)
- [ ] **AUTHENTIC content override** — nếu user upload content gốc → dùng nội dung đó, KHÔNG narrative arc

### Test

- [ ] **Unit test** — Mode toggle (CREATIVE/AUTHENTIC)
- [ ] **Unit test** — Content type selection
- [ ] **Unit test** — AUTHENTIC content override (use uploaded content, not narrative arc)
- [ ] **Unit test** — produceCreative + produceAuthentic routing

---

## 5. Tab 3: Audio

### UI

- [ ] **Voice selection** — dropdown từ Audio Studio catalog
- [ ] **Provider selection** (mặc định auto-routing)
- [ ] **Quality tier** (standard, hd, premium)
- [ ] **Music mood** selection
- [ ] **Duration input** (auto-sync video duration, user override optional)
- [ ] **Preview** audio player
- [ ] **Approval gate**

### Backend

- [ ] **POST /api/v1/audio/jobs** — createAudioJob (đã tạo route)
- [ ] **Duration sync** — voice + BGM = video duration (auto-pad)

### Test

- [ ] **Unit test** — Voice/music/quality selection
- [ ] **Unit test** — Duration sync (video duration → audio duration)
- [ ] **Unit test** — Audio job creation

---

## 6. Tab 4: Biến thể ảnh (Khu vực D — M04b)

### UI

- [x] **Production method selection** — **LOCAL** hoặc **PROVIDER** (RẤT QUAN TRỌNG)
- [x] **Local mode UI:** Khung phân cảnh Narrative Arc 4 chặng (Cảnh 1 Setup, Cảnh 2 Rising, Cảnh 3 Climax, Cảnh 4 CTA)
- [x] **Provider mode UI:** Stability AI Visual Storytelling directives (phòng tiệc sảnh đón, bàn gỗ tối giản, bóc tách alpha)
- [x] **Variant preview** — Hiển thị 4 phân cảnh riêng biệt kèm ảnh tiêu điểm Spotlight phóng to
- [x] **Subject Integrity** — Hiển thị điểm trùng khít lõi chủ thể 99.8% - 100% (An toàn tuyệt đối)
- [x] **Auto-load Marketing Assets** — Tự động quét CSDL nạp các biến thể ảnh đã sinh vào lưới phân cảnh
- [x] **Nút sinh từng cảnh độc lập** — Hỗ trợ sinh riêng Cảnh 2, 3, 4 kèm loading state riêng biệt (`generatingSceneIndex`)
- [x] **Approval gate** — Chốt duyệt biến thể marketing

### Backend

- [x] **POST /api/v1/media/variants** — Hỗ trợ cả 2 nhánh Cloud Creative (`executeCloudCreative`) và Local Studio Worker (`requestVariants`)
- [x] **Local Studio Backdrop Engine** — `StudioBackdropEngine` (Pillow/OpenCV) + `generate_scene.py` CLI sinh ảnh bối cảnh (~0.46s / ảnh $2048 \times 2048$)
- [x] **Auto-Fallback trong Router** — `MultiImageProviderRouter` tự động rơi về `StudioLocalImageProvider` khi Cloud Provider lỗi credit (402, 403, 429)
- [x] **Cache mặt nạ RGBA** — `<master>.rgba.png` tăng tốc compositing quang học 2 tầng bóng đổ + Light Wrap
- [x] **Variant Rules** — `variant-rules.ts` (integrity thresholds, approval logic)
- [x] **Subject Integrity** — Ngưỡng 0.999 (SAFE) / 0.99 (WARNING) / < 0.99 (REJECTED)

### Test

- [x] **Unit test** — Production method routing (local vs provider)
- [x] **Unit test** — MultiImageProviderRouter fallback đến `studio_local` khi cloud thiếu key/bytes
- [x] **Unit test** — Variant creation (both modes)
- [x] **Unit test** — Integrity score thresholds
- [x] **Full Suite Validation** — `npm test` 747/747 xanh, `test:tenant` 206/206 xanh, `tsc --noEmit` sạch 100%

---

## 7. Tab 5: Video

### UI

- [ ] **Format selection** — 6 khuôn M04c (REEL_15S, TIKTOK_30S, STORY_15S, SLIDESHOW, PRODUCT_PAGE, AD_MOTION)
- [ ] **Ratio selection**
- [ ] **Production method** — LOCAL hoặc PROVIDER (quan trọng)
- [ ] **Provider selection** (Veo, HeyGen)
- [ ] **Subtitle style** (Modern Badge, Minimal, Highlight Box, Bottom Banner)
- [ ] **Camera Motion** (Ken Burns: zoom_in/out, pan_left/right/up, static)
- [ ] **Storyboard editor** — 2-15 scenes, auto-balance duration
- [ ] **Voice selection** (từ Tab 3 hoặc mới chọn)
- [ ] **Approval gate**

### Backend

- [ ] **POST /api/v1/video/jobs** — CreateVideoJobUseCase (M04c)
- [ ] **Video render dispatch** — `POST /api/v1/video/jobs/[id]/render`
- [ ] **Storyboard update** — `POST /api/v1/video/jobs/[id]/storyboard`

### Test

- [ ] **Unit test** — Format selection (6 khuôn)
- [ ] **Unit test** — Production method routing (local vs provider)
- [ ] **Unit test** — Storyboard scene balance (total duration = video duration)
- [ ] **Unit test** — Camera Motion selection

---

## 8. Chặng 7 — PACKAGE

### UI

- [ ] **Campaign Package Dashboard** — tổng hợp tất cả assets
- [ ] **Credit display** — tổng credit đã dùng
- [ ] **Package name input**
- [ ] **Approval gate** — "Đóng gói chiến dịch" cần duyệt

### Backend

- [ ] **POST /api/v1/creative-production/package** — packageCampaign (đã tạo route)
- [ ] **CampaignPackage creation** — tổng hợp all assets

### Test

- [ ] **Unit test** — Package creation from all tabs
- [ ] **Unit test** — Credit calculation

---

## 9. Chặng 8-9 — QA + APPROVE

### UI

- [ ] **QA Report** — Brand, Product, Content, Platform checks
- [ ] **AI Improve** — gửi issues cho AI sửa
- [ ] **Approval screen** — APPROVE & PUBLISH / EDIT / ASK AI

### Backend

- [ ] QA check logic (đã có hoặc cần tạo mới)
- [ ] Approval recording (audit_logs)

### Test

- [ ] **Unit test** — QA checks (Brand, Product, Content, Platform)
- [ ] **Unit test** — Approval gate (manual required)

---

## 10. Chặng 10-14 — LAUNCH → NEXT BEST

### UI

- [ ] **Launch screen** — Channel selection + Schedule
- [ ] **Sell integration** — AI Chat Assistant
- [ ] **Measure dashboard** — Analytics
- [ ] **Learn screen** — Winning Patterns
- [ ] **Next Best Action** — AI recommendations

### Backend

- [ ] Launch logic (publish to channels)
- [ ] Sell integration (Chat Assistant)
- [ ] Analytics (CRM/Orders)

### Test

- [ ] **Unit test** — Channel selection
- [ ] **Unit test** — Schedule logic

---

## 11. Tính năng cross-cutting

### Production Method Choice (quan trọng)

- [ ] Local/Provider toggle nhất quán ở Tab 4 và Tab 5
- [ ] Provider dropdown (photoroom, fal, imagen, gemini, veo, heygen)
- [ ] Credit deduction khi chọn Provider
- [ ] Audit log ghi lại production method choice

### Authentic Mode

- [ ] Content override — dùng uploaded content, KHÔNG narrative arc
- [ ] Video: KHÔNG tạo video mới trong AUTHENTIC mode (chỉ crop ảnh gốc)
- [ ] Audio: TTS factual voice + BGM nhẹ

### Video Duration

- [ ] FFprobe auto-detect
- [ ] Audio sync (voice + BGM = video duration)
- [ ] Video storyboard auto-balance (total = video duration)
- [ ] User can override target duration

### Data Consistency

- [ ] CreativeStudioContext SSOT — tất cả tabs đọc từ 1 context
- [ ] Topic sync — selectedTopics[0] đồng bộ với Chặng 04
- [ ] No manual re-input — KHÔNG nhập lại data đã có

### Manual Approval

- [ ] Mỗi bước/tab yêu cầu user duyệt trước khi tiếp tục
- [ ] Không tự động chuyển bước
- [ ] User có thể quay lại bước trước đó

---

## 12. Documentation

- [ ] **I/O Spec** — docs/dac-ta/FLORAOS_CREATIVE_STUDIO_IO_SPEC.md
- [ ] **User Journey** — docs/dac-ta/FLORAOS_CREATIVE_STUDIO_JOURNEY.md
- [ ] **Architecture doc** — cập nhật FLORAOS_TEMPLATE_SYSTEM_SSOT.md nếu có template mới
- [ ] **Checklist này** — docs/dac-ta/FLORAOS_CREATIVE_STUDIO_CHECKLIST.md

---

## 13. Trạng thái hiện tại (2026-09-21)

### Đã xong

- [x] Chương 6 Creative Production (6 domain + 5 use-case + 3 routes)
- [x] Chương 7 Audio Studio (5 domain + 1 use-case + 1 adapter + route)
- [x] Audio worker pytest (18/18)
- [x] Nợ #110 fix (execute-cloud-creative.ts)
- [x] I/O Spec document
- [x] User Journey document
- [x] Checklist này

### Chưa làm (Đợt 1)

- [ ] Chặng chuyển tiếp (Transition Stage)
- [ ] Modal Chọn định hướng trên `/thi-truong`
- [ ] Creative Studio shell (5 tabs)
- [ ] Tab 2 (Contents) UI
- [ ] Tab 3 (Audio) UI
- [ ] Video duration detect (FFprobe)
- [ ] Mode switch (CREATIVE/AUTHENTIC)
- [ ] Tab 4 (Biến thể ảnh) UI kết nối
- [ ] Tab 5 (Video) UI kết nối
- [ ] Production Method Choice UI (local/provider)
- [ ] AUTHENTIC content override logic

### Chưa làm (Đợt 2+)

- [ ] Package Dashboard
- [ ] QA screen
- [ ] Approval screen
- [ ] Launch screen
- [ ] Sell integration
- [ ] Measure dashboard
- [ ] Learn + Next Best Action
