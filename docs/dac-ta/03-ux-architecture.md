# 03 — Kiến trúc trải nghiệm

## 1. Bốn quyết định nền

| Quyết định | Nội dung | Hệ quả |
|---|---|---|
| Thiết bị | **Điện thoại trước, máy tính sau** | Thiết kế cho màn hẹp trước; màn rộng là mở rộng, không phải ngược lại |
| Điểm vào | **Dashboard theo vai** | Experience vào lưới thẻ chức năng; cửa hàng và chuỗi vào dashboard Điều hành |
| Tiến trình job | **Checklist theo bước là chính**, nhật ký mở ra khi cần | Người dùng thấy đang tới đâu mà không phải đọc log |
| Duyệt | **Cả tại chỗ lẫn ở hàng đợi** | Duyệt ngay sau khi xem kết quả, hoặc gom lại duyệt hàng loạt |

Phạm vi chi nhánh không có bộ chọn ở bản đầu. RBAC vẫn đỡ sẵn phạm vi chi nhánh, nên thêm bộ chọn về sau không phải sửa quyền.

## 2. Điều hành thấy mọi thứ

Điều hành có đầy đủ năng lực của Sale và Điều phối. Giao diện phải phản ánh điều đó mà không biến màn hình thành mớ hỗn độn: Điều hành thấy **cùng những màn hình** mà Sale và Điều phối thấy, cộng thêm bốn khối quản trị trên dashboard.

Không dựng hai bộ màn hình song song cho hai vai. Một bộ màn hình, khác nhau ở chỗ nút nào hiện — quyết định bởi danh sách năng lực trả về từ `GET /auth/me`.

## 3. Bản đồ màn hình

```
Đăng nhập
   │
   ├── Workspace TRẢI NGHIỆM ──► Lưới thẻ chức năng
   │                                 └── mỗi thẻ mở thẳng vào luồng của module
   │
   └── Workspace THẬT ──────────► Dashboard Điều hành
                                     ├── Hàng chờ duyệt
                                     ├── Job đang chạy · job lỗi
                                     ├── Sản phẩm mới và thay đổi gần đây
                                     └── Mức dùng và hạn mức

Điều hướng chính (thanh dưới trên điện thoại, thanh bên trên máy tính)
   Trang chủ · Sản phẩm · Tải ảnh · Duyệt · Thêm
```

`Tải ảnh` đặt ở giữa thanh điều hướng. Đó là việc lặp lại nhiều nhất trong ngày và là việc Sale làm bằng điện thoại ngay tại cửa hàng.

`Duyệt` chỉ hiện với người có `H3` hoặc `I2`. Với người khác, vị trí đó là `Job của tôi`.

## 4. Dashboard Điều hành

Bốn khối, xếp dọc trên điện thoại, hai cột trên máy tính. Thứ tự cố định — quan trọng nhất trên cùng.

| Khối | Nội dung | Hành động tại chỗ |
|---|---|---|
| **Hàng chờ duyệt** | Số mục đang chờ, ba mục gần nhất kèm ảnh thu nhỏ | Duyệt · Xem tất cả |
| **Job đang chạy và job lỗi** | Job `PROCESSING` kèm bước hiện tại; job `FAILED` kèm lý do | Chạy lại · Huỷ |
| **Sản phẩm mới và thay đổi gần đây** | Sản phẩm Sale vừa thêm hoặc vừa sửa trong 7 ngày | Mở sản phẩm |
| **Mức dùng và hạn mức** | Credit đã dùng, credit còn lại, số lượt theo chức năng | Xem chi tiết |

Khối rỗng vẫn hiện, kèm một câu nói rõ vì sao rỗng và một nút dẫn tới việc tạo ra dữ liệu cho nó. Ẩn khối rỗng làm dashboard nhảy chỗ mỗi ngày một khác.

Khối **Hàng chờ duyệt** không hiện các mục do chính người đang xem tạo ra, nếu công tắc `cho_phep_tu_duyet` của tổ chức đang tắt.

