# Unified Shell — kiến trúc gộp trình bày ba sản phẩm

**Ngày chốt:** 2026-09-10, qua phiên Cowork với anh Tony (AskUserQuestion).
**Phạm vi:** ranh giới trình bày (UI, domain, phiên đăng nhập) giữa `floraos-core`, `LocalBudd`, `SocialFlow`. Không đổi ranh giới sở hữu dữ liệu ở PRD §8.

## 1. Quyết định

`floraos-core` là shell duy nhất người dùng nhìn thấy. `LocalBudd` và `SocialFlow` hiển thị dưới cùng domain qua proxy theo path, dùng chung một phiên đăng nhập. Ba backend giữ nguyên tách rời — không gộp mã, không gộp schema.

Đây là lựa chọn giữa ba phương án đã cân nhắc:

| Phương án | Cảm giác người dùng | Chi phí | Có phá PRD §8 không |
|---|---|---|---|
| Chỉ liên kết ngoài (thẻ "Mở sang", đã xây ở màn Trải nghiệm) | Rõ là 3 sản phẩm khác nhau | Đã xong | Không |
| **Unified Shell (chốt)** | Như 1 sản phẩm, 8 module liền mạch | Trung bình — SSO + proxy, không viết lại nghiệp vụ | Không |
| Gộp toàn bộ vào `floraos-core` | Như 1 sản phẩm | Rất lớn — viết lại SocialFlow (Python/Playwright) và LocalBudd bằng stack của core | Có — ngược Đường A đã chốt 09/09 (`HARVEST_MANIFEST.md`) |

Lý do loại phương án gộp mã: `floraos-core` mất 5–6 tháng một đội nhỏ chỉ để làm M01–M04a (PRD §10). SocialFlow có automation Playwright cho 6 nền tảng đăng bài và adapter video (HeyGen/Veo) — viết lại bằng TypeScript không phải việc nối API, mà port lại một hệ automation. Nguyên tắc PRD §8 ("Core sở hữu entity nhiều module đọc, Engine sở hữu entity chỉ module của nó đọc") đặt ra chính để tránh lặp lại sai lầm của hệ v1 (Excel làm cấu trúc dữ liệu, một khoá ghi toàn cục) — gộp mã xoá bỏ chính ranh giới đó.

## 2. Cấu trúc domain

```
app.floraos.vn/                  → floraos-core (shell + M01, M02, M03, M04a)
app.floraos.vn/anh-marketing/*   → proxy sang SocialFlow (M04b)
app.floraos.vn/video/*           → proxy sang SocialFlow (M04c)
app.floraos.vn/noi-dung/*        → proxy sang SocialFlow (M07)
app.floraos.vn/lich-dang/*       → proxy sang SocialFlow (M07)
app.floraos.vn/landing/*         → proxy sang LocalBudd (M05)
app.floraos.vn/catalog/*         → proxy sang LocalBudd (M06)
```

Cùng origin nên cookie phiên chia sẻ được tự nhiên, không cần CORS cross-domain.

**Bảng cổng cục bộ (chốt 2026-09-10)** — trước khi có proxy thật, ba app chạy ba cổng cố định. Trước ngày này ba repo trỏ nhầm nhau (core và LocalBudd cùng đòi 3000; core trỏ LocalBudd ở 3001; LocalBudd trỏ core ở 3100), nên không cấu hình nào chạy đồng thời được:

| App | Cổng | Đặt ở đâu |
|---|---|---|
| `floraos-core` | 3100 | `package.json` — `next dev -p 3100` |
| `LocalBudd` | 3000 | `PORT`/`APP_URL` trong `.env` |
| `SocialFlow` | 8000 | `start.sh` |

- `LocalBudd` cũng là Next.js — dùng Next.js Multi-Zones (rewrites trong `next.config.ts` của `floraos-core`, mỗi zone build và deploy độc lập).
- `SocialFlow` là FastAPI — proxy ở tầng hạ tầng (Nginx/Caddy path-based), không qua Next Zones.

## 3. Phiên dùng chung (SSO)

