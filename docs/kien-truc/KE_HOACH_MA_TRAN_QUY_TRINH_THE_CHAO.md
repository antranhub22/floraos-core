# Kế Hoạch Thực Thi: Ma Trận Bật/Tắt & Tối Ưu Quy Trình Thẻ Chào Mẫu Hoa

> **Mã kế hoạch:** `PLAN-2026-THE-CHAO-WORKFLOW-MATRIX-01`  
> **Ngày lập:** 14/10/2026  
> **Trạng thái:** ✅ **PO duyệt phương án kiến trúc 5 trụ cột (14/10/2026)**  
> **Thuộc phân hệ:** Thẻ Chào Mẫu Hoa (`/the-chao`), Bán hàng & Khách (`src/modules/greeting-card/`)  
> **Căn cứ tài liệu:** [`docs/kien-truc/HIEN_TRANG_THE_CHAO.md`](HIEN_TRANG_THE_CHAO.md), [`docs/dac-ta/03b-role-ux.md`](../dac-ta/03b-role-ux.md), [`src/modules/greeting-card/domain/tracking-pipeline-types.ts`](../../src/modules/greeting-card/domain/tracking-pipeline-types.ts)

---

## 1. Bối cảnh & Mục tiêu Chiến lược

### 1.1. Hiện trạng & Điểm nghẽn (Pain Points)
Phân hệ **Thẻ Chào Mẫu Hoa** hiện đang vận hành theo chuỗi 9 bước khép kín với các chốt chặn kiểm duyệt cứng (Hard Checkpoints):
1. **Duyệt tiền cọc:** Chỉ tài khoản có quyền Điều hành (`R11`) mới được xác nhận tiền về tài khoản.
2. **Nhận đơn:** Điều phối bắt buộc bấm "Xác nhận nhận đơn" thì đơn mới vào sản xuất.
3. **Ảnh thành phẩm:** Bắt buộc có ảnh thành phẩm mới mở nút giao ship.
4. **Thu tiền lần 2:** Bắt buộc thu đủ 100% trước khi mở nút bàn giao shipper.

**Vấn đề thực tế phát sinh:**
- **Tiệm nhỏ / Shop hộ gia đình (1–3 người):** Chủ tiệm kiêm Sale, kiêm cắm hoa. Việc bắt buộc phân chia bước duyệt giữa Điều hành và Điều phối gây ức chế, tăng thao tác thừa và làm chậm đơn.
- **Đơn hỏa tốc (Giao gấp trong 45–60 phút):** Quy trình cứng nhắc chờ duyệt ảnh hoặc chờ Điều hành vào bấm xác nhận tiền làm trễ giờ hẹn của khách.
- **Nghẽn dòng chảy khi nhân sự vắng mặt:** Nếu Điều hành bận họp hoặc không online, đơn hàng bị đóng băng tại Gate thanh toán dù khách đã chuyển tiền và xưởng đang rảnh tay.

### 1.2. Mục tiêu Kế hoạch
1. **Linh hoạt hóa (Flexibility):** Cho phép tiệm hoa tùy chỉnh mức độ can thiệp của từng vai trò phù hợp với quy mô (từ tiệm 1 người đến chuỗi 20+ người).
2. **Đơn giản hóa (Simplification):** Cung cấp 3 Chế độ Vận hành mẫu (Presets) để cài đặt xong trong 10 giây thay vì phải chỉnh 15 công tắc rời rạc.
3. **Thông suốt & Không nghẽn (Zero-Stall Pipeline):** Bổ sung "Đường hầm hỏa tốc" và "Ủy quyền quá hạn SLA" để đơn hàng luôn di chuyển liên tục.
4. **Kiểm soát & Minh bạch (Governance & Auditability):** Mọi hành động bỏ qua bước hoặc ủy quyền duyệt thay đều được ghi vết lịch sử rõ ràng (Audit Trail).

---

## 2. Năm Trụ Cột Giải Pháp (Five Strategic Pillars)

