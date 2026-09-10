# Rà soát thu hoạch — đối chiếu tài liệu với mã thật

Mọi con số dưới đây đọc từ tệp nguồn, có đường dẫn và số dòng. Tài liệu nào nói khác thì tài liệu sai.

## 1. Mười một điểm lệch

| # | Tài liệu nói | Mã thật | Hệ quả |
|---|---|---|---|
| 1 | Bảng mã ở `FloraOS/src/lib/maChucNang.ts` | `FloraOS/floraos-web/src/lib/maChucNang.ts`, 246 dòng | Agent tìm không thấy rồi tự viết lại bảng mã |
| 2 | Dải mã `E1–E7` | `E1–E8`. Tổng vẫn đúng 76 (A7 · B16 · C28 · D17 · E8) | Thiếu một mã nếu chép theo dải |
| 3 | 26 mã có trần cứng | **18** mã có `tranCung` | Sai 8 mã ở một luật bảo mật |
| 4 | `count_engine.py` phải gỡ `openpyxl`, xếp hạng EXTEND | Chỉ import `numpy` và `scipy.ndimage`. **Không** chạm Excel | Hạng đúng là **REUSE**. P5 nhẹ hơn ước lượng |
| 5 | E6 gộp `color_engine` + `tu_dien` + `normalize` thành một hạng EXTEND | `color_engine.py` (numpy, PIL) và `normalize.py` (re, unicodedata) thuần; chỉ `tu_dien.py` import `openpyxl` | Tách đôi: hai tệp REUSE, một tệp EXTEND |
| 6 | 21/28 tệp `analyzer/` import Excel | **20/28** | Kết luận không đổi, con số cần sửa |
| 7 | Khuôn hexagonal của LocalBudd là hình mẫu (R6) | `src/core/ports/` chỉ có **một** tệp: `LLMProvider.ts` | Khuôn thư mục dùng được, nhưng phần cổng gần như phải xây mới |
| 8 | Bao bì đếm như hoa (quy ước đếm mục 5) | `bom.wrapping` trong `Schema.json` **không có** trường `quantity`; `bom.accessories` thì có | Ruy băng, thiệp đếm được; giấy gói thì không, trừ khi thêm trường |
| 9 | Dạng sản phẩm ghi tự do trong nhãn bộ ảnh vàng | `identity.category` đã là enum sáu giá trị | Nhãn phải dùng enum, không dùng chuỗi tự do |
| 10 | `mucThu.ts` (363 dòng) xếp REUSE cho M02 ("Mức thu") | Là bảng UAT/nghiệm thu năng lực Điều hành (giá trị/cách thử/đạt khi cho từng mã năng lực), không đụng tới giá sản phẩm | Không mang sang P6. `HARVEST_MANIFEST.md` mục 3.1 (dòng R5) phải bỏ tệp này khỏi danh sách nguồn |
| 11 | `sanTran.ts` (102 dòng) xếp REUSE, ngụ ý thuần như `chanGia.ts` | `import 'server-only'`, gọi thẳng `goiDichVu()`/`docHeThong()` — một dịch vụ Excel, không thuần. Chỉ `quyetDinhChan` (đã nằm sẵn trong `chanGia.ts`) là REUSE thật | P6 chỉ mang `quyetDinhChan`; phần tra Sàn/Trần viết lại thành repository đọc `pricing_rules` (`PricingRuleRepository`) |

Điểm 1, 2, 3 nằm trong tài liệu Level 1 và cần chủ sản phẩm xác nhận trước khi sửa. Điểm 4, 5, 6 nằm trong `HARVEST_MANIFEST.md`. Điểm 8, 9 nằm trong `QUY_UOC_DEM.md` và `BO_ANH_VANG.md`. Điểm 10, 11 nằm trong `HARVEST_MANIFEST.md` mục 3.1 (bảng R1–R8), phát hiện lúc soát nguồn cho P6 (09/10) — xem `TECHNICAL_DEBT.md` #28, #29.

## 2. Hợp đồng Vision — nguồn sự thật của `ProductAnalysis`

