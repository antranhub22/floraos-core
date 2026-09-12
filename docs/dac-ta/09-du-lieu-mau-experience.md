# 09 — Dữ liệu mẫu cho workspace trải nghiệm

Người dùng mới vào là dùng được ngay. Họ chỉ cung cấp phần động: ảnh và tên sản phẩm. Mọi thứ còn lại đã có sẵn.

Dữ liệu mẫu nạp bằng một lệnh seed khi tạo workspace `kind = EXPERIENCE`. Nó là dữ liệu thật trong cơ sở dữ liệu, mang `organization_id` của chính workspace đó — **không phải ngoại lệ của cách ly tenant.**

## 1. Tổ chức mẫu

Một cửa hàng hư cấu, không dùng tên hay thông tin của khách hàng thật.

| Trường | Giá trị |
|---|---|
| Tên | Tiệm hoa Mộc Lan |
| Loại | `SINGLE` |
| Chi nhánh | một, mã `CN01` |
| Credit ban đầu | 20 |

## 2. Hồ sơ kinh doanh mẫu

Tên hiển thị, điện thoại, email, địa chỉ, giờ mở cửa, website. Toàn bộ là giá trị hư cấu, nhìn ra ngay là mẫu — số điện thoại dạng `0900 000 000`, địa chỉ không có thật.

## 3. Hồ sơ thương hiệu mẫu

Bốn màu, hai phông, một giọng điệu, vài hashtag. Chọn bộ trung tính để người dùng thấy được kết quả mà không thấy nó thuộc về một thương hiệu nào khác.

## 4. Sản phẩm mẫu

Sáu sản phẩm, phủ đủ sáu dạng của `identity.category` trong hợp đồng Vision:

| Dạng | Sản phẩm mẫu |
|---|---|
| Bó hoa | Bó hồng đỏ 20 cành |
| Giỏ hoa | Giỏ hoa chúc mừng |
| Hộp hoa | Hộp hoa hồng phấn |
| Bình hoa | Bình hoa để bàn |
| Kệ hoa | Kệ hoa khai trương |
| Lẵng hoa | Lẵng hoa chia buồn |

Mỗi sản phẩm có: một ảnh mẫu, một kết quả phân tích đã duyệt, một bộ dữ liệu bán hàng đã duyệt (tên, mô tả, thẻ, dịp), một bảng cấu phần, một mức giá, và một Master Image đã duyệt. Nhờ vậy người dùng mở màn hình nào cũng thấy có nội dung, không gặp màn hình rỗng — và các luồng của Creative Engine có thứ để soạn lên ngay từ lượt đầu, đúng luật "chỉ soạn trên ảnh đã duyệt".

Ảnh mẫu là ảnh do chính đội tự chụp hoặc mua bản quyền. Không lấy ảnh của khách hàng thật, không lấy ảnh trên mạng.

## 4b. Nội dung mẫu của các kênh

Một catalog mẫu kèm liên kết và mã QR, một bộ biến thể marketing mẫu cho một sản phẩm, và hai bài viết mẫu ở trạng thái **đã duyệt nhưng chưa đăng**. Ba thứ này là nội dung nền để người dùng thấy màn catalog, màn soạn ảnh và lịch đăng có hình dạng thật.

Không nạp sẵn video mẫu do AI sinh, không nạp sẵn số liệu hiệu quả, không nạp sẵn hồ sơ phong cách. Một lượt video là lượt tốn nhiều credit nhất, và số liệu hiệu quả giả sẽ dạy người dùng tin vào một con số chưa từng có ai xem. Hồ sơ phong cách mẫu còn tệ hơn: nó khiến hệ thống tỏ ra đã học được điều gì đó về một cửa hàng chưa tồn tại.

Không nạp sẵn khách hàng mẫu và đơn hàng mẫu. Hồ sơ khách hàng hư cấu có tên và số điện thoại là đúng hình dạng dữ liệu cá nhân, và nó nằm lẫn trong danh sách thật sau khi chuyển đổi.

## 5. Quy tắc giá mẫu

Đủ để màn hình giá hiện được một con số: một mức sàn, một mức trần, một tỷ lệ thu, một quy tắc làm tròn. Giá trị đặt tròn và dễ nhìn ra là mẫu.

## 6. Hạn mức dùng thử

| Trường | Giá trị |
|---|---|
| `trial_limit` | 20 lượt |
| `trial_count` | 0 |
| `trial_reset_at` | không đặt lại tự động |
| `trial_status` | `ACTIVE` |

Mức trừ theo chức năng, giá trị chốt ở D14 cho ba chức năng mới: một lượt phân tích ảnh trừ 1, một lượt sinh dữ liệu bán hàng trừ 1, một lượt tối ưu ảnh trừ 2. Biến thể marketing, video và nội dung trừ theo bảng giá của D14 — hạn mức dùng thử không mở ba chức năng đó trước khi bảng giá được chốt, vì một lượt video có thể tiêu hết hạn mức trong một lần bấm.

Màn xác nhận của mỗi chức năng nói rõ mức trừ và số dư trước khi chạy. Hết hạn mức thì thẻ chức năng chuyển sang trạng thái khoá, kèm đường dẫn chuyển thành tổ chức thật.

## 6b. Chính sách AI của workspace trải nghiệm

Workspace trải nghiệm chạy bằng chính sách AI mặc định của nền tảng và **không đổi được** — vai Experience User không có `U2` lẫn `H4`. Màn chính sách AI vẫn mở được để xem, vì câu hỏi "ảnh của tôi có rời hạ tầng không" là câu hỏi người dùng có quyền biết trước khi tải ảnh đầu tiên lên, không phải sau khi chuyển thành tổ chức thật.

## 7. Chuyển thành tổ chức thật

Người dùng bấm chuyển đổi thì: `organizations.type` đổi từ `EXPERIENCE` sang `SINGLE`, `workspaces.kind` đổi sang `PRODUCTION`, hạn mức dùng thử gỡ bỏ.

**Dữ liệu mẫu bị xoá, không giữ lại.** Sáu sản phẩm hư cấu nằm lẫn trong Product Master thật là thứ sẽ gây nhầm khi báo giá cho khách. Màn hình chuyển đổi nói rõ điều này trước khi bấm.

Ảnh và sản phẩm do chính người dùng tạo trong lúc dùng thử thì **giữ lại**.

## 8. Điều không được làm

- Không tự động chạy chức năng tính phí nào. Mỗi thẻ phải được bấm riêng.
- Không bỏ `organization_id` ở bất kỳ bản ghi mẫu nào.
- Không dùng chung một tổ chức mẫu cho nhiều người dùng. Mỗi người một workspace, một bộ dữ liệu riêng.
- Không nạp sẵn kết quả của chức năng mà người dùng chưa chạy — trừ sáu sản phẩm mẫu ở mục 4, vốn là nội dung nền chứ không phải kết quả giả.