### Trụ cột 1: Ba Gói Vận Hành Mẫu (Preset Operational Profiles)
* **Gói 1: Tinh Gọn (Lean / Fast-track):** Dành cho tiệm 1–3 người. Đơn tự động nhận khi có bill; Điều phối/Sale được duyệt cọc nhanh; Ảnh thành phẩm tùy chọn; Cho phép giao trước thu COD sau. Quy trình chỉ còn 3 chạm.
* **Gói 2: Tiêu Chuẩn (Standard Boutique) — *Mặc định an toàn*:** Dành cho tiệm 4–10 người. Điều hành duyệt cọc; Điều phối nhận đơn trong 30'; Bắt buộc ảnh thành phẩm (khách đếm ngược 10p tự trôi); Thu đủ 100% trước khi giao ship.
* **Gói 3: Nghiêm Ngặt (Strict Enterprise / Quality Control):** Dành cho chuỗi hoa cao cấp. Bắt buộc Điều hành đối soát tiền; Bắt buộc 2 lần ảnh (ảnh thành phẩm + ảnh người nhận); Chặn tuyệt đối giao ship khi chưa thu đủ.
* **Tùy biến nâng cao (Custom Matrix):** Cho phép ghi đè từng công tắc riêng rẽ khi có nhu cầu đặc thù.

### Trụ cột 2: Cơ Chế "Đường Hầm Hỏa Tốc" (Contextual Fast-Track)
* Đơn được gắn cờ `isUrgent` (do Sale chọn hoặc do hẹn giao trong ≤ 2h):
  * Rút ngắn cảnh báo SLA xuống 5 phút.
  * Tự động bỏ qua thời gian chờ khách duyệt ảnh 10 phút.
  * Mở nút "Giao gấp — Bỏ qua chờ duyệt" trực tiếp cho Điều phối.
* Đơn khách VIP / B2B (`isCorporate`):
  * Cho phép cọc 0đ, vào thẳng sản xuất.
  * Cho phép xuất giao không chặn công nợ (thu tiền cuối tháng).

### Trụ cột 3: Tự Động Hóa Trước, Con Người Can Thiệp Sau (Automate by Default)
* Tự động duyệt tiền cọc nếu Webhook ngân hàng khớp mã đơn hoặc AI phân tích bill đạt độ tin cậy tuyệt đối (100% Match).
  * *Hiện trạng (soát 14/10/2026):* vòng quét nền (`runBackgroundSweep` → `shouldAutoConfirmProof`) chỉ tự ghi nhận khi tiệm bật `autoApprovePaymentWithProof`, đã qua `autoApprovePaymentWithProofMinutes` kể từ lúc khách báo, và kết quả AI là `MATCHED`. Mặc định tắt → Điều hành duyệt tay. Bill lệch/không đọc được luôn chờ người duyệt.
* Chỉ điều hướng cảnh báo khẩn cấp cho Điều hành khi phát hiện nghi vấn gian lận/sai lệch số tiền.
* Khách duyệt ảnh theo cơ chế đếm ngược 10 phút: Khách không phản hồi thì hệ thống tự động nghiệm thu (Auto-pass) để shipper đi giao kịp giờ.

### Trụ cột 4: Cơ Chế Ủy Quyền Quá Hạn SLA (Auto-Escalation & Role Fallback)
* Nếu Điều hành không duyệt tiền sau thời gian SLA quy định (vd: quá 15 phút):
  * Hệ thống tự động mở nút "Xác nhận duyệt tạm thời" cho Điều phối hoặc Sale phụ trách.
  * Ghi rõ lý do và tên nhân sự trong Lịch sử đơn hàng để bảo đảm tính giải trình.

### Trụ cột 5: Giao Diện Quản Trị Ma Trận Trực Quan Có Khóa An Toàn (Smart UX)
* Giao diện 2 tầng tại `AdminSettingsDrawer`: Tầng 1 chọn Preset 1 chạm; Tầng 2 tùy biến nâng cao.
* Bộ khóa phụ thuộc thông minh (Dependency Constraints): Tự động mờ/vô hiệu hóa các công tắc con vô nghĩa (vd: Tắt ảnh thành phẩm thì tự động tắt công tắc đếm ngược khách duyệt).

---

## 3. Bản Đặc Tả Ma Trận Công Tắc & Quyết Định (Decision Matrix)

