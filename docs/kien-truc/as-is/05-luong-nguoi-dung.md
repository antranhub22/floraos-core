# 5. User Flows — As-Is (dựng lại từ mã)

Mỗi luồng ghi: điểm vào → bước → điểm rẽ → thay đổi trạng thái → API → kết quả → nhánh lỗi. Hành vi chạy thật: **NOT VERIFIED** (xác minh tĩnh).

## UF-01 Đăng ký dùng thử

`/dang-nhap` (chế độ đăng ký) → `POST /auth/signup` → `router.push("/")` → `(app)/layout.tsx` giải phiên → `/` gọi `resolveRoleUx("dieu_hanh", "EXPERIENCE")` → khuôn `store_admin` → `StoreJourneyHome`.

> Mâu thuẫn trong cùng tệp: chú thích đầu `src/app/(app)/page.tsx` mô tả "Workspace TRẢI NGHIỆM → lưới thẻ chức năng", nhưng `ExperienceGrid` chỉ được import (dòng 21) và không được render ở đâu; hàm `DashboardPage` không đọc `workspace.kind`.

- Trạng thái tạo ra: `organizations.type = EXPERIENCE`, `credit_balance = 20`; `workspaces.trial_limit = 20`, `trial_status = ACTIVE`; membership `dieu_hanh`/`ACTIVE`.
- Nhánh lỗi: email trùng → 409; mật khẩu < 10 ký tự → 400; chưa seed vai hệ thống → 500.
- Chuyển sang tổ chức thật: API `POST /organizations/current/upgrade-request` chỉ ghi `audit_logs`, không có màn gọi; component `experience-grid.tsx` (không được render) ghi "Bản hiện tại chưa hỗ trợ tự chuyển đổi". Không có API đổi `organizations.type`; quy trình vận hành thực tế: NOT VERIFIED.
- Bằng chứng: `src/modules/organization/use-cases/sign-up.ts`, `src/modules/organization/domain/experience.ts`.

## UF-02 Đăng nhập → trang chủ theo vai

`/dang-nhap` → `POST /auth/login` (đặt `floraos_session` 30 ngày + `floraos_sso` 15 phút, thu hồi phiên cũ) → `/`.

Điểm rẽ ở `src/app/(app)/page.tsx`:
`switch (resolveRoleUx(roleKey, organizationType)?.homepage)`:
`STORE_JOURNEY_HOME` (`dieu_hanh` ở tổ chức thường) → `StoreJourneyHome`; `NETWORK_JOURNEY_HOME` (`dieu_hanh` ở tổ chức `FLOWER_NETWORK/CHAIN`) → `NetworkJourneyHome`; `SALES_WORKSPACE` (`sale`); `PRODUCT_WORKSPACE` (`product_manager`); `CREATIVE_WORKSPACE` (`marketing`); `CRM_WORKSPACE` (`crm`); `CUSTOMER_SERVICE_WORKSPACE` (`customer_service`); `CONTROL_TOWER` (`dieu_phoi`) → `redirect("/dieu-phoi")`; `CONTROL_CENTER` → `redirect("/van-hanh")`; còn lại (vai riêng, `experience_user`) → `StoreJourneyHome`.
- Nhánh: thiết bị khác đăng nhập sau → phiên cũ bị thu hồi → layout chuyển `/dang-nhap?ly-do=thiet-bi-khac`; `SessionTakeoverWatcher` hỏi `GET /auth/session-status` định kỳ.
- Không có luồng quên mật khẩu (trang ghi "liên hệ quản trị"); đặt lại bằng script `npm run mat-khau`.

## UF-03 Tạo sản phẩm từ ảnh (Quét ảnh hoa → Product Master → dữ liệu bán hàng)

Điểm vào `/tai-anh` (`H1`).

1. `POST /assets/upload-url` → `PUT` tệp lên URL ký → `POST /assets` (asset `ORIGINAL`).
2. `POST /vision/analyses` (`Idempotency-Key`) → `enqueueJob("vision.analyze")`: kiểm trần tần suất → trừ 1 credit (hoặc 1 lượt trial) → ghi `usage` → tạo `generation_jobs(PENDING)` → `pg_notify`.
3. Worker `vision` lấy job (`FOR UPDATE SKIP LOCKED`) → `PROCESSING` → ghi `product_analyses(approval_state=PENDING)` → `COMPLETED` (hoặc `FAILED`).
4. Giao diện theo dõi `GET /jobs/:id` → hiển thị kết quả; người dùng có `H2` sửa (`PATCH /vision/analyses/:id`).
5. Điểm rẽ duyệt (`H3`, trần cứng ĐH): `POST .../approve` → ghi Product Master (tạo `products` nếu chưa có) + audit; hoặc `POST .../reject`.
6. `POST /product-copies/generate` (`H5`) → job `product.copy.generate` + cổng AI `AIC-04` → `product_copies(PENDING)` → duyệt `H6` → ghi Product Master + audit.
- Nhánh: hết credit/trial → 422 `QUOTA_EXCEEDED`; quá tần suất → 429; asset tổ chức khác → 404; job treo > 15 phút → script quét đặt `FAILED`; `POST /jobs/:id/retry` (`G7`).

