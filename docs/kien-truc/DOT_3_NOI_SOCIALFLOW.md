# Đợt 3 — nối SocialFlow vào core

**Ngày lập:** 2026-09-10, sau khi Đợt 0+1+2 nghiệm thu xong đầu-cuối.
**Tiền đề:** `RA_SOAT_DONG_BO_BA_REPO.md` mục 5 (Đợt 3), `UNIFIED_SHELL.md` Nhóm B3, `SocialFlow/TECHNICAL_DEBT.md` mục "D1 — HOÀN TẤT".
**Cách lập:** đọc mã thật và đếm trên `socialflow.db` thật, không dựa vào tài liệu tự khai.

---

## 1. Ba quyết định đã chốt (anh Tony, AskUserQuestion 09/10)

| # | Quyết định |
|---|---|
| Đ3-1 | **Phạm vi Đợt 3 = ranh giới**: xác thực + tổ chức + brand + usage. KHÔNG xây tính năng mới. |
| Đ3-2 | **Core là nguồn cho phần chung của brand**; các cột chỉ SocialFlow dùng ở lại cục bộ. Đúng luật cắt sở hữu dữ liệu (PRD §8). |
| Đ3-3 | **Ba tài khoản social đang sống gán hết cho AVI GIFT.** Hệ quả đã biết và chấp nhận: 45 bài đăng + chỉ số lịch sử của thương hiệu gốc (InBharat AI) sẽ tính vào số liệu của AVI GIFT. Ai đọc analytics sau này phải biết điều đó. |

---

## 2. Thực trạng đo được — ba con số đổi kế hoạch

Tài liệu hiện có (`UNIFIED_SHELL.md` B3) mô tả Đợt 3 như "một middleware FastAPI xác minh JWT". Đo thật thì việc lớn hơn thế đáng kể.

### 2.1 Không phải 37 route, mà **75**

`main.py` có 37 route. Nhưng repo còn năm router phụ:

| Tệp | Route | Biết `organization_id` |
|---|---|---|
| `main.py` | 37 | 9 |
| `heygen_routes.py` | 13 | **0** |
| `assets_routes.py` | 6 | **0** |
| `visual_content_routes.py` | 5 | **0** |
| `openclaw_bridge.py` | 4 | **0** |
| `brand_kit.py` | 5 | 5 |
| **Tổng** | **75** | **14** |

**61 trên 75 route không có khái niệm tổ chức nào.** D1 (A1–A7) đã làm sạch tầng DỮ LIỆU và tầng AGENT — cột `organization_id` có mặt, sáu agent lọc đúng — nhưng tầng HTTP thì mới chạm tới 14 route.

### 2.2 Lỗ rò nghiêm trọng nhất không phải thiếu xác thực, mà là endpoint thao-tác-theo-ID

```python
@app.post("/api/pipeline/approve/{post_id}")
async def api_approve_post(post_id: int):
    conn.execute("UPDATE posts SET status = 'approved' WHERE id = ? ...", (post_id,))
```

Không mệnh đề `organization_id` nào. Cùng khuôn đó ở `reject`, `publish`, `posts/{id}` (PUT/DELETE/publish), và toàn bộ `assets_routes.py`/`heygen_routes.py`. Ngay khi có tổ chức thứ hai, bất kỳ ai đoán được một số nguyên là duyệt và ĐĂNG được bài của tổ chức khác.

Đây là gap mà chính `A5` ghi lại là "thuộc phạm vi soát bảo mật Nhóm D" — nhưng nó phải nằm trong Đợt 3, vì mở SSO mà để nguyên nó thì chỉ làm lỗ rò dễ với tới hơn, không loại bỏ nó. Đúng nguyên tắc `UNIFIED_SHELL.md` §3 đã dùng để hoãn B3 lúc trước.

### 2.3 `video_jobs` bị bỏ sót ở A4

```
accounts               3 dòng   org_id=True
assets                14 dòng   org_id=True
brand_config           1 dòng   org_id=True
content_plans         18 dòng   org_id=True
posts                 45 dòng   org_id=True
signals               11 dòng   org_id=False   ← dùng chung có chủ đích (A5)
video_jobs             2 dòng   org_id=False   ← BỎ SÓT
```

`video_jobs` dựng ở `migrations.py`, không nằm trong danh sách sáu bảng A4 xử lý. Nó mang cả `cost_usd` — nghĩa là vừa là lỗ tenant, vừa là nguồn dữ liệu cho phần usage ở Nhóm G.

### 2.4 Chi phí thật đã được ghi sẵn

