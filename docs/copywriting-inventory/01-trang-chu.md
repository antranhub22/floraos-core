# BẢN ĐỒ NỘI DUNG UI — 01. TRANG CHỦ (`/`)

> **Màn hình**: Trang chủ Cửa hàng (Hành trình tác vụ & ChoiceGrid)  
> **Tuyến đường**: `/`  
> **Mã phân hệ**: `HOME`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Khối Tiêu đề & Thanh điều hướng trên cùng (Header & Bar)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HOME-HDR-01` | `HDR` | Huy hiệu nhỏ trên tiêu đề | `HÀNH TRÌNH TÁC VỤ THÔNG MINH` | | Viên thuốc nhỏ phía trên `H1` |
| `HOME-HDR-02` | `HDR` | Tiêu đề chính `H1` | `BẠN MUỐN LÀM GÌ CHO CỬA HÀNG?` | | Câu hỏi định hướng trọng tâm |
| `HOME-HDR-03` | `HDR` | Mô tả phụ dưới `H1` | `Chọn một tác vụ để bắt đầu hành trình làm việc có định hướng cho cửa hàng hoa` | | Định hướng thao tác cho nhân viên |
| `HOME-BTN-01` | `BTN` | Góc trên bên phải | `Chế độ chuyên gia` | | Nút chuyển sang Dashboard số liệu |
| `HOME-BTN-02` | `BTN` | Thanh chuyển đổi Chế độ chuyên gia | `Chuyển sang Chế độ hành trình tác vụ` | | Hiện khi đang bật Chế độ chuyên gia |
| `HOME-HDR-04` | `HDR` | Banner thông báo Chế độ chuyên gia | `Bạn đang ở Chế độ chuyên gia (Bảng điều khiển trực tiếp)` | | Dòng nhắc nhở trên đầu Dashboard |

---

## 2. Thanh lọc danh mục & Tìm kiếm (Filter & Search)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HOME-TAB-01` | `TAB` | Tab 1 | `Tất cả ({{count}})` | | Hiển thị tổng số tác vụ |
| `HOME-TAB-02` | `TAB` | Tab 2 | `Tác vụ đơn` | | Lọc các chức năng thao tác nhanh |
| `HOME-TAB-03` | `TAB` | Tab 3 | `Gói quy trình` | | Lọc các combo đa bước |
| `HOME-TAB-04` | `TAB` | Tab 4 | `Trợ lý ảo` | | Lọc tính năng trợ lý AI |
| `HOME-PH-01` | `PH` | Ô tìm kiếm tác vụ | `Tìm tác vụ mong muốn...` | | Gợi ý tìm kiếm nhanh |
| `HOME-EMP-01` | `EMP` | Khi tìm kiếm không có kết quả | `Không tìm thấy tác vụ phù hợp với từ khóa “{{searchQuery}}”.` | | Giữ nguyên biến `{{searchQuery}}` |

---

## 3. Thẻ tiêu điểm trọng tâm (Featured Spotlight Card — Thẻ Chào Mẫu Hoa)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HOME-FBDG-01`| `BDG` | Huy hiệu trên cùng bên trái | `TÍNH NĂNG TRỌNG TÂM` | | Huy hiệu màu cam nổi bật |
| `HOME-FBDG-02`| `BDG` | Trạng thái sẵn sàng | `Sẵn sàng phục vụ` | | Chấm tròn xanh lá cây |
| `HOME-FHDR-01`| `HDR` | Tiêu đề thẻ tiêu điểm | `Thẻ Chào mẫu hoa` | | Điểm chạm chính của tiệm |
| `HOME-FDES-01`| `HDR` | Mô tả chi tiết thẻ tiêu điểm | `Tạo bộ sưu tập hoa, gửi link cho khách lướt chọn mẫu, theo dõi thanh toán và điều phối cắm hoa giao đến tay người nhận` | | Mô tả trọn vẹn luồng bán hàng |
| `HOME-FTIP-01`| `LBL` | Điểm nổi bật 1 | `Gửi link chọn mẫu qua Zalo` | | Lợi ích cho nhân viên sale |
| `HOME-FTIP-02`| `LBL` | Điểm nổi bật 2 | `Khách tự chọn & gửi lời chúc` | | Lợi ích cho người mua |
| `HOME-FTIP-03`| `LBL` | Điểm nổi bật 3 | `Tự động nhận đơn & điều phối` | | Lợi ích cho vận hành |
| `HOME-FBTN-01`| `BTN` | Nút kêu gọi hành động (CTA) | `Mở Thẻ Chào & Tạo Link` | | Nút lớn màu đỏ góc phải |
| `HOME-FSUB-01`| `LBL` | Dòng ghi chú dưới nút CTA | `Khuyên dùng mỗi ngày cho tiệm` | | Nhắc nhở tần suất sử dụng |

---

## 4. Lưới thẻ chức năng (Action Cards — 13 Thẻ còn lại)

