# Checklist thực thi

Một pha chỉ coi là xong khi mọi ô của nó tích được. Mã trong ngoặc dẫn về `01-technical-requirements.md`.

Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi **P1 và P2** tích hết.

## P0 — Khung repo · xong

- [x] Cấu trúc thư mục theo `05-backend-architecture.md` mục 1
- [x] Năm cổng khai ở `src/core/ports/`
- [x] `AGENTS.md`, tài liệu kiến trúc, bộ đặc tả
- [x] `prisma/schema.prisma` trống, chỉ có `datasource` và `generator`
- [x] `npm run test:tenant` tồn tại và thất bại có chủ đích

## P1 — Tổ chức và cách ly tenant

- [ ] Bảy bảng nền dựng đủ: `users` `sessions` `organizations` `workspaces` `branches` `roles` `memberships` (`YC-T1`)
- [ ] `TenantContext` giải từ `sessions.organization_id` phía máy chủ (`YC-T2`)
- [ ] Repository nhận `TenantContext` bắt buộc, tự chèn điều kiện lọc (`YC-T3`)
- [ ] Không module nào import `PrismaClient` ngoài `infra/`
- [ ] Bản ghi tổ chức khác trả 404, không trả 403 (`YC-T4`)
- [ ] `POST /session/organization` là nơi duy nhất client nêu tên tổ chức
- [ ] Bộ test cách ly phủ mọi bảng có `organization_id`, chạy trong CI (`YC-T10`)
- [ ] **`npm run test:tenant` xanh thật** — gỡ script thất bại có chủ đích
- [ ] Không còn bất kỳ khoá ghi toàn cục nào (`YC-T9`)

## P2 — Quyền

- [ ] 76 mã chuyển sang nguyên vẹn, `maChucNang.test.ts` xanh không sửa một dòng (`YC-Q1`)
- [ ] Ba lớp cắt đúng thứ tự, trần cứng cắt sau cùng (`YC-Q2`)
- [ ] Bảng trần cứng là hằng trong mã, không trong cơ sở dữ liệu (`YC-Q3`)
- [ ] 18 mã trần cứng — hoặc con số đã được chủ sản phẩm xác nhận lại (`YC-Q3`)
- [ ] Quyền là bộ ba `(vai, mã, phạm vi)` (`YC-Q4`)
- [ ] Vai là bản ghi; không còn `enum Role` (`YC-Q5`)
- [ ] Bốn cặp năng lực tách rời, không cặp nào gói chung (`YC-Q6`)
- [ ] Không có `if (role === …)` ở bất kỳ đâu (`YC-Q7`)
- [ ] Điều hành có mọi năng lực của Sale và Điều phối (`YC-Q8`)
- [ ] Công tắc `cho_phep_tu_duyet` hoạt động (`YC-Q9`)
- [ ] `GET /auth/me` trả danh sách năng lực đã tính sẵn

## P3 — Asset · Job · Usage

- [ ] `assets` đủ cột metadata bắt buộc (`YC-A4`)
- [ ] `parent_asset_id` và `version`; asset gốc không bao giờ bị ghi đè (`YC-A1` `YC-A2` `YC-A3`)
- [ ] `generated_flags` không mặc định ngầm (`YC-A5`)
- [ ] `generation_jobs` ba trục tách rời (`YC-J1` `YC-J2`)
- [ ] `COMPLETED/REJECTED` không phải `FAILED`; retry trả 409 (`YC-J3`)
- [ ] `CANCELLED` huỷ được job `PENDING` (`YC-J4`)
- [ ] Worker lấy việc bằng `SKIP LOCKED` + `LISTEN/NOTIFY` (`YC-J7`)
- [ ] Không `subprocess`, không job qua HTTP (`YC-J8`)
- [ ] Nhật ký cộng dồn, nối lại được bằng `Last-Event-ID` (`YC-J9`)
- [ ] Tiến trình quét job treo quá 15 phút (`YC-J10`)
- [ ] Một bảng `usage` duy nhất (`YC-U1` `YC-U2`)
- [ ] Hạn mức kiểm trước khi job vào bảng, cùng một giao dịch (`YC-U3`)
- [ ] Worker không ghi `usage` (`YC-U4`)
- [ ] `Idempotency-Key` trên mọi endpoint tạo job (`YC-U7`)
- [ ] `audit_logs` ghi mọi hành động duyệt (`YC-R4`)

