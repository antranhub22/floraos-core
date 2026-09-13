# Kế hoạch triển khai — CẬP NHẬT sau khi trả lời Q1-Q26

**Ngày:** 13/09/2026
**Trạng thái:** 31/115 tính năng đã code (21%)

---

## Tổng hợp câu trả lời Q1-Q26

| # | Câu trả lời | Quyết định |
|---|-------------|-------------|
| Q1 | Duyệt rồi Stop, nút Sinh nội dung bán hàng tùy chọn | M01b optional, UI conditional |
| Q2 | Kiểm tra xem có chưa, nếu chưa triển khai độc lập | M04b: check SocialFlow → build mới |
| Q3 | LocalBudd đã có, kiểm core proxy | M05 proxy cần thêm whitelist |
| Q4 | Chưa biết, kiểm tra | Learning profile: KHÔNG CÓ → build mới |
| Q5 | Kiểm SocialFlow, build mới nếu chưa | M04c: check → build |
| Q6 | Framework placeholder | Credit: dùng khung placeholder |
| Q7 | Đề xuất phương án | AI-2: implement gateway-level |
| Q8 | Harvest SocialFlow | M07: extend SocialFlow |
| Q9 | Kiểm SocialFlow, xây mới nếu chưa | Zalo OA: check → build new |
| Q10 | Ưu tiên sau nếu không cấp thiết | O7: defer |
| Q11 | Kiểm cách xử lý phổ biến | Content bound: standard approach |
| Q12 | Chưa rõ, kiểm tra | Social accounts: check |
| Q13 | Tiêu chuẩn thông thường | D13: standard consent |
| Q14 | LLM Provider ưu tiên, đa lựa chọn | CRM AI: LLM provider |
| Q15 | Contact, reuse | Customers: reuse users/memberships |
| Q16 | Kiểm rồi xử lý | Orders: check schema, migrate |
| Q17 | Realtime | SLA/chat: realtime |
| Q18 | PDF/PNG/JPEG, support Vietnamese font | Print: multi-format |
| Q19 | Fixed enum | Kanban: enum |
| Q20 | Chọn phương án phù hợp | Quote: quote.run/quote.approve pair |
| Q21 | Realtime | Chat: realtime |
| Q22 | Bảng mới | Chat: new table |
| Q23 | Có deep link | Chat: clickable |
| Q24 | Có | Chat fallback: UI button |
| Q25 | Có thể start UI mock | P23: parallel mock |
| Q26 | Tự đề xuất | AI-2: implement now |

---

## GIAI ĐOẠN 0 — UI kết nối backend có sẵn (2-3 tuần)

### 0.1 — #1 Phân tích sản phẩm: M01b connection ✅ BẮT ĐẦU NGAY

**Xác nhận:** M01b backend ĐÃ CÓ (`product-copies` 5 routes + `src/modules/product-copies/`)
**Capability:** H5 (generate) ↔ H6 (approve) — đã có split pair + test khoá

| # | Tính năng | Action |
|---|-----------|--------|
| 1.12 | Gợi ý "Sinh nội dung bán hàng" (tùy chọn) | Connect POST /product-copies/generate |
| 1.13 | Thẻ kết quả 2: nội dung bán hàng | Map response → ResultField[] |
| 1.14 | Sửa/Thêm/Bớt Thẻ 2 | PATCH /product-copies/:id |
| 1.15 | Duyệt Thẻ 2 → ghi Product Master | POST /product-copies/:id/approve |
| 1.16 | Lưu vào Kho → quay về | After approve, redirect |

