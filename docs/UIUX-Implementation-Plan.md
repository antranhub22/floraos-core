# Kế hoạch triển khai hoàn thiện 100% — 10 chức năng UI/UX

**Cơ sở:** `docs/UIUX-Feature-Checklist.md` (115 tính năng) + `docs/FloraOS-UIUX-10-chuc-nang.md` + `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md`
**Ngày lập:** 13/09/2026
**Trạng thái hiện tại:** 31/115 tính năng đã code (21%)

---

## Phân loại lại theo thực tế backend

Sau khi rà soát kỹ `src/app/api/v1/` và `src/modules/`, phát hiện:

| Chức năng | Backend trạng thái thực | Cập nhật checklist |
|---|---|---|
| #1 Phân tích sản phẩm | M01 ✅, M01b ✅ (product-copies routes tồn tại) | UI chưa nối M01b |
| #2 Creative Studio | M04a ✅, M04b proxy ✅, M04b full ❌ | UI mock cho M04b variants |
| #3 Video Studio | M04c ❌ — không có route, không có module | Chờ P17 |
| #4 Content Engine | M07 ❌ — không có route, không có module | Chờ P18 |
| #5 Social Publishing | M07 ❌ — không có route, không có module | Chờ P18 |
| #6 Catalog & Website | M06 ✅, M05 ❌ (LocalBudd) | UI có, M05 builder mock |
| #7 CRM | M09 ❌ — không có route, không có module | Chờ P21 |
| #8 Đơn hàng | M10 ❌ — không có route, không có module | Chờ P22 |
| #9 Chat Assistant | M08 ❌ — **chưa có repo** | Chờ P23 |
| #10 Analytics & Learning | M11 UI ✅, learning ❌ | UI có, learning mock |

---

## GIAI ĐOẠN 0: Nối UI với backend đã có (không cần xây mới)

**Mục tiêu:** Biến mock → API thật cho các tính năng backend đã tồn tại nhưng UI chưa kết nối. Ước lượng 2-3 tuần.

### 0.1 — #1 Phân tích sản phẩm AI (`tai-anh`) — M01b kết nối

**Hạng mục:** BUILD (theo HARVEST_MANIFEST) — `src/modules/product-copies/` đã tồn tại
**Backend đã có:** 5 routes `product-copies` (GET, POST generate, GET/PATCH/:id, POST approve, POST reject)
**Capability:** H5 (generate) / H6 (approve) — split pair đã được khoá test

| # | Tính năng | Action | Trạng thái |
|---|-----------|--------|------------|
| 1.12 | Gợi ý "Sinh nội dung bán hàng" | UI gọi POST /product-copies/generate khi nhấn nút | Mock → API |
| 1.13 | Thẻ kết quả 2: nội dung bán hàng | UI map response từ product-copies sang ResultField[] | Mock → API |
| 1.14 | Sửa/Thêm/Bớt Thẻ 2 | UI gọi PATCH /product-copies/:id | Mock → API |
| 1.15 | Duyệt Thẻ 2 → ghi Product Master | UI gọi POST /product-copies/:id/approve | Mock → API |
| 1.16 | Lưu vào Kho sản phẩm | Sau 1.15, redirect về san-pham | Mock → API |

**Công việc:**
- [ ] Đọc `src/modules/product-copies/use-cases/generate-product-copy.ts` — hiểu input/output
- [ ] Đọc `src/modules/product-copies/domain/product-copy-rules.ts` — hiểu validation
- [ ] Tạo `M1bFieldsMapper` (tương tự `mapAnalysisToFields1`) mapping product-copies response → ResultField[]
- [ ] Nối 5 API calls vào tai-anh page
- [ ] Xử lý Identity Guard cho M01b (H6 trần cứng dieu_hanh)
- [ ] Xử lý error: 401/403/409/502
- [ ] Verify: M01b analysis phải APPROVED mới gọi generate (kiểm trong use-case)

