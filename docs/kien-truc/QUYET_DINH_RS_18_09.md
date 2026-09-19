# Quyết định đang chờ — hồ sơ RS (rà soát 18/09)

**Nguồn:** `RA_SOAT_DONG_BO_18_09.md`
**Trạng thái:** 11 mục, đã chốt 10/11 — anh Tony trả lời qua ba lượt hỏi trong phiên (18/09/2026); RS-11 còn một bước tay (đổi thư mục kết nối trong app Claude desktop, không sửa được bằng công cụ từ xa).
**Cách dùng:** mỗi mục có bối cảnh, các phương án, và ô **CHỐT** để trống. Điền ô đó rồi ghi ngày; đừng xoá các phương án không chọn — lần sau có người sẽ hỏi lại đúng câu hỏi này.

Mười một mục này là phần **không** sửa được chỉ bằng cách cập nhật tài liệu. Phần sửa được đã sửa xong ngày 18/09 (đặc tả 06 và 07 nay khớp mã 100% ở ba trục endpoint / bảng / enum — `npm run check:docs` xanh cho cả bốn trục, gồm cả cách ly tenant sau RS-2). Mười trong mười một mục đã được anh Tony chốt và thực thi trong phiên 18/09/2026 (RS-4 hoãn có chủ đích, RS-7 giữ nguyên có chủ đích). RS-11 chốt phương án nhưng còn một thao tác tay ngoài phạm vi công cụ.

---

## Nhóm A — mã sai, tài liệu đúng *(kiểu 2)*

### RS-1 · Hai cổng duyệt video dùng chung mã `I2`

**Hiện trạng.** `approve-script/route.ts:9` và `approve-video/route.ts:9` cùng gọi `requireCapability(ctx, "I2")`. `I2` là `media.approve` — "Nâng Master Image thành ảnh chính thức của sản phẩm", trần cứng `dieu_hanh`. Ở tầng dữ liệu thì hai cổng đã tách đúng: `video_jobs.script_approval` và `video_jobs.video_approval` là hai cột riêng. Chỉ phép kiểm quyền là chung.

**Hệ quả.** Ai duyệt được Master Image thì duyệt luôn kịch bản và video thành phẩm. `audit_logs` không phân biệt được ba hành động. Không giao được quyền "duyệt kịch bản" cho người viết nội dung mà không đồng thời giao quyền duyệt ảnh chính thức.

| Phương án | Việc phải làm | Đánh đổi |
|---|---|---|
| **A1** — Thêm hai mã mới vào dải `P` | `P3` (duyệt kịch bản) và `P4` (duyệt video, trần cứng `dieu_hanh`) vào `capability-catalog.ts`; danh mục 143→145, trần cứng 39→40; cập nhật `capability-catalog.test.ts`, `role_capabilities` seed, hai route | Đúng với đặc tả 02 §363 (dải `P` dành cho M04b/M04c) và đúng tên mà TRANG_THAI đã dùng từ P17. Tốn một lượt seed lại quyền cho bốn vai |
| **A2** — Dùng lại `I4`/`I5` của M04b | Không thêm mã; video mượn cặp "chạy/duyệt" của biến thể marketing | Rẻ nhất. Nhưng gộp hai module khác nhau vào một cặp quyền, và vẫn không tách được hai cổng của chính M04c |
| **A3** — Giữ nguyên `I2` | Sửa TRANG_THAI và đặc tả 06 cho khớp mã | Rẻ nhất về mã, nhưng ghi nhận vĩnh viễn rằng một cổng duyệt video được gác bằng quyền duyệt ảnh |

**Đề xuất:** A1.
**CHỐT:** ☑ A1 — Thêm hai mã `P3`/`P4` vào danh mục  **Ngày:** 18/09/2026 (đã làm xong: `capability-catalog.ts`, hai route, `tests/tenant/video-studio.test.ts`)

---

### RS-2 · Cách ly tenant chưa phủ 16/39 bảng

