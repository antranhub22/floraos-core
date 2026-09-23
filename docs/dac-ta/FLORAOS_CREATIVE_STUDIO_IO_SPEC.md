# Input/Output Specification — Creative Studio Pipeline (Chặng 1–14)

> **Mục đích:** Chuẩn hóa chính xác inputs và outputs của tất cả các bước
> từ **Chặng 01 (BRING — Quét theo ảnh sản phẩm tại Khu vực A)** xuyên suốt đến **Chặng 14 (NEXT BEST ACTION)**
> trong hành trình tiếp thị và sản xuất nội dung của AI Creative Studio (`/creative-studio`).
>
> **Nguyên tắc cốt lõi:**
> - Mỗi field đều có tên, kiểu, mô tả, bắt buộc/tùy chọn, nguồn gốc.
> - Khu vực A (`area-a`) khởi động từ Chặng 01 đến 05, sản sinh `TopicProductionBrief`.
> - Các Khu vực B, C, D, E, F trong Creative Studio đều đọc từ `TopicProductionBrief`
>   (SSOT cho data carry-forward từ Chặng 1-5 sang Chặng 6-14).
> - `assetId` là BẮT BUỘC: ảnh luôn được resolve qua `/api/v1/assets/:id/view-url`, cấm truyền base64 qua URL.
>
> **Phiên bản:** 3.0 — 2026-09-23 (Đồng bộ Creative Studio khởi động từ Chặng 01 tại Khu vực A & 6 Khu Vực Tab)
> **Trạng thái:** ĐÃ TRIỂN KHAI & NGHIỆM THU

---

## 1. Khu Vực A — Quét Theo Ảnh Sản Phẩm (Chặng 01 → Chặng 05)

Khu vực A (`area-a`) là điểm khởi đầu khép kín của Creative Studio, người dùng thao tác trực tiếp với `<ProductIntelligenceWorkspace />`.

### 1.1. Chặng 01 — BRING (Tải ảnh chụp lẵng/bó hoa thật)

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `file` | `File` (Image) | YÊU CẦU | File ảnh chụp hoa thật (JPG, PNG, WEBP $\le 20\text{MB}$) | Người dùng upload hoặc chọn Catalog |
| `fileName` | `string` | YÊU CẦU | Tên file gốc | File system trình duyệt |
| `mimeType` | `string` | YÊU CẦU | Định dạng MIME (`image/jpeg`, `image/png`, v.v.) | Trình duyệt |

#### Output:
| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `assetId` | `string` (UUID) | YÊU CẦU | Định danh duy nhất của Master/Original Asset trong CSDL `assets` |
| `storageKey` | `string` | YÊU CẦU | Đường dẫn lưu trữ: `org/<org_id>/assets/<asset_id>.<ext>` |
| `sourceImageUrl` | `string` | YÊU CẦU | URL xem ảnh có chữ ký HMAC từ `/api/v1/assets/:id/view-url` |

---

### 1.2. Chặng 02 — UNDERSTAND (Vision AI Bóc Tách Nguyên Tử & OCR Thiệp)

Multimodal Vision AI (`gpt-4o-mini`) phân tích ảnh, bóc tách cấu trúc nguyên tử (Atomic Disaggregated Fields):

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `assetId` | `string` | YÊU CẦU | ID ảnh đã upload | Chặng 01 BRING |
| `imageDataUrl` | `string` | YÊU CẦU | Base64 Data URL gửi ngầm tới Vision API | Trình duyệt |

#### Output (`ProductIntelligenceReport`):
| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `productName` | `string` | YÊU CẦU | Tên thương mại chuẩn hóa của sản phẩm hoa tươi |
| `components` | `FlowerComponent[]` | YÊU CẦU | Mảng nguyên tử: `flowerType`, `quantity`, `unit`, `color`, `role` (chính/phụ/đệm) |
| `foliageComponents` | `FoliageComponent[]` | TÙY CHỌN | Cành và lá đệm: `foliageType`, `quantity`, `unit`, `color`, `role` |
| `greetingCards` | `GreetingCard[]` | TÙY CHỌN | Thiệp & biển chúc mừng OCR: `printedText` (nguyên văn), `cardType`, `occasion` |
| `packaging` | `ProductPackaging` | TÙY CHỌN | Phụ liệu: `wrapMaterial`, `wrapColor`, `bowMaterial`, `bowColor` |
| `commercialPassport` | `CommercialPassport` | YÊU CẦU | `priceSegment`, `priceRange`, `targetAudience`, `occasions`, `style` |