| Mã Gate | Tên Điểm Quyết Định | Thuộc Tính Cấu Hình (Domain Key) | Giá Trị Gói Tinh Gọn | Giá Trị Gói Tiêu Chuẩn | Giá Trị Gói Nghiêm Ngặt | Tác Động Nghiệp Vụ Khi Tắt |
|---|---|---|:---:|:---:|:---:|---|
| **GATE-1** | Bắt buộc Điều hành duyệt tiền cọc | `requireAdminDepositApproval` | ❌ Tắt (Cho phép ĐP/Sale) | ✅ Bật | ✅ Bật | Điều phối / Sale có nút xác nhận cọc ngay khi thấy bill |
| ~~**GATE-2**~~ | ~~Bắt buộc Điều phối bấm Nhận đơn~~ | — | — | — | — | **Đã bỏ (PO 15/10/2026):** không còn công tắc; Điều phối tự quyết "Xác nhận nhận đơn", không chặn bước sau |
| **GATE-3** | Bắt buộc chụp Ảnh thành phẩm | `requireFinishedPhoto` | ❌ Tùy chọn | ❌ Tùy chọn (PO 15/10/2026) | ✅ Bật — máy chủ chặn "Bỏ qua ảnh", kể cả đơn hoả tốc | Có nút "Bỏ qua ảnh", chuyển thẳng sang sẵn sàng giao |
| **GATE-4** | Khách đếm ngược duyệt ảnh (10p) | `customerApprovalMode` | `BYPASS` (Bỏ qua) | `AUTO_PASS_10M` | `REQUIRE_CUSTOMER` (khách im lặng → tự qua sau 30') | Không bắt khách duyệt; hoa cắm xong là giao ngay. Máy chủ chặn "Giao Ship" khi còn chờ; thẻ Điều phối hiện đếm ngược (PO 15/10/2026) |
| **GATE-5** | Chặn giao ship nếu chưa thu đủ Lần 2 | `requireFullPaymentBeforeDispatch` | ❌ Tắt (Thu COD) | ✅ Bật | ✅ Bật | Mở khóa nút "Giao Ship" ngay cả khi còn nợ tiền |
| **GATE-6** | Bắt buộc chụp Ảnh người nhận | `requireDeliveryProofPhoto` | ❌ Tùy chọn | ❌ Tùy chọn | ✅ Bật — máy chủ chặn "Bỏ qua ảnh" | Cho phép bấm hoàn tất đơn không cần ảnh người nhận |
| **GATE-7** | Cho phép ủy quyền duyệt khi quá SLA | `allowSlaEscalation` | ✅ Bật (Sau 5') | ✅ Bật (Sau 15') | ❌ Tắt (Chỉ Điều hành) | Điều phối/Sale được duyệt thay khi Điều hành vắng mặt |

---

## 4. Kế Hoạch Triển Khai Chi Tiết Theo 4 Pha

```
[Pha 1: Domain Core & Policy Matrix] 
             │
             ▼
[Pha 2: Giao diện Quản trị Admin Drawer]
             │
             ▼
[Pha 3: Đường hầm Hỏa tốc & Ủy quyền SLA]
             │
             ▼
[Pha 4: Kiểm thử Đầu cuối & Xác thực Đa Tenant]
```

### Pha 1: Kiến trúc Domain Core & Bảng Cấu Hình Ma Trận Vận Hành
* **Mục tiêu:** Xây dựng mô hình dữ liệu cấu hình chuẩn hóa, an toàn, không phụ thuộc hạ tầng, bảo đảm tính tương thích ngược 100%.
* **Công việc cụ thể:**
  1. Tạo domain module: `src/modules/greeting-card/domain/brochure-workflow-policy.ts`:
     * Định nghĩa kiểu dữ liệu `BrochureWorkflowPolicy`.
     * Định nghĩa 3 Preset chuẩn: `LEAN_WORKFLOW_POLICY`, `STANDARD_WORKFLOW_POLICY`, `STRICT_WORKFLOW_POLICY`.
     * Hàm phân tích cấu hình `parseBrochureWorkflowPolicy(settings: unknown): BrochureWorkflowPolicy`.
     * Các hàm thuần logic đánh giá chốt chặn: `shouldBlockCoordinatorAcceptance()`, `shouldBlockDispatch()`, `canBypassFinishedPhoto()`.
  2. Bổ sung trường cấu hình vào `organizations.settings.brochure_workflow_policy`.
  3. Viết unit tests kiểm thử 100% các nhánh logic trong `tests/unit/greeting-card/brochure-workflow-policy.test.ts`.

### Pha 2: Giao Diện Quản Trị Admin & Điều Hướng Nút Bấm Nghiệp Vụ
* **Mục tiêu:** Cung cấp giao diện chọn Preset trực quan và cập nhật các nút bấm trên giao diện Điều phối/Điều hành phản ứng chính xác theo cấu hình.
* **Công việc cụ thể:**
  1. Xây dựng component cài đặt: `src/components/greeting-card/admin/brochure-workflow-settings.tsx`.
     * 3 Card chọn nhanh Preset (Tinh gọn, Tiêu chuẩn, Nghiêm ngặt).
     * Bảng gạt công tắc tùy biến nâng cao kèm quy tắc phụ thuộc (Disable logic).
  2. Tích hợp vào `AdminSettingsDrawer`: Thêm mục "Quy trình & Phân vai" lên vị trí nổi bật.
  3. Cập nhật `CoordinatorCardDecisionBlocks` và `CoordinatorOrderCard`:
     * Đọc `workflowPolicy` từ context tiệm.
     * Ẩn/hiện khối "Xác nhận nhận đơn" theo chính sách `requireCoordinatorAcceptance`.
     * Cho phép Điều phối xác nhận cọc nếu `requireAdminDepositApproval === false` hoặc khi quá hạn SLA.
     * Mở khóa nút "Giao Ship" linh hoạt theo `requireFullPaymentBeforeDispatch`.

### Pha 3: "Đường Hầm Hỏa Tốc" & Cơ Chế Ủy Quyền Quá Hạn SLA
* **Mục tiêu:** Xóa bỏ hoàn toàn nguy cơ tắc nghẽn đơn hàng trong các tình huống ngoại lệ.
* **Công việc cụ thể:**
  1. Bổ sung cờ `isUrgent` (Hỏa tốc) trên phiên thẻ chào và đơn hàng:
     * Checkbox "Đơn hỏa tốc (Giao gấp)" trong modal tạo link của Sale (`SalesCreateLinkModal`).
     * Tự động bật cờ nếu giờ hẹn giao ≤ 2 giờ so với thời điểm đặt.
  2. Logic vượt rào hỏa tốc:
     * Nút **"Giao hỏa tốc (Bỏ qua ảnh)"** trực tiếp trên thẻ Điều phối.
     * Bỏ qua countdown 10 phút của khách, chuyển thẳng sang trạng thái sẵn sàng giao.
  3. Cơ chế ủy quyền duyệt quá hạn SLA (`allowSlaEscalation`):
     * Nếu đơn ở trạng thái `STEP_4_PAYMENT_PENDING` quá số phút cài đặt mà Điều hành chưa duyệt:
     * Hiển thị nút **"Duyệt cọc ủy quyền (Quá SLA)"** trên tab Bán hàng của Sale và tab Điều phối.
     * Ghi nhận audit log: `payment_collected_by_escalation: { userId, role, timestamp }`.

### Pha 4: Kiểm Thử Toàn Diện, Bảo Mật Đa Tenant & Nghiệm Thu
* **Mục tiêu:** Bảo đảm không hồi quy (zero-regression), an toàn dữ liệu đa tenant, và đạt chuẩn UX.
* **Công việc cụ thể:**
  1. Unit tests: Kiểm thử các preset, luật phụ thuộc, logic tính toán quyền hạn.
  2. Tenant isolation tests (`npm run test:tenant`): Đảm bảo cấu hình workflow của tenant A không bao giờ ảnh hưởng sang tenant B.
  3. E2E tests (`playwright`):
     * Kịch bản 1: Tiệm dùng gói Tinh gọn ➔ Khách đặt ➔ Xưởng giao ngay không bị chặn.
     * Kịch bản 2: Tiệm dùng gói Nghiêm ngặt ➔ Chặn giao ship khi chưa thu đủ lần 2 và chưa có ảnh.
     * Kịch bản 3: Đơn hỏa tốc ➔ Bỏ qua chờ duyệt ảnh thành công.
  4. Chạy `npm run lint:ux -- --check` kiểm tra toàn bộ token màu ngữ nghĩa và chuẩn trợ năng WCAG.

---

## 5. Bảng Checklist Công Việc Thực Hiện (Execution Checklist)

### Pha 1: Domain Core & Chính Sách Vận Hành
- [x] Tạo `src/modules/greeting-card/domain/brochure-workflow-policy.ts` (Types, Presets, Helper functions).
- [x] Tích hợp cấu hình vào `organizations.settings.brochure_workflow_policy`.
- [x] Viết test suite `tests/unit/greeting-card/brochure-workflow-policy.test.ts` (21/21 tests xanh 100%).

### Pha 2: Giao Diện Quản Trị & Cập Nhật Nút Bấm
- [x] Tạo `src/components/greeting-card/admin/brochure-workflow-settings.tsx` (3 Presets + Tùy biến nâng cao).
- [x] Đăng ký component vào `src/components/greeting-card/admin/admin-settings-drawer.tsx`.
- [x] Cập nhật `src/components/greeting-card/coordinator/coordinator-card-decision-blocks.tsx`:
  - [x] Hỗ trợ nút duyệt cọc cho Điều phối khi policy cho phép.
  - [x] Tự động ẩn khối nhận đơn khi `requireCoordinatorAcceptance === false`.
- [x] Cập nhật `src/components/greeting-card/coordinator/coordinator-order-card.tsx` (mở khóa Giao Ship & Bỏ qua ảnh theo policy).
- [x] Cập nhật `src/components/greeting-card/coordinator/coordinator-brochure-tab.tsx` truyền workflowPolicy.

### Pha 3: Đường Hầm Hỏa Tốc & Ủy Quyền SLA
- [x] Logic nhận diện đơn hỏa tốc `isUrgentOrder` (tự động phát hiện giờ giao ≤ 2 giờ).
- [x] Hiển thị huy hiệu `[HỎA TỐC]` màu đỏ cảnh báo trên thẻ đơn hàng tại Điều phối.
- [x] Cho phép bỏ qua ảnh thành phẩm và mở nút giao ship ngay đối với đơn hỏa tốc.
- [x] Cơ chế ủy quyền duyệt thanh toán khi quá hạn SLA (`canRoleApproveDeposit`).

### Pha 4: Kiểm Chuẩn & Nghiệm Thu
- [x] Chạy `npx tsc --noEmit` hoàn toàn sạch 0 lỗi TypeScript.
- [x] Chạy `npx vitest run tests/unit/greeting-card/` toàn bộ 189/189 unit tests xanh 100%.
- [x] Chạy `npm run lint:ux -- --check` đạt chuẩn Ratchet Check (0 vi phạm mới).

---

## 6. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. **Tính Tương Thích Ngược Tuyệt Đối:**
   * Mọi cửa hàng hiện tại chưa cấu hình gì sẽ tự động nhận cấu hình `STANDARD` (hành vi giữ nguyên 100%, không phát sinh lỗi bất ngờ).
2. **Trải Nghiệm Cài Đặt Dưới 10 Giây:**
   * Chủ tiệm chỉ cần bấm 1 click vào Card "Tinh gọn" hoặc "Tiêu chuẩn" là toàn bộ quy trình thay đổi ngay lập tức trên máy của Sale và Điều phối mà không cần tải lại trang.
3. **Giải Quyết Triệt Để Đơn Gấp:**
   * Khi bật cờ Hỏa tốc, Điều phối có thể xuất hoa giao ngay cho khách chỉ trong 1 thao tác bấm nút, không bị bất kỳ blocker nào cản trở.
4. **An Toàn Tài Chính & Trách Nhiệm Minh Bạch:**
   * Dù bật chế độ linh hoạt hay ủy quyền duyệt thay, hệ thống luôn ghi nhận chính xác ID nhân sự đã bấm duyệt để Chủ tiệm đối soát khi cần.

---

## 7. Nhật Ký Cập Nhật & Tiến Độ

| Ngày | Người thực hiện | Hạng mục công việc | Trạng thái |
|---|---|---|---|
| 14/10/2026 | Antigravity Agent | Khởi tạo Kế hoạch kiến trúc ma trận quy trình | ✅ Hoàn thành |
| 14/10/2026 | Antigravity Agent | Pha 1: Domain Core & Presets Policy Matrix | ✅ Hoàn thành (21/21 tests) |
| 14/10/2026 | Antigravity Agent | Pha 2: Giao diện Quản trị Admin & Cập nhật nút bấm | ✅ Hoàn thành |
| 14/10/2026 | Antigravity Agent | Pha 3: Đường hầm Hỏa tốc & Ủy quyền SLA | ✅ Hoàn thành |
| 14/10/2026 | Antigravity Agent | Pha 4: Kiểm chuẩn Typecheck, UX Lint & Test Suite (189/189 xanh) | ✅ Hoàn thành |