**Hiện trạng.** Đặc tả 07 mục 19 bắt mỗi bảng có `organization_id` phải có một ca trong `tests/tenant/`, và branch protection trên `main` lấy `npm run test:tenant` làm cổng duy nhất chặn rò dữ liệu chéo tổ chức. `npm run check:docs` hiện báo **22 chỗ lệch**, toàn bộ thuộc mục này:

- **16 bảng chưa có ca thử nào:** `catalog_links` · `chat_channel_integrations` · `chat_conversations` · `chat_messages` · `content_metrics` · `customer_consents` · `customer_occasions` · `order_assignments` · `order_events` · `order_items` · `pricing_rules` · `product_images` · `product_inventory` · `product_variants` · `template_overrides` · `vouchers`
- **6 bảng không bị `TRUNCATE` giữa các ca** (`TENANT_TABLES` trong `tests/helpers/database.ts`): `catalog_links` · `content_metrics` · `occasions` · `product_copies` · `product_inventory` · `template_overrides`

**Hệ quả.** Với sáu bảng nhóm hai, một ca xanh không chứng minh được điều nó khẳng định — "không tìm thấy" có thể do dữ liệu sót từ ca trước, đúng như chú thích ở `database.ts:84-88` cảnh báo. Với mười sáu bảng nhóm một, chưa ai từng thử.

Đây là bảng dữ liệu cá nhân của khách hàng cuối (`customer_consents`, `customer_occasions`), đơn hàng (`order_items`, `order_events`) và hội thoại (`chat_messages`) — nhóm dữ liệu mà D13 đang chặn go-live vì lý do pháp lý.

| Phương án | Việc phải làm | Đánh đổi |
|---|---|---|
| **B1** — Bù đủ trước go-live M09/M10 | 16 ca mới + 6 dòng vào `TENANT_TABLES`. Ước 1–2 ngày | Đóng hẳn lỗ. Chặn lịch go-live thêm 1–2 ngày |
| **B2** — Bù theo hai đợt | Đợt 1 ngay: sáu bảng `TRUNCATE` còn thiếu + tám bảng dữ liệu cá nhân và đơn hàng. Đợt 2 sau go-live: tám bảng còn lại | Mở khoá lịch sớm hơn, vẫn phủ phần rủi ro nhất trước |
| **B3** — Viết một ca sinh tự động | Một ca duyệt qua mọi model có `organization_id`, dựng hai tổ chức, ghi rồi đọc chéo | Tự phủ mọi bảng mới về sau, không bao giờ lệch lại. Khó viết hơn, và một ca chung khó đọc lỗi hơn 16 ca riêng |

**Đề xuất:** B3 cho phần khung + B2 đợt 1 cho các đường đọc thật.
**CHỐT:** ☑ B3 — một ca thử tự động quét mọi bảng có `organization_id`  **Ngày:** 18/09/2026 (đã làm xong: `tests/tenant/scoping-gaps-18-09.test.ts` + 6 dòng vào `TENANT_TABLES`; `npm run check:docs` 22→0 lỗi cách ly)

---

### RS-8 · Ba đường không kiểm quyền

**Hiện trạng.** Quét 151 cặp route-method: 36 cặp không gọi bất kỳ phép kiểm năng lực nào. Phần lớn là đúng (đăng nhập, webhook có chữ ký nền tảng, storefront công khai, `/storage/:key` gác bằng URL ký, `/integration/*` gác bằng Bearer + SSO). Ba cặp còn lại không có lý do:

| Route | Đặc tả nói | Mã làm |
|---|---|---|
| `GET /product-copies` | `H6` | Không kiểm gì; `get-product-copy.ts` cũng không |
| `GET /catalog-links/:slug` | `J1` | Không kiểm gì |
| `POST /jobs/batch` | — *(chưa từng được đặc tả)* | Không kiểm gì; nhận `feature` và danh sách mã `AIC` **tuỳ ý từ body** rồi gọi `enqueueJob`, mà `enqueueJob` cũng không gác |

`GET /chat/channels` và `POST /chat/channels` cũng không kiểm, dù `configure-chat-channel.ts` có gác `T4` — route không đi qua use-case đó.

