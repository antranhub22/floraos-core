# Input/Output Specification — Creative Studio Pipeline

> **Mục đích:** Chuẩn hóa chính xác inputs và outputs của tất cả các bước
> từ Chặng 4 (IDEATE) → Chặng 14 (NEXT BEST ACTION) trong user journey
> "Quét theo Ảnh mẫu → Sáng tạo nội dung".
>
> **Nguyên tắc:**
> - Mỗi field đều có tên, kiểu, mô tả, bắt buộc/tùy chọn, nguồn gốc
> - Sau này nếu cần thay đổi fields → sửa tại đây, không sửa rải rác
> - Các bước/tabs trong Creative Studio đều đọc từ TopicProductionBrief
>   (SSOT cho data carry-forward Chặng 1-4)
>
> **Phiên bản:** 1.0 — 2026-09-21
> **Trạng thái:** CHỜ DUYỆT TRƯỚC KHI CODE

---

## 0. Chặng chuyển tiếp — Chuyển tiếp giữa Chặng 4 và Chặng 5

### 0.1 Mục đích

Chặng chuyển tiếp đảm bảo rằng sau Chặng 4 (IDEATE — chọn topic),
tất cả dữ liệu cần thiết cho 5 Khu vực Creative Studio đã được
chuẩn bị đầy đủ, đúng chuẩn, đồng bộ về nội dung theo topic đã chọn.

### 0.2 Input của Chặng chuyển tiếp

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `topicId` | string | YÊU CẦU | Topic đã chọn ở Chặng 04 | Chặng 04 IDEATE |
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | Loại hình sản xuất (user chọn) | Chặng 05 CHOOSE |
| `sourceImageUrl` | string | YÊU CẦU | Ảnh sản phẩm (Data URL hoặc URL) | Chặng 01 BRING |
| `sourceImageStorageKey` | string | TÙY CHỌN | Storage key ảnh gốc | Chặng 01 BRING |
| `sourceVideoUrl` | string | TÙY CHỌN | Video gốc (nếu user upload) | Chặng 01 BRING |
| `productName` | string | YÊU CẦU | Tên sản phẩm | Chặng 02 UNDERSTAND |
| `category` | string | YÊU CẦU | Danh mục sản phẩm | Chặng 02 UNDERSTAND |
| `style` | string | YÊU CẦU | Phong cách sản phẩm | Chặng 02 UNDERSTAND |
| `components` | string[] | YÊU CẦU | Thành phần hoa | Chặng 02 UNDERSTAND |
| `colors` | string[] | YÊU CẦU | Màu sắc | Chặng 02 UNDERSTAND |
| `priceRange` | string | TÙY CHỌN | Phân khúc giá | Chặng 02 UNDERSTAND |
| `targetAudience` | string | TÙY CHỌN | Đối tượng khách hàng | Chặng 02 UNDERSTAND |
| `suggestedOccasions` | string[] | TÙY CHỌN | Dịp gợi ý | Chặng 02 UNDERSTAND |
| `occasions` | string[] | YÊU CẦU | Dịp phù hợp (từ topic) | Chặng 02 + 04 |
| `targetDurationSeconds` | number | TÙY CHỌN | Thời lượng video mục tiêu | Chặng 05 CHOOSE |