`floraos-core` phát hành một token phiên ký (JWT), mở rộng từ cơ chế `integration_tokens`/`INTEGRATION_TOKEN_SECRET` đã có ở P7 — nhưng khác về bản chất: `integration_tokens` hiện tại là token máy-gọi-máy, tồn tại lâu dài, không gắn người dùng cụ thể; token phiên là ngắn hạn, gắn `user_id` + `organization_id` + mã năng lực, cấp lúc đăng nhập.

- Core set cookie phiên ở domain cha (`.floraos.vn`), `HttpOnly`, `Secure`, `SameSite=Lax`.
- `LocalBudd` đọc cookie trực tiếp (cùng domain cha, cùng là Next.js) — thay dần cơ chế đăng nhập riêng của nó bằng việc xác thực cookie này.
- `SocialFlow` cần middleware mới xác thực chữ ký JWT từ cookie, giải ra `organization_id` — đây là phần việc trùng với nợ đang mở ở `SocialFlow/TECHNICAL_DEBT.md` ("không có cơ chế xác thực máy gọi máy nào").
- Mỗi app đích vẫn tự kiểm quyền ở từng endpoint — token phiên chỉ xác định danh tính, không thay thế RBAC riêng của app đó. Đúng nguyên tắc RBAC-for-UI-only đã áp dụng cho `floraos-core`.

## 4. Việc cần làm theo repo

**`floraos-core`**
- Bảng phiên nền tảng mới (hoặc mở rộng `integration_tokens`) để phát hành/thu hồi token phiên gắn người dùng.
- Set cookie domain cha lúc đăng nhập.
- `next.config.ts` — rewrites cho `/marketing`, `/social`, `/landing`, `/catalog`.

**`LocalBudd`**
- Middleware xác thực cookie phiên thay cho đăng nhập độc lập.
- Đọc `organization_id` từ token thay vì tự quản lý phiên.

**`SocialFlow`**
- Middleware FastAPI xác thực JWT từ cookie.
- **D1 chốt 2026-09-10: đa tenant thật.** Pha 1 xong (`accounts` dựng lại `UNIQUE(organization_id, platform)`, `organization_id` thêm vào `campaigns`/`templates`/`post_metrics`/`weekly_metrics`/`content_insights`, cách ly thật cho `post_metrics` — bảng duy trong nhóm có đường đọc/ghi sống). Pha 2 còn mở: `posts`/`signals`/`content_plans` nằm xuyên sáu agent (planner/scout/analyst/reviewer/creator/publisher) chưa có khái niệm tổ chức trong chuỗi gọi — cần bản đồ luồng gọi trước khi sửa schema. **Middleware SSO ở trên không bắt đầu trước khi Pha 2 xong** — mở SSO vào một pipeline còn trộn lẫn tổ chức bên trong chỉ khiến lỗ rò lộ ra ngoài dễ hơn, không loại bỏ nó. Chi tiết: `SocialFlow/TECHNICAL_DEBT.md` mục "D1 (đa tenant thật) — Phase 1".

**Hạ tầng**
- Reverse proxy đứng trước cả ba (domain cha `.floraos.vn`), Next rewrites cho phần Next, proxy riêng cho phần Python.

## 5. Vị trí trong lộ trình

Gắn tiếp sau P7 (Integration Layer) trong PRD §10 — P7 đã xây phần đọc dữ liệu qua API; Unified Shell thêm phần đọc phiên (SSO), không phải một pha ngoài kế hoạch. D1 đã chốt là đa tenant thật (2026-09-10) — nhưng SSO cho `SocialFlow` cụ thể vẫn chờ Pha 2 của D1 (`posts`/`signals`/`content_plans` xuyên sáu agent) xong, không phải chờ D1 "chốt" nữa (đã chốt) mà chờ D1 "làm xong".

## 6. Không làm

Không gộp `LocalBudd`/`SocialFlow` vào cùng repo hoặc cùng schema với `floraos-core`. Không tạo endpoint để `floraos-core` gọi ngược sang hai repo kia để "chạy hộ" một job — mỗi engine vẫn tự vận hành job của mình, core chỉ mang phiên người dùng đi qua ranh giới trình bày.


