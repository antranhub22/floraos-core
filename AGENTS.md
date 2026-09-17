# floraos-core — ngữ cảnh cho agent

Nền tảng SaaS đa tenant cho cửa hàng hoa. `src/` (Next.js + Prisma/Postgres) → `workers/` (Python, xử lý ảnh) → Postgres dùng chung.

**Đọc trước khi làm bất cứ việc gì:** `docs/kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` (Level 1) và `docs/kien-truc/TRANG_THAI.md` (đang ở đâu).

## Lệnh

| Việc | Lệnh |
|---|---|
| Cài | `docker compose up -d && npm i && npx prisma generate && npx prisma db push && npx prisma db seed` |
| Chạy toàn bộ (Web + DB + Workers + SocialFlow M07) | `npm run dev:all` (tự bật Docker DB + Ollama Qwen + Web 3100 + Worker Vision + Worker Media + Worker Video + SocialFlow 8000) |
| Chạy web | `npm run dev` |
| Chạy worker media | `npm run worker:media` |
| Chạy worker video | `npm run worker:video` (hoặc `cd workers && python -m media_ai.video.video_worker`) |
| Test web | `npm test` |
| Test đầu cuối | `npm run test:e2e` |
| Test worker | `cd workers && .venv/bin/python -m pytest tests -q` |
| Typecheck | `npx tsc --noEmit` |
| Dựng CSDL cho test | `npm run db:test:setup` — **chạy một lần** sau `docker compose up -d` |
| Test cách ly tenant | `npm run test:tenant` — *bắt buộc xanh trước mọi merge* |

## Quy ước

- **Lược đồ `snake_case` tiếng Anh.** Mã nguồn tiếng Anh. Thuật ngữ nghiệp vụ tiếng Việt chỉ nằm ở nhãn giao diện và tài liệu, không vào lược đồ. *(Khác FloraOS cũ — repo ấy dùng PascalCase tiếng Việt.)*
- **Mọi bản ghi thuộc tenant có `organization_id`.** Không ngoại lệ, kể cả bảng tra cứu và demo workspace. Kiểm ở tầng repository, không ở route.
- **`organization_id` giải từ phiên đăng nhập phía máy chủ.** Không bao giờ nhận từ body/query của client.
- `domain/` không được import Prisma. Đó là điều kiện để test luật nghiệp vụ không cần cơ sở dữ liệu.
- Mọi module đủ bốn thư mục `domain/ use-cases/ infra/ adapters/`. Viết `use-cases`, không viết `usecases`.
- Route dưới `/api/v1/`. Endpoint duyệt tách khỏi endpoint sinh kết quả (`/x/[id]/approve`).
- Quyền theo mã năng lực, không theo vai UI. Ba lớp cắt: mặc định → bảng công tắc → **trần cứng cắt sau cùng**.
- Đường dẫn lưu trữ: `org/<organization_id>/<product_id>/<asset_id>.<ext>`.
- Job: ba trục `status` / `stage` / `result` tách rời. `COMPLETED + result=REJECTED` **không phải** `FAILED`.
- `usage` ghi ở phía core **tại điểm tạo job**, không ghi ở worker.
- Worker Python lấy việc bằng `SELECT … FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`. **Cấm `subprocess` + parse stdout. Cấm chạy job qua HTTP.**
- Provider AI chỉ gọi qua cổng — mười cổng ở `src/core/ports/`. Không module nào gọi thẳng API nhà cung cấp.
- **Mã nghiệp vụ gọi một NĂNG LỰC, không gọi một nhà cung cấp** (D15). Mọi lời gọi AI đi qua cổng AI ở `src/core/ai/`; SDK của nhà cung cấp chỉ được xuất hiện trong `adapters/`. Mô hình là một hàng trong `ai_models`, không phải một hằng trong mã.
- **Mô hình không vào production khi thiếu một trong bốn ô giấy phép** (D18): `license`, `commercial_use`, `territory`, `allowed_use`. Bộ lọc nằm ở `eligibleModels()`, nên mô hình thiếu ô không lộ ra cả trong danh sách để chọn.
- **Sàn quyền riêng tư cắt sau cùng**, cùng tính chất với trần cứng của RBAC: lời gọi `SENSITIVE` không có đường nào ra nhà cung cấp ngoài, kể cả qua bước dự phòng.
- **Tách biệt trường dữ liệu nguyên tử (Atomic Disaggregated Fields) để tối ưu khả năng chỉnh sửa (Editable)**:
  - Tuyệt đối không gộp chung văn bản và số lượng/đơn vị vào cùng một chuỗi tự do (ví dụ: cấm gộp `"Hồng đỏ 10 cành"` thành 1 ô text).
  - Bắt buộc phân rã thành các trường cấu trúc độc lập: tên hoa (text), số lượng (number), đơn vị (text), màu sắc (text), vai trò (select)... để người dùng có thể nhấp chuột sửa trực tiếp từng thông số mà không làm hỏng cấu trúc dữ liệu.
  - Áp dụng nguyên tắc tương tự cho kích thước (`height`/`width` số, `unit` text), báo giá (`price`/`originalPrice` số), và danh sách quà tặng/cam kết (mảng các item độc lập có nút thêm/sửa/xóa từng dòng).
- **Tiêu chuẩn hóa vị trí nút tác vụ chung của các Tab (Standardized Tab Action Header)**:
  - Mọi tác vụ chung của các Tab (Copy, Lưu nháp, Duyệt/Chốt, Chỉnh sửa, Xuất file...) **bắt buộc phải nằm ở vị trí thống nhất: Góc trên cùng bên phải (Top-Right Action Header) của mỗi Tab**. Không đặt mỗi tab một vị trí khác nhau gây mất phương hướng cho người dùng.
  - Cấu trúc thanh công cụ góc trên bên phải gồm 2 khối:
    1. **Nút tác vụ chính 1-chạm (Primary Visible Buttons)**: Hiển thị trực tiếp các hành động tần suất cao (vd: "Chốt duyệt", "Copy nhanh Zalo", "Lưu nháp") để nhân viên thao tác ngay mà không bị che khuất.
    2. **Menu tác vụ mở rộng (Action Overflow Menu / `...` More Options)**: Đặt ở góc ngoài cùng bên phải gom các tác vụ xuất file (Tải PNG, JPEG, PDF A6) hoặc thao tác phụ (Mở khóa sửa, Xóa). *Tránh dùng Hamburger Menu 3 gạch ngang để giấu toàn bộ tính năng chính* vì sẽ bắt người dùng phải click 2 lần cho các tác vụ thường xuyên.