**Đáng chú ý riêng `POST /jobs/batch`:** đây là một đường tạo job tổng quát. Bất kỳ thành viên đã đăng nhập nào của một tổ chức đều tạo được job cho **mọi** module, vượt qua mọi cặp năng lực "chạy" mà từng module đã dựng (`H1`, `I1`, `I4`…). Nó là cùng loại lỗ với `POST /media/background-removal` đã đóng ở P24, chỉ khác là có đòi đăng nhập.

| Phương án | Việc phải làm |
|---|---|
| **C1** — Gác từng đường theo đúng đặc tả | `H6`, `J1`, `T1`/`T3`; `/jobs/batch` tra năng lực theo `feature` rồi `requireCapability` |
| **C2** — Đóng `/jobs/batch`, giữ ba đường kia | Như P24 đã làm với `background-removal`: trả 409 kèm đường thay thế là `POST /jobs` |
| **C3** — Gác ở tầng use-case, không ở route | Đưa phép kiểm vào `enqueueJob`, `listProductCopies`, `getCatalogLink` — nơi mọi đường gọi đều phải đi qua |

**Đề xuất:** C3 cho ba đường đọc/ghi thường, C2 cho `/jobs/batch` nếu giao diện không còn dùng nó.
**CHỐT:** ☑ C3 — gác ở tầng use-case (cùng quyết định với RS-9)  **Ngày:** 18/09/2026 (đã làm xong: `H5`/`H6` vào use-case `product-copies/*`, `J1` giữ nguyên ở `catalog-links` qua Integration mới của RS-3; `/jobs/batch` chuyển sang chặn mặc định — module không có quyền "chạy" khai báo bị từ chối thay vì bỏ qua)

---

### RS-4 · `POST /integration/assets` — đặc tả và route mâu thuẫn

**Hiện trạng.**

| | Đặc tả 06 §11.1 | Route thật (`integration/assets/route.ts`) |
|---|---|---|
| `storage_key` | `null` — *"core tự sinh; giá trị client gửi bị bỏ qua"* | `z.string().min(1)` — **bắt buộc**, client gửi, kiểm khớp tổ chức ở `:39` |
| `upload_token` | Bắt buộc, lấy từ `POST /integration/assets/upload-url` | **Không có trường này** |
| `POST /integration/assets/upload-url` | Có trong bảng §11 | **Không tồn tại** |

**Hệ quả.** Ai hiện thực engine ngoài theo đặc tả sẽ viết một lời gọi 404 rồi gửi một thân yêu cầu bị 400. Hiện chưa ai gọi — cả `FloraOsCoreClient.ts` lẫn `floraos_core.py` đều chưa dùng đường này — nên chưa gãy trong thực tế.

Điểm cần cân nhắc: cách của đặc tả (core sinh `storage_key`, cấp `upload_token`) an toàn hơn thật sự — nó không cho engine ngoài tự đặt đường lưu trữ, tức là không cho nó ghi đè lên khoá của asset khác.

| Phương án | Việc phải làm | Đánh đổi |
|---|---|---|
| **D1** — Xây `upload-url` theo đặc tả | Thêm endpoint cấp URL ký sẵn + `upload_token`; đổi `POST /integration/assets` nhận token thay `storage_key` | Đóng được đường ghi đè khoá. Tốn một lượt sửa cả hai phía |
| **D2** — Sửa đặc tả theo mã | Bỏ `upload_token` và `/integration/assets/upload-url` khỏi §11; ghi rõ core kiểm `storage_key` khớp tổ chức/sản phẩm/asset | Rẻ nhất. Giữ nguyên rủi ro engine ngoài đặt khoá |
| **D3** — Hoãn cả hai | Đánh dấu CHƯA XÂY *(đã làm 18/09)* và quyết khi có engine ngoài thật cần ghi asset | Không tốn gì bây giờ |

**Đề xuất:** D3 tới khi SocialFlow thật sự cần đăng ký asset về core, rồi D1.
**CHỐT:** ☑ D3 — hoãn quyết định (Recommended), giữ nguyên trạng CHƯA XÂY  **Ngày:** 18/09/2026

---