`assets.cost_usd` và `video_jobs.cost_usd` đã có giá trị thật (`IMAGE_COST_USD`, `provider.estimated_cost(duration)` của Veo/HeyGen). Nối sang `POST /integration/usage` là việc **nối dây**, không phải việc đo đạc. Đây là phần rẻ nhất của cả Đợt 3.

### 2.5 Facebook Graph dùng một Page token chung cho mọi tổ chức

`FacebookGraphClient.__init__` rơi về `os.getenv("FB_PAGE_ID")` / `FB_PAGE_ACCESS_TOKEN`. Constructor CÓ nhận tham số tường minh, nên đường ống đã sẵn — nhưng bảng `accounts` chỉ có `password_encrypted`, không có chỗ chứa page id/token theo tổ chức.

Hệ quả nếu để nguyên: tổ chức B bấm đăng, bài lên Page của tổ chức A. Đây là lỗi tệ nhất trong toàn bộ danh sách — không phải rò đọc, mà là **đăng công khai nhầm thương hiệu**. Phải nằm trong Đợt 3.

---

## 3. Phạm vi

**Làm:** xác thực người gọi, ranh giới tổ chức trên toàn bộ 75 route, đồng bộ brand từ core, báo usage/chi phí về core, migrate `"default"` → UUID thật.

**KHÔNG làm** (ghi ra để không ai tưởng nhầm là bỏ sót):

- **M04b** — kéo Master Image đã duyệt về rồi chồng chữ/logo (đặc tả 08 §5). Là xây tính năng mới, không phải nối ranh giới. Anh Tony chốt để sau.
- **Chiến lược nội dung cho tiệm hoa.** Sáu agent hiện hướng về tin công nghệ (`Scout` kéo HackerNews/GitHub) — di sản repo gốc InBharat AI. Với AVI GIFT thì nguồn đó vô nghĩa. Việc sản phẩm, không phải việc tích hợp.
- **Proxy/domain** (Nhóm C của `UNIFIED_SHELL.md`) — chờ anh Tony chốt hosting.

---

## 4. Nhóm E — xác thực và ranh giới tổ chức

Việc nặng nhất. Không rút gọn được: 61 route phải đi qua.

| # | Việc | Phụ thuộc |
|---|---|---|
| E1 | Module xác minh JWT `floraos_sso` — HS256, đọc `SSO_SESSION_SECRET` dùng chung với core. **Dùng `hmac`/`hashlib`/`base64` của thư viện chuẩn, KHÔNG thêm PyJWT**: nó là bản dịch từng dòng của `floraos-core/src/modules/sso/infra/sso-jwt.ts` nên hai bên đối chiếu bằng mắt được, `hmac.compare_digest` đã cho so sánh chống đo thời gian, và `requirements.txt` không phải mọc thêm một phụ thuộc cho 25 dòng mã. Kèm test: chữ ký sai, payload sửa, hết hạn, hình dạng sai, `org` null | — |
| E2 | **Kiểm kê 75 route thành bốn nhóm** trước khi sửa bất cứ route nào: (a) theo tổ chức — lấy org từ token; (b) trung tính — `/`, `/api/health`, `/api/video-providers`, `/api/avatar-catalog`; (c) quản trị máy chủ — `/api/config` đọc/ghi biến môi trường, không phải dữ liệu tổ chức; (d) chạy nền — điểm vào của APScheduler. Bảng này là đầu ra của E2, và là thứ review đối chiếu ở E8 | E1 |
| E3 | `Depends(require_org)` của FastAPI: đọc cookie `floraos_sso` (host-only nên tự đi kèm giữa các cổng trên localhost), xác minh, trả `organization_id`. Áp lên toàn bộ nhóm (a). Route nào không xác minh được trả 401, không rơi về mặc định | E2 |
| E4 | **Đóng lỗ thao-tác-theo-ID**: mọi truy vấn theo `{post_id}`/`{asset_id}`/`{job_id}` thêm `AND organization_id = ?`. Không tìm thấy trả 404, không phải 403 — cùng luật `YC-T4` của core: phân biệt hai thứ là xác nhận bản ghi tồn tại | E3 |
| E5 | `video_jobs.organization_id` + index, qua `migrations.py` đúng khuôn A4; lọc theo tổ chức ở `video_jobs.py` và 13 route `heygen_routes.py` | E2 |
| E6 | **Facebook Graph theo tổ chức**: cột credential mới trên `accounts` (mã hoá bằng Fernet sẵn có, cùng cách `password_encrypted` đang làm), `FacebookGraphClient` nhận page id/token từ hàng `accounts` của đúng tổ chức thay vì `os.getenv`. Biến môi trường chỉ còn là dự phòng cho môi trường một-tổ-chức | E3 |
| E7 | **Bỏ hẳn `DEFAULT_ORGANIZATION_ID`.** Tổ chức chỉ đến từ token đã xác minh; không endpoint nào còn nhận `organization_id` từ query/body — gửi lên thì BỎ QUA, không trả lỗi (đặc tả 08 §3) | E3, E4, E5, E6 |
| E8 | Test hai tổ chức chạy thật trên máy có mạng: mỗi route nhóm (a) thử bằng token của tổ chức khác phải trả 404/401; ba tài khoản thật không bị đụng | E7 |

