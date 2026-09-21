# User Journey — Quét theo Ảnh mẫu → Sáng tạo nội dung

> **Mục đích:** Mô tả chi tiết luồng trải nghiệm người dùng từ
> Chặng 4 (IDEATE) đến Chặng 14 (NEXT BEST ACTION) trong
> user journey "Quét theo Ảnh mẫu → Sáng tạo nội dung".
>
> **Tài liệu chuẩn hóa:** Dùng làm tham chiếu cho development,
> QA, design, và future changes.
>
> **Phiên bản:** 1.0 — 2026-09-21
> **Trạng thái:** CHỜ DUYỆT TRƯỚC KHI CODE

---

## Người dùng mục tiêu

- **Store Owner / Shop Manager** — người quản lý cửa hàng hoa
- Đã hoàn thành Chặng 01-04 (BRING, UNDERSTAND, DISCOVER, IDEATE)
- Đang ở Chặng 05 (CHOOSE) — cần tiếp tục sáng tạo nội dung

---

## Tổng quan journey

```
01. BRING         📸 Tải ảnh/video sản phẩm
02. UNDERSTAND    🔎 AI hiểu sản phẩm (chỉ ảnh)
03. DISCOVER      🔥 Nghiên cứu xu hướng & cơ hội
04. IDEATE        💡 Sinh 10 chủ đề kèm Dẫn chứng Video Kép
───────────────────────────────────────────────────────
▶ CHẶNG CHUYỂN TIẾP (Chặng 5): Chuẩn hóa inputs cho Creative Studio
05. CHOOSE        🎯 Chọn topic, mode, đầu vào
06. CREATE        ✍️ 5 Khu vực Creative Studio (sản xuất)
07. PACKAGE       📦 Đóng gói chiến dịch
08. QA            🤔 AI kiểm chất lượng
09. APPROVE       👤 Owner duyệt thủ công
10. LAUNCH        🚀 Đăng tải / Lên lịch
11. SELL          💬 AI Sales tư vấn chốt đơn
12. MEASURE       📊 Đo lường hiệu quả
13. LEARN         🧠 Trích xuất Winning Patterns
14. NEXT BEST     🎯 Đề xuất hành động tối ưu tiếp theo
```

**Quy tắc thủ công (theo yêu cầu):** Mỗi bước yêu cầu user xác nhận/trước khi tiếp tục. Không tự động chuyển bước.

---

## Chặng chuyển tiếp (giữa Chặng 4 và Chặng 5)

### Mục đích

Chặng này chuẩn bị đầy đủ inputs đúng chuẩn cho tất cả các tab
trong Creative Studio. Tất cả nội dung đồng bộ về topic mà user
đã chọn ở Chặng 04, đảm bảo mỗi tab đều có đủ dữ liệu để triển khai.

### User action

1. Xem tổng hợp dữ liệu đã chuẩn bị:
   - ✅ Ảnh sản phẩm đã sẵn sàng
   - ✅ Vision AI đã phân tích (hoặc cần chờ)
   - ✅ Topic đã chọn đồng bộ
   - ✅ Video metadata đã detect (nếu có)
2. Xem preview topic + sản phẩm
3. Click **"Tiếp tục sang Creative Studio"** → `/creative-studio`

### System action

- Đọc tất cả data từ Chặng 01-04
- Validate: tất cả required fields có mặt
- Standardize → TopicProductionBrief
- Video: auto-detect duration (FFprobe)
- Nếu thiếu field → thông báo user fill thêm

### Output

TopicProductionBrief hoàn chỉnh, đồng bộ theo topic đã chọn.

---

## Chặng 5 — CHOOSE (Chọn định hướng)

### UI

Modal overlay trên `/thi-truong`:

- Topic đã chọn (tiêu đề, hook, CTA, tông cảm xúc)
- Ảnh/video đầu vào (preview)
- Mode: CREATIVE (mặc định) hoặc AUTHENTIC
- Đầu vào: ảnh, video, cả hai

### User action

1. Xem lại topic + preview
2. Chọn mode (CREATIVE mặc định)
3. Chọn đầu vào (ảnh/video/cả hai)
4. Click **"Bắt đầu sáng tạo nội dung"**

### System action

- Tạo TopicProductionBrief (mode = CREATIVE/AUTHENTIC)
- Navigate → `/creative-studio?topic={id}&mode={mode}`

### User choices

- Chọn topic (1/10 từ Chặng 04)
- Chọn mode (CREATIVE mặc định, AUTHENTIC tùy chọn)
- Chọn đầu vào (ảnh, video, cả hai)

