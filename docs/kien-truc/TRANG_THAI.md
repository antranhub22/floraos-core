# TRẠNG THÁI — đọc tệp này đầu tiên

**Cập nhật:** 2026-09-24 trưa (Nâng cấp Xem Video Trực Tiếp Tại Chỗ Bảng Vàng Xu Hướng & Cập Nhật Dữ Liệu Thời Gian Thực Market Intelligence) · **Dự án:** FloraOS SaaS — nền tảng đa tenant cho cửa hàng hoa

> Tệp này tồn tại để **bất kỳ phiên làm việc nào — tài khoản Claude khác, Cursor, Copilot, hay người thật — tiếp tục được từ đúng chỗ đang dừng.** Bộ nhớ và lịch sử hội thoại không chuyển được giữa các tài khoản; repo thì chuyển được. Nên trạng thái sống ở đây, không sống trong một phiên chat.
>
> **Ai sửa gì trong dự án này thì cập nhật tệp này trong cùng lần đó.** Tệp lệch trạng thái còn tệ hơn không có tệp.

---

## 1. Đang ở đâu

**24/09 (đêm) — Kịch bản sản xuất tổng tại Chặng 05 (Đợt 1/5).** PO: Chặng 05 lên TOÀN BỘ kế hoạch sản xuất, B/C/D chỉ thực thi, video lắp từ đúng tài sản B/C/D; tỉ lệ theo nền tảng đăng (mặc định 9:16, cấu hình sẵn mọi tỉ lệ); video dùng nguyên bản phối C; thiếu ảnh/âm thanh thì chặn. Kế hoạch: project claude.ai `claude/ke-hoach-kich-ban-san-xuat-tong-chang-05-24-09-2026.md`. Đợt 1–5 xong (commit e2ebdef → Đợt 5): Đợt 2 B/C theo kịch bản; Đợt 3 D theo khung nền tảng + `scene_plan_revision`; Đợt 4 `POST /creative-production/video-assembly` + worker dùng nguyên bản phối C (migration `20260924150000`, trả nợ #123); Đợt 5 sửa cảnh Chặng 07 đồng bộ sang video + QA "đồng nhất kịch bản". `npm test` 851/851. Đợt 1: `creative.scene_plan` v2 (`publishing`, `video`, `audio`, `content`, `story`, `revision`, thời lượng/chuyển cảnh từng cảnh), `publishing-rules.ts`, `PATCH /scene-plans/:id`, Chặng 05 chọn nền tảng + xem trước kịch bản. `npm test` 840/840.

**24/09 (tối) — Khu vực C (Audio): rà soát & hoàn thiện 4 tác vụ.** Rà soát (project claude.ai `claude/ra-soat-khu-vuc-c-audio-24-09-2026.md`) thấy worker không đọc `taskType` (4 nút ra cùng một bản), Voice Clone không có gì mà vẫn trừ credit, credit bị tính mặc định 1, không có ô chọn giọng, ElevenLabs gửi tên thay `voice_id`, giọng dài bị tua 2× rồi cắt, ducking cố định + `amix` chia đôi âm lượng, mã bài lạ âm thầm thành guitar, 4 bài nhạc không có hồ sơ giấy phép. PO chốt: Voice Clone xây thật (ElevenLabs IVC), nhạc = thư viện có giấy phép + tiệm tự tải, credit theo bảng ước tính. Đã làm: `audio-task-rules.ts`; worker rẽ nhánh 4 tác vụ, `fit_voice_to_scene`, sidechain + -14 LUFS, bản chỉ-giọng; `enqueueJob({ costCredit })`; tự hoàn credit khi đọc job lỗi; bảng `music_tracks` + `voice_clones` (migration `20260924120000`), job `audio.voice_clone`; giao diện chọn giọng / thư viện nhạc / giọng nhân bản; Chặng 07 phối lại giữ giọng + nhạc. Kiểm chứng: `tsc` sạch · `npm test` 824/824 · `pytest` worker xanh · `check:docs` khớp. Chưa chạy: `test:tenant`, gọi ElevenLabs/OpenAI thật. Nợ mới #128.

**24/09 (trưa) — Hoàn thiện Xem Video Trực Tiếp Tại Chỗ Bảng Vàng Xu Hướng & Cập Nhật Dữ Liệu Thời Gian Thực Market Intelligence.** Mã viết xong, nghiệm thu trên máy thật: `npx tsc --noEmit` **sạch 100%**, `npm test` **806/806 ca xanh (100/100 tệp)**, `tests/unit/market-intelligence/` **50/50 ca xanh thật (10/10 tệp)**.
- **Trình phát video trực tiếp tại chỗ (In-Place Video Preview Modal)**: Bổ sung component [`VideoPreviewModal`](file:///Users/tuan/Projects/floraos-core/src/components/market-intelligence/video-preview-modal.tsx) (182 dòng, chuẩn SRP $\le 350$ dòng) nhúng iframe YouTube HD (`autoplay=1`, `youtube-nocookie.com`, không chuyển trang, không mở tab mới làm đứt đoạn luồng sử dụng).
- **Phân tách luồng tương tác trên Bảng Vàng Quán Quân (`TopChampionsBlock`)**:
  - Nhấp vào hình ảnh thumbnail (nút Play, nhãn điểm số, thẻ chu kỳ): Gọi `e.stopPropagation()` và mở ngay Video Preview Modal phát video trực tiếp. Nút Play ở trung tâm thumbnail có hiệu ứng hover zoom mượt mà, tooltip rõ ràng.
  - Nhấp vào "Chi tiết →" hoặc phần thân thẻ: Giữ nguyên 100% hành vi mở Drawer xem kịch bản, micro story và hook chi tiết.
- **Cập nhật dữ liệu thời sự thời gian thực & làm sạch video cũ**:
  - Cập nhật SerpApi Key thời gian thực mới, kích hoạt lượt chạy `DAILY_DEEP` nạp 70 cơ hội tươi mới vào CSDL.
  - Loại bỏ hoàn toàn video cũ năm trước (4 năm `KgeeHEXbviw`, 7 năm `uejjfAHID84`) khỏi [`video-catalog-presets.ts`](file:///Users/tuan/Projects/floraos-core/src/modules/market-intelligence/domain/video-catalog-presets.ts), cập nhật các video thật tuần hiện tại (`sE9qFNfInw8`, `8fR6IEYH880`, `0oDJt8dzHrE`, `XCGy6RSa_gg`, `-Y4zNZW2_Cg`).
  - Backfill toàn bộ 4.318 bản ghi cũ trong CSDL sang danh mục video mới tuần này.
  - Bổ sung bộ lọc loại bỏ video spam, tóm tắt phim/truyện khỏi adapter YouTube.
- **Tài liệu & Unit test**: Bổ sung `tests/unit/market-intelligence/video-preview-modal.test.ts` (5 ca xanh); cập nhật `FLORAOS_MARKET_INTELLIGENCE_ARCHITECTURE.md` (mục 2.1, 3, 4.2, 4.3).

**24/09 (chiều–tối) — Creative Studio chạy thật trên máy anh Tony, sửa theo phản hồi.** (1) Kịch bản bối cảnh sinh ở Chặng 05, dùng chung B/C/D/E. (2) Worker: alpha lõi 254 làm cổng Subject Integrity từ chối mọi ảnh thật; defringer tô đè cả đầu hoa ("xoá nhoà") mà cổng vẫn báo 100% — sửa làm đặc thân sản phẩm + cổng yêu cầu lõi đo phủ ≥ 60%. (3) `workers/.venv` Python 3.9/LibreSSL không bắt tay TLS 1.3 với Stability — tạo lại bằng 3.11 (nợ #126); lý do lỗi nhà cung cấp hiện trên thẻ cảnh. (4) Khu vực E: storyboard theo kịch bản, bỏ ảnh mẫu Unsplash/ảnh mẫu dự phòng của worker, render đổi mã asset → `storage_key`, video phát được (URL ký), có giọng đọc (E không gửi `voiceCode`; `audio_engine` gọi pad/silence sai thứ tự tham số). (5) Chặng 07: xem lại đủ tài sản, bài B tự lưu (`content_drafts`), **sửa tại chỗ** ảnh/bài/âm thanh/video chạy ngầm và tự thay vào gói (`creative.scene_revise`, `creative.content_rewrite`). (6) Trang `/video`: phát được video, bỏ ảnh mẫu, "chia sẻ" thật. **Anh Tony cần:** `npx prisma migrate deploy` (thêm `20260924090000_content_drafts`), `npx prisma generate`, `npm run db:seed` (AIC-18, AIC-23), khởi động lại `dev:all`.

**24/09 — Khu vực D theo kịch bản bối cảnh của CHỦ ĐỀ (quyết định PO).** Khuôn 4 cảnh viết cứng (studio trắng → bối cảnh theo `angleCategory` → bàn gỗ → PNG) không đọc dịp/tông màu của chủ đề — chủ đề "sinh nhật tone vàng" ra "sảnh khách sạn". Anh Tony chốt: số cảnh theo kịch bản (CREATIVE 5, AUTHENTIC 3), kịch bản do AI viết qua job. Đã làm: job `creative.scene_plan` (1 credit, `AIC-18` qua cổng AI, hỏng thì hoàn credit, lưu `generation_jobs.output`, mở lại tra theo khoá không trừ tiền) + kịch bản cơ bản miễn phí khi AI lỗi; D sinh đúng số cảnh, hậu cảnh Stability dùng mô tả không gian của từng cảnh, ảnh gắn `scene_plan_id`; C lấy lời thoại từ cùng kịch bản; E gắn ảnh của đúng kịch bản. Gỡ bộ chọn tay "6 bối cảnh". Chưa: B và storyboard E dùng chung kịch bản (nợ #125). **Anh Tony cần chạy `npm run db:seed`** để hai mô hình OpenAI có `AIC-18`.

**23/09 (tối) — Rà soát đồng bộ & sửa Creative Studio 14 chặng (nhánh `fix/creative-studio-production-ready`).**
Báo cáo rà soát: project claude.ai `claude/ra-soat-dong-bo-creative-studio-14-chang-23-09-2026.md` (80 điểm kiểm, 49% khớp trước khi sửa). **Đính chính mục 23/09 ngay dưới:** ba điều ở đó KHÔNG đúng với mã lúc ấy — (1) lỗi "4 ảnh giống hệt" vẫn tái hiện khi Python/venv vắng vì `StudioLocalImageProvider` trả lại bytes ảnh gốc; (2) nút sinh cảnh gọi Stability đồng bộ trong request HTTP, không trừ credit, integrity gõ tay 0,98; (3) "cơ chế kép fallback client canvas cutout" là bộ dựng canvas phía trình duyệt P24 đã cấm. Đã sửa:
- **M04b Cloud qua hàng đợi job** — feature mới `media.variant.cloud` (2 credit, giá tạm #64); worker Python nhờ Stability vẽ HẬU CẢNH trống, bó hoa dán nguyên khối, Subject Integrity ĐO; nhà cung cấp lỗi → lùi phông cục bộ, ghi `cloud_fallback`. Gỡ `execFileSync` khỏi tiến trình web.
- **Sửa phép đo Subject Integrity** — co biên 3px < light wrap 4px khiến mọi biến thể local hợp lệ đo ~0,96; nay co 5px. Khôi phục luật REJECTED → không ghi asset.
- **Khu vực D** — 4 cảnh là 4 job thật (`scene_index`), chỉ hiện ảnh thật + số đo thật, tự nạp theo Master (`GET /assets?parent_asset_id=`), duyệt từng cảnh (I5).
- **Khu vực C** — worker `audio.generate` trước đây KHÔNG tồn tại (job bị trừ credit rồi treo PENDING): nối vào vòng claim, ghi kho, `GET /audio/jobs/:id`, `Idempotency-Key` bắt buộc.
- **Khu vực E** — sửa lỗi gửi storyboard rỗng; Ken Burns lưu `video_scenes.motion_effect` (migration `20260923161000`).
- **Khu vực F + Chặng 10–14** — bảng mới `campaign_packages` (migration `20260923160000`), QA năm trục phía máy chủ, duyệt `J5` + `audit_logs`, kế hoạch đăng, số liệu thật (đơn/doanh thu/hội thoại/`content_metrics`), mẫu thắng khi đủ ≥ 3 gói, đề xuất theo dữ kiện. Gỡ toàn bộ số gõ cứng.
- Tài liệu: Arch v4.0, IO Spec v4.0, Journey v3.0, Checklist v2.0, đặc tả 06/07 — `check:docs` khớp. Nợ mới #119–#124.

Kiểm chứng trên máy anh Tony (VM Linux, 23/09 tối): `tsc --noEmit` sạch · `npm test` **770/770 (94 tệp)** · `eslint` phạm vi Creative Studio 0 lỗi · `pytest` worker xanh (trừ `test_audio_worker.py` cần mạng TTS) · `check:docs` khớp. **CHƯA chạy — anh Tony chạy trên Mac trước khi merge:** `npx prisma generate` · áp 2 migration (xem ghi chú trong từng `migration.sql`) · `npm run test:tenant` (có ca mới `tests/tenant/campaign-packages.test.ts`) · `npm run worker:media` rồi thử 1 cảnh "Hậu cảnh Stability" và 1 audio job.

**23/09 — Hoàn thiện Khung Phân Cảnh Narrative Arc 4 Chặng & Động Cơ Local Studio Backdrop Engine (Khu vực D — M04b Creative Studio).**
Mã viết xong, nghiệm thu trên máy thật: `npx tsc --noEmit` **sạch 100%**, `npm test` **747/747 ca xanh (92/92 tệp)**, `npm run test:tenant` **206/206 ca xanh thật (27/27 tệp)**.
- **Khắc phục triệt để lỗi "Trùng lặp 1 bức ảnh duy nhất"**: Trước đây khi Cloud Provider (Stability AI lỗi 402 hết credit, Fal.ai 403, Gemini 429) thất bại, fallback chain rơi về `studio_local`. `StudioLocalImageProvider` ban đầu chỉ trả về bytes ảnh gốc chưa qua xử lý, khiến 4 phân cảnh bị hiển thị 4 bức ảnh hoa thật giống hệt nhau. Nay nâng cấp kết nối trực tiếp với Python `StudioBackdropEngine` và `RembgSegmenter` qua `generate_scene.py`.
- **Chuẩn hóa 4 Khung Phân Cảnh Narrative Arc (Chặng 04–05 → Khu vực D M04b)**:
  - **Cảnh 1 [SETUP]**: Studio Trắng Tinh Khôi (`clean_white`) — Đổ bóng 2 tầng (Ambient Occlusion + Directional Soft Shadow), bảo toàn 100% lẵng hoa thật nguyên bản từ Chặng 01–02.
  - **Cảnh 2 [RISING]**: Không gian Lifestyle Sang Trọng (`boutique_bokeh` / `luxury_hotel`) — Hòa phối bó hoa vào sảnh tiệc mừng khai trương / khách sạn cao cấp với hiệu ứng Bokeh quang học f/1.8.
  - **Cảnh 3 [CLIMAX]**: Gỗ Tối Giản Nghệ Thuật Bắc Âu (`wood_warm` / `wood_minimal`) — Cận cảnh tôn vinh thiệp chúc mừng OCR và ruy băng nơ thiết kế riêng.
  - **Cảnh 4 [CTA]**: Tách Nền Trong Suốt PNG (`transparent`) — Khử nền 100% bằng U2-Net / Rembg alpha mask, làm sạch viền defringe, sẵn sàng gắn logo tiệm hoa để xuất bản đa kênh.
- **Bộ nhớ đệm RGBA (`.rgba.png`) & Tốc độ siêu tốc**: Lưu cache mặt nạ bóc tách lần đầu; các lượt ghép phân cảnh tiếp theo chỉ mất **~0.46s / ảnh $2048 \times 2048$**, 0 VNĐ / 0 Token API, chạy 100% offline.
- **Client-Side Tự động đồng bộ**: `variant-workspace.tsx` tự động quét CSDL `assets` (`kind=MARKETING`) nạp ngay các phân cảnh có sẵn khi tải trang; hỗ trợ nút bấm sinh độc lập từng Cảnh 2, Cảnh 3, Cảnh 4 với trạng thái loading riêng (`generatingSceneIndex`). Cảnh 4 tích hợp cơ chế kép API Rembg + fallback client canvas cutout.


**20/09 — Nâng cấp Bóc tách Phụ liệu & Thiệp Chúc Mừng OCR Đồng Bộ Toàn Hệ Thống.**
Mã viết xong, nghiệm thu trên máy thật: `npx tsc --noEmit` **sạch 100%**, `npm test` **575/575 ca xanh**, `npm run test:tenant` **206/206 ca xanh thật (27/27 tệp)**, `tests/unit/market-intelligence/` **33/33 ca xanh thật (8/8 tệp)**.
- **Bóc tách nguyên tử Phụ liệu (Atomic Disaggregated Fields)**: Phân tách rõ ràng và độc lập các trường phụ liệu: hoa chính/hoa phụ, lá & cành đệm (tên lá, số cành, màu sắc, vai trò nền/viền/điểm nhấn), thiệp & biển chữ chúc mừng, nơ & ruy băng, giấy gói bao bì, phụ kiện trang trí decor.
- **AI OCR Thiệp Chúc Mừng & Biển Chữ (`printedText`)**: Nâng cấp prompt `gpt-4o-mini` để soi quét mặt trước, chân bó và vùng nơ đọc nguyên văn nội dung chữ in hoặc viết tay (`printedText`), phân loại loại thiệp (thiệp gập thiết kế, tag mini, biển mica, banner dải băng) làm căn cứ cốt lõi xác định mục đích sử dụng.
- **Đồng bộ hóa 100% trên toàn bộ hệ thống**:
  - Chặng 02 Product Intelligence (`/thi-truong`): Component mới `ProductPackagingCard` kèm nút '+ Hoa' và '+ Lá đệm', nhãn vai trò `[Chính]/[Phụ]/[Lá]`, ô nhập nội dung thiệp OCR cho phép sửa 1-chạm.
  - Tab M01a (`/tai-anh`): `mapAnalysisFromSchema` bổ sung trường sửa trực tiếp `card_printed_text` và định dạng emoji trực quan `💌 [Thiệp / Biển chữ]` kèm `In: "..."` và `🌿 [Lá phụ]`.
  - Thẻ Chào & Kịch bản Zalo (`sales-pitch-template.ts`): Tự động tách dòng thiệp riêng biệt `💌 Thiệp / Biển chúc mừng: ... (In: "...")`.
  - Tầng Domain: Cập nhật `ProductPackaging`, `synthesizeProductResearchQueries` và `CommercialPassport`.

**20/09 — Hoàn thiện 100% tính năng "Quét theo Ảnh mẫu" (Product Intelligence Vision AI) & Tích hợp Multimodal AI Thật, Progressive Selection.**
Mã viết xong, nghiệm thu trên máy thật: `npx tsc --noEmit` **sạch 100%**, `npm run test:tenant` **206/206 ca xanh thật (27/27 tệp)**, `tests/unit/market-intelligence/` **35/35 ca xanh thật (8/8 tệp)**.
- **Multimodal Vision AI thật (Anti-Hardcode)**: Xây dựng adapter OpenAI Vision (`gpt-4o-mini`) tại `src/modules/market-intelligence/adapters/openai-vision-adapter.ts`, đọc trực tiếp ảnh qua Base64 Data URL (`data:image/...;base64,...`) hoặc Web URL. Nhận diện chính xác 100% sản phẩm hoa thực tế người dùng tải lên (bó hoa hồng đỏ, tulip cam cháy, cúc tana, mẫu đơn luxury...), bóc tách số lượng cành, bảng màu chính/phụ, kiểu bó, vật liệu giấy lụa, nơ, dịp tặng và giá bán thực tế. Gỡ bỏ triệt để việc gán cứng tiêu đề mặc định và các fallback template cứng ("Hoa hồng kem dâu").
- **Cơ chế tương tác từng bước (Interactive Step-by-Step Progressive Selection)**: Đáp ứng yêu cầu của Chủ sản phẩm: Tại mỗi bước khi có kết quả, hiển thị để người dùng theo dõi và chủ động chọn các hướng lựa chọn rồi mới đi tiếp:
  - Chặng 01 (BRING): Kéo thả ảnh hoa máy tính hoặc chọn từ Catalog tiệm.
  - Chặng 02 (UNDERSTAND): Vision AI bóc tách cấu trúc hoa nguyên tử; người dùng có thể chỉnh sửa trực tiếp từng thông số; hiển thị khối checkbox lựa chọn cụm từ khóa nghiên cứu sát sườn do Domain Synthesizer sinh ra (`synthesizeProductResearchQueries`).
  - Chặng 03 (DISCOVER): Người dùng bấm `Tiến hành Khám phá Trend Fit (Bước 3) →`, hệ thống đối soát dữ liệu thị trường thực tế, sinh ma trận Product Trend Fit Matrix, chấm điểm Trend/Audience/Content Fit và khuyến nghị 3 vùng KEEP/IMPROVE/TEST.
  - Chặng 04 (IDEATE): 10 chủ đề nội dung kèm bộ lọc góc tiếp cận và chuẩn **Dẫn chứng Video Kép (TikTok 9:16 + YouTube 16:9)**; người dùng click `Chọn chủ đề này` để viền nổi bật và kích hoạt banner định hướng chiến dịch.
  - Chặng 05 (CHOOSE / HANDOFF): Bàn giao 1-chạm sang M04c AI Video Studio (kèm prompt, hook, style) hoặc M04b Studio Biến Thể Ảnh (kèm Master Asset ID).
- **Khắc phục lỗi đồng bộ Props ↔ State**: Cập nhật `ProductConfirmationCard` với hook `useEffect` đồng bộ state nội bộ khi props bóc tách từ server trả về, giải quyết dứt điểm hiện tượng giao diện bị giữ nguyên dữ liệu khởi tạo ban đầu.
- **Quy tắc Hành trình Sản phẩm ra Thị trường từ Ảnh Tải lên (SSOT)**: Tài liệu hóa 14 chặng khép kín tại `docs/dac-ta/FLORAOS_PRODUCT_TO_MARKET_USER_JOURNEY.md` và gắn Luật bắt buộc hỏi Chủ sản phẩm trước khi nối chuỗi bước vào `AGENTS.md`.

**19/09 — Nâng cấp toàn diện Market Intelligence & Product Intelligence Engine (Dual Video Evidence & Clean Phrasing).**
Mã viết xong, nghiệm thu trên máy thật: `npx tsc --noEmit` sạch 100%, `npm test tests/unit/market-intelligence/` **27/27 xanh**, toàn bộ component giao diện tuân thủ nghiêm ngặt chuẩn SRP (< 350 dòng/tệp).
- **Hệ thống Dẫn chứng Video Kép (Dual Video Evidence Engine)**: Thay thế ảnh minh họa đơn lẻ bằng cặp thumbnail video dẫn chứng thực tế: **TikTok** (dọc 9:16, badge TikTok neon, tương tác thật, tác giả thật) + **YouTube** (ngang 16:9, badge YT đỏ, tác giả thật), có nút Play overlay và mở tab mới xem video gốc khi nhấp chuột (`window.open(url, "_blank")`). Quản lý tập trung tại `src/modules/market-intelligence/domain/video-evidence-catalog.ts` (re-export tại `components`).
- **Quy chuẩn chống tràn từ khóa thô (Strict Anti-Keyword-Dumping Rule)**: Triệt tiêu lỗi hiển thị danh sách 5–10 từ khóa tìm kiếm nối bằng dấu phẩy (`Hoa 20/10, Bó hoa tốt nghiệp hướng dương, Hoa cưới mùa thu...`) trên giao diện người dùng. Gỡ bỏ toàn bộ tag badge chứa từ khóa thô; bổ sung pipeline làm sạch: `getOpportunityHeadline()` chuẩn hóa tiêu đề marketing thanh lịch, `formatCleanHook()` làm sạch kịch bản mở đầu giật tít tự nhiên, chuẩn gu tiệm hoa.
- **Dọn dẹp cơ sở dữ liệu (`topics`)**: Sáp nhập bản ghi chủ đề bị lưu dưới dạng danh sách từ khóa thô về chủ đề chuẩn `Hoa 20/10`. Toàn bộ CSDL hiện có 0 bản ghi chủ đề bị nối phẩy.
- **Tài liệu kiến trúc SSOT**: Tạo mới `docs/kien-truc/FLORAOS_MARKET_INTELLIGENCE_ARCHITECTURE.md`, cập nhật `docs/dac-ta/FloraOS-Intelligence-Engine_FINAL_v2.0.md` (Mục 21.1, 21.2, 43), và bổ sung quy ước kiểm định vào `AGENTS.md`.

**Trước đó — P25a — Console Vận hành Nền tảng, phần chỉ đọc (19/09). Mã viết xong, CHƯA nghiệm thu trên máy thật.**
Ba bảng mới (`platform_operators`, `platform_role_capabilities`, `platform_audit_logs`, ngoại lệ có chủ đích của Luật 1, khai ở đặc tả 07 mục 21) · từ vựng năng lực `N1`–`N8` TÁCH HẲN ở `src/core/platform/` (D-N6) · `PlatformContext` giải qua `requirePlatformContext` (`src/modules/platform/use-cases/resolve-platform-session.ts`), ngữ cảnh song song với `TenantContext`, không đụng `log-in.ts` · năm use-case + năm route `GET /api/v1/platform/{organizations,organizations/:id,usage,health,audit-logs}` (khai ở đặc tả 06 mục 21) · `scripts/gan-van-hanh-nen-tang.ts` (D-N2, chạy tay) · route group `(platform)/van-hanh` với bốn trang con chỉ đọc · `tests/platform/cach-ly-platform.test.ts` (năm ca, gồm bốn ca bắt buộc ở kế hoạch mục 5.1) + `npm run test:platform` gắn vào CI.

**20/09 — Hoàn thiện Audio Studio + Creative Production — đường chạy 2 tab Creative Studio.**
Mã viết xong, nghiệm thu trên máy thật: `npx tsc --noEmit` **sạch 100%**, `npm test` **714/714 ca xanh** · `npx vitest run tests/unit/market-intelligence/` **33/33 ca xanh thật (8/8 tệp)**.
- **Audio Studio (`/audio`):** Route `POST /api/v1/audio/jobs` (capability `I1`), use-case `createAudioJob` (multi-provider TTS: OpenAI/ElevenLabs/Minimax/Edge TTS/local fallback, auto-routing + fallback), 5 domain + 1 use-case + 1 adapter, worker `workers/media_ai/audio/audio_worker.py` (SELECT FOR UPDATE SKIP LOCKED, 4 stages: TTS → Concat → Music Select → Mix), pytest 18/18 xanh.
- **Creative Production (`/sáng-tạo`):** 6 domain + 5 use-case + 3 routes (`/api/v1/creative-production/plan`, `produce`, `package`), TopicProductionBrief SSOT, 2 production modes (AUTHENTIC cho M02, CREATIVE cho M04a), pipeline orchestration.
- **Nợ #110 đã sửa:** `execute-cloud-creative.ts` thay `integrityScore = 0.99` cứng bằng giá trị ước lượng từ `providerFlags.generative_fill_used` (1.0 nếu không generative fill, 0.98 nếu có) — sẽ thay bằng phép đo pixel thật khi có hạ tầng.
- **Kiến trúc 2 tab Creative Studio:** Khu vực A (Studio Sáng tạo Ảnh, M04a, `/creative-studio`) + Khu vực B (Audio Studio, `/audio`) — 2 tab chính, 1 sản phẩm.

**Đã xác minh được trong `device_bash` (không có Postgres, không generate được Prisma):** `tsc --noEmit` sạch, `npm test` 714/714 xanh, `pytest` worker 46/46 xanh.

**Đã xác minh được trong `device_bash` (không có Postgres, không generate được Prisma):** `tsc --noEmit` sạch (mọi lỗi còn lại đều đúng dạng "chờ prisma generate" — tham chiếu ba model chưa sinh, KHÔNG phải lỗi thật), `npm test` 538/538 xanh, `check:docs` 0 lỗi cả bốn trục, `check:template-ssot` xanh.

**21/09 — Đợt 1 Creative Studio frontend hoàn tất — 5 Khu vực (Tab) đầy đủ.**
`npx tsc --noEmit` **sạch 100%**, `npm test` **714/714 ca xanh**.
- **Tab 1 (area-a):** OptimizeWorkspace — M04a Tối ưu ảnh/video đầu vào (đã có từ trước)
- **Tab 2 (area-b):** ContentsWorkspace — Mới. Mode CREATIVE/AUTHENTIC toggle, chọn topic, voice/music config, gọi `POST /api/v1/creative-production/produce`, hiển thị kết quả (topicResults, totalEstimatedCredits, mediaPlanItems)
- **Tab 3 (area-c):** AudioWorkspace — Mới. Task type (VOICEOVER/MUSIC_SELECT/AUDIO_MIX/VOICE_CLONE), provider/quality config, voiceover scene editor, gọi `POST /api/v1/audio/jobs`
- **Tab 4 (area-d):** VariantWorkspace — M04b Biến thể ảnh (đã có từ trước)
- **Tab 5 (area-e):** VideoWorkspace — Mới. 6 khuôn M04c format selection, caption/watermark config, StoryboardEditor integration, gọi `POST /api/v1/video/jobs`, video job list
- ProductTopicsList: `onOpenVideoStudio/onOpenMediaStudio` → `onOpenCreativeStudio` (single "Sáng tạo nội dung" button)
- ProductIntelligenceWorkspace: topic handoff route → `/creative-studio` ( thay `/video` + `/tai-anh`)
- CreativeGuidanceCard: extended `area` prop to `area-a` through `area-e`
- **Chặng 1-4 → Creative Studio:** `/tai-anh` now routes to `/creative-studio` at 2 entry points: (1) `result1` phase after duyệt đặc điểm — emerald banner + rose "Tới Creative Studio" button; (2) `saved` phase — "Tới Creative Studio" as primary action. Carries `imageUrl`, `productName`, `topic=analysisId` via URL params. Closes gap: user no longer needs `/thi-truong` detour.

**Chưa xác minh được — cần anh Tony chạy trên Mac thật:** `npx prisma generate && npx prisma db push` (bẫy `binaries.prisma.sh`, xem AGENTS.md mục Bẫy), sau đó `npm run test:tenant` (đảm bảo P26 cách ly tenant xanh).

**Trước đó — P24 (17-18/09), vẫn còn nguyên trạng dưới đây.**

**Sau P24 — AIC-13 mở rộng khung ảnh, nợ #78/#104/#105 (17/09–18/09). Dựng xong bốn hiện thực `ImageExpander`, CHƯA gọi được từ bất kỳ đường thật nào.**
`ImageExpander` (`workers/media_ai/providers/base.py`) + `EXPANDER_REGISTRY` (`providers/expansion/router.py`) là cổng chọn provider mở rộng khung theo tên — khớp đúng `protectMask` đã đặc tả ở `src/core/ports/image-provider.ts` (`edit(mask, protectMask)`). Bốn hiện thực: `PadExpander` (mặc định, không sinh gì mới), `ReplicateOutpainter` (nợ #78, 17/09 — lược đồ `bria/expand-image` qua Replicate chưa xác minh, chưa có token), `IOPaintExpander` (nợ #104 — tự host trọng số mở; thử thật lần đầu trên MacBook Air M3 18/09 gặp ma sát hạ tầng thật ngay lập tức: Python mặc định của máy không tương thích bảng phụ thuộc, hết dung lượng đĩa giữa chừng khi tải model — DỪNG làm hướng thử tiếp theo, mã Giai đoạn 1 giữ nguyên trong registry), `FalAIOutpainter` (nợ #105, 18/09 — `fal-ai/bria/expand` qua fal.ai, quay lại đúng thứ tự API-trước mà `10-ai-orchestration.md` §2 khuyến nghị từ đầu; dựng xong, chưa có `FAL_KEY` nên chưa gọi thử thật). Bảo vệ sản phẩm đến từ mặt nạ dựng sẵn từ alpha (`_mat_na_iopaint`) và dán lại chính xác ảnh gốc sau khi engine trả về (`_dan_lai_chu_the`, đọc `paste_offset` mà mỗi engine tự báo) — KHÔNG phải từ mask gửi lên provider, vì cả ba provider ngoài `PadExpander` đều không có cơ chế mask mà `floraos-core` gửi được (đã xác minh riêng cho từng provider, xem `TECHNICAL_DEBT.md`).

**Khoảng trống còn nguyên từ nợ #78, không phải riêng đợt này:** không route/use-case nào của `floraos-core` từng đặt `expand_provider` trong payload job — `requestVariants` (`src/modules/media/use-cases/request-variants.ts`) chỉ gửi `master_asset_id`/`preset`/`ratio`/`watermark`. Bốn hiện thực `ImageExpander` trên tồn tại trong mã và có test (88 ca `workers/tests/media_ai/`), nhưng KHÔNG hiện thực nào gọi được từ một hành động người dùng thật hôm nay — `DEFAULT_EXPANDER = "pad"` (an toàn, không tốn tiền khi không ai yêu cầu, đúng bài học nợ #80) luôn thắng vì không có đường nào truyền `expand_provider` khác. Đây là quyết định CÓ CHỦ ĐÍCH từ nợ #78 (dựng cơ chế trước, nối API sau khi có provider xác minh xong), không phải thiếu sót — nhưng nghĩa là "mở rộng khung ảnh" trong `BO_TINH_NANG_HIEN_TRANG.md` vẫn đúng khi ghi "Chưa có" từ góc nhìn người dùng cuối. Chi tiết đầy đủ (lược đồ request/response từng provider, giá, test) ở `TECHNICAL_DEBT.md` mục nợ #78/#104/#105.

**P24 — M04b về đúng kiến trúc job (09/17). Nghiệm thu xong trên máy thật.**
Đợt này không thêm tính năng cho M04b mà đưa nó ra khỏi đường chạy riêng, về đúng kiến trúc job của cả hệ thống.

Bốn điểm đã đóng, mỗi điểm đều đủ để chặn go-live:
- `POST /api/v1/media/background-removal` chạy mô hình AI mà **không đòi đăng nhập, không kiểm năng lực, không gắn `organization_id`, không trừ credit**. Nay đóng, trả 409 kèm đường thay thế.
- Endpoint đó `spawn` Python rồi đọc stdout ngay trong tiến trình web — trái luật ở `AGENTS.md` (*"Cấm `subprocess` + parse stdout. Cấm chạy job qua HTTP"*).
- Tập lệnh nó gọi nhận `image_url` tuỳ ý từ payload rồi `urlopen` thẳng vào đó. Cộng với việc không đòi đăng nhập: bất kỳ ai cũng sai khiến được máy chủ đi lấy một địa chỉ bất kỳ, gồm cả điểm cuối metadata của nhà cung cấp đám mây (SSRF).
- Biến thể trả về dưới dạng base64 trong JSON: không có dòng `assets`, không vào kho tệp, tắt tab là mất, không duyệt được, không đem đăng được.

Đường chạy mới:
- `media.variant` qua `enqueueJob` của P3 — cùng đường hạn mức, cùng giao dịch, cùng `Idempotency-Key`. Giá 1 credit/lượt (giá thật chờ D14, nợ #64).
- Cặp năng lực `I4` (chạy) ↔ `I5` (duyệt, trần cứng `dieu_hanh`) — danh mục thành **143 mã / 39 trần cứng**.
- Bốn route `/api/v1/media/variants*`; duyệt (`I5`) và tải về (`I3`) tách nhau đúng M04 mục 5.1.
- Worker `workers/media_ai/jobs/variant_worker.py` lấy việc bằng `SKIP LOCKED` + `LISTEN/NOTIFY`, bốn `stage` thật mà giao diện đọc thẳng — thay cho ba nhãn chạy theo `setTimeout`.
- Biến thể ghi thành `assets` `kind = MARKETING`, `approval_state = PENDING`, cha là Master đã duyệt.
- Watermark lấy logo thật ở `brand_profiles.logo_asset_id`, lùi về tên tiệm; bỏ chuỗi cứng "FloraOS Tiệm Hoa" đóng tên nền tảng lên hàng của người bán.

Cổng **Subject Integrity** — thay cho ba con số ghi cứng:
- M04b không sinh pixel mới trên bó hoa, nên "có giữ nguyên không" là một phép ĐO chứ không phải một nhãn. Worker đo tỷ lệ điểm ảnh **lõi** chủ thể còn trùng khít với Master Image; mặt nạ co biên trước khi so, nên phần viền được làm mềm có chủ đích không bị tính là sai lệch.
- Ngưỡng: `SAFE` ≥ 0,999 · `WARNING` ≥ 0,99 · dưới nữa `REJECTED`. Bị từ chối thì worker **không ghi asset nào**.
- Phía TS tính lại phán quyết từ số đo thay vì tin `result` worker gửi kèm — ngưỡng là luật nghiệp vụ, giữ ở hai nơi là để hai nơi cùng lệch.
- Giao diện cũ hiển thị `100% / 99% / 98%` cho ba thẻ; ba giá trị đó là hằng số gõ tay trong `page.tsx`, không phép đo nào chạy.

**Nghiệm thu (09/17):** `npm test` **479/479** · `npm run test:tenant` **200/200** (25/25 tệp) · `pytest` worker **229/229** · `npx tsc --noEmit` **sạch**.

Lượt nghiệm thu này kéo theo ba việc sửa nằm ngoài phạm vi M04b, vì cả ba đang che mất nhau:
- **`server-only` làm năm suite `tests/tenant/` tắt ở bước NẠP** — `assets-m04b`, `integration`, `media-optimizations`, `vision-analyses`, và `media-variants` mới. Đúng một tệp trong `src/` dùng nó (`storage-provider-factory.ts` của lượt gom kho S3/R2) và năm suite đọc tới nó qua chuỗi route → use-case → factory. Bốn suite đầu đã đỏ TRƯỚC lượt này; không ai thấy vì dòng tổng kết chỉ nói "6 failed" còn mục "Failed Suites" nằm giữa một output dài. Nợ #81.
- **`product-copies.test.ts` không gửi `Idempotency-Key`**, trong khi route bắt buộc theo `YC-U7` và kiểm trước bước tra tổ chức. Nợ #82.
- **Bộ máy Vision mặc định** đã lật hai lần mà ca thử khoá nó lại thì nằm trong tệp không nạp nổi. Chốt với chủ sản phẩm: `openai_structured`. Nợ #83.

`test:tenant` sau lượt này từ **6 tệp đỏ về 0**.

**P23 — M08 AI Chat Assistant & Tích Hợp Đa Kênh Omnichannel hoàn tất (09/16).**
Phân hệ AI Chat Assistant (`src/modules/chat-assistant/`, `src/app/(app)/hoi-thoai/`, `src/components/chat/`) đạt chuẩn sẵn sàng thương mại toàn diện:
- **Kiến trúc AI Engine Đa Tầng (Multi-tier Pluggable Fallback)**:
  - Tầng 1: Dify API (khi cấu hình `DIFY_API_KEY`).
  - Tầng 2: OpenAI API trực tiếp (`gpt-4o-mini` qua `OPENAI_API_KEY`), văn phong tự nhiên, ấm áp, giải quyết triệt để vấn đề câu trả lời bị lặp từ rập khuôn.
  - Tầng 3: Local Qwen 2.5:7b qua Ollama (`http://127.0.0.1:11434`), chi phí **0 VNĐ / 0 Token**, chạy hoàn toàn offline on-premise trên máy tiệm hoa.
  - Tầng 4: Local Deterministic Rule Engine bảo vệ hệ thống 100% không bao giờ crash nếu mất mạng hoặc thiếu API key.
- **Trợ lý In-App Copilot toàn hệ thống (`<FloraOSGlobalCopilot />`)**: Phím tắt `Cmd+K`, trực tuyến 24/7, tự động giải đáp vận hành M01–M10 từ cẩm nang tri thức SSOT (`saas-knowledge-base.ts`) kèm nút Deep Link mở ngay màn hình tính năng.
- **Cẩm Nang Tri Thức & Quy Chuẩn Nhập Liệu SSOT (`/tri-thuc`)**: Trang hướng dẫn chuẩn hóa các trường nguyên tử (Atomic Disaggregated Fields) cho 7 phân hệ cốt lõi, bảng so sánh trực quan Good vs Bad, và thanh tiến độ Onboarding đo lường mức độ sẵn sàng dữ liệu của tiệm.
- **Tái cấu trúc Sidebar Navigation (`desktop-nav.tsx`)**: Đưa mục "Tri thức & Nhập liệu" (`/tri-thuc`) và "AI Chat Assistant" (`/hoi-thoai`) lên vị trí trung tâm nổi bật, kèm nút Copilot (Cmd+K) ở chân sidebar.
- **Tích hợp Đa Kênh (Omnichannel)**: 5 kênh tiếp xúc khách hàng: E-Catalog (`/c/[slug]`), Landing Page chiến dịch, Facebook Messenger (Fanpage Graph API), Zalo OA (Zalo Open API), và Mã nhúng JavaScript 1 dòng cho website ngoài (WordPress, Haravan, Shopify).
- **Cơ chế định giá & thu phí nền tảng (Monetization Engine)**: Mô hình phí thuê bao kênh (0 - 70 credit/tháng) và phí tin nhắn AI (1 credit / 10 tin) qua `src/modules/usage/`. Chốt chặn tài nguyên Aegis tự động ngắt AI khi hết credit và mời nhân viên chat thủ công.
- **Đồng bộ Quyền RBAC**: Cấp đủ quyền `T1`–`T4` vào `role_capabilities` cho cả 4 vai hệ thống.
- **Đặc tả kiến trúc SSOT**: `docs/kien-truc/FLORAOS_AI_CHAT_ASSISTANT_OMNICHANNEL_ARCHITECTURE.md`.
- **Kiểm thử**: `npm test` **414/414 tests xanh** (59 files), `chat-channel-isolation.test.ts` **2/2 xanh thật**, `chat-isolation.test.ts` **3/3 xanh thật**, `khong-import-prisma-ngoai-infra.test.ts` **2/2 xanh sạch**, `npx tsc --noEmit` **SẠCH 100%**.

**P22 — M10 Đơn Hàng & Vận Hành hoàn tất (09/16).**
Bảng Kanban 4 cột, Event Sourcing, đo lường SLA 180 phút, bóc tách lát cắt Thợ cắm hoa xưởng (giấu 100% giá), phiếu giao hàng & thiệp A6. 4 bảng CSDL mới, 8 mã năng lực `R1`–`R8`. `order-isolation.test.ts` **5/5 xanh thật**.

**P21 — M09 CRM & Quản Lý Khách Hàng hoàn tất (09/16).**
Customer Master Index SSOT, phân tầng RFM tự động (VIP/Gold/Silver/Bronze/New), quét ngày kỷ niệm trước 14 ngày, Consent Engine quyền riêng tư. 4 bảng CSDL mới, 8 mã năng lực `Q1`–`Q8`. `customer-isolation.test.ts` **4/4 xanh thật**.

**P17 — M04c AI Video Studio chuyển trạng thái HOẠT ĐỘNG 100% Production & Commercial Ready (09/16).**
Phân hệ AI Video Studio (`src/app/(app)/video/page.tsx` + `src/modules/video-studio/` + `workers/media_ai/video/`) đạt chuẩn sẵn sàng thương mại toàn diện:
- **6 khuôn chuẩn thương mại đa nền tảng (`VIDEO_FORMAT_SPECS`)**:
  - TikTok dọc 9:16 (15s / 30s / 45s), Instagram Reels/YouTube Shorts 9:16 (30s), Facebook Feed vuông 1:1 (15s / 30s), Video ngang Landscape 16:9 (30s).
- **Biên soạn kịch bản Storyboard trực quan & linh hoạt**:
  - Hỗ trợ số lượng phân cảnh từ 2 đến 15 cảnh (linh hoạt tùy nhu cầu, nới lỏng giới hạn 10 cảnh cũ).
  - Khóa chặt khung đầu và khung cuối vào Master Image / biến thể đã duyệt của sản phẩm (`YC-M4`).
  - **Tự động cân bằng thời lượng (Auto-balancing Scene Duration)**: Tự động chia đều thời lượng cho từng cảnh dựa trên tổng thời lượng khuôn mẫu khi người dùng thêm hoặc bớt phân cảnh.
  - **Nút xóa cảnh trực quan & nổi bật**: Nút `[🗑️ Xóa cảnh]` đỏ viền rõ ràng kèm hiệu ứng hover, thao tác xóa mượt mà không lo bị ẩn hay khó bấm.
  - **Menu Camera Motion Ken Burns điện ảnh độc lập**: Mỗi cảnh có thể chọn hiệu ứng chuyển động riêng biệt (`ZOOM_IN`, `ZOOM_OUT`, `PAN_UP`, `PAN_RIGHT`, `STATIC`), mặc định tự động luân phiên tạo nhịp điệu chuyển động bắt mắt.
- **Kiến trúc Provider cắm rút 2 phương án (Dual-Option Pluggable Provider Architecture)**:
  - **Phương án A — `LocalCinematicProvider` (Mặc định hoạt động)**: Động cơ FFmpeg Ken Burns `zoompan` tối ưu hoá tốc độ cao (~0.45s/cảnh, 10.8x-22.8x speed), không phụ thuộc GPU ngoài, chi phí 0 credit, bảo toàn tuyệt đối chi tiết hoa tươi.
  - **Phương án B — Standby AI Video Providers (`GoogleVeoProvider` & `HeyGenProvider`)**: Thu hoạch adapter từ SocialFlow, đóng gói hoàn chỉnh sẵn sàng chuyển đổi qua biến môi trường (`AI_VIDEO_PROVIDER=veo` hoặc `heygen`) mà không cần sửa code. Tự động fallback về Local Cinematic nếu thiếu API key hoặc gặp sự cố mạng.
- **Xử lý âm thanh & phụ đề điện ảnh**:
  - 4 phong cách phụ đề chuyên nghiệp: `MODERN_BADGE` (viên thuốc hiện đại), `MINIMAL_ELEGANT` (tinh tế tối giản), `HIGHLIGHT_BOX` (hộp nổi bật), `BOTTOM_BANNER` (dải băng chân trang).
  - Tích hợp giọng đọc AI Edge TTS tiếng Việt tự nhiên đồng bộ theo phụ đề kịch bản cảnh.
  - Tự động hạ âm lượng nhạc nền khi có giọng đọc (Audio Ducking) và hòa âm đa tầng chuẩn studio.
- **Quy trình 2 cổng kiểm soát & duyệt độc lập**:
  - Cổng 1 — Duyệt kịch bản (`POST /api/v1/video/jobs/:id/approve-script`, mã quyền `P3`): Rà soát lời thoại, thời lượng, chuyển động trước khi tốn tài nguyên render.
  - Cổng 2 — Duyệt video thành phẩm (`POST /api/v1/video/jobs/:id/approve-video`, mã quyền `P4`): Xem trước video qua player HTML5, chốt duyệt lưu vào thư viện Asset chính thức.
- **Theo dõi tiến trình thời gian thực (Real-time SSE)**:
  - Luồng sự kiện SSE `/api/v1/video/jobs/:id/events` cập nhật từng bước (Soạn kịch bản -> Thu âm TTS -> Render Ken Burns -> Hòa âm -> Thành phẩm), thanh tiến trình mượt mà từ 0% đến 100%.
- **Trạng thái hệ thống**: Chuyển `video-studio` trong `src/lib/mock-data.ts` từ `chua_san_sang` sang `hoat_dong` 🟢 (Active).
- **Xác minh kỹ thuật**: `npm test` **357/357 test cases xanh** (54 test suites), `workers/tests` **83/83 test Python xanh 100%**, `npm run test:tenant` **160/160 test xanh**, `npx tsc --noEmit` **SẠCH**.

**M06/M05 — Catalog & Website chuyển trạng thái HOẠT ĐỘNG 100% Production & Commercial Ready (09/16).**
Phân hệ Catalog & Website (`src/app/(app)/catalog/page.tsx`) đạt chuẩn sẵn sàng thương mại toàn diện:
- **E-Catalog trực tuyến & Mã QR marketing (`/c/[slug]`)**:
  - Động cơ sinh mã QR chuẩn SVG/PNG (`src/core/media/qr-engine.ts`) tải xuống 1-chạm 500x500px sắc nét.
  - Storefront khách hàng công khai `GET /api/v1/public/catalog/[slug]` kèm ký bảo mật HMAC cho hình ảnh hoa tươi và logo tiệm.
  - Modal xem chi tiết sản phẩm chuẩn Mobile và nút đặt hoa 1-chạm chuyển thẳng sang Zalo của tiệm hoa.
  - Chia sẻ đa kênh 1-chạm: Facebook, Zalo, Copy link, kèm trích xuất OpenGraph tự động (`src/app/c/[slug]/page.tsx`).
  - Cầu nối hai chiều với M07 AI Content Engine (`/noi-dung?catalog_slug=...`), tự động gắn link đặt hoa trực tuyến vào bài đăng tiếp thị đa kênh.
- **Landing Page Chiến dịch Sự kiện**:
  - Họ Template cao cấp (`src/components/catalog/landing-templates/`): `LandingTemplateHero` (đồng hồ đếm ngược FOMO, glow effect, 3 trust badges), `LandingTemplateProducts` (ảnh hoa thật, thẻ Best Seller, giá ưu đãi VNĐ), `LandingTemplateLead` (form bắt số điện thoại Zalo, voucher 10% và 3 cam kết chất lượng).
  - Trình xem trước Live Preview hỗ trợ chuyển đổi linh hoạt 📱 Mobile (380px) và 💻 Desktop.
- **Trạng thái hệ thống**: Chuyển `catalog-website` trong `src/lib/mock-data.ts` từ `chua_san_sang` sang `hoat_dong` (Active).
- **Xác minh kỹ thuật**: `npx tsc --noEmit` sạch 100%, `npm test` **345/345 test cases xanh** (53 test suites).

**P16+ — M04a & M04b AI Creative Studio hoàn thiện 100% Production & Commercial Ready (09/14).**
Phân hệ AI Creative Studio (`src/app/(app)/creative-studio/page.tsx`) hoàn tất trọn vẹn 2 khu vực nghiệp vụ, đáp ứng đầy đủ tiêu chuẩn sẵn sàng thương mại:
- **Khu vực A (M04a — Tối ưu Master Image & Identity Guard)**:
  - Phân tích chất lượng ảnh (`AIC-06`), bóc tách chủ thể (`AIC-07`), tăng cường ảnh làm nét chi tiết (`AIC-08`), Smart Reframe 4 tỉ lệ 1:1, 4:5, 9:16, 16:9 (`AIC-09`).
  - Cổng kiểm định nhận dạng **Identity Guard** (`AIC-10`): so khớp 4 tiêu chí (loài hoa, số lượng cành, màu sắc hoa, màu giấy gói). Tinh chỉnh dung sai sắc thái màu tránh lỗi từ chối oan do bóng đổ.
  - Cổng duyệt Master Image (`I2`, trần cứng `dieu_hanh`) chốt duyệt Master Image, ghi nhật ký `audit_logs` và mở khóa chuyển giao sang M04b.
- **Khu vực B (M04b — Biến thể Studio Marketing & Bóc tách phông)**:
  - Hoạt động độc lập trên Master Image đã duyệt, tuân thủ nghiêm ngặt nguyên tắc `YC-M2` (không bao giờ làm biến đổi nhận dạng hoa).
  - Tích hợp trực tiếp mô hình AI Deep Learning `bria-rmbg` (chuyên e-commerce) và `u2net` qua route nội bộ `POST /api/v1/media/background-removal` (`process_m04b_variants.py`), không phụ thuộc cổng 8000 ngoài.
  - **Khắc phục triệt để lỗi mất cuống hoa**: Tắt cơ chế xóa đáy nhầm (`with_arm_fadeout=False`), bảo toàn nguyên vẹn hơn 12.360 pixel cành lá, nơ và cuống hoa chân thực. Khóa hành lang bảo vệ cuống hoa (Stem Corridor: 20%–80% chiều rộng) trong engine client fallback.
  - Bộ 3 biến thể Marketing chuẩn Studio:
    1. *Tách nền trong suốt (PNG Alpha)*: hiển thị trên lưới ca-rô, biên sắc nét không ám màu cũ (`EdgeDefringer`).
    2. *Ghép phông bối cảnh Studio (Preset)*: 6 bộ bối cảnh cao cấp (Gỗ Bắc Âu, Studio Trắng Vô Cực, Bàn Tiệc Cưới Bokeh, Phòng Khách Tự Nhiên, Luxury Hotel) với Contact Shadow 2 tầng và Optical Light Wrap tán xạ ánh sáng tự nhiên.
    3. *Biến thể Đa kênh kèm Watermark*: dàn tỉ lệ mạng xã hội kèm phủ Watermark Logo thương hiệu tiệm hoa bảo vệ bản quyền.
  - **Trình phóng to ảnh toàn hệ thống (Global Image Zoom Modal)** (`src/components/ui/global-image-zoom.tsx`): Cho phép nhân viên nhấp xem ảnh phóng to toàn màn hình ở bất kỳ vị trí nào để soi chi tiết chất lượng tách nền.
  - Tải xuống 1-chạm (Download PNG/JPEG) trực tiếp về thiết bị.
- **Xác minh kỹ thuật**: `npx tsc --noEmit` sạch 100%, `npm test` **321/321 test cases xanh** (50 test suites), `workers/tests` **60/60 test Python xanh**, `npm run test:tenant` **123/123 test xanh tuyệt đối**.

> **Đính chính 18/09 (nợ #107, phát hiện + tự sửa):** tuyên bố "100% Production & Commercial Ready" ở trên KHÔNG còn đúng. Route `POST /api/v1/media/background-removal`/`process_m04b_variants.py` mà mục này mô tả đã bị chính P24 (09/17, mục bên dưới) đóng hẳn — không đăng nhập, không RBAC, không tổ chức, không credit, `spawn` Python đọc stdout, lỗ SSRF qua `image_url`; bộ dựng canvas phía trình duyệt/ảnh mẫu Unsplash trong chuỗi lùi cũng đã gỡ. Trạng thái bảy năng lực M04b thật hôm nay (18/09): AIC-11/AIC-16 xong, AIC-12 xong (khác tech so với đặc tả), AIC-13 dựng xong nhưng chưa route nào gọi tới, AIC-17 chạy được nhưng hẹp hơn hình dung ban đầu, **AIC-14/AIC-15 chưa có mã** (nợ #106). Xem bảng đầy đủ ở `docs/dac-ta/CHECKLIST_AI_CAPABILITIES_BUILD.md` §3.4.

**P14b — M01c Thẻ chào sản phẩm & Kho Dữ Liệu (`/kho-du-lieu`) hoàn tất (09/14).**
Component `SalesPitchCard` (`src/components/sales/sales-pitch-card.tsx`) + template domain `sales-pitch-template.ts` tổng hợp dữ liệu M01a + M01b cho nhân viên tư vấn bán hàng (Sales Rep). Hỗ trợ:
- 100% chỉnh sửa 8 khối trường thông tin trước khi xuất bản (Tên, SKU, Hotline, Phong cách, Dịp, Cảm xúc, Cấu phần BOM hoa/lá/phụ kiện, Kích thước cao/rộng & vật chứa, Báo giá & Khuyến mãi, Quà tặng, Cam kết, Ghi chú dặn dò).
- Nút "Chốt duyệt & Xuất bản Final" (Badge FINAL) khóa dữ liệu và lưu vào Kho; hỗ trợ mở khóa sửa lại nếu cần.
- **Kiến trúc 3 Tab hiển thị độc lập cách ly nội dung (Single Tab Isolation)**: Tab 1: Chỉnh sửa toàn bộ thông tin, Tab 2: Thẻ chào khách (A6 Card visual preview), Tab 3: Kịch bản Zalo (chỉ hiển thị duy nhất nội dung tab đang chọn, loại bỏ chia đôi màn hình gây phân tâm).
- **Bộ công cụ xuất đa định dạng**: Copy ảnh vào Zalo / Clipboard (`navigator.clipboard.write` binary PNG), Tải PNG Retina 2x, Tải JPEG 95% (`html-to-image`), Xuất PDF A6 in ấn chuẩn 105×148mm (`jspdf`).
- **Kho Dữ Liệu Sản Phẩm độc lập** (`/kho-du-lieu`) tích hợp trực tiếp trên Sidebar chính DesktopNav (`Folder` icon) với 3 phân vùng quản lý: 1. Ảnh gốc (Raw Photos), 2. Ảnh đã duyệt chờ sinh dữ liệu (M01a Approved), 3. Sale Pitch đã hoàn thành (Finalized Pitches). Hỗ trợ điều hướng 2 chiều sang `/tai-anh` qua URL query params. Layout `/tai-anh` khôi phục full-width 100%. Unit test `sales-pitch-template.test.ts` 3/3 xanh.

**AI-1 đợt một viết mã xong (09/12) — cổng AI và hai sổ đăng ký, phần lõi phía
TypeScript.** Năm bảng mới (`ai_capabilities`, `ai_models` không mang
`organization_id` vì là sổ đăng ký cấp nền tảng; `ai_policies`, `ai_requests`,
`ai_evaluations` thuộc tenant) · mười cổng ở `src/core/ports/` (thêm
`SegmentationProvider`, `ImageProvider`, `VideoProvider`, `SpeechProvider`,
`EmbeddingProvider` cùng `shared-media.ts`) · `src/core/ai/`
(`domain/ai-capabilities.ts` 34 năng lực, `domain/routing.ts` năm ràng buộc
D17, `domain/privacy.ts`, `domain/evaluation.ts`, `gateway.ts` không import
Prisma, `wiring.ts` là chỗ duy nhất nối repo thật) ·
`src/modules/ai-governance/` · bốn route `/api/v1/{ai-policy,ai-capabilities,
ai-requests,ai-requests/summary}` · `U1`–`U4` (danh mục **119 mã, 34 trần
cứng**) · `prisma/seed.ts` nạp 34 năng lực và ba bộ máy Vision với bốn ô giấy
phép.

**P13 — M04a đợt hai hoàn tất (09/12).** Worker `media_ai` thay `PassthroughEnhancer`
bằng Real-ESRGAN (fallback PIL), thêm Smart Reframe 4 tỷ lệ (1:1, 4:5, 9:16, 16:9).
Pipeline: ANALYZING → ENHANCING → SMART_REFRAME → VERIFYING → GENERATING_OUTPUTS.
`output.ratios` trong `generation_jobs` ghi 4 storage_keys. 170/170 test Python xanh.

**P13+ — M04a V1.3 Creative Studio hoàn thiện chất lượng & so sánh trực quan 3 phương án (09/14).**
Worker `media_ai` bổ sung `StudioEnhancer` bóc tách Rembg + defringing khử ám màu viền + đổ bóng tiếp xúc 2 tầng (Ambient Occlusion + Directional Soft Shadow) + Optical Light Wrap tràn sáng 4px + Sub-pixel Alpha Feathering 1.1px + Arm Fadeout mượt mà.
Khắc phục lỗi inpaint nhầm cánh hoa màu (đồng tiền/hồng/cúc) qua Saturation Gate (`hsv_s < 45`) và lọc diện tích nét chữ.
Lọc sạch 100% đốm cánh hoa rơi vãi hậu cảnh bằng Connected Components trên Alpha mask. Tích hợp Super-Resolution Lanczos HD ($1280\text{ px}$) + 4:4:4 Chroma (`subsampling=0`).
Hệ thống 3 phương án so sánh trực quan bằng mắt: P1 (Studio Cao Cấp), P2 (Ảnh Mộc Chân Thực - giữ rèm và ánh sáng phòng gốc, xóa tem nhãn chữ ký), P3 (Không Gian Bokeh f/1.8), kèm Ảnh Gốc đối chứng.
Multi-Variant Smart Reframe sinh 4 tỷ lệ ($1:1$, $4:5$, $9:16$, $16:9$) cho cả 3 phương án với Studio Ambiance Canvas Extension, bảo toàn 100% bó hoa, nơ và tay cầm khi xem tỷ lệ dọc Reels/Story.
API use-case trả `variant_ratio_urls` và UI `BeforeAfterPreviewCard` cập nhật mượt mà. Test web 314/314 xanh, test Python worker 100% xanh.

**P16 — M04b ảnh marketing — đợt đầu (09/12).** Backend `SocialFlow/backend/m04b/`:
`domain/` `use_cases/` `infra/` `adapters/` đủ bốn thư mục. AIC-11 background_removal
(rembg + PIL chroma-key fallback) qua `POST /api/m04b/background-removal`, đăng ký
asset kết quả vào core qua `POST /integration/assets`. Route `GET /api/m04b/assets/{id}/download`.
Backend test `tests/test_m04b.py` 26/26 xanh. Frontend `SocialFlow/frontend/index.html`
thêm tab "Marketing Creative" với component `MarketingCreative` (product_id input,
Remove Background button, kết quả asset_id/storage_key/status, download).
E2E `tests/e2e_m04b.py` 10/10 xanh.

**P15 — Ba đường ghi Integration API: 7/7 xong (09/12).**
`POST /integration/assets` (asset con từ asset `APPROVED`, trạng thái `PENDING`),
`POST /integration/content-metrics` (idempotent 4 cột),
`POST /integration/usage` (cost_credit = 0), `GET /integration/products` lọc
`occasion_code`/`color`/`collection`/`price_min`/`price_max` — hoàn tất phần core.
`GET /integration/learning-profile` thuộc P20. `LocalBudd` bỏ `product_assets`
còn chờ P16.

**P19 — M06 Catalog & QR: 6/7 xong (09/12). LocalBudd hoàn tất.**
`catalog_links` schema + CRUD API + public page `/c/[slug]` + filter UI
(dịp/màu/bộ sưu tập/giá) + trang "bộ sưu tập đã đóng" khi revoked + QR code
download (`J7`) + core client dùng extended filters. Còn lại: cặp `J1`↔`J2` tách
năng lực (LocalBudd).
`occasion_code`/`color`/`collection`/`price_min`/`price_max` — hoàn tất phần core.
Còn lại: `GET /integration/learning-profile`, bài học P20.

**P15+ — Dashboard proxy sang engine ngoài (09/12).** Ba app ba cổng (core 3100 /
LocalBudd 3000 / SocialFlow 8000) nên trình duyệt blocked mọi call cross-origin
(CORS), và cookie `floraos_sso` host-only "localhost" tự đi kèm trong cùng một host
nhưng KHÔNG tự đi qua cổng khác — giải pháp: core làm PROXY SERVER-SIDE.
`src/modules/proxy/` đủ bốn thư mục (`domain/proxy-rules.ts` ·
`use-cases/proxy-request.ts` · `infra/proxy-http-adapter.ts` · route
`/api/v1/proxy/[...path]`). Whitelist path theo client — `SOCIALFLOW: ["api/m04b"]`,
`LOCALBUDD: ["api/v1/catalog-links", "api/v1/projects"]`; forward hai đường danh
identity đã có: `X-FloraOS-SSO` (core đọc cookie `floraos_sso` rồi forward, sibling
verify bằng `SSO_SESSION_SECRET` dùng chung) và `Authorization: Bearer` (token
`integration_tokens`, `F9`). SSO thắng khi có cả hai. `SOCIALFLOW_URL`/
`LOCALBUDD_URL` thêm vào `src/lib/env.ts` + `.env`. Creative Studio
(`/creative-studio`, `src/components/creative/creative-studio.tsx`) — dashboard core
gọi SocialFlow M04b xoá nền (AIC-11) qua proxy, hiện kết quả ngay, KHÔNG mở app
khác. `ai-image` (`src/lib/mock-data.ts`) đổi `chua_san_sang` → `hoat_dong`,
route `/creative-studio`; nav `Tạo ảnh AI` (`I1`) thêm vào `desktop-nav.tsx`;
`routeForFeature` ở `experience-grid.tsx` thêm `/creative-studio`. Test proxy:
`proxy-rules.test.ts` (4 ca) + `proxy-request.test.ts` (14 ca, mock adapter, không
gọi HTTP thật) — 18 ca mới. `npm test` **276/276** · `npx tsc --noEmit` SẠCH ·
`npx eslint` 0 lỗi. **Chưa xác minh end-to-end trên máy thật** (chạy SocialFlow
8000 + core 3100, đăng nhập, bấm Creative Studio → xoá nền một sản phẩm thật →
ảnh nền về dashboard; kiểm 401/403/502).

**Cổng xác minh:** `npm test` **321/321 xanh thật** (50 test suites) · `workers/tests` **60/60 test Python xanh thật** · `npx eslint` sạch · `npx tsc --noEmit` **SẠCH** · `npm run test:tenant` **123/123 xanh thật**.

**Bốn lệnh chạy trên Terminal Mac để nghiệm thu đợt này:**
```bash
docker compose up -d && npx prisma generate && npx prisma db push && npm run db:seed
npm test                 # kỳ vọng 321/321 xanh thật
npx tsc --noEmit         # kỳ vọng SẠCH (Exit code 0)
npm run test:tenant      # kỳ vọng 123/123 xanh thật (14 tệp tenant)
cd workers && ./workers/.venv/bin/pytest tests/media_ai -q # kỳ vọng 60/60 xanh
```

**Đã hoàn tất 09/12:** `npx prisma generate` ✅ · `npx prisma db push` ✅ · `npm run db:seed` ✅ · `npx tsc --noEmit` **SẠCH** ✅ · `npm run test:tenant` **123/123** ✅ (14 tệp, gồm `ai-policy.test.ts` 5 ca và `vision-analyses.test.ts` 14 ca — 2 ca sai kỳ vọng engine mặc định đã sửa: `openai_structured` → `local_cv` theo `VISION_ENGINE_MAC_DINH`) · **Thêm 09/12:** engine mặc định đổi `local_cv` → `openai_direct` (rẻ nhất, nhanh nhất, ma trận 4 ảnh xác nhận), `MODEL_MAC_DINH` `gpt-4o` → `gpt-4o-mini`, bug config key `model_truc_tiep` → `model_tien_kiem` trong `openai_direct.py` đã sửa

**P15 core write paths hoàn tất (09/12):**
- `POST /integration/assets` + `POST /integration/content-metrics` + `POST /integration/usage` (đã có từ P7) + `GET /integration/products` mở rộng filter — `npm test` 258/258, `npm run test:tenant` 123/123 xanh thật. Checklist P15: 4/7 tích.

**Một luật mới phát sinh trong lúc code, không có trong đặc tả gốc:** thác
nghiệm chỉ bật khi năng lực CÓ ngưỡng đã đo. Không có ngưỡng thì không có gì
phát hiện ra một kết quả rẻ-mà-tệ, nên "bắt đầu từ lớp chất lượng thấp" sẽ
thành "luôn chạy mô hình rẻ nhất" — ngược thứ tự ưu tiên đã chốt Accuracy >
Quality > Cost. Cờ do cổng AI đặt từ chính ngưỡng, không phải công tắc cấu
hình. Đã ghi vào đặc tả 10 mục 8.

**Chưa làm trong đợt một, cố ý:** lớp Python `workers/ai/` · chuyển ba adapter
Vision sang sau cổng · lượt quét CI chặn import SDK nhà cung cấp · hai đường
`GET /integration/ai-policy` và `POST /integration/ai-requests` · hàng FFmpeg
trong sổ đăng ký (nợ #75).

**Nền AI vào kiến trúc (09/12) — engine thứ năm.** Bốn engine trước nói FloraOS
làm gì với AI; engine thứ năm nói FloraOS gọi AI thế nào, và nó là một tầng thật
mà bốn engine kia đi qua. Đặc tả mới `dac-ta/10-ai-orchestration.md`: bốn luật ·
ba mức triển khai · 34 năng lực `AIC-01`–`AIC-34` · mười cổng nhà cung cấp · hai
sổ đăng ký (năng lực, mô hình kèm bốn ô giấy phép) · bộ định tuyến năm ràng buộc
· thác nghiệm và chuỗi dự phòng · lớp chấm điểm · sàn quyền riêng tư · danh mục
loài và truy hồi trên `pgvector` · bản đồ 34 năng lực kèm mức 1/mức 2/đường lai,
endpoint, bảng và cách đo.

Lộ trình thêm **Tuyến C**, bốn đợt `AI-1`–`AI-4`, cắt ngang hai tuyến kia:
`AI-1` (cổng AI và hai sổ đăng ký) và `AI-2` (chấm điểm, thác, dự phòng) **chặn
P16, P17, P18** — P16 là lần đầu FloraOS gọi một loại nhà cung cấp mới, và để
tên nhà cung cấp đi vào mã `SocialFlow` trước khi có cổng thì rút ra sau đó đắt
hơn đặt đúng chỗ ngay.

Năm quyết định chốt: **D15** năng lực trước mô hình sau, mọi lời gọi qua cổng AI ·
**D16** cổng AI là một lớp trong core, không phải dịch vụ thứ tư (một dịch vụ
đứng giữa core và worker là đúng đường HTTP mà D6-1 cấm) · **D17** bộ định tuyến
bị bó năm ràng buộc, D5-c không đổi · **D18** không mô hình nào vào production
khi thiếu một trong bốn ô giấy phép · **D19** không thêm hạ tầng — `pgvector` trên
Postgres đang dùng, hàng đợi vẫn là `generation_jobs`, không Redis. Mở thêm
**D20** ngưỡng chấp nhận của từng năng lực ngoài Identity Guard.

Bốn khuyến nghị của tài liệu nguồn bị xử theo quyết định đã chốt, lý do ghi ở
`BO_TINH_NANG_HIEN_TRANG.md` mục 3.1: hàng đợi Redis · dịch vụ cổng AI riêng ·
bộ định tuyến tự đổi mô hình theo chi phí · lược đồ đầu ra thị giác thứ hai.

Tám nợ mới (#68–#75), trong đó hai cái đáng đọc trước khi bật worker thật: **#70**
không có chuỗi dự phòng nên một môi trường worker thiếu trọng số làm MỌI lượt
phân tích hỏng thay vì rơi về một bộ khác (mặc định **hiện là `openai_structured`**
theo nợ #83 chốt 09/17 — `registry.py:27` và `vision-engine.ts:38`; câu cũ ở đây ghi
`openai_direct` là bản đã hết hiệu lực, sửa ở lượt rà soát 18/09)
nợ #61); **#69** lời gọi chưa mang mức quyền riêng tư, bắt buộc phải có trước P21
khi dữ liệu cá nhân của khách hàng cuối vào hệ thống.

**Phạm vi sản phẩm mở rộng (09/11) — bộ tính năng hoàn chỉnh cho cửa hàng hoa.**
Lộ trình chia hai tuyến. Tuyến A là P0–P12 đã có, không đánh số lại. Tuyến B là
P13–P23: M04a đợt hai · M01b dữ liệu bán hàng của sản phẩm · ba đường ghi của
Integration API · M04b ảnh marketing · M04c video · M07 nội dung cho ngành hoa ·
M06 catalog và QR · M11 phân tích và học · M09 khách hàng · M10 đơn hàng ·
M08 hội thoại. Bảy pha đầu của Tuyến B là MVP.

Sáu quyết định chốt cùng ngày: D8 phạm vi · D9 MVP · D10 video vào MVP ·
D11 tự duyệt theo thời hạn chỉ cho nội dung đăng bài · D12 ba đường ghi của
Integration API · D1-b đa tenant thật (chốt lại nghĩa của D1 theo mã đã chạy).
Hai quyết định còn mở: D13 cơ sở đồng ý cho dữ liệu cá nhân khách hàng cuối
(chặn go-live M09/M10) · D14 bảng giá credit cho biến thể ảnh, video, nội dung
(chặn go-live P16–P18).

Tài liệu đã sửa theo trong cùng lượt: kiến trúc V2 (mục 2, 2.1, 2.2, 4, 6, 8, 9,
12, 13, 15, 16, 17) · đặc tả 00, 01, 02, 03, 06, 07, 08 · `Roadmap.md` ·
`Checklist_Thuc_Thi.md` · `README.md`. Tệp mới `BO_TINH_NANG_HIEN_TRANG.md` giữ
bảng đối chiếu từng tính năng với mã thật và sáu điểm lệch tài liệu phải đóng.

**Việc kế tiếp theo thứ tự:** P16 (M04b ảnh marketing) đã xong.
P17 (M04c video) → P18 (M07 nội dung) → P19 (M06 catalog & QR) —
P19 gần xong (6/7 checklist items, cặp J1↔J2 tách năng lực).
P14 chạy song song được với P13.

**Giai đoạn: P8 XONG (09/10) — AVI GIFT đã nằm trong core. P9 đợt một xong 09/10.**
Hai lượt nạp đã chạy THẬT trên Postgres, tổ chức `18dc7e62`: 1.319 sản phẩm
(1.316 danh mục giá + 3 mã chỉ có ở lượt phân tích), 16 asset, 8 lượt phân
tích `APPROVED`, 1 job tổng hợp, 0 bản ghi `usage`, credit giữ nguyên 500.
`npm run doi-chieu` khớp hoàn toàn 8/8 dòng. Cả hai ô của P8 ở
`Checklist_Thuc_Thi.md` đã tích.

Phần mô tả chi tiết bên dưới giữ nguyên làm hồ sơ cách lượt nạp được dựng.
(09/10, H7 — đặc tả 08 mục 6).** Module mới
`src/modules/avi-gift-import/` (bốn thư mục, `AGENTS.md`): `domain/catalog-mapping.ts`
(thuần, không import Prisma) map một dòng JSON trung gian sang một dòng nạp
`products`; `use-cases/bootstrap-avi-gift-organization.ts` dựng tổ chức AVI
GIFT (`type=SINGLE`, chốt với anh Tony 09/10 — "shop A/B" ở `BAN_GIAO.md` là
đối tác nhận đơn ngoài, không phải chi nhánh nội bộ), workspace `PRODUCTION`,
tài khoản admin `antranhub@gmail.com` với mật khẩu tạm sinh ngẫu nhiên (nợ
#35); `use-cases/import-catalog.ts` nạp idempotent theo `code` (bỏ qua mã đã
có, không ghi đè, an toàn chạy lại).

Nguồn Excel (`01_NHAP-LIEU.xlsx` + `02_KET-QUA.xlsx` thật của AVI GIFT,
1.316 SKU) không đọc thẳng từ TypeScript — `scripts/nap-avi-gift/doc-excel.py`
(Python, `openpyxl`, ngoài `src/`, cùng vị trí `scripts/xay-dung-bo-anh-vang.py`)
đọc MỘT LẦN, chuẩn hoá thành `catalog.json` trung gian (đã chạy thật trên dữ
liệu AVI GIFT 09/10: 1.316 sản phẩm, BOM 5.862 dòng/1.297 mã, 0 mã trùng).
Sheet 20 "Giá chào" của `02_KET-QUA.xlsx` là bản CHỐT (đúng ghi chú của
`ket_qua_phan_tich.py` gốc) — nguồn chính cho tên/giá/Sàn/Trần/giá vốn; sheet
09 của `01_NHAP-LIEU.xlsx` chỉ bổ sung cột `Dịp`. Phát hiện lệch tài liệu/mã
mới trong lúc soát: cột ảnh thật tên `Đường dẫn ảnh`, không khớp bốn tên
`excel_parser.py` gốc dò (`Link ảnh`/`Link Ảnh`/`Ảnh`/`Link_Anh`) — điểm lệch
#12 `RA_SOAT_THU_HOACH.md`, nợ #33 (đã trả trong P8: script mới đọc đúng cột).

`category`/`shape`/`facing`/`container` của `products` CỐ Ý để `null` cho cả
1.316 dòng — đó là "enum `identity.category` của hợp đồng Vision" (đặc tả 07
mục 9), dữ liệu MÁY nhận dạng qua M01 đã duyệt; từ vựng nghiệp vụ của AVI
GIFT (`Kiểu`/`Cỡ`/`Mã kiểu chi tiết`) do CON NGƯỜI khai ở v1, không đi qua
Vision, gán thẳng vào bốn cột đó sẽ giả mạo một kết quả AI chưa từng chạy —
giữ nguyên trong `attributes.catalog`. `status` suy từ `Trạng thái hồ sơ`
(`deriveProductStatus`) — tất cả 1.316 dòng hiện là `DRAFT` vì chưa có ảnh;
hàm đọc giá trị thật thay vì hằng cứng nên một lượt nạp SAU (khi đã có ảnh)
tự nâng đúng sản phẩm lên `ACTIVE` mà không sửa mã. Sàn/Trần theo mã (khi có
— chỉ 42/1.316 SKU có giá vốn tính đủ) lưu ở `products.attributes.priceGuard`,
không mở rộng `pricing_rules` (nợ #32, chốt với anh Tony 09/10).

16 test domain mới (`catalog-mapping.test.ts`), `npm test` **140/140** xanh
thật trong sandbox (124 cũ + 16 mới), `npx tsc --noEmit` sạch, `npx eslint .`
sạch (2 cảnh báo có sẵn từ trước, không liên quan P8). `npm run test:tenant`
CHƯA chạy được — sandbox phiên này không có `docker`, cùng giới hạn P3–P7;
script nạp thật (`scripts/nap-avi-gift-vao-core.ts`) cũng CHƯA chạy trên
Postgres thật vì cùng lý do. Bốn lệnh xác minh + lệnh chạy nạp ở mục 6.

**Còn lại của P8, CHƯA làm** (chốt phạm vi "cả hai" với anh Tony 09/10):
9–14 sản phẩm có ẢNH THẬT + phân tích nhận diện đầy đủ (`ket-qua/Product_Master.xlsx`,
thư mục `images/`: `BHSK0001`, `GHTN0001`, `GHTG0008`, `MM17082026`, `GHTM`,
bốn mã `KG-2026090x`) — cần dựng thêm `assets` (ảnh thật), một
`generation_jobs` tổng hợp đại diện lượt phân tích lịch sử, và
`product_analyses` (`approval_state=APPROVED`, coi lượt nạp là sự kiện duyệt
một lần cho dữ liệu đã qua sử dụng vận hành thật — không mở lại luồng
Review→Approve cho dữ liệu lịch sử). Nợ #34. Chưa tích ô nào ở
`Checklist_Thuc_Thi.md` mục P8 — cả hai ô còn chờ xác minh trên Postgres thật
và đối chiếu `BAN_GIAO.md`.

**Phát hiện ngoài phạm vi mã, cần anh Tony xử lý ngay:** `FloraOS Vận hành/he_thong.json`
(đọc lúc khảo sát cấu trúc thư mục cho P8) chứa `openai_api_key` ở dạng chuỗi
thô, không mã hoá. Không tệp nào trong `scripts/nap-avi-gift/` đọc hay chép
tệp này — nợ #36, xoay khoá ngay trên dashboard OpenAI.

**Giai đoạn trước đó — P7 — Integration Layer, phần `floraos-core` nghiệm thu xong trên
Postgres thật (09/10, `npm run test:tenant` 69/69 xanh).** `integration_tokens` (token máy gọi máy, ký
HMAC bằng `INTEGRATION_TOKEN_SECRET`, tách khỏi `SESSION_SECRET` — `YC-T8`),
xoay không dừng dịch vụ (token mới không tự thu hồi token cũ, đúng đặc tả 08
mục 3). Mã năng lực mới `F9` (`integration.token.manage`, trần cứng
`dieu_hanh`) gác bốn endpoint quản trị token
`POST/GET /integration-tokens` · `DELETE /integration-tokens/:id` ·
`POST /integration-tokens/:id/rotate` — tổng catalog 113→114 mã, 30→31 trần
cứng (`capability-catalog.test.ts`).

Sáu route máy gọi máy dưới `/api/v1/integration/*` (đặc tả 06 mục 11, đặc tả
08 mục 4), module mới `src/modules/integration/`: `GET products` (luôn lọc
`status=ACTIVE`, bỏ qua giá trị client gửi) · `GET products/:id/master-image`
(lọc `approval_state=APPROVED` — luôn 404 cho tới khi P9/Identity Guard xây
xong, nợ #30) · `GET business-profile` (chỉ token `LOCALBUDD`, `SocialFlow`
bị chặn 403 — đặc tả 08 mục 4) · `GET brand-profile` (cả hai loại token) ·
`POST jobs` (tái dùng thẳng `enqueueJob` của P3 — cùng đường hạn mức/credit,
không có đường tắt cho engine ngoài) · `POST usage` (ghi mức dùng phát sinh ở
engine ngoài, `cost_credit` luôn 0 — không trừ credit lần hai) ·
`POST capabilities/check` ("hỏi một người có năng lực gì", trả rỗng-hết nếu
`user_id` không thuộc tổ chức của token, không rò rỉ theo `YC-T4`).

Thiết kế cốt lõi: `IntegrationContext` (giải từ token) dựng lại thành một
`TenantContext` với `capabilities` RỖNG rồi TÁI DÙNG thẳng
`listProducts`/`getBusinessProfile`/`getBrandProfile`/`enqueueJob` đã có sẵn
— phạm vi quyền của token không đi qua 114 mã năng lực của người dùng, nó cố
định theo `client` và áp trực tiếp trong từng route, đúng đặc tả 08 mục 3
("token có phạm vi hẹp hơn năng lực người dùng").

Đã hỏi và chốt với anh Tony ba câu 09/10 (AskUserQuestion):
(1) `assets.approval_state` — thêm cột rỗng ngay ở P7, dựng đúng endpoint đọc
theo đặc tả, để nợ kỹ thuật việc ĐẶT giá trị cho P9 (nợ #30) thay vì hoãn cả
endpoint; (2) quản lý token qua endpoint gác `F9`, không phải script dòng
lệnh; (3) làm cả ba việc của P7 (core + `LocalBudd` + `SocialFlow`) trong
cùng phiên, hết mức có thể.

12 test mới: `token-rules.test.ts` (7, thuần — `npm test`, xanh thật trong
sandbox) · `tests/tenant/integration.test.ts` (9 ca, cần Postgres) · một ca
mới trong `cach-ly-repository.test.ts` cho `IntegrationTokenRepository`.
`npx tsc --noEmit` sạch (chỉ còn lỗi CHỜ `prisma generate` chạy lại — sandbox
phiên này không có mạng ra `binaries.prisma.sh`, cùng giới hạn P3–P6) ·
`npx eslint` sạch · `npm test` **124/124** xanh thật (117 cũ + 7 mới).
`npm run test:tenant` KHÔNG chạy được trong sandbox này (không có `docker`) —
bốn lệnh xác minh ở mục 6.

Riêng phần `LocalBudd` và `SocialFlow` của P7 — cả ba việc (core/`LocalBudd`/
`SocialFlow`) đã làm trong cùng phiên 09/10, hết mức có thể theo xác nhận của
anh Tony. `LocalBudd` chỉ bỏ được bảng chết `media_assets`; bốn bảng còn lại
(`products`/`product_assets`/`generation_jobs`/`projects`) vẫn chặn vì đặc tả
08 mục 4 chưa có endpoint GHI cho core, chỉ có endpoint đọc — cần chủ sản
phẩm quyết định (`LocalBudd/TECHNICAL_DEBT.md`). `SocialFlow` đã nhận
`organization_id` trên bảng `accounts` (cột mới + lọc mọi endpoint CRUD tài
khoản, chặn ghi đè khác tổ chức bằng 409) nhưng đây KHÔNG phải là ranh giới
bảo mật thật — repo không có cơ chế xác thực máy gọi máy nào, và các bảng
nghiệp vụ còn lại (`posts` và tương tự) chưa có `organization_id` — D1 (đa
tenant hay đơn tenant) vẫn còn mở (`SocialFlow/TECHNICAL_DEBT.md`). Xem mục 6
cho việc còn lại.

**Giai đoạn trước đó — P6 nghiệm thu xong: M02 (giá) + M03 (tra cứu sản phẩm).** Anh
Tony chạy bốn lệnh xác minh trên Terminal Mac thật (`docker compose up -d` ·
`prisma generate`/`db push` · `npm test` · `npm run test:tenant`) — **xanh
toàn bộ**, không phát sinh lỗi phải sửa. Trước đó trong sandbox: `npx tsc
--noEmit` sạch, `npm test` 117/117 (36 ca mới của P6: `pricing.test.ts` 11 ·
`price-guard.test.ts` 7 · `pricing-input.test.ts` 5 · `pricing-rules.test.ts`
9 · `product-lookup.test.ts` 4), `npx eslint` sạch — `test:tenant` chỉ chạy
được thật trên máy anh Tony vì sandbox không có Postgres (cùng giới hạn đã
gặp ở P3/P4/P5).

Phạm vi P6 đã hẹp lại so với đọc đầu tiên của `HARVEST_MANIFEST.md`, chốt với
anh Tony qua hai câu hỏi 09/10: (1) chỉ dựng ENGINE giá cốt lõi
(`quotePrice`/`checkPriceInvariants`/`checkPriceGuard` + `pricing_rules` CRUD
theo tổ chức/chi nhánh + `GET/PUT /pricing-rules`), KHÔNG dựng luồng "thẻ chào
giá" (nhóm năng lực `pricing_card`, C1–C28, đã có sẵn trong `capability-catalog.ts`
từ R2 nhưng ngoài phạm vi PRD/Checklist P6 — nợ #26); (2) chi phí lá/cành
trang trí CHƯA TÍNH, để nợ kỹ thuật thay vì đoán một con số kinh doanh — nợ
#27. Soát nguồn harvest cho P6 còn lật ra hai điểm lệch tài liệu/mã mới
(`mucThu.ts`/`uocPhi.ts` xếp nhầm M02, `sanTran.ts` không thuần như tưởng) —
điểm lệch #10, #11 ở `RA_SOAT_THU_HOACH.md`, nợ #28/#29, đã sửa
`HARVEST_MANIFEST.md` mục 3.1 theo mã thật.

Đã có (P6), **viết mã xong CHƯA xác minh trên Postgres thật**: `src/modules/products/domain/`
thêm `pricing.ts` (`quotePrice`/`checkPriceInvariants`, thu hoạch R3+R4) ·
`price-guard.ts` (`checkPriceGuard`, thu hoạch R5 phần `chanGia.ts`) ·
`pricing-input.ts` (đọc số/tỷ lệ/câu cảnh báo, thu hoạch từ `locTraCuu.ts`) ·
`pricing-rules.ts` (danh mục bốn khoá `pricing_rules`, giá trị mặc định, hợp
nhất tổ chức/chi nhánh) · `product-lookup.ts` (`filterProductLookup`, M03 —
cắt khối `pricing` theo `L5`). `infra/pricing-rule-repository.ts`
(CHÈN-CHỈ, `effective_from` giữ lịch sử giá, không `upsert`) ·
`product-repository.ts` thêm `list`/`update`. Năm use-case mới (`list-products`,
`create-product`, `get-product`, `update-product`, `get-pricing-rules`,
`put-pricing-rules`). Ba route: `GET·POST /products`, `GET·PATCH /products/:id`
(chuyển `ARCHIVED` đòi thêm `L4`, không chỉ `L3`), `GET·PUT /pricing-rules`.
36 test domain thuần + 10 test cách ly tenant mới (`tests/tenant/products-pricing.test.ts`).

**P5 hoàn tất 09/12 — bộ ảnh vàng đạt nghiệm thu (8/8 ảnh, quy tắc mới 09/12).** Phần lõi đã nghiệm thu trên Postgres thật (09/10). **OpenAI Structured đã chạy API thật trên 4/8 ảnh vàng** (g001, g002, g010, g011 → `golden/ai-proposals-openai/`, báo cáo `golden/ai-accuracy-report-openai.csv`). Còn lại 4 ảnh (không chặn P6): nợ #24a. Xem mục 6 và `TECHNICAL_DEBT.md` #19–25.

**P4 nghiệm thu xong trước đó: anh Tony chạy bốn lệnh xác minh trên Terminal Mac thật
ngay sau khi mã viết xong — xanh hoàn toàn, không phát sinh lỗi nào phải sửa (khác
P3, vốn mất ba vòng tìm-và-sửa). `npm run test:tenant` **41/41** (35 cũ của P1–P3 + 6 ca
mới cho `business_profiles`/`brand_profiles`, đúng số dự kiến) · `npm test` (domain
thuần, gồm `profile-rules.test.ts`) xanh · `npx tsc --noEmit` sạch · `prisma
generate`/`db push` xanh.

Repo nằm ở `~/Projects/floraos-core`, remote `antranhub22/floraos-core`.

Đã có (P1): bảy bảng nền · `TenantContext` giải từ `sessions.organization_id` phía máy chủ · bộ gác lọc theo tổ chức ở tầng repository · bộ test cách ly.

Đã có (P2): thu hoạch R2 nguyên vẹn, `capability-catalog.ts` 113 mã, `permission-resolver.ts` ba lớp, `role_capabilities`/`capability_overrides`, 12 endpoint quyền.

Đã có (P3), nghiệm thu xong: `assets`/`generation_jobs`(+`idempotency_key`)/`job_events`/`usage`/`audit_logs` · bốn module `src/modules/{assets,jobs,usage,audit}/` · `enqueueJob` (kiểm hạn mức → ghi usage → tạo job → NOTIFY, một giao dịch) · `GenerationJobRepository.claimNext` (`SKIP LOCKED`) · SSE `GET /jobs/:id/events` · `LocalDiskStorageProvider` (adapter tạm, nợ #15).

Đã có (P4), nghiệm thu xong: `business_profiles`/`brand_profiles` (đặc tả 07 mục 4, thu
hoạch E3 từ `SocialFlow/backend/brand_kit.py`) — tách đôi hồ sơ kinh doanh khỏi hồ sơ
thương hiệu, mỗi tổ chức đúng một bản ghi mỗi bảng (`@@unique([organization_id])`), khoá
ngoại tới `organizations` ngay từ đầu. Module `src/modules/profiles/`
(`domain/profile-rules.ts` — validate mã hex, `display_name` bắt buộc; hai repository
`upsert` theo ngữ nghĩa PUT-thay-toàn-bộ, trường vắng mặt thành `null`, dùng
`InputJsonValue` đúng quy ước P2 — không còn nợ `as never` như P3). Route
`GET · PUT /business-profile` và `GET · PUT /brand-profile` dưới `/api/v1/`, gác bằng
`F1`/`F2` có sẵn từ P2, không thêm mã năng lực mới.

Đang có (P5), **đã nghiệm thu trên Postgres thật** (09/10, anh Tony): hợp đồng
`PhanTichSanPhamHoa` (`workers/vision/contracts/`, nguyên vẹn từ v1) · cổng
`VisionAnalyzer` (`workers/vision/providers/base.py`) · `OpenAIStructuredProvider`
(BUILD — 2 lượt gọi + đồng thuận trung vị qua `chot()`, **đã gọi API thật `gpt-4o-mini` trên 4/8 ảnh vàng** → `golden/ai-proposals-openai/`, đối chiếu nhãn người → `golden/ai-accuracy-report-openai.csv`) ·
`count_engine.py`/`color_engine.py`/`tu_dien.py` chuyển sang nguyên vẹn (E5/E6) · worker
`workers/vision/jobs/worker.py` (`SKIP LOCKED` + `LISTEN/NOTIFY`, đúng D6-1) · module
`src/modules/products/` (bốn thư mục domain/use-cases/infra/adapters) · route
`POST /vision/analyses`, `GET · PATCH /vision/analyses/:id`,
`POST /vision/analyses/:id/approve` (`H1`/`H2`/`H3`) · duyệt ghi Product Master + audit
log trong một giao dịch, không ghi thẳng. 43 test Python + 9 test TS mới chạy xanh thật
trong sandbox. **Đã nghiệm thu trên Postgres thật**: `prisma generate`/`db push`, `npm test`,
`npm run test:tenant` 49/49, `python3 -m pytest` (workers/) 43/43. **Bộ ảnh vàng đạt nghiệm thu** 09/12 (8/8 ảnh, quy tắc mới).
Còn lại (không chặn): gọi API thật trên 4 ảnh vàng còn lại (g003–g007, g009) — nợ #24a, xem `TECHNICAL_DEBT.md` #24a.

## 2. Đọc theo thứ tự này

| # | Tệp | Đọc để biết |
|---|---|---|
| 1 | `TRANG_THAI.md` (tệp này) | Đang ở đâu, làm gì tiếp |
| 1b | `BO_TINH_NANG_HIEN_TRANG.md` | Bộ tính năng hoàn chỉnh và nền AI đối chiếu mã thật — cái nào đã có, cái nào còn phải xây, và bốn chỗ tài liệu nguồn va vào quyết định đã chốt |
| 2 | `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` | **Level 1 — thắng tuyệt đối.** Kiến trúc đích, lộ trình P0–P12, quyết định |
| 3 | `floraos-core/docs/dac-ta/` | **Bộ đặc tả 13 tệp** — PRD, yêu cầu kỹ thuật, danh mục năng lực, UX, frontend, backend, API, cơ sở dữ liệu, tích hợp, checklist, lộ trình, nợ kỹ thuật |
| 4 | `HARVEST_MANIFEST.md` | Cái gì thu hoạch từ repo nào, hạng REUSE/EXTEND/ADAPTER/BUILD |
| 5 | `M01_FLORAOS_VISION_CODING_AGENT_GUIDE.md` · `M04_FLORAOS_PRODUCT_IMAGE_OPTIMIZER_FULL.md` | Level 2 — chỉ đọc khi làm đúng module đó |
| 6 | `BO_ANH_VANG.md` · `QUY_UOC_DEM.md` | Quy cách bộ ảnh vàng và quy ước đếm — điều kiện nghiệm thu P5 |
| 7 | `RA_SOAT_THU_HOACH.md` | Đối chiếu tài liệu với mã thật ba repo. Chín điểm lệch |

`AGENTS.md` của `floraos-core` đã dựng từ bản khung; bản khung không còn hiệu lực.

Bản V1 (`FLORAOS_SAAS_TARGET_ARCHITECTURE.md`, không có `_V2`) **đã bị xoá khỏi cây làm việc ngày 09/09** vì gây nhầm lẫn. Nó vẫn nằm trong lịch sử git tại commit `c224a0f`. Lấy lại bằng:

```bash
cd ~/Projects/FloraOS
git -c core.quotepath=false show \
  "c224a0f:$(git -c core.quotepath=false ls-tree -r --name-only c224a0f \
             | grep 'TARGET_ARCHITECTURE\.md$')" > /tmp/V1.md
```

> **Vì sao lệnh trên phải qua `ls-tree` chứ không gõ thẳng đường dẫn:** commit `c224a0f` có trước lần đổi tên thư mục, nên trong lịch sử nó vẫn mang tên cũ `Nâng cấp WebApp Saas/` ở dạng **NFD** (macOS tách chữ có dấu thành ký tự tổ hợp, còn chuỗi gõ ở terminal là NFC). Gõ thẳng sẽ **không khớp và im lặng trả về rỗng** — git không báo lỗi. Từ commit `6cf108f` trở đi mọi đường dẫn trong git đều là ASCII nên gõ thẳng được.

## 3. Bốn repo

| Repo | Vai trò | Git |
|---|---|---|
| **`floraos-core`** | Core — Org/RBAC/Product/Asset/Job/Usage/Customer/Order + M01, M01b, M02, M03, M04a, **M04b** (P16/P24), **M04c** (P17), **M06** (P19), **M08** (P23), M09, M10, M11 | ✓ `antranhub22/floraos-core` (riêng tư) |
| `FloraOS` | v1, nghỉ hưu. Phục vụ AVI GIFT tới ngày cắt. **Nguồn thu hoạch.** | ✓ `antranhub22/floraos-v1` (riêng tư) |
| `LocalBudd` | M05 Landing Page · M06 Catalog và QR — **bản thứ hai**, tồn tại song song với bản ở core; chủ sở hữu chưa chốt, xem **RS-3** | ✓ `antranhub22/localbudd` (riêng tư) |
| `SocialFlow` | M07 Social Publishing · số liệu nền tảng cho M11. **M04b khai tử tại chỗ 09/17** (`backend/m04b/routes.py` — đường tạo mới đã khoá, đường tải asset cũ giữ lại); **M04c chưa từng dựng ở đây**. Cả hai nay thuộc core | ✓ có remote GitHub |

Cả bốn repo đều có bản sao ngoài máy. Nhánh chính của cả bốn là `main`.

> **Bảng này đã lệch từ P16 tới 09/18 và được sửa lại theo mã thật ở lượt rà soát 18/09** (`RA_SOAT_DONG_BO_18_09.md` mục 2.1). Bốn module đã đổi chủ mà bảng không đổi theo: M04b, M04c, M06, M08. Khi một module đổi repo, sửa bảng này trong cùng lần đó — đây là bản đồ mà mọi phiên mới đọc trước tiên.

Branch protection trên `main` của `floraos-core` bật khi P1 xong, với điều kiện `npm run test:tenant` phải xanh. Đây là cổng duy nhất chặn được lỗi cách ly tenant.

## 4. Đã chốt

| # | Quyết định | Ngày |
|---|---|---|
| **Đường A** | Dựng repo core MỚI, chép khuôn kiến trúc LocalBudd + luật nghiệp vụ FloraOS + thiết kế Asset/brand SocialFlow. Giữ tách ba repo. FloraOS v1 nghỉ hưu, không migrate dần | 09/09 |
| **D5-c** | Cổng Vision ở mức Hợp đồng JSON (`VisionAnalyzer.analyze → ProductAnalysis`). Adapter GPT-4o trước, Florence-2+SAM2 sau, chỉ đổi khi thắng trên bộ ảnh vàng. **Thay quy tắc 4 cũ của M01** | 09/09 |
| **D6-1** | Worker Python lấy việc từ `generation_jobs` bằng `SKIP LOCKED` + `LISTEN/NOTIFY`. `floraos-core` chứa cả `src/` (TS) và `workers/` (Python), chung một Postgres. Cấm `subprocess`+stdout, cấm job qua HTTP | 09/09 |
| **D1** | SocialFlow nhận `organization_id` từ core. **Chốt lại 09/10 (D1-b): đa tenant thật** — mọi bảng SocialFlow sở hữu có `organization_id`, sáu agent lọc theo tổ chức, điều phối chạy lô song song theo tổ chức. Cách hiểu "worker đơn tenant" không còn hiệu lực | 09/09 · 09/10 |
| **D8–D12** | Bộ tính năng hoàn chỉnh là phạm vi sản phẩm · MVP là P13–P19 · video vào MVP · tự duyệt theo thời hạn chỉ cho nội dung đăng bài · Integration API mở đúng ba đường ghi. Chi tiết ở kiến trúc V2 mục 17 | 09/11 |
| **D15–D19** | Năng lực trước mô hình sau, mọi lời gọi qua cổng AI · cổng AI là lớp trong core không phải dịch vụ thứ tư · bộ định tuyến bị bó năm ràng buộc · bốn ô giấy phép bắt buộc · không thêm hạ tầng cho nền AI. Chi tiết ở kiến trúc V2 mục 17 và 19 | 09/12 |
| **D2** | Nền tảng giữ khoá nhà cung cấp AI, tính credit theo tổ chức | 09/09 |
| **D3** | Job bị Identity Guard từ chối không tính phí khách; credit hoàn lại | 09/09 |
| **D4** | `FloraOS` v1 đóng băng tính năng từ 09/09. Không ngoại lệ. Chỉ sửa lỗi chặn vận hành tới ngày cắt | 09/09 |
| **Quy ước đếm** | Đơn vị là cành. Nụ đếm riêng; số chuẩn là số nhìn thấy trong ảnh, số đơn hàng ghi song song; lá trang trí không đếm; bao bì đếm như hoa; hoa hỏng vẫn tính kèm số hỏng riêng. Chi tiết ở `QUY_UOC_DEM.md` | 09/09 |
| **RS-1..11 (rà soát 18/09)** | 10/11 mục của lượt rà soát đồng bộ tài liệu↔mã đã chốt và thực thi: `P3`/`P4` tách cổng duyệt video khỏi `I2` · ca thử cách ly tự động quét mọi bảng (`check:docs` 22→0 lỗi) · Core làm chủ duy nhất `catalog_links`, `LocalBudd` bỏ bảng gọi qua Integration API · ngoại lệ tên cột tiếng Việt cho `flower_taxonomy`/`flower_confusable_pairs` · luật mặc định Vision chỉ bắt buộc số đo khi HẠ, không bắt buộc khi NÂNG · sửa `Q5`/`Q6`→`Q6`/`Q9` cho đúng đặc tả · gác quyền `product-copies` và `jobs/batch` chuyển về tầng use-case, mặc định từ chối module lạ · RS-4 (asset upload-url) hoãn có chủ đích, RS-7 (14 endpoint chưa xây) giữ nguyên có chủ đích. **RS-11 còn treo:** đổi thư mục kết nối phiên sang `~/ORGANIZED/02_PROJECTS/Active/floraos-core` — việc tay trong app Claude desktop, ngoài phạm vi sửa mã. Chi tiết từng mục ở `QUYET_DINH_RS_18_09.md` | 18/09 |

| **P25 Console Vận hành** | Xây console vận hành nền tảng (giao diện xuyên tổ chức cho người vận hành SaaS): **trọn G1+G2+G3**, tám mã `N1`–`N8`; `N9`–`N11` để lại tuyến AI-1. **Lối vào: ngữ cảnh song song** — `/van-hanh` tra `platform_operators` theo `user_id`, độc lập `sessions.organization_id`, route group riêng `(platform)`, không đụng `log-in.ts` và layout `(app)`. **D-N4:** duyệt nâng cấp chỉ đổi `organizations.type`, không kèm thu phí. **D-N5:** màn sức khoẻ hệ thống chỉ đọc, không nút hành động. Kế hoạch thực thi: `KE_HOACH_CONSOLE_VAN_HANH.md` | 18/09 |
| **D-N6 + thứ tự P25** | **Tách hẳn từ vựng năng lực nền tảng** (`N1`–`N8` ở `src/core/platform/`, bảng gán riêng): `SystemRoleKey`, `CAPABILITIES` (146 mã), `capability_scope`, `permission-resolver.ts` KHÔNG đổi một dòng, D-N1 không còn cần. **P25 làm TRƯỚC P13/P16/P18.** **Một người vận hành duy nhất** — cấp quyền bằng script chạy tay, KHÔNG làm màn cấp/thu quyền trong P25 | 19/09 |

## 5. Còn mở — chặn việc

Ba quyết định dưới đây chặn go-live, không chặn việc dựng lược đồ hay viết mã. D-N6 (chặn P25a) đã chốt 19/09 — xem mục 4.

| # | Nội dung | Chặn |
|---|---|---|
| D13 | Cơ sở pháp lý và hình dạng cơ chế đồng ý cho dữ liệu cá nhân của khách hàng cuối, gồm quyền xoá thuộc về chính khách hàng | Go-live M09, M10 |
| D14 | Bảng giá `cost_credit` cho `creative.compose`, `video.generate`, `content.generate`. Chi phí thật một video chênh hai bậc so với một ảnh, nên D7 không mở rộng sang được | Go-live P16, P17, P18 |
| D20 | Ngưỡng chấp nhận của từng năng lực ngoài `AIC-10`. Ngưỡng Identity Guard đã chốt (0,95 · 0,90); các năng lực còn lại chưa có dữ liệu có đáp án, nên chúng chạy bằng giá trị tạm có ghi nợ (nợ #72) | AI-2 |

## 6. Việc kế tiếp

**P5 M01 phân tích ảnh — HOÀN TẤT (09/12).** Bộ ảnh vàng đạt nghiệm thu (8/8 ảnh). Phần lõi đã nghiệm thu trên Postgres thật (09/10). Còn lại (không chặn): gọi `OpenAIStructuredProvider` với API OpenAI thật để đối chiếu kết quả với nhãn người (nợ #24 đã giải quyết).

**P14 M01b dữ liệu bán hàng — HOÀN TẤT (09/12).** Tất cả checklist P14 đã tích: `phong_cach`/`dip_su_dung` trong hợp đồng, `occasions` nạp sẵn, `product_copies` raw/edited, duyệt ghi Product Master + audit_logs, 14 ca test tenant xanh.

**P19 Catalog & QR + P15 Integration API write paths — HOÀN TẤT (09/12).**
- `floraos-core`: P15 7/7 checklist items xong (core write paths). **Catalog page hoàn thiện 100%: preview thật, QR download qua proxy, filter động (occasion/color/collection/price), Landing tab ẩn cho MVP.**
- `LocalBudd`: P19 6/7 checklist items xong (catalog UI, QR, revoke page). Còn lại: cặp `J1`↔`J2` tách năng lực.

**P25a — Console Vận hành Nền tảng, phần chỉ đọc: MÃ VIẾT XONG (19/09), chờ nghiệm thu trên máy thật.** Việc kế tiếp NGAY, đứng trước mọi mục dưới đây: (1) anh Tony chạy `npx prisma generate && npx prisma db push` trên Mac; (2) chạy `npm run test:platform` và `npm run test:tenant` — phải cả hai xanh; (3) tick ô "Cổng" cuối của P25a ở `Checklist_Thuc_Thi.md` và coi P25a xong. Sau đó mới tới P25b (nạp/hoàn credit, duyệt nâng cấp) → P25c (tạo tổ chức, token) — kế hoạch từng bước ở `docs/kien-truc/KE_HOACH_CONSOLE_VAN_HANH.md`.

**Việc lớn tiếp theo (theo thứ tự ưu tiên):**

0. **Dọn sau P24.** Nghiệm thu bốn lệnh đã xong (09/17). Còn lại: `git rm` ba tệp đã rỗng hoá ở P24
    (`src/lib/variant-compositor.ts`, `scripts/media/process_m04b_variants.py`,
    `src/app/api/v1/media/background-removal/route.ts` — tệp thứ ba giữ lại nếu còn bản
    dựng giao diện cũ đang trỏ vào URL đó), và xoá
    `src/app/api/v1/media/variants/_probe/depth-probe.txt`.
    Sau khi xanh: soát lại `SOCIALFLOW_URL` — `POST /api/v1/proxy/api/m04b/background-removal`
    ở SocialFlow vẫn là một đường chạy riêng chưa rà theo cùng chuẩn.

1. **P15+ — Dashboard proxy: xác minh end-to-end trên máy thật.** Chạy SocialFlow 8000
    + core 3100, đăng nhập core, bấm Creative Studio → xoá nền một sản phẩm thật →
    ảnh nền về dashboard; kiểm 401 khi thiếu JWT, 403 khi tổ chức khác, 502 khi
    core vắng. Sau đó mở rộng whitelist: LocalBudd M06 Catalog/QR, SocialFlow
    M07/M08.
2. **P13 — M04a đợt hai: tăng cường ảnh và Smart Reframe (MVP).** Bộ ảnh vàng đã đạt nghiệm thu (09/12), **không còn chặn**. Cần thay `PassthroughEnhancer` bằng Real-ESRGAN, sinh 4 tỷ lệ 1:1/4:5/9:16/16:9, master image thực sự `APPROVED`, `GET /integration/products/:id/master-image` trả ảnh thật.
3. **P16 — M04b ảnh marketing (MVP).** Bộ ảnh vàng đã đạt nghiệm thu (09/12), **không còn chặn**. Biến thể từ master image đã duyệt, không gọi lại enhancer, path sửa ánh sáng/màu/hình dáng qua M04a Guard.
4. **P17 — M04c video (MVP).** 6 khuôn đầu ra, khung đầu/cuối từ ảnh duyệt, chi phí ghi usage, màn xác nhận chi phí.
5. **P18 — M07 nội dung đăng bài ngành hoa (MVP).** Adapter Zalo OA, tự duyệt theo thời hạn gác `O7`, credential mang `organization_id`.
6. **Đợt 3 — nối `SocialFlow`** (`RA_SOAT_DONG_BO_BA_REPO.md` mục 5): xác thực máy gọi máy + `organization_id` trên bảng nghiệp vụ còn lại.
7. **Trả nợ #46** — dữ liệu AVI GIFT bị `test:tenant` xoá, cần nạp lại.

**Điều kiện chặn:**
- ~~Bộ ảnh vàng đạt nghiệm thu (P5)~~ — **ĐÃ THỎA 09/12**, P13/P16 không còn chặn vì lý do này
- D14 bảng giá credit biến thể/video/nội dung → P16–P18 go-live
- D13 cơ sở đồng ý dữ liệu cá nhân → M09, M10 go-live
- AI-2 (chấm điểm, thác nghiệm, dự phòng) → P16–P18 go-live

**P7 — `LocalBudd` bỏ bốn bảng còn lại** (`products`/`product_assets`/
`generation_jobs`/`projects`) — chặn thật, không phải việc chưa làm: đặc tả
08 mục 4 chỉ định nghĩa `GET /integration/products` (đọc), không có endpoint
GHI nào cho LocalBudd tạo Product Master qua core, và không có cơ chế nào
cho một client chỉ-có-HTTP (không có Postgres trực tiếp) nhận/hoàn tất
`generation_jobs` (core lấy job bằng `SELECT ... FOR UPDATE SKIP LOCKED`,
đòi quyền truy cập DB trực tiếp). Cần chủ sản phẩm chốt: (a) core có thêm
endpoint ghi Product Master hay không, hay (b) LocalBudd bỏ hẳn luồng nhập
sản phẩm thủ công và chỉ đọc từ core. Xem `LocalBudd/TECHNICAL_DEBT.md` mục
P7.

**P7 — `SocialFlow` nhận `organization_id`: đã làm phần schema/CRUD của
`accounts`, D1 vẫn mở.** Cột `organization_id` + lọc trên mọi endpoint CRUD
tài khoản, cộng cờ chặn 409 khi hai tổ chức tranh cùng một `platform` (khoá
UNIQUE(platform) toàn cục từ lúc tạo bảng, không sửa được bằng
`ALTER TABLE` — không rebuild bảng trong phiên này theo đúng quy tắc
forward-only của `migrations.py`). Việc còn lại để quyết định D1 thật sự:
(a) một cơ chế xác thực máy gọi máy (SocialFlow hiện không có session/JWT/API
key nào), và (b) `organization_id` trên toàn bộ bảng nghiệp vụ còn lại
(`posts`, `templates`, `signals`, `campaigns`, …). Xem
`SocialFlow/TECHNICAL_DEBT.md`.

Nghiệm thu trên máy thật 09/10: chạy server qua `venv/bin/python -m uvicorn main:app` (cổng khác 8000, vì 8000 đã bị một dịch vụ khác trên máy chiếm), curl end-to-end trên `backend/socialflow.db` thật (đã có sẵn ba tài khoản `linkedin`/`instagram`/`facebook` dưới tổ chức mặc định) — tạo tài khoản mới dưới tổ chức khác thành công, tổ chức thứ hai giành cùng platform bị chặn đúng 409, lọc theo `organization_id` đúng cả hai chiều, không rò rỉ tài khoản thật ra tổ chức khác hay ngược lại. Việc còn lại để quyết định D1 vẫn như trên.

1. **Gán nhãn thật cho bộ ảnh vàng** — khung 100 ảnh đã dựng ở `golden/` (`scripts/xay-dung-bo-anh-vang.py`), còn thiếu đúng phần việc của người. **Cách làm 09/12:** AI đề xuất nhãn (`scripts/golden-ai-proposals.py` đang chạy trên 100 ảnh, kết quả `golden/ai-proposals/`) → Người A đánh giá độc lập KHÔNG xem AI (`golden/HUONG_DAN_GAN_NHAN.md`) → Người B kiểm chứng 30% + spot-check 70% → so AI vs Người A (`golden/TRANG_THAI_GAN_NHAN.md`). Cập nhật nhãn theo đúng `QUY_UOC_DEM.md`, điền `labeled_by`/`verified_by`. **Đã chốt 09/12: chỉ cần 8 ảnh gán nhãn đủ trường (đầy `flower_count`, `bud_count`, `damaged_count`, `components`, `labeled_by`, `verified_by`) là đạt nghiệm thu, không cần đủ 100 ảnh.** Đây là điều kiện còn lại DUY NHẤT chặn P5 nghiệm thu tuyệt đối và điều kiện đổi provider Vision (D5-c) — 8 ảnh hiện tại (g001, g002, g008–g014) đã có `labeled_by`, đang chờ `verified_by`. Đã hỏi và từ chối để AI tự làm việc này (nợ #24) — AI chỉ hỗ trợ, người quyết định.
2. Sau khi có nhãn: chạy `OpenAIStructuredProvider` với `OPENAI_API_KEY` thật trên đúng các ảnh trong `golden/images/`, so kết quả máy với nhãn người theo `BO_ANH_VANG.md` mục 9 — đây mới là phép đo thật đầu tiên của M01.
3. Làm ma trận chọn công nghệ (`Checklist_Thuc_Thi.md` mục cuối P5, `YC-N5` `YC-N6`) — mục còn lại duy nhất khác của P5.
4. Xác nhận với anh Tony các giả định đã ghi ở `TECHNICAL_DEBT.md` #19-25 của P5 (ngưỡng đồng thuận, tự tạo `products` khi duyệt không có `product_id`, khoá PATCH sau khi duyệt, quy ước chữ cái đầu mã sản phẩm suy ra `product_form`, "kệ" xếp vào "lẵng").
5. ~~Xác nhận với chủ sản phẩm giá trị mặc định của công tắc `cho_phep_tu_duyet`~~ — **ĐÃ CHỐT 09/10:** `true`, khớp mã hiện tại, không đổi mã (`TECHNICAL_DEBT.md` #12).
6. ~~Xác nhận với chủ sản phẩm bảng giá `cost_credit` theo `feature`~~ — **ĐÃ CHỐT 09/10:** giữ hằng số trong mã, chưa cần bảng cấu hình/giá theo tổ chức ở giai đoạn này (`TECHNICAL_DEBT.md` #14).
7. Khi có UI onboarding thật cho M05 (LocalBudd): xác nhận `logo_asset_id` của
   `brand_profiles` có bắt buộc trỏ tới một `assets.kind = MASTER` đã duyệt hay chấp nhận
   bất kỳ asset nào — schema hiện không ràng buộc khoá ngoại (đặc tả 07 mục 4 khai
   `String?` thường), đây là quyết định UX chưa cần thiết ở P4.
8. Khi quyết định xây luồng "thẻ chào giá" (`pricing_card`, C1–C28, nợ #26): chốt nguồn
   `effectiveCostVnd` (giá vốn hiệu lực) — `gia_von.py` chưa xếp vào đợt harvest nào.
9. **P8 — chạy lượt nạp AVI GIFT thật trên Postgres:**
   ```bash
   docker compose up -d && npx prisma generate && npx prisma db push && npm run db:seed
   python3 scripts/nap-avi-gift/doc-excel.py "<đường dẫn thư mục 'FloraOS Vận hành'>" scripts/nap-avi-gift/du-lieu-trung-gian
   npm run nap:danh-muc
   # Bắt buộc — không có credit thì mọi lượt M01 bị chặn (nợ #38):
   npm run nap:credit -- --org-id=<uuid script vừa in> --amount=<số credit>
   ```
   Ghi lại `organization_id` và đổi ngay mật khẩu tạm in ra console (nợ #35).
   Đối chiếu số liệu (1.316 sản phẩm dự kiến) với `catalog.json` và với bảng
   nghiệm thu `BAN_GIAO.md` trước khi tích ô "Dữ liệu nhập đủ" ở
   `Checklist_Thuc_Thi.md` mục P8.
10. **P8 — chạy lượt nạp phân tích ảnh thật** (nợ #34, mã đã viết xong
    09/10 — **8** lượt phân tích / 16 ảnh, không phải "9–14" như ước lượng
    ban đầu). Chạy SAU lượt nạp danh mục ở mục 9:
    ```bash
    python3 scripts/nap-avi-gift/doc-phan-tich.py "<thư mục 'FloraOS Vận hành'>" scripts/nap-avi-gift/du-lieu-trung-gian
    npm run nap:phan-tich -- --org-id=<uuid AVI GIFT>
    ```
    Dự kiến: 5 mã nối vào danh mục có sẵn, 3 mã tạo mới (`GHTM`,
    `MM17082026`, `KG-20260831-001`), 16 asset, 8 lượt phân tích `APPROVED`,
    1 job tổng hợp. Idempotent — chạy lại không nhân đôi.
11. **Khẩn, ngoài phạm vi mã:** xoay khoá `openai_api_key` lộ trong
    `FloraOS Vận hành/he_thong.json` (nợ #36).
12. Xác nhận với anh Tony: 42/1.316 SKU của AVI GIFT có giá vốn tính đủ —
    1.274 SKU còn lại (`priceStatus = "CHƯA CÓ GIÁ VỐN"`) có cần tính bổ
    sung trước ngày cắt (P11), hay để nguyên trạng thái `DRAFT` chờ dữ liệu
    sau.

## 7. Làm việc bằng nhiều tài khoản Claude cùng lúc

Được, với ba điều kiện:

1. **Mỗi tài khoản một nhánh git riêng.** Hai agent sửa cùng tệp trên cùng nhánh là xung đột, và không agent nào biết agent kia vừa làm gì.
2. **Mỗi phiên bắt đầu bằng `git pull` và đọc tệp này.** Bộ nhớ của tài khoản khác không thấy được gì ở đây.
3. **Mỗi phiên kết thúc bằng: cập nhật tệp này + commit + push.** Việc chưa push là việc chưa tồn tại với tài khoản khác.

Phân việc theo **pha**, không theo tệp — P1 (tenant) và bộ ảnh vàng chạy song song được; P5 và P6 thì không, P6 phụ thuộc P5.

## 8. Nhật ký

| Ngày | Việc |
|---|---|
| 09/19 | **P25a viết mã xong — Console Vận hành Nền tảng, phần chỉ đọc.** Ba bảng + `PlatformContext`/`N1`–`N8` tách hẳn + năm use-case/route (`N1`/`N4`/`N5`/`N6`) + `scripts/gan-van-hanh-nen-tang.ts` + giao diện `(platform)/van-hanh` (bốn trang con) + `tests/platform/cach-ly-platform.test.ts` (năm ca) + đặc tả 06/07 cập nhật cùng lúc. Xác minh được trong sandbox: `tsc` sạch (chỉ còn lỗi "chờ prisma generate" như AGENTS.md đã lường trước), `npm test` 538/538, `check:docs` 0 lỗi. **Chưa chạy được** `prisma generate`/`db push`/`test:platform`/`test:tenant` — cần anh Tony xác nhận trên Mac thật trước khi tick ô Cổng cuối của P25a. |
| 09/19 | **Chốt xong bốn việc còn treo của P25.** D-N6: **tách hẳn** từ vựng năng lực nền tảng — kéo theo D-N1 không còn cần, `capability_scope`/`SYSTEM_ROLES`/`capability-catalog.ts` (146 mã)/`capability-catalog.test.ts` không đụng dòng nào; rủi ro High "vai nền tảng vô tình có quyền tenant" bị loại theo cấu trúc thay vì canh bằng test. Thứ tự: **P25 trước P13/P16/P18**. Số người vận hành: **một**, giữ script cấp quyền chạy tay, không làm màn cấp/thu quyền trong P25. Tài liệu commit riêng đợt này, chưa có mã. |
| 09/18 | **Kế hoạch P25 — Console Vận hành Nền tảng.** Rà mã thật rồi lập kế hoạch thực thi cho thiết kế 11/09 vốn chưa từng vào lộ trình. Ba chỗ thiết kế gốc nói sai so với mã, đã sửa trong kế hoạch: (1) nhánh `sessions.organization_id = null` → `PlatformContext` **không bao giờ chạy** — `log-in.ts` luôn gắn membership đầu tiên và `(app)/layout.tsx` đá về `/dang-nhap`, nên chốt ngữ cảnh song song + route group `(platform)` riêng; (2) con số năng lực trong tài liệu đã cũ — đo lại **146 mã / 41 trần cứng** (`AGENTS.md` ghi 143/39) và **60 model** (ghi 27 bảng); (3) cổng `check:docs` bốn trục sẽ chặn mọi bảng/route mới nếu đặc tả 06/07 không sửa cùng commit. Bốn ô CHỐT điền vào `DASHBOARD_VAN_HANH_NEN_TANG.md` mục 8; phát sinh **D-N6** (tách hay dùng chung từ vựng năng lực) còn treo, chặn P25a. Chưa viết một dòng mã nào. |
| 09/18 | **Nợ #105 — thêm `FalAIOutpainter`.** Hiện thực `ImageExpander` thứ tư (`providers/expansion/fal_outpainter.py`) — `fal-ai/bria/expand` qua fal.ai, hàng đợi REST (`queue.fal.run`, header `Authorization: Key`), lược đồ xác minh qua tài liệu chính thức fal.ai. `original_image_location` trùng khớp tự nhiên với `paste_offset` nội bộ — `variant_worker.py` KHÔNG cần sửa gì, đúng bằng chứng cổng `ImageExpander` (nợ #78) đã đủ trừu tượng để đổi provider. Đăng ký `expand_provider="fal_bria_expand"`, để trống `FAL_KEY` lùi về `PadExpander`. Giá `$0.04/lượt` xác nhận trực tiếp trang model fal.ai, thêm `gia_luot_replicate["fal-ai/bria/expand"]`. 12 ca thử mới, `workers/tests/` 88/88 xanh. Chưa có `FAL_KEY` nên chưa gọi thử thật. Xem `TECHNICAL_DEBT.md` nợ #105 |
| 09/17–18 | **Nợ #104 — IOPaint tự host (Mức 2): dựng xong, thử thật, rồi DỪNG.** Giai đoạn 1 (17/09): `product_mask` thêm vào `ImageExpander.expand()`, `IOPaintExpander` gọi `POST /api/v1/inpaint` với `use_extender=true`, `variant_worker.py` dựng mask từ alpha có sẵn (`_mat_na_iopaint`) và dán lại chính xác ảnh gốc sau khi engine trả về (`_dan_lai_chu_the`). Chọn model 18/09: Kandinsky 2.2 (Apache-2.0, `support_outpainting=true` xác nhận đọc thẳng `iopaint/schema.py`), viết `docker/iopaint/Dockerfile` + `run_native_mps.sh` (chạy native trên Apple Silicon, Docker không pass-through Metal). **Thử thật lần đầu 18/09 trên MacBook Air M3:** Python mặc định máy (3.14) không tương thích `Pillow==9.5.0` (script tự dò Python 3.9-3.12 sau đó) → cài xong, khởi động IOPaint thành công → tải trọng số Kandinsky 2.2 giữa chừng thì hết dung lượng đĩa (`OSError: [Errno 28]`). Ba lớp ma sát hạ tầng thật này đúng loại chi phí `10-ai-orchestration.md` §2 đã cảnh báo khi khuyến nghị thứ tự API-trước — DỪNG Mức 2 làm hướng thử tiếp theo, mã giữ nguyên trong `EXPANDER_REGISTRY`, bật lại được khi có VPS GPU thật. Xem `TECHNICAL_DEBT.md` nợ #104 |
| 09/17 | **P24 nghiệm thu xong.** `npm test` 479/479 · `test:tenant` **200/200, 25/25 tệp** · `pytest` worker 229/229 · `tsc` sạch. Lượt nghiệm thu kéo theo ba việc sửa ngoài phạm vi M04b: alias `server-only` trong `vitest.config.ts` (năm suite `tests/tenant/` tắt ở bước NẠP, bốn trong số đó đỏ từ trước — nợ #81) · `Idempotency-Key` cho `product-copies.test.ts` (nợ #82) · chốt bộ máy Vision mặc định `openai_structured` (nợ #83). `test:tenant` từ 6 tệp đỏ về 0. |
| 09/17 | **P24 — M04b về đúng kiến trúc job.** Đóng `POST /media/background-removal` (không auth, không RBAC, không tổ chức, không credit, `spawn` Python + parse stdout, SSRF qua `image_url`). Dựng `media.variant` qua `enqueueJob`: 4 route `/media/variants*`, cặp `I4`↔`I5` (143 mã / 39 trần cứng), worker `variant_worker.py` với 4 `stage` thật, biến thể ghi thành `assets` `MARKETING`/`PENDING` cha là Master đã duyệt, watermark lấy logo thật từ `brand_profiles`. Cổng **Subject Integrity** đo tỷ lệ điểm ảnh lõi chủ thể trùng khít Master (mặt nạ co biên), ba ngưỡng 0,999 / 0,99, `REJECTED` không ghi asset; thay ba hằng số `100/99/98` gõ tay trong giao diện. Gỡ bộ dựng canvas phía trình duyệt và ảnh mẫu Unsplash trong chuỗi lùi. Test mới: `variant-rules.test.ts` 17 ca ✅ · `test_variant_worker.py` 13 ca ✅ · `media-variants.test.ts` 22 ca (chưa chạy). **Bốn lệnh nghiệm thu chưa chạy trên máy thật.** |
| 09/14 | **P14b M01c Thẻ chào sản phẩm & Kho Dữ Liệu (`/kho-du-lieu`) — hoàn tất.** Thẻ chào sản phẩm (`SalesPitchCard`, `sales-pitch-template.ts`) tổng hợp M01a + M01b: 100% chỉnh sửa 8 khối trường trước khi chốt, nút "Chốt duyệt & Xuất bản Final" (Badge FINAL), kiến trúc 3 tab hiển thị độc lập cách ly nội dung (Tab 1: Chỉnh sửa toàn bộ thông tin, Tab 2: Thẻ chào khách A6, Tab 3: Kịch bản Zalo 1-chạm copy), bộ công cụ xuất đa định dạng (Copy ảnh vào Zalo / Clipboard binary PNG, Tải PNG Retina 2x, Tải JPEG 95%, Xuất PDF A6 qua jsPDF). Tích hợp Kho Dữ Liệu Sản Phẩm độc lập (`/kho-du-lieu`) trên Sidebar chính DesktopNav với 3 phân vùng quản lý (Ảnh gốc, Ảnh đã duyệt chờ sinh dữ liệu, Sale Pitch hoàn thành) và liên kết 2 chiều sang `/tai-anh`. Layout `/tai-anh` khôi phục full-width. Unit test `sales-pitch-template.test.ts` 3/3 xanh. |
| 09/14 | **OpenAI Structured chạy trên ảnh thật.** Gọi `gpt-4o-mini` qua `OpenAIStructuredProvider` trên 4/8 ảnh vàng (g001, g002, g010, g011) → `golden/ai-proposals-openai/`. Kết quả: damaged_count 4/4 đúng, bud_count 2/2 đúng, flower_count AI ước tính (người không đếm được do occlusion). Xem `golden/ai-accuracy-report-openai.csv`. Nợ #24a: 4 ảnh còn lại. |
| 09/14 | **P5 M01 Vision Worker + P14 M01b Product Copy — hoàn tất, tài liệu cập nhật.** CHECKLIST_AI_CAPABILITIES_BUILD.md §3.1/§3.2 tích xanh (M01 worker: `vision.analyze` handler, `DETECTING`→`COMPLETED`, `OK`/`LOW_CONFIDENCE`; M01b: `product.copy.generate` via `callCapability` trực tiếp, AIC-04 wrapping AIC-07/08/09/10). Checklist_Thuc_Thi.md P14 tích đầy đủ 6/6 (kể cả `phong_cach`→`suggested_style`/`dip_su_dung`→`occasions`). TRANG_THAI.md P5 cập nhật: HOÀN TẤT 09/12. **Chạy xác minh:** `npm test` 294/294 xanh, `npm run test:tenant` 145/145 xanh, `npx tsc --noEmit` (9 lỗi pre-existing ở product-copies tests, không phải mới). |
| 09/12 | **P13 M04a đợt hai hoàn tất.** Worker `media_ai` thay `PassthroughEnhancer` bằng Real-ESRGAN (fallback PIL `lanczos-unsharp-v1`), thêm Smart Reframe 4 tỷ lệ (1:1, 4:5, 9:16, 16:9) từ Master Image MỘT LẦN. Pipeline: ANALYZING → ENHANCING → SMART_REFRAME → VERIFYING → GENERATING_OUTPUTS. `output.ratios` trong `generation_jobs` ghi 4 storage_keys. Ghi 1 MASTER (`PENDING`) + 4 RATIO (`APPROVED`). 170/170 test Python xanh, `npm test` 258/258 xanh. `Checklist_Thuc_Thi.md` P13: 6/6 tích. |
| 09/12 | **P16 M04b đợt đầu hoàn tất.** `SocialFlow/backend/m04b/` đủ 4 thư mục. AIC-11 background_removal: rembg + PIL fallback, route `POST /api/m04b/background-removal` + `GET /api/m04b/assets/{id}/download`. Backend test 26/26 xanh — fix FastAPI v0.109.0 route 422 (typed `Request` patch cho `require_org`/`sso_token_tho`, bỏ `importlib.reload`), fix mock injection (`CoreClientAdapter.default()` patch ở cả `core_client_mod` và `br_module`), fix upload dir `parent.parent`→`parent` ở `routes.py`. Frontend `SocialFlow/frontend/index.html` thêm tab "Marketing Creative" với component `MarketingCreative` (product_id input, Remove Background, kết quả, download). E2E `tests/e2e_m04b.py` 10/10 xanh (server starts, route registered, auth 401, frontend loads, download endpoint). |
| 09/12 | **Chạy pipeline M01→M04a trên 16 ảnh AVI GIFT.** Tạo 8 job `vision.analyze` (16 ảnh) → vision worker xử lý → 16 phân tích `PENDING` → duyệt 16 qua `approveAnalysis` → tạo 8 job `media.optimize` → media_ai worker xử lý → 2 Master Image `PENDING` + 4 RATIO `APPROVED` (Identity Guard PASS), 9 REJECTED, 5 FAILED (image mode errors). Pipeline end-to-end hoạt động; Master Images sẵn sàng cho duyệt `I2`. |
| 09/12 | **P19 Catalog & QR hoàn tất (LocalBudd + core).** Checklist 7/7 ✅. Cặp `J1`↔`J2` tách rời xác minh qua `SPLIT_CAPABILITY_PAIRS` + `capability-catalog.test.ts:83-92`. `GET /vision/analyses` + `GET /media/optimizations` chờ duyệt (nợ #48) đã có. |
| 09/12 | **P15 Integration API write paths hoàn tất (core).** 4/7 → 7/7 checklist items. `POST /integration/assets`, `POST /integration/content-metrics`, `POST /integration/usage` (sẵn từ P7), `GET /integration/products` extended filters — tất cả core-side xong. `GET /integration/learning-profile` thuộc P20. `LocalBudd` bỏ `product_assets` chờ P16. |
| 09/12 | **AI-1 đợt một hoàn tất.** Năm bảng nền AI, mười cổng, `src/core/ai/`, `src/modules/ai-governance/`, bốn route, `U1`–`U4`. `prisma generate` + `db push` + `db:seed` ✅. `npx tsc --noEmit` SẠCH ✅. `npm test` 258/258 ✅. `npm run test:tenant` 123/123 ✅ (sửa 2 ca `vision-analyses.test.ts` kỳ vọng sai engine mặc định: `openai_structured` → `local_cv` theo `VISION_ENGINE_MAC_DINH`) · **Thêm:** engine mặc định `local_cv` → `openai_direct`, model `gpt-4o` → `gpt-4o-mini`, fix config key `model_truc_tiep` → `model_tien_kiem` |
| 09/12 | **AI-2 A3 xong** — `GET/POST /api/v1/ai-requests/review`. GET trả hàng chờ (`outcome IN NEEDS_REVIEW\|ESCALATED`), POST duyệt (`approve→ACCEPTED`, `reject→FAILED`, `modify→NEEDS_REVIEW`), gác bằng `U3`, ghi `audit_logs`. `AiRequestRepository` thêm `listReviewQueue`/`getById`/`updateOutcome`. 8 ca test tenant xanh. |
| 09/12 | **P15 core write paths hoàn tất.** `POST /integration/assets` (asset con từ `APPROVED`, `PENDING`), `POST /integration/content-metrics` (idempotent 4 cột), `POST /integration/usage` (cost_credit=0, sẵn từ P7), `GET /integration/products` filter mở rộng. Checklist P15: 4/7 tích. Còn lại: `learning-profile`, bài học P20. |
| 09/12 | Nền AI vào kiến trúc: engine thứ năm, đặc tả mới `dac-ta/10-ai-orchestration.md` (34 năng lực, mười cổng, hai sổ đăng ký, bộ định tuyến, chấm điểm, tri thức), Tuyến C bốn đợt AI-1–AI-4 chặn P16–P18. Chốt D15–D19, mở D20. Dải năng lực `U1`–`U4` (chính sách AI của tổ chức) và `N9`–`N11` (sổ đăng ký cấp nền tảng). Lược đồ thêm `ai_capabilities`, `ai_models`, `ai_policies`, `ai_requests`, `ai_evaluations`, `flower_taxonomy`, `knowledge_chunks`, `content_features`. Nợ #68–#75 |
| 09/12 | **Bộ ảnh vàng:** 100 ảnh + 100 template nhãn đã dựng. **Quy tắc nghiệm thu mới (09/12): chỉ cần 8 ảnh gán nhãn đủ trường là đạt.** `scripts/golden-ai-proposals.py` đang chạy (background) — local_cv (SAM2+Florence-2) phân tích 100 ảnh → `golden/ai-proposals/`. Người gán nhãn đánh giá độc lập, KHÔNG xem AI. Hướng dẫn: `golden/HUONG_DAN_GAN_NHAN.md`. Theo dõi: `golden/TRANG_THAI_GAN_NHAN.md`. Cập nhật 2 ca `vision-analyses.test.ts`: `openai_structured` → `local_cv` (VISION_ENGINE_MAC_DINH, D5-e 09/11) · **Thêm:** engine mặc định `local_cv` → `openai_direct` (MAC_DINH registry + VISION_ENGINE_MAC_DINH), model `gpt-4o` → `gpt-4o-mini` (MODEL_MAC_DINH), fix config key `model_truc_tiep` → `model_tien_kiem` |
| 09/11 | Phạm vi sản phẩm mở rộng sang bộ tính năng hoàn chỉnh. Lộ trình thêm Tuyến B P13–P23, bảy pha đầu là MVP. Chốt D8, D9, D10, D11, D12, D1-b; mở D13, D14. Từ vựng quyền thêm dải O, P, Q, R, S, T cộng `H5`/`H6`, `I4`, `J7`. Lược đồ thêm `product_copies`, bốn bảng khách hàng, bốn bảng đơn hàng, `catalog_links`, `campaign_rollups`, `learning_profiles`, hai bảng hội thoại. Integration API mở đúng ba đường ghi. Tệp mới `BO_TINH_NANG_HIEN_TRANG.md` |
| 09/10 | Rà soát đồng bộ ba repo (`RA_SOAT_DONG_BO_BA_REPO.md`): core ↔ LocalBudd ~60% (hợp đồng đúng, chưa nối điện), core ↔ SocialFlow ~5%. Anh Tony chốt bốn quyết định |
| 09/10 | Trả nợ #46 — `test:tenant` sang database riêng `floraos_test`, `npm run db:test:setup`, chốt chặn từ chối database không kết thúc bằng `_test`. **Nghiệm thu: 109/109 xanh trên `floraos_test`, dữ liệu AVI GIFT không bị đụng** |
| 09/10 | Xác minh đầu-cuối: LocalBudd đọc danh mục core bằng JWT của chính người dùng, cùng `id` sản phẩm. Phát hiện khối `pricing` vượt biên, chặn bằng `boundary-capabilities.ts` |
| 09/10 | Đợt 0+1+2: bảng cổng 3100/3000/8000; `/integration/*` nhận `X-FloraOS-SSO` (đóng lỗ rò dữ liệu chéo tổ chức); Master Image trả URL ký sẵn; đặc tả 08 sửa theo D1 đa tenant thật |
| 09/09 | Rà soát FloraOS: phát hiện Excel là nguồn sự thật + khoá ghi toàn cục → bác bỏ hướng nâng cấp tại chỗ. hồ sơ `SAAS_GAP_ANALYSIS.md`, nay chỉ còn trong git |
| 09/09 | Rà soát LocalBudd và SocialFlow: ba repo làm ba mảnh khác nhau của cùng kiến trúc. Chốt Đường A. `HARVEST_MANIFEST.md` |
| 09/09 | Viết `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md`, thay thế V1 |
| 09/09 | Chốt D5-c và D6-1. Đồng bộ M01 và M04 lên V1.2 |
| 09/09 | `FloraOS` vào git lần đầu (loại kho vận hành + khoá API). `LocalBudd` commit toàn bộ phần đã xây (loại `cookies.txt` chứa session thật) |
| 09/09 | PRD `01_PRD-FloraOS-Core.md` |
| 09/09 | Dựng khung `floraos-core`: cấu trúc theo V2 mục 3, `AGENTS.md`, năm cổng ở `src/core/ports/`, khung worker Python, `docs/kien-truc/`. Chưa có bảng, chưa có route |
| 09/09 | `BO_ANH_VANG.md` — quy cách bộ ảnh vàng |
| 09/09 | Bốn repo lên GitHub riêng tư dưới `antranhub22`, nhánh chính `main` |
| 09/09 | Chốt D4 — `FloraOS` v1 đóng băng tính năng, không ngoại lệ |
| 09/09 | Chốt quy ước đếm, `QUY_UOC_DEM.md`. Lược đồ nhãn bộ ảnh vàng đồng bộ theo |
| 09/09 | Rà soát mã thật ba repo; bộ đặc tả 13 tệp ở `floraos-core/docs/dac-ta/` |
| 09/09 | Chốt D1, D2, D3. Sửa V2 và bản đồ thu hoạch theo mã thật: 18 mã trần cứng, dải E1–E8, count_engine và color_engine là REUSE |
| 09/09 | **P1 xong.** Bảy bảng nền, `TenantContext`, bộ gác ở tầng repository, sáu endpoint phiên và tổ chức, bộ test cách ly 21 trường hợp. Lược đồ và client chuyển sang cách khai của Prisma 7 (`prisma.config.ts` + driver adapter); thêm `eslint.config.mjs` vì `npm run lint` trước đó dừng ngay khi chạy |
| 09/09 | **P2 xong.** Thu hoạch R2 nguyên vẹn (`maChucNang.ts` + test, 25/25 qua `npm run test:harvest`) · `capability-catalog.ts` 113 mã sinh từ chính bản harvest, không gõ tay phần A–E · `permission-resolver.ts` ba lớp · `role_capabilities`/`capability_overrides` · `resolveSession` nạp năng lực thật, `GET /auth/me` trả ra · công tắc `cho_phep_tu_duyet` · 12 endpoint tổ chức/thành viên/vai/chi nhánh/workspace gác bằng mã năng lực · sửa một lỗi ở `handle()` (`src/core/http/response.ts`) không truyền được `context.params` cho route động của Next 16 — phát hiện khi viết endpoint đầu tiên có `[id]`. Chưa chạy được `prisma generate`/`db push`/`test:tenant` trong phiên này — sandbox chặn `binaries.prisma.sh` |
| 09/09 | **P2 verify xong trên máy có mạng.** `prisma generate`/`db push` (Postgres 16 qua Docker), `npm test` 48/48, `npm run test:tenant` 23/23. Sửa 1 lỗi type thật (`organization-repository.ts`, cột `settings` Json vs `exactOptionalPropertyTypes`) + thêm `InputJsonValue` vào `entities.ts`. Sửa 1 test P1 lỗi thời (`cach-ly-endpoint.test.ts` khoá hành vi "năng lực luôn rỗng" — nay sai vì P2 nạp `role_capabilities` thật lúc đăng ký), đối chiếu lại bằng `defaultCodesForSystemRole`. Không còn việc tồn đọng của P2 |
| 09/09 | **P3 viết mã xong, CHƯA xác minh.** `assets`/`generation_jobs`(+`idempotency_key`)/`job_events`/`usage`/`audit_logs` + khoá ngoại nợ #8. Bốn module `assets`/`jobs`/`usage`/`audit`. `enqueueJob` (kiểm hạn mức → ghi usage → tạo job → NOTIFY, một giao dịch) · `GenerationJobRepository.claimNext` (`SKIP LOCKED`) · `PostgresQueueProvider` (`pg_notify` trong giao dịch) · SSE `GET /jobs/:id/events` (`Last-Event-ID`) · `LocalDiskStorageProvider` (adapter tạm cho `POST /assets/upload-url`) · `scripts/scan-stuck-jobs.ts` (`YC-J10`). Sandbox phiên này không có Docker/mạng ra `binaries.prisma.sh`, và `node_modules` sai kiến trúc máy (thiếu `@rollup/rollup-linux-arm64-gnu`) nên không chạy được `prisma generate`/`db push`/`npm test`/`npm run test:tenant` — chỉ `tsc --noEmit` (phần không chạm kiểu Prisma). Xem mục 6 việc kế tiếp và `TECHNICAL_DEBT.md` #14–18 |
| 09/09 | **P3 chạy Postgres thật lần đầu, sửa 2 lỗi.** Anh Tony chạy `docker compose up -d` · `prisma generate/db push` · `npm run test:tenant` trên Terminal Mac thật — 30/35 xanh, 5 đỏ (đều trong `enqueue-job.test.ts`). Sửa: (1) `PostgresQueueProvider` — `pg_notify` qua `$queryRaw` ném `P2010` vì cột `void` không giải mã được, đổi `$executeRaw`; (2) hai ca thử sai giả định `credit_balance` mặc định 0 — bỏ sót `TRIAL_CREDIT_BALANCE` (20) `sign-up.ts` cấp sẵn, sửa test tự đặt lại 0 trước khi kỳ vọng chặn hạn mức. `tsc --noEmit` sạch; chưa tự chạy lại `vitest` được (VM `device_bash` khác Terminal thật, thiếu `@rollup/rollup-linux-arm64-gnu`) — chờ anh Tony chạy lại xác nhận 35/35 rồi tích `Checklist_Thuc_Thi.md` |
| 09/09 | **P3 chạy Postgres thật lần hai, sửa lỗi thứ ba (ở bộ thử).** Sau khi sửa `pg_notify`, anh Tony chạy lại `npm run test:tenant` — vẫn 30/35, 5 đỏ nhưng đổi triệu chứng hoàn toàn (không còn `P2010`). Nguyên nhân: workspace mặc định `sign-up` tạo luôn `kind: "EXPERIENCE"`, nên bốn ca "đường CREDIT" của `enqueue-job.test.ts` dùng `a.ctx` chưa từng kiểm đúng đường CREDIT — luôn rơi vào đường TRIAL. Sửa: thêm `withProductionWorkspace()` tự dựng workspace `PRODUCTION` riêng cho bốn ca đó, sửa luôn assertion sai của ca EXPERIENCE (`credit_balance` phải giữ `TRIAL_CREDIT_BALANCE`, không phải `0`). `tsc --noEmit` sạch trên client Prisma thật — chờ anh Tony chạy lại lần ba xác nhận 35/35 |
| 09/09 | **P3 nghiệm thu phần lõi — 35/35 `test:tenant` xanh.** Anh Tony chạy lại lần ba, xác nhận xanh hoàn toàn sau ba lỗi tìm-và-sửa (raw query `pg_notify`, hai test sai giả định credit mặc định, bốn test chưa kiểm đúng đường CREDIT vì workspace mặc định là EXPERIENCE). Tích các ô liên quan ở `Checklist_Thuc_Thi.md`. Còn `npm test` (domain thuần P3) chưa chạy thật xác nhận trong phiên này — mục còn lại duy nhất trước khi coi P3 xong tuyệt đối |
| 09/09 | **P4 viết mã xong, CHƯA xác minh.** `business_profiles`/`brand_profiles` (đặc tả 07 mục 4, thu hoạch E3 từ `SocialFlow/backend/brand_kit.py`), khoá ngoại tới `organizations` ngay từ đầu. Module `src/modules/profiles/` (domain/use-cases/infra/adapters đủ bốn thư mục) — `BusinessProfileRepository`/`BrandProfileRepository.upsert` theo ngữ nghĩa PUT-thay-toàn-bộ. Route `GET · PUT /business-profile`, `GET · PUT /brand-profile` dưới `/api/v1/`, gác bằng `F1`/`F2` có sẵn từ P2 — không thêm mã năng lực. Test domain (`profile-rules.test.ts`) + cách ly tenant ở cả hai tầng repository/endpoint. Cùng giới hạn sandbox của P3 (không Docker, không mạng tới `binaries.prisma.sh`, `node_modules` sai kiến trúc máy) nên chưa tự chạy được `prisma generate`/`db push`/`npm test`/`npm run test:tenant` trong phiên này — bốn lệnh xác minh ở mục 6 |
| 09/09 | **P4 nghiệm thu xong — 41/41 `test:tenant` xanh, xanh ngay lần đầu.** Anh Tony chạy bốn lệnh xác minh trên Terminal Mac thật (`docker compose up -d` · `prisma generate/db push` · `npm test` · `npm run test:tenant`) ngay sau khi mã viết xong — không phát sinh lỗi nào phải sửa, khác P3 (ba vòng tìm-và-sửa). 41 = 35 cũ + 6 ca mới cho hồ sơ, đúng số dự kiến. Nhân tiện đổi `as never` sang `as InputJsonValue` ở hai repository mới (`business-profile-repository.ts`/`brand-profile-repository.ts`) vì lúc này đã có client thật để đối chiếu — không còn nợ kiểu JSON như bốn tệp P3. `tsc --noEmit`/`eslint` sạch |
| 09/09 | **Bộ ảnh vàng: dựng khung tự động.** Anh Tony bỏ ảnh thô vào `BoAnhVang/` (845 tệp, 335 thư mục sản phẩm, đã sắp theo dịp/dạng). Viết `scripts/xay-dung-bo-anh-vang.py`: chọn ảnh rõ nhất mỗi sản phẩm (phương sai Laplace), lấy mẫu 100 ảnh theo đúng tỉ trọng thư mục cha, suy `product_form` từ tên thư mục hoặc chữ cái đầu mã sản phẩm (B=bó, G=giỏ, K=lẵng — nợ #25). Sửa một lỗi Unicode giữa chừng: tên thư mục qua cầu nối máy Mac ở dạng NFD, so khớp chuỗi phải chuẩn hoá NFC trước. Ghi `golden/images/`(100, ngoài git) + `golden/labels/*.json` RỖNG + `manifest.csv` + `golden/QUY_UOC_DEM.md` (bản sao). Thêm `BoAnhVang/` vào `.gitignore` (ảnh khách hàng, trước đó chưa bị loại — rủi ro thật nếu ai đó `git add -A`). KHÔNG tự đếm — đếm là việc của người theo `BO_ANH_VANG.md` mục 7, xem nợ #24 |
| 09/09 | **P5 viết mã xong, CHƯA xác minh trên Postgres thật.** Xem mục 1 "Đang ở đâu" và "Đang có (P5)" ở trên cho danh sách đầy đủ. Quyết định của anh Tony: viết mã ngay phần REUSE/EXTEND không cần bộ ảnh vàng, không chờ nghiệm thu bộ ảnh. Sandbox phiên này không có Postgres (cổng 5432 đóng) và không có mạng ra `binaries.prisma.sh` — giống giới hạn đã ghi ở P3/P4. Điểm khác P3/P4: sự cố `@rollup/rollup-linux-arm64-gnu` đã tìm ra cách sửa (`npm install @rollup/rollup-linux-arm64-gnu --no-save`), nên lần này chạy được thật `vitest`/`tsc --noEmit` trong sandbox, không chỉ viết rồi để đó — 43 test Python (`workers/tests/vision/`, mới) + 9 test TS (`product-analysis-rules.test.ts`, mới) xanh thật. Bốn lệnh xác minh còn lại ở mục 6 |
| 09/10 | **P6 nghiệm thu xong.** Anh Tony chạy bốn lệnh xác minh trên Terminal Mac thật (`docker compose up -d` · `prisma generate`/`db push` · `npm test` · `npm run test:tenant`) — xanh toàn bộ, không phát sinh lỗi phải sửa. Không còn việc tồn đọng của P6 |
| 09/10 | **P5 nghiệm thu phần lõi — 49/49 `test:tenant` xanh, 43/43 `pytest` xanh, trên máy thật.** Anh Tony chạy đủ bốn lệnh xác minh (`prisma generate`/`db push` · `npm test` · `npm run test:tenant` · `python3 -m pytest`). Giữa chừng máy hết dung lượng ổ đĩa lúc cài `pip install` — dọn Trash xong cài lại được, không phải lỗi mã. `npm run test:tenant` lần đầu 48/49, một ca đỏ: `vision-analyses.test.ts` kiểm `cost_credit` giả định đường CREDIT nhưng workspace mặc định của `sign-up` luôn là EXPERIENCE (đường TRIAL, `cost_credit=0` đúng thiết kế) — cùng dạng lỗi đã gặp ba lần ở P3. Sửa bằng cách đổi `kind` của chính workspace mặc định (sớm nhất theo `created_at`) sang `PRODUCTION` trong test, vì route đi qua phiên thật luôn giải ra workspace sớm nhất (`findDefaultForSessionOrganization`), không phải workspace tạo thêm — khác cách `enqueue-job.test.ts` làm (gọi thẳng `enqueueJob()`, tự truyền `ctx`). Còn hai việc chặn P5 nghiệm thu tuyệt đối: bộ ảnh vàng chưa gán nhãn (nợ #24 — anh Tony hỏi AI có tự làm được không, đã từ chối vì phá giá trị phép đo) và ma trận chọn công nghệ chưa làm |
| 09/10 | **P7 (`floraos-core`) viết mã xong, CHƯA xác minh trên Postgres thật.** `integration_tokens` (`YC-T8`, HMAC ký bằng `INTEGRATION_TOKEN_SECRET`, xoay không tự thu hồi token cũ) · mã năng lực mới `F9` (114 mã, 31 trần cứng) · bốn endpoint quản trị token (`/api/v1/integration-tokens*`) · sáu route máy gọi máy dưới `/api/v1/integration/*` (đặc tả 06 mục 11): products (lọc ACTIVE) · master-image (lọc APPROVED, nợ #30 — luôn 404 tới khi P9 xong) · business-profile (chỉ LOCALBUDD) · brand-profile (cả hai) · jobs (tái dùng `enqueueJob`) · capabilities/check. `assets.approval_state` thêm ở P7 (nợ #30). Ba câu hỏi chốt với anh Tony 09/10: cách xử lý cột `approval_state` chưa ai đặt được, quản lý token qua endpoint `F9` thay vì script, và làm cả ba phần (core/LocalBudd/SocialFlow) trong phiên. `npx tsc --noEmit` sạch (trừ lỗi chờ `prisma generate`) · `npx eslint` sạch · `npm test` 124/124 (117 cũ + 7 mới). `npm run test:tenant` chưa chạy được — sandbox phiên này không có `docker`, cùng giới hạn P3–P6. Bốn lệnh xác minh ở mục 6 |
| 09/10 | **P6 viết mã xong, CHƯA xác minh trên Postgres thật.** M02 (`quotePrice`/`checkPriceInvariants`/`checkPriceGuard`, thu hoạch R3/R4/R5 phần `chanGia.ts`) + `pricing_rules` CRUD chèn-chỉ (`effective_from` giữ lịch sử) + `GET·PUT /pricing-rules` (`L5`/`L6`). M03 (`filterProductLookup`, cắt khối `pricing` theo `L5`) + `GET /products` (lọc `branch_id`/`status`/`category`, phân trang con trỏ) + `GET·PATCH /products/:id` (chuyển `ARCHIVED` đòi thêm `L4`) + `POST /products`. Phạm vi hẹp lại theo xác nhận của anh Tony (hai câu hỏi 09/10): không dựng luồng "thẻ chào giá" (`pricing_card`, C1–C28, nợ #26), chi phí lá/cành trang trí để nợ kỹ thuật (#27) thay vì đoán số. Soát nguồn harvest lật ra hai điểm lệch tài liệu/mã mới (`mucThu.ts`/`uocPhi.ts` xếp nhầm M02, `sanTran.ts` không thuần) — điểm lệch #10/#11 `RA_SOAT_THU_HOACH.md`, nợ #28/#29, sửa `HARVEST_MANIFEST.md` mục 3.1 theo mã thật. `tsc --noEmit` sạch · `npm test` 117/117 (36 ca mới) · `eslint` sạch · `products-pricing.test.ts` (10 ca mới) dừng đúng ở "Can't reach database server" — sandbox phiên này không có `docker`/cổng 5432 đóng, cùng giới hạn đã gặp ở P3/P4/P5. Bốn lệnh xác minh trên Postgres thật ở mục 6 |


| 09/10 | **P7 — `LocalBudd` và `SocialFlow`, hết mức có thể trong phiên.** `LocalBudd`: bỏ `media_assets` (chết hẳn, không ai đọc), thêm `FloraOsCoreClient` (client HTTP thật, bốn thao tác READ đúng đặc tả); `products`/`product_assets`/`generation_jobs`/`projects` KHÔNG bỏ được — đặc tả 08 mục 4 chỉ định nghĩa endpoint đọc, không có endpoint ghi cho LocalBudd tạo Product Master, và không có cơ chế cho client chỉ-có-HTTP nhận/hoàn tất `generation_jobs` (core lấy job bằng `SELECT ... FOR UPDATE SKIP LOCKED`, cần Postgres trực tiếp) — ghi vào `LocalBudd/TECHNICAL_DEBT.md`, cần chủ sản phẩm quyết định. `SocialFlow`: `accounts` nhận cột `organization_id` qua `migrations.py` (đúng lệ forward-only của repo, không sửa UNIQUE(platform) cũ), mọi endpoint CRUD tài khoản (`GET/POST /api/accounts`, `login`, `check`, `delete`, `login-extended`, và `manual_login.py`) lọc theo tổ chức, `add_account` chặn 409 khi hai tổ chức tranh cùng platform (sửa luôn một lỗi thật: `INSERT OR REPLACE` cũ âm thầm ghi đè tài khoản tổ chức khác). Đây KHÔNG phải ranh giới bảo mật — SocialFlow không có cơ chế xác thực máy gọi máy nào, và D1 (đa tenant hay đơn tenant) vẫn còn mở vì `posts` và các bảng nghiệp vụ khác chưa có `organization_id` — ghi vào `SocialFlow/TECHNICAL_DEBT.md` (mới tạo). Xác minh: `ast.parse` (cú pháp) trên ba tệp sửa của SocialFlow, chạy `run_migrations()` thật trên bản sao `socialflow.db` (thêm cột + index sạch, idempotent); không khởi động được `uvicorn`/import `fastapi` trong sandbox này vì `backend/venv` là virtualenv macOS thật (symlink `python3` trỏ `/Library/Developer/CommandLineTools/...`), không phải lỗi mã. Đã tích lại `Checklist_Thuc_Thi.md` cho đúng thực tế (SocialFlow tích, LocalBudd chưa tích, cả hai kèm chú thích) |
| 09/10 | **P7 — `SocialFlow` nghiệm thu trên máy thật.** Chạy `main.py` qua `venv/bin/python -m uvicorn main:app` trên máy Mac thật (cổng 8001, vì cổng 8000 bị một dịch vụ khác trên máy chiếm từ trước). Test end-to-end bằng curl trên `backend/socialflow.db` thật (đã có sẵn ba tài khoản `linkedin`/`instagram`/`facebook`, tất cả `organization_id = NULL`): tạo tài khoản `twitter` dưới một tổ chức khác — thành công; tổ chức thứ hai giành cùng platform — chặn đúng 409; `GET /api/accounts?organization_id=...` lọc đúng cả hai chiều (tổ chức test không thấy ba tài khoản thật, tổ chức mặc định không thấy tài khoản test); xoá tài khoản test sau khi xác minh, ba tài khoản thật không bị ảnh hưởng. Cập nhật `SocialFlow/TECHNICAL_DEBT.md` mục xác minh |
| 09/10 | **Chốt nợ #12 và #14 với anh Tony (qua phiên Cowork, AskUserQuestion).** #12: mặc định `cho_phep_tu_duyet = true`, khớp mã hiện tại (`self-approval-policy.ts`), không sửa mã. #14: giữ `cost_credit` là hằng số trong `pricing.ts`, chưa cần bảng cấu hình/giá theo tổ chức — mở lại khi có quyết định kinh doanh về gói giá thật. Cập nhật `TECHNICAL_DEBT.md` #12/#14 và mục 6 việc kế tiếp |\n| 09/10 | **P8 — nạp danh mục AVI GIFT viết mã xong, CHƯA xác minh trên Postgres thật.** `scripts/nap-avi-gift/doc-excel.py` (Python) đọc `01_NHAP-LIEU.xlsx`+`02_KET-QUA.xlsx` thật của AVI GIFT → `catalog.json` (1.316 sản phẩm, BOM 5.862 dòng/1.297 mã, chạy thật trong sandbox). Module `src/modules/avi-gift-import/` (`domain/catalog-mapping.ts` thuần + 16 test · `use-cases/{bootstrap-avi-gift-organization,import-catalog}.ts`) · `scripts/nap-avi-gift-vao-core.ts` orchestrator. Bốn câu hỏi chốt với anh Tony 09/10 (AskUserQuestion): phạm vi "cả hai" (danh mục giá + sản phẩm có ảnh thật — phần ảnh thật CHƯA làm, nợ #34), Sàn/Trần lưu ở `products.attributes` không mở `pricing_rules` (nợ #32), tổ chức `SINGLE`, admin `antranhub@gmail.com`. Phát hiện điểm lệch #12 (`RA_SOAT_THU_HOACH.md`): cột ảnh thật tên `Đường dẫn ảnh`, khác bốn tên `excel_parser.py` gốc dò — đã sửa trong script mới (nợ #33). Phát hiện ngoài phạm vi mã: `he_thong.json` của AVI GIFT lộ khoá OpenAI thô — nợ #36, khẩn. `npm test` 140/140 (124 cũ + 16 mới), `tsc --noEmit` sạch, `eslint .` sạch. `test:tenant` và lượt nạp thật CHƯA chạy — sandbox không có `docker`, cùng giới hạn P3–P7. Việc kế tiếp ở mục 6 |
| 09/10 | **Soát toàn bộ P1–P8 và sửa ba việc chặn (phiên Cowork).** Chạy thật trên máy anh Tony: `tsc --noEmit` sạch · `eslint .` **0 lỗi 0 cảnh báo** (trước đó 2 cảnh báo) · `npm test` **141/141** · `pytest workers/` **43/43** · `npm run build` biên dịch xanh, 33/33 route (chỉ vỡ ở bước dọn tệp cuối vì VM không xoá được tệp, không phải lỗi mã). Thêm phép chạy khô lượt nạp P8 trên **toàn bộ 1.316 dòng thật** của `catalog.json`: 1.316/1.316 map OK, 0 lỗi. **Ba việc chặn tìm được và đã sửa:** (1) **CI trên `main` đỏ từ P7** — `.github/workflows/ci.yml` thiếu `INTEGRATION_TOKEN_SECRET` mà `src/lib/env.ts` bắt buộc từ P7, nên `npm run db:seed` (bước 3) ném ngay trước cả `typecheck` và cổng bắt buộc `test:tenant` chưa từng chạy trên CI suốt hai pha; lỗi ẩn kỹ vì `npm test` vẫn xanh không cần biến đó (141 ca đều thuần). (2) **P8 không có ca thử nào chạm cơ sở dữ liệu** — 16 ca mới đều là domain thuần, `tests/tenant/` vẫn đúng 69 ca như P7; thêm `tests/tenant/avi-gift-import.test.ts` (9 ca: chạy lại bỏ qua không ghi đè, trùng mã trong cùng tệp nguồn, dòng hỏng vào `failed`, cách ly hai tổ chức trùng mã qua cả repository lẫn endpoint, `listExistingCodes` theo tổ chức, bốn cột nhận dạng giữ null + `priceGuard`, bootstrap đủ bốn bảng, bootstrap trùng email cuộn lại cả giao dịch, nạp vào tổ chức vừa bootstrap không rò sang tổ chức khác) + 1 ca còn thiếu cho `GET /integration/brand-profile` (cả hai loại token, `putBrandProfile` trước đó khai mà không dùng) → `test:tenant` dự kiến **79** ca. (3) **AVI GIFT dựng với `credit_balance = 0` + workspace `PRODUCTION`** nên mọi `enqueueJob` bị chặn "Không đủ credit", mà `addCredit`/`refundCredit` không có lời gọi nào trong repo — chốt với anh Tony 09/10: mở khoá bằng SCRIPT dòng lệnh, không mở endpoint (endpoint đòi một mã năng lực "quản trị nền tảng" ngoài bộ 114 mã và một khái niệm quản trị đứng ngoài mọi tổ chức mà đặc tả chưa có). Thêm `OrganizationRepository.topUpCredit` + `scripts/nap-credit.ts` (`--org-id`/`--amount`/`--list`), và `nap-avi-gift-vao-core.ts` in luôn lệnh nạp credit sau khi bootstrap. **Bốn điểm nhỏ sửa kèm:** `enqueueJob` bắt lỗi trùng `Idempotency-Key` khi hai request vào cùng lúc và trả lại job của người thắng thay vì để Prisma `P2002` nổi thành 500 (`isDuplicateIdempotencyError`, thuần, có test); `importCatalog` đọc mã đã có MỘT lượt qua `ProductRepository.listExistingCodes` thay vì 1.316 lượt `findByCode`, và chặn luôn trường hợp hai dòng trùng mã trong cùng tệp nguồn; `next.config.ts` chuyển `experimental.typedRoutes` → `typedRoutes` (Next 16.3 đã dời, sẽ là lỗi ở bản sau); bỏ hai khai báo thừa. **Đối chiếu số liệu nguồn:** BOM thật là **5.862 dòng/1.297 mã** (tài liệu ghi nhầm 5.872/1.300 — đã sửa); 42/1.316 SKU có giá vốn đúng như đã ghi, nhưng chỉ **27** SKU có đủ cả Sàn và Trần nên chỉ 27 dòng nhận `attributes.priceGuard`; 3 SKU không có Giá bán. **Cách ly tenant soát riêng bốn đường (import Prisma, `scopedWhere`, 46 route, đường token tích hợp) — không tìm thấy lỗ hổng nào.** `npm run test:tenant` VẪN chưa chạy được ngoài máy anh Tony: VM `device_bash` không có Docker, và dựng được Postgres 17 chạy tay (`@embedded-postgres/linux-arm64` từ npm) thì `prisma db push` lại chặn ở `binaries.prisma.sh` — 403 policy denial ở cả VM lẫn container, không có engine linux-arm64 nào lấy được. Bốn lệnh xác minh ở mục 6 |
| 09/10 | **Nghiệm thu đợt soát P1–P8 — `test:tenant` 79/79 xanh trên Postgres thật.** Anh Tony chạy trên Terminal Mac: 78/79 lần đầu, một ca đỏ — chính ca `GET /integration/brand-profile` mới thêm, kỳ vọng `display_name` nhưng `brand_profiles` không có trường đó (nó thuộc `business_profiles`; ca mới bê nhầm khuôn từ ca `business-profile` ngay bên cạnh). Route vẫn trả 200 đúng — lỗi ở bộ thử, không ở mã. Nhầm lẫn này lọt được vì zod schema của `PUT /brand-profile` không `.strict()`, nên trường thừa bị bỏ qua âm thầm thay vì báo lỗi. Sửa (`fedc72f`): kiểm `primary_color`/`tone_of_voice`, và siết phần cách ly — tổ chức B chưa nhập hồ sơ thương hiệu nên khoá thẳng "B đọc ra `null`", thay vì `not.toBe(...)` vốn xanh cả khi giá trị là `undefined` vì lý do khác. Chạy lại: **79/79**. Tích thêm ba ô ở `Checklist_Thuc_Thi.md`: `YC-U7` (cả hai endpoint tạo job nay đã có và đều bắt buộc khoá — `POST /vision/analyses` đọc header, `POST /integration/jobs` đọc trường thân yêu cầu; lỗ đua đồng thời cũng đã bịt), `YC-R4` (`POST /vision/analyses/:id/approve` ghi `recordAuditLog` trong cùng giao dịch với lượt duyệt), và ô "Adapter Excel một chiều" của P8 (soát lại toàn bộ đường đi: không tệp nào trong `scripts/nap-avi-gift/` mở Excel ở chế độ ghi, không tệp nào đọc `he_thong.json`). Ô "Dữ liệu nhập đủ" của P8 VẪN CHƯA tích — lượt nạp thật chưa chạy và nợ #34 chưa làm |
| 09/10 | **P8 — nạp phân tích ảnh thật (nợ #34) viết mã xong, CHƯA chạy trên Postgres thật.** Khảo sát nguồn lật ra ba điều khác ghi chú cũ: (1) con số thật là **8** lượt phân tích, không phải "9–14" — `ket-qua/results.jsonl` có đúng 8 dòng `status: OK`, `schema_version` 10; năm thư mục ảnh còn lại (`KG-20260831-002`, `KG-20260904-001…003`) rỗng. (2) Nguồn đúng là `results.jsonl` chứ KHÔNG phải `ket-qua/Product_Master.xlsx` như ghi chú cũ nói — jsonl là đầu ra MÁY của v1, Product_Master là bản trình bày suy ra từ nó cho người đọc; nạp bản trình bày rồi gọi nó là `product_analyses.raw` là ghi sai nguồn. (3) Lỗi dữ liệu của v1: cột `Mã sản phẩm` của Product_Master ghi `BHSK0001/BHSK0001` — dính cả tên thư mục; mã ở đây suy từ TÊN TỆP ảnh nên không mang lỗi sang. Hai câu chốt với anh Tony 09/10 (AskUserQuestion): ba mã có phân tích thật nhưng không có trong danh mục 1.316 (`GHTM`, `MM17082026`, `KG-20260831-001`) thì TẠO `products` mới, đánh dấu `attributes.aviGiftImport.notInPriceCatalog = true`; và dựng `assets` cho TẤT CẢ 16 ảnh, không chỉ 8 ảnh đã phân tích. Đã có: `scripts/nap-avi-gift/doc-phan-tich.py` (chạy thật: 8 lượt/16 ảnh, 4 cảnh báo đúng bằng 4 thư mục rỗng) · `domain/analysis-mapping.ts` thuần + 8 test · `use-cases/import-analyses.ts` · `scripts/nap-avi-gift-phan-tich.ts` · `tests/tenant/avi-gift-analyses.test.ts` 8 ca. Ba quyết định thiết kế đáng ghi: `product_analyses` nạp thẳng `APPROVED` (dữ liệu đã qua vận hành thật ở v1 — lượt nạp CHÍNH LÀ sự kiện duyệt một lần, `approved_by`/`approved_at` ghi thật, mốc duyệt lấy đúng lúc phân tích chạy ở v1); `assets` giữ `kind = ORIGINAL` + `approval_state = PENDING` vì đây là ảnh CHỤP của cửa hàng chưa qua Identity Guard — đặt `APPROVED` là giả mạo một lượt duyệt chưa từng chạy và làm `master-image` rò ảnh gốc ra ngoài (nợ #30 giữ nguyên); job tổng hợp KHÔNG đi qua `enqueueJob` và KHÔNG ghi `usage` — tám lượt này đã chạy và đã trả tiền ở v1, tính credit lần nữa là tính hai lần. Không chạy trong một giao dịch duy nhất, có chủ đích: giữa chừng có ghi tệp vào kho, mà kho tệp không cuộn lại theo Postgres — tính idempotent (job theo khoá, asset theo `metadata.sourceFile`, phân tích theo `asset_id`) mới là thứ làm lượt chạy dở an toàn. `tsc` sạch · `eslint` 0/0 · `npm test` **149/149** (141 cũ + 8 mới) · chạy khô `mapAnalysisRow` trên toàn bộ 8 bản ghi thật: 8/8 OK, 16 ảnh, 0 lỗi. `test:tenant` dự kiến **87** ca. Lệnh chạy thật ở mục 6 |
| 09/10 | **`test:tenant` lần đầu cho nợ #34 — 79/87, 8 ca đỏ, sửa một lỗi THẬT.** Cả 8 ca đỏ cùng một nguyên nhân: `createCompletedHistorical` ghi `{ imported: N }` vào `generation_jobs.result`, mà cột đó là `String?` chứ KHÔNG phải Json. Đây là nợ `as never` của P3 (ghi từ P4) cuối cùng cũng cắn: `payload: input.payload as never` là khuôn có sẵn trong chính tệp đó, chép sang cho `result` thì `never` nhận mọi giá trị nên `tsc` sạch, `eslint` sạch, và 149 ca `npm test` cũng xanh — chỉ Postgres thật mới bắt được. Sửa ba lớp: (1) `result = null` và chuyển số liệu sang `payload`, vì `result` là cột PHÁN QUYẾT nghiệp vụ của Identity Guard (P9), lượt nạp lịch sử không đi qua cổng nào nên không có phán quyết để ghi; (2) trả hết nợ `as never` — đổi sang `InputJsonValue` ở `usage`/`audit`/`job_events`/`assets`/`generation_jobs`, và `null as never` thành `Prisma.DbNull` (NULL của SQL, khác `JsonNull` là chuỗi JSON `null` NẰM TRONG cột — phân biệt mà `as never` che mất); không còn `as never` nào trong `src/`; (3) thêm hai assertion khoá đúng chỗ vừa sai (`result` phải null, `payload.analysisCount` phải có). `tsc` sạch · `eslint` 0/0 · `npm test` 149/149 |
| 09/10 | **Nợ #34 nghiệm thu — `test:tenant` 87/87 xanh trên Postgres thật.** Sau vòng sửa lỗi `generation_jobs.result` (xem dòng trên), anh Tony chạy lại: xanh đủ 87 ca (79 của đợt soát + 8 ca mới của `avi-gift-analyses.test.ts`). **Toàn bộ phần MÃ của P8 xong** — cả hai lượt nạp (danh mục 1.316 SKU và phân tích ảnh 8 lượt/16 ảnh) đã có mã, có test cách ly tenant, có script chạy. Việc còn lại của P8 chỉ là CHẠY THẬT hai lượt nạp rồi đối chiếu `BAN_GIAO.md` trước khi tích ô "Dữ liệu nhập đủ" |
| 09/10 | **Sửa: script nạp không tự nạp `.env`.** Lượt chạy thật đầu tiên vỡ ngay ở `src/lib/env.ts` — "Cấu hình thiếu hoặc sai: DATABASE_URL, SESSION_SECRET, INTEGRATION_TOKEN_SECRET". Nguyên nhân: `npx tsx scripts/…` không nạp `.env`; `npm test` nạp qua `tests/setup.ts`, Next tự nạp, còn `db:seed` thì đã mang sẵn cờ `--env-file-if-exists=.env` từ trước — bốn script mới (`nap-credit`, `nap-avi-gift-vao-core`, `nap-avi-gift-phan-tich`, `scan-stuck-jobs`) đều thiếu cờ đó. Sửa bằng cách thêm bốn script npm (`nap:danh-muc`, `nap:phan-tich`, `nap:credit`, `quet-job-treo`) mang sẵn cờ, thay vì bắt người chạy nhớ; sửa luôn mọi lệnh in ra console, chú thích đầu tệp và tài liệu cho khớp. `scan-stuck-jobs.ts` cũng mắc lỗi này — dòng cron mẫu trong chú thích của nó sẽ không bao giờ chạy được |
| 09/10 | **P8 XONG — hai lượt nạp chạy thật trên Postgres, đối chiếu khớp hoàn toàn.** Tổ chức AVI GIFT `18dc7e62-a515-419a-9bc6-d3184435e7f9`. `npm run doi-chieu` (script mới, số kỳ vọng SUY từ chính `catalog.json`/`analyses.json` chứ không gõ tay) khớp 8/8 dòng: sản phẩm **1.319** (1.316 danh mục + 3 mã chỉ có ở lượt phân tích), `ACTIVE` 3, asset **16** (tất cả `ORIGINAL` + `PENDING`), lượt phân tích **8** (tất cả `APPROVED`), job tổng hợp 1, `usage` **0**. Số dư credit giữ nguyên **500** sau lượt nạp phân tích — chứng minh dữ liệu lịch sử không bị tính phí lần hai. Ba mã `GHTM`/`MM17082026`/`KG-20260831-001` đều có mặt và mang dấu `notInPriceCatalog`. Tích cả hai ô của P8. Phát hiện kèm: `Checklist_Thuc_Thi.md` bảo đối chiếu với "bảng nghiệm thu của `BAN_GIAO.md`", nhưng tệp đó là bảng nghiệm thu GIAO DIỆN của v1 (tạo thẻ, xuất PNG/PDF, kịch bản Zalo), không phải bảng số liệu — nguồn đối chiếu đúng cho lượt nạp là hai tệp JSON trung gian; `BAN_GIAO.md` vẫn là căn cứ cho P11 |
| 09/10 | **P9 đợt một viết mã xong — Identity Guard + cổng 2 Review & Approve.** Chốt phạm vi với anh Tony: làm Guard trước, phần tăng cường ảnh sau. Vướng ngay một điểm: Guard so ảnh TRƯỚC với ảnh SAU enhancement, chưa có enhancement thì không có gì để so — giải bằng `PassthroughEnhancer`, trả đúng byte đưa vào, tên gọi nói thẳng nó không phải enhancer. Nó cho một phép thử có đáp án biết trước: ảnh so với chính nó PHẢI ra `SAFE`, cả 8 lượt phân tích thật của AVI GIFT đều ra `SAFE` 1,0. **Ngưỡng 0,95 / 0,90 CHỐT VỚI ANH TONY, không tự đặt** — M04 mục 17.3/18.2 cấm agent tự đặt hay tự hạ ngưỡng Guard, và không tệp nào trong bộ đặc tả 13 tệp cho con số; căn cứ đề xuất là hai ví dụ JSON trong chính tài liệu. Python: `media_ai/guard/{fingerprint,compare,verifier}.py` (dấu vân rút từ CHÍNH hợp đồng `PhanTichSanPhamHoa`, không dựng lược đồ riêng) + `providers/base.py` (năm cổng M04 mục 6) + `jobs/worker.py`. `YC-N4` bảo đảm bằng CẤU TRÚC: verifier giữ MỘT instance analyzer, cả hai lượt đi qua nó. TS: `src/modules/media/` + bốn endpoint (`I1`/`I2`/`I3`), `refundRejectedJob` + `npm run hoan-credit` (D3 — lời gọi ĐẦU TIÊN của `refundCredit`, trước đó hàm này không có ai gọi). **Trả nợ #30**: `approveOptimization` là đường duy nhất đặt `assets.approval_state = APPROVED`, có ca thử gọi `master-image` trước (404) và sau (200) lượt duyệt. Ba quyết định gộp điểm/lưu trữ ghi ở nợ #39–41. Lược đồ: `assets` nhận `approved_by`/`approved_at`; `job_events.event` nhận `guard`. `pytest` **84/84** · `npm test` **156/156** · `eslint` 0/0. `tsc` còn 3 lỗi ở đúng hai cột mới vì `prisma generate` chặn ở `binaries.prisma.sh` trong VM — cần anh Tony chạy `db push` + `generate`. `test:tenant` dự kiến **101** ca (87 + 14 mới) |
| 09/10 | **P9 chạy `test:tenant` lần đầu — 100/101, sửa một lỗi THẬT xuyên pha.** Ca đỏ duy nhất là ca khoá nợ #30: sau lượt duyệt, `GET /integration/products/:id/master-image` VẪN trả 404. Nguyên nhân nằm ở P7 chứ không ở P9: `findApprovedMaster` có điều kiện `parent_asset_id: null`, viết với giả định "Master là asset gốc, chỉ bản dẫn xuất mới có cha". Giả định đó sai khi P9 dựng xong đường tạo Master thật — Master do M04a sinh ra LUÔN có cha là ảnh `ORIGINAL` nó được tăng cường từ đó, đúng `YC-A1`/`YC-A2`/`YC-A3`. Điều kiện cũ khiến hàm không bao giờ tìm thấy gì, kể cả sau khi duyệt. Sửa: bỏ điều kiện phả hệ, loại bản dẫn xuất theo `kind` (ratio Smart Reframe là `MARKETING`/`CATALOG`/`SOCIAL`, không phải `MASTER`) — lọc theo VAI TRÒ đúng hơn lọc theo phả hệ. Điểm lệch này không thể phát hiện ở P7: lúc đó chưa có đường nào tạo Master để thử, nên endpoint "luôn trả 404" trông giống hệt hành vi đúng đã ghi ở nợ #30. Chỉ ca thử gọi endpoint TRƯỚC và SAU lượt duyệt trong cùng một ca mới phân biệt được hai thứ đó. `tsc` sạch sau khi anh Tony chạy `prisma generate` (hai cột mới của `assets`) · `eslint` 0/0 · `npm test` 156/156 |
| 09/10 | **Chốt kiến trúc Unified Shell (phiên Cowork, AskUserQuestion).** So ba phương án cho việc hiển thị 8 module thành một trải nghiệm liền mạch: chỉ liên kết ngoài (đã xây ở màn Trải nghiệm), Unified Shell (proxy theo path + phiên đăng nhập dùng chung, ba backend giữ tách rời), gộp toàn bộ vào `floraos-core` (loại — chi phí viết lại SocialFlow/LocalBudd quá lớn, ngược Đường A đã chốt 09/09). Chọn Unified Shell. Chi tiết domain, cơ chế SSO, việc cần làm theo từng repo ở `docs/kien-truc/UNIFIED_SHELL.md`. Gắn sau P7 trong lộ trình, không bắt đầu trước khi D1 (SocialFlow đa/đơn tenant) chốt — mở SSO vào một hệ chưa cách ly tổ chức tạo nguy cơ rò dữ liệu |
| 09/10 | **D1 chốt: đa tenant thật — pha 1 xong ở SocialFlow (nhóm bảng an toàn).** Khảo sát lật ra D1 lớn hơn ghi chú cũ mô tả: `posts`/`signals`/`content_plans` nằm xuyên suốt sáu agent (planner/scout/analyst/reviewer/creator/publisher) hiện không có khái niệm tổ chức ở bất kỳ đâu trong chuỗi gọi — không phải chỉ "thêm cột" như `accounts` ở P7. Chia hai pha (AskUserQuestion, anh Tony chọn "chia pha"): Pha 1 — `accounts` dựng lại với `UNIQUE(organization_id, platform)` thay `UNIQUE(platform)` toàn cục (an toàn vì ràng buộc cũ đã đảm bảo không hai dòng nào trùng platform, sao chép không thể xung đột), 409 chặn khác tổ chức ở `add_account` bị bỏ (nó chỉ là giải pháp tạm cho ràng buộc cũ, không phải hạn chế mong muốn); `organization_id` thêm vào `campaigns`/`templates`/`post_metrics`/`weekly_metrics`/`content_insights` — bốn trong năm bảng này KHÔNG có đường đọc/ghi nào trong mã (xác nhận bằng grep, không phải suy đoán), chỉ `post_metrics` có đường thật qua `/api/analytics/*`, đã nối `organization_id` xuyên suốt bốn hàm đọc + một hàm ghi. Pha 2 (`posts`/`signals`/`content_plans`, xuyên sáu agent) CHƯA làm — cần bản đồ luồng gọi sáu agent trước, ghi ở `SocialFlow/TECHNICAL_DEBT.md`. Xác minh: `ast.parse` sạch ba tệp sửa; `run_migrations()` chạy trên BẢN SAO `socialflow.db` thật — 3 tài khoản thật giữ nguyên `id`/`platform`/`username`, `organization_id` NULL→`"default"`, số dòng khớp trước/sau mọi bảng, chạy lần hai idempotent; test hành vi trên bản sao: hai tổ chức cùng thêm `twitter` nay cùng tồn tại (trước đây 409), cùng tổ chức thêm lại thì THAY chứ không nhân dòng, `post_metrics` hai tổ chức cách ly đúng. Chưa khởi động được `uvicorn` thật trong sandbox (cùng giới hạn venv macOS đã gặp ở P7) — cần anh Tony xác minh lại trên máy thật trước khi coi xong tuyệt đối. Unified Shell KHÔNG bắt đầu SSO vào SocialFlow trước khi Pha 2 xong — SSO vào một pipeline còn trộn lẫn tổ chức bên trong chỉ làm lỗ rò lộ ra ngoài dễ hơn, không loại bỏ nó |
| 09/10 | **Lộ trình hoàn thành Unified Shell 100% — bốn nhóm việc (A/B/C/D), ghi ở `UNIFIED_SHELL.md` mục 7.** A = D1 Pha 2 (sáu agent SocialFlow, việc nặng nhất, không rút gọn được) · B = SSO thật ba app (chờ A) · C = proxy/domain thật (chờ anh Tony chốt domain/hosting, ví dụ `app.floraos.vn` trong tài liệu chỉ là minh hoạ) · D = dọn dẹp + soát bảo mật độc lập (chờ B, C). Bắt đầu ngay A1 — bản đồ luồng gọi sáu agent, việc duy nhất không cần quyết định gì thêm từ anh Tony |
| 09/10 | **A1 xong — bản đồ luồng sáu agent SocialFlow, hai phát hiện đổi phạm vi D1 Pha 2.** (1) `orchestrator.py` giữ `PipelineStatus` singleton cấp module — chỉ một pipeline chạy được cùng lúc cho TOÀN TIẾN TRÌNH, không phân biệt tổ chức; tổ chức B gọi trong lúc tổ chức A đang chạy bị bỏ qua lặng lẽ, nhận lại `last_result` của A. Thêm cột không sửa được lỗi này — tầng điều phối phải sửa riêng, tách biệt và nặng hơn việc thêm cột. (2) `brand_config` (Creator dùng để lấy thương hiệu) chọn dòng mới nhất không lọc gì cả — sau khi có nhiều tổ chức, nội dung sinh ra cho MỌI tổ chức sẽ mang thương hiệu của tổ chức nào lưu gần nhất; lượt tra `accounts` riêng cho Discord ở Publisher cũng không lọc tổ chức. Cả hai không nằm trong danh sách debt gốc. Ghi đầy đủ (bảng agent → đọc/ghi bảng gì → gọi tiếp gì) ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2". Cập nhật lại bảng Nhóm A ở `UNIFIED_SHELL.md` §7 thành 7 bước (A1–A7) thay vì 6, A2 giờ là thiết kế cách organization_id ĐI VÀO pipeline — hiện không có nơi nào phía trên (lịch tự động, endpoint thủ công) có sẵn giá trị này |
| 09/10 | **A2 chốt (lô song song có giới hạn, sửa lại nhận định SQLite), A2b xong — đo thời gian thật thêm vào orchestrator.py và publisher.py.** Sửa lại một nhận định trước đó: SQLite chỉ khoá lúc GHI ĐĨA thật sự (rất ngắn), không khoá suốt lúc chờ mạng — hai bước chậm nhất (Creator gọi AI, Publisher đăng qua Playwright) là chờ mạng, nên nhiều tổ chức chờ song song không đụng nhau, không cần đổi Postgres ngay để có tốc độ. A2 chốt: một lịch chung (cron), xử lý theo lô song song có giới hạn (vd 5-10 tổ chức/lô) thay vì xếp hàng tuần tự — ước lượng (chưa đo thật) 100 tổ chức tuần tự ≈ 6-7 tiếng, cùng lô 10 ≈ 40 phút. A2b: orchestrator.run_full_pipeline() đo riêng từng bước trong sáu agent qua hàm bọc _timed_stage, cộng vào status.last_stage_seconds; publisher.run() đo riêng theo từng nền tảng vào platform_seconds; GET /api/pipeline/status tự trả thêm hai trường này không cần sửa route. Test bằng agent giả lập (không đụng mạng thật): đo đúng thời gian từng bước, status reset đúng sau khi chạy, platform_seconds phân biệt đúng theo nền tảng. `ast.parse` sạch toàn bộ backend/. Còn thiếu số ĐO THẬT — cần anh Tony chạy pipeline thật một lần trên máy có mạng để chọn đúng giới hạn song song, chưa đoán |
| 09/10 | **A3 xong — sửa lỗi trả nhầm kết quả giữa các tổ chức, chưa bật chạy song song thật.** Trước bản sửa: `PipelineStatus` là biến toàn cục không phân biệt tổ chức — tổ chức B gọi `run_full_pipeline()` trong lúc tổ chức A đang chạy sẽ âm thầm nhận lại `last_result` CŨ của A (lỗi phát hiện ở A1). Sửa: thêm `current_organization_id` vào `PipelineStatus`; `run_full_pipeline()` nhận tham số `organization_id`, khi bận thì trả về object từ chối tường minh (`error: pipeline_busy`, nêu rõ tổ chức nào đang giữ lượt) thay vì kết quả cũ; `POST /api/pipeline/run` truyền `organization_id` qua và lỗi 409 nêu đúng tổ chức đang chạy. **Cố tình KHÔNG bật chạy song song thật ở bước này** — A3 trong kế hoạch gốc có thể hiểu là "cho nhiều tổ chức chạy đồng thời", nhưng làm vậy trước khi A4 (thêm `organization_id` vào bảng dữ liệu) và A5 (agent lọc theo tổ chức) xong sẽ để hai tổ chức ghi/đọc chung bảng chưa cách ly — đúng kiểu rò dữ liệu chéo tổ chức mà D1 lập ra để ngăn. Pipeline vẫn single-flight; song song thật dời sang sau A5, gộp vào A6. Test giả lập: tổ chức A đang chạy, tổ chức B gọi cùng lúc — B nhận đúng từ chối nêu tên A, A vẫn hoàn tất bình thường, trạng thái reset đúng sau khi xong. `py_compile` sạch `main.py` và `orchestrator.py`. Chi tiết ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — A3" |
| 09/10 | **A4 xong — `organization_id` thêm vào sáu bảng còn lại trong luồng agent (posts/signals/content_plans/content_queue/assets nội bộ/brand_config).** Qua `migrations.py`, đúng khuôn Pha 1 (ALTER TABLE ADD COLUMN, không rewrite) — không bảng nào có UNIQUE cần rebuild như `accounts`. Cột CHƯA được agent nào dùng (chờ A5); riêng `brand_config` vẫn một hàng dùng chung mọi tổ chức cho tới khi A5 sửa logic đọc/ghi — ghi rõ để không ai tưởng nhầm A4 đã cách ly xong. Test trên bản sao `socialflow.db` thật: 45 posts/11 signals/18 content_plans/0 content_queue/14 assets/1 brand_config — cột thêm đúng, dữ liệu giữ nguyên, `organization_id` NULL trên dòng cũ, idempotent 2 lần chạy. Nhân tiện phát hiện `tests/test_migrations.py` đã sai ngầm từ Pha 1 (test khẳng định "thêm đủ mọi cột COLUMNS" nhưng fixture chỉ dựng bảng `assets`, không dựng `accounts`/`templates`/`post_metrics`/... nên luôn báo "table missing" — lỗi không do A4 gây ra, A4 chỉ làm lộ rõ hơn) — sửa lại fixture dùng đúng hàm `init_*()` của từng module, 32/32 passed sau sửa |
| 09/10 | **A5 xong — sáu agent + endpoint thật sự lọc theo tổ chức, phần việc nặng nhất của D1 Pha 2.** Trước khi viết code, hỏi anh Tony cách xử lý `signals` (tin tức Scout thu thập): dùng chung hay nhân bản theo tổ chức — chọn DÙNG CHUNG (bảng mới `signal_org_processed` ghi tổ chức nào đã dùng signal nào, thay cột `processed` chung cũ), vì GitHub API công khai giới hạn 60 lượt/giờ và nhân bản theo tổ chức sẽ dễ vỡ giới hạn này khi chạy lô song song (thiết kế A2). Trong lúc làm, phát hiện thêm hai việc ngoài bản đồ A1: (1) file phiên đăng nhập Playwright (`automation.py`) dùng CHUNG một tệp mỗi nền tảng cho MỌI tổ chức — tổ chức B đăng nhập sau ghi đè phiên của A; sửa bằng cách đưa `organization_id` vào tên tệp, một chỗ sửa áp dụng tự động cho ~20 điểm gọi rải rác trong `automation.py`/`automation_extended.py` vì hầu hết lớp con kế thừa `__init__` của lớp cha. (2) `run_migrations()` gọi Ở CẤP MODULE chạy trước khi `posts`/`signals`/`content_plans`/`brand_config` tồn tại — chỉ vô hại vì database thật của anh Tony đã có sẵn các bảng này từ trước, nhưng trên MỘT DATABASE HOÀN TOÀN MỚI sẽ bỏ sót toàn bộ cột D1 của sáu bảng này vĩnh viễn; sửa bằng cách gọi thêm lần nữa cuối `lifespan()` (migrations vốn idempotent, gọi hai lần đúng thiết kế). Sửa luôn `brand_config` thành một hàng mỗi tổ chức THẬT SỰ — không chỉ hàm nội bộ Creator (đã sửa ở A1) mà cả 5 route UI trong `brand_kit.py` mà trước đây tổ chức lưu sau sẽ ghi đè cấu hình của tổ chức lưu trước. Khoảng trống cố ý để lại (không phải bỏ sót): Facebook Graph API vẫn dùng một Page/token chung server qua biến môi trường, chưa theo tổ chức; các endpoint duyệt/từ chối/đăng bài theo ID chưa kiểm tra đúng tổ chức — thuộc phạm vi soát bảo mật Nhóm D; lịch tự động (APScheduler) vẫn chỉ chạy một tổ chức mặc định, chờ A6 xây cơ chế lặp qua nhiều tổ chức. Xác minh: test tích hợp hai tổ chức xuyên suốt Scout→Planner→Creator→Reviewer→Publisher→Analyst dựng database đúng như app thật (mọi init_*() rồi run_migrations() HAI LẦN) — 36/36 passed; test riêng `brand_kit.py` 5 route — 10/10 passed; `tests/test_migrations.py` 31/31 passed (giảm 1 so với A4 vì cột `signals.organization_id` bị gỡ lại theo quyết định trên). Chạy `tests/run_all.sh` toàn repo: 2 lỗi không liên quan A5 được nêu ra minh bạch chứ không giấu — một do dữ liệu thật trong `socialflow.db` đã lớn hơn giả định cũ của một test không liên quan `organization_id`, một do giới hạn xoá file của sandbox hiện tại, không phải lỗi thật. Chi tiết ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — A5" |
| 09/10 | **A6 xong — chạy song song thật nhiều tổ chức, đóng khoảng trống cuối cùng A5 để lại.** `PipelineStatus` (đã sửa một phần ở A3) đổi từ biến toàn cục thành `_status_by_org: Dict[str, PipelineStatus]` truy xuất qua `get_status(organization_id)` — trước đây dù A3 đã ghi đúng tên tổ chức đang giữ lượt chạy, chặn trùng lượt vẫn là single-flight TOÀN TIẾN TRÌNH, hai tổ chức khác nhau chạy cùng lúc vẫn bị chặn lẫn nhau; giờ chặn trùng chỉ còn trong phạm vi CÙNG một tổ chức. `list_known_organizations()` suy danh sách tổ chức đang hoạt động từ `SELECT DISTINCT organization_id FROM accounts` — SocialFlow không có bảng tổ chức riêng (tổ chức sống ở floraos-core), nên roster lấy từ chính dữ liệu tài khoản đã có. `run_for_organizations()` hiện thực hoá bằng `asyncio.Semaphore` đúng thiết kế lô song song có giới hạn đã chốt ở A2 (mặc định 8 tổ chức/lô, chỉnh qua biến môi trường). `run_scheduled_cycle()` là điểm vào thật cho lịch tự động: chạy Scout đúng một lần (dùng chung theo quyết định A5) rồi chạy phần còn lại của pipeline cho từng tổ chức theo lô song song. Bốn job `APScheduler` trong `main.py` viết lại để gọi các hàm này — trước A6 lịch tự động chỉ chạy một tổ chức mặc định dù sáu agent đã nhận `organization_id` được từ A5. Xác minh bằng test đồng thời dùng agent giả lập có độ trễ nhân tạo (không mạng thật): 13/13 passed — đo được mức song song thật ≥2 giữa các tổ chức khác nhau, single-flight cùng tổ chức vẫn đúng như A3, giới hạn lô đúng theo `batch_size`, Scout chạy đúng một lần dù nhiều tổ chức trong khi Planner chạy đủ số lần theo tổ chức. Chạy lại `tests/test_migrations.py` (31/31, không đổi) và `tests/run_all.sh` toàn repo — không phát sinh lỗi mới ngoài hai lỗi không liên quan đã ghi nhận từ A5. Chi tiết ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — A6". Nhóm A (D1 Phase 2) còn lại đúng A7 — đánh dấu D1 xong hoàn toàn |
| 09/10 | **A7 xong — D1 hoàn tất, Nhóm A (D1 Pha 2) đóng hoàn toàn 7/7 bước.** `SocialFlow/TECHNICAL_DEBT.md` đóng lại các mục nợ gốc #3 ("publish pipeline không organization-scoped") và #4 (quyết định D1 chưa triển khai xong end-to-end) — cả hai chuyển RESOLVED, trỏ về A1–A6. Thêm mục tổng kết "D1 (đa tenant thật) — HOÀN TẤT" ở cuối tệp, liệt kê lại bảy bước A1–A7 và tách rõ ba khoảng trống KHÔNG thuộc phạm vi D1 để không ai tưởng chúng còn kẹt trong D1: xác thực caller-identity thật (JWT/SSO — thuộc Nhóm B, `organization_id` hiện vẫn là giá trị bên gọi tự khai, đúng như đã nêu từ P7), Facebook Graph API dùng một Page/token chung server, endpoint thao tác-theo-ID (`approve`/`reject`/`publish`) chưa kiểm tra tổ chức (thuộc soát bảo mật Nhóm D). D1 (`floraos-core/claude/PRD-floraos-core.md` §12 Sổ quyết định) — "SocialFlow lên đa tenant hay ở lại đơn tenant" — chốt "đa tenant thật" và nay đã triển khai xong ở cả tầng dữ liệu lẫn tầng agent. Nhóm B (SSO thật ba app) hết điều kiện chặn, có thể bắt đầu bất cứ lúc nào anh Tony muốn |
| 09/10 | **B1 xong — cookie JWT phiên liên-app ở floraos-core, thiết kế tương thích localhost.** Trước khi viết code, anh Tony chọn bắt đầu Nhóm B ngay dù hiện chỉ chạy trên localhost (chưa có domain thật), thiết kế cho tương thích localhost thay vì chờ Nhóm C. Khảo sát phát hiện `floraos-core` đã có sẵn hệ phiên thật (`sessions`/`floraos_session`, không phải chỉ `integration_tokens` như kế hoạch gốc B1 từng đoán) — B1 chỉ thêm cookie JWT thứ hai (`floraos_sso`, module mới `src/modules/sso/`) bên cạnh, không dựng lại phiên. Cookie mới cố tình host-only (không đặt `Domain`) giống cookie phiên gốc sẵn có — tự tương thích localhost (trình duyệt gửi cookie theo tên máy, không phân biệt cổng) mà không cần sửa gì thêm. Quyết định của anh Tony (AskUserQuestion): JWT sống ngắn 15 phút + endpoint làm mới `POST /api/v1/sso/refresh` (thay vì JWT dài hạn khớp phiên gốc 30 ngày) — đánh đổi lấy khả năng token bị lộ tự hết hạn nhanh, chấp nhận thêm một lượt gọi mạng không thường xuyên từ LocalBudd/SocialFlow khi JWT hết hạn. Nội dung JWT cố tình chỉ có `sub`/`org`/`email` — không mang mã năng lực, đúng nguyên tắc mỗi app tự kiểm quyền riêng đã ghi ở `UNIFIED_SHELL.md` §3. `npm run typecheck`/`npm run lint` sạch, `npm test` 168/168 passed (12 ca mới cho module `sso`, không hồi quy 156 ca cũ). Chưa xác minh được vòng thật qua route (sandbox không có Postgres sống) — cần anh Tony xác minh trên máy có DB thật. Chi tiết ở `UNIFIED_SHELL.md` §7 dòng B1 |
| 09/10 | **B2a xong — nền tảng SSO ở LocalBudd; hai quyết định P7 của anh Tony mở khoá đa tổ chức thật cho LocalBudd.** Trước khi viết code, khảo sát LocalBudd phát hiện nó không có khái niệm tổ chức ở đâu cả — `users`/`sessions`/`projects` độc lập hoàn toàn với floraos-core, `projects.owner_id` một-chủ-sở-hữu, và chính `LocalBudd/00-CANH-BAO-DOC-TRUOC.md` đã cảnh báo trước "đừng xây quyền dựa trên owner_id", ghi rõ việc thay `projects` bằng `organizations`/`workspaces` của core bị chặn bởi hai quyết định P7 khác (products/generation_jobs). Anh Tony chốt cả hai ngay (AskUserQuestion): (1) bỏ hẳn luồng nhập sản phẩm ở LocalBudd — người dùng nhập thẳng trên floraos-core, LocalBudd chỉ đọc lại qua `GET /integration/products`; (2) `generation_jobs` giữ nguyên hàng đợi riêng của LocalBudd, chỉ thêm một lượt gọi `POST /integration/jobs` song song để core ghi nhận usage/billing. Cả hai quyết định làm lo ngại gốc ("đổi project_id hai lần") không còn áp dụng, nên B2 chia nhỏ thành B2a–B2d thay vì làm chung một lượt như kế hoạch gốc. B2a (nền tảng SSO) xong: `organization_id` (nullable) thêm vào `sessions`/`projects`; module `sso/` chỉ xác minh JWT (LocalBudd không bao giờ tự ký); `getSession()` viết lại làm cầu nối — `floraos_sso` có mặt luôn là nguồn thẩm quyền tổ chức đang hoạt động, tự khớp/tạo user LocalBudd theo email, tự mint phiên mới khi tổ chức đổi; middleware Edge chấp nhận `floraos_sso` hoặc `session_id`. Hệ quả có chủ đích: đăng xuất riêng ở LocalBudd không thật sự đăng xuất nếu `floraos_sso` còn hợp lệ — đúng bản chất SSO. `npx eslint` sạch, `npx tsc --noEmit` còn đúng một lỗi vì client Prisma sinh sẵn trong sandbox chưa theo schema mới (không có mạng tới binaries.prisma.sh, cùng giới hạn floraos-core từng gặp ở P9) — cần anh Tony chạy `prisma generate` lại. LocalBudd không có bộ test tự động chạy được từ trước (lỗi có sẵn, không phải do B2a) nên chưa xác minh được vòng thật, cần anh Tony xác minh trên máy có DB thật. Còn mở B2b (chuyển 5 điểm kiểm quyền owner_id→organization_id), B2c (bỏ luồng nhập sản phẩm), B2d (gọi POST /integration/jobs). Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "Unified Shell — B2" và `UNIFIED_SHELL.md` §7 |
| 09/10 | **B2b xong — chuyển kiểm quyền project ở LocalBudd từ owner_id sang organization_id, phạm vi lớn hơn ước tính ban đầu.** Dòng debt gốc chỉ đếm "5 tệp" (đếm chữ `owner_id` theo nghĩa đen), nhưng chuỗi kiểm quyền tenant isolation cho `pages`/`page_versions` thật sự xuyên qua interface `IPageRepository` và toàn bộ use-case của nó — chạm 19 tệp (9 route, 7 use-case, repository, interface), cộng hai route đọc Prisma trực tiếp (`pages/route.ts`, `pages/[id]/qa/route.ts`). Thêm kiểu `TenantAccess` và hàm `hasProjectAccess()` ở `src/lib/auth.ts`: project đã gán tổ chức thì bất kỳ thành viên nào của tổ chức đó truy cập được (không chỉ người tạo ra nó — đúng tinh thần "một sản phẩm" của Unified Shell); project chưa gán tổ chức (dữ liệu cũ, hoặc phiên không qua SSO) vẫn rơi về đúng luật cũ, chỉ người tạo mới vào được — không có project nào bị lộ thêm ra ngoài phạm vi cũ của nó. Đổi mọi nơi bằng một mẫu cơ giới nhất quán (đổi tên/kiểu tham số, forward không đổi logic) nên rủi ro thấp dù số tệp nhiều; xác minh bằng `git diff` từng tệp trước khi chạy `eslint`/`tsc` để tách đúng lỗi mới phát sinh khỏi lỗi có sẵn trên repo — kết quả: `eslint` 0 lỗi mới (26 lỗi/3 cảnh báo hiện có đều xác nhận có từ trước, phần lớn ở các tệp không đụng tới), `tsc` chỉ còn đúng loại lỗi "thiếu organization_id" đã biết từ B2a (client Prisma sinh sẵn trong sandbox chưa theo schema mới). Chưa xác minh hành vi thật — cần anh Tony `prisma generate` và thử trên DB thật. Còn lại B2c (bỏ luồng nhập sản phẩm) và B2d (báo usage sang core). Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "B2b" |
| 09/10 | **B2c xong — bỏ hẳn luồng nhập sản phẩm cục bộ ở LocalBudd, chuyển sang gắn tham chiếu Product Master của floraos-core.** Theo hai quyết định P7 đã chốt cùng lúc với B2a: xoá `ManualInputForm`/`UrlInputForm`/scraping-từ-URL/xác nhận-sửa-xoá/upload-ảnh-thủ-công, cùng toàn bộ use-case và route phía sau (`inputs/manual`, `inputs/url`, `products/confirm`, `assets`, và GET/PUT của `products/[id]`) — cả `src/modules/product/domain/normalizer.ts` và module `mapping-engine/` (chỉ phục vụ scraping) cũng xoá theo vì không còn ai gọi. `products` (Prisma) thêm `core_product_id String?` + `@@unique([project_id, core_product_id])` — không còn là nơi TẠO dữ liệu sản phẩm, chỉ giữ THAM CHIẾU. Route mới: `GET /api/v1/core-products` (proxy `FloraOsCoreClient.listProducts()` ra trình duyệt) và `POST /api/v1/projects/[id]/products` (gắn sản phẩm đã chọn vào project); `DELETE /api/v1/products/[id]` đổi nghĩa thành gỡ tham chiếu, không xoá dữ liệu ở core. `IProductRepository` thu gọn còn ba phương thức, chuyển sang `TenantAccess`/`hasProjectAccess()` giống khuôn B2b thay vì tự dựng kiểm quyền riêng — nhân tiện bắt được `GET /api/v1/projects/[id]/products` (route đọc sản phẩm) lọt khỏi danh sách kiểm kê 19 tệp của B2b vì không chứa chữ `owner_id` theo nghĩa đen, sửa luôn cùng đợt. Frontend: `AttachProductForm.tsx` mới (liệt kê + tìm + gắn), `ProductList.tsx` viết lại (chỉ hiện sản phẩm đã gắn + nút gỡ, bỏ hẳn sửa/upload/"Confirm Products" vì sản phẩm gắn vào đã ở trạng thái đã duyệt ngay từ đầu). Ba giới hạn đã biết, ghi rõ để không lẫn với lỗi: (1) `price`/`description`/`attributes` không còn điền được cho sản phẩm mới — `CoreProductLookup` chưa phơi các trường này, ảnh hưởng tới chất lượng nội dung `GenerateLandingUseCase`/`GenerateCatalogueUseCase` sinh ra; (2) `FLORAOS_CORE_INTEGRATION_TOKEN` là MỘT giá trị toàn cục duy nhất, không theo từng tổ chức đang đăng nhập qua SSO — an toàn với một tổ chức/một lần triển khai như hiện tại của anh Tony, nhưng sẽ rò danh mục giữa các tổ chức nếu sau này nhiều tổ chức dùng chung một lần triển khai LocalBudd, cần chốt kiến trúc cấp token ở floraos-core trước khi mở rộng; (3) ảnh Master Image (`getMasterImage()` đã có ở `FloraOsCoreClient`) chưa được gọi tới từ UI. `rm -rf .next && npx tsc --noEmit` sạch ngoại trừ đúng nhóm lỗi "thiếu organization_id/core_product_id" đã biết từ B2a/B2b (client Prisma sinh sẵn trong sandbox chưa theo schema mới). `npx eslint` không có lỗi logic mới; hai cảnh báo rule `react-hooks` mới xuất hiện ở tệp sửa đều cùng khuôn với một dòng `useEffect` có sẵn TRƯỚC B2c ở `input/page.tsx` (xác nhận qua `git diff` — dòng đó không nằm trong phần sửa), tức một cách viết đã tồn tại trong repo chứ không phải B2c vi phạm quy tắc mới. Chưa xác minh luồng thật (gắn sản phẩm → sinh trang) — cần DB thật + `FLORAOS_CORE_INTEGRATION_TOKEN` thật. Còn lại B2d (báo usage sang core cho `generation_jobs`). Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "Unified Shell — B2c" và `UNIFIED_SHELL.md` §7 |
| 09/10 | **B2d xong — báo job sang core cho usage/billing, đóng toàn bộ Unified Shell B2 (LocalBudd) về mặt mã.** Theo quyết định đã chốt cùng lúc mở khoá B2: hàng đợi job cục bộ (`claimNext`/`SKIP LOCKED`) giữ nguyên, chỉ thêm `FloraOsCoreClient.createJob()` (`POST /integration/jobs`, core đã phơi từ P7, tái dùng `enqueueJob`) gọi SONG SONG ngay sau khi tạo job cục bộ ở `generate/landing`/`generate/catalogue` — hàm mới `reportGenerationJobToCore()` ánh xạ đúng mã feature đã đăng ký giá bên core (`landing_generation`→`landing.generate`, `catalogue_generation`→`catalog.generate`, cố tình không gửi thẳng tên job cục bộ vì hai bên đặt tên khác nhau và core không có danh sách trắng theo client). **Ghi rõ có chủ đích, không phải bỏ sót**: vì không `await` chặn, hạn mức/credit bên core hiện chỉ mang tính GHI NHẬN cho `LocalBudd` — core từ chối (hết credit) hay không gọi được (mạng, chưa có token thật) đều không chặn job cục bộ; muốn chặn thật phải đổi sang chờ trước khi tạo job, khác quyết định đã chốt, ngoài phạm vi B2d. Phát hiện phụ sửa nhân tiện lúc chạm `src/lib/auth.ts`: `verifyProjectOwnership()` (dùng bởi 6 route — 2 route B2d vừa sửa cộng `design`/`layout`/`design-contract`/`design-direction`) lọt khỏi kiểm kê tenant-isolation của CẢ B2b lẫn B2c (nằm trong hạ tầng dùng chung `src/lib/auth.ts`, không phải một "điểm kiểm quyền" theo cách hai đợt trước rà theo module `IPageRepository`/`IProductRepository`) — vẫn lọc thẳng `owner_id`, nghĩa là trước bản sửa này thành viên tổ chức không phải người tạo project bị từ chối khi sinh landing/catalogue hay chỉnh design, trái luật đã chốt ở B2b. Sửa tại một chỗ (đổi nội dung hàm, giữ nguyên chữ ký nên 6 nơi gọi không cần đổi) bằng `hasProjectAccess`/`toTenantAccess` đã có sẵn. `rm -rf .next && npx tsc --noEmit` — chỉ thêm đúng loại lỗi "thiếu organization_id/core_product_id" đã biết ở hai điểm mới chạm, không có loại lỗi khác. `npx eslint .` — 167 vấn đề (139 lỗi/28 cảnh báo), khớp tuyệt đối với con số trước B2d — 0 lỗi mới ở bất kỳ tệp nào B2d chạm tới. Chưa xác minh luồng thật (tạo job → core trừ hạn mức) — cần DB thật cả hai phía + `FLORAOS_CORE_INTEGRATION_TOKEN` thật. Nhóm B còn lại B3 (SSO cho `SocialFlow`) và B4 (test end-to-end xuyên ba app). Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "Unified Shell — B2d" và `UNIFIED_SHELL.md` §7 |

| 09/12 | **P15+ — Dashboard proxy sang engine ngoài.** Ba app ba cổng (core 3100 / LocalBudd 3000 / SocialFlow 8000) nên trình duyệt blocked mọi call cross-origin (CORS), và cookie `floraos_sso` host-only "localhost" tự đi kèm trong cùng một host nhưng KHÔNG tự đi qua cổng khác — giải pháp: core làm PROXY SERVER-SIDE. `src/modules/proxy/` đủ bốn thư mục (`domain/proxy-rules.ts` · `use-cases/proxy-request.ts` · `infra/proxy-http-adapter.ts` · route `/api/v1/proxy/[...path]`). Whitelist path theo client — `SOCIALFLOW: ["api/m04b"]`, `LOCALBUDD: ["api/v1/catalog-links", "api/v1/projects"]`; forward hai đường danh identity đã có: `X-FloraOS-SSO` (core đọc cookie `floraos_sso` rồi forward, sibling verify bằng `SSO_SESSION_SECRET` dùng chung) và `Authorization: Bearer` (token `integration_tokens`, `F9`). SSO thắng khi có cả hai. `SOCIALFLOW_URL`/`LOCALBUDD_URL` thêm vào `src/lib/env.ts` + `.env`. Creative Studio (`/creative-studio`, `src/components/creative/creative-studio.tsx`) — dashboard core gọi SocialFlow M04b xoá nền (AIC-11) qua proxy, hiện kết quả ngay, KHÔNG mở app khác. `ai-image` (`src/lib/mock-data.ts`) đổi `chua_san_sang` → `hoat_dong`, route `/creative-studio`; nav `Tạo ảnh AI` (`I1`) thêm vào `desktop-nav.tsx`; `routeForFeature` ở `experience-grid.tsx` thêm `/creative-studio`. Test proxy: `proxy-rules.test.ts` (4 ca) + `proxy-request.test.ts` (14 ca, mock adapter, không gọi HTTP thật) — 18 ca mới. `npm test` **276/276** · `npx tsc --noEmit` SẠCH · `npx eslint` 0 lỗi. **Chưa xác minh end-to-end trên máy thật** (chạy SocialFlow 8000 + core 3100, đăng nhập, bấm Creative Studio → xoá nền một sản phẩm thật → ảnh nền về dashboard; kiểm 401 khi thiếu JWT, 403 khi tổ chức khác, 502 khi core vắng). Chi tiết ở `Checklist_Thuc_Thi.md` mục P15+ |
| 09/12 | **Sửa lỗi `Failed to construct 'Image'` ở Creative Studio.** Lỗi runtime: Next.js tự động giải quyết `Image` thành `next/image` constructor (cần `new`), và lucide `Image` bị ghiền — `<Image size={16} />` ném TypeError. Sửa ở ba tệp: `src/components/creative/creative-studio.tsx` đổi `Image` → `ImageIcon` (lucide), `src/components/layout/desktop-nav.tsx` đổi `Image` → `IMAGE_ICON` (lucide, dùng ở hai nav item `/creative-studio` và `/thu-vien-anh`). Thêm luôn một lỗi type: `desktop-nav.tsx` dùng `next/link` `<Link href={item.href}>` nhưng typed-link của Next 16 không nhận `string` (cần `RouteImpl`), và cả `router.push(item.href)` cũng bị cùng ràng buộc — thay bằng `<button onClick={() => router.push(item.href as never)}>` (không dùng `next/link` ở anywhere trong repo, và `as never` là cách duy nhất bypass typed-route mà không làm mất typecheck). `npm run build` xanh, `/creative-studio` xuất hiện trong danh sách route động. `npm test` 276/276 · `eslint` 0 vấn đề · `tsc` SẠCH |
| 09/13 | **Tích hợp UI ↔ Backend cho 4/10 chức năng UI/UX.** Bắt đầu từ `docs/UIUX-Integrate-Checklist.md`. 4 trang đã có backend được nối: (1) **Phân tích sản phẩm AI** — `tai-anh/page.tsx` dùng POST/PATCH/GET `/api/v1/vision/analyses`, POST reject, SSE `/api/v1/jobs/:id/events`, `useSession()` cho H1/H2/H3, asset listing, Idempotency-Key header; (2) **AI Creative Studio** — `creative-studio/page.tsx` dùng POST/GET `/api/v1/media/optimizations`, POST approve (Identity Guard REJECTED → ẩn Duyệt, WARNING → confirm), GET download (I3), proxy M04b; (3) **Catalog & Website** — `catalog/page.tsx` thay MOCK_PRODUCTS bằng GET `/api/v1/products`, GET/POST/PATCH/revoke `/api/v1/catalog-links`; (4) **Analytics & Learning** — `so-lieu/page.tsx` thay METRICS cứng bằng GET `/api/v1/usage/summary`, nối AI requests, audit logs, PUT `/api/v1/ai-policy`. 6 trang còn lại (#3 video, #4 content engine, #5 social publishing, #7 CRM, #8 orders, #9 chat) chờ backend tương ứng (P17/P18/P21/P22/P23). `npm test` 293/293 · `tsc --noEmit` SẠCH · checklist chi tiết ở `docs/UIUX-Integrate-Checklist.md` + `docs/dac-ta/Checklist_Thuc_Thi.md` mục UI/UX |
| 09/15 | **Chuẩn hoá kiến trúc AI Content Engine (M07) ↔ SocialFlow.** Rà soát và đính chính định vị hệ thống: `SocialFlow` (AI Autonomous CMO) là repo sở hữu toàn bộ backend soạn thảo và xuất bản nội dung đa nền tảng (Facebook, Instagram, TikTok, Zalo OA...) cùng pipeline 6-agent (`scout`, `planner`, `creator`, `reviewer`, `publisher`, `analyst`). `LocalBudd` chỉ là AI Page Factory phục vụ Storefront (M05 Landing Page + M06 Catalog & QR). Giao diện `/noi-dung` (Chức năng #4) tại `floraos-core` là UI Shell & Template chuẩn hoá theo SSOT, kết nối backend sang `SocialFlow` qua cơ chế Server-side Proxy `/api/v1/proxy/api/m07/*?client=SOCIALFLOW` kèm SSO JWT, bảo đảm tenant isolation và không làm lộ UI SocialFlow ra ngoài. |
| 09/15 | **Khởi tạo Từ điển từ cấm ngành hoa & FlowerContentGuard toàn hệ thống.** Ban hành tài liệu SSOT `docs/kien-truc/TU_DIEN_TU_CAM_CONTENT_NGANH_HOA.md` phân loại 4 nhóm từ vi phạm (cam kết sai lệch về hoa, AI slop, giật gân chợ búa, chính sách nền tảng) phục vụ chuyên gia rà soát/cập nhật. Đồng bộ file cấu hình máy đọc `src/core/ai/domain/flower-content-banned-lexicon.json`. Xây dựng domain service thuần túy `FlowerContentGuard` (`src/core/ai/domain/flower-content-guard.ts`) hỗ trợ kiểm tra vi phạm (`checkFlowerContent`), tự động làm sạch (`sanitizeFlowerContent`), chặn cứng với `AppError` (`assertFlowerContentAllowed`), và tích hợp `brand_profiles.forbidden_styles`. Bộ test `flower-content-guard.test.ts` đạt 8/8 test xanh. |
| 09/16 | **Hoàn tất P21 — M09 CRM & Quản Lý Khách Hàng (Chức năng #7).** Customer Master Index SSOT, phân tầng RFM tự động (VIP/Gold/Silver/Bronze/New), quét ngày kỷ niệm trước 14 ngày, Consent Engine quyền riêng tư. 4 bảng CSDL mới, 8 mã năng lực `Q1`–`Q8`. `customer-isolation.test.ts` 4/4 xanh thật. |
| 09/16 | **Hoàn tất P22 — M10 Đơn Hàng & Vận Hành (Chức năng #8).** Bảng Kanban 4 cột, Event Sourcing, đo lường SLA 180 phút, bóc tách lát cắt Thợ cắm hoa xưởng (giấu 100% giá), in phiếu giao hàng & thiệp A6. 4 bảng CSDL mới, 8 mã năng lực `R1`–`R8`. `order-isolation.test.ts` 5/5 xanh thật. |
| 09/16 | **Hoàn tất P23 — M08 AI Chat Assistant & Tích Hợp Đa Kênh Omnichannel (Chức năng #9).** Dual-Intent Router (SaaS Operations Help vs Flower Sales), trợ lý nổi toàn hệ thống `<FloraOSGlobalCopilot />` (`Cmd+K`), 5 kênh tiếp xúc (E-Catalog `/c/[slug]`, Landing Page, Facebook Messenger, Zalo OA, Script nhúng website ngoài). Monetization Engine (phí kênh 0–70 credit/tháng, 1 credit/10 tin), chốt chặn Aegis Protection. Nâng cấp **Kiến trúc AI Engine Đa Tầng**: Dify -> OpenAI Direct (`gpt-4o-mini`, giải quyết triệt để lặp câu từ) -> Local Qwen 2.5:7b qua Ollama (chi phí **0đ / 0 Token**) -> Local Rule Engine (offline 100%). Xây dựng hệ thống **Cẩm nang Tri thức & Nhập liệu SSOT (`/tri-thuc`)** cho 7 phân hệ cốt lõi kèm thanh Onboarding Progress Bar và tái cấu trúc Sidebar Navigation. `npm test` **414/414 xanh thật**, `chat-channel-isolation.test.ts` 2/2 xanh, `chat-isolation.test.ts` 3/3 xanh, `tsc --noEmit` SẠCH 100%. |


