# BẢN ĐỒ NỘI DUNG UI — 03. THẺ CHÀO MẪU HOA (`/the-chao`)

> **Màn hình**: Thẻ Chào Mẫu Hoa & Brochure Khách Hàng  
> **Tuyến đường**: `/the-chao`  
> **Mã phân hệ**: `CARD`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Tác vụ góc trên phải (Top Action Header)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-HDR-01` | `HDR` | Breadcrumb | `Sổ đơn hàng` | | Nút quay lại `/don-hang` |
| `CARD-HDR-02` | `HDR` | Tiêu đề lớn `H1` | `Thẻ chào mẫu hoa` | | Tiêu đề chính |
| `CARD-HDR-03` | `HDR` | Mô tả phụ dưới `H1` | `Gửi khách một bộ sưu tập để lướt xem, chọn mẫu và tự đặt hoa, thanh toán ngay trên điện thoại.` | | Định hướng công cụ bán hàng |
| `CARD-BTN-01` | `BTN` | Nút hướng dẫn sử dụng | `Hướng dẫn link đặt hoa` | | Mở Cẩm nang nghiệp vụ modal |
| `CARD-BTN-02` | `BTN` | Nút hộp việc | `Hộp việc` | | Mở danh sách nhắc việc tự động |
| `CARD-MOD-01` | `BTN` | Chế độ làm việc: Gửi nhanh | `Gửi nhanh` | | Chuyển luồng wizard 3 bước |
| `CARD-MOD-02` | `BTN` | Chế độ làm việc: Quản lý | `Quản lý` | | Chuyển giao diện 5 tab chi tiết |
| `CARD-BTN-03` | `BTN` | Nút làm mới | `Làm mới dữ liệu` | | Revalidate dữ liệu SWR |
| `CARD-BTN-04` | `BTN` | Nút xuất dữ liệu | `Xuất Excel` | | Tải file `the-chao-don-hang.xlsx` |

---

## 2. Thanh Tabs chức năng phân theo vai trò (Manager View)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-TAB-01` | `TAB` | Tab 1 (Quyền `L1`) | `Bộ sưu tập` | | Kèm huy hiệu số lượng BST |
| `CARD-TAB-02` | `TAB` | Tab 2 (Quyền `R1`) | `Theo dõi tiến độ` | | Giám sát phễu chuyển đổi |
| `CARD-TAB-03` | `TAB` | Tab 3 (Quyền `R2`) | `Bán hàng` | | Hộp việc & link của nhân viên sale |
| `CARD-TAB-04` | `TAB` | Tab 4 (Quyền `R11`) | `Điều hành` | | Duyệt thanh toán cọc & hủy đơn |
| `CARD-TAB-05` | `TAB` | Tab 5 (Quyền `R3/R4/R5`) | `Điều phối` | | Giao việc cắm hoa cho thợ |

---

## 3. Cảnh báo Hồ sơ tiệm (Shop Profile Readiness)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-RDN-01` | `BTN` | Nút cho Điều hành | `Mở Hồ sơ tiệm` | | Chuyển tới `/ho-so` |
| `CARD-RDN-02` | `LBL` | Nhãn nhắc nhân viên | `Báo Điều hành cập nhật Hồ sơ tiệm` | | Khi tài khoản không có quyền sửa hồ sơ |

---

## 4. Tab Bộ sưu tập (`CatalogListTab`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-CAT-01` | `HDR` | Tiêu đề khối | `Quản lý Bộ sưu tập Thẻ Chào` | | Đầu danh sách bộ sưu tập |
| `CARD-CAT-02` | `HDR` | Mô tả phụ | `Tạo và chỉnh sửa các bộ sưu tập mẫu hoa để gửi cho khách hàng` | | Dưới tiêu đề khối |
| `CARD-CAT-03` | `BTN` | Nút tạo mới | `Tạo Bộ Sưu Tập` | | Mở modal tạo catalog |
| `CARD-CAT-04` | `LBL` | Chọn kênh chia sẻ | `Link sao chép dùng cho kênh` | | Chọn Zalo, Facebook, v.v. |
| `CARD-CAT-05` | `LBL` | Ghi chú sao chép | `— link sao chép luôn mang tên bạn; khách mở link được tính cho bạn.` | | Phân định doanh số nhân viên |
| `CARD-CAT-06` | `PH`  | Tùy chọn kênh mặc định | `Không ghi kênh` | | Giá trị rỗng |

---

## 5. Modal Cẩm nang nghiệp vụ (`BrochureUserGuideModal`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-GD-01`  | `HDR` | Tiêu đề modal | `Cẩm nang nghiệp vụ Thẻ Chào & Link Đặt Hoa` | | Tiêu đề popup cẩm nang |
| `CARD-GD-02`  | `TAB` | Tab hướng dẫn Điều hành | `Điều hành & Kế toán` | | Hướng dẫn duyệt tiền cọc |
| `CARD-GD-03`  | `TAB` | Tab hướng dẫn Bán hàng | `Nhân viên Bán hàng (Sale)` | | Hướng dẫn gửi link tư vấn |
| `CARD-GD-04`  | `TAB` | Tab hướng dẫn Thợ & Ship | `Điều phối & Thợ cắm` | | Hướng dẫn cắm hoa theo yêu cầu |