### Duyệt

User phải click "Bắt đầu" → mới vào Creative Studio. Không tự động.

---

## Chặng 6 — CREATE (5 Khu vực Creative Studio)

### UI

Creative Studio (`/creative-studio`) với 5 tabs + Top-Right Action Header:

| Tab | Label | Icon |
|---|---|---|
| 1 | Tối ưu ảnh/video đầu vào | 📸 |
| 2 | Contents | ✍️ |
| 3 | Audio | 🎙️ |
| 4 | Biến thể ảnh | 🖼️ |
| 5 | Video | 🎬 |

**Top-Right Action Header:**
- **Primary Buttons:** Tạo nội dung / Tạo audio / Tạo biến thể / Tạo video (tùy tab)
- **Overflow Menu (⋯):** Tải file, Lưu nháp, Quay lại Chặng 4, Quay về Trang chủ

### Quy tắc chung

- Mỗi tab phải được duyệt → mới sang tab tiếp theo
- User được chọn những gì sẽ sản xuất (content, audio, image, video)
- Mode (CREATIVE/AUTHENTIC) nhất quán xuyên các tab
- Tất cả tabs đọc từ TopicProductionBrief — KHÔNG nhập lại

---

### Tab 1: Tối ưu ảnh/video đầu vào

#### UI

```
┌──────────────────────────────────────────────┐
│ 📸 Tối ưu ảnh/video đầu vào                  │
│                                                │
│ [Ảnh gốc] [Video gốc (nếu có)]              │
│                                                │
│ Tối ưu hay giữ nguyên?                        │
│ ○ Tối ưu (mặc định)                           │
│ ○ Giữ nguyên ảnh                              │
│                                                │
│ Chọn tỷ lệ: ☐ 1:1 ☐ 4:5 ☐ 9:16 ☐ 16:9     │
│                                                │
│ [ Tối ưu ảnh ] [ Giữ nguyên ]               │
└──────────────────────────────────────────────┘
```

#### User choices

- Optimize hay keep original
- Chọn tỷ lệ (1:1, 4:5, 9:16, 16:9)

#### System action

- OPTIMIZE: Vision AI xử lý + tạo ratio assets
- KEEP_ORIGINAL: Dùng ảnh gốc làm Master

#### Duyệt

User chọn action → Master ready → Tab 2 mở ra

---

### Tab 2: Contents (Viết nội dung)

#### UI

```
┌──────────────────────────────────────────────┐
│ ✍️ Contents — CREATIVE (mặc định)            │
│                                                │
│ Mode: [CREATIVE] [AUTHENTIC]                │
│                                                │
│ CREATIVE mode:                                │
│ • Auto-generated caption                     │
│ • Hashtags                                   │
│ • TikTok/Reel script                         │
│ • Story copy                                 │
│ • Narrative arc preview                     │
│                                                │
│ AUTHENTIC mode:                               │
│ • Upload content gốc                        │
│ • hoặc dùng content có sẵn                  │
│                                                │
│ Chọn loại nội dung:                           │
│ ☑️ Caption  ☑️ Hashtags  ☑️ Script          │
│ ☐ Post hoàn chỉnh  ☐ Story                 │
│                                                │
│ [ Tạo nội dung ]                             │
└──────────────────────────────────────────────┘
```

#### User choices

- Mode (CREATIVE mặc định, AUTHENTIC tùy chọn)
- Loại nội dung cần tạo (caption, hashtags, script, post, story)
- AUTHENTIC: upload content gốc hoặc dùng có sẵn
- CREATIVE: content styles, narrative arc

#### System action

- CREATIVE: `produceCreative()` → content briefs + narrative arc
- AUTHENTIC: `produceAuthentic()` → content from user upload

#### Duyệt

User tạo content → Tab 3 hoặc Tab 4 mở ra (tùy user chọn)

---

### Tab 3: Tạo audio

#### UI

```
┌──────────────────────────────────────────────┐
│ 🎙️ Audio                                    │
│                                                │
│ Voice: [chọn voice ▼]                        │
│ Provider: [Auto ▼]                            │
│ Quality: [Standard ▼]                        │
│ Music: [Chọn nhạc ▼]                         │
│                                                │
│ Video duration: 15s (auto-sync)              │
│ Target duration: [15s]                        │
│                                                │
│ [ Tạo audio ]                                │
│                                                │
│ Preview: ▶ [audio player]                    │
└──────────────────────────────────────────────┘
```

#### User choices

