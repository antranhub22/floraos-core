# Screen Contract — Kho Dữ Liệu Sản Phẩm & Sale Pitch

**Tuyến:** `/kho-du-lieu` · **Tệp chính:** `src/app/(app)/kho-du-lieu/page.tsx` · **Thành phần:** `src/components/storage/account-storage-hub.tsx` · **Cập nhật:** 27/09/2026 · **Thẻ:** T5.D6

## 1. Vai và mục đích
- Vai chính (03b): `store_manager`, `florist`, `sales_specialist`
- Phạm vi: organization
- Việc chính: Quản lý và tra cứu 3 phân vùng dữ liệu tài sản của cửa hàng:
  1. Ảnh gốc tải lên chưa qua phân tích
  2. Ảnh đã được AI nhận diện và duyệt kết quả (chờ sinh nội dung/catalog)
  3. Kịch bản chào hàng (Sale Pitch) đã chốt hoàn thiện
- Câu hỏi chính: Tiệm đã có bao nhiêu ảnh gốc, ảnh nào đã duyệt xong chờ lên bài, kịch bản tư vấn nào đã sẵn sàng copy gửi khách?
- Mật độ: MEDIUM (lưới thẻ ảnh trực quan, hỗ trợ tìm kiếm nhanh theo tên sản phẩm, loại hoa, dịp tặng).

## 2. Hiện trạng (audit)
- API:
  - `GET /api/v1/assets` → Tải danh mục ảnh gốc của tổ chức
  - `GET /api/v1/vision/analyses?approval_state=APPROVED` → Tải danh sách kết quả phân tích đã duyệt
  - Đồng bộ localStorage cho các kịch bản chào hàng Sale Pitch đã chốt
- Khối: 3 khối chính (Header trang, Khung điều hướng 3 Tab `TabActionHeader` chuẩn hóa K2, Lưới thẻ nội dung theo từng phân vùng)
- Nút primary: Đúng 1 nút primary cho mỗi tab (Tab 1: "+ Tải ảnh mới", Tab 2: "Làm mới", Tab 3: "+ Tạo Thẻ Chào mới")
- TabActionHeader: Chuẩn hóa K2 (Tabs ở bên trái + Actions ở góc trên cùng bên phải + menu `...` overflow)
- Trạng thái có sẵn: tải ☑ rỗng ☑ lỗi ☑ thành công ☑

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Thumbnail ảnh, tên sản phẩm, số lượng hoa | Thẻ từng tài sản trong lưới |
| L1 Hành động | Tải ảnh mới, Phân tích ảnh, Copy kịch bản Zalo 1-chạm | Nút tác vụ chính trên thẻ & Top Header |
| L2 Ngữ cảnh | Huy hiệu trạng thái (Mới tải lên, Đã duyệt, Đang có kịch bản), phong cách, dịp tặng | Badge trên ảnh & Thông tin chi tiết |
| L3 Chi tiết | Bảng danh sách thành phần hoa (BOM), mã sản phẩm, giá bán dự kiến | Modal / Drawer chi tiết |

## 4. Hành động
- Chính (1): `+ Tải ảnh mới để phân tích` (`variant: "primary"` ở header).
- Phụ (≤ 2):
  - `Làm mới kho ảnh` (`variant: "outline"`).
  - `Sao chép kịch bản Zalo` (`variant: "outline"`).
  - `Xem chi tiết` / `Chỉnh sửa`.
- Menu `…`: `TabActionHeader` overflow actions cho các tác vụ phụ.

## 5. Content budget
- Nút nổi: Đúng 1 primary action trên mỗi view.
- Khối chính: Bố cục lưới thẻ cân đối, responsive từ 2 cột (mobile) đến 5 cột (desktop).

## 6. Trạng thái
- Tải: Spinner quay nhẹ ở nút làm mới, giữ trạng thái mượt mà.
- Rỗng: Khối nét đứt với icon và mô tả hướng dẫn tải ảnh hoặc tạo kịch bản mới.
- Thành công: Hiệu ứng tích xanh "Đã sao chép" khi copy kịch bản Zalo.

## 7. Responsive
- 390px: Lưới 2 cột cho ảnh gốc, 1 cột cho thẻ kịch bản sale pitch.
- 768px: Lưới 3-4 cột.
- 1280px+: Lưới 5 cột rộng rãi, tối đa chiều rộng `max-w-7xl`.

## 8. Trợ năng
- Bàn phím: Các tab và nút đều hỗ trợ điều hướng phím Tab.
- Focus: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.
- Nhãn ảnh: Toàn bộ ảnh đều có thuộc tính `alt` mô tả tên sản phẩm.

## 9. AI
- Là kho lưu trữ kết nối trực tiếp với kết quả nhận diện AI Vision và kịch bản Sale Pitch tạo từ AI.

## 10. Dữ liệu và quyền
- Nguồn sự thật: Bảng `assets`, `vision_analyses`, và local storage pitch.
- Quyền: Mọi nhân viên trong tổ chức có thể xem và khai thác kho dữ liệu sản phẩm.

## 11. Component
- Dùng lại: `Button`, `Card`, `Badge`, `TabActionHeader`.
- Tạo mới: Không.

## 12. Ma trận quyết định
| Hiện tại | Mục tiêu | Quyết định | Lý do | Bằng chứng |
|---|---|---|---|---|
| Button dùng class `bg-primary hover:bg-primary/90` | Token ngữ nghĩa | Chuyển sang `variant="primary"` | Tuân thủ Design Tokens của hệ thống | `kho-du-lieu/page.tsx` |
| Quản lý 3 phân vùng riêng lẻ | Tập trung hóa trải nghiệm | Duy trì 3 tab chuẩn hóa `TabActionHeader` | Đạt chuẩn K2 với góc trên bên phải nhất quán | `account-storage-hub.tsx` |

## 13. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai · Việc · IA · Mật độ · Thứ bậc · CTA · Luồng · Trạng thái · Responsive · Trợ năng · Dữ liệu · Quyền · AI · Nhất quán | PASS | Đạt chuẩn 100% |