**Công việc cụ thể:**
- [ ] Đọc `src/modules/product-copies/use-cases/generate-product-copy.ts` (input/output contract)
- [ ] Đọc `src/modules/product-copies/domain/product-copy-rules.ts` (validation rules)
- [ ] Đọc `src/modules/product-copies/use-cases/approve-product-copy.ts` (approve flow)
- [ ] Tạo `mapProductCopyToFields()` mapper (product-copies response → ResultField[])
- [ ] Nối 5 API calls vào `tai-anh/page.tsx`
- [ ] Xử lý: H6 trần cứng dieu_hanh (ẩn Duyệt cho vai không đủ)
- [ ] Error handling: 401/403/409/502
- [ ] Verify: analysis_id phải APPROVED (kiểm trong use-case)
- [ ] Xóa MOCK_FIELDS_RESULT2 comment

**Đọc tài liệu:** `src/core/ai/domain/routing.ts` — AIC-07..10 là model cho product copy (generative, measured).

---

### 0.2 — #2 Creative Studio: M04b mapping fix

**Xác nhận:** M04a backend ✅, proxy M04b ✅ (whitelist `api/m04b` cho SOCIALFLOW), M04b full ❌

| # | Tính năng | Action |
|---|-----------|--------|
| 2.20 | Proxy M04b mapping | Hoàn thiện mapping proxy → variant |
| 2.13-2.19 | M04b full (background, frame, retouch, watermark, batch) | **Chờ P16 backend** |

**Công việc:**
- [ ] Đọc `src/components/creative/creative-studio.tsx` (proxy call + response mapping)
- [ ] Hoàn thiện proxy response → UI variant structure mapping
- [ ] Sau P16 backend: thay VARIANTS mock bằng kết quả thật

---

### 0.3 — #6 Catalog: Tab A polish + M05 proxy whitelist

**Xác nhận:** M06 catalog-links ✅, M05 builder trên LocalBudd (cần proxy)

| # | Tính năng | Action |
|---|-----------|--------|
| 6.2-6.3 | Filter, Bộ sưu tập | UI polish |
| 6.4 | Xem trước catalog | Thêm `api/v1/projects` vào LOCALBUDD whitelist (hiện chỉ có `api/v1/catalog-links`) |
| 6.6 | QR code | UI component |

**Công việc:**
- [ ] Thêm `api/v1/projects` vào LOCALBUDD proxy whitelist (`proxy-rules.ts`)
- [ ] Hoàn thiện Tab A UI (filter, bộ sưu tập)
- [ ] QR component

---

### 0.4 — #10 Analytics: Learning — KHÔNG CÓ backend

**Xác nhận:** `GET/PUT /api/v1/learning-profile` — KHÔNG TỒN TẠI

→ Chuyển sang GIAI ĐOẠN 2 (P20). Learning section tạm giữ mock.

---

## GIAI ĐOẠN 1 — Xây backend mới (8-12 tuần, song song)

### 1.1 — AI-2: Scoring, Cascade, Privacy Floor, Review Queue (2-3 tuần)

**Tự đề xuất (Q7, Q26):**

AI-2 là nền tảng chặn P17 (Video) và P18 (Content). Implement ở gateway level — existing infrastructure.

| Deliverable | Chi tiết | Ước lượng |
|---|----------|-----------|
| Per-capability quality scoring | Mở rộng `evaluation.ts` — đánh giá output theo AIC capability, score từ channels | 1 tuần |
| Cascade thresholds | `routing.ts` đã có `cascade` flag — wire với threshold từ `ai_capabilities.threshold` | 1 tuần |
| Needs review queue | Thêm trường `needs_review` vào `ai_requests`, endpoint GET/POST `/api/v1/ai-requests/review` | 1 tuần |
| Privacy floor enforcement | `privacy.ts` đã có — đảm bảo SENSITIVE không ra ngoài qua fallback | 0.5 tuần |
| Fallback chains | `routing.ts` có `nextFallback`/`nextEscalation` — wire vào gateway | 0.5 tuần |

**Test:** Unit tests thuần (không cần DB) cho `evaluation.ts`, `routing.ts`, `privacy.ts`.

