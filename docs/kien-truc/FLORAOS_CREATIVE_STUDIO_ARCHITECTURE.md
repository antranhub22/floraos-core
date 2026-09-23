# Kiến Trúc AI Creative Studio — SSOT Architecture Document

> **Module:** AI Creative Studio (Chặng 01–09: M01a, M01b, M04a, M04b, M04c, Creative Production & Packaging)
> **Route:** `/creative-studio`
> **Phiên bản:** 3.0 — Tích hợp trọn vẹn 14 Chặng Product-to-Market khởi động từ Chặng 01 (Khu vực A: Quét theo ảnh sản phẩm)
> **Trạng thái:** ĐÃ TRIỂN KHAI & NGHIỆM THU

---

## 1. Tổng Quan & Vai Trò

AI Creative Studio là trung tâm sáng tạo nội dung & tiếp thị trọn gói (All-in-One Studio Hub) của FloraOS. Thay vì phân tán quy trình qua nhiều màn hình rời rạc, Creative Studio bao hàm trọn vẹn hành trình tiếp thị bắt đầu từ **Chặng 01 (BRING — Quét theo ảnh sản phẩm)** đến **Chặng 09 (APPROVE — Duyệt chốt gói chiến dịch)** thông qua 6 Khu vực tab làm việc khép kín, sẵn sàng chuyển tiếp sang các chặng xuất bản và bán hàng downstream (Chặng 10–14):

| Khu Vực | Tab ID | Tên Nhãn | Biểu Tượng | Chặng Journey | Thành Phần Lõi | Mô Tả Nghiệp Vụ |
|---|---|---|---|---|---|---|
| **Khu vực A** | `area-a` | Quét theo ảnh sản phẩm | 📷 Camera | **Chặng 01–05** | `<ProductIntelligenceWorkspace />` | **Khởi đầu Journey**: Tải ảnh hoa thật/chọn catalog tiệm (01) → Vision AI bóc tách nguyên tử & OCR thiệp (02) → Trend Fit Matrix (03) → 10 Chủ đề kèm Dẫn chứng Video Kép TikTok/YouTube (04) → Chọn chủ đề & Mode (05). |
| **Khu vực B** | `area-b` | Viết contents | 📄 FileText | **Chặng 06a** | `<ContentsWorkspace />` | Sáng tạo nội dung đa kênh: Facebook, kịch bản Video TikTok/Reels, Story 24h, Caption E-commerce (Mode CREATIVE / AUTHENTIC). |
| **Khu vực C** | `area-c` | Tạo audio | 🎧 Headphones | **Chặng 06b** | `<AudioWorkspace />` | Thu âm Voiceover kịch bản qua AI TTS đa giọng điệu tiếng Việt và phối trộn nhạc nền BGM ducking tự động cân bằng thời lượng. |
| **Khu vực D** | `area-d` | Tạo biến thể ảnh | 🪄 Wand2 | **Chặng 06c** | `<VariantWorkspace />` | Dựng 4 Khung Phân Cảnh Narrative Arc (Setup, Rising, Climax, CTA) qua Local Studio Backdrop Engine (~0.46s, 0 VNĐ, offline) hoặc Cloud AI. |
| **Khu vực E** | `area-e` | Tạo video | 🎬 Film | **Chặng 06d** | `<VideoWorkspace />` | Biên tập Video Marketing 9:16/1:1/16:9 theo 6 khuôn M04c, Storyboard linh hoạt 2–15 cảnh, Camera Motion Ken Burns, Subtitles. |
| **Khu vực F** | `area-f` | Gói chiến dịch | 📦 Package | **Chặng 07–09** | `<PackageWorkspace />` | Đóng gói trọn bộ Campaign Package (07) → AI kiểm định QA đa trục (08) → Chủ shop duyệt chốt phát hành (09). |

### Downstream Handoff (Chặng 10 → 14)
Sau khi chủ shop duyệt chốt gói chiến dịch tại Khu vực F (Chặng 09), hệ thống kích hoạt card điều hướng downstream `<PackageDownstreamCard />` đưa tài sản tiếp thị sang:
- **Chặng 10 — LAUNCH**: Đăng tải / Lên lịch đa kênh (Facebook Fanpage, TikTok Shop, Zalo OA, E-Catalog).
- **Chặng 11 — SELL**: AI Chat Sales tư vấn chốt đơn tự động qua M08 Omnichannel.
- **Chặng 12 — MEASURE**: Đo lường chuyển đổi và doanh thu đơn hàng thực tế.
- **Chặng 13 — LEARN**: Trích xuất Winning Patterns từ chiến dịch hiệu quả.
- **Chặng 14 — NEXT BEST ACTION**: Đề xuất hành động tiếp thị tối ưu tiếp theo cho tiệm.

