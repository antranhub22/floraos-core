# BẢN ĐỒ NỘI DUNG UI — 02. ĐƠN HÀNG & KÊNH CHÀO BÁN (`/don-hang`)

> **Màn hình**: Đơn Hàng & Kênh Chào Bán  
> **Tuyến đường**: `/don-hang`  
> **Mã phân hệ**: `ORDER`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Tác vụ góc trên phải (Top Action Header)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-HDR-01` | `HDR` | Dòng phân nhóm trên tiêu đề | `Bán hàng & Vận hành đơn` | | Nhãn nhóm chức năng |
| `ORDER-HDR-02` | `HDR` | Tiêu đề chính trang | `Đơn Hàng & Kênh Chào Bán` | | Tiêu đề lớn `H1` |
| `ORDER-BTN-01` | `BTN` | Nút chính góc phải (Primary CTA) | `Tạo đơn mới` | | Kèm icon `Plus (+)` |
| `ORDER-BTN-02` | `BTN` | Nút phụ 1 | `Tạo từ chat` | | Mở modal tạo đơn từ hội thoại |
| `ORDER-BTN-03` | `BTN` | Nút phụ 2 | `Làm mới` | | Tải lại danh sách đơn hàng |
| `ORDER-BTN-04` | `BTN` | Nút điều hướng | `Trang chủ` | | Quay về màn hình `/` |
| `ORDER-BTN-05` | `BTN` | Nút xuất dữ liệu | `Xuất Excel` | | Tải file `don-hang.xlsx` |

---

## 2. Thanh Tabs chức năng chính

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-TAB-01` | `TAB` | Tab 1 (Mặc định) | `Tất cả đơn hàng (Kanban)` | | Quản lý tiến độ cắm & giao hoa |
| `ORDER-TAB-02` | `TAB` | Tab 2 | `Thẻ Chào & Link Chào Khách (Sale)` | | Hộp việc cho nhân viên tư vấn |
| `ORDER-TAB-03` | `TAB` | Tab 3 | `Duyệt TT Thẻ Chào (Điều hành)` | | Chỉ hiện khi có quyền `R11` |

---

## 3. Khối hướng dẫn thao tác chuẩn (Order Guidance Card)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-GDC-01` | `BDG` | Huy hiệu hướng dẫn | `HƯỚNG DẪN QUẢN LÝ ĐƠN HÀNG M09` | | *Nên bỏ chữ "M09" theo UX Lint R8* |
| `ORDER-GDC-02` | `HDR` | Tiêu đề hướng dẫn | `Quy trình xưởng hoa & Giao vận chính xác` | | Trọng tâm nghiệp vụ xưởng hoa |
| `ORDER-GDC-03` | `LBL` | Mô tả quy trình | `Chuyển hóa đơn hàng thành phiếu cắm hoa chi tiết cho nghệ nhân cắm hoa (Florist Ticket) và phiếu giao hoa kèm mã QR xác nhận hoàn tất.` | | Hướng dẫn 2 luồng cốt lõi |
| `ORDER-GDC-04` | `LBL` | Mẹo 1 (Thợ hoa) | `✂️ Phiếu thợ cắm hoa phân rã rõ ràng: Số lượng từng loại cành hoa, giấy gói và tone màu chuẩn` | | Chuẩn bị nguyên liệu |
| `ORDER-GDC-05` | `LBL` | Mẹo 2 (Nghiệm thu) | `📸 Chụp ảnh nghiệm thu thành phẩm trước khi giao để gửi khách duyệt` | | Khâu đối soát chất lượng |
| `ORDER-GDC-06` | `LBL` | Mẹo 3 (Giao vận) | `🛵 In phiếu giao hàng khổ A6 kèm thiệp chúc mừng và thông tin người nhận` | | In ấn & vận chuyển |

---