`FloraOS/python-service/analyzer/Schema.json` · `name: PhanTichSanPhamHoa` · `strict: true` · sáu trường cấp một.

| Trường | Dạng | Nội dung |
|---|---|---|
| `identity` | object | `shape` · `facing` · `category` · `container`, cả bốn là enum đóng |
| `bom` | object | `flowers` · `foliage` · `accessories` · `wrapping` · `materials_note` |
| `checklist` | object | 10 mục: hoa chủ đạo, hoa phụ, hoa lấp đầy, lá nền, lá điểm nhấn, vật liệu gói, dây buộc, ruy băng, thiệp biển chữ, phụ kiện trang trí |
| `palette_accounting` | array | `cluster_index` · `thuoc_ve` · `nhom` · `confidence` |
| `san_xuat` | object | `so_tang_lop` |
| `confidence` | integer\|null | độ tin cậy toàn bản phân tích |

Trường của `bom.flowers`: `nhom_hoa` · `name` · `shade` · `color` · `quantity` · `dem_tung_vung` · `bloom_diameter_ratio` · `cluster_indices` · `role` · `confidence` · `ma` · `dvt_dem` · `mau` · `mo_ta_mau` · `dau_hieu_nhan_dang`.

`dvt_dem` là đơn vị tính đếm, đã có sẵn trong hợp đồng. Quy ước đếm "đơn vị là cành" ánh xạ thẳng vào trường này chứ không cần trường mới.

`identity.category`: Bó hoa · Giỏ hoa · Hộp hoa · Bình hoa · Kệ hoa · Lẵng hoa.
`identity.shape`: Tròn · Bán cầu · Tam giác · Thác đổ · Chữ L · Chữ S.
`identity.facing`: Một mặt · Hai mặt · Toàn diện 360.
`identity.container`: Giấy gói · Giỏ mây · Hộp tròn · Hộp vuông · Bình thủy tinh · Bình gốm.

`bom.wrapping` có `layer` · `material` · `color` · `texture` · `confidence` · `ma` — không có `quantity`. Hợp đồng chỉ được thêm trường, nên thêm `quantity` vào `wrapping` là hợp lệ nếu quy ước đếm giữ nguyên.

## 3. Bảng thu hoạch xác thực

### FloraOS — `FloraOS/floraos-web/src/lib/`

| Tài sản | Tệp | Dòng | Phụ thuộc | Hạng |
|---|---|---|---|---|
| Bảng 76 mã năng lực, 18 trần cứng | `maChucNang.ts` | 246 | không | REUSE |
| Công thức giá | `pricing.ts` | 227 | một module nội bộ | REUSE |
| Mức thu | `mucThu.ts` | 363 | | REUSE |
| Lọc tra cứu | `locTraCuu.ts` | 270 | | REUSE |
| Cấu hình mặc định | `cauHinhMacDinh.ts` | 251 | | REUSE |
| Tài khoản | `taiKhoan.ts` | 245 | | EXTEND — thêm tổ chức, thành viên |
| Ước phí | `uocPhi.ts` | 132 | | REUSE |
| Hiển thị theo vai | `hienThiTheoVai.ts` | 132 | | EXTEND — thêm phạm vi chi nhánh |
| Sàn/Trần | `sanTran.ts` | 102 | | REUSE |
| Chặn giá | `chanGia.ts` | 62 | | REUSE |

Test đi kèm, `FloraOS/floraos-web/tests/`, 1.430 dòng: `taiKhoan` 230 · `locTraCuu` 219 · `maChucNang` 172 · `pricing` 107 · `chanGia` 85 · `uocPhi` 83 · `settingsLogic` 81 · `giaChieuBBang` 75 · `mucThu` 65 · `nhapTay` 65 · `khoaRieng` 53 · `dinhMuc` 46 · `kyThanhToan` 40 · `loiNguoiDung` 38.

### FloraOS — `FloraOS/python-service/analyzer/`

