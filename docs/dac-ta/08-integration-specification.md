# 08 — Đặc tả tích hợp

Core phơi dữ liệu lõi ra cho hai engine ngoài. Bản đồ thu hoạch ở `../kien-truc/HARVEST_MANIFEST.md`; đối chiếu với mã thật ở `../kien-truc/RA_SOAT_THU_HOACH.md`.

## 1. Luật cắt sở hữu dữ liệu

> Core sở hữu entity mà **nhiều hơn một** module đọc.
> Engine sở hữu entity **chỉ module của nó** đọc.

| `floraos-core` | `LocalBudd` | `SocialFlow` |
|---|---|---|
| `organizations` · `workspaces` · `memberships` · `roles` · `branches` | `pages` · `page_versions` · `layouts` | `content_queue` · `posts` |
| `business_profiles` · `brand_profiles` | `design_directions` · `design_contracts` | `campaigns` · `signals` · `content_plans` |
| `products` · `product_variants` · `product_analyses` · `pricing_rules` | `publish_records` | `post_metrics` · `weekly_metrics` · `content_insights` |
| `assets` · `generation_jobs` · `usage` · `audit_logs` | | `social_accounts` · `video_jobs` |
| `product_copies` · `occasions` · `customers` · `customer_occasions` · `customer_consents` · `vouchers` | | |
| `orders` · `order_items` · `order_assignments` · `order_events` | | |
| `learning_profiles` · `campaign_rollups` · `catalog_links` · `conversations` | | `post_metrics` *(số liệu gốc)* |
| `ai_capabilities` · `ai_models` · `ai_policies` · `ai_requests` · `ai_evaluations` | | |
| `flower_taxonomy` · `knowledge_chunks` · `content_features` | | |

## 2. Việc phải làm ở hai engine

**`LocalBudd` bỏ năm bảng** khỏi lược đồ của nó: `products`, `product_assets`, `media_assets`, `generation_jobs`, `projects`. Đọc core qua Integration API thay thế. Đây là hạng mục có tên trong lộ trình ở P7, không phải việc tuỳ nghi.

`projects` là trường hợp riêng: nó chỉ có `owner_id`, một chủ sở hữu duy nhất, không có thành viên và không có vai. Vai trò của nó chuyển sang `workspaces` của core.

> **Trạng thái thật, cập nhật 2026-09-10.** Mục tiêu năm bảng ở trên chưa đạt, và đã đi khác một phần theo quyết định B2c/B2d của Unified Shell — ghi ở đây để không ai đọc đặc tả rồi tưởng nó đã xảy ra:
>
> | Bảng | Ý định gốc | Thực tế |
> |---|---|---|
> | `media_assets` | bỏ | đã bỏ (chết hẳn, không ai đọc) |
> | `products` | bỏ | CÒN, đổi nghĩa thành bản ghi THAM CHIẾU (`core_product_id`, unique theo project) — LocalBudd không còn tạo dữ liệu sản phẩm cục bộ |
> | `product_assets` | bỏ | còn nguyên |
> | `generation_jobs` | bỏ | CÒN — LocalBudd giữ hàng đợi job của riêng nó; core kiểm hạn mức qua `POST /integration/jobs` (xem mục 4c) |
> | `projects` | bỏ, vai trò sang `workspaces` | còn nguyên, thêm `organization_id` |
>
> Ba bảng còn chặn vì bề mặt tích hợp trước đây chỉ có đường đọc. Ba đường ghi ở mục 4d là chỗ mở khoá: `product_assets` bỏ được khi dẫn xuất đăng ký về `assets` của core, và `products` giữ nguyên nghĩa tham chiếu đã chốt ở B2c.

**`SocialFlow` nhận `organization_id`** trên mọi lời gọi. **Quyết định D1 chốt lại 2026-09-10 (anh Tony): đa tenant THẬT**, không phải "worker đơn tenant" như bản đặc tả này ghi trước đó. Bản cũ mâu thuẫn với `../kien-truc/UNIFIED_SHELL.md` mục 4 và với mã đã chạy — `organization_id` nay có mặt trên mọi bảng SocialFlow sở hữu (`posts`, `signals`, `content_plans`, `content_queue`, `assets` nội bộ, `brand_config`), sáu agent đã lọc theo tổ chức, và điều phối chạy lô song song theo tổ chức (D1 Pha 2, A1–A7). SQLite giữ nguyên.

Việc còn thiếu ở `SocialFlow` KHÔNG phải mô hình tenant mà là **xác thực**: repo chưa có middleware nào xác minh người gọi, `organization_id` vẫn là giá trị bên gọi tự khai. Đó là Nhóm B3 của `UNIFIED_SHELL.md`.

