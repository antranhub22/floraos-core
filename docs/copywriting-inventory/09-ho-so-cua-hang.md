# BẢN ĐỒ NỘI DUNG UI — 09. HỒ SƠ CỬA HÀNG (`/ho-so`)

> **Màn hình**: Hồ Sơ Cửa Hàng & Nhận Diện Thương Hiệu  
> **Tuyến đường**: `/ho-so`  
> **Mã phân hệ**: `PROFILE`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Tác vụ trên cùng

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-HDR-01` | `HDR` | Tiêu đề chính trang | `Hồ Sơ Cửa Hàng & Thương Hiệu` | | Tiêu đề lớn `H1` |
| `PRF-HDR-02` | `HDR` | Mô tả phụ trang | `Cấu hình thông tin pháp lý, tài khoản nhận tiền VietQR, nhận diện thương hiệu và chính sách bán hàng` | | Hướng dẫn chung |
| `PRF-BTN-01` | `BTN` | Nút lưu tất cả | `Lưu thay đổi hồ sơ` | | Nút submit chính |

---

## 2. Các tab cấu hình chuyên sâu (`TabActionHeader`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-TAB-01` | `TAB` | Tab 1 | `Hồ sơ kinh doanh` | | Thông tin tiệm, VietQR |
| `PRF-TAB-02` | `TAB` | Tab 2 | `Nhận diện thương hiệu` | | Logo, bảng 5 màu Hex |
| `PRF-TAB-03` | `TAB` | Tab 3 | `Tài nguyên thương hiệu` | | Khung ảnh, phông nền in |
| `PRF-TAB-04` | `TAB` | Tab 4 | `Chính sách & Cam kết` | | Chính sách cọc, hoàn hủy |
| `PRF-TAB-05` | `TAB` | Tab 5 | `Dịp lễ & Giọng văn` | | Giọng văn tư vấn AI |

---

## 3. Tab 1: Hồ sơ kinh doanh & Tài khoản nhận cọc VietQR

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-LBL-01` | `LBL` | Tên thương hiệu | `Tên thương hiệu hiển thị *` | | Tên tiệm hoa |
| `PRF-PH-01`  | `PH`  | Ô tên thương hiệu | `VD: Tiệm Hoa Ban Mai, Flora Boutique` | | Gợi ý nhập |
| `PRF-LBL-02` | `LBL` | Hotline chính | `Hotline tư vấn / Zalo *` | | Số điện thoại tiệm |
| `PRF-PH-02`  | `PH`  | Ô hotline | `0909xxxxxx` | | Gợi ý nhập |
| `PRF-LBL-03` | `LBL` | Địa chỉ tiệm | `Địa chỉ cửa hàng *` | | Số nhà, đường, quận |
| `PRF-PH-03`  | `PH`  | Ô địa chỉ | `Số nhà, tên đường, phường, quận/huyện...` | | Gợi ý nhập |
| `PRF-LBL-04` | `LBL` | Ngân hàng | `Ngân hàng thụ hưởng (VietQR) *` | | Tên ngân hàng |
| `PRF-LBL-05` | `LBL` | Số tài khoản | `Số tài khoản nhận tiền *` | | STK chủ shop |
| `PRF-LBL-06` | `LBL` | Chủ tài khoản | `Tên chủ tài khoản (In hoa không dấu) *` | | Tên trên thẻ |

---

## 4. Tab 4: Chính sách đặt cọc & Quà tặng mặc định

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PRF-POL-01` | `HDR` | Tiêu đề chính sách cọc | `Chính sách đặt cọc đơn hàng qua Link` | | Quy định tỷ lệ cọc |
| `PRF-POL-02` | `LBL` | Tỷ lệ cọc mặc định | `Tỷ lệ tiền cọc tối thiểu (%)` | | 50% hoặc 100% |
| `PRF-POL-03` | `HDR` | Tiêu đề quà tặng kèm | `Quà tặng & Cam kết mặc định` | | Tự động chèn vào brochure |
| `PRF-POL-04` | `LBL` | Quà tặng 1 | `Tặng kèm thiệp chúc mừng hoặc banner in theo yêu cầu` | | Cam kết chuẩn |
| `PRF-POL-05` | `LBL` | Quà tặng 2 | `Chụp ảnh nghiệm thu thành phẩm trước khi giao hàng` | | Cam kết chuẩn |
| `PRF-POL-06` | `LBL` | Quà tặng 3 | `Giao hoa đúng hẹn, hỗ trợ đổi trả nếu hoa dập nát` | | Cam kết chuẩn |
