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

## 13. Creative và video — nhóm M

| Mã | Yêu cầu |
|---|---|
| `YC-M1` | Biến thể marketing dựng trên một asset `approval_state = APPROVED`; asset chưa duyệt không có đường ra khỏi core |
| `YC-M2` | Biến thể không gọi lại lớp tăng cường của M04a và không sinh pixel mới trên chính sản phẩm |
| `YC-M3` | Mọi thay đổi chạm vào sản phẩm đi qua `I1` và Identity Guard, kể cả khi phát sinh từ màn soạn biến thể |
| `YC-M4` | Khung đầu và khung cuối của một video là ảnh đã duyệt; mô hình video không nhận lệnh tạo hình sản phẩm |
| `YC-M5` | Creative và video hoàn tất đăng ký vào `assets` của core, mang `parent_asset_id` trỏ về Master Image |
| `YC-M6` | `video_jobs` có `organization_id NOT NULL`, có index, và lọc theo tổ chức ở mọi điểm đọc ghi |
| `YC-M7` | Chi phí thật mỗi video ghi vào `usage` với `feature = video.generate`; hạn mức kiểm tại điểm tạo job |
| `YC-M8` | Watermark và thư viện nền là cấu hình cấp tổ chức, gác bằng `P5` và `I4` |
| `YC-M9` | Chi phí mỗi video nằm trong dải 0,05–5 USD; vượt dải thì job bị chặn tại điểm tạo, không chặn sau khi đã gọi nhà cung cấp |

## 14. Nội dung và đăng bài — nhóm C

| Mã | Yêu cầu |
|---|---|
| `YC-C1` | Một nội dung luôn gắn với một bản ghi Product Master và một asset đã duyệt; không sinh nội dung cho một chủ đề rời |
| `YC-C2` | Nội dung sinh ra là kết quả chờ duyệt; `O1` và `O3` không bao giờ gói chung |
| `YC-C3` | Tự duyệt theo thời hạn chỉ đọc được ở luồng nội dung đăng bài, qua công tắc `O7`, tắt theo mặc định |
| `YC-C4` | Mỗi lượt tự duyệt ghi `audit_logs` với người bật công tắc là người chịu trách nhiệm, không phải "hệ thống" |
| `YC-C5` | Công tắc tắt thì hết thời hạn nội dung quay về hàng chờ; không đường nào tự đăng |
| `YC-C6` | Tài khoản nền tảng mang `organization_id`; credential của một tổ chức không dùng được cho tổ chức khác |
| `YC-C7` | Mọi endpoint thao tác theo định danh bản ghi lọc theo tổ chức; bản ghi tổ chức khác trả không tìm thấy |
| `YC-C8` | Ngữ cảnh tổ chức chỉ đến từ phiên hoặc token đã xác minh; không endpoint nào nhận `organization_id` từ client |
| `YC-C9` | Lịch đăng chạy theo lô song song có giới hạn theo tổ chức; một tổ chức chạy dở không chặn tổ chức khác |

## 15. Khách hàng và dữ liệu cá nhân — nhóm K

| Mã | Yêu cầu |
|---|---|
| `YC-K1` | `customers` và các bảng liên quan mang `organization_id NOT NULL`, có index |
| `YC-K2` | Cơ sở đồng ý ghi ở `customer_consents`, tách khỏi cơ chế consent dữ liệu huấn luyện của `YC-V1` |
| `YC-K3` | Không trường định danh nào — tên, số điện thoại, địa chỉ — đi qua nhà cung cấp AI |
| `YC-K4` | Nội dung nhắc mua sinh từ dịp và sản phẩm; phần định danh ghép ở tầng gửi |
| `YC-K5` | Xoá theo yêu cầu của chính khách hàng cuối là một luồng riêng, không mở được bằng mã năng lực nào của tổ chức |
| `YC-K6` | Xuất danh sách khách hàng gác bằng `Q5` trần cứng, và mỗi lượt xuất ghi `audit_logs` |
| `YC-K7` | Cơ chế đồng ý và luồng xoá sẵn sàng trước go-live của M09 và M10 |

## 16. Đơn hàng và vận hành — nhóm W

| Mã | Yêu cầu |
|---|---|
| `YC-W1` | Trạng thái đơn tách khỏi trạng thái sản xuất và trạng thái giao hàng; không gộp thành một enum |
| `YC-W2` | Mọi lượt đổi trạng thái sinh một bản ghi `order_events` với người thực hiện và thời điểm |
| `YC-W3` | Phân công thợ cắm gác bằng `R4`; thợ cắm đọc và cập nhật được đúng đơn của mình |
| `YC-W4` | SLA giao hàng đo được từ `order_events`, không nhập tay |
| `YC-W5` | Giá trên đơn đọc từ engine giá của M02; không đường nào ghi một giá không truy được về quy tắc giá |
| `YC-W6` | Huỷ đơn gác bằng `R6` trần cứng và ghi lý do vào nhật ký kiểm toán |

## 17. Phân tích và học — nhóm L

| Mã | Yêu cầu |
|---|---|
| `YC-L1` | Số liệu gốc của từng nền tảng thuộc engine ngoài; `campaign_rollups` của core mang cột nguồn và dựng lại được |
| `YC-L2` | Phép nối ROI đọc `orders` của core và số liệu nội dung đã ghi về core; không suy doanh thu từ số liệu nền tảng |
| `YC-L3` | Mỗi thay đổi của `learning_profiles` truy được về tập số liệu đã sinh ra nó |
| `YC-L4` | Vòng học không tự đổi tham số trước ngưỡng dữ liệu tối thiểu đã khai ở hồ sơ |
| `YC-L5` | Dữ liệu kế thừa của thương hiệu trước khi gán tổ chức được phân biệt trong mọi báo cáo |
| `YC-L6` | Đè tham số hồ sơ phong cách gác bằng `S4` trần cứng và ghi `audit_logs` |

