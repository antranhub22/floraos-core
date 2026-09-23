# User Journey — Creative Studio Toàn Diện (Chặng 1-14)

> **Mục đích:** Mô tả chi tiết luồng trải nghiệm người dùng trong **AI Creative Studio (`/creative-studio`)**, 
> bắt đầu ngay từ **Chặng 01 (BRING — Quét theo ảnh sản phẩm)** xuyên suốt đến **Chặng 14 (NEXT BEST ACTION)**
> trong hành trình "1 Sản phẩm hoa tươi → 1 Chiến dịch tiếp thị & bán hàng khép kín".
>
> **Tài liệu chuẩn hóa (SSOT):** Dùng làm căn cứ kỹ thuật tối cao cho Development, QA, Product Management và CI.
>
> **Phiên bản:** 2.0 — 2026-09-23 (Đồng bộ Creative Studio khởi động từ Chặng 01 tại Khu vực A)
> **Trạng thái:** ĐÃ TRIỂN KHAI & NGHIỆM THU

---

## Người dùng mục tiêu

- **Store Owner / Shop Manager / Florist** — Chủ shop hoặc nhân viên điều hành tiệm hoa tươi
- Bắt đầu chỉ với 1 thao tác duy nhất: **Tải ảnh chụp lẵng/bó hoa thật lên Creative Studio**
- Hệ thống tự động dẫn dắt qua 6 Khu vực tab làm việc khép kín không rời khỏi Studio.

---

## Bản đồ Tổng quan Journey trong Creative Studio

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AI CREATIVE STUDIO (/creative-studio)                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Khu vực A: Quét theo ảnh sản phẩm]                                            │
│   01. BRING         📸 Tải ảnh lẵng hoa thật lên hoặc chọn từ Catalog tiệm       │
│   02. UNDERSTAND    🔎 Vision AI bóc tách nguyên tử: hoa, lá đệm, thiệp OCR...  │
│   03. DISCOVER      🔥 Khám phá Product Trend Fit Matrix & Điểm số thị trường   │
│   04. IDEATE        💡 Sinh 10 chủ đề kèm Dẫn chứng Video Kép TikTok & YouTube  │
│   05. CHOOSE        🎯 Chọn chủ đề trọng tâm & Mode (CREATIVE / AUTHENTIC)      │
│                     └─ Bàn giao 1-chạm dữ liệu sang các Khu vực B, C, D, E, F    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Khu vực B: Viết contents]                                                      │
│   06a. CREATE-COPY  ✍️ Sinh bài viết Facebook, kịch bản Video, Story, Zalo...    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Khu vực C: Tạo audio]                                                          │
│   06b. CREATE-AUDIO 🎙️ Thu âm Voiceover kịch bản & Phối nhạc nền BGM             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Khu vực D: Tạo biến thể ảnh]                                                   │
│   06c. CREATE-IMAGE 🖼️ Dựng 4 Khung Phân Cảnh Narrative Arc (Setup, Rising,    │
│                        Climax, CTA) qua Local Studio Backdrop Engine (~0.46s)   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Khu vực E: Tạo video]                                                          │
│   06d. CREATE-VIDEO 🎬 Biên tập Video Marketing 9:16/1:1/16:9, Ken Burns       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Khu vực F: Đóng gói chiến dịch]                                                │
│   07. PACKAGE       📦 Đóng gói trọn bộ Campaign Package đa định dạng           │
│   08. QA            🤖 AI kiểm tra chất lượng Brand / Product Identity          │
│   09. APPROVE       👤 Chủ shop duyệt chốt thủ công 1-chạm                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Phân phối & Bán hàng downstream]                                               │
│   10. LAUNCH        🚀 Xuất bản đa kênh (Facebook, TikTok, Zalo, Catalog)       │
│   11. SELL          💬 AI Chat Sales tư vấn chốt đơn tự động                    │
│   12. MEASURE       📊 Đo lường chuyển đổi doanh thu đơn hàng                   │
│   13. LEARN         🧠 Trích xuất Winning Patterns thành công                   │
│   14. NEXT BEST     🎯 Đề xuất hành động thông minh tiếp theo                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cấu trúc 6 Khu Vực Tab trong Creative Studio