---

## 2. Nguyên Tắc Thiết Kế Bất Biến

### 2.1. Điểm Khởi Đầu Khép Kín Tại Khu Vực A
- Người dùng chỉ cần vào `/creative-studio` là có thể tải ngay ảnh chụp thật của lẵng/bó hoa tại Khu vực A (`area-a`).
- Không bắt buộc người dùng phải đi đường vòng qua `/tai-anh` hay `/thi-truong` để lấy dữ liệu.
- Khi hoàn tất Chặng 05 tại Khu vực A, nút "Bắt đầu sáng tạo" tự động kết xuất `TopicProductionBrief` và chuyển tiếp mượt mà sang các Khu vực sản xuất B, C, D, E, F.

### 2.2. Validation Gate & Không Chặn Khu Vực A
- Cổng kiểm tra chặng chuyển tiếp `validateTransition()` kiểm tra tính sẵn sàng của các trường dữ liệu: `topicId`, `mode`, `productName`, `assetId`, `commercialPassport`.
- **Quy tắc tuyệt đối**: Màn hình xác thực `ValidationScreen` chỉ kích hoạt khi người dùng nhảy cóc vào Khu vực B–F mà chưa có dữ liệu. **Khu vực A KHÔNG BAO GIỜ bị chặn** vì đây chính là nơi sản sinh dữ liệu ban đầu.

### 2.3. Bất Biến Asset ID & Miễn Nhiễm Lỗi 431 (Header Too Large)
- Bất kỳ ảnh nào tải lên đều được cấp phát `assetId` qua API `/api/v1/assets/upload-url`.
- Cấm truyền chuỗi Base64 / Data URL qua URL Query String của router.
- Client Creative Studio luôn giải mã URL ảnh tươi thông qua `GET /api/v1/assets/:id/view-url`.

### 2.4. Subject Integrity (M04b)
- Đo tỷ lệ điểm ảnh lõi chủ thể hoa tươi còn trùng khít với Master Image (co biên mask).
- Ngưỡng: $\ge 0.999$ (SAFE) / $\ge 0.99$ (WARNING) / $< 0.99$ (REJECTED).
- Nếu REJECTED: Hệ thống từ chối ghi asset biến thể vào cơ sở dữ liệu để bảo vệ uy tín hình ảnh của tiệm hoa.

### 2.5. Tenant Isolation
- Mọi truy vấn đọc/ghi CSDL và lưu trữ Object Storage đều giải `organization_id` trực tiếp từ phiên đăng nhập máy chủ (Server Session).
- Tuyệt đối cấm nhận `organization_id` từ `req.body` hay URL query string.

### 2.6. Invariant: Biến Thể Chỉ Dựng Từ MASTER (Hỗ trợ Skip)
- Biến thể marketing (M04b) chỉ được phép sinh từ asset có `kind === "MASTER" && approval_state === "APPROVED"`.
- Cơ chế "Skip — Dùng ảnh gốc": Tạo bản sao asset `kind = "MASTER"` từ `ORIGINAL` qua `/api/v1/media/promote-to-master` mà không làm thay đổi hay phá vỡ asset gốc.

---

## 3. Cấu Trúc Thư Mục & Phân Hệ Thành Phần

