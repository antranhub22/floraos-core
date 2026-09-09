import { describe, it } from "vitest"

/**
 * Bộ test cách ly tenant thuộc P1.
 *
 * Tệp này cố tình thất bại để `npm run test:tenant` không báo xanh khi
 * chưa kiểm gì. Một cổng merge báo xanh khi chưa kiểm gì còn tệ hơn
 * không có cổng.
 *
 * Ở P1, xoá tệp này và thay bằng bộ test thật: dựng hai tổ chức, đọc bản
 * ghi của tổ chức A bằng ngữ cảnh phiên của tổ chức B, kết quả phải là
 * không tìm thấy — không phải lỗi quyền, vì lỗi quyền đã tiết lộ rằng
 * bản ghi tồn tại.
 */
describe("cách ly tenant", () => {
  it("chưa được triển khai — hạng mục của P1", () => {
    throw new Error(
      "Bộ test cách ly tenant chưa tồn tại. Xem tests/tenant/README.md và " +
        "docs/dac-ta/Checklist_Thuc_Thi.md mục P1."
    )
  })
})
