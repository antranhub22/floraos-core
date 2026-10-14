# BẢN ĐỒ NỘI DUNG UI — 02. ĐƠN HÀNG & KÊNH CHÀO BÁN (`/don-hang`)

> **Màn hình**: Quản lý Đơn hàng & Tiến độ Xưởng hoa  
> **Tuyến đường**: `/don-hang`  
> **Mã phân hệ**: `ORDER`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT.

---

## 1. Thanh tiêu đề & Tác vụ góc trên phải (Top Action Header)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-HDR-01` | `HDR` | Dòng phân nhóm trên tiêu đề | `Bán hàng & Vận hành đơn` | `Bán hàng và xử lý đơn` | Nhóm chức năng, Sentence case |
| `ORDER-HDR-02` | `HDR` | Tiêu đề chính trang | `Đơn Hàng & Kênh Chào Bán` | `Đơn hàng` | Tiêu đề lớn `H1` ngắn gọn |
| `ORDER-BTN-01` | `BTN` | Nút chính góc phải (Primary CTA) | `Tạo đơn mới` | `Tạo đơn mới` | Kèm icon `Plus` từ thư viện |
| `ORDER-BTN-02` | `BTN` | Nút phụ 1 | `Tạo từ chat` | `Tạo đơn từ tin nhắn` | Rõ nghĩa kênh giao tiếp |
| `ORDER-BTN-03` | `BTN` | Nút phụ 2 | `Làm mới` | `Làm mới` | Tải lại danh sách đơn hàng |
| `ORDER-BTN-04` | `BTN` | Nút điều hướng | `Trang chủ` | `Trang chủ` | Quay về màn hình `/` |
| `ORDER-BTN-05` | `BTN` | Nút xuất dữ liệu | `Xuất Excel` | `Xuất file Excel` | Tải file `don-hang.xlsx` |

---

## 2. Thanh Tabs chức năng chính

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-TAB-01` | `TAB` | Tab 1 (Mặc định) | `Tất cả đơn hàng (Kanban)` | `Tất cả đơn hàng` | Bỏ chữ "Kanban" (jargon kỹ thuật) |
| `ORDER-TAB-02` | `TAB` | Tab 2 | `Thẻ Chào & Link Chào Khách (Sale)` | `Link đặt hoa` | Tên ngắn gọn theo từ điển |
| `ORDER-TAB-03` | `TAB` | Tab 3 | `Duyệt TT Thẻ Chào (Điều hành)` | `Duyệt thanh toán` | Bỏ viết tắt "TT", bỏ ghi vai trò vào tab |

---

## 3. Khối hướng dẫn thao tác chuẩn (Order Guidance Card)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-GDC-01` | `BDG` | Huy hiệu hướng dẫn | `HƯỚNG DẪN QUẢN LÝ ĐƠN HÀNG M09` | `HƯỚNG DẪN XỬ LÝ ĐƠN HÀNG` | Xóa mã M09 theo UX Lint R8 |
| `ORDER-GDC-02` | `HDR` | Tiêu đề hướng dẫn | `Quy trình xưởng hoa & Giao vận chính xác` | `Quy trình cắm hoa và giao hàng` | Tự nhiên, không sáo rỗng |
| `ORDER-GDC-03` | `LBL` | Mô tả quy trình | `Chuyển hóa đơn hàng thành phiếu cắm hoa chi tiết cho nghệ nhân cắm hoa (Florist Ticket) và phiếu giao hoa kèm mã QR xác nhận hoàn tất.` | `Mỗi đơn hàng có phiếu cắm hoa cho thợ và phiếu giao hoa kèm mã QR để xác nhận giao thành công.` | Bỏ "Florist Ticket" tiếng Anh |
| `ORDER-GDC-04` | `LBL` | Mẹo 1 (Thợ hoa) | `✂️ Phiếu thợ cắm hoa phân rã rõ ràng: Số lượng từng loại cành hoa, giấy gói và tone màu chuẩn` | `Phiếu cắm hoa ghi rõ số lượng từng loại hoa, giấy gói và tông màu chuẩn` | Dùng icon SVG, sửa "tone" -> "tông" |
| `ORDER-GDC-05` | `LBL` | Mẹo 2 (Nghiệm thu) | `📸 Chụp ảnh nghiệm thu thành phẩm trước khi giao để gửi khách duyệt` | `Chụp ảnh thành phẩm gửi khách duyệt trước khi giao` | Dùng icon SVG |
| `ORDER-GDC-06` | `LBL` | Mẹo 3 (Giao vận) | `🛵 In phiếu giao hàng khổ A6 kèm thiệp chúc mừng và thông tin người nhận` | `In phiếu giao hoa kèm thiệp và thông tin người nhận` | Dùng icon SVG |