Giao diện `/creative-studio` chuẩn hóa với thanh công cụ Top-Right Action Header và 6 Khu vực tab làm việc:

| Khu Vực | Tab ID | Tên Nhãn | Biểu Tượng | Chặng Tương Ứng | Thành Phần Component |
|---|---|---|---|---|---|
| **Khu vực A** | `area-a` | Quét theo ảnh sản phẩm | 📷 Camera | Chặng 01–05 | `<ProductIntelligenceWorkspace />` |
| **Khu vực B** | `area-b` | Viết contents | 📄 FileText | Chặng 06 (Copy) | `<ContentsWorkspace />` |
| **Khu vực C** | `area-c` | Tạo audio | 🎧 Headphones | Chặng 06 (Audio) | `<AudioWorkspace />` |
| **Khu vực D** | `area-d` | Tạo biến thể ảnh | 🪄 Wand2 | Chặng 06 (Images) | `<VariantWorkspace />` |
| **Khu vực E** | `area-e` | Tạo video | 🎬 Film | Chặng 06 (Video) | `<VideoWorkspace />` |
| **Khu vực F** | `area-f` | Đóng gói chiến dịch | 📦 Package | Chặng 07–09 | `<PackageWorkspace />` |

---

## Chi tiết Luồng Thực Thi Từng Khu Vực

### Khu vực A: Quét theo ảnh sản phẩm (Chặng 01 → 05)

Khu vực A chính là điểm khởi đầu của toàn bộ Creative Studio. Người dùng KHÔNG cần phải đi vòng qua các trang khác mà thao tác trực tiếp tại đây:

1. **Chặng 01 — BRING (📸 Tải ảnh hoa)**:
   - Kéo thả ảnh chụp lẵng/bó hoa thật vào khung hoặc chọn từ Catalog có sẵn của tiệm.
2. **Chặng 02 — UNDERSTAND (🔎 Vision AI bóc tách)**:
   - Multimodal Vision AI (`gpt-4o-mini`) phân tích ảnh thật, bóc tách nguyên tử: hoa chính, hoa phụ, lá đệm, OCR nội dung thiệp chúc mừng/biển chữ, kiểu dáng bao bì và phân khúc giá.
   - Chủ shop có thể nhấp chuột sửa trực tiếp từng thông số mà không phá vỡ cấu trúc dữ liệu.
3. **Chặng 03 — DISCOVER (🔥 Khám phá Trend Fit)**:
   - Hệ thống quét dữ liệu thị trường, hiển thị Product Trend Fit Matrix và chấm điểm Fit Score (Trend/Audience/Content).
4. **Chặng 04 — IDEATE (💡 10 Chủ đề tiếp cận)**:
   - AI sinh 10 chủ đề nội dung kèm **Dẫn chứng Video Kép thực tế (TikTok 9:16 + YouTube 16:9)**.
5. **Chặng 05 — CHOOSE (🎯 Chọn chủ đề trọng tâm & Mode)**:
   - Chủ shop chọn 1 chủ đề đắc địa nhất và chọn Mode sản xuất:
     * `CREATIVE` (mặc định): AI tự do triển khai bối cảnh tiếp thị và visual storytelling.
     * `AUTHENTIC`: Giữ nguyên tính chân thực mộc mạc tối đa của tiệm hoa.
   - Nhấp nút **"Bắt đầu sáng tạo nội dung"** để chuyển giao dữ liệu (`TopicProductionBrief`) sang các Khu vực B, C, D, E, F.

> [!NOTE]
> **Quy tắc Validation Chặng chuyển tiếp:** Khu vực A là nơi tạo lập dữ liệu gốc nên không bao giờ bị chặn bởi màn hình Validation (`ValidationScreen`). Màn hình Validation chỉ kích hoạt khi người dùng nhảy cóc sang Khu vực B–F mà chưa có dữ liệu đầu vào từ Khu vực A.