## 18. Trợ lý hội thoại — nhóm H

| Mã | Yêu cầu |
|---|---|
| `YC-H1` | Trợ lý trả lời từ Product Master, giá đã duyệt và vùng giao hàng của chính tổ chức |
| `YC-H2` | Câu trả lời về giá đọc từ engine giá; mô hình không tự tính giá |
| `YC-H3` | Đường chuyển cho người thật luôn có, gác bằng `T4` |
| `YC-H4` | Trả lời tự động bật tắt được bằng `T3` trần cứng, và mỗi lượt trả lời tự động đánh dấu rõ trong hội thoại |

## 19. Cổng AI và định tuyến — nhóm G

| Mã | Yêu cầu |
|---|---|
| `YC-G1` | Mã nghiệp vụ gọi một năng lực đã đăng ký trong `ai_capabilities`, không gọi tên một nhà cung cấp |
| `YC-G2` | SDK của nhà cung cấp chỉ xuất hiện trong `adapters/`; một lượt quét trong CI chặn mọi import khác |
| `YC-G3` | Mọi lời gọi AI đi qua cổng AI — không route, use-case, agent, script hay job nào gọi thẳng nhà cung cấp |
| `YC-G4` | Đổi mô hình cho một năng lực làm được bằng một hàng trong `ai_models` cộng một lần đo, không sửa module nào |
| `YC-G5` | Mô hình không chạy được trong production khi thiếu một trong bốn ô: giấy phép, được dùng thương mại, lãnh thổ, phạm vi sử dụng cho phép |
| `YC-G6` | Bộ định tuyến chỉ chọn trong số mô hình đã đo trên bộ ảnh vàng; mô hình chưa đo chỉ chạy khi tổ chức tự chọn qua `H4` |
| `YC-G7` | Chính sách của tổ chức là trần của bộ định tuyến, không phải gợi ý |
| `YC-G8` | Mô hình chốt vào `payload` của job lúc tạo; worker không tra lại lúc nhận việc |
| `YC-G9` | Mỗi lời gọi ghi một hàng `ai_requests`: mô hình, chi phí, token hoặc giây GPU, độ trễ, điểm chất lượng |
| `YC-G10` | Thác nghiệm chỉ leo lên; không đường nào hạ chất lượng để tiết kiệm |
| `YC-G11` | Chuỗi dự phòng không vượt sàn quyền riêng tư; hết đường trong phạm vi cho phép thì job `FAILED` và credit hoàn theo D3-b |
| `YC-G12` | Lời gọi mức `sensitive` không có đường nào ra nhà cung cấp bên ngoài, kể cả ở bước dự phòng |
| `YC-G13` | Thác nghiệm gọi mô hình nhiều lần vẫn chỉ trừ credit của một lượt nghiệp vụ |
| `YC-G14` | Engine ngoài đọc chính sách AI qua Integration API và cache; không đọc được thì dùng cache, không tự nới chính sách |
| `YC-G15` | Lược đồ riêng của nhà cung cấp dừng ở adapter — không vào `domain/`, không vào bảng nào, không vào đáp ứng API |

## 20. Chấm điểm và tri thức — nhóm E

| Mã | Yêu cầu |
|---|---|
| `YC-E1` | Mỗi năng lực sinh có một điểm chất lượng, ghi vào `ai_evaluations` và vào metadata asset khi có asset |
| `YC-E2` | Điểm dưới ngưỡng chấp nhận đặt `needs_review = true` và đưa bản ghi vào hàng chờ duyệt, không âm thầm chấp nhận |
| `YC-E3` | Điểm chất lượng không thay Review → Approve, và không thay Identity Guard |
| `YC-E4` | Ngưỡng khai trong `ai_capabilities`; ngưỡng chưa đo được ghi rõ là giá trị tạm kèm một dòng nợ kỹ thuật |
| `YC-E5` | Mô hình không bao giờ quyết định giá trị đi vào cơ sở dữ liệu — nhãn của mô hình tra qua `flower_taxonomy` để ra mã và tên chuẩn |
| `YC-E6` | Không tra được danh mục thì trường mã để trống và nhãn gốc của mô hình được giữ lại |
| `YC-E7` | Truy hồi tìm ra chỗ nên đọc; câu trả lời đọc từ bản ghi thật theo thứ bậc nguồn sự thật ở đặc tả 10 mục 13.3 |
| `YC-E8` | Câu hỏi về giá, tồn trạng thái và trạng thái đơn trả lời từ dữ liệu giao dịch, không từ truy hồi |
| `YC-E9` | `knowledge_chunks` mang `organization_id`; tri thức của một tổ chức không đi vào câu trả lời của tổ chức khác |
| `YC-E10` | Đầu ra của một năng lực có nhiều kênh đo phải đủ mọi kênh đã khai; thiếu kênh là điểm không hợp lệ, không phải điểm 0 |

## 21. Ngoài phạm vi bản này

Thanh toán và xuất hoá đơn. Bộ chọn chi nhánh trên giao diện. Khoá nhà cung cấp riêng của từng tổ chức. Migrate dần từ v1 — cắt một lần.