---

## 4. Thanh tìm kiếm, đếm số lượng & Bộ lọc di động

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-PH-01`  | `PH`  | Ô tìm kiếm đơn | `Tìm theo mã đơn, người nhận, SĐT...` | `Tìm theo mã đơn, người nhận hoặc số điện thoại…` | Bỏ viết tắt "SĐT" |
| `ORDER-LBL-01` | `LBL` | Chỉ số tổng | `Tổng cộng: {{count}} đơn hàng` | `{{count}} đơn hàng` | Bỏ dấu hai chấm và "Tổng cộng" dư |
| `ORDER-MOB-01` | `TAB` | Lọc mobile: Tất cả | `Tất cả` | `Tất cả` | Hiện trên điện thoại |
| `ORDER-MOB-02` | `TAB` | Lọc mobile: Mới | `Mới` | `Mới tiếp nhận` | Đồng bộ 100% với tên cột desktop |
| `ORDER-MOB-03` | `TAB` | Lọc mobile: Đang cắm | `Đang cắm` | `Đang cắm hoa` | Đồng bộ 100% với tên cột desktop |
| `ORDER-MOB-04` | `TAB` | Lọc mobile: Vận chuyển | `Vận chuyển` | `Đang giao` | Đồng bộ 100% với tên cột desktop |
| `ORDER-MOB-05` | `TAB` | Lọc mobile: Hoàn tất | `Hoàn tất` | `Hoàn tất` | Đồng bộ 100% với tên cột desktop |

---

## 5. Bảng 4 cột tiến độ (Desktop)

| Mã Copy | Loại | Cột tiến độ | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-COL-01` | `TH`  | Cột 1 (Xanh dương) | `1. Mới tiếp nhận` | `Mới tiếp nhận` | Bỏ số thứ tự gõ cứng |
| `ORDER-COL-02` | `TH`  | Cột 2 (Vàng cam) | `2. Đang cắm hoa` | `Đang cắm hoa` | Bỏ số thứ tự gõ cứng |
| `ORDER-COL-03` | `TH`  | Cột 3 (Tím) | `3. Đang giao hàng` | `Đang giao` | Ngắn gọn, đồng bộ với mobile |
| `ORDER-COL-04` | `TH`  | Cột 4 (Xanh lá) | `4. Đã hoàn tất` | `Hoàn tất` | Ngắn gọn, đồng bộ với mobile |

---

## 6. Thẻ đơn hàng (Order Card)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-CRD-01` | `LBL` | Mặc định người nhận | `Khách lẻ` | `Khách lẻ` | Khi đơn không có tên người nhận |
| `ORDER-CRD-02` | `LBL` | Mặc định địa chỉ | `Nhận tại tiệm` | `Nhận tại cửa hàng` | Thống nhất danh xưng "cửa hàng" |
| `ORDER-CRD-03` | `LBL` | Dòng tóm tắt nhiều món | `(+{{count}} món)` | `(+{{count}} món)` | Giữ nguyên biến `{{count}}` |
| `ORDER-CRD-04` | `BTN` | Nút xem chi tiết | `Chi tiết` | `Xem chi tiết` | Động từ rõ nghĩa |

