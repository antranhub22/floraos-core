# 01 — Yêu cầu kỹ thuật

Mỗi yêu cầu có mã. Tiêu chí nghiệm thu ở `Checklist_Thuc_Thi.md` dẫn chiếu về các mã này.

## 1. Môi trường

| Thành phần | Chọn | Ghi chú |
|---|---|---|
| Chạy web | Node 22 LTS | |
| Chạy worker | Python 3.11 | |
| Cơ sở dữ liệu | PostgreSQL 16 | Đồng thời hàng đợi, xem D6-1 |
| Kho tệp | Tương thích S3, URL ký sẵn | |
| GPU | Chỉ cho worker, không cho tiến trình web | |

Một Postgres duy nhất cho cả `src/` và `workers/`. Không thêm Redis ở bản này — hàng đợi nằm trên chính bảng `generation_jobs`.

## 2. Đa tenant — nhóm T

| Mã | Yêu cầu |
|---|---|
| `YC-T1` | Mọi bảng thuộc tenant có `organization_id NOT NULL`, có index |
| `YC-T2` | `organization_id` giải từ phiên phía máy chủ; không endpoint nào nhận nó từ client |
| `YC-T3` | Bộ gác lọc theo tổ chức nằm ở tầng repository, không ở route |
| `YC-T4` | Bản ghi của tổ chức khác trả 404, không trả 403 |
| `YC-T5` | Đường dẫn kho tệp theo tổ chức: `org/<organization_id>/<product_id>/<asset_id>.<ext>` |
| `YC-T6` | `organization_id` là cột bắt buộc của `generation_jobs`, truyền suốt tới worker |
| `YC-T7` | Worker lấy `organization_id` chỉ từ dòng job |
| `YC-T8` | Token gọi lại từ bên ngoài mang định danh tổ chức đã ký |
| `YC-T9` | Không khoá ghi toàn cục. Đồng thời hoá bằng giao dịch cơ sở dữ liệu |
| `YC-T10` | Bộ test cách ly chạy trong CI, phủ mọi endpoint và mọi bảng có `organization_id` |

`YC-T9` là phản đề trực tiếp của `he_thong.giu_khoa()` ở FloraOS v1 — khoá ghi 15 phút thuộc về một thư mục chứ không thuộc về tổ chức.

## 3. Quyền — nhóm Q

| Mã | Yêu cầu |
|---|---|
| `YC-Q1` | 76 mã năng lực chuyển sang nguyên vẹn, kèm `maChucNang.test.ts` |
| `YC-Q2` | Ba lớp cắt đúng thứ tự: mặc định → công tắc → trần cứng |
| `YC-Q3` | Bảng trần cứng là hằng trong mã, không nằm trong cơ sở dữ liệu |
| `YC-Q4` | Quyền là bộ ba `(vai, mã, phạm vi)`, phạm vi thuộc `{organization, branch}` |
| `YC-Q5` | Vai là bản ghi, không phải enum |
| `YC-Q6` | Năng lực duyệt tách khỏi năng lực sinh kết quả ở cả bốn cặp ở tài liệu 02 mục 5 |
| `YC-Q7` | Kiểm bằng mã năng lực, không bằng vai giao diện, ở mọi tầng |
| `YC-Q8` | Điều hành có mọi năng lực của Sale và Điều phối |
| `YC-Q9` | Công tắc `cho_phep_tu_duyet` cấp tổ chức; tắt thì bản ghi tự tạo không vào hàng đợi duyệt của chính người tạo |

## 4. Job — nhóm J

| Mã | Yêu cầu |
|---|---|
| `YC-J1` | Ba trục `status` / `stage` / `result` tách rời, không gộp |
| `YC-J2` | `status` giống hệt nhau ở mọi module; `stage` và `result` theo module |
| `YC-J3` | `COMPLETED + result=REJECTED` không phải `FAILED`, và không retry được |
| `YC-J4` | `CANCELLED` hỗ trợ; huỷ được job còn `PENDING` |
| `YC-J5` | Trạng thái job ở Postgres, không ở bộ nhớ tiến trình |
| `YC-J6` | Worker tách khỏi tiến trình web; không chặn HTTP cho thao tác AI dài |
| `YC-J7` | Worker lấy việc bằng `FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY` |
| `YC-J8` | Cấm `subprocess` + parse stdout. Cấm chạy job qua HTTP |
| `YC-J9` | Nhật ký job cộng dồn, đọc lại được từ vị trí bất kỳ qua `Last-Event-ID` |
| `YC-J10` | Job `PROCESSING` quá 15 phút bị đánh dấu `FAILED` bởi tiến trình quét |

## 5. Asset — nhóm A

| Mã | Yêu cầu |
|---|---|
| `YC-A1` | Asset gốc bất biến; không bao giờ ghi đè tệp nguồn |
| `YC-A2` | Dẫn xuất là bản ghi mới, nối bằng `parent_asset_id` và `version` |
| `YC-A3` | `version` là cơ chế lịch sử duy nhất; không module nào dựng bảng phiên bản song song |
| `YC-A4` | Metadata bắt buộc đủ: provider, model, model_version, pipeline_version, parameters, hash vào ra, điểm chất lượng, điểm nhận dạng, chi phí |
| `YC-A5` | `generated_flags` không bao giờ mặc định ngầm |
| `YC-A6` | Master Image chỉ thành asset chính thức của sản phẩm sau khi được duyệt |

## 6. Mức dùng — nhóm U

