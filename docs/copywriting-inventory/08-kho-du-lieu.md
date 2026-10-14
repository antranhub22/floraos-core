# BẢN ĐỒ NỘI DUNG UI — 08. KHO ẢNH & NỘI DUNG (`/kho-du-lieu`)

> **Màn hình**: Kho Ảnh & Nội Dung Tư Vấn  
> **Tuyến đường**: `/kho-du-lieu`  
> **Mã phân hệ**: `MEDIA`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT (PO Decision 1).

---

## 1. Thanh tiêu đề & Tác vụ trên cùng

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MED-HDR-01` | `HDR` | Tiêu đề chính trang | `Kho Dữ Liệu Sản Phẩm` | `Kho ảnh & nội dung` | PO Decision 1: Phương án A |
| `MED-HDR-02` | `HDR` | Mô tả phụ trang | `Kho lưu trữ trung tâm phân loại 3 phân vùng độc lập cho tài khoản của bạn.` | `Lưu ảnh gốc, ảnh đã duyệt và kịch bản tư vấn của cửa hàng. Mục đã xóa được giữ 30 ngày trong Thùng rác.` | Bỏ từ jargon "phân vùng" |
| `MED-BTN-01` | `BTN` | Nút tác vụ nhanh | `+ Tải ảnh mới để phân tích` | `Tải ảnh mới` | Bỏ dấu `+`, điều hướng `/tai-anh` |

---

## 2. Các tab phân loại lưu trữ (`TabActionHeader`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MED-TAB-01` | `TAB` | Tab 1 | `1. Ảnh Gốc` | `Ảnh gốc` | Bỏ số thứ tự cứng |
| `MED-TAB-02` | `TAB` | Tab 2 | `2. Ảnh Đã Duyệt (M01a)` | `Ảnh đã duyệt` | Xóa mã M01a (UX Lint R8) |
| `MED-TAB-03` | `TAB` | Tab 3 | `3. Sale Pitch Hoàn Thành` | `Kịch bản tư vấn` | Bỏ tiếng Anh "Sale Pitch" |
| `MED-TAB-04` | `TAB` | Tab 4 (Điều hành) | `4. Thùng Rác (30 ngày)` | `Thùng rác (30 ngày)` | Bỏ số thứ tự cứng |

---

## 3. Tìm kiếm & Tác vụ trên từng thẻ

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MED-PH-01`  | `PH`  | Ô tìm kiếm kho | `Tìm theo tên hoa, mã số, dịp lễ hoặc thành phần...` | `Tìm theo tên hoa, mã mẫu hoa, dịp tặng hoặc thành phần…` | Thống nhất "mã mẫu hoa" |
| `MED-ACT-01` | `BTN` | Thao tác trên ảnh thô | `Đưa vào phân tích AI` | `Phân tích ảnh` | Đồng bộ tên động từ |
| `MED-ACT-02` | `BTN` | Thao tác trên ảnh đã duyệt | `Tạo bài viết bán hàng` | `Tạo bài viết bán hàng` | Kích hoạt chặng 2 |
| `MED-ACT-03` | `BTN` | Thao tác kịch bản hoàn thành | `Sao chép kịch bản Zalo` | `Sao chép kịch bản` | Ngắn gọn |
| `MED-ACT-04` | `BTN` | Thao tác thùng rác: Khôi phục | `Khôi phục tài nguyên` | `Khôi phục` | Bỏ từ jargon "tài nguyên" |
| `MED-ACT-05` | `BTN` | Thao tác thùng rác: Xóa vĩnh viễn | `Xóa vĩnh viễn` | `Xóa vĩnh viễn` | Kèm hộp thoại xác nhận |