### 0.3 Output của Chặng chuyển tiếp (TopicProductionBrief)

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `organizationId` | string | YÊU CẦU | Tổ chức (tenant isolation) |
| `productId` | string | TÙY CHỌN | Sản phẩm ID |
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | Loại hình sản xuất |
| `productContext.sourceImageUrl` | string | YÊU CẦU | Ảnh gốc |
| `productContext.sourceImageStorageKey` | string | TÙY CHỌN | Storage key ảnh |
| `productContext.sourceVideoUrl` | string | TÙY CHỌN | Video gốc |
| `productContext.sourceVideoDurationSeconds` | number | TÙY CHỌN | Thời lượng video (FFprobe) |
| `productContext.commercialPassport` | object | YÊU CẦU | Passport thương mại (productName, category, style, components, colors, priceRange?, targetAudience?, suggestedOccasions?) |
| `selectedTopics[].topicId` | string | YÊU CẦU | Topic ID |
| `selectedTopics[].topicTitle` | string | YÊU CẦU | Tiêu đề topic |
| `selectedTopics[].topicAngle` | string | YÊU CẦU | Góc tiếp cận |
| `selectedTopics[].topicCategory` | string | YÊU CẦU | Danh mục topic |
| `selectedTopics[].topicHook` | string | YÊU CẦU | Hook câu mở đầu |
| `selectedTopics[].topicCta` | string | YÊU CẦU | CTA |
| `selectedTopics[].topicEmotionalTone` | string | YÊU CẦU | Tông cảm xúc |
| `selectedTopics[].researchKeywords` | string[] | TÙY CHỌN | Từ khóa nghiên cứu |
| `selectedTopics[].trendScore` | number | TÙY CHỌN | Điểm xu hướng |
| `voiceId` | string | TÙY CHỌN | Voice ID (Audio Studio catalog) |
| `musicMood` | string | TÙY CHỌN | Mood nhạc nền |
| `targetVideoDurationSeconds` | number | TÙY CHỌN | Thời lượng video mục tiêu |

### 0.4 Quy tắc đồng bộ

- **Tất cả fields trong `selectedTopics[0]`** phải đồng bộ nội dung với topic đã chọn ở Chặng 04. Nếu topic thay đổi → brief thay đổi → tất cả tabs re-render.
- **`productContext.commercialPassport`** lấy từ Vision AI (Chặng 02) + user edit. KHÔNG tự động điền lại khi user đã chỉnh sửa.
- **`sourceVideoDurationSeconds`** tự động detect bằng FFprobe khi user upload video. Nếu không có video → `undefined`.
- **`mode`** do user chọn ở Chặng 5, mặc định `CREATIVE`. Không thay đổi mode giữa chừng (nếu muốn → quay lại Chặng 5).

---

## 1. Chặng 5 — CHOOSE (Chọn định hướng)

### 1.1 Input

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `topicId` | string | YÊU CẦU | Topic đã chọn | Chặng 04 |
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | User chọn (CREATIVE mặc định) | User |
| `sourceImageUrl` | string | YÊU CẦU | Ảnh sản phẩm | Chặng 01 |
| `sourceVideoUrl` | string | TÙY CHỌN | Video gốc | Chặng 01 |
| `productContext` | object | YÊU CẦU | Passport thương mại | Chặng 02 |
| `topic` | object | YÊU CẦU | Topic info | Chặng 04 |

### 1.2 Output

| Field | Kiểu | Mô tả |
|---|---|---|
| `topicSelection` | object | Topic + mode đã chọn |
| `brief` | TopicProductionBrief | Đầu vào chuẩn hóa cho Creative Studio |
| `nextStep` | string | Chặng tiếp theo (Chặng 6 — Tab 1: Tối ưu đầu vào) |

### 1.3 User choices tại bước này

- Chọn topic (1 trong 10 topic từ Chặng 04)
- Chọn mode (CREATIVE mặc định hoặc AUTHENTIC)
- Chọn đầu vào (ảnh, video, cả hai)

---

## 2. Chặng 6 — CREATE (Sáng tạo nội dung) — 5 Khu vực

### 2.0 Quy tắc chung

- **User chọn những gì sẽ sản xuất** ở mỗi Khu vực (content, audio, image, video)
- **User chọn mode** (CREATIVE/AUTHENTIC) — nhất quán xuyên các Khu vực
- **Mỗi Khu vực phải được duyệt** trước khi chuyển sang Khu vực tiếp theo
- **Tất cả Khu vực đều đọc từ TopicProductionBrief** — không nhập lại

---

### 2.1 Tab 1: Tối ưu ảnh/video đầu vào