## 7. Lộ trình hoàn thành 100%

Bốn nhóm việc, có phụ thuộc thứ tự. Nhóm A là việc duy nhất có thể bắt đầu ngay — B chờ A xong, C cần quyết định hạ tầng thật từ anh Tony (domain, hosting), D chờ cả B và C.

### Nhóm A — D1 Pha 2 (SocialFlow: `posts`/`signals`/`content_plans` xuyên sáu agent)

Việc nặng nhất trong toàn bộ lộ trình — không rút gọn được vì sáu agent hiện không có khái niệm tổ chức ở bất kỳ đâu.

| # | Việc | Phụ thuộc |
|---|---|---|
| A1 | ✅ **Xong 2026-09-10.** Bản đồ luồng gọi sáu agent + `orchestrator.py` — chi tiết đầy đủ ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — agent-pipeline flow map". Hai phát hiện đổi phạm vi A2 trở đi: (1) `orchestrator.py` giữ một `PipelineStatus` singleton cấp module — chỉ MỘT pipeline chạy được cùng lúc cho TOÀN BỘ tiến trình, không phân biệt tổ chức; thêm cột vào bảng không sửa được lỗi này, tầng điều phối phải sửa riêng. (2) `brand_config` (Creator đọc để lấy màu/font/giọng thương hiệu) và lượt tra `accounts` riêng cho Discord ở Publisher đều KHÔNG lọc theo tổ chức — không nằm trong danh sách debt gốc | — |
| A2 | ✅ **Chốt 2026-09-10.** Một lịch chung (cron), khi chạy thì xử lý danh sách tổ chức theo **lô song song có giới hạn** (vd 5–10 tổ chức cùng lúc), không phải xếp hàng tuần tự từng tổ chức một. Lý do: hai bước chậm nhất của pipeline (Creator gọi AI, Publisher đăng qua Playwright) là CHỜ MẠNG, không giữ khoá SQLite trong lúc chờ — nhiều tổ chức chờ mạng song song không đụng chạm nhau, chỉ khoảnh khắc ghi đĩa thật sự (vài phần nghìn giây) mới cần SQLite xử lý tuần tự, và WAL + thử lại khi bận là đủ cho việc đó, không cần đổi sang Postgres ngay. Ước lượng (chưa đo thật): một vòng/tổ chức ~2–6 phút, phần lớn ở Creator và Publisher; 100 tổ chức tuần tự ≈ 6–7 tiếng, cùng lô 10 ≈ 40 phút. Con số song song cụ thể chờ đo thật (xem A2b) | A1 |
| A2b | ✅ **Xong 2026-09-10.** Đo thời gian thật thêm vào `orchestrator.py` (mỗi bước trong 6 agent) và `publisher.py` (mỗi nền tảng đăng bài) — `GET /api/pipeline/status` trả thêm `last_stage_seconds`. Đã test bằng agent giả lập, xác nhận đo đúng. Còn thiếu số THẬT — cần anh Tony chạy pipeline thật một lần trên máy có mạng rồi gọi `GET /api/pipeline/status`, để chọn đúng giới hạn song song (ví dụ 5–10 tổ chức/lô) thay vì ước lượng ở A2 | A2 |
| A3 | ✅ **Xong 2026-09-10 — bản sửa an toàn tạm thời, chưa phải song song thật.** `PipelineStatus` thêm `current_organization_id`; `run_full_pipeline()` nhận `organization_id`, khi có tổ chức khác gọi trong lúc đang chạy thì trả về từ chối tường minh (nêu rõ tổ chức nào đang giữ lượt) thay vì âm thầm trả `last_result` cũ của tổ chức trước — lỗi phát hiện ở A1(1). Pipeline vẫn chạy từng lượt một (single-flight); bật chạy song song thật dời sang sau A5, gộp vào A6 — vì bật trước khi A4/A5 cách ly dữ liệu xong sẽ gây đúng loại rò dữ liệu chéo tổ chức mà D1 được lập ra để ngăn. Chi tiết ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — A3" | A2 |
| A4 | ✅ **Xong 2026-09-10.** `organization_id` thêm vào `posts`, `signals`, `content_plans`, `content_queue`, `assets` nội bộ và `brand_config` qua `migrations.py`, đúng khuôn Pha 1 — không bảng nào cần rebuild vì UNIQUE như `accounts`. Cột chưa được dùng ở đâu (chờ A5 lọc theo tổ chức trong từng agent); riêng `brand_config` vẫn là MỘT hàng dùng chung cho mọi tổ chức cho tới khi A5 sửa logic đọc/ghi. Test trên bản sao DB thật (45 posts/11 signals/18 content_plans/14 assets/1 brand_config): cột thêm đúng, dữ liệu cũ giữ nguyên, `organization_id` NULL trên dòng cũ, idempotent qua 2 lần chạy. Sửa luôn `tests/test_migrations.py` — bộ test cũ chỉ dựng bảng `assets` nên đã sai ngầm từ Pha 1, giờ dựng đủ hình dạng toàn ứng dụng, 32/32 passed. Chi tiết ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — A4" | A2 |
| A5 | ✅ **Xong 2026-09-10.** Sáu agent + `orchestrator.py` + `automation.py`/`automation_extended.py` + `brand_kit.py` (5 route UI) + các endpoint gọi chúng trong `main.py` — lọc/gắn `organization_id` ở mọi điểm đọc/ghi. Quyết định của anh Tony (AskUserQuestion): `signals` ở lại DÙNG CHUNG (không theo tổ chức) — tránh N tổ chức = N lần gọi lặp HackerNews/GitHub API (giới hạn 60 lượt/giờ, dễ vỡ khi chạy lô song song); bảng mới `signal_org_processed` ghi tổ chức nào đã dùng signal nào, thay cột `processed` chung cũ. Hai phát hiện mới ngoài bản đồ A1: (1) file phiên đăng nhập Playwright dùng chung mọi tổ chức (`automation.py`) — sửa bằng cách đưa `organization_id` vào tên tệp phiên, một chỗ sửa tự áp dụng cho ~20 điểm gọi rải rác; (2) `run_migrations()` bị gọi trước khi `posts`/`signals`/`content_plans`/`brand_config` tồn tại trên MỘT DATABASE MỚI — sửa bằng cách gọi thêm lần nữa cuối `lifespan()`. `brand_config` giờ một hàng mỗi tổ chức thật sự (kể cả 5 route UI, không chỉ hàm nội bộ Creator). Khoảng trống cố ý để lại: Facebook Graph API vẫn dùng một Page/token chung server (env var, chưa theo tổ chức); các endpoint thao tác-theo-ID (`approve`/`reject`/`publish`) chưa kiểm tra bài viết thuộc đúng tổ chức — thuộc phạm vi soát bảo mật Nhóm D; lịch tự động vẫn chỉ chạy một tổ chức mặc định, chờ A6 xây cơ chế lặp qua nhiều tổ chức. Test tích hợp hai tổ chức xuyên toàn bộ pipeline: 36/36 passed; test `brand_kit.py`: 10/10 passed; `tests/test_migrations.py`: 31/31 passed. Chi tiết ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — A5" | A3, A4 |
| A6 | ✅ **Xong 2026-09-10.** `PipelineStatus` (A3) đổi từ một biến toàn cục thành `_status_by_org: Dict[str, PipelineStatus]` + `get_status(organization_id)` — single-flight giờ chỉ chặn trong CÙNG một tổ chức, hai tổ chức khác nhau chạy cùng lúc không còn bị chặn nhầm. `list_known_organizations()` suy danh sách tổ chức đang hoạt động từ `SELECT DISTINCT organization_id FROM accounts` (SocialFlow không có bảng tổ chức riêng). `run_for_organizations()` hiện thực hoá lô song song có giới hạn đã thiết kế ở A2 bằng `asyncio.Semaphore` (mặc định 8 tổ chức/lô, biến môi trường `SOCIALFLOW_PIPELINE_BATCH_SIZE`). `run_scheduled_cycle()` là điểm vào thật cho lịch tự động: chạy Scout đúng một lần (dùng chung theo quyết định A5) rồi chạy Planner→Creator→Reviewer→[Publisher]→Analyst cho từng tổ chức theo lô song song. Bốn job `APScheduler` trong `main.py` viết lại để gọi các hàm này thay vì chạy một tổ chức mặc định. Test đồng thời dùng agent giả lập (delay nhân tạo, không mạng): 13/13 passed — xác nhận song song thật (mức song song ≥2, không còn chạy nối tiếp), single-flight cùng tổ chức vẫn đúng, giới hạn lô đúng, Scout chạy đúng một lần dù nhiều tổ chức. `tests/test_migrations.py` 31/31, `bash tests/run_all.sh` không phát sinh lỗi mới ngoài hai lỗi không liên quan đã ghi nhận từ A5. Chi tiết ở `SocialFlow/TECHNICAL_DEBT.md` mục "D1 Phase 2 — A6" | A5 |
| A7 | ✅ **Xong 2026-09-10 — D1 hoàn tất.** `SocialFlow/TECHNICAL_DEBT.md` đóng lại các mục nợ #2–#4 gốc (RESOLVED, trỏ về A1–A6) và thêm mục tổng kết "D1 (đa tenant thật) — HOÀN TẤT" ở cuối tệp. Ba khoảng trống KHÔNG thuộc phạm vi D1, theo dõi riêng: xác thực caller-identity thật (chờ Nhóm B — SSO), Facebook Graph API dùng Page/token chung server, endpoint thao tác-theo-ID chưa kiểm tra tổ chức (chờ Nhóm D). Nhóm A (D1 Pha 2) đóng hoàn toàn — bảy bước A1–A7 xong | A6 |

