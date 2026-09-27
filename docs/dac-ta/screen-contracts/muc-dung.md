# Screen Contract — Mức Dùng & Hạn Mức Credit Của Tiệm

**Tuyến:** `/muc-dung` · **Tệp chính:** `src/app/(app)/muc-dung/page.tsx` · **Cập nhật:** 27/09/2026 · **Thẻ:** T5.D7

## 1. Vai và mục đích
- Vai chính (03b): `store_manager`, `operations_manager` · Vai phụ: `financial_auditor`
- Phạm vi: organization
- Việc chính: Tra cứu số dư credit khả dụng, tổng credit đã tiêu thụ và lịch sử chi tiết các lượt gọi dịch vụ AI theo thời gian thực của tổ chức.
- Câu hỏi chính: Tiệm còn bao nhiêu credit, phân hệ nào tiêu thụ nhiều credit nhất, các giao dịch gần đây được tính phí và hoàn credit ra sao?
- Mật độ: MEDIUM.

## 2. Hiện trạng (audit)
- API:
  - `GET /api/v1/usage/summary` → Tổng hợp mức dùng theo tính năng và số dư credit (cần quyền `G8`)
  - `GET /api/v1/usage` → Danh sách lịch sử giao dịch trừ/hoàn credit (cần quyền `G8`)
- Khối: 4 khối (Hướng dẫn K1 `FeatureGuidanceCard`, Thẻ tổng quan số dư & credit đã dùng, Bảng phân bổ theo phân hệ, Nhật ký giao dịch gần nhất)
- Nút primary: Không cần nút primary (màn hình tra cứu tài nguyên), có nút "Làm mới" `variant: "outline"`
- Phân quyền: Gác quyền `G8`
- Trạng thái có sẵn: tải ☑ rỗng ☑ lỗi ☑ không quyền ☑ thành công ☑

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Số dư credit khả dụng, Tổng credit đã dùng | Thẻ số liệu lớn |
| L1 Hành động | Nút Làm mới | Top Header |
| L2 Ngữ cảnh | Hướng dẫn K1, tên tổ chức, giải thích biểu giá chuẩn & hoàn credit | FeatureGuidanceCard & Chú thích |
| L3 Chi tiết | Bảng phân bổ theo phân hệ (số lượt, chi phí) | Bảng có cấu trúc accessible |
| L4 Lịch sử | Lịch sử giao dịch chi tiết (thời gian, phân hệ, số lượng, credit, trạng thái) | Bảng desktop / Thẻ mobile 390px |

## 4. Hành động
- Chính (0): Màn hình tra cứu (View-only), không có nút primary nổi.
- Phụ (1): `Làm mới` (`variant: "outline"`).

## 5. Content budget
- Nút nổi: 1 nút làm mới trên header.
- Khối chính: 4 khối rõ ràng, mạch lạc.
- Metric Rules: Tuyệt đối không bịa phần trăm biến động ảo; hiển thị số đo thực tế từ backend.

## 6. Trạng thái
- Tải: `SkeletonBlock` thay thế toàn bộ trạng thái chờ nạp dữ liệu.
- Không quyền: Màn hình khóa với icon `Lock` và thông báo mã năng lực `G8`.
- Rỗng: Thông báo chưa có lượt sử dụng nào.
- Lỗi: Alert box màu đỏ nổi bật.

## 7. Responsive
- 390px: Thẻ số liệu xếp 1 cột dọc; bảng lịch sử giao dịch chuyển sang hiển thị dạng thẻ di động tiện lợi.
- 768px: Bảng `<table>` chuẩn, thẻ số liệu 2 cột.
- 1280px+: Tối đa `max-w-6xl` căn giữa.

## 8. Trợ năng
- Bảng biểu: Sử dụng `<caption>`, `<th scope="col">`, `<th scope="row">` đầy đủ.
- Trạng thái: Huy hiệu trạng thái dùng chữ + màu WCAG (`COMPLETED` = xanh lá, `REFUNDED` = cam vàng).
- Focus: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.

## 9. AI
- Là màn hình tra cứu mức tiêu thụ tài nguyên AI của tenant: phản ánh chính xác chi phí credit của các mô hình và cơ chế hoàn credit tự động khi Guard từ chối.

## 10. Dữ liệu và quyền
- Nguồn sự thật: Bảng `usage` và `organizations.credit_balance`.
- Quyền: `G8` (xem mức dùng tổ chức).

## 11. Component
- Dùng lại: `Button`, `Badge`, `SkeletonBlock`, `FeatureGuidanceCard`.
- Tạo mới: Không.

## 12. Ma trận quyết định
| Hiện tại | Mục tiêu | Quyết định | Lý do | Bằng chứng |
|---|---|---|---|---|
| Trang `/muc-dung` đang `COMING_SOON` | Triển khai màn hình thật | Nối `GET /api/v1/usage/summary` và `GET /api/v1/usage` | Hoàn thiện quản trị tài nguyên cho tenant theo P5/D7 | `muc-dung/page.tsx` |
| Bảng số liệu trên mobile | Tránh tràn ngang vỡ giao diện | Chuyển sang card view trên màn <640px | Đạt chuẩn UX mobile 390px | `muc-dung/page.tsx` |

## 13. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai · Việc · IA · Mật độ · Thứ bậc · CTA · Luồng · Trạng thái · Responsive · Trợ năng · Dữ liệu · Quyền · AI · Nhất quán | PASS | Đạt chuẩn 100% |