## UF-04 Tối ưu ảnh → MASTER → biến thể marketing

Creative Studio (`/creative-studio`, khoá trên production) hoặc `/san-pham/[id]/tinh-nang`.

`POST /media/optimizations` (job `media.optimize`) → worker `media_ai` → `GET /media/optimizations/:id` (hoàn credit chênh/hoàn toàn khi đọc nếu lùi cục bộ hoặc hỏng) → `POST .../approve` (`I2`) → asset `MASTER/APPROVED`. Lối tắt: `POST /media/promote-to-master`. Tiếp: `POST /media/variants` (job `media.variant[.cloud]`) → duyệt từng tấm `POST /media/variants/:id/approve` (`I5`).

## UF-05 Video

`/video` (khoá trên production): `POST /video/jobs` (`DRAFT`) → `PATCH .../storyboard` → `POST .../approve-script` (`P3`, → `SCRIPT_APPROVED`) → `POST .../render` (job `video.render`, 5 credit, → `RENDERING`) → worker video ghi `video_jobs.stage = RENDER_COMPLETED` + `final_video_url` (`workers/media_ai/video/video_worker.py:135-139`) → `POST .../approve-video` (`P4`, → `APPROVED`).
- Nhánh: render khi kịch bản chưa duyệt → chặn; sửa storyboard khi `RENDERING` → chặn.

## UF-06 Nội dung đăng bài

`/noi-dung` (khoá trên production): chọn sản phẩm/phân tích → `POST /content-engine/generations` (job `content.generate`, 2 credit; chuỗi 4–7 lượt gọi AI) → xem bài theo kênh → `POST /content-engine/generations/:id/approve` (`J5`, `DRAFT → APPROVED`, audit).
- Bài đã duyệt **không** được chuyển sang Lịch đăng (chú thích `src/app/(app)/noi-dung/page.tsx:288`).
- Lịch đăng `/lich-dang` đọc/đăng bài qua proxy SocialFlow; khi proxy lỗi, nhánh `catch` đánh dấu bài "published" với URL dựng sẵn và báo thành công (`src/app/(app)/lich-dang/page.tsx:265-276`).

## UF-07 Đơn hàng thường (M10)

`/don-hang` → modal tạo đơn → `POST /orders` (`R2`, `DRAFT/WAITING/PENDING`) → modal chi tiết → `PATCH /orders/:id` (`R3`) chuyển từng trục → in phiếu `GET /orders/:id/print` (`R7`) → huỷ `POST /orders/:id/cancel` (`R6`, lý do bắt buộc).
- Điểm rẽ: đơn `source = BROCHURE` → 409 "cập nhật ở trang Thẻ chào".
- Đơn cũng có thể sinh từ hội thoại (`POST /chat/conversations/:id/create-order`, `T3`).

## UF-08 Điều phối đơn (Control Tower)

`/dieu-phoi` (mục điều hướng gác `C23`): tạo đơn điều phối (`INTAKE`) → `PATCH .../stage` qua `VALIDATING/PLANNING` → `POST .../assign-partner` (`ASSIGNING`) → `IN_PRODUCTION` → `POST .../production` (tiến độ; `MARK_READY` + ảnh → `QUALITY_CHECK`) → `POST .../qc` (PASSED → `DISPATCHING`; REWORK → `IN_PRODUCTION`) → `POST .../delivery` (POD → `DELIVERED`) → `POST .../close` (`COMPLETED`).
- Nhánh: `POST .../exceptions` → `EXCEPTION` (lưu `resume_stage`); xử lý xong → chỉ quay về `resume_stage`. `POST .../cancel` (`R6`) trước khi giao.
- Thu tiền song song: `POST .../payments` (`R9`; hoàn `R10`).
- Mỗi lần đổi bước đồng bộ 3 trục `orders` và ghi `order_events`.

## UF-09 Thẻ chào — từ bộ sưu tập tới giao hoa