- **Tiêu chuẩn hóa khối hướng dẫn thao tác của các Tab tính năng (Standardized Feature Guidance Callout)**:
  - Mọi Tab tính năng trong toàn bộ hệ thống (M01a, M01b, M01c, Catalog, Đơn hàng, Hội thoại, Kho dữ liệu, v.v.) khi hiển thị hướng dẫn thao tác ban đầu **bắt buộc phải tuân thủ chuẩn cấu trúc giống như M01a/M01b**:
    1. **Khung viền (Border)**: Nét đứt màu đỏ nổi bật `border-2 border-dashed border-red-300` để phân biệt rõ ràng khối thông tin hướng dẫn cần chú ý đọc với các khối nhập liệu/dữ liệu khác.
    2. **Nền (Background)**: Tông màu đỏ pastel dịu mắt `bg-red-50/70` hoặc `bg-red-50/80` (chống mỏi mắt, tương phản cao đạt chuẩn WCAG AA/AAA).
    3. **Huy hiệu định danh (Guidance Tag/Badge)**: Nằm ở trên cùng, định dạng viên thuốc nhỏ gọn `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold tracking-wider uppercase` kèm icon định danh (`Info`, `Camera`, `Sparkles`, `FileText`...) và nhãn định danh (vd: `HƯỚNG DẪN NHẬN DIỆN M01a`).
    4. **Tiêu đề chính**: Căn giữa, chữ đậm `text-[16px] font-extrabold text-red-950 flex items-center justify-center gap-2` kèm icon minh họa.
    5. **Mô tả nghiệp vụ**: Tối đa 2–3 dòng cô đọng, `text-[13px] leading-relaxed text-red-800/90 max-w-lg mx-auto`.
    6. **Thanh mẹo thao tác nhanh / Tiêu chí cốt lõi (Bottom Tips Bar)**: Đường kẻ đứt nét ngang `border-t border-dashed border-red-200/90` kèm 2–4 mẹo gạch đầu dòng ngắn gọn (`📸/💡/⚡/✨/📝/🎯/📋/💬/🖼️`) với `text-[11.5px] font-medium text-red-700` để nhân viên nắm bắt quy tắc cốt lõi ngay tức thì.
  - **Component chuẩn hóa**: Sử dụng component `<FeatureGuidanceCard />` tại `src/components/templates/guidance/feature-guidance-card.tsx` (re-export tại `@/components/ui/feature-guidance-card`).
  - **Kiến trúc & Quy chuẩn hệ thống Template (SSOT)**: Tuân thủ đặc tả kỹ thuật tại `docs/kien-truc/FLORAOS_TEMPLATE_ENGINE_ARCHITECTURE.md` và Sổ tay SSOT toàn diện tại `docs/kien-truc/FLORAOS_TEMPLATE_SYSTEM_SSOT.md` (chuẩn hóa 10 chức năng, 5 họ template, Core Interpolation Engine, chuẩn biến `{{...}}`).
  - **Quy tắc phê duyệt**: Cấm tự ý thay đổi cấu trúc, màu sắc hay vị trí của khối hướng dẫn này sang dạng khác khi chưa báo cáo và nhận phê duyệt từ Chủ sản phẩm.

## Thứ tự pha — điều kiện chặn

Lộ trình P0–P12 ở `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục 15.

**Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi P1 (tenant) và P2 (RBAC) đạt nghiệm thu.** Làm ngược sẽ sinh ra lược đồ thiếu `organization_id`, rồi phải migration lại toàn bộ khi đã có dữ liệu thật. Đây là lỗi tốn kém nhất của cả lộ trình.

Lộ trình có thêm hai tuyến kể từ 09/11: **Tuyến B** (P13–P23, bộ tính năng hoàn
chỉnh cho cửa hàng hoa; bảy pha đầu là MVP) và **Tuyến C** (AI-1…AI-4, nền AI —
cắt ngang mọi pha). Bảng đầy đủ ở `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục
15; đặc tả nền AI ở `docs/dac-ta/10-ai-orchestration.md`.

Trạng thái hiện tại: **P24 — M04b về đúng kiến trúc job (09/17), nghiệm thu xong trên máy thật:** `npm test` 479/479 · `npm run test:tenant` **200/200, 25/25 tệp** · `pytest` worker 229/229 · `npx tsc --noEmit` sạch. Đóng `POST /api/v1/media/background-removal` (không auth, không RBAC, không `organization_id`, không credit, `spawn` Python + parse stdout, SSRF qua `image_url` tuỳ ý). Dựng `media.variant` qua `enqueueJob`: bốn route `/api/v1/media/variants*`, cặp năng lực `I4` (chạy) ↔ `I5` (duyệt, trần cứng) — **143 mã / 39 trần cứng**, worker `workers/media_ai/jobs/variant_worker.py` với bốn `stage` thật, biến thể ghi thành `assets` `kind = MARKETING` / `PENDING` có cha là Master đã duyệt, watermark lấy logo thật từ `brand_profiles.logo_asset_id`. Cổng **Subject Integrity** đo tỷ lệ điểm ảnh lõi chủ thể còn trùng khít với Master Image (mặt nạ co biên), ngưỡng 0,999 / 0,99, `REJECTED` thì không ghi asset nào — thay ba hằng số `100/99/98` gõ tay trong giao diện. Gỡ bộ dựng canvas phía trình duyệt và ảnh mẫu Unsplash trong chuỗi lùi. Nợ mới #76–#80. Chi tiết ở `docs/dac-ta/Checklist_Thuc_Thi.md` mục P24.