### Nhóm B — SSO thật giữa ba app (chờ Nhóm A xong)

| # | Việc | Phụ thuộc |
|---|---|---|
| B1 | ✅ **Xong 2026-09-10.** Khảo sát trước khi viết code phát hiện `floraos-core` **đã có sẵn** một hệ phiên thật (`sessions` table, token đối chiếu HMAC, cookie `floraos_session` — không phải chỉ `integration_tokens` như ghi chú gốc ở đây từng đoán) — B1 không dựng phiên từ đầu, chỉ thêm MỘT cookie JWT thứ hai bên cạnh. Module mới `src/modules/sso/` (`domain/sso-claims.ts` — nội dung `sub`/`org`/`email`/`iat`/`exp`, cố tình KHÔNG mang mã năng lực, đúng nguyên tắc RBAC-for-UI-only mỗi app tự kiểm quyền; `infra/sso-jwt.ts` — JWT HS256 viết tay bằng `node:crypto`, đúng khuôn chuẩn để `LocalBudd`/`SocialFlow` xác minh bằng thư viện JWT tiêu chuẩn của họ). Cookie mới `floraos_sso` (`core/http/cookies.ts`) — cùng quy ước host-only (không đặt `Domain`) như cookie phiên gốc, đã tương thích localhost sẵn không cần sửa gì: trình duyệt tự gửi theo TÊN MÁY, không phân biệt cổng, nên ba app chạy ba cổng cục bộ khác nhau trên "localhost" đã nhận được cookie này. **Quyết định của anh Tony (AskUserQuestion):** JWT sống ngắn (15 phút) + endpoint làm mới, không phải dài hạn khớp phiên gốc (30 ngày) — JWT bị lộ tự hết hạn nhanh, đổi lại cần `POST /api/v1/sso/refresh` (mới) để `LocalBudd`/`SocialFlow` xin token mới bằng cách forward cookie phiên gốc (vẫn thu hồi được qua `revoked_at`) khi JWT hết hạn. `login`/`logout`/`session/organization` route viết lại để phát hành/xoá/tái phát hành cookie mới đúng lúc (đổi tổ chức đang hoạt động phải cấp JWT MỚI ngay, không đợi hết hạn tự nhiên). `core/http/response.ts` mở rộng hỗ trợ nhiều `Set-Cookie` cùng lúc trong một response. Test: 12 ca mới (`sso-claims.test.ts`, `sso-jwt.test.ts`) — round-trip ký/xác minh đúng, chữ ký/payload bị sửa bị từ chối, hết hạn bị từ chối, hình dạng sai không ném lỗi; `npm run typecheck` sạch, `npm run lint` sạch (0 lỗi), `npm test` 168/168 passed (156 cũ + 12 mới, không hồi quy). **Chưa xác minh được**: sandbox này không có Postgres sống (`ECONNREFUSED :5432`) nên chưa chạy được vòng thật `login → nhận cả hai cookie → refresh → switch-organization` qua route thật — cần anh Tony xác minh trên máy có DB thật trước khi coi B1 xong tuyệt đối, giống các lần trước phải xác minh `uvicorn`/`prisma generate` thật ở SocialFlow | Nhóm A |
| B2 | ✅ **Xong 2026-09-10 — cả B2a–B2d.** `LocalBudd` — chia nhỏ hơn kế hoạch gốc, xem chi tiết dưới bảng. Khảo sát trước khi làm phát hiện `LocalBudd` không có khái niệm tổ chức ở đâu cả (`projects.owner_id` một-chủ-sở-hữu) — việc này đã được `LocalBudd/00-CANH-BAO-DOC-TRUOC.md` cảnh báo trước, chặn bởi hai quyết định P7 riêng (products/generation_jobs). Anh Tony chốt cả hai (AskUserQuestion) nên B2 mở khoá được, chia thành B2a–B2d. Coi như xong phần MÃ — còn lại là xác minh trên máy thật (Postgres + `prisma generate` + `FLORAOS_CORE_INTEGRATION_TOKEN` thật) | B1 |
| B2a | ✅ **Xong 2026-09-10.** Nền tảng SSO ở `LocalBudd`: `organization_id` (nullable) thêm vào `sessions`/`projects`; module `src/modules/sso/` chỉ xác minh (không ký); `getSession()` viết lại — `floraos_sso` có mặt thì luôn là nguồn thẩm quyền cho tổ chức đang hoạt động, mint phiên LocalBudd mới khi tổ chức lệch; middleware Edge chấp nhận `floraos_sso` HOẶC `session_id`. User LocalBudd khớp/tạo theo email claims SSO. `npx eslint` sạch; `npx tsc --noEmit` còn đúng 1 lỗi (client Prisma sinh sẵn trong sandbox chưa theo schema mới — cần anh Tony `prisma generate` lại, cùng giới hạn mạng đã gặp ở `floraos-core` P9). LocalBudd không có test tự động chạy được (`npm run test` không tồn tại, 2 tệp test có sẵn dùng cú pháp Jest không hợp Vitest — lỗi có từ trước, không phải do B2a) — chưa xác minh được vòng thật, cần anh Tony xác minh trên máy có DB thật. Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "Unified Shell — B2" | B1 |
| B2b | ✅ **Xong 2026-09-10.** Phạm vi thật lớn hơn ước tính ban đầu ("5 tệp" chỉ đếm chữ `owner_id` theo nghĩa đen) — chuỗi kiểm quyền tenant isolation cho `pages` xuyên `IPageRepository` chạm **19 tệp** (9 route, 7 use-case, repository, interface) cộng 2 route đọc Prisma trực tiếp. Kiểu mới `TenantAccess` + hàm `hasProjectAccess()` (`src/lib/auth.ts`) — project đã gán tổ chức thì mọi thành viên tổ chức đó truy cập được (không chỉ người tạo); project chưa gán tổ chức (dữ liệu/phiên cũ) rơi về luật cũ (chỉ đúng owner). `npx eslint` 0 lỗi mới (đối chiếu từng tệp qua `git diff`, 26 lỗi/3 cảnh báo hiện có trên repo đều xác nhận có từ trước). `npx tsc --noEmit` còn đúng các lỗi "thiếu organization_id" (client Prisma sinh sẵn trong sandbox chưa theo schema mới, cùng giới hạn B2a). Chưa xác minh hành vi thật (cần DB thật). Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "B2b" | B2a |
| B2c | ✅ **Xong 2026-09-10.** Bỏ hẳn luồng nhập sản phẩm cục bộ ở `LocalBudd` (`ManualInputForm`/`UrlInputForm`/scraping/xác nhận/sửa/xoá + upload ảnh thủ công) — `products` giờ chỉ giữ bản ghi THAM CHIẾU tới Product Master bên core (`core_product_id`, ràng buộc unique theo project). Route mới: `GET /api/v1/core-products` (proxy `listProducts()`) và `POST /api/v1/projects/[id]/products` (gắn sản phẩm); `DELETE /api/v1/products/[id]` đổi nghĩa thành gỡ tham chiếu. Repository/use-case dùng `TenantAccess`/`hasProjectAccess` cùng khuôn B2b. Ba giới hạn đã biết, cố tình chưa xử lý: (1) `price`/`description`/`attributes` không còn điền được — `CoreProductLookup` chưa phơi các trường này; (2) `FLORAOS_CORE_INTEGRATION_TOKEN` là MỘT giá trị toàn cục, không theo từng tổ chức — an toàn với một tổ chức/một lần triển khai, nhưng sẽ rò dữ liệu giữa các tổ chức nếu nhiều tổ chức dùng chung một `LocalBudd`; (3) ảnh Master Image chưa hiển thị trên UI dù `getMasterImage()` đã có. `npx tsc --noEmit`/`npx eslint` sạch ngoại trừ nhóm lỗi "thiếu organization_id/core_product_id" đã biết (client Prisma sinh sẵn trong sandbox). Chưa xác minh luồng thật (cần DB thật + token thật). Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "Unified Shell — B2c" | B2b |
| B2d | ✅ **Xong 2026-09-10.** `FloraOsCoreClient` thêm `createJob()` (`POST /integration/jobs`, core đã phơi từ P7 — tái dùng `enqueueJob`). Hàm mới `reportGenerationJobToCore()` ánh xạ loại job cục bộ sang đúng mã feature đã đăng ký giá bên core (`landing_generation`→`landing.generate`, `catalogue_generation`→`catalog.generate` — cố tình không gửi thẳng tên cục bộ, hai bên đặt tên khác nhau) và gọi SONG SONG (không `await` chặn) ngay sau khi tạo job cục bộ ở `generate/landing`/`generate/catalogue`. **Ghi rõ có chủ đích**: vì không chặn, hạn mức core hiện chỉ mang tính GHI NHẬN — core từ chối (hết credit) hay không gọi được cũng không chặn job cục bộ, đúng quyết định "giữ nguyên hàng đợi cục bộ" đã chốt, nhưng khác với việc core "chặn thật" nếu ai đó hiểu nhầm câu quyết định gốc. Phát hiện phụ sửa nhân tiện: `verifyProjectOwnership()` (`src/lib/auth.ts`, dùng bởi 6 route — 2 route B2d vừa sửa, cộng `design`/`layout`/`design-contract`/`design-direction`) lọt khỏi kiểm kê B2b VÀ B2c, vẫn lọc thẳng `owner_id` — sửa lại dùng `hasProjectAccess`/`toTenantAccess` đã có, giữ nguyên chữ ký hàm nên cả 6 nơi gọi không cần đổi. `npx tsc --noEmit` chỉ thêm đúng loại lỗi "thiếu organization_id/core_product_id" đã biết ở hai điểm mới chạm. `npx eslint .` — 167 vấn đề, TRÙNG KHỚP TUYỆT ĐỐI với trước B2d, 0 lỗi mới. Chưa xác minh luồng thật (cần DB thật hai phía + token thật). Chi tiết ở `LocalBudd/TECHNICAL_DEBT.md` mục "Unified Shell — B2d" | B2c |
| B2e | ✅ **Xong 2026-09-10 — sửa lại B2c/B2d theo hai quyết định mới của anh Tony.** (1) **Token toàn cục bỏ hẳn cho lời gọi có người dùng**: `LocalBudd` chuyển tiếp JWT `floraos_sso` trong header `X-FloraOS-SSO`, core giải `organization_id` từ đó (`coreClientForUser(ssoToken)`); `FLORAOS_CORE_INTEGRATION_TOKEN` chỉ còn cho lời gọi nền. Đây là bản vá lỗi rò dữ liệu chéo tổ chức mà chính B2c ghi là giới hạn (2). (2) **Hạn mức chặn THẬT**: `ensureCoreAllowsJob()` thay `reportGenerationJobToCore()` — `await` trước khi tạo job cục bộ, phân biệt 422 (hết credit) với 503 (không hỏi được core), và hỏi thêm năng lực `J3`/`J1` trước khi tạo. (3) Nối phần mã chết: `design_contract` dựng từ `brand_profiles` + `business_profiles` theo đúng bảng ánh xạ đặc tả 08 mục 4b, `forbidden_styles` áp như ràng buộc cứng (lọc khỏi hướng thiết kế trước khi sinh), Master Image gắn vào từng sản phẩm trong hợp đồng. (4) Dựng cổng test cho `LocalBudd` (repo trước đó không có runner nào): `vitest`, `npm test` 14/14, `npm run typecheck`. **Còn lại**: `npx prisma generate` + `db push` trên máy anh Tony — 20 lỗi TypeScript hiện tại CHỈ do client Prisma cũ | B2d |
| B3 | ✅ **Phần xác thực xong 09/10 — `backend/sso_auth.py`** (HS256, đọc `SSO_SESSION_SECRET` dùng chung với core, dịch từng dòng từ `sso-jwt.ts`, dùng thư viện chuẩn thay vì thêm PyJWT, 32/32 test). `org_context.py` áp ngữ cảnh tổ chức trên hơn 50 route. **Còn lại của B3 nằm trong Đợt 3**: `Depends(require_org)` cho toàn bộ nhóm route theo tổ chức (E3), đóng lỗ thao-tác-theo-ID (E4), `video_jobs` theo tổ chức (E5), Facebook Graph theo tổ chức (E6), bỏ hẳn `DEFAULT_ORGANIZATION_ID` (E7). Chi tiết ở `DOT_3_NOI_SOCIALFLOW.md` | B1, Nhóm A |
| B4 | Test: đăng nhập một lần ở core, cả ba app nhận đúng danh tính; token hết hạn/giả mạo bị từ chối đúng ở cả ba nơi | B2, B3 |