## 3. Xác thực máy gọi máy

Token cấp theo tổ chức, do core ký, mang `organization_id` bên trong.

**Bổ sung 2026-09-10 — đường danh tính thứ hai: `X-FloraOS-SSO`.** Token máy gọi máy một mình không đủ cho một engine ngoài PHỤC VỤ NHIỀU TỔ CHỨC: nó gắn cứng vào đúng một tổ chức, nên khi `LocalBudd` giữ một token trong biến môi trường thì mọi người dùng đăng nhập vào đó — bất kể thuộc tổ chức nào — đều đọc dữ liệu của tổ chức đã cấp token. Đây là lỗi rò dữ liệu chéo tổ chức, phát hiện ở `../kien-truc/RA_SOAT_DONG_BO_BA_REPO.md` mục 3.1.

Cách sửa đã chốt (quyết định của anh Tony): mọi route `/integration/*` chấp nhận thêm header `X-FloraOS-SSO` mang JWT `floraos_sso` — engine ngoài chuyển tiếp nguyên văn cookie mà chính người dùng đang giữ.

| | `Authorization: Bearer` | `X-FloraOS-SSO` |
|---|---|---|
| Danh tính | app (máy gọi máy) | NGƯỜI DÙNG + tổ chức đang hoạt động của người đó |
| `organization_id` từ đâu | bản ghi `integration_tokens` | claim `org` trong JWT do core ký |
| Năng lực áp dụng | không có (`capabilities` rỗng) | năng lực THẬT của người đó, giải bằng cùng đường với phiên người dùng |
| Dùng khi | lời gọi nền: cron, đối soát | mọi lời gọi thay mặt một người đang đăng nhập |

**SSO thắng khi lời gọi mang cả hai** — phạm vi của nó hẹp hơn. Người không còn là thành viên `ACTIVE` bị từ chối ngay ở lời gọi kế tiếp, không chờ JWT hết hạn (JWT sống 15 phút, `modules/sso/domain/sso-claims.ts`).

Hệ quả cho cổng "chỉ app này đọc được" ở mục 4: cổng đó chỉ áp cho nhánh token. Nhánh SSO không mang danh tính app đáng tin nên được gác bằng năng lực người dùng, vốn chặt hơn.

**Ngoại lệ: năng lực không bao giờ vượt biên.** Luật của mục 4 là luật về ENGINE, không phải luật về NGƯỜI — thứ gì không được rời core thì không rời core, bất kể ai đang thao tác. Nhánh SSO mang năng lực thật của người dùng, nên nếu để nguyên, một người sáng lập (có `L5`) sẽ kéo được khối `pricing` của `GET /products` qua biên. Vì `LocalBudd` sinh landing page và catalogue CÔNG KHAI và cache lại dữ liệu sản phẩm, khối giá vượt biên là khối giá có đường tới trang public.

Cách cưỡng chế: `modules/integration/domain/boundary-capabilities.ts` giữ danh sách mã bị trừ khỏi `capabilities` ở nhánh SSO — hiện là `L5`. Nó chỉ TRỪ, không bao giờ thêm; người không có `L5` vẫn không có `L5`. Người sáng lập vẫn xem được giá vốn trong giao diện của chính core, chuyện đó không đổi.

Phát hiện trong lượt xác minh đầu-cuối 2026-09-10 (khối `pricing` hiện ra trong đáp ứng thật); quyết định của anh Tony cùng ngày.

**Engine ngoài không bao giờ tự khai `organization_id`.** Nếu nó gửi lên, core bỏ qua giá trị đó — không phải trả lỗi, mà là bỏ qua, vì trả lỗi cho biết trường đó có tồn tại và có tác dụng.

Token có phạm vi năng lực riêng, hẹp hơn năng lực của người dùng. Token của `LocalBudd` đọc được Product Master và Master Image đã duyệt; nó không có năng lực duyệt và không đọc được `audit_logs`.

Token có hạn và xoay được mà không dừng dịch vụ: core chấp nhận hai token cùng lúc trong thời gian xoay.

## 4. Bề mặt core phơi ra

Đặc tả endpoint ở tài liệu 06 mục 11. Nội dung phơi ra:

