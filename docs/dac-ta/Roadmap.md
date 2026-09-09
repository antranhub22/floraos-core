# Lộ trình

Bảng pha đầy đủ nằm ở `../kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục 15. Tài liệu này không chép lại bảng đó — nó ghi những gì đã thay đổi kể từ khi bảng ấy được viết.

## Trạng thái

P0 xong ngày 09/09. Đang ở trước P1.

D4 đã chốt: `FloraOS` v1 đóng băng tính năng từ 09/09, không ngoại lệ.

## Điều chỉnh sau khi rà soát mã thật

Chi tiết ở `../kien-truc/RA_SOAT_THU_HOACH.md`.

| Pha | Điều chỉnh | Hướng |
|---|---|---|
| P5 | `count_engine.py` (955 dòng), `color_engine.py` (418), `normalize.py` (207) là REUSE chứ không phải EXTEND — chúng không import `openpyxl` | nhẹ hơn |
| P3, P5 | Bốn cổng còn thiếu ở `LocalBudd` là BUILD chứ không phải REUSE; `src/core/ports/` bên đó chỉ có `LLMProvider.ts` | nặng hơn |
| P2 | 18 mã trần cứng thay vì 26 | nhẹ hơn, nhưng cần xác nhận con số đúng |
| P6 | Thêm một hạng mục: chốt cách tính chi phí lá và cành trang trí | thêm việc |

Hai điều chỉnh lớn gần bù nhau. Tổng 5–6 tháng giữ nguyên.

## Chạy song song

| Việc | Chặn ai | Bị ai chặn |
|---|---|---|
| Bộ ảnh vàng 50–100 ảnh | Nghiệm thu P5 | Không ai. Bắt đầu được ngay |
| Ma trận chọn công nghệ | P5, P9 | Không ai |
| Cơ chế consent dữ liệu huấn luyện | Go-live | Không ai |
| P9 M04a | | Chạy song song được với P7 và P8 |

Ba việc đầu không cần chờ P1. Chưa bắt đầu chúng là mất thời gian không lấy lại được, vì cả ba đều là điều kiện chặn ở cuối.

## Quyết định

Không còn quyết định mở. D1 · D2 · D3 · D4 chốt ngày 09/09.

| # | Chốt |
|---|---|
| D1 | SocialFlow là worker đơn tenant, nhận `organization_id` từ core |
| D2 | Nền tảng giữ khoá nhà cung cấp, tính credit theo tổ chức |
| D3 | Job bị Identity Guard từ chối không tính phí khách; credit hoàn lại, `cost_usd` vẫn ghi sổ |
| D4 | `FloraOS` v1 đóng băng tính năng từ 09/09, không ngoại lệ |
