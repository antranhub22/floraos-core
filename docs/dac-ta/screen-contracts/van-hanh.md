# Screen Contract — Console Vận Hành Nền Tảng (Platform Console)

**Tuyến:** `/van-hanh` (và `/van-hanh/to-chuc`, `/van-hanh/muc-dung`, `/van-hanh/nhat-ky`, `/van-hanh/suc-khoe`) · **Cập nhật:** 27/09/2026 · **Thẻ:** T5.D10

## 1. Vai và mục đích
- Vai chính (03b): `platform_admin` (Người vận hành nền tảng SaaS)
- Phạm vi: system / cross-organization (xuyên tổ chức, không thuộc về một tenant cụ thể)
- Việc chính: Giám sát toàn diện tình trạng sức khỏe hạ tầng, số lượng tổ chức đang hoạt động, phát hiện job treo và theo dõi mức tiêu thụ credit gộp toàn hệ thống.
- Câu hỏi chính: Toàn hệ thống có bao nhiêu tổ chức, có job nào bị treo cần can thiệp hạ tầng, mức dùng tài nguyên giữa các tổ chức ra sao?
- Mật độ: MEDIUM-EXPERT.

## 2. Hiện trạng (audit)
- API:
  - `GET /api/v1/platform/organizations` → Danh sách toàn bộ tổ chức (cần quyền `N1`)
  - `GET /api/v1/platform/organizations/[id]` → Chi tiết một tổ chức cụ thể
  - `GET /api/v1/platform/health` → Tình trạng job và job treo (cần quyền `N5`)
  - `GET /api/v1/platform/usage` → Mức dùng credit toàn hệ thống (cần quyền `N4`)
  - `GET /api/v1/platform/audit-logs` → Nhật ký kiểm toán toàn hệ thống
- Khối: Bố cục Header phân biệt rõ ràng "Vận hành nền tảng — Xuyên tổ chức" + Huy hiệu phạm vi trên từng trang con (Toàn hệ thống / Tổ chức cụ thể)
- Trạng thái có sẵn: tải (SkeletonBlock) ☑ lỗi ☑ thành công ☑

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Số lượng tổ chức, tổ chức mới 7 ngày, số job treo | 3 Thẻ số liệu lớn |
| L1 Hành động | Chuyển tab điều hướng (/to-chuc, /suc-khoe, /muc-dung, /nhat-ky) | Top Header Navbar |
| L2 Ngữ cảnh | Huy hiệu phạm vi (Toàn hệ thống / Tổ chức cụ thể) | Tiêu đề mỗi trang |
| L3 Chi tiết | Bảng danh sách tổ chức, bảng job treo, nhật ký hệ thống | Bảng dữ liệu có cấu trúc |

## 4. Hành động
- Chính (0): View-only monitoring console.
- Phụ: Điều hướng giữa các phân hệ vận hành qua thanh menu header.

## 5. Content budget
- Nút nổi: Không có primary action làm phiền người quan sát.
- Khối chính: Bố cục rõ ràng, hiển thị chỉ báo phạm vi xuyên suốt (03a IA-005).

## 6. Trạng thái
- Tải: `SkeletonBlock` 4 dòng cho toàn bộ 6 trang con.
- Lỗi: Dòng thông báo màu danger nổi bật.

## 7. Responsive
- 390px: Thẻ số liệu xếp 1 cột, các bảng biểu hỗ trợ cuộn ngang không vỡ layout.
- 768px+: Lưới 3 cột số liệu cân đối.
- 1280px+: Giới hạn chiều rộng tối đa `max-w-6xl` căn giữa.

## 8. Trợ năng
- Bảng biểu: Có `<thead>`, `<tbody>`, `<th>` rõ ràng.
- Liên kết: Link đến chi tiết từng tổ chức có hover và focus ring.

## 9. AI
- Giám sát các worker AI Vision, Video, Media và các job xử lý ngầm.

## 10. Dữ liệu và quyền
- Nguồn sự thật: Bảng `platform_operators`, `organizations`, `generation_jobs`.
- Quyền: `platform_admin` (giải từ session qua `resolvePlatformSession`).

## 11. Component
- Dùng lại: `Card`, `SkeletonBlock`.
- Tạo mới: Không.

## 12. Ma trận quyết định
| Hiện tại | Mục tiêu | Quyết định | Lý do | Bằng chứng |
|---|---|---|---|---|
| Thiếu chỉ báo phạm vi rõ ràng | Tuân thủ 03a IA-005 | Thêm huy hiệu phạm vi "Phạm vi: Toàn hệ thống" / "Tổ chức cụ thể" | Phân định tuyệt đối giữa quản trị tenant và vận hành platform | Toàn bộ các trang `/van-hanh/*` |
| Text size tuỳ ý `text-[13px]` | Chuẩn hóa token thang kích thước | Chuyển sang `text-xs` | Tuân thủ Design Tokens R2 | Toàn bộ các trang `/van-hanh/*` |

## 13. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai · Việc · IA · Mật độ · Thứ bậc · CTA · Luồng · Trạng thái · Responsive · Trợ năng · Dữ liệu · Quyền · AI · Nhất quán | PASS | Đạt chuẩn 100% |