## 4. Thanh tìm kiếm, đếm số lượng & Bộ lọc di động

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-PH-01`  | `PH`  | Ô tìm kiếm đơn | `Tìm theo mã đơn, người nhận, SĐT...` | | Gợi ý trường tìm kiếm |
| `ORDER-LBL-01` | `LBL` | Chỉ số tổng | `Tổng cộng: {{count}} đơn hàng` | | Giữ nguyên biến `{{count}}` |
| `ORDER-MOB-01` | `TAB` | Lọc mobile: Tất cả | `Tất cả` | | Hiện trên màn hình điện thoại |
| `ORDER-MOB-02` | `TAB` | Lọc mobile: Mới | `Mới` | | Đơn mới tiếp nhận |
| `ORDER-MOB-03` | `TAB` | Lọc mobile: Đang cắm | `Đang cắm` | | Đơn đang trong xưởng |
| `ORDER-MOB-04` | `TAB` | Lọc mobile: Vận chuyển | `Vận chuyển` | | Đơn đang trên đường giao |
| `ORDER-MOB-05` | `TAB` | Lọc mobile: Hoàn tất | `Hoàn tất` | | Đơn đã giao xong |

---

## 5. Bảng Kanban 4 cột tiến độ (Desktop)

| Mã Copy | Loại | Cột Kanban | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-COL-01` | `TH`  | Cột 1 (Màu xanh dương) | `1. Mới tiếp nhận` | | Đơn vừa đặt hoặc vừa chốt |
| `ORDER-COL-02` | `TH`  | Cột 2 (Màu tím/đỏ) | `2. Đang cắm hoa` | | Thợ đang thực hiện tại xưởng |
| `ORDER-COL-03` | `TH`  | Cột 3 (Màu vàng cam) | `3. Đang giao hàng` | | Shipper đang đi giao |
| `ORDER-COL-04` | `TH`  | Cột 4 (Màu xanh lá) | `4. Đã hoàn tất` | | Đã giao thành công hoặc lưu trữ |

---

## 6. Thẻ đơn hàng (Order Card trên Kanban)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-CRD-01` | `LBL` | Mặc định người nhận | `Khách lẻ` | | Khi đơn không có tên người nhận |
| `ORDER-CRD-02` | `LBL` | Mặc định địa chỉ | `Nhận tại tiệm` | | Khi khách đến tiệm lấy trực tiếp |
| `ORDER-CRD-03` | `LBL` | Dòng tóm tắt nhiều món | `(+{{count}} món)` | | Ví dụ: `(+2 món)` |
| `ORDER-CRD-04` | `BTN` | Nút xem chi tiết | `Chi tiết` | | Mở modal xem đơn hàng |

---