| Mã | Yêu cầu |
|---|---|
| `YC-U1` | Một bảng `usage` duy nhất cho toàn hệ thống, phân biệt bằng `feature` |
| `YC-U2` | Không repo nào dựng bảng usage hay credit riêng |
| `YC-U3` | Hạn mức kiểm tại điểm tạo job phía core, trước khi job vào bảng |
| `YC-U4` | Worker không ghi `usage` |
| `YC-U5` | Nền tảng giữ khoá nhà cung cấp, tính credit theo tổ chức (D2) |
| `YC-U6` | Hạn mức trải nghiệm cấu hình được: `trial_count`, `trial_limit`, `trial_reset_at`, `trial_status` |
| `YC-U7` | `Idempotency-Key` trên mọi endpoint tạo job; bấm hai lần không trừ credit hai lần |

## 7. Duyệt — nhóm R

| Mã | Yêu cầu |
|---|---|
| `YC-R1` | Đầu ra AI không tự động thành dữ liệu nghiệp vụ chính thức |
| `YC-R2` | `approved_by` và `approved_at` trên mọi bản ghi duyệt được |
| `YC-R3` | Bản người sửa lưu tách khỏi dự đoán gốc của máy |
| `YC-R4` | Mọi hành động duyệt sinh một bản ghi `audit_logs` |
| `YC-R5` | Kết quả `REJECTED` không được vào luồng duyệt |
| `YC-R6` | Kết quả `WARNING` duyệt được, nhưng giao diện phải cảnh báo trước |

## 8. Hiệu năng

| Mã | Yêu cầu | Ngưỡng |
|---|---|---|
| `YC-P1` | Người dùng đồng thời | 100–500 |
| `YC-P2` | Thời gian một job ảnh | 10–30 giây |
| `YC-P3` | Người dùng tiếp tục dùng webapp trong lúc job chạy | bắt buộc |
| `YC-P4` | Chi phí mỗi ảnh | 0,01–0,20 USD |
| `YC-P5` | Tải lần đầu trên 4G, nội dung chính | dưới 3 giây |
| `YC-P6` | Gói JavaScript mỗi tuyến sau nén | dưới 200 KB |

Thứ tự ưu tiên khi đánh đổi: **Accuracy > Quality > Cost > Speed > Simplicity**.

## 9. Nhà cung cấp AI

| Mã | Yêu cầu |
|---|---|
| `YC-N1` | Mọi provider nằm sau cổng; không module nào gọi thẳng API nhà cung cấp |
| `YC-N2` | Cổng Vision ở mức hợp đồng JSON, không ở mức `detect/segment/recognize` |
| `YC-N3` | Hợp đồng JSON chỉ được thêm trường; không xoá, không đổi trường đã có |
| `YC-N4` | Identity Guard dùng cùng provider và cùng model version cho cả hai lần phân tích của một job |
| `YC-N5` | Ma trận chọn công nghệ hoàn thành và được ký duyệt trước khi chọn provider |
| `YC-N6` | Cột soát cách ly tenant trong ma trận là bắt buộc: rò qua cache còn nóng, phiên bền, lịch sử prompt, hay mặc định dùng dữ liệu để huấn luyện |
| `YC-N7` | Đổi provider chỉ bằng số đo trên bộ ảnh vàng, không bằng lập luận |

## 10. Bảo mật

| Mã | Yêu cầu |
|---|---|
| `YC-S1` | Cookie phiên `HttpOnly`, `Secure`, `SameSite=Lax` |
| `YC-S2` | Khoá nhà cung cấp không bao giờ đi qua trình duyệt và không nằm trong bảng nào |
| `YC-S3` | Cấu hình kiểm bằng zod lúc khởi động; thiếu biến thì tiến trình không lên |
| `YC-S4` | URL ký sẵn có hạn dùng, `storage_key` do máy chủ sinh, không nhận từ client |
| `YC-S5` | Giới hạn tần suất trên endpoint tạo job và endpoint đăng nhập |
| `YC-S6` | Mật khẩu băm bằng thuật toán có yếu tố chi phí |
| `YC-S7` | Nhật ký kiểm toán không xoá được từ giao diện |

## 11. Quyền riêng tư

| Mã | Yêu cầu |
|---|---|
| `YC-V1` | Cơ chế consent cấp tổ chức cho việc dùng dữ liệu huấn luyện, sẵn sàng trước go-live |
| `YC-V2` | Xoá dữ liệu khi tổ chức yêu cầu, gồm cả tệp trong kho |
| `YC-V3` | Điều khoản lưu trữ và huấn luyện của mỗi provider thương mại được soát trước khi đưa dữ liệu qua |

## 12. Quan sát hệ thống

| Mã | Yêu cầu |
|---|---|
| `YC-O1` | Nhật ký có cấu trúc, mỗi dòng mang `organization_id` và `job_id` khi có |
| `YC-O2` | Đo được: số job theo trạng thái, thời gian mỗi bước, tỉ lệ `REJECTED`, chi phí theo tổ chức |
| `YC-O3` | Cảnh báo khi hàng đợi `PENDING` vượt ngưỡng, hoặc tỉ lệ `FAILED` tăng đột biến |
| `YC-O4` | Truy vết được một ảnh từ lúc tải lên tới asset cuối cùng qua `parent_asset_id` |

## 13. Ngoài phạm vi bản này

Thanh toán và xuất hoá đơn. Video (M04a giai đoạn 2). Marketing Creative Engine. Bộ chọn chi nhánh trên giao diện. Khoá nhà cung cấp riêng của từng tổ chức. Migrate dần từ v1 — cắt một lần.
