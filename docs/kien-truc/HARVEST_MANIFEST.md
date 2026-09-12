# HARVEST_MANIFEST — Cái gì mang sang core SaaS mới, cái gì bỏ

Ngày: 2026-09-09 · Phạm vi rà soát: `FloraOS`, `LocalBudd`, `SocialFlow`
Phân hạng theo đúng thang của `LocalBudd/ORG_docx/08`: **REUSE > EXTEND > ADAPTER > BUILD**

---

## 1. Kết luận

Hướng "dựng mới + tận dụng" là đúng, và lý do mạnh hơn nhiều so với đánh giá ban đầu:

> **Ba repo đã độc lập xây ba mảnh KHÁC NHAU của cùng một kiến trúc đích. Không repo nào nâng cấp một mình mà ra được hệ thống. Nhưng ghép ba mảnh lại thì phần còn thiếu nhỏ hơn nhiều so với tưởng tượng.**

| Repo | Mảnh đã làm đúng | Mảnh còn thiếu hoàn toàn |
|---|---|---|
| **FloraOS** | **RBAC theo năng lực** (76 mã, 18 trần cứng, cắt 3 lớp) · **engine giá** có test bất biến hai phía · **hợp đồng AI Vision** (40KB prompt/schema) | Đa tenant · Postgres làm nguồn sự thật · Asset · Usage · job bền |
| **LocalBudd** | **Kiến trúc hexagonal sạch** (`core/ports`, 8 module × domain/use-cases/infra/adapters) · Postgres+Prisma 17 model · **`generation_jobs` đã tách `status` + `step`** · `qa_results` · Next.js 16 / React 19 | Org/Membership/RBAC · Usage · trục `result` của job · Branch |
| **SocialFlow** | **`assets` đã có phả hệ**: `parent_asset_id`, `sha256`, `origin`, `provider`, `cost_usd`, `metadata`, `state` · `brand_config` (= BrandProfile) · adapter đăng bài 6 nền tảng · `video_jobs` có `cost_usd` | SQLite (không đa tenant được) · frontend một tệp không build step · không RBAC |

Điều đáng chú ý: **§15.1 của tài liệu đích đòi `source_asset_id` + `model` + `parameters` + hash + cost — SocialFlow đã có gần đủ khối đó trong bảng `assets`.** Và **§10 đòi tách `status`/`stage` — LocalBudd đã tách đúng như vậy** (`job_status` + `job_step`). Hai quyết định khó nhất của tài liệu đích đã có bản cài đặt chạy được để tham chiếu.

---

## 2. Mâu thuẫn phải chốt trước khi harvest

Bản V1 của tài liệu kiến trúc (nay chỉ còn trong git, commit `c224a0f`) §2.1 ghi:

> *"Neither external repo forks or duplicates the core data model."*

**Nhưng LocalBudd đã có sẵn `products`, `product_assets`, `media_assets`, `generation_jobs`, `projects` trong `prisma/schema.prisma` của nó.** Tức là bản sao của chính những entity mà §2 nói phải canonical ở core. Đây không phải lỗi của LocalBudd — nó được xây trước khi có quyết định §2 — nhưng mâu thuẫn đang sống, và mọi kế hoạch harvest phải giải nó trước.

Hai đường:

| | **Đường A — Core repo mới** | **Đường B — Nâng LocalBudd lên làm core** |
|---|---|---|
| Cách làm | Dựng `floraos-core` mới, **chép khuôn kiến trúc** của LocalBudd (ports/modules/quy ước schema), harvest luật nghiệp vụ FloraOS vào | LocalBudd thành core, hút M01–M04a vào, FloraOS v1 nghỉ hưu |
| Giữ được §2 (3 repo) | Có | **Không** — phải viết lại §2 |
| LocalBudd | Tiếp tục M05/M06 không bị xáo trộn, sau đó bỏ bảng trùng, đọc core qua API | Bị tái cấu trúc giữa lúc đang phát triển |
| Rủi ro | Có giai đoạn hai schema cùng tồn tại | Mất tiến độ M05/M06 đang chạy |
| Khuyến nghị | **Nên chọn** | Chỉ chọn nếu M05/M06 còn ở giai đoạn sớm |