---

### Khu vực B: Viết contents (Chặng 06a — Contents)

#### UI & Thao tác:
- Lựa chọn Mode: `CREATIVE` (mặc định — AI tự do sáng tạo kịch bản, visual story) hoặc `AUTHENTIC` (người dùng tự biên soạn/giữ nguyên phong cách mộc của shop).
- Lựa chọn định dạng nội dung: Bài đăng Facebook/Zalo, Kịch bản Video ngắn (TikTok/Reels), Story 24h, Caption E-commerce.
- Nút bấm chính: **"Tạo nội dung Creative / Authentic"** $\rightarrow$ Hệ thống gọi `POST /api/v1/creative-production/produce`.
- Kết quả: Hiển thị tiêu đề, hook, nội dung từng cảnh, danh sách hashtags, và ước tính credit.

---

### Khu vực C: Tạo audio (Chặng 06b — Audio Studio)

#### UI & Thao tác:
- Chọn Voice AI từ Catalog giọng đọc chuyên nghiệp tiếng Việt (chuẩn theo phong cách tiệm hoa: ấm áp, sang trọng, trẻ trung, truyền cảm).
- Chọn Mood nhạc nền (BGM: Lãng mạn, Năng động, Nhẹ nhàng sâu lắng, Khai trương hoan hỉ).
- Tự động cân bằng thời lượng (Auto-sync duration) khớp chính xác với thời lượng kịch bản video.
- Audio Player trực quan để nghe thử giọng đọc và nhạc nền đã ducking (giảm âm lượng nhạc khi có lời nói).
- Nút bấm chính: **"Tạo audio"** $\rightarrow$ Hệ thống gọi `POST /api/v1/audio/jobs`.

---

### Khu vực D: Tạo biến thể ảnh (Chặng 06c — M04b Biến Thể Marketing)

#### UI & 4 Khung Phân Cảnh Narrative Arc:
- **Cảnh 1 [SETUP — Mở đầu]**: Studio Trắng Tinh Khôi (`clean_white`) — Đổ bóng tiếp xúc 2 tầng tự nhiên, bảo toàn 100% hình thái lẵng hoa thật.
- **Cảnh 2 [RISING — Trải nghiệm]**: Không gian Lifestyle Sang Trọng (`boutique_bokeh` / `luxury_hotel`) — Hòa phối hoa vào sảnh tiệc mừng / khách sạn với Bokeh f/1.8.
- **Cảnh 3 [CLIMAX — Chi tiết]**: Gỗ Tối Giản Nghệ Thuật Bắc Âu (`wood_warm` / `wood_minimal`) — Cận cảnh tôn vinh thiệp chúc mừng OCR và ruy băng nơ.
- **Cảnh 4 [CTA — Xuất bản]**: Tách Nền Trong Suốt PNG (`transparent`) — Khử nền U2-Net / Rembg alpha mask, sẵn sàng ghép banner và đóng dấu logo tiệm hoa.

#### Động cơ Local Studio Backdrop Engine & Tốc độ ~0.46s:
- **Tự động Fallback**: Khi Stability AI cạn credit (402), router tự động chuyển sang `StudioLocalImageProvider` kết nối với Python `StudioBackdropEngine` và `generate_scene.py`.
- **Bộ nhớ đệm RGBA (`.rgba.png`)**: Mặt nạ tách nền được lưu cache; các lượt ghép bối cảnh tiếp theo chỉ mất **~0.46s / ảnh $2048 \times 2048$**, chi phí 0 VNĐ, 0 token API.
- **Sinh độc lập từng cảnh**: Nút bấm riêng cho từng Cảnh 2, Cảnh 3, Cảnh 4 kèm trạng thái loading riêng (`generatingSceneIndex`).

---

### Khu vực E: Tạo video (Chặng 06d — M04c AI Video Studio)