**Ưu tiên:** AI-2 phải hoàn thành trước P17, P18. Song song với GĐ 0.

---

### 1.2 — P16 Remaining: M04b Full (3-4 tuần)

**Xác nhận:** Check SocialFlow xem background replacement đã có chưa (Q2). Nếu chưa → BUILD mới.

| # | Tính năng | Module | Notes |
|---|-----------|--------|-------|
| 2.14 | Background replacement (studio/living/hotel/wedding) | `src/modules/` mới | AIC-12? AIC-13? |
| 2.15 | Frame expansion, retouch, watermark | `src/modules/` mới | AIC-15? AIC-17? |
| 2.16 | Batch variants (matrix) | core use-case | Kết hợp background × layout × ratio × campaign |
| 2.21 | Watermark logo từ brand_profiles.logo_asset_id | domain rule | |

**Câu hỏi:**
> Q2b: SocialFlow M04b background replacement — đã có code chưa? Nếu có → ADAPTER. Nếu không → BUILD.

---

### 1.3 — P17: AI Video Studio M04c (4-5 tuần)

**Xác nhận:** Cần check SocialFlow HeyGen/Veo (Q5) + Scene builder location + D14 credit (Q6).

| # | Tính năng | Module/Route | Capability | Notes |
|---|-----------|-------------|------------|-------|
| 3.1-3.4 | Chọn khuôn, cấu hình, dựng kịch bản | `POST /video/jobs` | P1 (generate) | 6 khuôn, scene builder |
| 3.5 | Thẻ kịch bản | `GET /video/jobs/:id` | P1 | cảnh, thời lượng, hiệu ứng |
| 3.6 | Sửa kịch bản | `PATCH /video/jobs/:id` | P1 | |
| 3.7 | Duyệt kịch bản | `POST /video/jobs/:id/approve-script` | P3 | trước dựng |
| 3.8 | Dựng video | `POST /video/jobs/:id/deploy` | P1 | 1-3 phút, không chặn |
| 3.9 | Thẻ kết quả video | `GET /video/jobs/:id` | P1 | trình phát, chi phí |
| 3.10 | Duyệt video | `POST /video/jobs/:id/approve-video` | P4 | sau kết quả |
| 3.11 | Lưu vào Kho video | `POST /integration/assets` | I3 | parent_asset_id → MI |
| 3.12 | Khung đầu/cuối khoá | domain rule | P1 | chỉ Master Image |
| 3.13 | Job lỗi → thử lại | `POST /video/jobs/:id/retry` | G7 | không trừ hạn mức |
| 3.14 | Chi phí → usage | enqueue | G8 | feature = video.generate, placeholder |

**Module cần tạo:** `src/modules/video-studio/` (domain, use-cases, infra, adapters)
**Câu hỏi:**
> Q5b: HeyGen/Veo adapters — ở SocialFlow (harvest EXTEND) hay build mới ở core?
> Q5b2: Scene builder ở core hay SocialFlow?
> Q6b: D14 credit pricing cho video.generate — placeholder framework (Q6), có blocking không?

---

### 1.4 — P18: AI Content Engine + Social Publishing M07 (6-8 tuần)

**Xác nhận:** Harvest từ SocialFlow (Q8). Zalo OA check (Q9).

**Module cần tạo:** `src/modules/content-engine/` + `src/modules/social-publishing/`