## 5. Màn hình Trải nghiệm

Lưới thẻ chức năng. Mỗi module một thẻ: tên, một câu mô tả kết quả nhận được, ảnh minh hoạ, và số lượt còn lại trong hạn mức dùng thử.

Người dùng bấm thẻ nào cũng được, không bắt theo thứ tự. Sau khi hoàn thành một chức năng, màn hình kết quả gợi ý chức năng kế tiếp hợp lý — nhưng đó là gợi ý, không phải bước bắt buộc.

**Không tự động chạy hết mọi chức năng tính phí.** Mỗi thẻ phải được bấm riêng. Chạy sẵn cả loạt để "cho thấy sức mạnh" là tiêu hết hạn mức của người dùng trước khi họ hiểu mình vừa tiêu vào việc gì.

Workspace trải nghiệm đã nạp sẵn hồ sơ kinh doanh mẫu, hồ sơ thương hiệu mẫu, sản phẩm mẫu, quy tắc giá mẫu. Người dùng chỉ cung cấp phần động: ảnh và tên sản phẩm. Không màn hình nào bắt khai báo hồ sơ doanh nghiệp đầy đủ trước khi dùng thử.

Hết hạn mức thì thẻ chuyển sang trạng thái khoá, kèm một đường dẫn chuyển workspace trải nghiệm thành tổ chức thật.

## 6. Luồng phân tích ảnh

```
Tải ảnh  →  Xác nhận ảnh  →  Đang chạy (checklist)  →  Kết quả  →  Sửa  →  Duyệt
```

**Tải ảnh.** Trên điện thoại, nút mở thẳng camera hoặc thư viện. Nhiều ảnh cùng lúc được, mỗi ảnh một job. Ảnh hiện ngay dưới dạng thu nhỏ trong lúc đang tải lên.

**Xác nhận ảnh.** Trước khi tốn credit, màn hình nói rõ: bao nhiêu ảnh, tốn bao nhiêu credit, còn lại bao nhiêu. Bỏ được từng ảnh khỏi lượt chạy. Đây là chỗ thi hành năng lực `B4` — xem ước phí lượt chạy.

**Đang chạy.** Checklist theo bước, dẫn bởi sự kiện `stage`:

```
✓ Phân tích ảnh
✓ Nhận diện cấu phần
● Đối chiếu từ điển
○ Chốt số lượng
```

Một dòng chữ nhỏ dưới checklist là dòng nhật ký mới nhất. Bấm vào mở toàn bộ nhật ký. Người dùng rời màn hình được — job chạy tiếp, và có thông báo khi xong.

**Kết quả.** Ảnh bên trái, dữ liệu bên phải trên máy tính; xếp dọc trên điện thoại. Dữ liệu chia theo đúng hợp đồng: nhận dạng · hoa · lá · phụ kiện · bao bì. Mỗi cấu phần hiện tên, số lượng, màu, và độ tin cậy.

Cấu phần có độ tin cậy thấp được đánh dấu bằng viền, không bằng màu đỏ — màu đỏ ở đây báo sai, vì máy không sai, máy chỉ không chắc.

**Sửa.** Sửa tại chỗ trên chính màn hình kết quả. Bản sửa lưu tách khỏi dự đoán gốc; giao diện luôn xem lại được máy đoán gì ban đầu.

**Duyệt.** Một nút, chỉ hiện với người có `H3`. Duyệt xong, dữ liệu vào Product Master và màn hình gợi ý bước kế.

## 7. Luồng tối ưu ảnh

```
Tải ảnh  →  Chọn kiểu  →  Đang chạy  →  Trước / Sau  →  Tải về  →  Duyệt
```

**Chọn kiểu.** Ba mức: Tự nhiên · Cân bằng · Cao cấp. Kèm ba chế độ nền: Giữ nguyên · Làm sạch · Thay nền. Không dựng trình biên tập thủ công ở bản này.