| Tài sản | Tệp | Dòng | Import | Hạng |
|---|---|---|---|---|
| Engine đếm ba kênh | `count_engine.py` | 955 | numpy, scipy | **REUSE** |
| Engine màu | `color_engine.py` | 418 | numpy, PIL, `image_utils` | **REUSE** |
| Tiện ích ảnh | `image_utils.py` | 237 | | REUSE |
| Chuẩn hoá tên | `normalize.py` | 207 | re, unicodedata | REUSE |
| Giá vốn | `gia_von.py` | 302 | | REUSE |
| Từ điển nguyên liệu | `tu_dien.py` | 399 | **openpyxl**, `so_sach` | EXTEND |
| Hợp đồng AI | `Schema.json` · `Prompt.md` | dữ liệu | | REUSE |

20/28 tệp còn lại của `analyzer/` là lớp sổ sách Excel, không mang sang.

`count_engine.chot(kenh_llm, kenh_dt, kenh_chan)` là hàm chốt số cuối từ ba kênh. Hai kênh sau thuần numpy và nằm ngoài phạm vi cổng `VisionAnalyzer`.

### LocalBudd

| Tài sản | Vị trí | Quy mô | Hạng |
|---|---|---|---|
| Khuôn thư mục module | `LocalBudd/src/modules/` — 8 module | | REUSE khuôn |
| Cổng | `LocalBudd/src/core/ports/` | **1 tệp** (`LLMProvider.ts`) | BUILD phần còn lại |
| Lược đồ | `LocalBudd/prisma/schema.prisma` | 274 dòng, 17 model, 10 enum | tham chiếu |
| `generation_jobs` | | `id · type · status · step · payload · result · created_at · updated_at` | EXTEND — thiếu `organization_id`, thiếu trục `result` dạng phán quyết, thiếu `cancelled` |
| Enum `job_status` | | `pending · processing · completed · failed` | EXTEND — thêm `cancelled` |
| Enum `job_step` | | `init · generating · upscaling · finalizing` | tham chiếu — mỗi module tự khai `stage` riêng |
| Mẫu route | `LocalBudd/src/app/api/v1/` — 33 route | có sẵn mẫu `/pages/[id]/approve` | REUSE mẫu |
| Bộ 8 tài liệu | `LocalBudd/ORG_docx/` | 15.889 dòng | REUSE làm chuẩn trình bày |

`media_assets` của LocalBudd chỉ có `id · job_id · url · status · created_at` — không dùng được, bảng `assets` lấy từ SocialFlow.

Không model nào của LocalBudd có `organization_id`. `projects.owner_id` là một chủ sở hữu duy nhất, không phải thành viên.

### SocialFlow

Bảng `assets` thật trong `socialflow.db`, 23 cột — khai gốc ở `SocialFlow/backend/asset_inventory.py`, sáu cột thêm bằng `SocialFlow/backend/migrations.py`:

`id · asset_id · asset_type · source · title · description · file_path · file_url · file_size · duration_seconds · aspect_ratio · campaign · topic · tags · metadata · state · created_at · updated_at · sha256 · origin · provider · cost_usd · thumb_path · parent_asset_id`

Xác nhận E1 đúng. Phần thêm cho core: `organization_id` · `product_id` · `version` · `model` · `model_version` · `pipeline_version` · `quality_score` · `identity_score` · `generated_flags` · `parameters` · `prompt`.

`content_queue` có `approval_level` và `source_job_id` — nối vào Review & Approval. `video_jobs` có `provider · provider_job_id · status · cost_usd`. Cả 14 bảng chạy trên SQLite, không phục vụ đa tenant.

## 4. Điều chỉnh ước lượng

Điểm 4 và 5 chuyển `count_engine`, `color_engine`, `normalize` từ EXTEND sang REUSE — tổng cộng 1.580 dòng không phải viết lại, chỉ phải bọc lại giao diện hàm và thêm test. P5 nhẹ hơn ước lượng 2–3 tuần trong lộ trình.

Điểm 7 đi ngược lại: bốn cổng còn thiếu ở LocalBudd (`VisionAnalyzer`, `StorageProvider`, `QueueProvider`, `PublisherProvider`) là BUILD chứ không phải REUSE. Phần này nằm ở P3 và P5.

Hai điều chỉnh gần bù nhau. Tổng lộ trình 5–6 tháng giữ nguyên.