| # | Chức năng | Tính năng | Capability | Notes |
|---|-----------|-----------|------------|-------|
| **Content** | | | | |
| 4.1-4.3 | Chọn sản phẩm, kênh, dịp | `POST /content/posts` | O1 | bound to PM + approved MI |
| 4.5 | Thẻ kết quả từng kênh | `GET /content/posts/:id` | O1 | FB/IG/TikTok/Zalo OA/SEO |
| 4.6 | Sửa nội dung | `PATCH /content/posts/:id` | O1 | |
| 4.7 | Duyệt | `POST /content/posts/:id/approve` | O3 | |
| 4.8 | Lưu Thư viện | DB insert | O1 | |
| 4.9 | Chỉ báo giọng + dữ kiện | AI evaluation | AI-2 | |
| 4.10 | Gợi ý lên lịch | UI redirect | — | → Social Publishing |
| **Social** | | | | |
| 5.1-5.5 | Lịch đăng | `POST/GET /content/schedule` | O6 | |
| 5.6 | Thẻ trạng thái | UI | — | |
| 5.7 | Lịch đăng view | `GET /content/schedule` | O6 | tuần/tháng |
| 5.8 | Đăng lại thông minh | Analytics | O6 | |
| 5.9 | Tự duyệt (defer) | `PUT /content/settings` | O7 | DEFER — không cấp thiết |
| 5.11 | Đăng lỗi → thử lại | `POST retry` | O6 | |

**Câu hỏi:**
> Q8b: Social Flow platform adapters — có sẵn ở SocialFlow? ADAPTER (đọc) hay BUILD (mới)?
> Q9b: Zalo OA adapter — có SDK/docs? If not → BUILD mới hoàn toàn.
> Q11b: Content bound to PM + MI — enforcement: UI kiểm (product status=APPROVED), route kiểm (must be APPROVED), hay domain? Standard approach: route-level validation.

---

### 1.5 — P19: M06 Catalog hoàn thiện + M05 Proxy (2-3 tuần)

| # | Tính năng | Action | Notes |
|---|-----------|--------|-------|
| 6.2-6.3 | Filter, Bộ sưu tập | UI | Backend đã có |
| 6.4 | Xem trước | Thêm LOCALBUDD whitelist | Proxy |
| 6.6 | QR code | UI | J7 check |
| 6.8-6.15 | Landing page | LocalBudd side | Check LocalBudd M05 → proxy config |

**Câu hỏi:**
> Q3b: LocalBudd M05 sẵn sàng cho core proxy? Cần thêm `api/v1/projects` vào LOCALBUDD whitelist.

---

## GIAI ĐOẠN 2 — Post-MVP (10-15 tuần)

### 2.1 — P21: CRM & Khách hàng M09 (3-4 tuần)

**Xác nhận:** Customer = Contact (reuse users/memberships — Q15). D13 standard consent (Q13). LLM provider cho AI (Q14).

**Module cần tạo:** `src/modules/crm/`
**Bảng mới:** Không có — reuse `users` (là customer), `memberships` (vai trò trong org).
**Cần thêm:** `consent_logs` table (Q13), `customer_segments`?

| # | Tính năng | Route | Capability | Notes |
|---|-----------|-------|------------|-------|
| 7.1 | Danh sách khách hàng | `GET /customers` | M09 | Từ users (role=customer?) |
| 7.2 | Hồ sơ khách hàng | `GET /customers/:id` | M09 | Lịch sử mua từ orders |
| 7.3 | Gợi ý nhắc mua | `POST /customers/:id/campaigns` | M09 | LLM provider, privacy floor |
| 7.4 | KHÔNG gửi PII | Privacy | D15 | PII stays in infra |
| 7.5-7.8 | Thẻ kết quả, sửa, duyệt, lịch gửi | CRUD | M09 | |
| 7.9 | Đồng ý nhận nhắc | `POST /consent` | D13 | Bảng consent_logs |
| 7.10 | Yêu cầu xoá dữ liệu | `POST /customers/:id/delete-request` | D13 | Standard practice |
| 7.11 | Khối đồng ý | UI | D13 | |

**Bảng cần migration:** `consent_logs` (customer_id, type, status, recorded_at, recorded_by)

---

### 2.2 — P22: Đơn hàng & Vận hành M10 (4-5 tuần)

**Xác nhận:** Fixed enum Kanban (Q19), Realtime SLA (Q17), PDF/PNG/JPEG + Vietnamese font (Q18). Quote: quote.run/quote.approve pair (Q20).

