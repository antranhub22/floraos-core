# BẢN ĐỒ NỘI DUNG UI — 07. QUÉT ẢNH HOA (`/tai-anh`)

> **Màn hình**: Quét Ảnh Hoa & Thị Giác Máy Tính AI  
> **Tuyến đường**: `/tai-anh`  
> **Mã phân hệ**: `SCAN`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Các chặng phân tích (`FlowSteps`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-HDR-01` | `HDR` | Tiêu đề chính trang | `Quét Ảnh Hoa & Nhận Diện AI` | | Tiêu đề lớn `H1` |
| `SCN-HDR-02` | `HDR` | Mô tả phụ trang | `Tự động bóc tách thành phần hoa, định dạng thiết kế và sinh bài viết thương mại từ ảnh chụp thực tế` | | Định hướng nghiệp vụ |
| `SCN-STP-01` | `TAB` | Chặng 1 | `1. Nhận diện thị giác` | | Bóc tách cành, hoa |
| `SCN-STP-02` | `TAB` | Chặng 2 | `2. Bài viết thương mại` | | Sinh tên hoa, câu chuyện |
| `SCN-STP-03` | `TAB` | Chặng 3 | `3. Kịch bản tư vấn & Báo giá` | | Kịch bản Zalo & giá |

---

## 2. Chặng 1: Khối hướng dẫn & Tải ảnh (`M01aGuidanceCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-GDC-01` | `BDG` | Huy hiệu hướng dẫn | `HƯỚNG DẪN NHẬN DIỆN THỊ GIÁC M01A` | | *Nên bỏ chữ "M01A" theo UX Lint R8* |
| `SCN-GDC-02` | `HDR` | Tiêu đề hướng dẫn | `Tiêu chuẩn chụp ảnh hoa để AI bóc tách chính xác` | | Trọng tâm chụp ảnh |
| `SCN-GDC-03` | `LBL` | Mô tả hướng dẫn | `Chụp ảnh mẫu hoa ở góc chính diện, đủ ánh sáng và phông nền gọn gàng để hệ thống nhận diện đúng 95% loài hoa và số lượng cành.` | | Lưu ý ánh sáng |
| `SCN-GDC-04` | `LBL` | Mẹo 1 | `📸 Chụp đủ toàn bộ bó/giỏ hoa, tránh bị che khuất phần gốc hoặc ngọn` | | Mẹo thao tác |
| `SCN-GDC-05` | `LBL` | Mẹo 2 | `💡 Tránh chụp ngược sáng hoặc bóng đổ quá gắt lên cánh hoa` | | Mẹo thao tác |
| `SCN-GDC-06` | `LBL` | Mẹo 3 | `✨ Ảnh càng rõ nét, trợ lý AI càng bóc tách đúng từng loại lá đệm và phụ kiện` | | Mẹo thao tác |
| `SCN-UP-01`  | `LBL` | Khu vực tải ảnh | `Kéo thả ảnh hoa vào đây hoặc chụp trực tiếp` | | Dropzone |
| `SCN-BTN-01` | `BTN` | Nút kích hoạt AI | `Bắt đầu phân tích AI` | | Kích hoạt job |

---

## 3. Chặng 2: Sinh bài viết thương mại (`CommercialContentCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-CPY-01` | `HDR` | Tiêu đề khối | `Gợi ý tên thương mại & Câu chuyện sản phẩm` | | Kết quả sinh văn bản |
| `SCN-CPY-02` | `LBL` | Nhãn tên thương mại | `Tên mẫu hoa đề xuất` | | Gợi ý 3 phương án |
| `SCN-CPY-03` | `LBL` | Nhãn câu chuyện | `Câu chuyện & Thông điệp cảm xúc` | | Đoạn văn cảm xúc |
| `SCN-CPY-04` | `LBL` | Nhãn dịp tặng | `Dịp tặng hoa phù hợp` | | Tags dịp tặng |
| `SCN-CPY-05` | `LBL` | Nhãn điểm bán hàng | `Điểm nổi bật của mẫu hoa (Key Selling Points)` | | Bullet points |
| `SCN-BTN-02` | `BTN` | Nút duyệt nội dung | `Duyệt & Lưu nội dung` | | Chuyển chặng 3 |

---

## 4. Chặng 3: Kịch bản tư vấn Zalo & Báo giá (`SalesPitchCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-PTC-01` | `HDR` | Tiêu đề khối | `Kịch bản tư vấn khách hàng (Zalo / Hotline)` | | Soạn sẵn cho Sale |
| `SCN-PTC-02` | `LBL` | Nhãn lời chào | `Lời chào & Giới thiệu mẫu hoa` | | Theo tên tiệm |
| `SCN-PTC-03` | `LBL` | Nhãn quà tặng cam kết | `Quà tặng kèm & Cam kết từ tiệm` | | Tặng thiệp, đổi trả... |
| `SCN-BTN-03` | `BTN` | Nút sao chép kịch bản | `Sao chép kịch bản 1 chạm` | | Copy vào clipboard |
| `SCN-BTN-04` | `BTN` | Nút hoàn tất | `Tạo thành sản phẩm chính thức` | | Đưa vào `/san-pham` |