## 7. Biểu mẫu Tạo đơn mới (Create Order Modal)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-MOD-01` | `HDR` | Tiêu đề modal | `Tạo Đơn Hàng Hoa Mới` | | Đầu popup |
| `ORDER-MOD-02` | `HDR` | Mô tả phụ modal | `Đồng bộ Master Index & Công thức cắm hoa` | | Dưới tiêu đề |
| `ORDER-MOD-03` | `LBL` | Khối chọn mẫu nhanh | `⚡ Chọn mẫu nhanh từ Master Index (Đầy đủ BOM & Ảnh)` | | Chọn mẫu có sẵn trong catalog |
| `ORDER-MOD-04` | `PH`  | Lựa chọn mẫu mặc định | `-- Bấm để chọn mẫu hoa có sẵn trong Master Catalog --` | | Tùy chọn đầu tiên trong dropdown |
| `ORDER-MOD-05` | `LBL` | Nhãn trường | `Người nhận *` | | Bắt buộc |
| `ORDER-MOD-06` | `PH`  | Ô người nhận | `Họ tên người nhận hoa` | | Gợi ý nhập |
| `ORDER-MOD-07` | `LBL` | Nhãn trường | `Số điện thoại *` | | Bắt buộc |
| `ORDER-MOD-08` | `PH`  | Ô số điện thoại | `0909xxxxxx` | | Gợi ý nhập |
| `ORDER-MOD-09` | `LBL` | Nhãn trường | `Địa chỉ giao hoa *` | | Bắt buộc |
| `ORDER-MOD-10` | `PH`  | Ô địa chỉ | `Số nhà, tên đường, phường, quận...` | | Gợi ý nhập |
| `ORDER-MOD-11` | `LBL` | Nhãn trường | `Ngày hẹn giao` | | Bộ chọn ngày |
| `ORDER-MOD-12` | `LBL` | Nhãn trường | `Khung giờ giao` | | Khung giờ hẹn |
| `ORDER-OPT-01` | `LBL` | Tùy chọn giờ 1 | `Sáng sớm (07:30 - 09:30)` | | Dropdown |
| `ORDER-OPT-02` | `LBL` | Tùy chọn giờ 2 | `Sáng (09:30 - 11:30)` | | Dropdown |
| `ORDER-OPT-03` | `LBL` | Tùy chọn giờ 3 | `Chiều (13:30 - 15:30)` | | Dropdown |
| `ORDER-OPT-04` | `LBL` | Tùy chọn giờ 4 | `Chiều muộn (15:30 - 17:30)` | | Dropdown |
| `ORDER-OPT-05` | `LBL` | Tùy chọn giờ 5 | `Tối (18:00 - 20:00)` | | Dropdown |
| `ORDER-OPT-06` | `LBL` | Tùy chọn giờ 6 | `Giao gấp hỏa tốc (60 phút)` | | Dropdown |
| `ORDER-MOD-13` | `LBL` | Tiêu đề danh sách mẫu | `Danh sách mẫu hoa & phụ kiện *` | | Bảng sản phẩm trong đơn |
| `ORDER-MOD-14` | `BTN` | Thêm dòng sản phẩm | `+ Thêm mục` | | Thêm dòng sản phẩm |
| `ORDER-MOD-15` | `PH`  | Ô tên hoa | `Tên mẫu hoa hoặc mô tả yêu cầu` | | Nhập tự do hoặc theo mẫu |
| `ORDER-MOD-16` | `PH`  | Ô đơn giá | `Đơn giá` | | Đơn giá VNĐ |
| `ORDER-MOD-17` | `LBL` | Lời nhắn thiệp | `Lời nhắn thiệp mừng` | | Nhãn |
| `ORDER-MOD-18` | `PH`  | Ô lời nhắn thiệp | `Nội dung in/viết lên thiệp...` | | Gợi ý nhập lời chúc |
| `ORDER-MOD-19` | `LBL` | Ghi chú thợ cắm hoa | `Ghi chú thợ cắm hoa (BOM / Phong cách)` | | Lưu ý cho nghệ nhân |
| `ORDER-MOD-20` | `PH`  | Ô ghi chú thợ hoa | `Tone màu, giấy gói, hoa chính...` | | Gợi ý nhập |
| `ORDER-MOD-21` | `LBL` | Tạm tính | `Tổng tiền tạm tính:` | | Dưới chân modal |
| `ORDER-MOD-22` | `BTN` | Nút hủy modal | `Hủy` | | Đóng popup |
| `ORDER-MOD-23` | `BTN` | Nút xác nhận tạo | `Xác nhận tạo đơn` | | Nút submit chính |

---

## 8. Trạng thái rỗng & Thông báo lỗi (Empty State & Alerts)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER-EMP-01` | `EMP` | Khi danh sách trống | `Không có đơn hàng nào` | | Tiêu đề trạng thái rỗng |
| `ORDER-EMP-02` | `EMP` | Giải thích lý do trống | `Chưa có đơn hàng nào ở trạng thái này hoặc không khớp với từ khoá tìm kiếm.` | | Mô tả chi tiết |
| `ORDER-ERR-01` | `MSG` | Lỗi thiếu thông tin người nhận | `Vui lòng điền đầy đủ tên, số điện thoại và địa chỉ nhận hoa.` | | Báo đỏ khi thiếu form |
| `ORDER-ERR-02` | `MSG` | Lỗi đơn giá hoặc tên hoa | `Vui lòng kiểm tra lại thông tin hoa và đơn giá của các mục.` | | Khi đơn giá <= 0 |
| `ORDER-ERR-03` | `MSG` | Lỗi từ server | `Tạo đơn hàng thất bại.` | | Khi API trả về lỗi |