#### UI & Thao tác:
- Chọn khuôn video (6 khuôn chuẩn M04c: REEL_15S, TIKTOK_30S, STORY_15S, SLIDESHOW, PRODUCT_PAGE, AD_MOTION).
- Chọn tỷ lệ: 9:16 (dọc), 1:1 (vuông), 16:9 (ngang).
- Storyboard Editor: Biên soạn 2–15 cảnh linh hoạt, tự động cân bằng thời lượng.
- Camera Motion Ken Burns: Zoom In/Out, Pan Up/Right, Static.
- Phụ đề (Subtitles) 4 phong cách + Đóng dấu thương hiệu (Watermark).
- Nút bấm chính: **"Tạo video"** $\rightarrow$ Hệ thống điều phối `POST /api/v1/video/jobs`.

---

### Khu vực F: Gói chiến dịch & Phê duyệt (Chặng 07–09 — Package, QA & Approve)

#### 1. Chặng 07 — PACKAGE (Đóng gói chiến dịch)
- Tổng hợp toàn bộ tài sản đã sản xuất từ các Khu vực A, B, C, D, E vào **Campaign Package**:
  * 📸 Master Image & Passport thương mại (từ Khu vực A)
  * ✍️ Contents & Copywriting đa kênh (từ Khu vực B)
  * 🎙️ Audio Voiceover & BGM (từ Khu vực C)
  * 🖼️ 4 Phân cảnh Biến thể ảnh Marketing (từ Khu vực D)
  * 🎬 Video Marketing hoàn thiện (từ Khu vực E)
- Thống kê chi phí tổng hợp (credits / tokens đã tiêu thụ).
- Gọi `POST /api/v1/creative-production/package` để lưu trữ bản ghi Campaign Package.

#### 2. Chặng 08 — QA (Kiểm định chất lượng tự động)
Hệ thống tự động rà soát đa trục trước khi cho phép xuất bản:
- **Brand Voice Guard**: Tính nhất quán về tông giọng (ấm áp, sang trọng, thanh lịch).
- **Product Accuracy Guard**: Đối chiếu thành phần hoa và thông điệp thiệp OCR với ảnh Master gốc.
- **Platform Sizes Guard**: Kiểm tra tỷ lệ khung hình đạt chuẩn đa nền tảng (9:16, 1:1, 16:9).
- Báo cáo kết quả: `PASS`, `NEEDS REVIEW` hoặc `REJECTED`. Người dùng có thể bấm "Gửi AI nâng cấp" để tự động sửa lỗi.

#### 3. Chặng 09 — APPROVE (Chủ shop duyệt chốt thủ công)
- Bảng tổng kết trạng thái tất cả các thành phần: Hoa tươi, Nội dung, Ảnh biến thể, Video, Audio, Kênh, QA.
- Nút bấm quyết định của chủ shop:
  * **[APPROVE & PUBLISH]** (Duyệt chốt gói chiến dịch): Đánh dấu gói đã sẵn sàng và kích hoạt thẻ chuyển tiếp downstream `<PackageDownstreamCard />`.
  * **[EDIT]**: Quay lại khu vực cần chỉnh sửa.
  * **[ASK AI TO IMPROVE]**: Yêu cầu AI tinh chỉnh lại theo góp ý.

---

## Các Chặng Downstream Phân Phối & Bán Hàng (Chặng 10–14)

Sau khi chủ shop duyệt chốt tại Khu vực F, hệ thống mở đường dẫn sang hệ sinh thái downstream:

### Chặng 10 — LAUNCH (Đăng tải & Lên lịch đa kênh)
- Chọn kênh phân phối: Facebook Fanpage, TikTok Shop, Zalo OA, E-Catalog (`/c/[slug]`), Google Business.
- Thao tác: "Đăng ngay" hoặc "Lên lịch phát hành" theo khung giờ vàng tiếp cận khách mua hoa.

### Chặng 11 — SELL (Tư vấn chốt đơn tự động qua M08 Omnichannel)
- Nội dung tiếp thị thu hút tương tác $\rightarrow$ Khách hàng nhắn tin hỏi mua hoa $\rightarrow$ AI Chat Sales tư vấn dựa trên đúng thông số Passport thương mại của lẵng hoa $\rightarrow$ Đề xuất giá $\rightarrow$ Tạo đơn hàng tự động vào phân hệ M10 Vận Hành.