---

## 7. Biểu mẫu Tạo đơn mới (Create Order Modal)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-MOD-01` | `HDR` | Tiêu đề modal | `Tạo Đơn Hàng Hoa Mới` | `Tạo đơn hàng mới` | Sentence case |
| `ORDER-MOD-02` | `HDR` | Mô tả phụ modal | `Đồng bộ Master Index & Công thức cắm hoa` | `Chọn mẫu có sẵn từ kho mẫu hoa hoặc nhập trực tiếp.` | Bỏ Master Index & BOM |
| `ORDER-MOD-03` | `LBL` | Khối chọn mẫu nhanh | `⚡ Chọn mẫu nhanh từ Master Index (Đầy đủ BOM & Ảnh)` | `Chọn nhanh từ kho mẫu hoa` | Bỏ emoji, bỏ BOM |
| `ORDER-MOD-04` | `PH`  | Lựa chọn mẫu mặc định | `-- Bấm để chọn mẫu hoa có sẵn trong Master Catalog --` | `-- Chọn mẫu hoa có sẵn trong kho --` | Bỏ Master Catalog |
| `ORDER-MOD-05` | `LBL` | Nhãn trường | `Người nhận *` | `Người nhận` | Dấu `*` do component tự render |
| `ORDER-MOD-06` | `PH`  | Ô người nhận | `Họ tên người nhận hoa` | `Họ và tên người nhận hoa` | Gợi ý nhập |
| `ORDER-MOD-07` | `LBL` | Nhãn trường | `Số điện thoại *` | `Số điện thoại người nhận` | Nêu rõ đối tượng |
| `ORDER-MOD-08` | `PH`  | Ô số điện thoại | `0909xxxxxx` | `Ví dụ: 0909xxxxxx` | Gợi ý nhập |
| `ORDER-MOD-09` | `LBL` | Nhãn trường | `Địa chỉ giao hoa *` | `Địa chỉ giao hoa` | Dấu `*` do component render |
| `ORDER-MOD-10` | `PH`  | Ô địa chỉ | `Số nhà, tên đường, phường, quận...` | `Số nhà, tên đường, phường/xã, tỉnh/thành phố` | Cập nhật thể chế hành chính |
| `ORDER-MOD-11` | `LBL` | Nhãn trường | `Ngày hẹn giao` | `Ngày hẹn giao` | Bộ chọn ngày |
| `ORDER-MOD-12` | `LBL` | Nhãn trường | `Khung giờ giao` | `Khung giờ giao` | Khung giờ hẹn |
| `ORDER-OPT-01` | `OPT` | Tùy chọn giờ 1 | `Sáng sớm (07:30 - 09:30)` | `Sáng sớm (07:30–09:30)` | Chuẩn hóa gạch ngang |
| `ORDER-OPT-02` | `OPT` | Tùy chọn giờ 2 | `Sáng (09:30 - 11:30)` | `Sáng (09:30–11:30)` | Chuẩn hóa gạch ngang |
| `ORDER-OPT-03` | `OPT` | Tùy chọn giờ 3 | `Chiều (13:30 - 15:30)` | `Chiều (13:30–15:30)` | Chuẩn hóa gạch ngang |
| `ORDER-OPT-04` | `OPT` | Tùy chọn giờ 4 | `Chiều muộn (15:30 - 17:30)` | `Chiều muộn (15:30–17:30)` | Chuẩn hóa gạch ngang |
| `ORDER-OPT-05` | `OPT` | Tùy chọn giờ 5 | `Tối (18:00 - 20:00)` | `Tối (18:00–20:00)` | Chuẩn hóa gạch ngang |
| `ORDER-OPT-06` | `OPT` | Tùy chọn giờ 6 | `Giao gấp hỏa tốc (60 phút)` | `Giao gấp trong 60 phút` | Bỏ lặp từ "hỏa tốc" |
| `ORDER-MOD-13` | `LBL` | Tiêu đề danh sách mẫu | `Danh sách mẫu hoa & phụ kiện *` | `Mẫu hoa và phụ kiện` | Dùng "và", bỏ `*` |
| `ORDER-MOD-14` | `BTN` | Thêm dòng sản phẩm | `+ Thêm mục` | `Thêm mẫu hoa` | Bỏ dấu `+`, rõ đối tượng |
| `ORDER-MOD-15` | `PH`  | Ô tên hoa | `Tên mẫu hoa hoặc mô tả yêu cầu` | `Tên mẫu hoa hoặc mô tả yêu cầu` | Gợi ý nhập |
| `ORDER-MOD-16` | `PH`  | Ô đơn giá | `Đơn giá` | `Đơn giá (₫)` | Kèm đơn vị tiền tệ chuẩn |
| `ORDER-MOD-17` | `LBL` | Lời nhắn thiệp | `Lời nhắn thiệp mừng` | `Lời nhắn trên thiệp` | Tương thích cả hoa chia buồn |
| `ORDER-MOD-18` | `PH`  | Ô lời nhắn thiệp | `Nội dung in/viết lên thiệp...` | `Nội dung in hoặc viết lên thiệp…` | Gợi ý nhập |
| `ORDER-MOD-19` | `LBL` | Ghi chú thợ cắm hoa | `Ghi chú thợ cắm hoa (BOM / Phong cách)` | `Ghi chú cho thợ cắm hoa` | Bỏ BOM |
| `ORDER-MOD-20` | `PH`  | Ô ghi chú thợ hoa | `Tone màu, giấy gói, hoa chính...` | `Tông màu, giấy gói, hoa chính…` | Sửa "tone" thành "tông" |
| `ORDER-MOD-21` | `LBL` | Tạm tính | `Tổng tiền tạm tính:` | `Tạm tính:` | Ngắn gọn |
| `ORDER-MOD-22` | `BTN` | Nút hủy modal | `Hủy` | `Hủy` | Đóng popup |
| `ORDER-MOD-23` | `BTN` | Nút xác nhận tạo | `Xác nhận tạo đơn` | `Tạo đơn hàng` | Động từ trực tiếp |