| Mã Copy | Loại | Tên thẻ (Goal) | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Trạng thái Production |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HOME-CRD-01T`| `HDR` | Báo cáo | `Xem báo cáo` | | Sắp ra mắt |
| `HOME-CRD-01D`| `HDR` | Mô tả | `Nắm bắt doanh thu, đơn hàng, mức độ sử dụng FloraOS và kho tư liệu đã tạo` | | Sắp ra mắt |
| `HOME-CRD-02T`| `HDR` | Xu hướng | `Xem mẫu hoa đang được yêu thích` | | Sắp ra mắt |
| `HOME-CRD-02D`| `HDR` | Mô tả | `Biết khách đang chuộng kiểu hoa, màu sắc và mức giá nào để tiệm cắm bán theo` | | Sắp ra mắt |
| `HOME-CRD-03T`| `HDR` | Quét ảnh | `Tạo Thẻ sản phẩm từ ảnh` | | Sắp ra mắt |
| `HOME-CRD-03D`| `HDR` | Mô tả | `Chụp ảnh hoa tại tiệm để tự động phân tích loại hoa, ước tính chi phí và tạo mẫu bán` | | Sắp ra mắt |
| `HOME-CRD-04T`| `HDR` | Báo giá | `Tạo Thẻ báo giá sản phẩm` | | Sắp ra mắt |
| `HOME-CRD-04D`| `HDR` | Mô tả | `Tạo bộ báo giá hoa theo nhu cầu khách mua hoa hoặc thẻ báo giá cho đối tác shop` | | Sắp ra mắt |
| `HOME-CRD-05T`| `HDR` | Viết bài | `Viết nội dung bài đăng cho các nền tảng` | | Sắp ra mắt |
| `HOME-CRD-05D`| `HDR` | Mô tả | `Soạn bài viết Facebook, Instagram, TikTok đúng giọng điệu của tiệm kèm gợi ý hashtag` | | Sắp ra mắt |
| `HOME-CRD-06T`| `HDR` | Giọng đọc | `Tạo giọng đọc cho bài đăng` | | Sắp ra mắt |
| `HOME-CRD-06D`| `HDR` | Mô tả | `Chuyển bài viết thành giọng đọc truyền cảm để ghép vào video giới thiệu mẫu hoa` | | Sắp ra mắt |
| `HOME-CRD-07T`| `HDR` | Ảnh mẫu | `Tạo ảnh quảng cáo từ ảnh gốc` | | Sắp ra mắt |
| `HOME-CRD-07D`| `HDR` | Mô tả | `Tách nền, phối cảnh studio sang trọng hoặc đặt hoa vào không gian tiệc/sự kiện thực tế` | | Sắp ra mắt |
| `HOME-CRD-08T`| `HDR` | Video | `Tạo video chuyển động từ ảnh hoa` | | Sắp ra mắt |
| `HOME-CRD-08D`| `HDR` | Mô tả | `Tạo video ngắn chuyển động mượt mà từ ảnh chụp bó hoa để đăng Story/Reels/TikTok` | | Sắp ra mắt |
| `HOME-CRD-09T`| `HDR` | Trang bán | `Tạo trang giới thiệu và bán hoa` | | Sắp ra mắt |
| `HOME-CRD-09D`| `HDR` | Mô tả | `Tạo trang web giới thiệu bộ sưu tập hoa kèm mã QR để in gắn lên thiệp hoặc quầy thu ngân` | | Sắp ra mắt |
| `HOME-CRD-10T`| `HDR` | Đơn hàng | `Tiếp nhận & Xử lý đơn hàng (Dành cho Điện Hoa)`| | Sắp ra mắt |
| `HOME-CRD-10D`| `HDR` | Mô tả | `Theo dõi đơn từ lúc chốt, phân công thợ cắm đến khi giao tận tay người nhận` | | Sắp ra mắt |
| `HOME-CRD-11T`| `HDR` | Khách hàng | `Quản lý khách hàng` | | Sắp ra mắt |
| `HOME-CRD-11D`| `HDR` | Mô tả | `Lưu sở thích hoa, ngày sinh nhật, dịp kỷ niệm và lịch sử đặt hoa của từng khách quen` | | Sắp ra mắt |
| `HOME-CRD-12T`| `HDR` | Combo | `Ra mắt mẫu hoa mới` | | Sắp ra mắt |
| `HOME-CRD-12D`| `HDR` | Mô tả | `Từ 1 ảnh chụp hoa: Phân tích thành phần → Tạo thẻ sản phẩm → Viết bài → Ghép ảnh quảng cáo` | | Sắp ra mắt |
| `HOME-CRD-13T`| `HDR` | Chatbot | `Trợ lý FloraOS Chat` | | Sắp ra mắt |
| `HOME-CRD-13D`| `HDR` | Mô tả | `Trợ lý ảo thông minh trả lời câu hỏi và hướng dẫn bạn vận hành tiệm hoa hiệu quả` | | Sắp ra mắt |

---

## 5. Nhãn chân thẻ & Trạng thái khóa (Card Footer & Badges)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HOME-CBTN-01`| `BTN` | Thẻ đang mở | `Bắt đầu ngay` | | Nhãn nút trên thẻ mở |
| `HOME-CBTN-02`| `BDG` | Thẻ bị khóa | `Sắp ra mắt` | | Huy hiệu trên các thẻ khóa |
| `HOME-CBTN-03`| `LBL` | Thẻ combo | `{{count}} bước liền mạch` | | Ví dụ: `4 bước liền mạch` |
| `HOME-CBTN-04`| `BTN` | Thẻ AI Chat | `Trò chuyện ngay` | | Nhãn nút thẻ trợ lý ảo |