**Trước / Sau.** Thanh trượt so sánh trên cùng một khung ảnh. Dưới đó là các tỉ lệ đã sinh: 1:1, 4:5, 9:16, 16:9.

**Ba trạng thái phán quyết hiện khác nhau:**

| Phán quyết | Giao diện |
|---|---|
| `SAFE` · `GOOD` | Kết quả bình thường, không cảnh báo |
| `WARNING` | Dải cảnh báo trên ảnh, nêu rõ chỉ số nào thấp. Vẫn duyệt được, nhưng hộp thoại xác nhận nhắc lại cảnh báo |
| `REJECTED` | **Không hiện ảnh đã tăng cường.** Hiện ảnh gốc, nói rõ hệ thống đã từ chối vì có dấu hiệu làm thay đổi sản phẩm, và gợi ý chụp lại |

Ảnh dùng generative fill mang nhãn hiện rõ trên chính ảnh, không giấu trong metadata.

**Tải về không phải là duyệt.** Hai nút riêng, đặt cách nhau, chữ khác nhau. Người dùng tải ảnh về dùng tạm được mà không biến nó thành ảnh chính thức của sản phẩm.

## 8. Hàng đợi duyệt

Danh sách gộp mọi thứ đang chờ từ mọi module, lọc theo loại và theo người tạo. Mỗi dòng: ảnh thu nhỏ, tên sản phẩm, loại, người tạo, thời điểm, và phán quyết máy nếu có.

Chọn nhiều dòng để duyệt hàng loạt, tối đa 50 mục một lần. Mục có `WARNING` không nằm trong lựa chọn hàng loạt — phải mở ra xem rồi mới duyệt được từng cái.

## 9. Trạng thái phải thiết kế, không được bỏ quên

| Trạng thái | Yêu cầu |
|---|---|
| Rỗng | Nói vì sao rỗng và nút dẫn tới việc tạo dữ liệu đầu tiên |
| Đang tải | Khung xám giữ đúng chỗ nội dung sẽ hiện, không con quay giữa màn hình |
| Lỗi mạng | Nêu việc đang làm dở và nút thử lại. Không mất dữ liệu người dùng vừa nhập |
| Hết hạn mức | Nói rõ đã dùng bao nhiêu, hết khi nào được đặt lại, và đường nâng cấp |
| Không đủ quyền | Ẩn nút thay vì hiện rồi báo lỗi khi bấm. Trường hợp phải hiện thì nói rõ ai duyệt được việc này |
| Mất kết nối giữa job | Job vẫn chạy. Màn hình nối lại nhật ký từ vị trí cũ khi có mạng lại |

## 10. Ngôn ngữ và cách viết

Giao diện tiếng Việt. Thuật ngữ nghiệp vụ dùng từ người bán hoa dùng hằng ngày, không dùng từ kỹ thuật dịch máy.

`REJECTED` hiện là "Không đạt kiểm tra nhận dạng", không phải "REJECTED". `PENDING` là "Đang chờ". Mã trạng thái không bao giờ lộ ra giao diện.

Thông báo lỗi nói việc người dùng làm được tiếp theo, không nói việc hệ thống vừa hỏng thế nào.

## 11. Điện thoại trước nghĩa là gì

- Vùng bấm tối thiểu 44 điểm ảnh mỗi chiều.
- Việc chính nằm trong tầm ngón cái: nút hành động chính ở nửa dưới màn hình.
- Không bảng ngang cuộn hai chiều. Trên màn hẹp, một hàng bảng thành một thẻ.
- Ảnh tải lên nén phía client trước khi gửi, giữ nguyên bản gốc trên máy người dùng.
- Mọi luồng hoàn thành được bằng một tay, không cần xoay ngang.

Màn rộng thêm cột, thêm bảng, thêm thao tác hàng loạt — không thêm chức năng mà điện thoại không có.