---

## 8. Trạng thái rỗng & Thông báo lỗi (Empty State & Alerts)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-EMP-01` | `EMP` | Khi danh sách trống | `Không có đơn hàng nào` | `Chưa có đơn hàng nào` | Tiêu đề trạng thái rỗng |
| `ORDER-EMP-02` | `EMP` | Giải thích lý do trống | `Chưa có đơn hàng nào ở trạng thái này hoặc không khớp với từ khoá tìm kiếm.` | `Chưa có đơn hàng nào ở trạng thái này hoặc không khớp với từ khóa tìm kiếm. Bạn có thể tạo đơn hàng mới ngay.` | Thêm gợi ý hành động tiếp theo |
| `ORDER-ERR-01` | `ERR` | Lỗi thiếu thông tin người nhận | `Vui lòng điền đầy đủ tên, số điện thoại và địa chỉ nhận hoa.` | `Chưa đủ thông tin giao hoa. Vui lòng nhập họ tên, số điện thoại và địa chỉ người nhận.` | Rõ ràng 3 vế |
| `ORDER-ERR-02` | `ERR` | Lỗi đơn giá hoặc tên hoa | `Vui lòng kiểm tra lại thông tin hoa và đơn giá của các mục.` | `Đơn giá mỗi mục phải lớn hơn 0 ₫. Vui lòng kiểm tra lại tên hoa và giá tiền.` | Chỉ rõ nguyên nhân |
| `ORDER-ERR-03` | `ERR` | Lỗi từ server | `Tạo đơn hàng thất bại.` | `Chưa tạo được đơn hàng do lỗi hệ thống. Vui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ.` | Kèm hướng xử lý |