**Module cần tạo:** `src/modules/orders/`
**Bảng cần migration:** `orders`, `order_items`, `quotes`, `order_status_history` (cho Kanban timeline)

| # | Tính năng | Route | Capability | Notes |
|---|-----------|-------|------------|-------|
| 8.1-8.3 | Tạo đơn | `GET/POST /orders` | M010 | |
| 8.4-8.5 | Phiếu chào giá | `POST /orders/:id/quote` | quote.run | PDF/PNG/JPEG |
| 8.6 | Duyệt | `POST /orders/:id/approve` | quote.approve | |
| 8.9-8.11 | Kanban, phân công, SLA | `GET /orders/board`, `POST /orders/:id/assign` | M10 | fixed enum, realtime SSE |
| 8.12-8.15 | In, quá SLA | Print service | M10 | Vietnamese font |

**Bảng cần migration:** `orders`, `order_items`, `quotes`, `order_status_history`

**Câu hỏi:**
> Q16b: Kiểm tra schema → migration plan cụ thể?

---

### 2.3 — P20: Analytics & Learning M11 (3 weeks)

**Xác nhận:** Learning profile KHÔNG có (Q4) → BUILD.

| # | Tính năng | Action | Notes |
|---|-----------|--------|-------|
| 10.12-10.18 | Vòng học phong cách | BUILD | learning-profile endpoint + history |
| 10.9 | Diễn giải | EXTEND | AI-4 domain events |

**Bảng cần tạo:** `learning_profiles`, `learning_history`

---

### 2.4 — P23: AI Chat Assistant M08 (3-4 weeks)

**Xác nhận:** Realtime (Q21), New table chat_messages (Q22), Deep links yes (Q23), UI fallback yes (Q24), Start UI mock early (Q25).

**Module cần tạo:** `src/modules/chat-assistant/`
**Bảng mới:** `chat_messages`, `chat_conversations`, `chat_configs`

| # | Tính năng | Tab | Route | Notes |
|---|-----------|-----|-------|-------|
| 9.1-9.4 | Hội thoại, lịch sử, AI trả lời, nhãn "dẫn từ" | A | `GET/POST /chat/...` | Realtime SSE |
| 9.5 | Chuyển nhân viên | A | `POST /chat/.../transfer` | |
| 9.6 | Gắn cờ | A | `POST /chat/.../flag` | |
| 9.7 | AI không tìm thấy → chuyển | A | UI rule | |
| 9.8-9.10 | Phạm vi, FAQ, ngưỡng | B | `GET/PUT /chat/config` | |
| 9.11 | Xem trước | B | `POST /chat/config/preview` | simulate 3 |
| 9.12 | Duyệt cấu hình | B | `POST /chat/config/approve` | |

**Câu hỏi:**
> Q21b: Realtime AI trả lời — SSE hay WebSocket? LLM provider cổng nào?
> Q22b: Chat schema — bảng `chat_messages`, `chat_conversations`, `chat_configs`?

---

## AI-2: Phương án đề xuất (Q7, Q26)

### Tại sao AI-2 quan trọng
AI-2 là blocker cho P17 (Video) và P18 (Content). Cả hai đều cần: đánh giá chất lượng output AI, thác nghiệm khi chưa đạt ngưỡng, fallback khi model hỏng, và review queue khi AI không chắc.

### Phương án: Triển khai ở Gateway Level

`src/core/ai/gateway.ts` đã có flow: resolve capability → load policy → selectModel → run adapter → **evaluate** → escalate/fallback/accept/reject. AI-2 chỉ cần mở rộng các bước evaluate, escalate, fallback.

### Deliverables