| Dữ liệu | Ai đọc | Ràng buộc |
|---|---|---|
| Product Master | LocalBudd, SocialFlow | Chỉ sản phẩm `ACTIVE` |
| Master Image và các tỉ lệ | LocalBudd, SocialFlow | **Chỉ ảnh `approval_state = APPROVED`** |
| BusinessProfile | LocalBudd | |
| BrandProfile | LocalBudd, SocialFlow | |
| GenerationJob | cả hai | Tạo job thay mặt tổ chức, đọc trạng thái |
| Usage | cả hai | Ghi mức dùng phát sinh ở engine ngoài |
| Kiểm quyền | cả hai | Hỏi một người có năng lực gì |
| Hồ sơ phong cách | SocialFlow, LocalBudd | Chỉ hồ sơ `is_sufficient = true`; hồ sơ chưa đủ dữ liệu không rời core |

Ảnh chờ duyệt không rò ra ngoài core. Đây là điểm dễ hỏng nhất của tích hợp: engine ngoài lấy được ảnh chưa duyệt rồi đăng lên mạng xã hội thì cổng duyệt trở thành trang trí.

**Ảnh phải TẢI ĐƯỢC, không chỉ có `storage_key` (bổ sung 2026-09-10).** Bản đầu của `GET /integration/products/:id/master-image` trả `storage_key` trần. Kho tệp của core (`/api/v1/storage/[...key]`) chỉ nhận URL ký sẵn HMAC — không nhận token tích hợp lẫn cookie phiên — nên engine ngoài cầm `storage_key` mà không có đường nào lấy được byte ảnh: ranh giới bàn giao ở mục 5 không đi qua được. Nay mỗi ảnh trả kèm trường `url`: URL ký sẵn TUYỆT ĐỐI, hạn 15 phút, `origin` lấy từ chính lời gọi (nên vẫn đúng sau khi Nhóm C dựng proxy). Hạn ngắn có chủ đích: engine tải ngay, không lưu lại URL.

### 4b. Ánh xạ hồ sơ sang design contract của LocalBudd

`design_contracts` của `LocalBudd` dựng từ hồ sơ do core giữ. Bảng ánh xạ:

| `design_contract` | Lấy từ core |
|---|---|
| `colors.primary` | `brand_profiles.primary_color` |
| `colors.secondary` | `brand_profiles.secondary_color` |
| `colors.background` | `brand_profiles.background_color` |
| `colors.text` | `brand_profiles.text_color` |
| `typography.heading` | `brand_profiles.font_heading` |
| `typography.body` | `brand_profiles.font_body` |
| `vibe` | `brand_profiles.tone_of_voice` |
| `layout_hints` | thuộc `LocalBudd`, core không giữ |

Nội dung trang lấy từ `business_profiles`: tên hiển thị, điện thoại, email, địa chỉ, giờ mở cửa, website, liên kết mạng xã hội.

`forbidden_styles` của `brand_profiles` là ràng buộc, không phải gợi ý: engine ngoài phải loại các kiểu nằm trong danh sách đó trước khi sinh.

### 4c. Hạn mức: chặn thật, không phải ghi nhận sau

`POST /integration/jobs` tái dùng `enqueueJob`, nên nó kiểm hạn mức TRƯỚC khi tạo job và trả `QUOTA_EXCEEDED` (HTTP 422) khi tổ chức hết credit.

**Quyết định 2026-09-10 (anh Tony):** engine ngoài phải `await` lời gọi này TRƯỚC khi ghi job vào hàng đợi của chính nó, và từ chối việc khi core nói không. Bản B2d trước đó gọi song song và nuốt lỗi, nên hạn mức của core chỉ là ghi nhận sau khi việc đã xảy ra — tổ chức hết credit vẫn sinh được trang.

Đánh đổi đã chấp nhận khi chốt: **core không gọi được thì engine ngoài không chạy việc tính phí được.** Engine phải phân biệt hai thứ trong mã của nó — "core trả lời là không" (422, hết hạn mức) khác "không hỏi được core" (mạng/sập) — vì hai thứ đó cần hai câu trả lời khác nhau cho người dùng.

### 4d. Ba đường ghi, không nhiều hơn

Bề mặt tích hợp là bề mặt đọc, trừ đúng ba đường. Ba đường này tồn tại vì không có chúng thì engine ngoài buộc phải giữ nguồn sự thật thứ hai — đúng cái mà luật cắt ở mục 1 được lập ra để chặn.

| Đường ghi | Ai gọi | Ràng buộc |
|---|---|---|
| `POST /integration/assets` | SocialFlow (M04b, M04c) | `parent_asset_id` bắt buộc trỏ tới asset `APPROVED` của cùng tổ chức; asset vào với `approval_state = PENDING` |
| `POST /integration/content-metrics` | SocialFlow (M07) | Khoá tự nhiên `(organization_id, platform, external_post_id, ngày)`; chạy lại không nhân đôi |
| `POST /integration/usage` | cả hai engine | `cost_credit` luôn 0 — credit đã trừ ở `POST /integration/jobs` |
| `POST /integration/ai-requests` | cả hai engine | Chỉ số đo về lời gọi mô hình: mô hình, chi phí, độ trễ, điểm. Không mang dữ liệu nghiệp vụ, nên không qua cổng duyệt |

