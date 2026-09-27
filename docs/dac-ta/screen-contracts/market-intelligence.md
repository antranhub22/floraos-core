# Screen Contract — Nghiên cứu thị trường (`/market-intelligence`)

**Tuyến:** `/market-intelligence` · **Tệp chính:** `src/app/(app)/market-intelligence/page.tsx` · **Cập nhật:** 27/09/2026 · **Thẻ:** T5.C1

## 1. Vai và mục đích
- **Vai chính (03b):** `marketer`, `store_manager`, `content_creator`.
- **Phạm vi:** organization (nghiên cứu cơ hội nội dung, xu hướng vĩ mô và chủ đề hoa ngách).
- **Việc chính:** Phát hiện các cơ hội nội dung và xu hướng thị trường hoa tươi đang lên ngôi để định hình chiến dịch tiếp thị và sản phẩm.
- **Câu hỏi chính:** "Cơ hội nội dung nào đáng làm ngay?" → **Nút chính:** "Khám phá kịch bản" / "Tạo nội dung từ cơ hội này".
- **Mật độ:** MEDIUM-HIGH (Thẻ cơ hội tinh gọn theo K3, Bảng vàng quán quân chu kỳ, Drawer chi tiết micro-story).

## 2. Hiện trạng (audit)
- **API gọi:**
  - `GET /api/v1/market-intelligence/opportunities` → `M1` (`market.read`)
  - `POST /api/v1/market-intelligence/runs` → `M2` (`market.run`)
  - `GET /api/v1/market-intelligence/runs` → `M1`
  - `POST /api/v1/market-intelligence/analyze-product` → `M2`
- **Khối chính:**
  - Header chuẩn: Switcher 2 tính năng (Xu hướng thị trường, Quét theo từ khóa) + nút Làm mới, Cài đặt & biểu mẫu.
  - FeatureGuidanceCard: 1 card duy nhất theo K1.
  - Bảng vàng quán quân chu kỳ (Top Champions Block) kèm VideoPreviewModal.
  - Lưới cơ hội nội dung (Opportunity Grid) dạng thẻ tinh gọn theo chuẩn K3.
  - Drawer chi tiết cơ hội (OpportunityDetailDrawer) hiển thị cặp thumbnail video đầy đủ và kịch bản hook.
- **Trạng thái:** Tải (`SkeletonBlock`), rỗng (`EmptyState`), lỗi (`InlineError`).

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Header trang, Switcher tính năng, Khối hướng dẫn K1 | Đỉnh trang |
| L1 Nổi bật | Bảng vàng Quán quân Chu kỳ (Top 3 cơ hội có điểm cao nhất) | Dưới khối hướng dẫn |
| L2 Danh sách | Lưới thẻ cơ hội (Điểm cơ hội, Độ nóng/Lan tỏa/Thương mại, Chỉ báo K3) | Khung lưới chính |
| L3 Chi tiết | Ngăn kéo chi tiết kịch bản (cặp thumbnail TikTok 9:16 + YouTube 16:9, hooks, micro-story) | Mở qua `OpportunityDetailDrawer` |
| L4 Video | Trình phát video YouTube HD tại chỗ không reload | Mở qua `VideoPreviewModal` |

## 4. Hành động & Tiêu chuẩn K3
- **Chính:** "Khám phá kịch bản" → Mở `OpportunityDetailDrawer`.
- **Phụ:** "Làm mới" (`variant="outline"`), "Cài Đặt & Biểu Mẫu" (`variant="outline"`).
- **Quy chuẩn K3 (PO 26/09/2026):**
  - Thẻ danh sách chỉ hiển thị chỉ báo gọn ("2 video dẫn chứng" + 2 biểu tượng nền tảng TikTok & YouTube).
  - Cặp thumbnail video đầy đủ kèm trình phát mở rộng được render ở lớp chi tiết (Drawer/Modal) để tối ưu tải trang và DOM.
  - Tuyệt đối cấm tràn từ khóa thô, mọi tiêu đề đi qua `getOpportunityHeadline()`.

## 5. Responsive
- **390px (Mobile):** Thẻ cơ hội xếp dọc 1 cột, chỉ báo video gọn gàng, nút bấm đạt touch target ≥ 44px (`min-h-11`).
- **768px (Tablet):** Lưới 2 cột (`sm:grid-cols-2`).
- **1280px (Desktop):** Lưới 3 cột (`lg:grid-cols-3`), Bảng vàng Top Champions hiển thị hàng ngang trực quan.

## 6. Trợ năng
- Toàn bộ nút bấm và thẻ tương tác có `focus-visible:outline-2 focus-visible:outline-primary`.
- Các biểu tượng trang trí có `aria-hidden="true"`.
- Modal/Drawer quản lý focus trap và đóng bằng phím Escape.

## 7. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai | PASS | Đạt chuẩn cho Marketer, Store Manager, Content Creator |
| Việc | PASS | Trả lời "Cơ hội nội dung nào đáng làm ngay?" |
| IA | PASS | Header -> Top Champions -> Lưới cơ hội -> Drawer |
| Mật độ | PASS | 1 FeatureGuidanceCard duy nhất (K1), Thẻ gọn K3 |
| Thứ bậc | PASS | Điểm cơ hội -> Chỉ số 3 trục -> Dẫn chứng -> Kịch bản |
| CTA | PASS | Khám phá kịch bản -> Chuyển sang Creative/Video Studio |
| Responsive | PASS | 390px 1 cột, 768px 2 cột, 1280px 3 cột |
| Trợ năng | PASS | Touch target ≥ 44px, focus visible, aria-hidden |
| Dữ liệu | PASS | Dữ liệu thật từ `content_opportunities` |
| Quyền | PASS | Cách ly tenant qua `organization_id` chặt chẽ |