## Nhóm B — hai bản mã cãi nhau, phải chọn một *(kiểu 3)*

### RS-3 · `catalog_links` tồn tại hai bản ở hai cơ sở dữ liệu

**Hiện trạng.**

| | `floraos-core` | `LocalBudd` |
|---|---|---|
| Bảng | `catalog_links` — `is_revoked Boolean`, `revoked_by`, `created_by` | `catalog_links` — `status catalog_link_status`, không có `created_by` |
| `slug` | `@unique` | `@unique` — **trên một CSDL khác** |
| Ghi | Trực tiếp qua Prisma cục bộ | Trực tiếp qua Prisma cục bộ |
| Route | `/api/v1/catalog-links*`, `/api/v1/public/catalog/:slug`, trang `/c/:slug` | `/api/v1/catalog-links*` kèm `products`, `filter-options`, `qr` |
| Đọc core | — | Chỉ hai route (`products`, `filter-options`) |

**Hệ quả.** `slug` duy nhất trong từng CSDL nhưng **không duy nhất ở phạm vi hệ thống**. Đặc tả 07 nói rõ vì sao điều đó quan trọng: *"một liên kết công khai phải giải được khi chưa biết tổ chức nào sở hữu nó."* Hai tiệm ở hai repo có thể đúc cùng một slug, và một mã QR đã in ra thì không sửa lại được.

Luật V2 §71 *"engine ngoài không giữ bản sao entity lõi"* đang bị phá, và `catalog_links` được chính V2 §65 xếp vào thực thể lõi.

| Phương án | Việc phải làm | Đánh đổi |
|---|---|---|
| **E1** — Core là chủ, LocalBudd đọc qua API | Bỏ bảng `catalog_links` của LocalBudd; thêm đường Integration cho catalog; LocalBudd gọi core. Cần di trú các liên kết đã tạo | Đúng luật đã chốt. Nặng nhất; và LocalBudd phụ thuộc core khi tạo liên kết |
| **E2** — LocalBudd là chủ, core bỏ | Core bỏ bảng và bốn route, trang `/c/:slug` chuyển sang LocalBudd | Đúng với V2 §463 bản gốc ("M06 thuộc LocalBudd"). Nhưng core vừa xây xong storefront + QR engine ở P19, bỏ đi là bỏ công đã làm |
| **E3** — Tách vai: core giữ bảng, LocalBudd giữ trang | Core sở hữu `catalog_links` và `slug`; LocalBudd render trang, hỏi core mỗi lần | Giữ được cả hai phần đã xây. Cần một đường Integration mới và một lượt di trú |
| **E4** — Giữ nguyên hai bản, chấp nhận rủi ro | Thêm quy ước tiền tố slug theo repo để tránh đụng | Không tốn gì. Hai nguồn sự thật vĩnh viễn, và quy ước tiền tố sẽ bị quên |

**Câu hỏi cần anh trả lời trước:** hiện đã có bao nhiêu mã QR in ra từ mỗi bên? Nếu cả hai đều ~0 thì E1 hoặc E3 rẻ; nếu một bên đã in nhiều thì bên đó nên là chủ.

**Trả lời của anh Tony:** cả hai bên gần như chưa in.

**Đề xuất:** E3.
**CHỐT:** ☑ E1 — Core làm chủ duy nhất, bỏ bảng ở LocalBudd  **Ngày:** 18/09/2026 (đã làm xong: 3 route `/integration/catalog-links*` mới ở core; `LocalBudd` bỏ bảng Prisma, `CatalogLinkRepository` viết lại thành adapter HTTP gọi `FloraOsCoreClient`; sửa kèm một lỗi định tuyến có sẵn — `PATCH` bị gắn nhầm vào `/revoke`)

---

### RS-5 · `flower_taxonomy` đặt tên cột bằng tiếng Việt

**Hiện trạng.** Luật 2 ở đặc tả 07 mục 1: *"Đặt tên `snake_case` tiếng Anh. Thuật ngữ tiếng Việt chỉ ở nhãn giao diện."* Hai bảng phá luật:

