# BẢN ĐỒ NỘI DUNG UI — 03. THẺ CHÀO MẪU HOA (`/the-chao`)

> **Màn hình**: Thẻ Chào Mẫu Hoa & Bộ Sưu Tập Bán Hàng  
> **Tuyến đường**: `/the-chao`  
> **Mã phân hệ**: `CARD`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT.

---

## 1. Thanh tiêu đề & Tác vụ góc trên phải (Top Action Header)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-HDR-01` | `HDR` | Breadcrumb | `Sổ đơn hàng` | `Đơn hàng` | Khớp tên module `/don-hang` |
| `CARD-HDR-02` | `HDR` | Tiêu đề lớn `H1` | `Thẻ chào mẫu hoa` | `Thẻ chào mẫu hoa` | Tiêu đề chính |
| `CARD-HDR-03` | `HDR` | Mô tả phụ dưới `H1` | `Gửi khách một bộ sưu tập để lướt xem, chọn mẫu và tự đặt hoa, thanh toán ngay trên điện thoại.` | `Gửi khách bộ sưu tập hoa để xem, chọn mẫu, đặt hàng và thanh toán ngay trên điện thoại.` | Bỏ từ khẩu ngữ "lướt xem" |
| `CARD-BTN-01` | `BTN` | Nút hướng dẫn sử dụng | `Hướng dẫn link đặt hoa` | `Hướng dẫn thẻ chào` | Mở popup hướng dẫn |
| `CARD-BTN-02` | `BTN` | Nút hộp việc | `Hộp việc` | `Việc cần làm` | Thuật ngữ rõ nghĩa |
| `CARD-MOD-01` | `BTN` | Chế độ làm việc: Gửi nhanh | `Gửi nhanh` | `Gửi nhanh` | Chuyển luồng wizard 3 bước |
| `CARD-MOD-02` | `BTN` | Chế độ làm việc: Quản lý | `Quản lý` | `Quản lý` | Chuyển giao diện 5 tab chi tiết |
| `CARD-BTN-03` | `BTN` | Nút làm mới | `Làm mới dữ liệu` | `Làm mới` | 1 từ ngắn gọn theo từ điển |
| `CARD-BTN-04` | `BTN` | Nút xuất dữ liệu | `Xuất Excel` | `Xuất file Excel` | Tải file `the-chao-don-hang.xlsx` |

---

## 2. Thanh Tabs chức năng phân theo vai trò (Manager View)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-TAB-01` | `TAB` | Tab 1 (Quyền `L1`) | `Bộ sưu tập` | `Bộ sưu tập` | Kèm huy hiệu số lượng |
| `CARD-TAB-02` | `TAB` | Tab 2 (Quyền `R1`) | `Theo dõi tiến độ` | `Theo dõi đơn` | Ngắn gọn, trọng tâm |
| `CARD-TAB-03` | `TAB` | Tab 3 (Quyền `R2`) | `Bán hàng` | `Bán hàng` | Hộp việc & link của nhân viên bán hàng |
| `CARD-TAB-04` | `TAB` | Tab 4 (Quyền `R11`) | `Điều hành` | `Điều hành` | PO Decision 2: Giữ theo vai trò |
| `CARD-TAB-05` | `TAB` | Tab 5 (Quyền `R3/R4/R5`) | `Điều phối` | `Điều phối` | PO Decision 2: Giữ theo vai trò |

---

## 3. Cảnh báo Hồ sơ cửa hàng (Shop Profile Readiness)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-RDN-01` | `BTN` | Nút cho Điều hành | `Mở Hồ sơ tiệm` | `Mở hồ sơ cửa hàng` | PO Decision 3: "cửa hàng" |
| `CARD-RDN-02` | `LBL` | Nhãn nhắc nhân viên | `Báo Điều hành cập nhật Hồ sơ tiệm` | `Hồ sơ cửa hàng chưa đủ thông tin. Hãy báo Điều hành cập nhật để tạo link đặt hoa.` | Nêu rõ nguyên nhân và hành động |

---

## 4. Tab Bộ sưu tập (`CatalogListTab`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-CAT-01` | `HDR` | Tiêu đề khối | `Quản lý Bộ sưu tập Thẻ Chào` | `Quản lý bộ sưu tập` | Sentence case |
| `CARD-CAT-02` | `HDR` | Mô tả phụ | `Tạo và chỉnh sửa các bộ sưu tập mẫu hoa để gửi cho khách hàng` | `Tạo và chỉnh sửa các bộ sưu tập mẫu hoa để gửi cho khách hàng.` | Thêm dấu chấm câu |
| `CARD-CAT-03` | `BTN` | Nút tạo mới | `Tạo Bộ Sưu Tập` | `Tạo bộ sưu tập` | Sentence case |
| `CARD-CAT-04` | `LBL` | Chọn kênh chia sẻ | `Link sao chép dùng cho kênh` | `Sao chép link cho kênh` | Tự nhiên, ngắn gọn |
| `CARD-CAT-05` | `LBL` | Ghi chú sao chép | `— link sao chép luôn mang tên bạn; khách mở link được tính cho bạn.` | `Link này gắn với tên bạn. Đơn khách đặt từ link sẽ được tính cho bạn.` | Câu văn hoàn chỉnh |
| `CARD-CAT-06` | `PH`  | Tùy chọn kênh mặc định | `Không ghi kênh` | `Không chọn kênh` | Rõ nghĩa |

---

## 5. Modal Cẩm nang hướng dẫn (`BrochureUserGuideModal`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD-GD-01`  | `HDR` | Tiêu đề modal | `Cẩm nang nghiệp vụ Thẻ Chào & Link Đặt Hoa` | `Hướng dẫn dùng Thẻ chào mẫu hoa` | Bỏ từ "nghiệp vụ", Sentence case |
| `CARD-GD-02`  | `TAB` | Tab hướng dẫn Điều hành | `Điều hành & Kế toán` | `Điều hành và kế toán` | Dùng "và" thay cho `&` |
| `CARD-GD-03`  | `TAB` | Tab hướng dẫn Bán hàng | `Nhân viên Bán hàng (Sale)` | `Nhân viên bán hàng` | Bỏ tiếng Anh "(Sale)" |
| `CARD-GD-04`  | `TAB` | Tab hướng dẫn Thợ & Ship | `Điều phối & Thợ cắm` | `Điều phối và thợ cắm hoa` | Rõ ràng, Sentence case |
