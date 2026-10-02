# ĐẶC TẢ KIẾN TRÚC UX JOURNEY-FIRST: CHỨC NĂNG TẠO LANDING PAGE & CATALOG SỐ

> **Mã tài liệu:** `DOC-05-SPEC-JOURNEY-UX-LANDING-CATALOG`  
> **Phiên bản:** v1.0 — Ngày 01/10/2026  
> **Thuộc hệ thống:** `floraos-core`  
> **Cơ sở kiến trúc:** [`FLORAOS_CORE_JOURNEY_FIRST_UX_ARCHITECTURE_FINAL.md`](../FLORAOS_CORE_JOURNEY_FIRST_UX_ARCHITECTURE_FINAL.md), [`KE_HOACH_THUC_THI_JOURNEY_FIRST_UX_ARCHITECTURE.md`](../kien-truc/KE_HOACH_THUC_THI_JOURNEY_FIRST_UX_ARCHITECTURE.md), [`03b-role-ux.md`](./03b-role-ux.md).  
> **Mục tiêu:** Tái cấu trúc toàn diện trải nghiệm người dùng chức năng Tạo Landing Page và Catalog Số theo triết lý **Journey-First UX (J1–J7)**, loại bỏ triệt để giao diện form dồn cục (All-in-one overload), hỗ trợ cơ chế kép **Automatic (AI Pre-fill)** và **Manually (Từng bước có định hướng)**.

---

## 1. TỔNG QUAN VÀ BỐI CẢNH NÂNG CẤP

### 1.1. Hiện trạng trước khi nâng cấp (Vấn đề)
- **Quá tải nhận thức (Cognitive Overload)**: Màn hình Landing Page trước đây dồn đồng thời 8 khối cấu hình (Dịp, Phong cách, Tên, Chỉ thị AI, Chọn hoa, Cài đặt Media, Bật/tắt 7 Section, Khung Preview) vào một trang duy nhất khiến người dùng mới bị ngợp.
- **Thiếu điểm chạm khởi đầu theo mục tiêu (J1 Violation)**: Người dùng vào trang không được hỏi rõ mục đích làm gì, bắt buộc phải tự mò mẫm qua các form dài.
- **Hộp đen AI thiếu tính kiểm soát**: Trước đây nếu dùng tính năng tự động, AI tự sinh nhưng người dùng không thấy được các bước lựa chọn bên dưới để tinh chỉnh.
- **Ngõ cụt sau khi xuất bản (J3 Violation)**: Sau khi tạo xong link, chỉ hiển thị thông báo đơn giản, thiếu khối hành động đề xuất tiếp theo (Next Best Actions) để đưa link ra các kênh bán hàng (Zalo, In QR, Chatbot AI).

### 1.2. Mục tiêu sau khi nâng cấp
- **Chuẩn hóa theo 7 nguyên tắc Journey-First (J1–J7)**:
  - **J1 (Journey-First)**: Khởi đầu bằng thẻ lựa chọn mục tiêu rõ ràng.
  - **J2 (Progressive Disclosure)**: Tiết lộ thông tin lũy tiến theo từng bước (Wizard), chỉ hiển thị thông tin cần thiết của bước đó.
  - **J3 (Next Best Actions)**: Sau khi hoàn thành, luôn có khối hành động đề xuất tiếp theo (Gửi Zalo, In tem QR, Nạp vào Chatbot AI).
  - **J4 (Contextual AI)**: AI nhúng tự nhiên vào tiến trình (Vision AI nhận diện ảnh, Content Engine sinh 7 section).
  - **J6 (Action Contract)**: Tuân thủ quy ước các bước tác vụ chuẩn hóa.
  - **J7 (WRAP, không REPLACE)**: Bọc các tính năng quản lý link hiện có vào Chế độ Chuyên gia, không phá vỡ logic cũ.