Trạng thái trước đó: **P23 — M08 AI Chat Assistant & Tích Hợp Đa Kênh Omnichannel hoàn tất 09/16.** Module `src/modules/chat-assistant/`, router kép Dual-Intent (SaaS Operations Help vs Flower Sales), trợ lý nổi toàn hệ thống `<FloraOSGlobalCopilot />` (`Cmd+K`), 5 kênh tiếp xúc khách hàng: E-Catalog (`/c/[slug]`), Landing Page, Facebook Messenger (Graph API), Zalo OA, và Mã nhúng JavaScript cho website ngoài. Kiến trúc AI Engine Đa Tầng: Dify -> OpenAI Direct (`gpt-4o-mini`, giải quyết triệt để lặp câu từ) -> Local Qwen 2.5:7b qua Ollama (chi phí **0 VNĐ / 0 Token**, hoàn toàn offline) -> Local Rule Engine. Cẩm nang Tri thức & Nhập liệu SSOT (`/tri-thuc`, `knowledge-data.ts`, `knowledge-module-card.tsx`, `onboarding-progress-bar.tsx`) cho 7 phân hệ. Cải tổ Sidebar Navigation (`desktop-nav.tsx`). Cơ chế kiểm soát định giá & thu phí nền tảng (Monetization Engine) qua `src/modules/usage/` (phí thuê bao 0–70 credit/tháng, phí tin nhắn 1 credit/10 tin), chốt chặn Aegis Protection. Trung tâm quản trị `/hoi-thoai/kenh-tich-hop`. Đặc tả kiến trúc SSOT: `docs/kien-truc/FLORAOS_AI_CHAT_ASSISTANT_OMNICHANNEL_ARCHITECTURE.md`. `npm test` **414/414 xanh**, `chat-channel-isolation.test.ts` **2/2 xanh thật**, `chat-isolation.test.ts` **3/3 xanh thật**, `npx tsc --noEmit` **SẠCH 100%**.

Trạng thái trước đó: **P22 — M10 Đơn Hàng & Vận Hành hoàn tất 09/16.** Kanban 4 cột, Event Sourcing, SLA 180 phút, bóc tách lát cắt Thợ cắm hoa xưởng (giấu 100% giá), phiếu giao hàng & thiệp A6. 4 bảng CSDL mới, 8 mã năng lực `R1`–`R8`. `order-isolation.test.ts` **5/5 xanh thật**.

Trạng thái trước đó: **P21 — M09 CRM & Quản Lý Khách Hàng hoàn tất 09/16.** Customer Master Index SSOT, phân tầng RFM tự động (VIP/Gold/Silver/Bronze/New), quét ngày kỷ niệm trước 14 ngày, Consent Engine quyền riêng tư. 4 bảng CSDL mới, 8 mã năng lực `Q1`–`Q8`. `customer-isolation.test.ts` **4/4 xanh thật**.

Trạng thái trước đó: **P17 — M04c AI Video Studio hoàn tất 09/16.** Module `src/modules/video-studio/`, worker Python `workers/media_ai/video/`, component `src/components/video-studio/`. Hệ thống dựng video marketing hoa tươi dọc 9:16/1:1/16:9 6 khuôn (`VIDEO_FORMAT_SPECS`), biên soạn Storyboard chi tiết linh hoạt 2–15 cảnh, tự động cân bằng thời lượng, nút xóa cảnh nổi bật, menu Camera Motion Ken Burns (Zoom In/Out, Pan Up/Right, Static), 4 phong cách phụ đề, Edge TTS ducking nhạc nền, 2 cổng duyệt (Script & Video Output), kiến trúc Provider cắm rút: Phương án A `LocalCinematicProvider` (0 credit, ~0.45s/cảnh, mặc định hoạt động) + Phương án B Standby AI Generative (`GoogleVeoProvider` & `HeyGenProvider` qua `.env`). Trạng thái chuyển `hoat_dong` 🟢 trên Dashboard. `npm test` **357/357 xanh**, pytest worker **83/83 xanh**, `npm run test:tenant` **160/160 xanh thật**, `npx tsc --noEmit` **SẠCH**.

Trạng thái trước đó: **AI-1 đợt một — hoàn tất 09/12.** Năm bảng mới, mười cổng, `src/core/ai/` + `src/modules/ai-governance/`, bốn route, `U1`–`U4`. `npm test` **258/258 xanh thật** (41 ca mới), `npx eslint` sạch. `npx tsc --noEmit` **SẠCH** (sau `prisma generate` + `prisma db push` + `db:seed`). `npm run test:tenant` **123/123 xanh thật** (14 tệp). Chưa làm, cố ý: lớp Python `workers/ai/`, chuyển ba adapter Vision sang sau cổng, lượt quét CI chặn import SDK, hai đường Integration API. Chi tiết ở `docs/dac-ta/Checklist_Thuc_Thi.md` mục AI-1.