**Câu hỏi cần xác nhận:**
> Q1: M01b flow — sau khi duyệt Thẻ 2 (product copy), sản phẩm đã có trong Product Master (qua approve). Vậy Thẻ 1 và Thẻ 2 có độc lập không? User duyệt Thẻ 1 → stop, không cần Thẻ 2? Hay bắt buộc phải hoàn tất cả hai?

---

### 0.2 — #2 Creative Studio — M04b remaining

**Hạng mục:** BUILD (M04b creative) + ADAPTER (read Master Image) — theo HARVEST
**Backend đã có:** media/optimizations (M04a), proxy M04b background-removal
**Backend CẦN:** Background replacement, frame expansion, retouch, watermark, batch variants (P16 remaining)

| # | Tính năng | Action | Trạng thái |
|---|-----------|--------|------------|
| 2.13 | Chọn Master Image | UI lấy từ GET /api/v1/products (đã có) + GET /media/optimizations | UI mock → API |
| 2.20 | Proxy M04b mapping | Hoàn thiện mapping proxy response → variant UI | Proxy có, mapping mock |
| 2.14 | Background replacement | **Cần backend P16 remaining** | Chờ backend |
| 2.15 | Frame expansion, retouch, watermark | **Cần backend P16 remaining** | Chờ backend |
| 2.16 | Batch variants (matrix) | **Cần backend P16 remaining** | Chờ backend |
| 2.17-2.19 | Duyệt/bỏ/lưu biến thể | UI + API (sau 2.14-2.16) | Chờ backend |

**Công việc (UI):**
- [ ] Đọc `src/components/creative/creative-studio.tsx` — hiểu proxy call
- [ ] Hoàn thiện mapping proxy response → UI variant structure
- [ ] Thay VARIANTS mock bằng kết quả thật khi backend có

**Câu hỏi cần xác nhận:**
> Q2: M04b full — background replacement, frame expansion, retouch, watermark, batch variants — những tính năng này có backend nào sẵn sàng (SocialFlow) hay cần xây từ đầu? Timeline P16 remaining là khi nào?

---

### 0.3 — #6 Catalog & Website — Tab A hoàn thiện + M05

**Hạng mục:** M06 BUILD (core) + M05 REUSE (LocalBudd)
**Backend đã có:** products, catalog-links (M06)
**Backend CẦN:** M05 landing builder (LocalBudd side)

**Tab A — Catalog (cần hoàn thiện):**

| # | Tính năng | Action | Trạng thái |
|---|-----------|--------|------------|
| 6.2 | Lọc/nhóm | UI filtering trên danh sách thật | UI có, verify |
| 6.3 | Bộ sưu tập (drag-drop) | UI + PATCH catalog-links | UI mock → API |
| 6.4 | Xem trước catalog | Gọi proxy LocalBudd | UI mock → proxy |
| 6.6 | QR code | Gọi GET catalog-links/:slug + QR component | UI có, link mock |

**Tab B — Landing (cần M05):**

| # | Tính năng | Action | Trạng thái |
|---|-----------|--------|------------|
| 6.10-6.15 | Dựng trang, sửa, duyệt, lưu | **Cần M05 builder (LocalBudd)** | Chờ backend |

**Câu hỏi cần xác nhận:**
> Q3: M05 Landing builder — LocalBudd đã có (P15+ proxy), hay cần LocalBudd xây dựng trước? Timeline khi nào LocalBudd M05 sẵn sàng cho core proxy?

---

### 0.4 — #10 Analytics & Learning — Vòng học phong cách

**Hạng mục:** EXTEND (post_metrics, content_insights) + BUILD (ROI join, learning loop) — HARVEST
**Backend đã có:** usage, audit-logs, ai-requests, ai-policy
**Backend CẦN:** learning-profile endpoint, learning history API

| # | Tính năng | Action | Trạng thái |
|---|-----------|--------|------------|
| 10.12 | Hiện khi ≥ 20 bài | UI count từ usage/audit | UI có, API đếm |
| 10.13-10.15 | Đề xuất học, sửa, duyệt | **Cần learning-profile backend** | Chờ backend (P20) |
| 10.16 | Duyệt áp dụng → PUT ai-policy | API có, UI mock | UI mock → API |
| 10.17-10.18 | Ảnh hưởng trang 1/4, lịch sử | **Cần learning history** | Chờ backend |