---

### 1.3. Chặng 03 — DISCOVER (Khám Phá Trend Fit Matrix & Điểm Thị Trường)

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `commercialPassport` | `CommercialPassport` | YÊU CẦU | Passport từ Chặng 02 | Chặng 02 UNDERSTAND |
| `components` | `FlowerComponent[]` | YÊU CẦU | Các loại hoa chính/phụ | Chặng 02 UNDERSTAND |

#### Output:
| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `trendScore` | `number` (0–100) | YÊU CẦU | Điểm số độ khớp xu hướng hoa tươi hiện tại |
| `marketFit` | `object` | YÊU CẦU | Đánh giá 3 vùng: `KEEP` (Giữ nguyên), `IMPROVE` (Cải thiện), `TEST` (Thử nghiệm) |
| `searchQueries` | `string[]` | YÊU CẦU | Các từ khóa xu hướng được tổng hợp tự động |

---

### 1.4. Chặng 04 — IDEATE (Sinh 10 Chủ Đề Kèm Dẫn Chứng Video Kép)

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `report` | `ProductIntelligenceReport` | YÊU CẦU | Báo cáo nhận diện từ Chặng 02 & 03 | Chặng 02–03 |

#### Output (`ConcreteTopic[]`):
Mảng 10 chủ đề nội dung, mỗi chủ đề gồm:
| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | `string` | YÊU CẦU | Định danh topic (vd: `topic-01`) |
| `title` | `string` | YÊU CẦU | Tiêu đề sang trọng, sạch từ khóa thô |
| `angle` | `string` | YÊU CẦU | Góc tiếp cận (Khai trương, Tỏ tình, Tri ân, Chữa lành...) |
| `hook` | `string` | YÊU CẦU | Câu giật tít kịch bản tự nhiên |
| `targetAudience` | `string` | YÊU CẦU | Chân dung đối tượng khách hàng trọng tâm |
| `videoEvidences` | `VideoEvidence[]` | YÊU CẦU | Cặp Dẫn chứng Video Kép: TikTok 9:16 + YouTube 16:9 thật |

---

### 1.5. Chặng 05 — CHOOSE (Chọn Chủ Đề Trọng Tâm & Mode)

#### Input (User Choices tại Khu vực A):
| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `selectedTopicId` | `string` | YÊU CẦU | 1 trong 10 chủ đề được người dùng click chọn |
| `mode` | `"CREATIVE" \| "AUTHENTIC"` | YÊU CẦU | `CREATIVE` (mặc định) hoặc `AUTHENTIC` |

#### Output:
Kích hoạt chuyển giao sang các Khu vực B, C, D, E, F thông qua cấu trúc SSOT `TopicProductionBrief`.

---

## 2. Cổng Kiểm Tra Chuyển Tiếp & Cấu Trúc Dữ Liệu Chuyển Giao

### 2.1. Cổng Kiểm Tra Chuyển Tiếp (`validateTransition`)

Hàm kiểm tra tính hợp lệ của dữ liệu trước khi bước vào các Khu vực sản xuất B, C, D, E, F:
- **Nguyên tắc Invariant**: `assetId` là bắt buộc. Ảnh phải có trong kho lưu trữ.
- **Quy tắc Validation Screen**: Chỉ kích hoạt chặn khi người dùng nhảy cóc vào các tab B–F mà thiếu dữ liệu. **Khu vực A KHÔNG BAO GIỜ bị chặn**.