- **Hỗ trợ 2 cơ chế tạo song hành**:
  - **Cơ chế 1: Tự động hoàn toàn bằng AI (Automatic AI Fast-Track)**: Đưa nguyên liệu (Ảnh + Video + Ghi chú) ➔ AI phân tích & điền sẵn toàn bộ các bước ➔ Người dùng duyệt & xuất bản.
  - **Cơ chế 2: Tự thiết kế từng bước (Manually Guided Wizard)**: Người dùng chủ động chọn Dịp ➔ Chọn hoa ➔ Tinh chỉnh nội dung ➔ Xem trước ➔ Xuất bản.

---

## 2. ĐẶC TẢ CHI TIẾT TAB "LANDING PAGE CHIẾN DỊCH"

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [LỰA CHỌN PHƯƠNG THỨC BAN ĐẦU]:                                        │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐   │
│   │ ⚡ TẠO TỰ ĐỘNG BẰNG AI       │  │ 🛠️ TỰ THIẾT KẾ TỪNG BƯỚC    │   │
│   │ (Tải ảnh/video/ghi chú ➔ AI) │  │ (Chủ động chọn dịp & hoa)    │   │
│   └──────────────┬───────────────┘  └──────────────┬───────────────┘   │
└──────────────────┼─────────────────────────────────┼───────────────────┘
                   │                                 │
                   ▼ (AI phân tích & Pre-fill)       │
┌────────────────────────────────────────────────────▼───────────────────┐
│ [WIZARD HÀNH TRÌNH 5 BƯỚC LŨY TIẾN]:                                   │
│  1. Dịp & Phong cách ➔ 2. Chọn hoa ➔ 3. Nội dung AI ➔ 4. Xem trước ➔ 5. Xuất bản │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Cơ chế Tạo Tự Động Bằng AI (Automatic Fast-Track)
1. **Hộp tiếp nhận nguyên liệu đa phương thức (`SmartInputDropzone`)**:
   - **Hình ảnh hoa (Images)**: Tải lên 1 hoặc nhiều ảnh chụp hoa của tiệm. AI tự động tách nền, cân bằng sáng và nâng nét (ưu tiên Cloud Provider, dự phòng Local Engine).
   - **Video sản phẩm (Video)**: Nhập link video TikTok/YouTube hoặc MP4 (giữ nguyên chất lượng gốc, nhúng trực tiếp vào khu vực video của trang).
   - **Ghi chú yêu cầu (Text Directives)**: Gõ văn bản tự do (VD: *"Bó hoa hồng đỏ 20/10 tặng vợ tầm 800k, phong cách lãng mạn"*).
2. **Động cơ phân tích & Khớp dữ liệu tự động (`analyzeAndPreFill`)**:
   - **Nhận diện Dịp**: Quét từ khóa văn bản và đọc thiệp chúc mừng trên ảnh qua OCR thị giác để nhận diện sự kiện (20/10, Valentine, Khai trương, Sinh nhật...).
   - **Khớp Phong cách (Archetype)**: Khớp tông màu chủ đạo của hoa với 1 trong 4 Archetype giao diện.
   - **Chọn sản phẩm**: Tự động chọn 3–5 mẫu hoa sẵn có trong kho phù hợp phân khúc giá.
   - **Sinh nội dung 7 Section**: Gọi `LandingContentGenerator` viết trọn bộ: Tiêu đề giật tít, Câu chuyện thương hiệu (*Story*), Đặc quyền, Quy trình, FAQ.
3. **Chuyển tiếp Human-in-the-loop**:
   - Sau 2–3 giây xử lý, hệ thống chuyển sang **Wizard 5 bước** với toàn bộ thông tin đã được AI điền sẵn.
   - Người dùng có thể kiểm tra từng bước hoặc bấm ngay sang bước Xem trước để Xuất bản.

### 2.2. Cơ chế Tự Thiết Kế Từng Bước (Manually Guided Wizard)
- **Bước 1: Chọn Dịp & Phong cách (`LandingStepSetup`)**:
  - Chọn sự kiện mục tiêu (20/10, 8/3, Valentine, Khai trương, Sinh nhật...).
  - Chọn phong cách thẩm mỹ (*Tối giản sang trọng*, *Cổ điển ấm áp*, *Tươi trẻ lãng mạn*, *Sang trọng rực rỡ*).