**Câu hỏi cần xác nhận:**
> Q4: Learning profile (M11) — P20 theo roadmap, phụ thuộc P18, P19, P22. Có endpoint GET/PUT `/api/v1/learning-profile` nào đã có trên backend chưa?

---

## GIAI ĐOẠN 1: Xây backend mới — Tuyến B MVP (P17–P19)

**Mục tiêu:** Xây backend APIs cho 3 module Video, Content+Social, hoàn thiện Catalog. Ước lượng 8-12 tuần (song song).

### 1.1 — P17: AI Video Studio (M04c)

**Hạng mục:** EXTEND (HeyGen/Veo adapters, video_jobs) + BUILD (scene builder)
**Dependencies:** P15 (done), P16 (M04b), AI-2 (scoring/cascade), D14 (credit pricing)
**Harvest:** EXTEND + BUILD — SocialFlow side (HeyGen/Veo adapters), Core side (scene builder)

**Module cần tạo:** `src/modules/video-studio/` (domain, use-cases, infra, adapters)
**Routes cần tạo:**
- `POST /video/jobs` — tạo job dựng video (feature = video.generate)
- `GET /video/jobs/:id` — trạng thái
- `POST /video/jobs/:id/cancel` — huỷ (G6)
- `POST /video/jobs/:id/retry` — chạy lại (G7)
- `GET /video/jobs/:id/events` — SSE
- `POST /video/jobs/:id/approve-script` — duyệt kịch bản (P3 approve)
- `POST /video/jobs/:id/approve-video` — duyệt video (P4 approve)

| # | Tính năng | Module/Route | Capability | Notes |
|---|-----------|-------------|------------|-------|
| 3.1-3.4 | Chọn khuôn, cấu hình, dựng kịch bản | POST /video/jobs | P1 (generate) | 6 khuôn, scene builder |
| 3.5 | Thẻ kịch bản | GET /video/jobs/:id | P1 | cảnh, thời lượng, hiệu ứng |
| 3.6 | Sửa kịch bản | PATCH /video/jobs/:id | P1 | |
| 3.7 | Duyệt kịch bản | POST approve-script | P3 (approve) | trước khi dựng |
| 3.8 | Dựng video | POST /video/jobs/:id/deploy | P1 | 1-3 phút, không chặn |
| 3.9 | Thẻ kết quả video | GET /video/jobs/:id | P1 | trình phát, chi phí |
| 3.10 | Duyệt video | POST approve-video | P4 (approve) | sau kết quả |
| 3.11 | Lưu vào Kho video | assets.register | I3 | parent_asset_id → MI |
| 3.12 | Khung đầu/cuối khoá | domain rule | P1 | chỉ Master Image |
| 3.13 | Job lỗi → thử lại | POST retry | G7 | không trừ hạn mức |
| 3.14 | Chi phí → usage | enqueue | G8 | feature = video.generate |

**Câu hỏi cần xác nhận:**
> Q5: Video Studio — HeyGen/Veo adapters được harvest ở SocialFlow repo hay cần xây mới? Scene builder ở core hay SocialFlow? Ai phụ trách P17?
> Q6: D14 (credit pricing cho video.generate) — bảng giá đã chốt chưa? Có ảnh hưởng đến UX hiển thị chi phí không?
> Q7: AI-2 (scoring/cascade) cần gì cho Video? Đánh giá chất lượng video trước duyệt?

---

### 1.2 — P18: AI Content Engine + Social Publishing (M07)

**Hạng mục:** EXTEND (platform adapters, scheduler) + BUILD (flower strategy, Zalo OA)
**Dependencies:** P15, P16, AI-2, Đợt 3 (E group)

**Module cần tạo:** `src/modules/content-engine/` + `src/modules/social-publishing/`
**Routes cần tạo (Content Engine):**
- `POST /content/posts` — tạo nội dung theo kênh (feature = content.generate)
- `GET /content/posts` — danh sách
- `GET /content/posts/:id` — chi tiết
- `PATCH /content/posts/:id` — sửa
- `POST /content/posts/:id/approve` — duyệt (O1/O3 pair)
- `POST /content/posts/:id/reject` — từ chối