- Voice (TTS provider + voice code)
- Provider (auto-routing hoặc chọn cụ thể)
- Music mood
- Quality tier
- Target duration (sync với video hoặc custom)

#### System action

- TTS: generate voice cho từng scene
- Music: resolve + pad
- Mix: voice + BGM with ducking
- Duration: auto-sync với video duration

#### Duyệt

Audio tạo xong → Tab 4 hoặc Tab 5 mở ra

---

### Tab 4: Biến thể ảnh

#### UI

```
┌──────────────────────────────────────────────┐
│ 🖼️ Biến thể ảnh                             │
│                                                │
│ Production: [Local ▼] [Provider ▼]          │
│                                                │
│ Local (miễn phí):                             │
│ • Chỉnh sáng, backdrop, watermark            │
│ • Giữ nguyên sản phẩm                       │
│                                                │
│ Provider (1 credit):                         │
│ • Provider: [Photoroom ▼]                   │
│ • Preset: [Studio ▼]                         │
│ • Số biến thể: [3 ▼]                        │
│                                                │
│ [ Tạo biến thể ]                             │
│                                                │
│ Integrity: [●●●●● PASS] (Subject Integrity) │
└──────────────────────────────────────────────┘
```

#### User choices

- **Production method: Local hoặc Provider** (rất quan trọng)
- Nếu Provider: chọn provider, preset, số biến thể
- Subject Integrity check

#### System action

- Local: xử lý ảnh (backdrop, defringe, watermark)
- Provider: gọi `POST /api/v1/media/variants` → enqueueJob("media.variant")
- Integrity: Subject Integrity Guard (0.95/0.90)

#### Duyệt

Biến thể tạo xong + duyệt → Tab 5 hoặc Package

---

### Tab 5: Video

#### UI

```
┌──────────────────────────────────────────────┐
│ 🎬 Video                                     │
│                                                │
│ Format: [REEL_15S ▼]                         │
│ Ratio: [9:16 ▼]                              │
│ Duration: 15s (auto-sync video)             │
│                                                │
│ Production: [Local ▼] [Provider ▼]          │
│ Provider: [Veo ▼] [HeyGen ▼]                │
│                                                │
│ Subtitles: [Modern Badge ▼]                  │
│ Watermark: ☑️                               │
│ Voice: [voice from Tab 3 ▼]                 │
│                                                │
│ Storyboard: 3 scenes                         │
│ [ Edit Storyboard ]                          │
│                                                │
│ [ Tạo video ]                                │
│                                                │
│ Preview: ▶ [video player]                    │
└──────────────────────────────────────────────┘
```

#### User choices

- Khuôn video (6 khuôn M04c)
- Tỷ lệ khung hình
- Production method (local/provider)
- Provider (Veo, HeyGen if provider)
- Subtitle style
- Camera motion (Ken Burns: zoom/pan/static)
- Voice (Tab 3 hoặc mới chọn)

#### System action

- Local: FFmpeg render (0 credit, ~0.45s/cảnh)
- Provider: Google Veo / HeyGen API
- Storyboard: auto-balance duration theo video length

#### Duyệt

Video tạo xong → Package

---

## Chặng 7 — PACKAGE (Đóng gói chiến dịch)

### UI

```
┌───────────────────────────────────────────────────┐
│ 📦 Campaign Package                                │
│                                                     │
| Product: {productName}                            |
| Mode: CREATIVE / AUTHENTIC                        |
│                                                     │
| ✍️ Contents: {nội dung}                          |
| 🖼️ Images: {n} biến thể                          |
| 🎬 Video: {video URL}                            |
| 🎙️ Audio: {audio URL}                           |
│                                                     │
| Tổng credit: {number}                             |
│                                                     │
| [ Đóng gói chiến dịch ]  ← Cần duyệt             |
| [ Sửa lại ]                                        |
└───────────────────────────────────────────────────┘
```

### User action

1. Xem tổng hợp tất cả assets
2. Xem credit đã dùng
3. Click "Đóng gói chiến dịch" (cần duyệt thủ công)

### System action

- Gọi `POST /api/v1/creative-production/package`
- Tổng hợp CampaignPackage
- Record audit

### Duyệt

User xác nhận → CampaignPackage CREATED → Chặng 8 QA

---

## Chặng 8 — QA (Kiểm chất lượng)

### UI