### 2.2. Schema Chuẩn Hóa: `TopicProductionBrief`

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `organizationId` | `string` | YÊU CẦU | Tenant isolation giải từ session máy chủ |
| `assetId` | `string` | YÊU CẦU | ID asset hoa tươi đã upload và lưu trữ |
| `sourceImageUrl` | `string` | YÊU CẦU | URL hiển thị ảnh giải qua API `/api/v1/assets/:id/view-url` |
| `productName` | `string` | YÊU CẦU | Tên thương phẩm của lẵng/bó hoa |
| `mode` | `"CREATIVE" \| "AUTHENTIC"` | YÊU CẦU | Chế độ sáng tạo nội dung |
| `commercialPassport` | `object` | YÊU CẦU | Passport nguyên tử: `category`, `style`, `components`, `colors`, `priceRange?`, `targetAudience?` |
| `selectedTopic` | `object` | YÊU CẦU | Topic đã chọn: `id`, `title`, `angle`, `hook`, `targetAudience`, `videoEvidences` |
| `voiceId` | `string` | TÙY CHỌN | Voice AI chọn cho thu âm Audio |
| `musicMood` | `string` | TÙY CHỌN | Mood nhạc nền BGM |

---

## 3. Khu Vực B — Viết Contents (Chặng 06a)

Khu vực B (`area-b`) điều phối sản xuất văn bản tiếp thị đa kênh.

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `brief` | `TopicProductionBrief` | YÊU CẦU | Dữ liệu chuyển giao từ Khu vực A | Chặng 05 CHOOSE |
| `mode` | `"CREATIVE" \| "AUTHENTIC"` | YÊU CẦU | Mode sản xuất | User chọn |
| `contentTypes` | `string[]` | YÊU CẦU | Loại nội dung: `["facebook_post", "tiktok_script", "story_copy", "zalo_quote"]` | User chọn |
| `authenticContent` | `string` | TÙY CHỌN | Nội dung gốc do shop tự soạn (nếu mode là `AUTHENTIC`) | User nhập |

#### Output:
| Field | Kiểu | Mô tả |
|---|---|---|
| `contentBriefs` | `object[]` | Mảng nội dung chi tiết: `headline`, `hook`, `body`, `callToAction`, `hashtags` |
| `narrativeArc` | `NarrativeArcOutput` | 4 nhịp kịch bản: `SETUP`, `RISING`, `CLIMAX`, `CTA` |
| `estimatedCredits` | `number` | Số credits ước tính tiêu thụ |

---

## 4. Khu Vực C — Tạo Audio (Chặng 06b)

Khu vực C (`area-c`) thu âm kịch bản và hòa trộn nhạc nền.

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `scriptText` | `string` | YÊU CẦU | Lời thoại kịch bản cần đọc | Khu vực B (Contents) |
| `voiceId` | `string` | YÊU CẦU | Giọng đọc AI tiếng Việt (ấm áp, sang trọng, thanh lịch...) | Catalog Audio |
| `musicMood` | `string` | YÊU CẦU | Thể loại BGM (`romantic`, `energetic`, `calm`, `celebration`) | Catalog Nhạc |
| `targetDurationSeconds` | `number` | YÊU CẦU | Thời lượng mục tiêu cần cân bằng tự động | Video/Script duration |

#### Output:
| Field | Kiểu | Mô tả |
|---|---|---|
| `audioJobId` | `string` | Định danh job xử lý audio |
| `audioUrl` | `string` | URL file âm thanh đã ducking (MP3/WAV) |
| `durationSeconds` | `number` | Thời lượng thực tế sau khi mix |

---

## 5. Khu Vực D — Tạo Biến Thể Ảnh Marketing (Chặng 06c)

Khu vực D (`area-d`) phụ trách M04b Biến thể Marketing với 4 Khung Phân Cảnh Narrative Arc.

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `assetId` | `string` | YÊU CẦU | ID ảnh Master đã duyệt | Khu vực A / Master Asset |
| `productionMethod` | `"local" \| "provider"` | YÊU CẦU | `local` (Local Studio Backdrop Engine) hoặc `provider` (Cloud AI) | User chọn |
| `scenes` | `object[]` | YÊU CẦU | 4 Phân cảnh Narrative Arc (Setup, Rising, Climax, CTA) | M04b Engine |