### Nhóm C — Proxy và domain thật (cần quyết định hạ tầng từ anh Tony)

Toàn bộ mục 2 của tài liệu này dùng `app.floraos.vn` làm ví dụ minh hoạ — domain/hosting thật chưa được chốt. Cần anh Tony cung cấp trước khi làm nhóm này.

| # | Việc | Phụ thuộc |
|---|---|---|
| C1 | Chốt domain thật + nơi hosting (không phải ví dụ minh hoạ trong tài liệu) | Quyết định của anh Tony |
| C2 | Next.js rewrites (multi-zone) cho `LocalBudd` trong `floraos-core` | C1 |
| C3 | Reverse proxy (Nginx/Caddy) cho `SocialFlow` | C1 |
| C4 | Chứng chỉ TLS cho domain cha | C1 |
| C5 | Test end-to-end qua domain thật | C2, C3, C4 |

### Nhóm D — Dọn dẹp và soát cuối (chờ B và C)

| # | Việc | Phụ thuộc |
|---|---|---|
| D1 | Đổi UI thẻ "Mở sang" ở màn Trải nghiệm — khi SSO + proxy xong, điều hướng nội bộ mượt thay vì mở tab mới kèm thông báo "chưa nối" | Nhóm B, C |
| D2 | Cập nhật toàn bộ tài liệu, đánh dấu Unified Shell hoàn tất | D1 |
| D3 | Review bảo mật độc lập trước khi go-live thật — không tự chấm việc của chính mình, đặc biệt phần SSO/xác thực | D1 |
