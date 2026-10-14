# BẢN ĐỒ NỘI DUNG UI — 09. HỒ SƠ CỬA HÀNG (`/ho-so`)

> **Màn hình**: Hồ Sơ Cửa Hàng & Nhận Diện Thương Hiệu  
> **Tuyến đường**: `/ho-so`  
> **Mã phân hệ**: `PROFILE`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT (PO Decision 3).

---

## 1. Thanh tiêu đề & Tác vụ trên cùng

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-HDR-01` | `HDR` | Tiêu đề chính trang | `Hồ Sơ Cửa Hàng & Thương Hiệu` | `Hồ sơ cửa hàng và thương hiệu` | Dùng "và" thay cho `&` |
| `PRF-HDR-02` | `HDR` | Mô tả phụ trang | `Cấu hình thông tin pháp lý, tài khoản nhận tiền VietQR, nhận diện thương hiệu và chính sách bán hàng` | `Thiết lập thông tin cửa hàng, tài khoản nhận tiền VietQR, nhận diện thương hiệu và chính sách bán hàng.` | Bỏ từ jargon "cấu hình" |
| `PRF-BTN-01` | `BTN` | Nút lưu tất cả | `Lưu thay đổi hồ sơ` | `Lưu thay đổi` | Ngắn gọn, chuẩn hóa |

---

## 2. Các tab cấu hình chuyên sâu (`TabActionHeader`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-TAB-01` | `TAB` | Tab 1 | `Hồ sơ kinh doanh` | `Thông tin cửa hàng` | PO Decision 3: "cửa hàng" |
| `PRF-TAB-02` | `TAB` | Tab 2 | `Nhận diện thương hiệu` | `Nhận diện thương hiệu` | Logo, màu sắc |
| `PRF-TAB-03` | `TAB` | Tab 3 | `Tài nguyên thương hiệu` | `Khung ảnh và mẫu in` | Bỏ từ jargon "tài nguyên" |
| `PRF-TAB-04` | `TAB` | Tab 4 | `Chính sách & Cam kết` | `Chính sách và cam kết` | Dùng "và" thay cho `&` |
| `PRF-TAB-05` | `TAB` | Tab 5 | `Dịp lễ & Giọng văn` | `Dịp lễ và giọng văn` | Dùng "và" thay cho `&` |

---

## 3. Tab 1: Thông tin cửa hàng & Tài khoản nhận cọc VietQR

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-LBL-01` | `LBL` | Tên thương hiệu | `Tên thương hiệu hiển thị *` | `Tên cửa hàng hiển thị` | Thống nhất "cửa hàng" |
| `PRF-PH-01`  | `PH`  | Ô tên thương hiệu | `VD: Tiệm Hoa Ban Mai, Flora Boutique` | `Ví dụ: Tiệm Hoa Ban Mai, Flora Boutique` | Bỏ viết tắt "VD:" |
| `PRF-LBL-02` | `LBL` | Hotline chính | `Hotline tư vấn / Zalo *` | `Hotline tư vấn` | Ngắn gọn, bỏ `*` |
| `PRF-PH-02`  | `PH`  | Ô hotline | `0909xxxxxx` | `Ví dụ: 0909xxxxxx` | Gợi ý nhập |
| `PRF-LBL-03` | `LBL` | Địa chỉ tiệm | `Địa chỉ cửa hàng *` | `Địa chỉ cửa hàng` | Dấu `*` do component render |
| `PRF-PH-03`  | `PH`  | Ô địa chỉ | `Số nhà, tên đường, phường, quận/huyện...` | `Số nhà, tên đường, phường/xã, tỉnh/thành phố` | Cập nhật thể chế hành chính |
| `PRF-LBL-04` | `LBL` | Ngân hàng | `Ngân hàng thụ hưởng (VietQR) *` | `Ngân hàng nhận tiền (VietQR)` | Bỏ từ pháp lý "thụ hưởng" |
| `PRF-LBL-05` | `LBL` | Số tài khoản | `Số tài khoản nhận tiền *` | `Số tài khoản nhận tiền` | Ô nhập STK |
| `PRF-LBL-06` | `LBL` | Chủ tài khoản | `Tên chủ tài khoản (In hoa không dấu) *` | `Tên chủ tài khoản` | Kèm chú thích: Viết hoa không dấu. Cảnh báo rủi ro cọc. |

---

## 4. Tab 4: Chính sách đặt cọc & Quà tặng mặc định

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-POL-01` | `HDR` | Tiêu đề chính sách cọc | `Chính sách đặt cọc đơn hàng qua Link` | `Chính sách đặt cọc qua link` | Rõ nghĩa |
| `PRF-POL-02` | `LBL` | Tỷ lệ cọc mặc định | `Tỷ lệ tiền cọc tối thiểu (%)` | `Tỷ lệ đặt cọc tối thiểu` | Chọn 50% hoặc 100% |
| `PRF-POL-03` | `HDR` | Tiêu đề quà tặng kèm | `Quà tặng & Cam kết mặc định` | `Quà tặng và cam kết với khách` | Tách bạch quà và cam kết |
| `PRF-POL-04` | `LBL` | Quà tặng 1 | `Tặng kèm thiệp chúc mừng hoặc banner in theo yêu cầu` | `Tặng kèm thiệp hoặc băng rôn in theo yêu cầu` | Bỏ tiếng Anh "banner" |
| `PRF-POL-05` | `LBL` | Cam kết 1 | `Chụp ảnh nghiệm thu thành phẩm trước khi giao hàng` | `Gửi ảnh thành phẩm để khách duyệt trước khi giao` | Bỏ từ "nghiệm thu" |
| `PRF-POL-06` | `LBL` | Cam kết 2 | `Giao hoa đúng hẹn, hỗ trợ đổi trả nếu hoa dập nát` | `Giao hoa đúng hẹn, hỗ trợ đổi trả nếu hoa dập nát` | Cam kết dịch vụ |