#### Output (4 Khung Phân Cảnh Narrative Arc chuẩn hóa):
| Cảnh | Nhịp Beat | Preset Bối Cảnh | Mô Tả Đầu Ra |
|---|---|---|---|
| **Cảnh 1** | `SETUP` | `clean_white` | Studio Trắng Tinh Khôi, đổ bóng tiếp xúc 2 tầng, giữ nguyên 100% hoa thật |
| **Cảnh 2** | `RISING` | `boutique_bokeh` | Bối cảnh Lifestyle sảnh tiệc / khách sạn sang trọng, Bokeh f/1.8 |
| **Cảnh 3** | `CLIMAX` | `wood_warm` | Mặt bàn gỗ sồi Bắc Âu tối giản, cận cảnh thiệp OCR và ruy băng nơ |
| **Cảnh 4** | `CTA` | `transparent` | Tách nền PNG trong suốt bằng U2-Net / Rembg, sẵn sàng gắn logo shop |

#### Thông Số Kỹ Thuật Động Cơ Local Studio:
- **Tốc độ:** $\approx 0.46\text{s} \text{ / ảnh } 2048 \times 2048$ (nhờ cache mặt nạ `.rgba.png`).
- **Chi phí:** 0 VNĐ / 0 Token API, chạy offline 100%.
- **Subject Integrity:** Đạt tỷ lệ trùng khít $\ge 99.8\%$.

---

## 6. Khu Vực E — Tạo Video Marketing (Chặng 06d)

Khu vực E (`area-e`) điều phối M04c AI Video Studio.

#### Input:
| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `format` | `VideoFormat` | YÊU CẦU | 6 khuôn M04c: `REEL_15S`, `TIKTOK_30S`, `STORY_15S`, `SLIDESHOW`, `PRODUCT_PAGE`, `AD_MOTION` | User chọn |
| `aspectRatio` | `"9:16" \| "1:1" \| "16:9"` | YÊU CẦU | Tỷ lệ khung hình video | User chọn |
| `storyboard` | `SceneSpec[]` | YÊU CẦU | Mảng 2–15 cảnh: ảnh, thời lượng, chuyển cảnh | User/AI biên soạn |
| `cameraMotion` | `string` | YÊU CẦU | Hiệu ứng Ken Burns: `zoom_in`, `zoom_out`, `pan_right`, `static` | User chọn |
| `audioUrl` | `string` | TÙY CHỌN | URL file âm thanh đã thu từ Khu vực C | Khu vực C |
| `subtitleStyle` | `string` | YÊU CẦU | Phong cách phụ đề: `modern_badge`, `bold_center`, `minimal` | User chọn |

#### Output:
| Field | Kiểu | Mô tả |
|---|---|---|
| `videoJobId` | `string` | Định danh job render video |
| `videoUrl` | `string` | URL video MP4 hoàn thiện |
| `duration` | `number` | Thời lượng video thực tế |

---

## 7. Khu Vực F — Gói Chiến Dịch & Phê Duyệt (Chặng 07 → Chặng 09)

Khu vực F (`area-f`) là trạm kiểm soát chất lượng và chốt duyệt gói chiến dịch.

### 7.1. Chặng 07 — PACKAGE (Đóng gói chiến dịch)
- **Input:** Tổng hợp toàn bộ kết quả sản xuất từ Khu vực A, B, C, D, E.
- **Output (`CampaignPackage`):**
  * `packageId`: UUID định danh gói chiến dịch.
  * `masterImage`: Ảnh Master xác thực và Commercial Passport.
  * `copywriting`: Các bài viết đa kênh và kịch bản.
  * `audio`: File voiceover và BGM.
  * `marketingVariants`: 4 ảnh phân cảnh Narrative Arc.
  * `marketingVideo`: File video hoàn chỉnh.
  * `totalCredits`: Thống kê credit tiêu thụ.