Phần còn lại của tài liệu này viết theo **Đường A**.

---

## 3. HARVEST MANIFEST

### 3.1 REUSE — chép sang gần như nguyên vẹn

| # | Tài sản | Nguồn | Vì sao thuần | Test khoá |
|---|---|---|---|---|
| R1 | **Hợp đồng AI Vision** — `Prompt.md` (10.6KB), `Schema.json` (14KB), `Prescreen.json`, `config.json`, `san_xuat.json`, `hidden_materials.json` | `FloraOS/python-service/analyzer/` | **40KB dữ liệu thuần, không một dòng mã.** Tài sản giá trị nhất của cả ba repo | Bộ ảnh vàng (`run.py --eval golden/`) |
| R2 | **Bảng 76 mã năng lực** + 18 trần cứng + hàm `duocPhep`/`vaiDuocPhep` | `FloraOS/floraos-web/src/lib/maChucNang.ts` | **Không import gì cả.** Tự chạy được, tự test được | `FloraOS/floraos-web/tests/maChucNang.test.ts` |
| R3 | **Công thức giá** | `FloraOS/floraos-web/src/lib/pricing.ts` (227 dòng, import 1 module nội bộ) | Gần thuần | `FloraOS/floraos-web/tests/pricing.test.ts` |
| R4 | Bất biến làm tròn từng cấu phần | `FloraOS` `pricing.ts` ↔ `template_validator.py` | Là **luật**, không phải mã | `pricing.test.ts` + `test_bat_bien.py` — **chép cả hai** |
| R5 | Chặn giá theo Sàn/Trần | `FloraOS/floraos-web/src/lib/chanGia.ts` (62 dòng, thuần) — **không** `mucThu.ts`/`uocPhi.ts` (xếp nhầm, xem điểm lệch #10 `RA_SOAT_THU_HOACH.md`: `mucThu.ts` là bảng UAT năng lực, không phải giá; `uocPhi.ts` thuộc M01/Usage). `sanTran.ts` (102 dòng) chỉ phần quyết định trùng `chanGia.ts` là REUSE — phần còn lại gọi thẳng dịch vụ Excel (`server-only`), không thuần (điểm lệch #11) | `FloraOS/floraos-web/tests/chanGia.test.ts` |
| R6 | **Khuôn hexagonal** — `core/ports/`, `modules/<tên>/{domain,use-cases,infra,adapters}` | `LocalBudd/src/` | Là **quy ước**, chép cấu trúc chứ không chép mã | — |
| R7 | Enum `job_status` + `job_step` | `LocalBudd/prisma/schema.prisma` | Đúng §10 sẵn | — |
| R8 | Bộ 8 tài liệu đặc tả MVP | `LocalBudd/ORG_docx/` | Đặc biệt `07-database-specification` và `08-repository-technical-audit` | — |

### 3.2 EXTEND — mang sang rồi mở rộng

| # | Tài sản | Nguồn | Phải thêm gì |
|---|---|---|---|
| E1 | Bảng `assets` (phả hệ) | `SocialFlow` | Đã có `parent_asset_id`, `sha256`, `origin`, `provider`, `cost_usd`, `metadata`, `state`, `aspect_ratio`, `thumb_path`. **Thêm:** `organization_id`, `version`, `model_version`, `pipeline_version`, `identity_score`, `generated_flags` → đủ §15.1 |
| E2 | `generation_jobs` | `LocalBudd` | Đã có `status` + `step`. **Thêm trục thứ ba `result`** (SAFE/GOOD/WARNING/REJECTED) + `organization_id` + `cancelled` + retry. §10 nói rõ: từ chối bởi cổng an toàn **không phải** job lỗi |
| E3 | `brand_config` → **BrandProfile** | `SocialFlow` | 20+ cột thương hiệu đã có (màu, font, tone, hashtag theo nền tảng, CTA, forbidden_styles). **Thêm:** `organization_id`, tách BusinessProfile khỏi BrandProfile |
| E4 | `qa_results` → Review & Approval §9 | `LocalBudd` | Tổng quát hoá từ page_version sang mọi đầu ra AI; thêm `approved_by`/`approved_at` |
| ~~E5~~ | **Xếp lại thành REUSE.** `count_engine.py` (955 dòng) chỉ import `numpy` và `scipy`, không chạm Excel | `FloraOS/python-service/analyzer/count_engine.py` | Bọc adapter, thêm test hồi quy trên bộ ảnh vàng |
| ~~E6~~ | **Tách đôi.** `color_engine.py` (418) và `normalize.py` (207) là REUSE — thuần numpy, PIL, re. `tu_dien.py` (399) là EXTEND — có import `openpyxl` | `FloraOS/python-service/analyzer/` | Gỡ `openpyxl` khỏi riêng `tu_dien.py` |
| E7 | Adapter đăng bài 6 nền tảng | `SocialFlow` (`automation*.py`, `facebook_graph.py`, `zalo-oa-automation.py`, `tiktok-automation.py`) | Nhận `organization_id` + credential theo org thay vì bảng `accounts` toàn cục |
| E8 | `content_queue.approval_level` | `SocialFlow` | Nối vào E4 |

### 3.3 ADAPTER — bọc, không sửa ruột

| # | Tài sản | Nguồn | Ghi chú |
|---|---|---|---|
| A1 | Nhà cung cấp video (Veo/HeyGen) | `SocialFlow/video_providers/`, `heygen_adapter.py` | Đã sau interface sẵn |
| A2 | `core/ports/LLMProvider.ts` | `LocalBudd` | Mở rộng thành ma trận §11.1 |
| A3 | Đọc/ghi Excel | `FloraOS/excel_parser.py`, `ket_qua_phan_tich.py` | **Hạ cấp thành adapter nhập/xuất một chiều** để nạp dữ liệu AVI GIFT vào hệ mới. Không còn là nguồn sự thật |

### 3.4 BUILD — không có gì để tận dụng, phải xây mới

| # | Hạng mục | Vì sao không harvest được |
|---|---|---|
| B1 | **Organization · Workspace · Membership · Branch** | Không repo nào có. LocalBudd chỉ có `projects.owner_id` (một chủ), không có thành viên/vai/phạm vi |
| B2 | **Tenant isolation xuyên suốt** | Cả ba repo đều đơn tenant |
| B3 | **Usage một bảng duy nhất §12** | FloraOS có mầm (`aiChayTichLuy`, `uocPhi`, `YeuCauChay`), SocialFlow có `cost_usd` rải rác — nhưng chưa repo nào có bảng Usage thống nhất |
| B4 | **M04a Product Identity Guard** | Không tồn tại ở đâu. Có spec 1.159 dòng |
| B5 | **Experience Mode + trial limit** | Không tồn tại |
| B6 | **Integration Layer / API công khai** | Không repo nào có API hướng ra ngoài |

---

## 4. Cái KHÔNG mang sang — và lý do

| Bỏ | Khối lượng | Lý do |
|---|---|---|
| **Sổ sách Excel trong `analyzer/`** — `danh_muc.py` (1.540), `excel_style.py` (460), `chot_dinh_muc.py` (753), `so_sach.py`, `tach_kho.py`, `tong_hop_gia.py`, `ap_ra_soat.py`, `kiem_toan_ven.py`, `sua_ma_trung.py`, `ban_gui_ra_ngoai.py`… | **4.402 dòng** (10 tệp liệt kê) | 21/28 tệp trong `analyzer/` import `openpyxl`/`pandas`. Excel là **cấu trúc dữ liệu**, không phải định dạng xuất. Hệ mới dùng Postgres → lớp này biến mất, không phải viết lại |
| **`run.py` như một CLI** (3.509 dòng) | | Tự mô tả: *"Quét folder ảnh → GPT-4o → Excel 4 sheet"*. Chỉ **2/28** tệp analyzer chạm OpenAI. Harvest phần AI bên trong nó (R1, E5, E6), bỏ phần điều phối CLI |
| **Seam `subprocess.Popen` + parse stdout** | | `phan_tich.py:485` — cách tích hợp tệ nhất có thể. Hệ mới gọi hàm/service, không parse log |
| **`he_thong.giu_khoa()` + `.dang-chay.json`** | | Khoá ghi toàn cục theo thư mục. Nghiệm thu `BAN_GIAO.md` mục 3 còn ghi *"Bấm chạy khi đang mở 02_KET-QUA.xlsx → hệ thống chặn"* — ràng buộc của công cụ desktop |
| **SQLite của SocialFlow** | | Không phục vụ đa tenant |
| **Frontend một tệp `index.html` React+Babel** của SocialFlow (3.2k dòng) | | Không build step, không type check |
| **Enum `Role` của FloraOS** (còn giá trị di sản `MANAGER`) | | §13 đòi vai mở rộng được → vai phải là bản ghi |

---

## 5. Thứ tự harvest

Nguyên tắc: **luật nghiệp vụ đi kèm test của nó, và test phải xanh trước khi bỏ tệp gốc.** Đây là lưới an toàn duy nhất chống mất luật không ai viết ra.

| Đợt | Việc | Phụ thuộc |
|---|---|---|
| **H0** | Dựng `floraos-core` theo khuôn R6; chép R8 làm chuẩn tài liệu | — |
| **H1** | **B1 + B2** — Organization/Workspace/Membership/Branch + tenant xuyên suốt, **trước mọi harvest khác** | H0 |
| **H2** | **R2** bảng 76 mã năng lực + thêm phạm vi org/branch + tách `*.approve` (§13) | H1 |
| **H3** | **E1 + E2** — Asset (từ SocialFlow) và GenerationJob (từ LocalBudd), cùng **B3 Usage** trong một đợt (§12: hạn mức kiểm tại điểm enqueue → cùng đường mã) | H1 |
| **H4** | **E3** BusinessProfile/BrandProfile | H1 |
| **H5** | **R1 + E5 + E6** — hợp đồng AI Vision + engine đếm + engine màu → M01 chạy được trên hệ mới | H3 |
| **H6** | **R3 + R4 + R5** — engine giá + bất biến → M02 | H5 |
| **H7** | **A3** nạp dữ liệu AVI GIFT từ Excel một chiều vào hệ mới | H4, H5, H6 |
| **H8** | **B4** M04a Identity Guard theo spec | H3, H5 |
| **H9** | **B6** Integration Layer; LocalBudd bỏ bảng trùng, đọc core qua API; **E7** adapter đăng bài | H3, H4 |
| **H10** | **B5** Experience Mode | H2, H3 |

**Cắt sang hệ mới một lần.** FloraOS v1 giữ nguyên chạy phục vụ AVI GIFT, **đóng băng tính năng**, không migrate dần. Dữ liệu production hiện rất nhỏ (320KB + 862KB Excel, 14 thư mục ảnh) nên H7 là việc vài ngày, không phải việc tháng.

---

## 6. Quyết định cần chủ sản phẩm chốt

1. **Đường A hay Đường B** ở mục 2 — quyết định này chặn mọi việc khác.
2. **§2 của tài liệu đích phải sửa lại**: hoặc LocalBudd bỏ 5 bảng trùng, hoặc §2 công nhận LocalBudd là core. Không giữ nguyên §2 mà không làm gì được.
3. ~~**SocialFlow lên đa tenant, hay ở lại làm worker đơn tenant**~~ — **ĐÃ CHỐT 09/10: đa tenant thật** (D1-b). Câu hỏi gốc giữ lại làm hồ sơ: **SocialFlow lên đa tenant, hay ở lại làm worker đơn tenant** mà core gọi kèm ngữ cảnh org? *(Khuyến nghị: worker đơn tenant — rẻ hơn nhiều, đúng tinh thần §11 "không ghép chặt core vào chi tiết cài đặt của SocialFlow".)*
4. **Mã API AI**: mỗi tổ chức tự mang khoá, hay khoá nền tảng + tính credit theo org?
5. **Quy ước đặt tên**: FloraOS dùng tiếng Việt, LocalBudd dùng `snake_case` tiếng Anh, SocialFlow tiếng Anh. Core mới theo cái nào? *(Khuyến nghị: theo LocalBudd — `snake_case` tiếng Anh cho lược đồ, vì đó là khuôn được chép.)*
6. **Job `COMPLETED / result = REJECTED` có tính phí không?** (§12 đã nêu, chưa trả lời.)