### Chặng 12 — MEASURE (Đo lường hiệu quả chuyển đổi)
- Theo dõi các chỉ số kinh doanh thực tế trên Dashboard: Lượt tiếp cận (Reach), Tương tác (Engagement), Số cuộc hội thoại, Tỷ lệ chốt đơn và Tổng doanh thu mang lại.

### Chặng 13 — LEARN (Trích xuất Winning Patterns)
- AI phân tích mẫu chiến dịch thành công:
  * Phân cảnh hình ảnh nào (Cảnh 2 Lifestyle hay Cảnh 3 Gỗ Bắc Âu) có tỷ lệ click cao nhất.
  * Hook kịch bản nào tạo ra nhiều tin nhắn đặt hoa nhất.
  * Khung giờ và kênh nào mang lại ROI cao nhất cho tiệm.

### Chặng 14 — NEXT BEST ACTION (Đề xuất hành động tiếp thị tiếp theo)
- AI đề xuất hành động thông minh kế tiếp cho tiệm hoa:
  * *"Mẫu hoa tone đỏ kịch bản Khai Trương đang bán rất chạy $\rightarrow$ Gợi ý tạo thêm biến thể video ngắn cho kênh TikTok Shop."*
  * *"Chuẩn bị đến ngày 20/10 $\rightarrow$ Gợi ý tái sử dụng bó hoa này với góc tiếp cận Tri ân Phụ nữ."*

---

## Tổng Kết User Choices Tại Từng Khu Vực

| Khu Vực / Chặng | Lựa Chọn Trọng Tâm Của Người Dùng | Quyền Phê Duyệt Cốt Lõi |
|---|---|---|
| **Khu vực A** (Chặng 01–05) | Tải ảnh / chọn catalog tiệm, chỉnh sửa nguyên tử thành phần hoa & thiệp OCR, chọn 1 trong 10 chủ đề, chọn Mode (`CREATIVE` hoặc `AUTHENTIC`). | User chốt chủ đề và bấm "Bắt đầu sáng tạo". |
| **Khu vực B** (Chặng 06a) | Chọn loại nội dung (Post, Script, Story, Zalo), tinh chỉnh giọng điệu, sửa câu chữ theo ý muốn. | User xem duyệt bản nháp trước khi đưa vào gói. |
| **Khu vực C** (Chặng 06b) | Chọn giọng đọc Voice AI, chọn phong cách nhạc nền BGM, nghe thử bản mix ducking. | User xác nhận bản thu âm đạt chuẩn. |
| **Khu vực D** (Chặng 06c) | Chọn bối cảnh cho 4 khung phân cảnh Narrative Arc (Setup, Rising, Climax, CTA), sinh ảnh qua Local Studio Backdrop Engine hoặc Cloud AI. | User duyệt từng phân cảnh hoặc chấp thuận toàn bộ. |
| **Khu vực E** (Chặng 06d) | Chọn khuôn video (6 khuôn M04c), tỷ lệ khung hình, biên tập Storyboard, chọn kiểu phụ đề & Ken Burns. | User xem video preview và bấm duyệt video. |
| **Khu vực F** (Chặng 07–09) | Đặt tên chiến dịch, kiểm tra báo cáo QA của AI, duyệt chốt tổng thể gói nội dung. | **Bắt buộc**: User click "Chốt duyệt gói chiến dịch" (Cổng kiểm soát trần cứng). |
| **Downstream** (Chặng 10–14) | Chọn kênh đăng tải, chọn thời gian đăng (ngay/lên lịch), theo dõi tư vấn chốt đơn và doanh thu. | User phê duyệt lịch đăng và các đề xuất Next Best Action. |

> **Nguyên tắc xuyên suốt:** User nắm toàn quyền quyết định ở MỌI bước. Không có bước nào tự ý phát hành hay trừ ngân sách/credits khi chưa có sự đồng thuận từ chủ shop.