**Vì sao E4 phải trước E7:** bỏ `DEFAULT_ORGANIZATION_ID` mà chưa đóng lỗ theo-ID thì hệ thống chuyển từ "một tổ chức, không có ranh giới" sang "nhiều tổ chức, ranh giới thủng" — tệ hơn trạng thái hiện tại.

---

## 5. Nhóm F — brand lấy từ core

| # | Việc | Phụ thuộc |
|---|---|---|
| F1 | **Bảng ánh xạ `brand_profiles` → `brand_config`**, chốt từng cột trước khi viết mã. Phần CHUNG (core là nguồn, SocialFlow chỉ đọc): `primary_color`, `secondary_color`, `light_bg`←`background_color`, `primary_font`←`font_heading`, `tone`←`tone_of_voice`, `forbidden_styles`, `hashtags_*`←`hashtags` (Json theo nền tảng), `cta_template`←`cta_templates`. Phần RIÊNG ở lại cục bộ: `brand_name`, `tagline`, `dark_bg`, `success/warning/danger_color`, `code_font`, `heading_weight`, `body_weight`, `products_json`. Cột `accent_color`/`text_color` của core chưa có chỗ nhận — thêm cột mới hay bỏ qua, chốt ở F1 | E1 |
| F2 | Client HTTP sang core bằng `httpx` (đã có trong `requirements.txt`) — hai chế độ xác thực: chuyển tiếp `X-FloraOS-SSO` cho lời gọi có người dùng, `Authorization: Bearer` cho lời gọi nền (xem G1) | E1 |
| F3 | Đồng bộ khi đọc + cache: `get_brand_config(org)` gọi `GET /integration/brand-profile`, ghi đè phần chung vào `brand_config`, giữ nguyên phần riêng. **Core không gọi được thì dùng giá trị đã cache, KHÔNG dừng việc đăng bài** — khác hẳn quyết định "chặn thật" của LocalBudd, vì ở đây thứ bị chặn là một bài đăng đã duyệt, không phải một lượt tiêu credit | F1, F2 |
| F4 | Năm route giao diện brand kit: phần chung chuyển sang chỉ-đọc, kèm câu chỉ đường "sửa ở FloraOS". Phần riêng vẫn sửa được tại chỗ | F3 |
| F5 | `forbidden_styles` áp như RÀNG BUỘC trong prompt của `creator.py`, không phải gợi ý — cùng luật đã cài ở LocalBudd (đặc tả 08 §4b) | F3 |

---

## 6. Nhóm G — usage và chi phí về core

| # | Việc | Phụ thuộc |
|---|---|---|
| G1 | **Kho token máy-gọi-máy theo tổ chức.** Lịch tự động (`run_scheduled_cycle`) chạy không có người dùng nào đứng sau, nên nó KHÔNG có JWT để chuyển tiếp — đây là khác biệt thật so với LocalBudd, nơi mọi lời gọi đều có người dùng. Bảng mới trong SocialFlow giữ một token `client=SOCIALFLOW` mỗi tổ chức, mã hoá bằng Fernet sẵn có. Cấp token bên core bằng `POST /api/v1/integration-tokens` | E7 |
| G2 | Báo chi phí thật: tại đúng những điểm đã tính sẵn `cost_usd` (`generate_image_asset`, `video_jobs`, adapter HeyGen/Veo) gọi `POST /integration/usage` với `status=COMPLETED`. Không chặn — usage là ghi nhận sau, khác hạn mức | G1, F2 |
| G3 | Script đối chiếu: tổng `cost_usd` trong `assets` + `video_jobs` của một tổ chức trong kỳ, so với `usage` bên core. Cùng tinh thần `npm run doi-chieu` của P8 — không tin là đã nối đúng cho tới khi hai con số khớp | G2 |

---

## 7. Nhóm H — cắt sang dữ liệu thật và nghiệm thu