**Routes cần tạo (Social Publishing):**
- `POST /content/schedule` — xác nhận lịch đăng
- `GET /content/schedule` — lịch đăng
- `POST /content/schedule/:id/publish` — đăng (O6)

| # | Chức năng | Tính năng | Capability | Notes |
|---|-----------|-----------|------------|-------|
| **Content** | | | | |
| 4.1-4.3 | Chọn sản phẩm, kênh, dịp | POST /content/posts | O1 | bound to PM + approved MI |
| 4.5 | Thẻ kết quả từng kênh | GET /content/posts/:id | O1 | FB, IG, TikTok, Zalo OA, SEO |
| 4.6 | Sửa nội dung | PATCH /content/posts/:id | O1 | |
| 4.7 | Duyệt | POST approve | O3 | |
| 4.8 | Lưu Thư viện nội dung | create in DB | O1 | |
| 4.9 | Chỉ báo giọng + dữ kiện | AI evaluation | AI-2 | |
| 4.10 | Gợi ý lên lịch | UI redirect | — | → Social Publishing |
| **Social** | | | | |
| 5.1 | Chọn từ Thư viện | GET /content/posts (approved) | O3 | |
| 5.2 | Chọn nền tảng + thời điểm | POST /content/schedule | O6 | |
| 5.3 | Xem trước | UI | — | |
| 5.5 | Xác nhận lịch đăng | POST schedule | O6 | không có bước Duyệt riêng |
| 5.6 | Thẻ trạng thái | UI | — | Đã lên lịch/Đang đăng/Đã đăng/Lỗi |
| 5.7 | Lịch đăng | GET /content/schedule | O6 | tuần/tháng, drag-drop |
| 5.8 | Đăng lại thông minh | Analytics gợi ý | O6 | |
| 5.9 | Tự duyệt theo thời hạn | PUT /content/settings | O7 (dieu_hanh, tắt mặc định) | |
| 5.10 | Hết hạn → chờ duyệt lại | domain rule | O7 | if off → "Chờ duyệt lại" |
| 5.11 | Đăng lỗi → thử lại | POST retry | O6 | không tính lượt đăng |

**Câu hỏi cần xác nhận:**
> Q8: M07 — Social Flow adapters (Facebook, Instagram, TikTok, Zalo OA) — harvest ở SocialFlow repo hay xây mới? Platform adapter là gì?
> Q9: Zalo OA adapter — có SDK hay API docs chưa? Đây là xây mới hoàn toàn?
> Q10: O7 (tự duyệt) — là capability mới hay reuse existing? Kiểm trong use-case hay route?
> Q11: Content luôn bound to Product Master + approved Master Image — rule này enforcement ở đâu? UI, route, hay domain?
> Q12: Social accounts mang organization_id — bảng `social_accounts` đã có schema chưa?

---

### 1.3 — P19: Catalog & Website (M06) hoàn thiện + M05 Landing

**Hạng mục:** M06 BUILD (core) + M05 REUSE (LocalBudd)
**Dependencies:** P15
**Status:** 6/7 DONE (LocalBudd) — còn capability pair J1/J2

| # | Tính năng | Action | Notes |
|---|-----------|--------|-------|
| 6.2-6.4 | Tab A hoàn thiện | UI + API | Backend đã có |
| 6.6 | QR code | UI component | J7 capability check |
| 6.8-6.15 | Tab B Landing | **Cần M05** | LocalBudd side |

**Câu hỏi:**
> Q3: M05 — timeline LocalBudd M05 builder cho core proxy?

---

## GIAI ĐOẠN 2: Xây backend — Post-MVP (P20–P23)

### 2.1 — P20: Analytics & Learning (M11)

**Dependencies:** P18, P19, P22