#### Input

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `sourceImageUrl` | string | YÊU CẦU | Ảnh gốc | Chặng chuyển tiếp |
| `sourceVideoUrl` | string | TÙY CHỌN | Video gốc | Chặng chuyển tiếp |
| `optimizeMode` | "OPTIMIZE" \| "KEEP_ORIGINAL" | YÊU CẦU | Tối ưu hay giữ nguyên (user chọn) | User |
| `targetRatios` | string[] | YÊU CẦU | Tỷ lệ cần tối ưu (1:1, 4:5, 9:16, 16:9) | User |
| `productContext.commercialPassport` | object | YÊU CẦU | Passport | Chặng chuyển tiếp |

#### Output

| Field | Kiểu | Mô tả |
|---|---|---|
| `masterAsset` | object | Master Image đã tối ưu (hoặc gốc nếu keep_original) |
| `ratioAssets` | object[] | Các bản dẫn xuất theo tỷ lệ (nếu OPTIMIZE) |
| `masterReady` | boolean | Master đã sẵn sàng cho các Tab khác |

#### User choices

- Optimize hay giữ nguyên ảnh
- Chọn tỷ lệ tối ưu (1:1, 4:5, 9:16, 16:9)

---

### 2.2 Tab 2: Viết contents

#### Input

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | Mode sản xuất | Chặng 5 |
| `topic` | object | YÊU CẦU | Topic info | Chặng chuyển tiếp |
| `productContext` | object | YÊU CẦU | Product context | Chặng chuyển tiếp |
| `contentTypes` | string[] | YÊU CẦU | Loại nội dung cần tạo | User chọn |
| `authenticContent` | string | TÙY CHỌN | Content gốc do user upload (nếu AUTHENTIC) | User upload |

**Lưu ý AUTHENTIC:** Nếu user upload contents (caption, script, post), hệ thống sử dụng chính contents đó, KHÔNG dùng narrative arc hay content styles.

#### Output (CREATIVE mode)

| Field | Kiểu | Mô tả |
|---|---|---|
| `contentBriefs` | object[] | Caption, hashtags, scripts cho từng nền tảng |
| `narrativeArc` | NarrativeArcOutput | Cung truyện (nếu CREATIVE) |
| `storyboard` | SceneSpec[] | Storyboard scenes |

#### Output (AUTHENTIC mode)

| Field | Kiểu | Mô tả |
|---|---|---|
| `contentBriefs` | object[] | Content dựa trên user upload |
| `narrativeArc` | NarrativeArcOutput | Narrative arc (nếu user chọn tạo) |

#### User choices

- Chọn mode (CREATIVE mặc định hoặc AUTHENTIC)
- Chọn loại nội dung cần tạo (caption, hashtags, post, script)
- AUTHENTIC: upload content gốc hoặc dùng content có sẵn
- CREATIVE: chọn content styles, narrative arc

---

### 2.3 Tab 3: Tạo audio

#### Input

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | Mode | Chặng 5 |
| `topic` | object | YÊU CẦU | Topic info | Chặng chuyển tiếp |
| `voiceId` | string | TÙY CHỌN | Voice ID | User chọn từ catalog |
| `musicMood` | string | TÙY CHỌN | Mood nhạc nền | User chọn |
| `targetDurationSeconds` | number | YÊU CẦU | Thời lượng mục tiêu (sync với video) | Video duration hoặc user |
| `qualityTier` | "standard" \| "hd" \| "premium" | YÊU CẦU | Chất lượng TTS | User chọn |
| `providerKey` | string | TÙY CHỌN | Provider (openai, elevenlabs, edge_tts...) | User chọn hoặc default |

#### Output

| Field | Kiểu | Mô tả |
|---|---|---|
| `voiceSegments` | object[] | Voice từng scene |
| `mixedAudio` | object | Voice + BGM phối trộn |
| `audioDuration` | number | Thời lượng audio (đồng bộ video) |
| `audioUrl` | string | URL audio |

#### User choices

- Chọn voice (TTS provider + voice code)
- Chọn nhạc nền (mood/track)
- Chọn chất lượng (standard/hd/premium)
- Chọn provider (mặc định: auto-routing)

---

### 2.4 Tab 4: Tạo biến thể ảnh