```
src/
├── app/(app)/creative-studio/
│   └── page.tsx                                  # Shell điều phối 6 Khu vực tab (~510 dòng)
│
├── components/creative-studio/                   # UI Workspace Components
│   ├── types.ts                                 # Shared types/interfaces
│   ├── use-creative-studio-data.ts              # Custom hook: state + API calls M04
│   ├── contents-workspace.tsx                   # Khu vực B: Viết nội dung đa kênh
│   ├── audio-workspace.tsx                      # Khu vực C: Voiceover TTS & BGM ducking
│   ├── variant-workspace.tsx                    # Khu vực D: M04b Biến thể Marketing
│   ├── video-workspace.tsx                      # Khu vực E: M04c AI Video Studio
│   ├── package-workspace.tsx                    # Khu vực F: Campaign Package & QA
│   ├── package-downstream-card.tsx              # Chặng 10-14 Downstream Action Links
│   ├── validation-screen.tsx                    # Chặn thiếu dữ liệu khi nhảy cóc sang B-F
│   └── optimize-workspace.tsx                   # M04a Workspace tối ưu hóa nâng cao
│
├── components/market-intelligence/
│   └── product-intelligence-workspace.tsx        # Khu vực A: Chặng 01-05 (Nhận diện & Trend)
│
├── components/templates/creative-studio/         # Template Library Components
│   ├── before-after-preview-card.tsx
│   ├── creative-guidance-card.tsx
│   ├── enhancer-provider-selector.tsx
│   ├── optimization-mode-selector.tsx
│   ├── studio-scene-selector.tsx
│   ├── studio-variant-card.tsx
│   ├── visual-storytelling-controls.tsx
│   └── applied-changes-breakdown.tsx
│
├── modules/creative-production/                  # Domain & Pipeline Orchestration
│   ├── domain/
│   │   ├── production-types.ts                  # CampaignPackage, TopicProductionBrief
│   │   └── validate-transition.ts               # Logic kiểm tra chuyển tiếp giữa các chặng
│   └── use-cases/
│       ├── produce-creative-assets.ts
│       └── package-campaign.ts
│
├── modules/media/                                # Media AI & Image Generation
│   ├── adapters/
│   │   ├── studio-local-image-provider.ts       # Kết nối Python StudioBackdropEngine CLI
│   │   └── multi-image-provider-router.ts       # Router đa tầng Cloud -> Local Studio
│   └── use-cases/
│       └── execute-cloud-creative.ts
│
├── workers/media_ai/                             # Python Worker & Local AI Engine
│   └── image/
│       ├── studio_backdrop.py                   # Động cơ ghép bối cảnh Studio/Lifestyle/Wood
│       ├── generate_scene.py                    # CLI entrypoint sinh ảnh phân cảnh (~0.46s)
│       └── rembg_segmenter.py                   # Tách nền U2-Net/Rembg tạo mặt nạ RGBA
```

---

## 4. User Journey 6 Khu Vực Khép Kín

```
[Khởi đầu] ──> Khu vực A: Quét theo ảnh sản phẩm (Chặng 01–05)
                     │
                     ├─ Chặng 01 (BRING): Tải ảnh hoa thật
                     ├─ Chặng 02 (UNDERSTAND): Multimodal Vision AI bóc tách nguyên tử & OCR thiệp
                     ├─ Chặng 03 (DISCOVER): Trend Fit Matrix & Điểm thị trường
                     ├─ Chặng 04 (IDEATE): 10 Chủ đề kèm Dẫn chứng Video Kép TikTok & YouTube
                     └─ Chặng 05 (CHOOSE): Chọn chủ đề & Mode (CREATIVE / AUTHENTIC)
                                │
                                └─── Sinh TopicProductionBrief & Điều hướng
                                             │
             ┌───────────────────────────────┴───────────────────────────────┐
             ▼                                                               ▼
  Khu vực B: Viết contents (Chặng 06a)                           Khu vực C: Tạo audio (Chặng 06b)
  - Sinh Copy đa kênh                                            - Thu âm Voiceover kịch bản
  - Kịch bản Video ngắn                                          - Phối nhạc nền BGM ducking
             │                                                               │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
             ┌───────────────────────────────┴───────────────────────────────┐
             ▼                                                               ▼
  Khu vực D: Tạo biến thể ảnh (Chặng 06c)                        Khu vực E: Tạo video (Chặng 06d)
  - 4 Khung Phân Cảnh Narrative Arc                              - 6 Khuôn video chuẩn M04c
  - Local Studio Backdrop (~0.46s, 0đ)                           - Ken Burns Camera Motion & Subtitles
             │                                                               │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
                             Khu vực F: Gói chiến dịch (Chặng 07–09)
                             - Chặng 07 (PACKAGE): Tổng hợp Campaign Package
                             - Chặng 08 (QA): AI kiểm tra Identity Guard & Brand Voice
                             - Chặng 09 (APPROVE): Chủ shop duyệt chốt phát hành
                                             │
                                             ▼
                      [Phân phối & Bán hàng Downstream: Chặng 10–14]
                      - 10. LAUNCH: Xuất bản đa kênh (FB, TikTok, Zalo, Catalog)
                      - 11. SELL: AI Chat Sales tư vấn chốt đơn M08
                      - 12. MEASURE: Đo lường chuyển đổi doanh thu
                      - 13. LEARN: Trích xuất Winning Patterns
                      - 14. NEXT BEST ACTION: Đề xuất hành động tiếp thị tiếp theo
```