**Engine ngoài không đặt được trạng thái duyệt.** Nó đăng ký một dẫn xuất đã hoàn tất; cổng duyệt nằm ở core và mục đăng ký vào hàng chờ duyệt của core như mọi đầu ra AI khác. Nếu engine đặt được `APPROVED` thì cổng duyệt của toàn hệ thống nằm trong tay repo yếu nhất về xác thực.

**Đường ghi không nhận bản nháp.** Một biến thể đang soạn, một nội dung chưa xong, một số liệu chưa chốt ngày — ba thứ đó ở lại engine. Core nhận kết quả, không nhận trạng thái làm việc của engine.

### 4f. Chính sách AI đi ra, số đo đi về

`GET /integration/ai-policy` trả chính sách AI của tổ chức: năng lực được phép, mô hình đủ điều kiện kèm trạng thái đo lường, ngưỡng chấp nhận, và sàn quyền riêng tư. Engine ngoài giữ cổng AI của riêng nó nhưng **đọc cùng một sổ đăng ký và cùng chính sách** — sổ đăng ký sống ở core, một bản.

Khi không gọi được core, engine dùng bản cache gần nhất và **không tự nới chính sách**. Đây là chiều ngược với quyết định ở mục 4c: ở đó core không gọi được thì engine dừng việc tính phí, còn ở đây engine vẫn chạy bằng chính sách đã biết. Lý do khác nhau: hạn mức là tiền của tổ chức và phải chặn thật, còn chính sách AI là một giới hạn — dùng bản cũ chỉ có thể chặt hơn hoặc bằng, không thể lỏng hơn, miễn là engine không tự thêm mô hình.

Một engine tự quyết mô hình nào được dùng là một engine có thể gửi ảnh khách tới một nhà cung cấp chưa ai soát điều khoản lưu trữ và huấn luyện. Đó là lý do đường này tồn tại thay vì để mỗi repo tự cấu hình.

## 5. Ranh giới bàn giao Master Image — M04a sang M04b và M04c

Master Image là ranh giới. Trước nó là `floraos-core`, sau nó là `SocialFlow`.

| | M04a — core | M04b và M04c — SocialFlow |
|---|---|---|
| Câu hỏi trả lời | Đây có phải ảnh trung thực của đúng sản phẩm thật không? | Ảnh và video này có bán được trên kênh này không? |
| Thành phần | Phân tích chất lượng, tách sản phẩm, tăng cường, Identity Guard, Master Image, Smart Reframe | Chữ chồng, logo, khuôn thương hiệu, nền marketing, biến thể theo kênh · chuyển cảnh, nhạc, phụ đề, giọng đọc, CTA |
| Đầu ra | `assets` và `products` — entity lõi | Creative và video theo kênh, đăng ký về `assets`, đẩy sang M07 |

**M04b không bao giờ chạy lại tăng cường sản phẩm và không bao giờ đổi nhận dạng sản phẩm.** Nó soạn lên trên một Master Image đã duyệt. Bất kỳ thay đổi nào chạm vào chính sản phẩm đều thuộc M04a và phải qua Identity Guard.

M04a đặt ở core vì Identity Guard gọi M01 hai lần mỗi ảnh; đặt cạnh M01 tránh hai lượt gọi mạng liên repo cho mỗi ảnh trong ngưỡng 10–30 giây với 100–500 người dùng đồng thời.

**M04c chịu cùng luật với M04b.** Video là lớp dựng cảnh phủ lên Master Image và các tỉ lệ đã sinh, nên nó không cần Identity Guard và không đứng cạnh M01. Khung đầu và khung cuối luôn là ảnh đã duyệt.

### 5.1 Vòng bàn giao, đầy đủ

```
core                                    SocialFlow
────                                    ──────────
GET /integration/products/:id/master-image
   → URL ký sẵn, 15 phút, chỉ ảnh APPROVED
                                   ──►  M04b soạn biến thể
                                        M04c dựng video
POST /integration/assets           ◄──  đăng ký dẫn xuất đã hoàn tất
   → assets, PENDING, vào hàng chờ duyệt
POST /integration/usage            ◄──  chi phí thật mỗi lượt
POST /integration/content-metrics  ◄──  số liệu sau khi đăng
GET /integration/learning-profile  ──►  tham số soạn nội dung của tổ chức
```

