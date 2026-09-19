/**
 * Widget "Creative Studio" cũ trên dashboard — **đã gỡ 17/09** khi rà đồng
 * thuận tài liệu-mã cho M04a/M04b.
 *
 * Tệp này gọi thẳng `POST /api/v1/proxy/api/m04b/background-removal` sang
 * SocialFlow bằng một `product_id` gõ tay — không qua cổng Master Image đã
 * duyệt, không đo Subject Integrity, không phải đường `POST
 * /api/v1/media/variants` mà P24 đã dựng đúng kiến trúc job-queue.
 *
 * Rà lại điều hướng (`experience-grid.tsx`, `desktop-nav.tsx`,
 * `admin-dashboard.tsx`, trang `/creative-studio`) xác nhận không nơi nào
 * còn import component này — mồ côi từ khi `app/(app)/creative-studio/page.tsx`
 * thay thế nó ở P16/P24. Nhưng hai tài liệu (`Checklist_Thuc_Thi.md`,
 * `CHECKLIST_AI_CAPABILITIES_BUILD.md`) vẫn ghi `[x]` như thể đây là đường
 * tích hợp đang dùng — đã sửa cùng lượt với tệp này.
 *
 * Đường thay thế: `app/(app)/creative-studio/page.tsx` → `POST
 * /api/v1/media/variants` (`I4`) → `workers/media_ai/jobs/variant_worker.py`.
 *
 * Tệp giữ lại rỗng cho một lượt commit để `git` ghi rõ việc gỡ; xoá hẳn ở
 * lượt dọn kế tiếp (cùng nhóm với nợ #76: ba tệp rỗng hoá ở P24 chưa `git rm`).
 */

export {}