| # | Tính năng | Action | Notes |
|---|-----------|--------|-------|
| 10.12-10.18 | Vòng học phong cách | BUILD | learning-profile endpoint, history |
| 10.9 | Diễn giải | EXTEND | AI-4 domain events |

**Câu hỏi:**
> Q4: Learning profile API — đã có trên backend chưa?

---

### 2.2 — P21: CRM & Khách hàng (M09)

**Hạng mục:** BUILD (floraos-core) — Customer PII = separate class
**Dependencies:** P2, P3, **D13 (consent)**

**Module cần tạo:** `src/modules/crm/`
**Routes cần tạo:**
- `GET /customers` — danh sách
- `GET /customers/:id` — hồ sơ
- `POST /customers` — tạo
- `POST /customers/:id/campaigns` — gợi ý nhắc mua
- `POST /customers/:id/campaigns/:campaignId/approve` — duyệt
- `POST /customers/:id/delete-request` — yêu cầu xoá dữ liệu
- `POST /customers/:id/consent` — cập nhật đồng ý
- `POST /campaigns` — lên lịch gửi

| # | Tính năng | Capability | Notes |
|---|-----------|------------|-------|
| 7.1-7.3 | Danh sách, hồ sơ, gợi ý AI | M09 | AI quét theo lô |
| 7.4 | KHÔNG gửi PII ra ngoài | Privacy floor | D15 + D13 |
| 7.5-7.8 | Thẻ kết quả, sửa, duyệt, lịch gửi | O-pattern | |
| 7.9 | Đồng ý nhận nhắc | D13 | trạng thái + ngày |
| 7.10 | Yêu cầu xoá dữ liệu | D13 | nút riêng, thực thi ngay |
| 7.11 | Khối đồng ý bắt buộc | UI | |

**Câu hỏi cần xác nhận:**
> Q13: D13 (consent) — đã có schema/table chưa (consent_logs, consent_settings)? Quy tắc xoá dữ liệu: xoá toàn bộ hay ẩn? Deadline legal?
> Q14: CRM gợi ý nhắc mua — gọi AI qua cổng nào? AIC-xx nào?
> Q15: Bảng customers — new table hay reuse existing (users/memberships)?

---

### 2.3 — P22: Đơn hàng & Vận hành (M10)

**Hạng mục:** EXTEND (C1–C28 + quote flow from v1) — HARVEST
**Dependencies:** P6, P21

**Module cần tạo:** `src/modules/orders/`
**Routes cần tạo:**
- `GET/POST /orders` — danh sách/tạo
- `GET/PATCH /orders/:id` — chi tiết/sửa
- `POST /orders/:id/quote` — tạo phiếu chào giá
- `POST /orders/:id/approve` — duyệt
- `POST /orders/:id/assign` — phân công thợ cắm
- `POST /orders/:id/ship` — đánh dấu đã giao
- `GET /orders/board` — Kanban board

| # | Tính năng | Notes |
|---|-----------|-------|
| 8.1-8.3 | Tạo đơn | select khách, sản phẩm, ngày, lời nhắn |
| 8.4-8.5 | Phiếu chào giá | price breakdown, A6 preview |
| 8.6 | Duyệt | H1/H3 pair (quote.run/quote.approve) |
| 8.9-8.11 | Kanban + phân công + SLA | trạng thái, drag-drop |
| 8.12-8.15 | In phiếu, quá SLA | in không gắn duyệt, viền đỏ |

**Câu hỏi cần xác nhận:**
> Q16: M10 — quote flow: bảng `orders`, `order_items`, `quotes` đã có schema chưa? Hay cần migration?
> Q17: SLA timer — realtime hay polling? Backend có WebSocket/SSE cho SLA không?
> Q18: In phiếu — PDF generation ở core hay client? Có font/vietnamese support?
> Q19: Kanban board — trạng thái đơn hàng mapping từ đâu? Mới/Phân công/Đang làm/Đã giao là enum hay free-text?
> Q20: Phiếu chào giá — có capability pair riêng (quote.run/quote.approve) hay dùng H1/H3?

---

### 2.4 — P23: AI Chat Assistant (M08)

