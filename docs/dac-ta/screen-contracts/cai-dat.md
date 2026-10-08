# Screen Contract — Cài Đặt Tiệm & Cấu Hình Hoạt Động

**Tuyến:** `/cai-dat` · **Tệp chính:** `src/app/(app)/cai-dat/page.tsx` · **Cập nhật:** 27/09/2026 · **Thẻ:** T5.D9

## 1. Vai và mục đích
- Vai chính (03b): `store_manager`, `operations_manager`
- Phạm vi: organization
- Việc chính: Chỉnh sửa nhanh các thông số cơ bản của tiệm tại chỗ (tên tiệm, hotline, địa chỉ, giờ mở cửa) kết hợp liên kết sâu (deep links) đến 4 khu vực thiết lập chuyên sâu.
- Câu hỏi chính: Thông số cơ bản của tiệm hiển thị ra ngoài thế nào, làm sao truy cập nhanh các cài đặt chuyên sâu về AI, mạng xã hội, bộ máy và thương hiệu?
- Mật độ: MEDIUM (giao diện lưới trực quan kết hợp form nhập liệu gọn gàng).

## 2. Hiện trạng (audit)
- API:
  - `GET /api/v1/business-profile` → Đọc thông tin cơ bản của tiệm
  - `PUT /api/v1/business-profile` → Lưu thông tin cơ bản của tiệm (cần quyền `F2` hoặc `H4`)
- Khối: 3 khối chính:
  1. Hướng dẫn chuẩn hóa K1 (`FeatureGuidanceCard` duy nhất)
  2. Lưới liên kết sâu 4 phân hệ thiết lập (`/ho-so`, `/cai-dat-ai`, `/ket-noi`, `/bo-may`)
  3. Form chỉnh sửa nhanh thông số cơ bản (Tên tiệm, Hotline, Địa chỉ, Giờ mở cửa)
- Nút primary: Đúng 1 nút "Lưu cài đặt tiệm" (`variant: "primary"`, chỉ sáng khi form có thay đổi)
- Trạng thái có sẵn: tải ☑ rỗng ☑ lỗi ☑ thành công ☑

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Tên tiệm, hotline, địa chỉ, giờ phục vụ | Form thông số cơ bản |
| L1 Hành động | Lưu cài đặt tiệm, Các thẻ liên kết sâu | Chân form & Lưới liên kết |
| L2 Ngữ cảnh | Hướng dẫn K1, thông báo đồng bộ hóa đơn/Zalo | FeatureGuidanceCard |
| L3 Chi tiết | 4 thẻ liên kết sâu đến từng khu vực chuyên sâu | Lưới 4 cột |

## 4. Hành động
- Chính (1): `Lưu cài đặt tiệm` (`variant: "primary"`, chỉ kích hoạt khi form dirty).
- Phụ (4): Các thẻ liên kết sâu (`Link` có focus-visible và hover effect).

## 5. Content budget
- Nút nổi: Đúng 1 primary action trên toàn màn hình.
- Khối chính: 3 khối rõ ràng, không lồng ghép rườm rà.

## 6. Trạng thái
- Tải: `SkeletonBlock` 4 dòng.
- Lỗi: Alert box màu vàng cảnh báo WCAG.
- Thành công: Alert box màu xanh lá thông báo lưu thành công.

## 7. Responsive
- 390px: Lưới liên kết xếp 1 cột dọc, form nhập liệu 1 cột.
- 768px: Lưới liên kết 2 cột, form 2 cột.
- 1280px+: Lưới liên kết 4 cột, tối đa `max-w-5xl` căn giữa.

## 8. Trợ năng
- Form: Toàn bộ input có label rõ ràng, kết hợp icon trực quan.
- Thẻ liên kết: Dùng thẻ `Link` semantic với `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`.
- Thông báo: Thông báo thành công và lỗi có icon và text rõ nghĩa.

## 9. AI
- Dữ liệu tên tiệm và hotline từ đây được đồng bộ vào các kịch bản AI Content và AI Chat Sales.

## 10. Dữ liệu và quyền
- Nguồn sự thật: Bảng `business_profiles`.
- Quyền: `F2` (sửa hồ sơ) hoặc `H4` (điều hành).

## 11. Component
- Dùng lại: `Button`, `SkeletonBlock`, `FeatureGuidanceCard`.
- Tạo mới: Không.

## 12. Ma trận quyết định
| Hiện tại | Mục tiêu | Quyết định | Lý do | Bằng chứng |
|---|---|---|---|---|
| Tuyến `/cai-dat` đang `COMING_SOON` | Triển khai theo định hướng PO | Tạo trang cài đặt tổng hợp kết hợp liên kết sâu | Đáp ứng đúng yêu cầu người dùng, tiết kiệm thao tác | `cai-dat/page.tsx` |
| Quản lý thiết lập phân tán | Trung tâm hóa thiết lập tiệm | Đặt 4 deep links lên đầu trang | Người dùng dễ dàng định hướng toàn bộ hệ thống | `cai-dat/page.tsx` |

## 13. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai · Việc · IA · Mật độ · Thứ bậc · CTA · Luồng · Trạng thái · Responsive · Trợ năng · Dữ liệu · Quyền · AI · Nhất quán | PASS | Đạt chuẩn 100% |

## 14. Đội ngũ & Phân quyền `/cai-dat/thanh-vien` — tài khoản nhân viên (PO 08/10/2026)
- **Thêm nhân viên** (`A3`, chỉ Điều hành) thay "Mời thành viên": họ tên, email đăng nhập (không cần email thật, mỗi người một email), vai (mặc định Sale) → tài khoản **dùng được ngay**; hộp kết quả hiện email + **mật khẩu tạm một lần** kèm nút "Chép thông tin đăng nhập". Email đã có tài khoản FloraOS → báo lỗi, không chiếm tài khoản người khác.
- Mỗi dòng nhân viên (trừ chính mình): **Đặt lại mật khẩu** (`A7`, hỏi lại; hiện mật khẩu tạm mới, người đó bị đăng xuất mọi máy) · **Tạm khoá / Mở khoá** (`A5`, hỏi lại; khoá là đăng xuất ngay, giữ dữ liệu) · **Phân vai** (`F5`). Trạng thái: Đang hoạt động · Đang tạm khoá · Chờ kích hoạt (lời mời cũ).
- Menu tài khoản (mọi người có `A2`): **Đổi mật khẩu** (mật khẩu hiện tại + mới ≥ 10 ký tự, nhập lại); giữ phiên đang dùng, đăng xuất máy khác.
- Đăng nhập: sai quá 10 lần/15 phút mỗi email → tạm chặn (429).