#### Input

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | Mode | Chặng 5 |
| `masterImage` | object | YÊU CẦU | Master Image (từ Tab 1) | Tab 1 |
| `variantRequests` | object[] | YÊU CẦU | Yêu cầu biến thể | User chọn |
| `productionMethod` | "local" \| "provider" | YÊU CẦU | Phương thức sản xuất | User chọn |
| `providerKey` | string | TÙY CHỌN | Provider (photoroom, fal, imagen...) | User chọn (nếu provider) |
| `productContext.commercialPassport` | object | YÊU CẦU | Passport | Chặng chuyển tiếp |

#### Output

| Field | Kiểu | Mô tả |
|---|---|---|
| `variants` | object[] | Biến thể đã tạo |
| `integrityScores` | object[] | Subject Integrity mỗi biến thể |
| `approvedVariant` | object | Biến thể đã duyệt (nếu duyệt) |

#### User choices

- **Production method:** Local (P17 default, 0 credit) hoặc Provider (M04b, có credit)
- Nếu provider: chọn provider (photoroom, fal, google_imagen, stability_ai...)
- Chọn preset bối cảnh (Studio, Lifestyle, Romantic...)
- Chọn số lượng biến thể
- **Rất quan trọng:** User chủ động chọn local hay provider

---

### 2.5 Tab 5: Tạo video

#### Input

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | Mode | Chặng 5 |
| `format` | VideoFormat | YÊU CẦU | Khuôn video (REEL_15S, TIKTOK_30S...) | User chọn |
| `aspectRatio` | string | YÊU CẦU | Tỷ lệ khung hình | User chọn |
| `scenes` | SceneSpec[] | YÊU CẦU | Storyboard scenes | Tab 2 (nếu CREATIVE) |
| `masterImage` | object | YÊU CẦU | Master Image | Tab 1 |
| `voiceScript` | string[] | TÙY CHỌN | Voice script (nếu đã tạo audio Tab 3) | Tab 3 |
| `musicTrack` | string | TÙY CHỌN | Music track | Tab 3 |
| `productionMethod` | "local" \| "provider" | YÊU CẦU | Phương thức sản xuất | User chọn |
| `providerKey` | string | TÙY CHỌN | Provider | User chọn (nếu provider) |
| `captionStyle` | CaptionStyle | TÙY CHỌN | Phụ đề style | User chọn |
| `hasSubtitle` | boolean | YÊU CẦU | Có phụ đề không | User chọn |
| `hasWatermark` | boolean | YÊU CẦU | Có watermark không | User chọn |
| `voiceCode` | string | TÙY CHỌN | Voice code | Tab 3 hoặc user chọn |

#### Output

| Field | Kiểu | Mô tả |
|---|---|---|
| `videoJobId` | string | Job ID video |
| `storyboard` | SceneSpec[] | Storyboard đã tạo |
| `videoUrl` | string | URL video (sau khi render) |
| `duration` | number | Thời lượng video |
| `approvalState` | string | Trạng thái duyệt |

#### User choices

- Chọn khuôn video (6 khuôn M04c)
- Chọn tỷ lệ khung hình
- Chọn phương thức sản xuất (local/provider) — RẤT QUAN TRỌNG
- Chọn phụ đề style
- Chọn camera motion (Ken Burns: zoom_in/out, pan_left/right/up, static)
- Chọn voice (Tab 3 hoặc mới chọn)

---

## 3. Chặng 7 — PACKAGE (Đóng gói chiến dịch)

### 3.1 Input

| Field | Kiểu | Bắt buộc | Mô tả | Nguồn |
|---|---|---|---|---|
| `campaignName` | string | TÙY CHỌN | Tên chiến dịch | User |
| `mode` | "CREATIVE" \| "AUTHENTIC" | YÊU CẦU | Mode | Chặng 5 |
| `topicIds` | string[] | YÊU CẦU | Topic IDs | Chặng 4 |
| `authenticResult` | object | TÙY CHỌN | Kết quả AUTHENTIC (Tab 2) | Tab 2 |
| `creativeResult` | object | TÙY CHỌN | Kết quả CREATIVE (Tab 2) | Tab 2 |
| `producedAssets` | object[] | YÊU CẦU | Tất cả assets đã sản xuất | Tabs 1-5 |

