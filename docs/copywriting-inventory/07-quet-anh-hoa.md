# BẢN ĐỒ NỘI DUNG UI — 07. QUÉT ẢNH HOA (`/tai-anh`)

> **Màn hình**: Quét Ảnh Hoa & Nhận Diện AI  
> **Tuyến đường**: `/tai-anh`  
> **Mã phân hệ**: `SCAN`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT.

---

## 1. Thanh tiêu đề & Các chặng phân tích (`FlowSteps`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-HDR-01` | `HDR` | Tiêu đề chính trang | `Quét Ảnh Hoa & Nhận Diện AI` | `Quét ảnh hoa` | Tiêu đề ngắn gọn theo từ điển |
| `SCN-HDR-02` | `HDR` | Mô tả phụ trang | `Tự động bóc tách thành phần hoa, định dạng thiết kế và sinh bài viết thương mại từ ảnh chụp thực tế` | `Chụp ảnh hoa, AI nhận ra loại hoa và số cành, rồi tạo sẵn bài giới thiệu và kịch bản tư vấn.` | Bỏ từ dịch máy "bóc tách", "sinh" |
| `SCN-STP-01` | `TAB` | Chặng 1 | `1. Nhận diện thị giác` | `Nhận diện ảnh` | Bỏ số thứ tự, bỏ từ "thị giác" |
| `SCN-STP-02` | `TAB` | Chặng 2 | `2. Bài viết thương mại` | `Bài giới thiệu` | Bỏ số thứ tự, bỏ từ "thương mại" |
| `SCN-STP-03` | `TAB` | Chặng 3 | `3. Kịch bản tư vấn & Báo giá` | `Tư vấn khách` | Bỏ số thứ tự |

---

## 2. Chặng 1: Khối hướng dẫn & Tải ảnh (`M01aGuidanceCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-GDC-01` | `BDG` | Huy hiệu hướng dẫn | `HƯỚNG DẪN NHẬN DIỆN THỊ GIÁC M01A` | `HƯỚNG DẪN CHỤP ẢNH HOA` | Xóa mã M01A (UX Lint R8) |
| `SCN-GDC-02` | `HDR` | Tiêu đề hướng dẫn | `Tiêu chuẩn chụp ảnh hoa để AI bóc tách chính xác` | `Chụp ảnh thế nào để AI nhận diện chính xác hơn` | Bỏ từ "bóc tách" |
| `SCN-GDC-03` | `LBL` | Mô tả hướng dẫn | `Chụp ảnh mẫu hoa ở góc chính diện, đủ ánh sáng và phông nền gọn gàng để hệ thống nhận diện đúng 95% loài hoa và số lượng cành.` | `Chụp chính diện, đủ sáng và phông nền gọn để AI nhận diện đúng loại hoa và số cành.` | Loại bỏ cam kết "95%" (P0) |
| `SCN-GDC-04` | `LBL` | Mẹo 1 | `📸 Chụp đủ toàn bộ bó/giỏ hoa, tránh bị che khuất phần gốc hoặc ngọn` | `Chụp đủ cả bó hoặc giỏ hoa, không để che phần gốc hay ngọn` | Chuyển emoji sang icon SVG |
| `SCN-GDC-05` | `LBL` | Mẹo 2 | `💡 Tránh chụp ngược sáng hoặc bóng đổ quá gắt lên cánh hoa` | `Tránh chụp ngược sáng hoặc để bóng đổ gắt lên cánh hoa` | Chuyển emoji sang icon SVG |
| `SCN-GDC-06` | `LBL` | Mẹo 3 | `✨ Ảnh càng rõ nét, trợ lý AI càng bóc tách đúng từng loại lá đệm và phụ kiện` | `Ảnh càng rõ nét, AI càng nhận ra đúng lá phụ và phụ kiện` | Chuyển emoji sang icon SVG |
| `SCN-UP-01`  | `LBL` | Khu vực tải ảnh | `Kéo thả ảnh hoa vào đây hoặc chụp trực tiếp` | `Kéo thả ảnh vào đây, bấm để chọn file hoặc chụp trực tiếp (JPG, PNG, WebP tối đa 10 MB)` | Thêm thông số dung lượng |
| `SCN-BTN-01` | `BTN` | Nút kích hoạt AI | `Bắt đầu phân tích AI` | `Phân tích ảnh` | Động từ hành động theo từ điển |

---

## 3. Chặng 2: Sinh bài viết thương mại (`CommercialContentCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-CPY-01` | `HDR` | Tiêu đề khối | `Gợi ý tên thương mại & Câu chuyện sản phẩm` | `Gợi ý tên và câu chuyện cho mẫu hoa` | Tự nhiên, Sentence case |
| `SCN-CPY-02` | `LBL` | Nhãn tên thương mại | `Tên mẫu hoa đề xuất` | `Gợi ý tên mẫu hoa` | Gợi ý tên |
| `SCN-CPY-03` | `LBL` | Nhãn câu chuyện | `Câu chuyện & Thông điệp cảm xúc` | `Câu chuyện và thông điệp` | Dùng "và" thay cho `&` |
| `SCN-CPY-04` | `LBL` | Nhãn dịp tặng | `Dịp tặng hoa phù hợp` | `Dịp tặng phù hợp` | Nhãn tags |
| `SCN-CPY-05` | `LBL` | Nhãn điểm bán hàng | `Điểm nổi bật của mẫu hoa (Key Selling Points)` | `Điểm nổi bật khi tư vấn bán` | Bỏ tiếng Anh Key Selling Points |
| `SCN-BTN-02` | `BTN` | Nút duyệt nội dung | `Duyệt & Lưu nội dung` | `Lưu và tiếp tục` | Động từ rõ ràng |

---

## 4. Chặng 3: Kịch bản tư vấn Zalo & Báo giá (`SalesPitchCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SCN-PTC-01` | `HDR` | Tiêu đề khối | `Kịch bản tư vấn khách hàng (Zalo / Hotline)` | `Kịch bản tư vấn khách (Zalo, điện thoại)` | Tiếng Việt rõ ràng |
| `SCN-PTC-02` | `LBL` | Nhãn lời chào | `Lời chào & Giới thiệu mẫu hoa` | `Lời chào và giới thiệu mẫu hoa` | Dùng "và" thay cho `&` |
| `SCN-PTC-03` | `LBL` | Nhãn quà tặng cam kết | `Quà tặng kèm & Cam kết từ tiệm` | `Quà tặng và cam kết của cửa hàng` | PO Decision 3: "cửa hàng" |
| `SCN-BTN-03` | `BTN` | Nút sao chép kịch bản | `Sao chép kịch bản 1 chạm` | `Sao chép kịch bản` | Ngắn gọn, chuẩn |
| `SCN-BTN-04` | `BTN` | Nút hoàn tất | `Tạo thành sản phẩm chính thức` | `Lưu thành mẫu hoa` | Thống nhất từ "mẫu hoa" |
