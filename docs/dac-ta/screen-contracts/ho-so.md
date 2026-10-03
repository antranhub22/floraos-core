# Screen Contract — Hồ sơ cửa hàng & Nhận diện thương hiệu (`/ho-so`)

**Tuyến:** `/ho-so` · **Tệp chính:** `src/app/(app)/ho-so/page.tsx`, `src/components/profiles/*`, `src/components/organization/occasions-settings-form.tsx` · **Cập nhật:** 27/09/2026 · **Thẻ:** T5.B8

## 1. Vai và mục đích
- **Vai chính (03b):** `store_manager`, `marketer`.
- **Phạm vi:** organization (cấu hình nguồn chân lý duy nhất SSOT cho nhận diện tiệm hoa).
- **Việc chính:** Thiết lập thông tin liên hệ, hotline/Zalo, 5 mã màu hex nhận diện thương hiệu, chính sách đổi trả, kịch bản chào khách và danh mục dịp lễ.
- **Câu hỏi chính:** "Thông tin cửa hàng và nhận diện thương hiệu đã đủ để AI làm việc chưa?"
- **Mật độ:** MEDIUM (4 tab nghiệp vụ phân tách rõ ràng).

## 2. Hiện trạng (audit)
- **API:**
  - `GET /api/v1/profiles` → `N2` (`organization.read`)
  - `PUT /api/v1/profiles/business` → `N2` (`organization.write`)
  - `PUT /api/v1/profiles/brand` → `N2` (`organization.write`)
  - `GET /api/v1/template-overrides` → `N2` (`organization.read`)
  - `PUT /api/v1/template-overrides` → `N2` (`organization.write`)
  - `GET /api/v1/organization/occasions` → `N2` (`organization.read`)
  - `POST /api/v1/organization/occasions` → `N2` (`organization.write`)
- **Khối:** 1 FeatureGuidanceCard duy nhất theo chuẩn K1, TabActionHeader 4 tab, form nhập liệu theo tab.
- **Nút primary:** Tối đa 1 nút chính trên mỗi form tab (Lưu hồ sơ / Thêm dịp).
- **Trạng thái có sẵn:** Tải (`SkeletonBlock lines={5}`), Lỗi (Alert banner đỏ), Thành công (Alert banner xanh).

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Hướng dẫn K1 `FeatureGuidanceCard`, TabActionHeader 4 tab | Đỉnh trang |
| L1 Hành động | Form nhập liệu theo tab đang chọn kèm nút Lưu chính | Giữa trang |
| L2 Chi tiết tab | Tab 1: Hồ sơ kinh doanh · Tab 2: Nhận diện thương hiệu · Tab 3: Chính sách · Tab 4: Dịp lễ | Trong từng view tab |
| L3 Tiện ích | Tải lại (Primary Action outline), Xem Catalog cửa hàng (Overflow) | Góc trên bên phải tab header |

## 4. Hành động
- **Chính:**
  - "Lưu hồ sơ kinh doanh" (Tab 1)
  - "Lưu nhận diện thương hiệu" (Tab 2)
  - "Lưu chính sách bán hàng" (Tab 3)
  - "Thêm dịp" (Tab 4)
- **Phụ:**
  - "Tải lại" (`variant="outline"`)
  - "Xem Catalog cửa hàng" (Overflow `...`)

## 5. Content budget
- Nút nổi: 1 nút chính mỗi tab.
- Khối hướng dẫn: Tối đa 1 `<FeatureGuidanceCard>` duy nhất theo quy cách K1.

## 6. Trạng thái
- Tải: `<SkeletonBlock lines={5} label="Đang tải dữ liệu hồ sơ tổ chức" />`.
- Thành công: Banner thông báo màu xanh `border-secondary/30 bg-secondary-bg text-secondary`.
- Lỗi: Banner thông báo màu đỏ `border-danger/30 bg-danger-bg text-danger`.

## 7. Responsive
- **390px (Mobile):** Các input đạt `min-h-11`, bộ chọn màu palette hiển thị dạng lưới dễ chạm, nút lưu kích thước lớn.
- **768px (Tablet) & 1280px (Desktop):** Khung nhìn tối đa 1024px (`max-w-5xl`), canh lề cân đối.

## 8. Trợ năng
- Toàn bộ touch target đạt `min-h-11` (≥ 44px).
- Palette màu có nhãn hex và kiểm tra format `#RRGGBB`.
- Bỏ hoàn toàn loading text thô `Đang tải…`, thay bằng `SkeletonBlock`.

## 9. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai | PASS | Đạt chuẩn cho Store Manager, Marketer |
| Việc | PASS | Quản trị hồ sơ và thương hiệu toàn diện |
| IA | PASS | 4 tab phân định mạch lạc |
| Mật độ | PASS | 1 FeatureGuidanceCard duy nhất theo K1 |
| Thứ bậc | PASS | Hướng dẫn -> Tab Header -> Form tab -> Nút Lưu |
| CTA | PASS | Tối đa 1 nút chính mỗi tab |
| Luồng | PASS | Cập nhật thông tin -> Lưu -> Tự động nạp vào AI |
| Trạng thái | PASS | Skeleton tải thật, banner báo thành công/lỗi |
| Responsive | PASS | Chuẩn từ 390px mobile đến desktop |
| Trợ năng | PASS | Touch target ≥ 44px, focus visible |
| Dữ liệu | PASS | Kết nối API hồ sơ tổ chức thật |
| Quyền | PASS | Gating theo N2 |
| Nhất quán | PASS | 100% token Semantic, không vi phạm UX lint |

## 10. Kết quả
- Rút gọn FeatureGuidanceCard về đúng 1 khối duy nhất.
- Triệt tiêu vi phạm R1/R9 ở `/ho-so`.
- Đồng bộ Screen Contract và cập nhật Checklist thực thi.