### 3.2 Output

| Field | Kiểu | Mô tả |
|---|---|---|
| `campaignPackage` | CampaignPackage | Gói chiến dịch hoàn chỉnh |
| `creditsCost` | number | Tổng credit đã dùng |
| `status` | "DRAFT" \| "PRODUCING" \| "READY" \| "PUBLISHED" | Trạng thái |

---

## 4. Chặng 8-14 (QA, Approve, Launch, Sell, Measure, Learn, Next Best Action)

### 4.1 Input chung

| Field | Kiểu | Mô tả |
|---|---|---|
| `campaignPackageId` | string | Campaign Package ID |
| `organizationId` | string | Tổ chức |
| `mode` | "CREATIVE" \| "AUTHENTIC" | Mode |

### 4.2 Chặng 8 QA

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `campaignPackageId` | string | YÊU CẦU | Package cần QA |
| `checks` | object[] | YÊU CẦU | Các check: Brand, Product, Content, Platform |

Output: PASS hoặc NEEDS_REVIEW kèm chi tiết

### 4.3 Chặng 9 APPROVE

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `campaignPackageId` | string | YÊU CẦU | Package cần duyệt |
| `approval` | "APPROVE" \| "EDIT" \| "ASK_AI" | YÊU CẦU | Hành động user chọn |

### 4.4 Chặng 10 LAUNCH

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `campaignPackageId` | string | YÊU CẦU | Package cần launch |
| `channels` | string[] | YÊU CẦU | Kênh: facebook, instagram, tiktok, zalo... |
| `schedule` | datetime | TÙY CHỌN | Thời gian đăng (nếu schedule) |

### 4.5 Chặng 11 SELL

| Field | Kiểu | Mô tả |
|---|---|---|
| `campaignPackageId` | string | Campaign đã publish |
| `contentAssets` | object[] | Content assets dùng để bán |

→ Kết nối AI Sales (M08 Chat Assistant)

### 4.6 Chặng 12 MEASURE

| Field | Kiểu | Mô tả |
|---|---|---|
| `campaignPackageId` | string | Campaign đã publish |
| `metrics` | object | Reach, engagement, conversion, revenue... |

### 4.7 Chặng 13-14 LEARN + NEXT BEST ACTION

| Field | Kiểu | Mô tả |
|---|---|---|
| `campaignPackageId` | string | Campaign đã measure |
| `winningPatterns` | object[] | Pattern chiến thắng |
| `nextBestAction` | object | Hành động tối ưu tiếp theo |

---

## 5. Sơ đồ data flow tổng thể