Vòng này khép kín và một chiều ở mỗi chặng: ảnh đã duyệt đi ra, dẫn xuất và số liệu đi về. Không chặng nào cho engine ngoài đọc dữ liệu chờ duyệt, và không chặng nào cho core chạy hộ một job của engine.

## 6. Nạp dữ liệu AVI GIFT

Dữ liệu production hiện rất nhỏ: `01_NHAP-LIEU.xlsx` 320 KB, `02_KET-QUA.xlsx` 862 KB, 14 thư mục ảnh. Đây không phải bài toán dữ liệu lớn.

```
FloraOS v1 (đóng băng từ 09/09, vẫn chạy)
        │
        │  adapter nhập MỘT CHIỀU — thu hoạch A3
        ↓
floraos-core — AVI GIFT là tổ chức đầu tiên
        │
        ↓
   cắt một lần → FloraOS v1 ngừng
```

Đồng bộ một chiều, Excel vào core. **Không bao giờ ghi ngược.** Không chạy song song lâu — đó là cái bẫy đắt nhất của mọi cuộc thay nền.

Ngày cắt chọn khi core đủ chức năng cho công việc hằng ngày của Sale và Điều phối, đo bằng chính bảng nghiệm thu trong `BAN_GIAO.md` của v1.

`excel_parser.py` và `ket_qua_phan_tich.py` hạ cấp thành adapter nhập một chiều. Chúng không còn là nguồn sự thật.

## 7. Thứ tự thu hoạch

| Đợt | Việc | Phụ thuộc |
|---|---|---|
| H0 | Dựng khung repo | — |
| H1 | Organization · Workspace · Membership · Branch · cách ly tenant | H0 |
| H2 | 76 mã năng lực + phạm vi + tách `*.approve` | H1 |
| H3 | Asset + GenerationJob + Usage trong một đợt | H1 |
| H4 | BusinessProfile + BrandProfile | H1 |
| H5 | Hợp đồng Vision + engine đếm + engine màu → M01 | H3 |
| H6 | Engine giá + bất biến → M02 | H5 |
| H7 | Nạp dữ liệu AVI GIFT một chiều | H4, H5, H6 |
| H8 | M04a Identity Guard | H3, H5 |
| H9 | Integration Layer; LocalBudd bỏ bảng trùng; adapter đăng bài | H3, H4 |
| H10 | Experience Mode | H2, H3 |

| H11 | Ba đường ghi: đăng ký asset dẫn xuất, số liệu nội dung, mức dùng | H9 |
| H12 | M04b ảnh marketing và M04c video trên Master Image đã duyệt | H8, H11 |
| H13 | M07 cho ngành hoa: nội dung sinh từ Product Master, adapter Zalo OA | H11, H12 |
| H14 | M06 catalog và liên kết QR | H11 |
| H15 | M11 số liệu về core, phép nối ROI, hồ sơ phong cách | H13, H14 |
| H16 | Cổng AI và hai sổ đăng ký ở core; engine ngoài đọc chính sách, ghi số đo | H3, H5 |
| H17 | Chấm điểm, thác nghiệm, chuỗi dự phòng | H16 |
| H18 | Danh mục loài và truy hồi tri thức trên `pgvector` | H5 |

H0 đã xong. H3 và H5 nhẹ hơn ước lượng ban đầu vì `count_engine.py`, `color_engine.py` và `normalize.py` là REUSE chứ không phải EXTEND — 1.580 dòng không phải viết lại. Đối lại, bốn cổng ở `src/core/ports/` là BUILD chứ không phải REUSE như bản đồ thu hoạch ghi.

---

## 8. Quy chuẩn Tiếp giáp Tích hợp SocialFlow (Hợp nhất từ DOT_3_NOI_SOCIALFLOW.md)

Ba quyết định chốt ngày 10/09 và quy chuẩn tiếp giáp giữa `floraos-core` và `SocialFlow`:

1. **Phạm vi ranh giới:** Xác thực + Tổ chức + Brand + Usage. Core là nguồn duy nhất cho phần chung của Brand; các thuộc tính chuyên biệt của SocialFlow giữ lại cục bộ.
2. **Kế thừa dữ liệu AVI GIFT:** 3 tài khoản social đang hoạt động và 45 bài đăng lịch sử gán cho tổ chức AVI GIFT; số liệu phân tích sau này tính vào AVI GIFT.
3. **Chuẩn hóa Multi-tenant & Bảo vệ Route:** Mọi route tác vụ (`approve`, `reject`, `publish`, `posts/{id}`) bắt buộc kiểm tra `organization_id` phía máy chủ, cấm nhận `organization_id` tự do từ query param của client.