- `flower_taxonomy` — 19 cột: `ma_loai`, `ten_chuan`, `ten_khac`, `nhom`, `nhom_hoa`, `cong_nang`, `dvt_chuan`, `so_bong_tren_dvt`, `duong_kinh_bong_cm`, `dien_tich_phu_cm2`, `ty_le_nhuy_tren_bong`, `mau_nhuy`, `kieu_moc`, `dai_mau_tu_nhien`, `dac_diem_phan_biet`, `mua_vu`, `trang_thai`, `cap_a`, `cap_b`
- `flower_confusable_pairs` — 5 cột: `ma_cap`, `ma_loai_a`, `ma_loai_b`, `loai_a`, `loai_b`

Bản đặc tả trước mô tả một bảng **hoàn toàn khác** bằng tiếng Anh (`canonical_id`, `name_vi`, `aliases`, `embedding`) — bảng đó chưa bao giờ tồn tại. Ngày 18/09 đã thay bằng bảng thật.

| Phương án | Việc phải làm | Đánh đổi |
|---|---|---|
| **F1** — Đổi tên cột sang tiếng Anh | Một migration đổi tên 24 cột; sửa worker Python (`tu_dien.py`, `local_cv_species.py`), seed, và mọi truy vấn | Luật 2 giữ nguyên hiệu lực cho mọi bảng. Tốn một lượt migration đụng vào đường phân tích ảnh đang chạy |
| **F2** — Ghi ngoại lệ vào Luật 2 | Sửa Luật 2: *"trừ hai bảng tri thức ngành hoa, nơi tên cột là thuật ngữ nghiệp vụ tiếng Việt do người gán nhãn dùng trực tiếp"* | Rẻ. Nhưng luật có một ngoại lệ thì sẽ có ngoại lệ thứ hai |
| **F3** — Giữ nguyên, không sửa gì | | Luật 2 thành luật chết — điều tệ hơn cả hai phương án trên |

**Đề xuất:** F2, vì hai bảng này là tri thức ngành do người gán nhãn nhập tay, và tên cột tiếng Việt ở đây là tính năng chứ không phải lỗi.
**CHỐT:** ☑ F2 — ghi ngoại lệ vào Luật 2  **Ngày:** 18/09/2026 (đã làm xong: `docs/dac-ta/07-database-specification.md`)

---

### RS-6 · Luật "bộ máy Vision mặc định chỉ đổi bằng số đo"

**Hiện trạng.** `M01_FLORAOS_VISION_CODING_AGENT_GUIDE.md:267` đặt luật: *"Bộ mặc định chỉ đổi **bằng số đo trên bộ ảnh vàng**, không chốt cứng trong tài liệu và không đổi bằng lập luận."*

Mặc định đã đổi **ba lần**, không lần nào bằng số đo:

| Ngày | Từ → sang | Căn cứ |
|---|---|---|
| 09/11 | `openai_structured` → `local_cv` | Quyết định ghi đè D5-e |
| 09/12 | `local_cv` → `openai_direct` | "Rẻ nhất, nhanh nhất, ma trận 4 ảnh" |
| 09/17 | `openai_direct` → `openai_structured` | Nợ #83 — chốt với chủ sản phẩm |

Bộ ảnh vàng có 100 ảnh, mới gán nhãn 8, và quy tắc nghiệm thu 09/12 đã hạ xuống "8 ảnh là đạt".

| Phương án | Việc phải làm |
|---|---|
| **G1** — Giữ luật, bù số đo | Gán nhãn đủ bộ ảnh vàng rồi chạy ma trận ba bộ máy; giữ `openai_structured` nếu nó thắng, đổi nếu không |
| **G2** — Sửa luật cho đúng cách đang làm | *"Mặc định do chủ sản phẩm chốt, ưu tiên bộ có `trang_thai: san_xuat`. Số đo trên bộ ảnh vàng là căn cứ khi có, không phải điều kiện bắt buộc."* |
| **G3** — Luật chỉ áp cho việc **hạ** mặc định | Nâng lên bộ đã đo (`san_xuat`) thì chốt bằng lập luận cũng được; hạ xuống bộ `thu_nghiem` thì bắt buộc có số đo |