```
Chặng 4 IDEATE
    │ topicId, productContext, visionAnalysis, trendReport
    ↓
Chặng chuyển tiếp (0)
    │ Standardize → TopicProductionBrief
    │ Đồng bộ tất cả fields theo topic đã chọn
    │ Video: URL + duration (FFprobe)
    ↓
Chặng 5 CHOOSE (1)
    │ User chọn: topic, mode, đầu vào (ảnh/video/cả hai)
    │ Output: TopicProductionBrief hoàn chỉnh
    ↓
┌─────────────────────────────────────────────────┐
│ Creative Studio (/creative-studio)               │
│                                                  │
│  Tab 1: Tối优化 ảnh/video đầu vào (2)           │
│    Input: sourceImageUrl, sourceVideoUrl,        │
│           optimizeMode, targetRatios             │
│    Output: masterImage, ratioAssets              │
│    User quyết định: optimize hay keep original   │
│    ↓                                             │
│  Tab 2: Contents (3)                           │
│    Input: mode, topic, productContext,           │
│           contentTypes, [authenticContent]       │
│    Output: contentBriefs, narrativeArc,          │
│            storyboard                            │
│    User quyết định: CREATIVE/AUTHENTIC,          │
│           loại nội dung, content styles         │
│    ↓                                             │
│  Tab 3: Audio (4)                              │
│    Input: mode, topic, voiceId, musicMood,      │
│           targetDurationSeconds, qualityTier     │
│    Output: voiceSegments, mixedAudio             │
│    User quyết định: voice, music, provider,     │
│           quality                                │
│    ↓                                             │
│  Tab 4: Biến thể ảnh (5)                       │
│    Input: mode, masterImage, variantRequests,   │
│           productionMethod, providerKey          │
│    Output: variants, integrityScores            │
│    User quyết định: local/provider, preset,     │
│           số lượng biến thể                     │
│    ↓                                             │
│  Tab 5: Video (6)                              │
│    Input: mode, format, scenes, masterImage,    │
│           voiceScript, musicTrack,               │
│           productionMethod, providerKey,         │
│           captionStyle, video options           │
│    Output: videoJobId, videoUrl                 │
│    User quyết định: khuôn, tỷ lệ, local/        │
│           provider, phụ đề, camera motion       │
│                                                  │
│    ↓ (Tất cả Tab đã duyệt)                      │
│  Chặng 7: Package (7)                          │
│    Input: all assets from Tabs 1-5              │
│    Output: CampaignPackage                      │
│    ↓                                             │
│  Chặng 8: QA → Chặng 9: Approve → Chặng 10:    │
│  Launch → Chặng 11: Sell → Chặng 12: Measure → │
│  Chặng 13-14: Learn + Next Best Action          │
└─────────────────────────────────────────────────┘
```

---

## 6. Production Method Choice (Quan trọng)

Tại Tab 4 (Biến thể ảnh) và Tab 5 (Video), user chủ động chọn:

| Production Method | Ưu điểm | Nhược điểm | Credit |
|---|---|---|---|
| **Local** (M04a/M04c default) | Nhanh, miễn phí, không cần API key | Không có AI generative fill, chỉ local processing | 0 |
| **Provider** (M04b) | AI biến hóa cao, nhiều style | Cần API key, tốn credit | 1 credit/lượt |

**Quy tắc:**
- Tab 4 (Biến thể ảnh): User chọn local hoặc provider. Nếu provider → chọn provider cụ thể (photoroom, fal, imagen...).
- Tab 5 (Video): User chọn local (FFmpeg) hoặc provider (Veo, HeyGen...).
- Mọi thay đổi production method → record trong audit_logs.

**Năng lực:** I1 (sáng tạo nội dung đa phương tiện) — áp dụng cho cả local lẫn provider.

---

## 7. Authentic Mode — User Content Override

Khi mode = AUTHENTIC, user có thể upload original content:

| Field | Mô tả |
|---|---|
| `authenticContent.caption` | Caption gốc do user viết |
| `authenticContent.script` | Script gốc do user viết |
| `authenticContent.post` | Bài post gốc do user viết |
| `authenticContent.videoScript` | Video script gốc do user viết |

**Quy tắc:**
- Nếu user upload content gốc → dùng chính content đó. KHÔNG dùng narrative arc hay content styles.
- Nếu user KHÔNG upload → dùng default từ topic (narrative arc nhẹ, factual tone).
- Audio trong AUTHENTIC mode vẫn dùng TTS (voice factual) + BGM nhẹ.
- Video trong AUTHENTIC mode: KHÔNG tạo video mới (sản phẩm thật không cần quay). Chỉ crop ảnh gốc.

---

## 8. Video Duration Handling

Khi user upload video:
1. **FFprobe** tự động detect duration → `sourceVideoDurationSeconds`
2. **Chặng chuyển tiếp** ghi nhận duration
3. **Tab 3 (Audio):** voice duration + music loop = video duration (auto-pad)
4. **Tab 5 (Video):** storyboard scenes tổng duration = video duration (auto-balance)
5. **User có thể override** `targetVideoDurationSeconds` nếu muốn khác với video gốc

**Lưu ý:** Phân tích video nội dung (object detection, scene analysis) → ĐỢT SAU. Hiện tại chỉ dùng duration để sync timing.
