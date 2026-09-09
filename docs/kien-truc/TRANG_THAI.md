# TRẠNG THÁI — đọc tệp này đầu tiên

**Cập nhật:** 2026-09-09 · **Dự án:** FloraOS SaaS — nền tảng đa tenant cho cửa hàng hoa

> Tệp này tồn tại để **bất kỳ phiên làm việc nào — tài khoản Claude khác, Cursor, Copilot, hay người thật — tiếp tục được từ đúng chỗ đang dừng.** Bộ nhớ và lịch sử hội thoại không chuyển được giữa các tài khoản; repo thì chuyển được. Nên trạng thái sống ở đây, không sống trong một phiên chat.
>
> **Ai sửa gì trong dự án này thì cập nhật tệp này trong cùng lần đó.** Tệp lệch trạng thái còn tệ hơn không có tệp.

---

## 1. Đang ở đâu

**Giai đoạn: khung repo `floraos-core` đã dựng. Chưa có bảng, chưa có route, chưa có job.**

Repo nằm ở `~/Projects/floraos-core`, git đã khởi tạo, chưa có remote. Lược đồ Prisma còn trống — bảng đầu tiên thuộc P1.

Hạng mục kế tiếp là **P1** — Organization · Workspace · Membership · Branch · cách ly tenant.

## 2. Đọc theo thứ tự này

| # | Tệp | Đọc để biết |
|---|---|---|
| 1 | `TRANG_THAI.md` (tệp này) | Đang ở đâu, làm gì tiếp |
| 2 | `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` | **Level 1 — thắng tuyệt đối.** Kiến trúc đích, lộ trình P0–P12, quyết định |
| 3 | `01_PRD-FloraOS-Core.md` | Phạm vi, người dùng, bảy luật sản phẩm, tiêu chí nghiệm thu |
| 4 | `HARVEST_MANIFEST.md` | Cái gì thu hoạch từ repo nào, hạng REUSE/EXTEND/ADAPTER/BUILD |
| 5 | `M01_FLORAOS_VISION_CODING_AGENT_GUIDE.md` · `M04_FLORAOS_PRODUCT_IMAGE_OPTIMIZER_FULL.md` | Level 2 — chỉ đọc khi làm đúng module đó |
| 6 | `BO_ANH_VANG.md` | Quy cách xây bộ ảnh vàng — điều kiện nghiệm thu P5 |

`AGENTS.md` của `floraos-core` đã dựng từ bản khung; bản khung không còn hiệu lực.

Bản V1 (`FLORAOS_SAAS_TARGET_ARCHITECTURE.md`, không có `_V2`) **đã bị xoá khỏi cây làm việc ngày 09/09** vì gây nhầm lẫn. Nó vẫn nằm trong lịch sử git tại commit `c224a0f`. Lấy lại bằng:

```bash
cd ~/Projects/FloraOS
git -c core.quotepath=false show \
  "c224a0f:$(git -c core.quotepath=false ls-tree -r --name-only c224a0f \
             | grep 'TARGET_ARCHITECTURE\.md$')" > /tmp/V1.md
```

> **Vì sao lệnh trên phải qua `ls-tree` chứ không gõ thẳng đường dẫn:** commit `c224a0f` có trước lần đổi tên thư mục, nên trong lịch sử nó vẫn mang tên cũ `Nâng cấp WebApp Saas/` ở dạng **NFD** (macOS tách chữ có dấu thành ký tự tổ hợp, còn chuỗi gõ ở terminal là NFC). Gõ thẳng sẽ **không khớp và im lặng trả về rỗng** — git không báo lỗi. Từ commit `6cf108f` trở đi mọi đường dẫn trong git đều là ASCII nên gõ thẳng được.

## 3. Bốn repo

| Repo | Vai trò | Git |
|---|---|---|
| **`floraos-core`** | Core mới — Org/RBAC/Product/Asset/Job/Usage + M01, M02, M03, M04a | ✓ `antranhub22/floraos-core` (riêng tư) |
| `FloraOS` | v1, nghỉ hưu. Phục vụ AVI GIFT tới ngày cắt. **Nguồn thu hoạch.** | ✓ `antranhub22/floraos-v1` (riêng tư) |
| `LocalBudd` | M05 Landing Page · M06 Catalog | ✓ `antranhub22/localbudd` (riêng tư) |
| `SocialFlow` | M04b Marketing Creative · M07 Social Publishing | ✓ có remote GitHub |

Cả bốn repo đều có bản sao ngoài máy. Nhánh chính của cả bốn là `main`.

Branch protection trên `main` của `floraos-core` bật khi P1 xong, với điều kiện `npm run test:tenant` phải xanh. Đây là cổng duy nhất chặn được lỗi cách ly tenant.