## P4 — Hồ sơ

- [ ] `business_profiles` và `brand_profiles` tách đôi, mỗi tổ chức một bản ghi
- [ ] Nhập một lần, dùng lại xuyên module

## P5 — M01 phân tích ảnh

- [ ] **Bộ ảnh vàng 50–100 ảnh đạt nghiệm thu** theo `../kien-truc/BO_ANH_VANG.md`
- [ ] Hợp đồng `PhanTichSanPhamHoa` lấy nguyên từ `Schema.json`, không khai lại tay (`YC-N3`)
- [ ] Cổng `VisionAnalyzer` ở mức hợp đồng JSON (`YC-N2`)
- [ ] `OpenAIStructuredProvider` chạy được sau cổng
- [ ] `count_engine.py` và `color_engine.py` chuyển sang, có test hồi quy trên bộ ảnh vàng
- [ ] Kết quả lưu `raw` và `edited` tách rời (`YC-R3`)
- [ ] Kết quả không ghi thẳng Product Master; phải qua duyệt (`YC-R1`)
- [ ] `approved_by` và `approved_at` có trên bản ghi (`YC-R2`)
- [ ] Ma trận chọn công nghệ hoàn thành, có cột soát cách ly tenant (`YC-N5` `YC-N6`)

## P6 — M02 giá và M03 tra cứu

- [ ] `pricing.ts` và bất biến làm tròn chuyển sang, test hai phía xanh
- [ ] Quy tắc giá theo tổ chức, có thể theo chi nhánh
- [ ] **Chốt cách tính chi phí lá và cành trang trí** — quy ước đếm để loại này không có số lượng
- [ ] Tra cứu chạy trên Postgres; `locTraCuu.test.ts` xanh

## P7 — Integration Layer

- [ ] Token máy gọi máy theo tổ chức, có ký, xoay được (`YC-T8`)
- [ ] `LocalBudd` bỏ năm bảng trùng, đọc core qua API
- [ ] `/integration/products/:id/master-image` chỉ trả ảnh đã duyệt
- [ ] Adapter `SocialFlow` nhận `organization_id`

## P8 — Nạp dữ liệu AVI GIFT

- [ ] Adapter Excel một chiều; không đường nào ghi ngược
- [ ] Dữ liệu nhập đủ, đối chiếu với bảng nghiệm thu của `BAN_GIAO.md`

## P9 — M04a tối ưu ảnh

- [ ] Identity Guard là cổng cứng, chặn được một thay đổi sản phẩm mô phỏng
- [ ] `REJECTED` giữ ảnh gốc, không trả ảnh tăng cường (`YC-R5`)
- [ ] `WARNING` duyệt được nhưng có cảnh báo trước (`YC-R6`)
- [ ] Guard dùng cùng provider và cùng model version hai lần (`YC-N4`)
- [ ] Tăng cường chạy một lần; các tỉ lệ từ Smart Reframe
- [ ] Tải về và duyệt là hai nút riêng, hai năng lực riêng

## P10 — Experience Mode

- [ ] Workspace demo nạp sẵn hồ sơ, sản phẩm, quy tắc giá mẫu
- [ ] Người dùng chỉ cung cấp ảnh và tên sản phẩm
- [ ] Lưới thẻ chức năng; không tự động chạy chức năng tính phí nào
- [ ] Hạn mức trải nghiệm đặt lại được (`YC-U6`)
- [ ] Chuyển được workspace trải nghiệm thành tổ chức thật

## P11 — Cắt sang hệ mới

- [ ] AVI GIFT vận hành trên core theo đúng bảng nghiệm thu của `BAN_GIAO.md`
- [ ] `FloraOS` v1 ngừng mà không mất việc nào
- [ ] Không chạy song song kéo dài

## P12 — Hardening

- [ ] Bảy mục bảo mật nhóm `S` đạt
- [ ] Ba mục quyền riêng tư nhóm `V` đạt, gồm consent trước go-live (`YC-V1`)
- [ ] Bốn mục quan sát nhóm `O` đạt
- [ ] Ngưỡng hiệu năng nhóm `P` đo được và đạt