**Đề xuất:** G3 — nó giữ được tinh thần của luật (không đưa tổ chức mới vào đường chưa ai kiểm chứng) mà không đòi một bộ ảnh vàng hoàn chỉnh trước mỗi lần đổi.
**CHỐT:** ☑ G3 — luật chỉ áp cho việc HẠ mặc định  **Ngày:** 18/09/2026 (đã làm xong: `M01_FLORAOS_VISION_CODING_AGENT_GUIDE.md`, `docs/dac-ta/00-PRD.md` D5-d, `docs/dac-ta/10-ai-orchestration.md`)

---

### RS-10 · Mã `Q5`/`Q6` lệch nghĩa giữa đặc tả và mã

**Hiện trạng.**

| | Đặc tả 02 và 06 bản cũ | Mã thật |
|---|---|---|
| `Q5` | Xuất danh sách khách hàng *(có trần cứng — "lấy toàn bộ dữ liệu cá nhân ra khỏi hệ thống trong một lần bấm")* | `POST /crm/customers/:id/occasions` — thêm dịp |
| `Q6` | Thêm dịp cho khách | `POST /crm/customers/:id/consent` — ghi đồng ý |

**Hệ quả.** Nếu `Q5` giữ trần cứng theo ý nghĩa cũ ("xuất danh sách") mà mã lại dùng nó để gác "thêm dịp", thì thêm một ngày sinh nhật cho khách đang bị chặn bằng quyền dành cho xuất dữ liệu — và khi `GET /crm/customers/export` được xây, nó sẽ không còn mã nào có trần cứng để gác.

Cần đọc `capability-catalog.ts` dải `Q` để biết nhãn thật của từng mã trước khi quyết.

| Phương án | Việc phải làm |
|---|---|
| **H1** — Sửa mã theo đặc tả | Đổi `Q5`→`Q6` ở route occasions, `Q6`→`Q3` ở route consent |
| **H2** — Sửa đặc tả 02 theo mã | Đổi nhãn `Q5` và `Q6` trong danh mục; tìm mã khác có trần cứng cho `export` |

**Đề xuất:** H1 — trần cứng gắn với ý nghĩa "xuất dữ liệu cá nhân", đổi ý nghĩa của mã là làm mất lớp bảo vệ đó.
**CHỐT:** ☑ H1 — sửa mã theo đặc tả (`Q5`→`Q6` ở occasions, `Q6`→`Q9` ở consent — mã `Q3` đã dùng cho việc khác, `Q9` là mã trống gần nhất cùng nhóm)  **Ngày:** 18/09/2026 (đã làm xong: `crm/customers/[id]/occasions/route.ts`, `crm/customers/[id]/consent/route.ts`)

---

## Nhóm C — dọn dẹp, quyết nhanh

### RS-7 · Mười bốn endpoint có trong đặc tả mà chưa xây — còn trong kế hoạch không?

Tất cả đã được đánh dấu **CHƯA XÂY** trong đặc tả 06 ngày 18/09, nên không còn gây hiểu nhầm. Câu hỏi còn lại: cái nào giữ, cái nào bỏ.

| Nhóm | Endpoint | Ghi chú |
|---|---|---|
| Hàng đợi duyệt gộp | `GET /approvals` · `POST /approvals/batch` | Duyệt hiện làm rời rạc ở từng module. Gộp lại có còn cần không? |
| M11 toàn bộ | 4 × `/analytics/*` · `GET · PUT /learning-profile` | Bảng `learning_profiles`, `content_features` cũng chưa có. Dải `S1`–`S4` chưa vào danh mục |
| Integration | `/integration/ai-policy` · `/integration/ai-requests` · `/integration/learning-profile` · `/integration/assets/upload-url` | Cái cuối gắn với **RS-4** |
| M09 | `GET /crm/customers/export` · `/reminder-campaigns` · `/vouchers` | Bảng `vouchers` đã có, endpoint chưa |
| M10 | `POST /orders/:id/delivery` | Trạng thái giao hiện đổi qua `PATCH /orders/:id` |
| M08 | `POST /chat/conversations/:id/handoff` · `GET · PUT /chat/conversations/settings` | Chuyển cho người thật — `T4` |
| M06 | `PATCH /catalog-links/:slug` · `GET /catalog-links/:slug/qr` | QR hiện sinh phía giao diện |
| M01 | `GET · PUT /products/:id/images` | |
| AI | `GET /ai-evaluations/:entity_type/:entity_id` | Bảng `ai_evaluations` đã có |
| **M04c** | `GET /video/jobs/:id/events` | ⚠ TRANG_THAI P17 mô tả một **luồng SSE** ở đường này, nhưng thư mục route không có `events`. Giao diện đang đọc tiến trình render bằng cách nào? Cần soát |