- **Bước 2: Tuyển chọn mẫu hoa (`LandingStepSetup`)**:
  - Tích chọn các mẫu hoa từ kho hàng.
  - Hỗ trợ nút *"Tải nhanh ảnh hoa mới"* nếu tiệm có mẫu hoa mới chưa kịp tạo sản phẩm.
- **Bước 3: Tinh chỉnh Nội dung & Section (`LandingStepContentSettings`)**:
  - Tinh chỉnh tiêu đề và lời chỉ đạo ngữ cảnh cho AI.
  - Cấu hình Media (Ảnh Banner Hero, Video giới thiệu).
  - Bật/tắt 7 Section của Landing Page (`Story`, `Products`, `Perks`, `Process`, `Gallery`, `Reviews`, `FAQ`, `Lead`).
- **Bước 4: Xem trước tương tác & Xuất bản (`LandingStepPreviewPane`)**:
  - Khung xem trước trực quan Live Preview theo tỷ lệ màn hình điện thoại và máy tính.
  - Nút xuất bản chính: *"Xuất bản Landing Page ngay"*.
- **Bước 5: Kết quả & Hành động đề xuất tiếp theo (`LandingNextActions` — J3)**:
  - Hiển thị Link công khai (`/c/[slug]`) và nút Sao chép.
  - Mã QR độ nét cao kèm nút Tải ảnh PNG.
  - 3 hành động tiếp theo đề xuất:
    - 📲 *Gửi link qua Zalo chào khách chốt đơn*.
    - 🏷️ *In tem QR dán thiệp tặng hoa*.
    - 🤖 *Tích hợp vào Chatbot AI tự động tư vấn 24/7*.

---

## 3. ĐẶC TẢ CHI TIẾT TAB "CATALOG SỐ TRỰC TUYẾN"

```text
[BỘ CHUYỂN ĐỔI CHẾ ĐỘ (J7)]:
  ├── 🌸 Chế độ Mặc định: Hành trình 4 bước tạo Catalog mới (Wizard Flow)
  └── 📋 Chế độ Chuyên gia: Danh sách link đã tạo & Quản lý kho hoa (Manage Flow)
```

### 3.1. Hành trình 4 bước Tạo Catalog Mới (`CatalogWizardFlow`)
1. **Bước 1 — Chọn mục tiêu & Tuyển chọn hoa (`CatalogWizardStep1Products`)**:
   - Gợi ý tạo nhanh 1-chạm theo bộ sưu tập:
     - *Toàn bộ sản phẩm đang bán tại cửa hàng*.
     - *Theo sự kiện đang bán chạy*.
     - *Phân khúc giá dưới 800K*.
   - Bộ lọc tìm kiếm theo tên, mã hoa và sự kiện. Lưới card hoa trực quan có thể nhấp chọn từng mẫu.
2. **Bước 2 — Chọn phong cách hiển thị Catalog**:
   - **Showroom Hiện Đại (`MODERN_SHOWROOM`)**: Bố cục lưới sản phẩm cân đối, tối ưu lướt hàng ngày.
   - **Tạp Chí Nghệ Thuật (`EDITORIAL_LOOKBOOK`)**: Khổ ảnh lớn 4:5 sang trọng, phông chữ thanh lịch.
   - **Đặt Nhanh Sự Kiện (`COMPACT_LIST`)**: Danh mục cô đọng, tối ưu cho khách B2B đặt số lượng lớn.
3. **Bước 3 — Đặt tên, AI viết lời chào & Xem trước**:
   - Nhập tên bộ sưu tập (VD: *"Bộ sưu tập Hoa Khai Trương Phát Tài"*).
   - Nút bấm *"✨ AI Viết Lời Chào"*: Tự động sinh đoạn văn giới thiệu hoa nghệ thuật.
   - Hộp tóm tắt xem trước trước khi xuất bản.
4. **Bước 4 — Xuất bản & Next Best Actions (`CatalogWizardStep4Success` — J3)**:
   - Link catalog trực tuyến công khai.
   - Tải mã QR độ phân giải cao in tem để bàn.
   - Khối Next Best Actions: Gửi Zalo, In tem QR, Kết nối AI Chatbot.

