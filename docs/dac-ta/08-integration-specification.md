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
| `assets` · `generation_jobs` · `usage` · `audit_logs` | | `social_accounts` |

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

Ảnh chờ duyệt không rò ra ngoài core. Đây là điểm dễ hỏng nhất của tích hợp: engine ngoài lấy được ảnh chưa duyệt rồi đăng lên mạng xã hội thì cổng duyệt trở thành trang trí.

**Ảnh phải TẢI ĐƯỢC, không chỉ có `storage_key` (bổ sung 2026-09-10).** Bản đầu của `GET /integration/products/:id/master-image` trả `storage_key` trần. Kho tệp của core (`/api/v1/storage/[...key]`) chỉ nhận URL ký sẵn HMAC — không nhận token tích hợp lẫn cookie phiên — nên engine ngoài cầm `storage_key` mà không có đường nào lấy được byte ảnh: ranh giới bàn giao ở mục 5 không đi qua được. Nay mỗi ảnh trả kèm trường `url`: URL ký sẵn TUYỆT ĐỐI, hạn 15 phút, `origin` lấy từ chính lời gọi (nên vẫn đúng sau khi Nhóm C dựng proxy). Hạn ngắn có chủ đích: engine tải ngay, không lưu lại URL.

### 4c. Hạn mức: chặn thật, không phải ghi nhận sau

`POST /integration/jobs` tái dùng `enqueueJob`, nên nó kiểm hạn mức TRƯỚC khi tạo job và trả `QUOTA_EXCEEDED` (HTTP 422) khi tổ chức hết credit.

**Quyết định 2026-09-10 (anh Tony):** engine ngoài phải `await` lời gọi này TRƯỚC khi ghi job vào hàng đợi của chính nó, và từ chối việc khi core nói không. Bản B2d trước đó gọi song song và nuốt lỗi, nên hạn mức của core chỉ là ghi nhận sau khi việc đã xảy ra — tổ chức hết credit vẫn sinh được trang.

Đánh đổi đã chấp nhận khi chốt: **core không gọi được thì engine ngoài không chạy việc tính phí được.** Engine phải phân biệt hai thứ trong mã của nó — "core trả lời là không" (422, hết hạn mức) khác "không hỏi được core" (mạng/sập) — vì hai thứ đó cần hai câu trả lời khác nhau cho người dùng.

## 4b. Ánh xạ hồ sơ sang design contract của LocalBudd

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

## 5. Ranh giới bàn giao M04a sang M04b

Master Image là ranh giới. Trước nó là `floraos-core`, sau nó là `SocialFlow`.

| | M04a — core | M04b — SocialFlow |
|---|---|---|
| Câu hỏi trả lời | Đây có phải ảnh trung thực của đúng sản phẩm thật không? | Ảnh này có bán được trên kênh này không? |
| Thành phần | Phân tích chất lượng, tách sản phẩm, tăng cường, Identity Guard, Master Image, Smart Reframe | Chữ chồng, logo, khuôn thương hiệu, nền marketing, biến thể theo kênh |
| Đầu ra | `assets` và `products` — entity lõi | Creative theo kênh, đẩy sang M07 |

**M04b không bao giờ chạy lại tăng cường sản phẩm và không bao giờ đổi nhận dạng sản phẩm.** Nó soạn lên trên một Master Image đã duyệt. Bất kỳ thay đổi nào chạm vào chính sản phẩm đều thuộc M04a và phải qua Identity Guard.

M04a đặt ở core vì Identity Guard gọi M01 hai lần mỗi ảnh; đặt cạnh M01 tránh hai lượt gọi mạng liên repo cho mỗi ảnh trong ngưỡng 10–30 giây với 100–500 người dùng đồng thời.

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

H0 đã xong. H3 và H5 nhẹ hơn ước lượng ban đầu vì `count_engine.py`, `color_engine.py` và `normalize.py` là REUSE chứ không phải EXTEND — 1.580 dòng không phải viết lại. Đối lại, bốn cổng ở `src/core/ports/` là BUILD chứ không phải REUSE như bản đồ thu hoạch ghi.