**CHỐT:** ☑ giữ tất cả, chưa cần quyết ngay · ☐ bỏ nhóm ___________ · ☐ soát riêng M04c SSE  **Ngày:** 18/09/2026 (không đổi mã; câu hỏi M04c SSE vẫn mở, chưa soát trong đợt này)

---

### RS-9 · Ba lối viết khác nhau cho cùng một phép kiểm quyền

**Hiện trạng.**

| Lối viết | Nơi dùng |
|---|---|
| `requireCapability(ctx, "X")` ở route | Phần lớn hệ thống |
| `if (!ctx.capabilities.has("X")) throw new AppError("CAPABILITY_DENIED", …)` | Toàn bộ `/product-copies/*` |
| `requireCapability` ở tầng use-case | `cancel-order.ts`, `configure-chat-channel.ts`, `catalog-links/*` |

Cả ba đều chặn được, nhưng một phép quét tự động không thấy được lối thứ hai và thứ ba — chính vì thế lượt rà soát đầu tiên báo nhầm rằng `/product-copies` và `/orders/:id/cancel` không gác.

| Phương án | Việc phải làm |
|---|---|
| **I1** — Thống nhất ở route | Đổi `/product-copies/*` sang `requireCapability`; giữ use-case như lớp thứ hai |
| **I2** — Thống nhất ở use-case | Quy ước duy nhất: route không gác, use-case gác. Khó bỏ sót hơn vì mọi đường gọi đều qua use-case |
| **I3** — Giữ nguyên, thêm luật vào `AGENTS.md` | Ghi rõ ba lối đều hợp lệ và `check:docs` chấp nhận cả ba |

**Đề xuất:** I2 — nó cũng là cách sửa **RS-8** gọn nhất.
**CHỐT:** ☑ I2 — thống nhất ở use-case  **Ngày:** 18/09/2026 (đã làm xong cùng RS-8: bốn use-case `product-copies/*` chuyển gác quyền từ route/tay sang use-case; route bỏ kiểm tra viết tay)

---

### RS-11 · Thư mục repo nối vào phiên làm việc đang rỗng

`~/Projects/floraos-core` **rỗng hoàn toàn**. Repo thật ở `~/ORGANIZED/02_PROJECTS/Active/floraos-core`. Phiên Claude/Cursor nào được nối vào đường dẫn thứ nhất sẽ thấy một repo trống và kết luận sai.

**CHỐT:** ☐ xoá thư mục rỗng · ☐ đổi thành symlink trỏ sang Active · ☑ đổi thư mục kết nối  **Ngày:** 18/09/2026 — **còn một bước tay:** đây là việc trong app Claude desktop (mục nối thư mục của phiên), không sửa được bằng `device_bash`/công cụ từ xa. Việc cần làm: bỏ `~/Projects/floraos-core` (rỗng) khỏi danh sách thư mục đã nối cho phiên floraos-core, giữ/đặt `~/ORGANIZED/02_PROJECTS/Active/floraos-core` làm thư mục nối mặc định cho các phiên sau.

---

## Sau khi chốt

Cập nhật mục 6 của `RA_SOAT_DONG_BO_18_09.md`, ghi quyết định vào bảng "Đã chốt" ở `TRANG_THAI.md` mục 4, và chạy `npm run check:docs` — nó phải xanh cả bốn trục trước khi merge.