### 7.2. Chặng 08 — QA (Kiểm định chất lượng tự động)
- **Input:** `CampaignPackage`.
- **Output (`QAReport`):**
  * `brandVoiceCheck`: `PASS` | `NEEDS_REVIEW`.
  * `productAccuracyCheck`: `PASS` | `NEEDS_REVIEW` (đối soát hoa và thiệp OCR).
  * `platformSpecsCheck`: `PASS` (tỷ lệ 9:16, 1:1, 16:9).

### 7.3. Chặng 09 — APPROVE (Chủ shop duyệt chốt thủ công)
- **Input:** Lựa chọn của chủ shop (`APPROVE_PUBLISH`, `EDIT`, `ASK_AI`).
- **Output:** Gói chuyển trạng thái `READY_TO_LAUNCH`, kích hoạt card `<PackageDownstreamCard />`.

---

## 8. Phân Phối & Bán Hàng Downstream (Chặng 10 → Chặng 14)

| Chặng | Tên Chặng | Input Chính | Output Chính & Tác Vụ Nghiệp Vụ |
|---|---|---|---|
| **Chặng 10** | **LAUNCH** | `packageId`, danh sách kênh (`facebook`, `tiktok`, `zalo`, `catalog`), lịch đăng | Xuất bản đa kênh thành công, tạo các bài post & video trực tuyến |
| **Chặng 11** | **SELL** | Khách tương tác với bài post/video | AI Chat Sales (M08) tư vấn dựa trên Passport, báo giá, tạo đơn hàng M10 |
| **Chặng 12** | **MEASURE** | Dữ liệu kinh doanh và chuyển đổi | Dashboard báo cáo: Reach, Engagement, Số đơn hoa chốt, Doanh thu (VNĐ) |
| **Chặng 13** | **LEARN** | Báo cáo hiệu quả chiến dịch | Trích xuất Winning Patterns (Bối cảnh ảnh, Hook kịch bản, Khung giờ vàng) |
| **Chặng 14** | **NEXT BEST ACTION** | Winning Patterns & Lịch sự kiện hoa tươi | Đề xuất thông minh: Tái sử dụng mẫu hoa cho dịp lễ kế tiếp, mở rộng kênh bán |

---

## 9. Sơ Đồ Data Flow Tổng Thể

```
[Chặng 01: BRING] ──> Tải ảnh hoa thật ──> Cấp phát assetId & Storage Key
       │
       ▼
[Chặng 02: UNDERSTAND] ──> Vision AI bóc tách nguyên tử hoa, lá đệm & OCR thiệp
       │
       ▼
[Chặng 03: DISCOVER] ──> Quét Trend Fit Matrix & Điểm thị trường
       │
       ▼
[Chặng 04: IDEATE] ──> 10 Chủ đề kèm Dẫn chứng Video Kép TikTok & YouTube
       │
       ▼
[Chặng 05: CHOOSE] ──> Chọn chủ đề & Mode ──> Xuất TopicProductionBrief (SSOT)
       │
       ├────────────────────────────────────────┬────────────────────────────────────────┐
       ▼                                        ▼                                        ▼
[Khu vực B: Contents]                  [Khu vực C: Audio]                     [Khu vực D: Biến thể ảnh]
Sinh Copy đa kênh & Kịch bản          Thu âm TTS & Phối BGM ducking          4 Phân cảnh Narrative Arc (Local Studio)
       │                                        │                                        │
       └────────────────────────────────────────┼────────────────────────────────────────┘
                                                │
                                                ▼
                                      [Khu vực E: Video]
                                      Biên tập Video M04c Ken Burns & Storyboard
                                                │
                                                ▼
                                      [Khu vực F: Gói chiến dịch]
                                      - Chặng 07: Tổng hợp Campaign Package
                                      - Chặng 08: AI QA kiểm định chất lượng
                                      - Chặng 09: Chủ shop duyệt chốt phát hành
                                                │
                                                ▼
                                  [Phân phối Downstream: Chặng 10–14]
                                  10. LAUNCH ──> 11. SELL ──> 12. MEASURE ──> 13. LEARN ──> 14. NEXT BEST ACTION
```