Trạng thái trước đó: **P8 — nạp dữ liệu AVI GIFT, phần danh mục giá viết mã
xong, chưa xác minh trên Postgres thật** — module `src/modules/avi-gift-import/`
(`domain/catalog-mapping.ts` thuần + `use-cases/{bootstrap-avi-gift-organization,
import-catalog}.ts`), `scripts/nap-avi-gift/doc-excel.py` (Python, đọc Excel
thật → `catalog.json`) + `scripts/nap-avi-gift-vao-core.ts` (orchestrator).
1.316 SKU, `npm test` 140/140. Còn lại: 9–14 sản phẩm có ảnh thật chưa nạp
(nợ #34), lượt nạp thật + đối chiếu `BAN_GIAO.md` chưa chạy. Chi tiết đầy đủ
ở `docs/kien-truc/TRANG_THAI.md` mục 1.

P7 (`floraos-core`) nghiệm thu xong trước đó trên Postgres thật (`test:tenant`
69/69) — token máy gọi máy (`integration_tokens`, `YC-T8`), mã năng lực mới
`F9` (114 mã, 31 trần cứng), sáu route `/api/v1/integration/*` (đặc tả 06
mục 11).

P6 nghiệm thu xong trước đó. M02
(`quotePrice`/`checkPriceInvariants`/`checkPriceGuard`, thu hoạch R3/R4/R5) +
`pricing_rules` CRUD chèn-chỉ (`effective_from` giữ lịch sử) + `GET·PUT
/pricing-rules` (`L5`/`L6`). M03 (`filterProductLookup`) + `GET·POST /products` +
`GET·PATCH /products/:id`. Phạm vi hẹp lại theo xác nhận chủ sản phẩm 09/10:
không dựng luồng "thẻ chào giá" (`pricing_card`, C1–C28 — nợ #26), chi phí
lá/cành trang trí để nợ kỹ thuật (#27). Anh Tony chạy bốn lệnh xác minh trên
Terminal Mac thật — xanh toàn bộ, không phát sinh lỗi phải sửa (`npm test`
117/117 gồm 36 ca mới, `npm run test:tenant` gồm 10 ca mới của P6).

P5 nghiệm thu phần lõi trước đó — 49/49 `test:tenant` xanh, 43/43 `pytest`
xanh, trên Postgres thật. M01 — hợp đồng Vision + `OpenAIStructuredProvider` +
`count_engine`/`color_engine` chuyển sang + worker `SKIP LOCKED`/`LISTEN` +
route `/vision/analyses*`, đã xác minh trên máy thật của anh Tony. Còn hai
việc chặn P5 nghiệm thu tuyệt đối, không chặn P6: bộ ảnh vàng 8/100 ảnh đã gán nhãn, chỉ cần 8 ảnh đạt yêu cầu theo luật mới 09/12 (`docs/kien-truc/BO_ANH_VANG.md` mục 8, nợ #24) và ma trận chọn công nghệ chưa
làm. Chi tiết đầy đủ ở `docs/kien-truc/TRANG_THAI.md` mục 1 và
`TECHNICAL_DEBT.md` #19-29.

## Luật thu hoạch

Mã lấy từ `FloraOS` cũ, `LocalBudd` hoặc `SocialFlow` **phải có hạng trong `HARVEST_MANIFEST.md`**: REUSE / EXTEND / ADAPTER. Chép mã sang mà không xếp hạng là lỗi chặn ở review.

**Luật nghiệp vụ đi kèm test khoá nó.** Test xanh trên repo này thì mới coi là chuyển xong. Chưa có test thì chưa xong, dù mã đã chạy.

Xếp hạng sai chiều nào cũng tốn. Bản đồ thu hoạch từng xếp `count_engine.py` là EXTEND vì cho rằng nó phụ thuộc `openpyxl`; mã thật chỉ import `numpy` và `scipy`. Đọc mã trước khi xếp hạng, đừng xếp theo trí nhớ.

## Chín câu hỏi trước khi viết mã

1. Hạng mục này xếp hạng gì trong REUSE / EXTEND / ADAPTER / BUILD?
2. Nếu REUSE hoặc EXTEND: nguồn ở repo nào, tệp nào, bao nhiêu dòng?
3. Luật nghiệp vụ đi kèm được khoá bởi test nào? Test đó đã chép sang chưa?
4. Entity chạm tới thuộc core hay thuộc engine ngoài?
5. Đã có `organization_id` chưa?
6. Thao tác này dài bao lâu — có phải là job không?
7. Có ghi `usage` không?
8. Kết quả có cần duyệt trước khi thành dữ liệu chính thức không?
9. Năng lực nào gác nó? Năng lực duyệt có tách riêng không?
10. Hạng mục có gọi AI không? Nếu có: năng lực nào trong `ai_capabilities`, cổng nào trong mười cổng, và lời gọi đi qua `callCapability` chứ không qua SDK nhà cung cấp?
11. Mô hình định dùng đã có hàng trong `ai_models` với đủ bốn ô giấy phép chưa? Mức quyền riêng tư của dữ liệu đi vào là gì?

Xếp hạng BUILD cho thứ đã tồn tại ở một trong ba repo là lỗi phải chặn ở review.

## Bản đồ

*(Điền dần khi có mã thật.)*

| Vùng | Đường dẫn | Ghi chú |
|---|---|---|
| Ngữ cảnh tenant | `src/core/tenancy/tenant-context.ts` | `TenantContext`, `scopedWhere`, `scopedData` — luật thuần, không import hạ tầng |
| Client cơ sở dữ liệu | `src/core/tenancy/infra/prisma.ts` | thể hiện `PrismaClient` duy nhất; chỉ tệp trong `infra/` được import |
| Hình dạng lỗi và cookie | `src/core/http/` | `AppError` tám mã · cookie phiên · `handle()` bọc route |
| Năng lực & quyền | `src/core/rbac/` | `capability-catalog.ts` (**143 mã, 39 trần cứng** — 113 tới P2, `F9` ở P7, `H4` theo D5-d, `U1`–`U4` ở AI-1, `R1`–`R8` ở P22, `Q1`–`Q8` ở P21, `T1`–`T4` ở P23, `I4`–`I5` ở P24) · `permission-resolver.ts` (trần cứng) · `capabilities.ts` (`hasCapability`/`requireCapability`) |
| Harvest R2 | `src/lib/maChucNang.ts` + `tests/maChucNang.test.ts` | nguyên vẹn từ `FloraOS/floraos-web/src/lib/`, xanh qua `npm run test:harvest` (`node:test`, không qua vitest/tsc — xem `vitest.config.ts`, `tsconfig.json`, `eslint.config.mjs`) |
| Bảng quyền | `src/modules/organization/infra/capability-repository.ts` | `role_capabilities` (lớp một) · `capability_overrides` (lớp hai, theo tổ chức) |
| Công tắc tự duyệt | `src/modules/organization/domain/self-approval-policy.ts` | `cho_phep_tu_duyet`, đọc từ `organizations.settings` |
| Cổng ra ngoài | `src/core/ports/` | Mười cổng: `VisionAnalyzer` · `LLMProvider` · `StorageProvider` · `QueueProvider` · `PublisherProvider` · `SegmentationProvider` · `ImageProvider` · `VideoProvider` · `SpeechProvider` · `EmbeddingProvider`, cộng kiểu dùng chung ở `shared-media.ts`. **Adapter không ghi kho tệp** — nó trả byte hoặc handle tạm, use-case ghi qua `StorageProvider` |
| Nền AI (AI-1) | `src/core/ai/` | `domain/ai-capabilities.ts` (34 năng lực `AIC-01`–`AIC-34`, nguồn của lượt seed) · `domain/routing.ts` (năm ràng buộc D17; `cascade` chỉ bật khi có ngưỡng) · `domain/privacy.ts` (sàn cắt sau cùng) · `domain/evaluation.ts` (điểm tổng = kênh THẤP NHẤT; thiếu kênh là KHÔNG HỢP LỆ chứ không phải điểm 0) · `gateway.ts` (`callCapability`, không import Prisma) · `wiring.ts` (chỗ duy nhất nối repo thật) · `infra/` (bốn repository + `seed-ai-registry.ts`) |
| Chính sách AI của tổ chức | `src/modules/ai-governance/` | `domain/policy-rules.ts` (chính sách là TRẦN, chỉ siết được, không nới) · use-case `get/put-ai-policy`, `list-ai-requests`. Route `/api/v1/{ai-policy,ai-capabilities,ai-requests,ai-requests/summary}` (`U1`/`U2`/`U3`); đổi `AIC-01` đòi thêm `H4` và kiểm trong use-case, không ở route |
| Module tổ chức | `src/modules/organization/` | đăng ký, đăng nhập, phiên, đổi tổ chức; repository của cả bảy bảng nền |
| Module | `src/modules/<tên>/` | bốn thư mục mỗi module |
| API | `src/app/api/v1/` | `auth/{signup,login,logout,me}` · `organizations` · `session/organization` (P1) · `organizations/current` · `members` · `roles` · `branches` · `workspaces` (P2) |
| Lược đồ | `prisma/schema.prisma` | 27 bảng. Năm bảng nền AI thêm ở AI-1: `ai_capabilities`/`ai_models` **không mang `organization_id`** (sổ đăng ký cấp nền tảng, ngoại lệ có chủ đích của Luật 1, ghi ở đặc tả 07 mục 15), còn `ai_policies`/`ai_requests`/`ai_evaluations` thuộc tenant như mọi bảng khác. Worker đọc bản sinh sẵn, không tự khai bảng |
| Chuỗi kết nối | `prisma.config.ts` | Prisma 7 không nhận `url` trong `schema.prisma` nữa |
| Vai hệ thống | `prisma/seed.ts` | bốn vai, `organization_id = null` |
| Worker phân tích ảnh | `workers/vision/` | M01 — P5. `contracts/` (Schema.json/Prompt.md nguyên vẹn) · `analyzer/` (`count_engine.py`/`color_engine.py`/`tu_dien.py`, REUSE/EXTEND) · `providers/` (`base.py` cổng, `openai_structured.py` BUILD) · `jobs/worker.py` (`SKIP LOCKED`+`LISTEN`, D6-1). Test: `workers/tests/vision/` |
| Module sản phẩm | `src/modules/products/` | `products`/`product_variants`/`product_images`/`product_analyses`/`pricing_rules` (đặc tả 07 mục 9). `product-analysis-rules.ts` (thuần: `canEditAnalysis`/`canApproveAnalysis`/`resolveEffectiveAnalysis` = `edited ?? raw`). Route `/api/v1/vision/analyses*` (`H1`/`H2`/`H3`) — duyệt ghi Product Master + `audit_logs` trong một giao dịch |
| M02 giá (P6) | `src/modules/products/domain/{pricing,price-guard,pricing-input,pricing-rules}.ts` | `quotePrice`/`checkPriceInvariants` (thu hoạch R3+R4) · `checkPriceGuard` (R5, chỉ phần `chanGia.ts` — `sanTran.ts` không thuần, nợ #29) · `pricing-rules.ts` (danh mục 4 khoá, hợp nhất tổ chức/chi nhánh). `infra/pricing-rule-repository.ts` CHÈN-CHỈ (`effective_from`, không `upsert`). Route `GET·PUT /pricing-rules` (`L5`/`L6`). KHÔNG có luồng "thẻ chào giá" (`pricing_card`, nợ #26) |
| M03 tra cứu (P6) | `src/modules/products/domain/product-lookup.ts` | `filterProductLookup` — cắt khối `pricing` theo `L5`, thu hoạch hình dạng từ `locTraCuu.ts` (dữ liệu giá đã tính sẵn theo mã, thuộc `pricing_card`, không mang sang). Route `GET /products` (lọc `branch_id`/`status`/`category`, phân trang con trỏ) + `GET·PATCH /products/:id` (`L1`/`L3`, `ARCHIVED` đòi thêm `L4`) + `POST /products` (`L2`) |
| Dựng bộ ảnh vàng | `scripts/xay-dung-bo-anh-vang.py` | Chọn ảnh rõ nhất mỗi sản phẩm từ `BoAnhVang/` (ngoài git), ghi khung `golden/images`+`golden/labels`+`manifest.csv`. KHÔNG tự đếm — xem `docs/kien-truc/BO_ANH_VANG.md` |
| Worker tối ưu ảnh | `workers/media_ai/` | M04a — P9/P13. `jobs/worker.py` là vòng lấy việc CHUNG cho ba feature: `media.optimize` · `media.variant` · `video.render` |
| Module ảnh marketing (M04b) | `src/modules/media/domain/variant-rules.ts` + `use-cases/{request,get,approve,download,list-pending}-variant*.ts` + `src/app/api/v1/media/variants*` + `workers/media_ai/jobs/variant_worker.py` | P24, `/creative-studio` Khu vực B. Cặp `I4`↔`I5`, giá `media.variant` = 1 credit. Cổng **Subject Integrity**: lõi chủ thể phải trùng khít Master Image từng điểm ảnh, ngưỡng ở `variant-rules.ts`, phía TS tính lại phán quyết từ số đo chứ không tin `result` worker gửi. Biến thể là `assets` `kind = MARKETING`, cha là Master `APPROVED` |
| Test cách ly tenant | `tests/tenant/` | sáu tệp (bốn của P1/P2, cộng `skip-locked-claim.test.ts` và `enqueue-job.test.ts` của P3); `npm run test:tenant` |
| Đồ dùng cho test | `tests/helpers/` | dọn bảng (mười bốn bảng từ P3), dựng hai tổ chức bằng đúng luồng đăng ký thật |
| Module asset | `src/modules/assets/` | `AssetRepository`, `LocalDiskStorageProvider` (adapter tạm — nợ #15), route `/api/v1/assets*`, `/api/v1/storage/[...key]` |
| Module job | `src/modules/jobs/` | `GenerationJobRepository` (`claimNext` = `SKIP LOCKED`), `JobEventRepository`, `PostgresQueueProvider`, `enqueueJob`, route `/api/v1/jobs*` (gồm SSE `events`) |
| Module usage | `src/modules/usage/` | `UsageRepository`, bảng giá `domain/pricing.ts` (nợ #14), route `/api/v1/usage*` |
| Module audit | `src/modules/audit/` | `AuditLogRepository`, `recordAuditLog` — chưa có nơi gọi tới khi duyệt đầu tiên ở P5 |
| Module hồ sơ | `src/modules/profiles/` | `BusinessProfileRepository`/`BrandProfileRepository` — một bản ghi mỗi tổ chức (`@@unique([organization_id])`), `upsert` = ngữ nghĩa PUT (trường vắng mặt thành null). Route `business-profile`/`brand-profile` dưới `/api/v1/`, gác bằng `F1`/`F2` sẵn có |
| Quét job treo | `scripts/scan-stuck-jobs.ts` | `YC-J10`, chạy bằng cron ngoài, chưa gắn lịch thật |
| Module tích hợp (P7) | `src/modules/integration/` | `integration_tokens` (`YC-T8`, HMAC `INTEGRATION_TOKEN_SECRET`) · `resolve-integration-context.ts` (`requireIntegrationContext` + `toTenantContext` — tái dùng thẳng use-case của phiên người dùng, `capabilities` luôn rỗng) · `issue/rotate/revoke/list-integration-token.ts` (`F9`) · `get-master-image.ts` · `check-capabilities.ts`. Route quản trị `/api/v1/integration-tokens*` (`F9`) · route máy gọi máy `/api/v1/integration/*` (products, products/:id/master-image, business-profile, brand-profile, jobs, usage, capabilities/check) |
| Module nạp AVI GIFT (P8) | `src/modules/avi-gift-import/` | `domain/catalog-mapping.ts` thuần (`mapCatalogRowToProduct`/`deriveProductStatus`/`validateCatalogRow`) · `use-cases/bootstrap-avi-gift-organization.ts` (tổ chức `SINGLE`, KHÔNG tái dùng `signUp` vì đó cố định `EXPERIENCE`+trial) · `use-cases/import-catalog.ts` (idempotent theo `code`, gọi thẳng `ProductRepository`). Nguồn Excel đọc bằng Python NGOÀI `src/` — xem `scripts/nap-avi-gift/doc-excel.py` |
| An toàn nội dung & Từ điển từ cấm | `docs/kien-truc/TU_DIEN_TU_CAM_CONTENT_NGANH_HOA.md` + `src/core/ai/domain/flower-content-banned-lexicon.json` | SSOT kiểm soát chất lượng nội dung ngành hoa; `FlowerContentGuard` (`flower-content-guard.ts`) áp dụng toàn hệ thống (chặn HARD_BLOCK, cảnh báo WARNING, tích hợp `brand_profiles.forbidden_styles`) |
| Module Catalog & Website (M06/M05) | `src/modules/catalog-links/` + `src/components/catalog/` | E-Catalog trực tuyến (`/catalog` & `/c/[slug]`), `qr-engine.ts` (mã QR SVG/PNG 500px), Storefront công khai `GET /api/v1/public/catalog/[slug]` (ký HMAC ảnh + logo), Modal chi tiết sản phẩm chuẩn Mobile, Chia sẻ mạng xã hội (`share-catalog-modal.tsx`), Họ Template Landing Page (`landing-templates/`: Hero, Products, Lead) 4 Archetypes kèm đồng hồ đếm ngược FOMO và CTA đặt Zalo, Cầu nối M07 AI Content Engine (`/noi-dung?catalog_slug=...`) tự động chèn liên kết đặt hoa trực tuyến |
| Module Video Studio (M04c) | `src/modules/video-studio/` + `workers/media_ai/video/` + `src/components/video-studio/` | AI Video Studio (P17, `/video`). 6 khuôn (Reel, TikTok, Story, Slideshow, Product, Ad), kịch bản linh hoạt 2–15 cảnh, tự động cân bằng thời lượng, Camera Motion Ken Burns (Zoom In/Out, Pan Up/Right, Static), phụ đề đa phong cách (Modern Badge, Minimal, Highlight Box, Bottom Banner), lồng tiếng TTS ducking nhạc nền, 2 cổng duyệt (Script & Video Output), kiến trúc Provider cắm rút: Phương án A Local Cinematic FFmpeg (0 credit, ~0.45s/cảnh) + Phương án B Standby AI Generative (Google Veo & HeyGen) |
| Module Đơn Hàng & Vận Hành (M10) | `src/modules/orders/` + `src/components/orders/` | P22, `/don-hang`. Kanban 4 cột, Event Sourcing, đo lường SLA 180 phút, bóc tách lát cắt Thợ cắm hoa xưởng (giấu 100% giá), phiếu giao hàng & thiệp A6. 4 bảng CSDL (`orders`, `order_items`, `order_assignments`, `order_events`), 8 mã năng lực `R1`–`R8` |
| Module CRM & Khách Hàng (M09) | `src/modules/crm/` + `src/components/crm/` | P21, `/khach-hang`. Customer Master Index SSOT, phân tầng RFM tự động (VIP/Gold/Silver/Bronze/New), quét ngày kỷ niệm trước 14 ngày, Consent Engine quyền riêng tư. 4 bảng CSDL (`customers`, `customer_occasions`, `customer_consents`, `vouchers`), 8 mã năng lực `Q1`–`Q8` |
| Module AI Chat Assistant & Đa Kênh (M08) | `src/modules/chat-assistant/` + `src/components/chat/` | P23, `/hoi-thoai` & `/hoi-thoai/kenh-tich-hop`. Dual-Intent Router (SaaS Help vs Flower Sales), Trợ lý nổi `<FloraOSGlobalCopilot />` (`Cmd+K`), 5 kênh tiếp xúc Omnichannel (E-Catalog, Landing Page, Messenger Webhook, Zalo OA Webhook, Script nhúng website ngoài), cơ chế định giá & thu phí credit nền tảng qua `usage`, chốt chặn Aegis Protection. 3 bảng CSDL (`chat_conversations`, `chat_messages`, `chat_channel_integrations`), 4 mã năng lực `T1`–`T4`. Đặc tả: `docs/kien-truc/FLORAOS_AI_CHAT_ASSISTANT_OMNICHANNEL_ARCHITECTURE.md` |
| Tài liệu kiến trúc | `docs/kien-truc/` | 9 tệp, xem `TRANG_THAI.md` |


## Bẫy

*(Mỗi lần một điều bất ngờ làm mất hơn một giờ, thêm một dòng.)*
- `excel_parser.py`/`ket_qua_phan_tich.py` bản gốc (v1) dò cột ảnh qua bốn tên đoán — không tên nào khớp dữ liệu thật của AVI GIFT (`Đường dẫn ảnh`). Đọc tên cột thật từ chính workbook (`ws.iter_rows` lấy hàng tiêu đề) trước khi viết adapter đọc Excel, đừng tin tên cột trong mã nguồn v1 — điểm lệch #12, `RA_SOAT_THU_HOACH.md`.
- Thư mục dữ liệu vận hành của một khách hàng thật (vd `FloraOS Vận hành/`) có thể chứa khoá API thật ở dạng thô (`he_thong.json` của AVI GIFT có `openai_api_key` — nợ #36). Đọc CÓ CHỌN LỌC đúng những tệp cần cho việc đang làm, không `cat`/liệt kê toàn bộ nội dung một thư mục dữ liệu khách hàng khi chưa cần — và không bao giờ chép các tệp dạng `he_thong.json`/`.env` vào `scripts/` hay bất kỳ đường dẫn nào sẽ commit.

- Bộ ảnh vàng là điều kiện nghiệm thu P5. Không có nó thì không đổi được provider và không hồi quy được phần thu hoạch. Quy cách ở `docs/kien-truc/BO_ANH_VANG.md`.
- Một suite test tắt ở bước **NẠP** đọc giống hệt một suite đỏ ở dòng tổng kết. `server-only` (gói của Next.js) ném lỗi ngay khi được nạp trừ khi có điều kiện xuất `react-server`, và vitest không bật điều kiện đó — nên một `import "server-only"` thêm vào MỘT tệp hạ tầng đã làm NĂM suite `tests/tenant/` tắt cùng lúc. Dòng tổng kết chỉ nói "6 failed"; danh sách "Failed Suites" nằm ở giữa một output dài và không ai đọc tới. Khi số tệp đỏ nhiều hơn số tệp mình vừa đụng, đọc mục "Failed Suites" TRƯỚC mục "Failed Tests" — đã trả bằng alias ở `vitest.config.ts`, nợ #81.
- `device_commit_files` trả `written` nghĩa là lời gọi đã chạy, KHÔNG nghĩa là nội dung trên đĩa đúng bản mình định ghi. Một lượt ghi ở P24 báo `written` nhưng đĩa vẫn giữ bản cũ, lệch đúng một ký tự, và `tsc` đỏ lại y nguyên ở lần chạy sau. Sau mỗi lượt ghi tệp có ý nghĩa, đọc ngược tệp từ máy (`device_stage_files`) và đối chiếu — số byte là cách rẻ nhất.
- Một tính năng "đã tích [x]" trong checklist không có nghĩa là mã làm đúng điều ô đó nói. P16 tích đủ bảy ô, nhưng đường chạy thật của M04b khi soát lại ở P24 là: một endpoint không đòi đăng nhập, `spawn` Python đọc stdout, nhận `image_url` tuỳ ý (SSRF), trả ảnh base64 không vào kho, và ba con số "toàn vẹn 100/99/98" gõ tay trong giao diện. **Trước khi tin một ô đã tích, mở đúng tệp mà ô đó nói tới.** Rẻ nhất là hỏi bốn câu cho mỗi đường chạy AI: có `requireTenantContext` không · có `requireCapability` không · có đi qua `enqueueJob` không · kết quả có thành dòng `assets` không.
- Con số hiển thị cho người dùng phải là số ĐO hoặc không hiển thị. Một hằng số trông hợp lý (98%) nằm trong mã giao diện lâu hơn bất kỳ giả định nào khác, và không ca thử nào bắt được nó vì nó luôn "đúng".
- Prisma 7 **không đọc `url` trong `schema.prisma`** nữa. Chuỗi kết nối nằm ở `prisma.config.ts` cho lệnh dòng lệnh, và ở driver adapter `@prisma/adapter-pg` cho `PrismaClient`. Bỏ qua điều này thì `prisma generate` dừng ở `P1012`.
- `prisma.config.ts` cũng không tự nạp `.env`. Nó gọi `process.loadEnvFile` khi tệp có mặt; trên CI biến nằm sẵn trong môi trường.
- `prisma generate` và `prisma db push` **tải nhị phân schema-engine từ `binaries.prisma.sh`**. Máy không ra được host đó thì hai lệnh này không chạy, dù mọi thứ khác offline được. Sinh lược đồ ở nơi có mạng, hoặc mở host đó trên proxy.
- Prisma 7 BỎ cờ `--skip-generate` của `prisma db push`. Truyền vào thì CLI in trang trợ giúp và không đẩy gì cả — nhưng database vẫn được tạo, nên lỗi chỉ lộ ra rất muộn dưới dạng `relation "..." does not exist` lúc chạy test. Mọi script gọi `db push` nên kiểm lại bằng một truy vấn `to_regclass` thay vì tin mã thoát.
- `npm run test:tenant` XOÁ SẠCH database nó trỏ tới (`TRUNCATE` 22 bảng trước mỗi ca thử). Tới 09/10 nó dùng chung database với môi trường phát triển, nên cổng bắt buộc này cuốn mất tổ chức AVI GIFT cùng 1.316 SKU — hai lần trong một tối. Nay nó trỏ sang `floraos_test` và `tests/helpers/database.ts` TỪ CHỐI chạy nếu tên database không kết thúc bằng `_test`. Dựng database đó một lần bằng `npm run db:test:setup`; nếu quên, lỗi đầu tiên anh gặp sẽ nói thẳng phải chạy lệnh gì.
- Biến `DATABASE_URL` export ra shell theo `cd` sang repo khác, và `process.loadEnvFile()` KHÔNG ghi đè biến đã có sẵn. Chạy `set -a && source .env` trong `LocalBudd` rồi `cd` sang đây là đủ để `npx prisma db push` của core trỏ vào Supabase của LocalBudd — suýt xảy ra 09/10. Trước mọi lệnh Prisma: `echo "[$DATABASE_URL]"` phải rỗng, và nhìn dòng `Datasource "db"` nó in ra.
- `prisma generate` KHÔNG chạy được trong VM của `device_bash`: nó tải nhị phân từ `binaries.prisma.sh` và host đó trả 403 qua proxy của VM (`PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` không giúp — bước sau vẫn phải tải chính tệp engine). Hệ quả cụ thể: thêm model vào `schema.prisma` thì `npx tsc --noEmit` báo `Property 'x' does not exist on type 'DbClient'` cho tới khi ai đó chạy `prisma generate` trên Terminal Mac thật. Phân loại lỗi `tsc` trước khi đi sửa: lỗi dạng đó là lỗi CHỜ, không phải lỗi mã.
- `npm test` loại `tests/tenant/**` theo thiết kế; gọi thẳng `npx vitest run` sẽ kéo cả bộ test cách ly vào và nó TỪ CHỐI chạy vì database không kết thúc bằng `_test`. Dùng đúng hai lệnh: `npm test` và `npm run test:tenant`.
- `npm run lint` từng dừng ngay vì repo thiếu `eslint.config.mjs` — cổng thứ hai của CI chưa từng chạy trong suốt P0. Thêm một cổng vào CI thì chạy thử nó một lần tại máy.
- Sandbox `device_bash` từng chặn `npx vitest`/`npx tsc` bằng lỗi `Cannot find module '@rollup/rollup-linux-arm64-gnu'` (kiến trúc gói sai trong `node_modules` cài sẵn). Sửa bằng `npm install @rollup/rollup-linux-arm64-gnu --no-save` — chạy được thật `vitest`/`tsc --noEmit` trong sandbox từ đó, không cần đợi anh Tony chạy trên máy thật mới biết type có sai không.
- Tên tệp/thư mục tiếng Việt có dấu qua cầu nối máy Mac (`device_bash`) ở dạng Unicode **NFD** (tổ hợp dấu rời), còn chuỗi gõ trong mã nguồn ở đây là **NFC**. So khớp chuỗi trực tiếp (`"giỏ" in ten_thu_muc`) luôn sai lặng lẽ, không báo lỗi. Luôn `unicodedata.normalize("NFC", ...)` cả hai phía trước khi so — xem `scripts/xay-dung-bo-anh-vang.py`.
- `BoAnhVang/` (ảnh thô để dựng bộ ảnh vàng) từng KHÔNG có trong `.gitignore` — ảnh sản phẩm của khách hàng đã có nguy cơ vào git nếu ai đó lỡ `git add -A`. Đã thêm vào `.gitignore` ngày 09/09. Mọi thư mục chứa ảnh khách hàng ngoài `golden/images/` cần rà lại `.gitignore` trước khi coi là an toàn.

## Kết thúc mỗi việc — bắt buộc

Việc chưa ghi lại là việc lần sau không ai biết đã làm. Trước khi báo xong, làm đủ ba bước, **trong cùng lần đó**:

1. **Tích ô trong `docs/dac-ta/Checklist_Thuc_Thi.md`.** Đổi `- [ ]` thành `- [x]` cho đúng những ô vừa làm xong. Không tích trước, không tích ô chỉ làm một nửa.
2. **Nếu ô vừa tích là ô cuối của một pha** — cập nhật `docs/kien-truc/TRANG_THAI.md`: mục 1 (đang ở đâu), mục 6 (việc kế tiếp), và thêm một dòng vào mục 8 (nhật ký).
3. **Commit cả mã lẫn tài liệu trong cùng một commit.** Tách ra là tạo ra khoảng thời gian mã và tài liệu lệch nhau.

Phát sinh thêm việc chưa có trong checklist thì **thêm ô mới** vào đúng pha, đừng làm âm thầm. Gặp thứ phải chấp nhận tạm thì thêm một dòng vào `docs/dac-ta/TECHNICAL_DEBT.md` kèm điều kiện trả.

Đầu mỗi phiên làm việc: đọc `TRANG_THAI.md` rồi tới `Checklist_Thuc_Thi.md`. Ô chưa tích đầu tiên chính là việc kế tiếp.

## Quy tắc làm việc

- Nêu tên các tệp định mở trước khi mở.
- Vá bằng diff. Không in lại phần mã không đổi.
- Hỏng hai lần thì ngừng vá: nêu điều mà thất bại chứng minh là sai trong hình dung về mã, rồi mở đúng tệp giải quyết được điều đó.
- Cần tìm kiếm toàn repo lần thứ hai trong một việc nghĩa là bản đồ thiếu một dòng — bổ sung dòng đó trước khi kết thúc.
- Gặp mâu thuẫn giữa tài liệu Level 1 và Level 2 → **dừng và báo chủ sản phẩm**, không tự chọn bên nào.
