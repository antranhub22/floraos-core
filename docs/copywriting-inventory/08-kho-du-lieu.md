# BẢN ĐỒ NỘI DUNG UI — 08. KHO DỮ LIỆU (`/kho-du-lieu`)

> **Màn hình**: Trung Tâm Lưu Trữ 3 Phân Vùng Chuẩn & Thùng Rác  
> **Tuyến đường**: `/kho-du-lieu`  
> **Mã phân hệ**: `MEDIA`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Tác vụ trên cùng

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MED-HDR-01` | `HDR` | Tiêu đề chính trang | `Kho Dữ Liệu Sản Phẩm` | | Tiêu đề lớn `H1` |
| `MED-HDR-02` | `HDR` | Mô tả phụ trang | `Kho lưu trữ trung tâm phân loại 3 phân vùng độc lập cho tài khoản của bạn.` | | Định hướng phân vùng |
| `MED-BTN-01` | `BTN` | Nút tác vụ nhanh | `+ Tải ảnh mới để phân tích` | | Điều hướng sang `/tai-anh` |

---

## 2. Các phân vùng lưu trữ (`TabActionHeader`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MED-TAB-01` | `TAB` | Phân vùng 1 | `1. Ảnh Gốc` | | File ảnh thô chưa phân tích |
| `MED-TAB-02` | `TAB` | Phân vùng 2 | `2. Ảnh Đã Duyệt (M01a)` | | *Nên bỏ chữ "M01a" theo UX Lint R8* |
| `MED-TAB-03` | `TAB` | Phân vùng 3 | `3. Sale Pitch Hoàn Thành` | | Kịch bản tư vấn Zalo hoàn chỉnh |
| `MED-TAB-04` | `TAB` | Phân vùng 4 (Điều hành) | `4. Thùng Rác (30 ngày)` | | Chỉ hiển thị cho Quản lý |

---

## 3. Tìm kiếm & Tác vụ trên từng thẻ tài nguyên

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MED-PH-01`  | `PH`  | Ô tìm kiếm kho | `Tìm theo tên hoa, mã số, dịp lễ hoặc thành phần...` | | Gợi ý tìm kiếm |
| `MED-ACT-01` | `BTN` | Thao tác trên ảnh thô | `Đưa vào phân tích AI` | | Chuyển sang `/tai-anh` |
| `MED-ACT-02` | `BTN` | Thao tác trên ảnh đã duyệt | `Tạo bài viết bán hàng` | | Kích hoạt chặng 2 |
| `MED-ACT-03` | `BTN` | Thao tác kịch bản hoàn thành | `Sao chép kịch bản Zalo` | | Copy tin nhắn tư vấn |
| `MED-ACT-04` | `BTN` | Thao tác thùng rác: Khôi phục | `Khôi phục tài nguyên` | | Đưa về kho chính |
| `MED-ACT-05` | `BTN` | Thao tác thùng rác: Xóa vĩnh viễn | `Xóa vĩnh viễn` | | Xóa cứng khỏi storage |