| # | Việc | Phụ thuộc |
|---|---|---|
| H1 | Script migrate `organization_id`: `"default"`/`NULL` → UUID thật của AVI GIFT, trên **mọi** bảng có cột đó (`accounts`, `assets`, `brand_config`, `posts`, `content_plans`, `content_queue`, `post_metrics`, `campaigns`, `templates`, `weekly_metrics`, `content_insights`, `signal_org_processed`, `video_jobs`). Nhận `--org-id` chứ không gắn cứng: UUID của AVI GIFT đổi mỗi lần bootstrap lại trên máy dev. Idempotent, chạy trên BẢN SAO trước | E5, E7 |
| H2 | Đổi tên tệp phiên Playwright theo `organization_id` mới — A5 đã đưa org vào tên tệp, nên đổi id nghĩa là ba phiên đăng nhập thật hiện tại phải được đổi tên theo, nếu không sẽ phải đăng nhập lại cả ba nền tảng | H1 |
| H3 | Siết CORS: bỏ `http://localhost:3000` khỏi `allow_origins` (đang kèm `allow_credentials=True`, tức bất kỳ trang nào chạy ở cổng 3000 cũng đọc được API kèm cookie). Giữ đúng origin của shell | E7 |
| H4 | Nghiệm thu đầu-cuối trên máy thật: đăng nhập một lần ở core → mở SocialFlow → thấy đúng dữ liệu của tổ chức đang hoạt động; đổi tổ chức ở core → SocialFlow đổi theo; token giả/hết hạn bị từ chối; ba tài khoản thật vẫn đăng được | H1, H2, H3, G3 |
| H5 | Cập nhật `UNIFIED_SHELL.md` (B3, B4), `SocialFlow/TECHNICAL_DEBT.md`, `Checklist_Thuc_Thi.md`, `TRANG_THAI.md`; commit mã và tài liệu cùng lúc | H4 |

---

## 8. Thứ tự thực thi

```
E1 → E2 → E3 → E4 ─┬→ E7 → E8
              E5 ──┤
              E6 ──┘
                   └→ F1 → F2 → F3 → F4, F5
                            └→ G1 → G2 → G3
                                        └→ H1 → H2 → H3 → H4 → H5
```

Ba điều kiện chặn, không lách:

1. **E4 trước E7.** Lý do ở mục 4.
2. **H1 sau E7.** Migrate id trong lúc còn đường nào đó rơi về `"default"` sẽ để lại dữ liệu mồ côi giữa hai không gian định danh.
3. **G1 sau E7.** Cấp token máy-gọi-máy cho một hệ chưa có ranh giới tổ chức là cấp một chìa khoá mở mọi cửa.

---

## 9. Rủi ro đã thấy trước

| Rủi ro | Xử lý |
|---|---|
| Ba tài khoản Playwright thật mất phiên đăng nhập khi đổi `organization_id` | H2 làm đúng việc đó. Chạy trên bản sao trước, và chuẩn bị sẵn khả năng phải đăng nhập lại thủ công ba nền tảng |
| 45 bài + chỉ số của thương hiệu gốc thành số liệu của AVI GIFT | Hệ quả đã chấp nhận ở Đ3-3. Ghi một dòng vào `TECHNICAL_DEBT.md` để người đọc analytics sau này biết mốc nào là dữ liệu kế thừa |
| Sửa 61 route là 61 chỗ có thể quên một chỗ | E2 (bảng kiểm kê) là công cụ chống quên; E8 đối chiếu từng dòng của bảng đó. Không nhận "đã sửa xong" mà không có bảng |
| SQLite + nhiều tổ chức chạy lô song song | A2/A6 đã đo và thiết kế: SQLite chỉ khoá lúc ghi đĩa, không khoá lúc chờ mạng. Chưa cần đổi sang Postgres |
| Core sập thì SocialFlow ngừng đăng bài | F3 chốt ngược với LocalBudd: dùng cache, không chặn. Bài đã duyệt vẫn lên |

---

## 10. Cần anh Tony trước khi bắt đầu

Không có gì chặn E1–E4 — bắt đầu được ngay.

Ba thứ cần trước khi tới H:

1. **UUID tổ chức AVI GIFT tại thời điểm cắt** (H1). Trên máy dev nó đổi mỗi lần bootstrap lại; lúc cắt thật thì lấy một lần và cố định.
2. **Xác nhận có chấp nhận phải đăng nhập lại ba nền tảng** nếu H2 không giữ được phiên.
3. **Domain thật** (Nhóm C) — không chặn Đợt 3, nhưng H3 (siết CORS) chỉ chốt được giá trị cuối khi biết origin thật.