### 3.2. Chế độ Quản lý Chuyên sâu (Expert Management Mode — J7)
- Dành cho chủ tiệm hoặc nhân viên quản lý:
  - Xem danh sách toàn bộ các liên kết Catalog đã phát hành kèm ngày tạo và trạng thái.
  - Nút Copy link nhanh, tải mã QR, chia sẻ qua mạng xã hội, hoặc thu hồi link đã hết hạn.
  - Quản lý danh mục sản phẩm hoa trong kho.

---

## 4. MA TRẬN ÁNH XẠ MÃ NGUỒN (CODEBASE MAP & SRP COMPLIANCE)

Mọi tệp mã nguồn đều được thiết kế dưới ngưỡng **350 dòng/file** tuân thủ tuyệt đối quy tắc Single Responsibility Principle (SRP) và UX Lint:

| Phân hệ | Tệp thành phần | Dòng code | Trách nhiệm chính |
|---|---|---|---|
| **Landing Page** | [`smart-input-dropzone.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/smart-input-dropzone.tsx) | ~215 | Hộp nạp nguyên liệu đầu vào đa năng (Ảnh, Video, Text) cho Automatic Flow |
| | [`landing-step-indicator.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/landing-step-indicator.tsx) | ~80 | Thanh tiến trình 5 bước trực quan theo chuẩn Journey UX |
| | [`landing-step-setup.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/landing-step-setup.tsx) | ~70 | Render Bước 1 (Dịp, Phong cách) và Bước 2 (Chọn hoa) |
| | [`landing-step-content-settings.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/landing-step-content-settings.tsx) | ~80 | Render Bước 3 (Tiêu đề, Chỉ thị AI, Media, Section Toggles) |
| | [`landing-step-preview-pane.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/landing-step-preview-pane.tsx) | ~70 | Render Bước 4 (Xem trước trực tiếp & Nút xuất bản) |
| | [`landing-wizard-nav.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/landing-wizard-nav.tsx) | ~60 | Nút điều hướng tuần tự giữa các bước (Quay lại, Tiếp tục, Xuất bản) |
| | [`landing-next-actions.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/landing-next-actions.tsx) | ~150 | Bước 5 — Khối Next Best Actions (J3) sau khi xuất bản Landing Page |
| | [`landing-campaign-tab.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/landing-campaign-tab.tsx) | **347** | Orchestrator điều phối trạng thái, chế độ Automatic vs Manually |
| **Catalog Số** | [`catalog-wizard-step1-products.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/catalog-wizard-step1-products.tsx) | ~185 | Bước 1 — Lựa chọn nhanh Preset, tìm kiếm và chọn sản phẩm |
| | [`catalog-wizard-step4-success.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/catalog-wizard-step4-success.tsx) | ~110 | Bước 4 — Hiển thị Link, mã QR và Khối Next Best Actions (J3) |
| | [`catalog-wizard-flow.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/catalog-wizard-flow.tsx) | **348** | Orchestrator 4 bước tạo Catalog số |
| | [`catalog-management-tab.tsx`](file:///Users/tuan/Projects/floraos-core/src/components/catalog/catalog-management-tab.tsx) | **175** | Orchestrator Tab Catalog, toggle giữa Wizard và Chế độ Chuyên gia |

---

## 5. BẢO CHỨNG CHẤT LƯỢNG & KIỂM THỬ

- **TypeScript Compilation**: `npx tsc --noEmit` đạt **100% sạch (0 lỗi)**.
- **UX Lint Standards (03a)**: `npm run lint:ux -- --check` đạt **0 vi phạm** (Chuẩn token ngữ nghĩa R1, thang cỡ chữ R2, 1 nút primary R4, WCAG 2.1.1 R5, không mã kỹ thuật R8).
- **Unit & Integration Tests**: `npm test` đạt **1.469/1.469 tests xanh (187/187 tệp)**.
- **Tenant Isolation Tests**: `npm run test:tenant` đạt **283/283 tests xanh (36/36 tệp)** — bảo đảm cách ly dữ liệu tuyệt đối giữa các tổ chức/cửa hàng.