**Hạng mục:** BUILD (new repo / new module)
**Dependencies:** P19, P21, P22
**Notes:** Chưa có repo. Cần thiết kế đầy đủ.

**Module cần tạo:** `src/modules/chat-assistant/`
**Routes cần tạo:**
- `GET /chat/conversations` — danh sách
- `GET /chat/conversations/:id` — lịch sử + AI trả lời
- `POST /chat/conversations/:id/transfer` — chuyển nhân viên
- `POST /chat/conversations/:id/flag` — gắn cờ
- `GET /chat/config` — cấu hình phạm vi
- `PUT /chat/config` — cập nhật
- `POST /chat/config/preview` — mô phỏng 3 câu hỏi
- `POST /chat/config/approve` — duyệt cấu hình

| # | Tính năng | Tab | Notes |
|---|-----------|-----|-------|
| 9.1-9.4 | Hội thoại, lịch sử, AI trả lời, nhãn "dẫn từ" | A | realtime |
| 9.5 | Chuyển nhân viên | A | luôn hiện |
| 9.6 | Gắn cờ | A | |
| 9.7 | AI không trả lời → chuyển | A | rule |
| 9.8-9.10 | Phạm vi, FAQ, ngưỡng | B | |
| 9.11 | Xem trước | B | simulate 3 questions |
| 9.12 | Duyệt cấu hình | B | |

**Câu hỏi cần xácẫn:**
> Q21: Chat Assistant — realtime AI trả lời: WebSocket/SSE hay polling? AI trả lời dựa trên Product Master + giá đã duyệt — gọi qua cổng nào (LLM provider)?
> Q22: Chat history lưu ở đâu? Bảng `chat_messages` mới hay reuse?
> Q23: "Dẫn từ: [tên sản phẩm/trang giá]" — trỏ về bản ghi thật — là deep link đến product hay chỉ text?
> Q24: AI không tìm thấy dữ liệu → nút chuyển nhân viên — rule này ở UI hay backend?
> Q25: P23 phụ thuộc P19 (M06), P21 (CRM), P22 (Orders). P21/P22 chưa có schema. Timeline có bị trễ?

---

## Tổng quan phụ thuộc và timeline

```
P13 (done) ──→ P14 (M01b) ← GIAI ĐOẠN 0 bắt đầu ở đây
                │
P15 (done) ──→ P15+ E2E ← GIAI ĐOẠN 0 hoàn thành
                │
                ├──→ P16 (M04b full) ──→ P17 (M04c) ──→ P18 (M07)
                │                        │            ╰──→ P19 (M06)
                │                        │
                │                    AI-2 (blocks P17/P18)
                │                    D14 (blocks P17)
                │
                ├──→ P20 (M11) ← phụ P18, P19, P22
                │
                ├──→ P21 (M09) ← phụ P2, P3, D13
                │
                ├──→ P22 (M10) ← phụ P6, P21
                │
                └──→ P23 (M08) ← phụ P19, P21, P22
```

**Song song hóa:**
- GIAI ĐOẠN 0 (UI kết nối): song song với P14, P16 remaining
- P17, P18, P19: song song (nhưng chia sẻ AI-2, P15)
- P21 có thể song song với P16/P17 (D13 là blocker riêng)
- P22 phải chờ P21 + P6
- P23 phải chờ P19, P21, P22

---

## GIAI ĐOẠN 3: AI Infrastructure (Tuyến C)

| Batch | Scope | Blocks | Status |
|---|---|---|---|
| AI-1 | AI Gateway, 34 caps, 10 ports, org policies | P16-P18 | ✅ DONE |
| AI-2 | Scoring, cascade, fallback, needs_review queue, privacy floor | P17-P18 | ❌ Next |
| AI-3 | flower_taxonomy, knowledge_chunks, retrieval | P23 | ❌ |
| AI-4 | Domain events, content_features, learning loop | P20 | ❌ |

**Câu hỏi:**
> Q26: AI-2 — team phụ trách? Timeline? Đây là blocker cho P17 (Video) và P18 (Content).

---

## CÂU HỎI TỔNG HỢP (cần trả lời trước khi bắt đầu)