1. Nhân viên (`/the-chao`, tab Bộ sưu tập, `R2`) tạo bộ sưu tập.
2. Sale (tab Bán hàng) tạo link gửi khách → `greeting_sessions(CREATED)`; sao chép link (đánh dấu `copied`), hoặc tạo link chia sẻ `/s/<mã>`.
3. Khách mở `/b/<sendCode>`: nhận chủ phiên (cookie) → `OPENED/BROWSING` → chọn mẫu `SELECTED` → báo giá → đặt hàng → `ORDER_SUBMITTED`; tạo `orders(source=BROCHURE, status=DRAFT)`, tìm/tạo `customers`, gửi tin `ORDER_RECEIVED`.
4. Điểm rẽ giá: mẫu chưa có giá → đơn tổng 0 → Điều hành báo giá (`quote`) → khách thấy QR.
5. Thanh toán: khách chuyển khoản theo VietQR → (a) SePay gọi webhook → khớp mã đơn → ghi thu tự động; hoặc (b) khách bấm "Tôi đã chuyển" (`PAYMENT_REPORTED`) → Điều hành xác nhận (`R9`). Không khớp → giao dịch `UNMATCHED` chờ xử lý tay.
6. Bộ quét nền: hết hạn giữ đơn → nhắc khách; quá hạn + 60 phút và tiệm bật tự huỷ → huỷ đơn.
7. Xưởng (tab Điều phối): phân công florist (`ARRANGING`) → ảnh thành phẩm (`READY`) → giao ship (`DISPATCHED`) → ảnh người nhận (`DELIVERED`); mỗi mốc gửi tin khách; cổng tiền theo chính sách cọc.
8. Khách tra cứu `/b/...` hoặc mã đơn + 4 số cuối SĐT.
- Nhánh: link hết hạn/thu hồi → màn "không khả dụng" kèm liên hệ tiệm; người thứ hai mở link `/b/...` không phải chủ phiên → đưa về luồng nhận phiên riêng; huỷ (`R6`) trả lại voucher; hoàn tiền (`R10`).

## UF-10 Catalog công khai & lead

`/catalog` (`J1`, khoá trên production) → `POST /catalog-links` → chia sẻ `/c/<slug>` (+ QR) → khách xem storefront → gửi form `POST /public/catalog/<slug>/lead` (SĐT + lời nhắn) → nối vào mảng `leads` bên trong cột JSON `catalog_links.filters` (`src/modules/catalog-links/infra/catalog-link-repository.ts:153-171`). Không có màn hình nào trong core đọc danh sách lead này (không thấy mã đọc `leads`).

## UF-11 Khách hàng & nhắc dịp

`/khach-hang` (`Q1`) → tạo khách (`Q2`) → thêm dịp (`Q6`) → danh sách nhắc 14 ngày tới (`GET /crm/reminders/upcoming`, `Q7`) → cập nhật đồng ý (`Q9`). Không có bước gửi tin nhắc tự động từ danh sách này (không thấy mã gửi).

## UF-12 Hội thoại tư vấn

`/hoi-thoai` hoặc Copilot nổi trên mọi trang `(app)` → `POST /chat/conversations` → `POST .../messages` → AI trả lời (Dify → OpenAI → Ollama → luật cục bộ) kèm thẻ mẫu hoa → `POST .../create-order` (`T3`) tạo đơn nháp M10. Kênh ngoài: Facebook/Zalo gọi webhook → trả lời qua API nền tảng, trừ credit mỗi tin AI.

## UF-13 Nghiên cứu thị trường

`/market-intelligence` (khoá trên production): `POST /market-intelligence/research-runs` (`V1`) → `NOTIFY` → worker TS thu tín hiệu → `GET /market-intelligence/opportunities` (`V2`). Lịch tự động: pg_cron trong ảnh Postgres Docker local; môi trường Render không khai pg_cron (NOT VERIFIED).

## UF-14 Vận hành nền tảng

Người được gán bằng script `gan-van-hanh-nen-tang` mở `/van-hanh` → tổ chức (`N1`), mức dùng (`N4`), sức khoẻ (`N5`), nhật ký (`N6`), trường dữ liệu (`N12`). Người không phải operator → `(platform)/layout.tsx` chuyển về `/`.

## UF-15 Quản trị thành viên & quyền

`/cai-dat/thanh-vien` → mời (`F3`, tạo `INVITED`) → đổi vai (`F5`) → gỡ (`F4`). Người được mời không có đường đăng nhập qua giao diện (mật khẩu rỗng, không có luồng nhận lời mời); thêm thành viên dùng được bằng script `them-thanh-vien`. Chỉnh mã năng lực theo vai: API có (`PATCH /roles/:id/capabilities`), giao diện không gọi.