```
┌──────────────────────────────────────────────┐
│ 🤖 QA Report                                   |
│                                                   |
| Brand Voice:       ✅ PASS                      |
| Product Accuracy:  ✅ PASS                      |
| Content Quality:   ⚠️ NEEDS REVIEW            |
| Platform Sizes:    ✅ PASS                      |
| Grammar:           ✅ PASS                      |
│                                                   |
| [ Xem chi tiết ]                                 |
| [ Gửi AI nâng cấp ]                             |
| [ Tiếp tục ]                                    |
└──────────────────────────────────────────────┘
```

### User action

- Xem report
- [Gửi AI nâng cấp]: AI sửa issues → QA lại
- [Tiếp tục]: nếu PASS hoặc đã sửa

### Duyệt

User xác nhận → QA PASSED → Chặng 9 Approve

---

## Chặng 9 — APPROVE (Phê duyệt thủ công)

### UI

```
┌────────────────────────────────────────────────┐
│ CAMPAIGN READY                                    |
|                                                     |
| 🌸 Product          ✅ PASS                       |
| ✍️ Content          ✅ PASS                       |
| 🖼️ Images           ✅ PASS                       |
| 🎬 Video            ✅ PASS                       |
| 🎙️ Audio            ✅ PASS                       |
| 📱 Channels         ✅ PASS                       |
| 🤖 QA               ✅ PASS                       |
|                                                     |
| [ APPROVE & PUBLISH ]  ← Duyệt thủ công        |
| [ EDIT ]                                            |
| [ ASK AI TO IMPROVE ]                             |
└────────────────────────────────────────────────┘
```

### User action

- [APPROVE & PUBLISH]: Duyệt + đăng → Chặng 10 Launch
- [EDIT]: Sửa lại → quay lại tab cần sửa
- [ASK AI TO IMPROVE]: AI đề xuất cải thiện

### Duyệt

**Bắt buộc:** User phải click APPROVE → Chặng 10 Launch

---

## Chặng 10 — LAUNCH (Đăng tải)

### UI

```
┌──────────────────────────────────────────────┐
| 🚀 Launch Campaign                            |
|                                                   |
| Chọn kênh:                                      |
| ☑️ Facebook  ☑️ Instagram  ☑️ TikTok          |
| ☑️ Zalo  ☑️ Website  ☑️ Google Business       |
|                                                   |
| [ Đăng ngay ]  [ Lên lịch ]                    |
|                                                   |
| Nếu Lên lịch:                                   |
| [ Ngày giờ: ____ ]                             |
└──────────────────────────────────────────────┘
```

### User action

- Chọn kênh đăng
- [Đăng ngay] hoặc [Lên lịch]

### Duyệt

User xác nhận → Campaign PUBLISHED → Chặng 11 Sell

---

## Chặng 11-14 (SELL, MEASURE, LEARN, NEXT BEST ACTION)

### Chặng 11 — SELL

Kết nối AI Sales (M08 Chat Assistant):
- Content → Attention → Message → AI Sales → Recommendation → Quote → Order
- User quan sát AI Sales tư vấn

### Chặng 12 — MEASURE

Dashboard analytics:
- Reach, engagement, conversion, revenue
- AI tự tính metrics

### Chặng 13 — LEARN

AI phân tích Winning Patterns:
- Content nào hiệu quả nhất
- Kênh nào chuyển đổi tốt nhất
- Thời điểm đăng tối ưu

### Chặng 14 — NEXT BEST ACTION

AI đề xuất hành động tiếp theo:
- "Nội dung này đang bán tốt → thử đăng ở thêm kênh X"
- "Khách hàng phản hồi nhiều ở comment → reply nhanh hơn"
- "Theme này bán chạy → tạo theme tương tự"

---

## Tổng kết User Choices tại mỗi bước

| Bước | User Choices |
|---|---|
| Chặng 5 | Topic, Mode (CREATIVE/AUTHENTIC), Đầu vào (ảnh/video/cả hai) |
| Tab 1 | Optimize hay Keep, Tỷ lệ |
| Tab 2 | Mode, Content Types, AUTHENTIC upload, CREATIVE styles |
| Tab 3 | Voice, Provider, Music, Quality, Duration |
| Tab 4 | Local/Provider, Preset, Số biến thể, Provider cụ thể |
| Tab 5 | Format, Ratio, Local/Provider, Provider, Subtitle, Camera Motion |
| Chặng 7 | Campaign Name |
| Chặng 8 | AI Improve hay Continue |
| Chặng 9 | Approve, Edit, or Ask AI |
| Chặng 10 | Channels, Now or Schedule |

**Nguyên tắc:** User quyết định ở MỌI bước. Không có bước nào tự động chuyển.