| # | Câu hỏi | Ảnh hưởng đến |
|---|-----------|---------------|
| Q1 | M01b flow — Thẻ 1 và Thẻ 2 độc lập hay tuần tự? | GIAI ĐOẠN 0.1 |
| Q2 | M04b full — backend có sẵn (SocialFlow) hay xây mới? Timeline? | GIAI ĐOẠN 0.2, 1.1 |
| Q3 | M05 Landing — LocalBudd đã sẵn sàng cho core proxy chưa? | GIAI ĐOẠN 0.3, 1.3 |
| Q4 | Learning profile endpoint — đã có trên backend? | GIAI ĐOẠN 0.4 |
| Q5 | M04c — HeyGen/Veo adapter harvest hay build mới? Scene builder ở đâu? | 1.1 |
| Q6 | D14 — credit pricing cho video.generate đã chốt? | 1.1 |
| Q7 | AI-2 cần gì cho Video? | 1.1, AI-2 |
| Q8 | M07 — Social Flow platform adapters harvest hay mới? | 1.2 |
| Q9 | Zalo OA adapter — SDK hay API docs có sẵn? | 1.2 |
| Q10 | O7 (tự duyệt) — capability mới hay reuse? | 1.2 |
| Q11 | Content bound to PM + MI — enforcement ở đâu? | 1.2 |
| Q12 | Social accounts table — đã có schema? | 1.2 |
| Q13 | D13 — consent schema, xoá toàn bộ hay ẩn? | 2.2 |
| Q14 | CRM gợi ý nhắc mua — AI qua cổng nào? | 2.2 |
| Q15 | CRM customers — bảng mới hay reuse? | 2.2 |
| Q16 | M10 — orders/quotes schema đã có? | 2.3 |
| Q17 | SLA timer — realtime hay polling? | 2.3 |
| Q18 | In phiếu — PDF ở core hay client? | 2.3 |
| Q19 | Kanban trạng thái — enum hay free-text? | 2.3 |
| Q20 | Quote capability pair — riêng hay dùng H1/H3? | 2.3 |
| Q21 | Chat AI trả lời realtime — WebSocket/SSE/polling? Cổng nào? | 2.4 |
| Q22 | Chat history — bảng mới hay reuse? | 2.4 |
| Q23 | "Dẫn từ" deep link — product hay text? | 2.4 |
| Q24 | AI không tìm thấy → chuyển người — UI hay backend rule? | 2.4 |
| Q25 | P23 timeline — có bị trễ vì phụ thuộc P19/P21/P22? | 2.4 |
| Q26 | AI-2 — team, timeline? | AI-2, 1.1, 1.2 |

---

## Thứ tự ưu tiên đề xuất (khi có câu trả lời)

### Thứ tự 1: GIAI ĐOẠN 0 (UI kết nối — không cần xây backend)
1. **M01b connection** (Q1 phải trả lời trước) — 4-5 tính năng, tác động trực tiếp đến trải nghiệm người dùng
2. **M04b mapping fix** — proxy đã có, cần mapping thật
3. **Catalog Tab A polish** — filter, bộ sưu tập, QR
4. **Analytics learning section** — nếu learning backend có (Q4)

### Thứ tự 2: GIAI ĐOẠN 1 (Backend mới — song song)
1. **P16 remaining** (M04b full) — prerequisite cho P17
2. **P17** (M04c Video) — Q5, Q6, Q7 phải trả lời
3. **P18** (M07 Content+Social) — Q8-Q12 phải trả lời
4. **P19** (M06 M05) — Q3 phải trả lời

### Thứ tự 3: GIAI ĐOẠN 2 (Post-MVP)
1. **P21** (CRM) — Q13-Q15, cần D13
2. **P22** (Orders) — Q16-Q20, cần P21
3. **P20** (Analytics & Learning) — Q4, cần P18/P19/P22
4. **P23** (Chat) — Q21-Q25, cần P19/P21/P22

### Thứ tự 4: AI Infrastructure
- AI-2 → AI-3 → AI-4 (theo lộ trình)