| # | Deliverable | File | Ước lượng | Trạng thái |
|---|-------------|------|-----------|-------------|
| A1 | Per-capability quality scoring | `domain/evaluation.ts` | 1 tuần | Extend — đã có `evaluateOutput()`, mở rộng thêm score channels |
| A2 | Cascade thresholds | `domain/routing.ts` | 1 tuần | Extend — đã có `cascade` flag, wire với threshold config |
| A3 | Needs review queue | `domain/ai-requests.ts` + routes | 1.5 tuần | New field `needs_review` + endpoint |
| A4 | Privacy floor enforcement | `domain/privacy.ts` | 0.5 tuần | Đã có — verify + test |
| A5 | Fallback chains | `domain/routing.ts` | 0.5 tuần | Đã có `nextFallback` — wire vào gateway |

### Tổng: ~3.5 tuần, thuần domain logic (không cần DB), song song GĐ 0

### Thứ tự
A4 → A5 → A1 → A2 → A3 (A4, A5 sẵn sàng; A1-A3 cần mở rộng)

---

## GIAI ĐOẠN 3: AI Infrastructure (Tuyến C)

| Batch | Scope | Trạng thái |
|---|---|---|
| AI-1 | Gateway, 34 caps, 10 ports, policies | ✅ DONE |
| AI-2 | **Phương án đề xuất ở trên** | ❌ Proposed |
| AI-3 | flower_taxonomy, knowledge_chunks | ❌ |
| AI-4 | Domain events, content_features | ❌ |

---

## Timeline tổng thể (updated)

```
GĐ 0 (2-3 tuần)  ├─ 0.1 M01b connection ──────────────────────
                  ├─ 0.2 M04b mapping ──────────┐
                  ├─ 0.3 Catalog polish ─────────┤
                  └─ 0.4 Learning → GĐ 2 ────────┘
AI-2 (3.5 tuần)  ├── song song với GĐ 0
P16 remaining ──┤ (Q2b check)
P17 (4-5 wk) ───┤ (Q5b, Q5b2, Q6b check)
P18 (6-8 wk) ───┤ (Q8b, Q9b, Q11b check)
P19 (2-3 wk) ───┘ (Q3b check)
P21 (3-4 wk) ──┤ (Q16b check)
P22 (4-5 wk) ──┤ (song song P21, cần P21)
P20 (3 wk) ────┘ (cần P18, P19, P22)
P23 (3-4 wk) ──┘ (cần P19, P21, P22, UI mock sớm)
```

---

## Hành động tiếp theo

### Ngay lập tức (không cần chờ)
1. **Bắt đầu 0.1:** Đọc `src/modules/product-copies/` — connect M01b vào tai-anh
2. **Bắt đầu AI-2:** A4, A5 (đã có code), rồi A1-A3

### Cần check (1-2 ngày)
1. Q2b: SocialFlow M04b background replacement — có code không?
2. Q5b/5b2: SocialFlow HeyGen/Veo + Scene builder — có không?
3. Q8b/9b: SocialFlow M07 adapters + Zalo OA — có không?
4. Q3b: LocalBudd M05 → proxy whitelist
5. Q11b: Content bound enforcement — standard approach
6. Q12: Social accounts — check SocialFlow schema
7. Q16b: M10 schema — check → migration plan

### Cần quyết định (cá nhân)
1. O7 (Q10): Ưu tiên sau? Hay bỏ?
2. Q13b: D13 consent schema cụ thể?
3. Q14b: CRM AI — LLM provider cụ thể (OpenAI? Others?)?
4. Q21b: Chat realtime — SSE hay WebSocket?

---

## Tài liệu liên quan
- `docs/UIUX-Feature-Checklist.md` — 115 tính năng
- `docs/UIUX-Implementation-Plan.md` — kế hoạch gốc + 26 câu hỏi
- `src/modules/product-copies/` — M01b backend (đã có)
- `src/core/ai/gateway.ts` — AI-2 target (đã có flow)
- `src/core/ai/domain/routing.ts` — 5 ràng buộc D17
