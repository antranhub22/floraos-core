# Adapter của module nạp AVI GIFT

Trống ở P8. Nguồn dữ liệu (Excel) không phải một cổng chạy trong ứng dụng
lúc runtime (`VisionAnalyzer`/`LLMProvider`/`StorageProvider`/`QueueProvider`)
— nó chỉ được đọc MỘT LẦN lúc di dân bằng
`scripts/nap-avi-gift/doc-excel.py` (Python, ngoài `src/`, cùng vị trí với
`scripts/xay-dung-bo-anh-vang.py`), sinh ra JSON trung gian rồi mới tới
`src/modules/avi-gift-import/use-cases/import-catalog.ts`. Không có driver
Excel nào chạy trong `src/`, nên không có adapter nào để đặt ở đây.