---

## 5. API Contracts

### 5.1. Nhóm API Khu vực A (Quét theo ảnh sản phẩm & Bóc tách)
- `POST /api/v1/assets/upload-url` — Xin cấp Signed URL để tải ảnh hoa thật lên kho S3/MinIO.
- `POST /api/v1/assets/confirm-upload` — Xác nhận ảnh đã tải lên, tạo bản ghi `assets` (`kind=ORIGINAL`).
- `POST /api/v1/product-intelligence` — Vision AI (`gpt-4o-mini`) phân tích cấu trúc, tính điểm Trend Fit và sinh 10 chủ đề kèm Dẫn chứng Video Kép.
- `GET /api/v1/product-intelligence/:id` — Nạp báo cáo Product Intelligence bằng `runId`.

### 5.2. Nhóm API Khu vực B (Nội dung) & Khu vực F (Đóng gói)
- `POST /api/v1/creative-production/produce` — Sinh nội dung đa kênh (Post, Script, Story) theo Topic và Mode.
- `POST /api/v1/creative-production/package` — Đóng gói tất cả tài sản thành `CampaignPackage`.

### 5.3. Nhóm API Khu vực C (Audio)
- `POST /api/v1/audio/jobs` — Tạo job TTS kịch bản và phối trộn nhạc nền ducking.

### 5.4. Nhóm API Khu vực D (Biến thể ảnh M04b)
- `POST /api/v1/media/variants` — Tạo job sinh biến thể marketing (`I4`). Hỗ trợ fallback sang `StudioLocalImageProvider` gọi `generate_scene.py`.
- `POST /api/v1/media/variants/:id/approve` — Duyệt biến thể marketing (`I5`).
- `POST /api/v1/media/promote-to-master` — Skip M04a: Duyệt nhanh ảnh ORIGINAL thành MASTER (`I2`).

### 5.5. Nhóm API Khu vực E (Video Studio M04c)
- `POST /api/v1/video/jobs` — Tạo job biên tập video marketing theo Storyboard và khuôn mẫu.

---

## 6. Capability Matrix (RBAC & Hard Ceiling)

| Mã | Tên Năng Lực | Mô Tả Nghiệp Vụ | Cấp Độ Kiểm Soát |
|---|---|---|---|
| `I1` | Chạy tối ưu ảnh | Tạo job M04a tối ưu hóa chất lượng | Soft Switch |
| `I2` | Duyệt ảnh | Duyệt Master Image + Promote-to-Master (Skip) | Soft Switch |
| `I3` | Tải ảnh | Download Master / biến thể | Mặc định mở |
| `I4` | Chạy biến thể | Tạo job M04b sinh 4 khung phân cảnh Narrative Arc | Soft Switch |
| `I5` | Duyệt biến thể | Duyệt biến thể marketing xuất bản (trần cứng) | **Hard Ceiling** |
| `V1` | Tạo video | Khởi chạy job biên tập video M04c | Soft Switch |
| `V2` | Duyệt kịch bản/video | Duyệt xuất bản video thành phẩm | **Hard Ceiling** |

---

## 7. Khung Phân Cảnh Narrative Arc & Động Cơ Local Studio Backdrop Engine (23/09/2026)

### 7.1. Bối cảnh & Vấn đề giải quyết
Trước ngày 23/09, tại Khu vực D (`area-d` - M04b Biến thể Marketing), khi các Cloud Provider ngoài (Stability AI, Fal.ai FLUX, Google Gemini) gặp lỗi hạn mức hoặc hết credits (402, 403, 429), chuỗi định tuyến `MultiImageProviderRouter` rơi về `studio_local`. Tuy nhiên, `StudioLocalImageProvider` ban đầu chỉ trả về mảng bytes ảnh gốc chưa qua xử lý, khiến cho cả 4 khung phân cảnh trên giao diện đều hiển thị 4 bức ảnh hoa thật giống hệt nhau, không tạo ra được bất kỳ sự khác biệt nào về bối cảnh hay nghệ thuật.

### 7.2. Đặc tả 4 Khung Phân Cảnh Narrative Arc chuẩn hóa
M04b Creative Studio chuyển giao từ Chặng 04 (IDEATE) và Chặng 05 (CHOOSE) thành chuỗi 4 khung phân cảnh hình ảnh khép kín:

| Phân Cảnh | Nhịp Kịch Bản (Beat) | Preset Bối Cảnh | Mô Tả Nghiệp Vụ & Hiệu Ứng Thị Giác | Mục Đích Xuất Bản |
|---|---|---|---|---|
| **Cảnh 1** | `SETUP` (Mở đầu) | `clean_white` (`studio_white`) | **Vẻ đẹp nguyên bản**: Đặt hoa trên phông Studio Trắng Tinh Khôi, ánh sáng softbox 45° tự nhiên, bóng đổ tiếp xúc 2 tầng (Ambient Occlusion + Directional Soft Shadow). Giữ nguyên 100% chi tiết hoa thật từ Chặng 01–02. | Catalog thương mại / Ảnh Master xác thực |
| **Cảnh 2** | `RISING` (Trải nghiệm) | `boutique_bokeh` (`luxury_hotel` / `wedding`) | **Không gian Lifestyle Sang Trọng**: Hòa phối bó hoa vào sảnh tiệc mừng khai trương / khách sạn cao cấp với hiệu ứng vòng tròn Bokeh quang học f/1.8, ánh sáng ấm áp, tạo cảm xúc thực tế cho người mua. | Bài viết Facebook Feed / Quảng cáo Instagram |
| **Cảnh 3** | `CLIMAX` (Chi tiết) | `wood_warm` (`wood_minimal`) | **Gỗ Tối Giản Nghệ Thuật (Bắc Âu)**: Bối cảnh mặt bàn gỗ sồi ấm áp dưới ánh ban mai nhẹ, góc cận cảnh tôn vinh thông điệp thiệp chúc mừng OCR và ruy băng nơ thiết kế riêng. | Slide chi tiết chất lượng / Zalo tư vấn chốt đơn |
| **Cảnh 4** | `CTA` (Xuất bản) | `transparent` (`cutout`) | **Tách Nền Trong Suốt (PNG)**: Khử nền 100% bằng AI Matting (U2-Net / Rembg), làm sạch viền (Sub-pixel Feathering & Defringing), lưu trữ kênh alpha trong suốt sẵn sàng ghép banner và đóng dấu logo tiệm hoa. | Ghép banner khuyến mãi / Xuất bản đa kênh |

### 7.3. Kiến trúc Động Cơ Local Studio Backdrop Engine
- **Thực thi cục bộ 100%**: Sử dụng `StudioBackdropEngine` (`workers/media_ai/image/studio_backdrop.py`) và `RembgSegmenter` chạy trên Python/OpenCV/Pillow nội bộ thông qua script CLI `workers/media_ai/generate_scene.py`.
- **Cơ chế Cache RGBA Mặt nạ (`<master>.rgba.png`)**:
  - Khi bóc tách chủ thể lần đầu bằng U2-Net (~20s), hệ thống tự động ghi cache mặt nạ RGBA vào đĩa.
  - Các lượt ghép phân cảnh tiếp theo (`clean_white`, `boutique_bokeh`, `wood_warm`) tái sử dụng trực tiếp mặt nạ đã lưu, rút ngắn thời gian sinh ảnh xuống chỉ còn **~0.46s / ảnh $2048 \times 2048$**.
  - Chi phí vận hành: **0 VNĐ / 0 Token API**, hoạt động offline hoàn toàn.
- **Tự động định tuyến Fallback thông minh (`MultiImageProviderRouter`)**:
  - Nếu người dùng kích hoạt tạo biến thể AI qua Cloud Provider (Stability AI) mà gặp lỗi (402, 403, 429), router tự động chuyển sang `StudioLocalImageProvider`.
  - `StudioLocalImageProvider` phân tích từ khóa trong prompt/directives để chọn đúng bối cảnh (`clean_white`, `boutique_bokeh`, `wood_warm`, `transparent`), tạo ra ảnh biến thể thực sự thay vì trả ảnh gốc thô.
- **Client-Side Tự Động Đồng Bộ & Sinh Độc Lập**:
  - Khi người dùng tải trang, `variant-workspace.tsx` tự động truy vấn danh mục `assets` (`kind=MARKETING`) để nạp ngay các phân cảnh đã sinh sẵn vào `sceneImageMap`.
  - Mỗi khung phân cảnh có nút hành động riêng: "⚡ Sinh ảnh Lifestyle (Stability AI)", "⚡ Sinh ảnh Cận cảnh", "⚡ Tạo PNG Tách nền" kèm trạng thái xử lý độc lập (`generatingSceneIndex`).


