// Bộ test cách ly tenant chưa tồn tại — nó thuộc P1 (kiến trúc V2 mục 15).
// Script này cố tình thất bại: một cổng merge báo xanh khi chưa kiểm gì
// còn tệ hơn không có cổng.
console.error(
  "Bộ test cách ly tenant chưa được triển khai. Đây là hạng mục của P1.\n" +
    "Xem tests/tenant/README.md."
);
process.exit(1);