## 4. Đã chốt

| # | Quyết định | Ngày |
|---|---|---|
| **Đường A** | Dựng repo core MỚI, chép khuôn kiến trúc LocalBudd + luật nghiệp vụ FloraOS + thiết kế Asset/brand SocialFlow. Giữ tách ba repo. FloraOS v1 nghỉ hưu, không migrate dần | 09/09 |
| **D5-c** | Cổng Vision ở mức Hợp đồng JSON (`VisionAnalyzer.analyze → ProductAnalysis`). Adapter GPT-4o trước, Florence-2+SAM2 sau, chỉ đổi khi thắng trên bộ ảnh vàng. **Thay quy tắc 4 cũ của M01** | 09/09 |
| **D6-1** | Worker Python lấy việc từ `generation_jobs` bằng `SKIP LOCKED` + `LISTEN/NOTIFY`. `floraos-core` chứa cả `src/` (TS) và `workers/` (Python), chung một Postgres. Cấm `subprocess`+stdout, cấm job qua HTTP | 09/09 |

## 5. Còn mở — chặn việc

| # | Quyết định | Chặn | Ghi chú |
|---|---|---|---|
| **D4** | Ngày đóng băng tính năng của `FloraOS` v1 | **P1** | Khung repo đã dựng trước khi chốt D4. Chốt là mở khoá P1 |
| **D1** | SocialFlow lên đa tenant, hay ở lại làm worker đơn tenant? | P7 | Khuyến nghị: worker đơn tenant |
| **D2** | Mã API AI: mỗi tổ chức tự mang khoá, hay khoá nền tảng + credit? | P3 | Quyết định kinh doanh |
| **D3** | Job `COMPLETED / result = REJECTED` có tính phí không? | P3 | Quyết định kinh doanh |

## 6. Việc kế tiếp

1. **Chốt D4** → mở khoá P1.
2. **P1** — Organization · Workspace · Membership · Branch · cách ly tenant. **Trước mọi thu hoạch khác.** Không tạo bảng, route hay job của bất kỳ module nào trước khi P1 và P2 đạt nghiệm thu.
3. Song song, không chặn ai: **bộ ảnh vàng 50–100 ảnh** theo `BO_ANH_VANG.md`. Bước đầu tiên là chốt quy ước đếm, không phải chụp ảnh.

## 7. Làm việc bằng nhiều tài khoản Claude cùng lúc

Được, với ba điều kiện:

1. **Mỗi tài khoản một nhánh git riêng.** Hai agent sửa cùng tệp trên cùng nhánh là xung đột, và không agent nào biết agent kia vừa làm gì.
2. **Mỗi phiên bắt đầu bằng `git pull` và đọc tệp này.** Bộ nhớ của tài khoản khác không thấy được gì ở đây.
3. **Mỗi phiên kết thúc bằng: cập nhật tệp này + commit + push.** Việc chưa push là việc chưa tồn tại với tài khoản khác.

Phân việc theo **pha**, không theo tệp — P1 (tenant) và bộ ảnh vàng chạy song song được; P5 và P6 thì không, P6 phụ thuộc P5.

## 8. Nhật ký

| Ngày | Việc |
|---|---|
| 09/09 | Rà soát FloraOS: phát hiện Excel là nguồn sự thật + khoá ghi toàn cục → bác bỏ hướng nâng cấp tại chỗ. hồ sơ `SAAS_GAP_ANALYSIS.md`, nay chỉ còn trong git |
| 09/09 | Rà soát LocalBudd và SocialFlow: ba repo làm ba mảnh khác nhau của cùng kiến trúc. Chốt Đường A. `HARVEST_MANIFEST.md` |
| 09/09 | Viết `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md`, thay thế V1 |
| 09/09 | Chốt D5-c và D6-1. Đồng bộ M01 và M04 lên V1.2 |
| 09/09 | `FloraOS` vào git lần đầu (loại kho vận hành + khoá API). `LocalBudd` commit toàn bộ phần đã xây (loại `cookies.txt` chứa session thật) |
| 09/09 | PRD `01_PRD-FloraOS-Core.md` |
| 09/09 | Dựng khung `floraos-core`: cấu trúc theo V2 mục 3, `AGENTS.md`, năm cổng ở `src/core/ports/`, khung worker Python, `docs/kien-truc/`. Chưa có bảng, chưa có route |
| 09/09 | `BO_ANH_VANG.md` — quy cách bộ ảnh vàng |
| 09/09 | Bốn repo lên GitHub riêng tư dưới `antranhub22`, nhánh chính `main` |
