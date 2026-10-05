# floraos-core — ngữ cảnh cho agent

Nền tảng SaaS đa tenant cho cửa hàng hoa. `src/` (Next.js + Prisma/Postgres) → `workers/` (Python, xử lý ảnh) → Postgres dùng chung.

**Đọc trước khi làm (đọc ĐÚNG MỤC, không đọc cả tệp — ba tệp dưới đây cộng lại hơn 350 KB):** `docs/00-DOCUMENTATION-CONSTITUTION.md` (Hiến pháp tài liệu, 11 KB — đọc mục liên quan) · `docs/kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` (Level 1 — `grep -n "^## "` rồi đọc mục cần, vd §5 đa tenant, §6 phân quyền, §15 lộ trình) · `docs/kien-truc/TRANG_THAI.md` (đang ở đâu — xem khối "Cách đọc tệp này" ở đầu tệp). Tra `docs/00-DOCUMENTATION-REGISTRY.yaml` bằng `grep` để xác định đúng SSOT trước khi sửa đổi tài liệu.

## Lệnh

| Việc | Lệnh |
|---|---|
| Cài | `docker compose up -d && npm i && npx prisma generate && npx prisma db push && npx prisma db seed` |
| Chạy toàn bộ (Web + DB + Workers + SocialFlow M07) | `npm run dev:all` (tự bật Docker DB + Ollama Qwen + Web 3100 + Worker Vision + Worker Media + Worker Video + SocialFlow 8000) |
| Chạy web | `npm run dev` |
| Chạy worker media | `npm run worker:media` |
| Chạy worker video | `npm run worker:video` (hoặc `cd workers && python -m media_ai.video.video_worker`) |
| Test web | `npm test` |
| Test đầu cuối | `npm run test:e2e` — cần worker media đang chạy; máy không có khoá OpenAI: `python tests/e2e/gia-lap-openai.py &` rồi chạy worker với `OPENAI_BASE_URL=http://127.0.0.1:4010/v1 OPENAI_API_KEY=e2e` (nợ #157) |
| Test worker | `cd workers && .venv/bin/python -m pytest tests -q` |
| Typecheck | `npx tsc --noEmit` |
| Dựng CSDL cho test | `npm run db:test:setup` — **chạy một lần** sau `docker compose up -d` |
| Test cách ly tenant | `npm run test:tenant` — *bắt buộc xanh trước mọi merge* |
| Kiểm chuẩn UX Lint | `npm run lint:ux` (hoặc `npm run lint:ux -- --check` theo ratchet) |
| Test UX E2E & Trợ năng | `npm run test:e2e:ux` (kiểm tra phân luồng vai, 404, mốc trợ năng, WCAG 2.2 AA qua axe-core, visual regression) |

## Quy ước

- **Lược đồ `snake_case` tiếng Anh.** Mã nguồn tiếng Anh. Thuật ngữ nghiệp vụ tiếng Việt chỉ nằm ở nhãn giao diện và tài liệu, không vào lược đồ. *(Khác FloraOS cũ — repo ấy dùng PascalCase tiếng Việt.)*
- **Mọi bản ghi thuộc tenant có `organization_id`.** Không ngoại lệ, kể cả bảng tra cứu và demo workspace. Kiểm ở tầng repository, không ở route.
- **`organization_id` giải từ phiên đăng nhập phía máy chủ.** Không bao giờ nhận từ body/query của client.
- `domain/` không được import Prisma. Đó là điều kiện để test luật nghiệp vụ không cần cơ sở dữ liệu.
- Mọi module đủ bốn thư mục `domain/ use-cases/ infra/ adapters/`. Viết `use-cases`, không viết `usecases`.
- Route dưới `/api/v1/`. Endpoint duyệt tách khỏi endpoint sinh kết quả (`/x/[id]/approve`).
- Quyền theo mã năng lực, không theo vai UI. Ba lớp cắt: mặc định → bảng công tắc → **trần cứng cắt sau cùng**.
- **Trải nghiệm theo vai (Role UX, PO 26/09/2026)** — SSOT `docs/dac-ta/03b-role-ux.md` + `src/modules/organization/domain/role-ux-catalog.ts`. 14 vai trải nghiệm; vai quyết định trang chủ, thứ tự điều hướng, ưu tiên thông tin — mã năng lực vẫn quyết định nút nào hiện. Không bao giờ suy quyền từ `roleKey`. Vai `IN_DEVELOPMENT` hiện nhưng vô hiệu, không làm trang chủ. "Admin" trong tài liệu Role UX là `platform_admin` (Console `/van-hanh`), KHÔNG phải vai Điều hành của tiệm. Bất kỳ màn nào sửa theo vai phải qua tiêu chí nghiệm thu 03b §9.
- Đường dẫn lưu trữ: `org/<organization_id>/<product_id>/<asset_id>.<ext>`.
- Job: ba trục `status` / `stage` / `result` tách rời. `COMPLETED + result=REJECTED` **không phải** `FAILED`.
- `usage` ghi ở phía core **tại điểm tạo job**, không ghi ở worker.
- Worker Python lấy việc bằng `SELECT … FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`. **Cấm `subprocess` + parse stdout. Cấm chạy job qua HTTP.**
- Provider AI chỉ gọi qua cổng — mười cổng ở `src/core/ports/`. Không module nào gọi thẳng API nhà cung cấp.
- **Phân luồng NHÀ CUNG CẤP / CỤC BỘ (PO 25/09/2026).** Khi một lượt đã dùng nhà cung cấp thì dùng TOÀN BỘ tính năng của nhà cung cấp cho các bước chất lượng (tách nền, dựng cảnh, chỉnh sáng, tăng nét…) — không trộn xử lý cục bộ thay cho bước nhà cung cấp làm được. Các nhà cung cấp có vai trò tương đương: mỗi bên một adapter theo cùng cổng + bảng năng lực, thứ tự thử cấu hình được, bên lỗi → bên kế tiếp, mọi bên lỗi → lùi luồng cục bộ và GHI RÕ lý do. Luồng cục bộ là cho máy phát triển / dự phòng; phần còn thiếu ghi nợ kỹ thuật (#138). Không nhà cung cấp nào trả phép đo "giữ nguyên sản phẩm" — cổng kiểm vẫn là của FloraOS (ảnh do nhà cung cấp chỉnh sáng dùng phép đo `perceptual`). Mẫu chuẩn: Khu vực D — `workers/media_ai/providers/scene/`, `jobs/variant_nha_cung_cap.py`. Module chưa theo luật này: nợ #139.
- **Mã nghiệp vụ gọi một NĂNG LỰC, không gọi một nhà cung cấp** (D15). Mọi lời gọi AI đi qua cổng AI ở `src/core/ai/`; SDK của nhà cung cấp chỉ được xuất hiện trong `adapters/`. Mô hình là một hàng trong `ai_models`, không phải một hằng trong mã.
- **Mô hình không vào production khi thiếu một trong bốn ô giấy phép** (D18): `license`, `commercial_use`, `territory`, `allowed_use`. Bộ lọc nằm ở `eligibleModels()`, nên mô hình thiếu ô không lộ ra cả trong danh sách để chọn.
- **Sàn quyền riêng tư cắt sau cùng**, cùng tính chất với trần cứng của RBAC: lời gọi `SENSITIVE` không có đường nào ra nhà cung cấp ngoài, kể cả qua bước dự phòng.
- **Tách biệt trường dữ liệu nguyên tử (Atomic Disaggregated Fields) để tối ưu khả năng chỉnh sửa (Editable)**:
  - Tuyệt đối không gộp chung văn bản và số lượng/đơn vị vào cùng một chuỗi tự do (ví dụ: cấm gộp `"Hồng đỏ 10 cành"` thành 1 ô text).
  - Bắt buộc phân rã thành các trường cấu trúc độc lập: tên hoa (text), số lượng (number), đơn vị (text), màu sắc (text), vai trò (select)... để người dùng có thể nhấp chuột sửa trực tiếp từng thông số mà không làm hỏng cấu trúc dữ liệu.
  - Áp dụng nguyên tắc tương tự cho kích thước (`height`/`width` số, `unit` text), báo giá (`price`/`originalPrice` số), và danh sách quà tặng/cam kết (mảng các item độc lập có nút thêm/sửa/xóa từng dòng).
- **Tiêu chuẩn hóa vị trí nút tác vụ chung của các Tab (Standardized Tab Action Header)**:
  - Mọi tác vụ chung của các Tab (Copy, Lưu nháp, Duyệt/Chốt, Chỉnh sửa, Xuất file...) **bắt buộc phải nằm ở vị trí thống nhất: Góc trên cùng bên phải (Top-Right Action Header) của mỗi Tab**. Không đặt mỗi tab một vị trí khác nhau gây mất phương hướng cho người dùng.
  - Cấu trúc thanh công cụ góc trên bên phải gồm 2 khối (tuân thủ K2 & 03a UX-010/UX-011):
    1. **Nút tác vụ chính hiển thị trực tiếp (Primary & Secondary Visible Buttons)**: Tối đa **một** nút chính (`variant: "primary"`) cho hành động quan trọng nhất + tối đa **hai** nút phụ (`variant: "outline"` hoặc `"secondary"`) hiển thị trực tiếp để nhân viên thao tác ngay mà không bị phân tâm.
    2. **Menu tác vụ mở rộng (Action Overflow Menu / `...` More Options)**: Đặt ở góc ngoài cùng bên phải gom toàn bộ các tác vụ còn lại (xuất file PNG, JPEG, PDF A6, xóa, cài đặt phụ). *Tránh dùng Hamburger Menu 3 gạch ngang để giấu toàn bộ tính năng chính* vì sẽ bắt người dùng phải click 2 lần cho các tác vụ thường xuyên.
- **Tiêu chuẩn hóa khối hướng dẫn thao tác của các Tab tính năng (Standardized Feature Guidance Callout)**:
  - Mọi Tab tính năng trong toàn bộ hệ thống (M01a, M01b, M01c, Catalog, Đơn hàng, Hội thoại, Kho dữ liệu, v.v.) khi hiển thị hướng dẫn thao tác ban đầu **bắt buộc phải tuân thủ chuẩn cấu trúc giống như M01a/M01b**:
    1. **Khung viền (Border)**: Nét đứt màu đỏ nổi bật `border-2 border-dashed border-red-300` để phân biệt rõ ràng khối thông tin hướng dẫn cần chú ý đọc với các khối nhập liệu/dữ liệu khác.
    2. **Nền (Background)**: Tông màu đỏ pastel dịu mắt `bg-red-50/70` hoặc `bg-red-50/80` (chống mỏi mắt, tương phản cao đạt chuẩn WCAG AA/AAA).
    3. **Huy hiệu định danh (Guidance Tag/Badge)**: Nằm ở trên cùng, định dạng viên thuốc nhỏ gọn `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold tracking-wider uppercase` kèm icon định danh (`Info`, `Camera`, `Sparkles`, `FileText`...) và nhãn định danh (vd: `HƯỚNG DẪN NHẬN DIỆN M01a`).
    4. **Tiêu đề chính**: Căn giữa, chữ đậm `text-[16px] font-extrabold text-red-950 flex items-center justify-center gap-2` kèm icon minh họa.
    5. **Mô tả nghiệp vụ**: Tối đa 2–3 dòng cô đọng, `text-[13px] leading-relaxed text-red-800/90 max-w-lg mx-auto`.
    6. **Thanh mẹo thao tác nhanh / Tiêu chí cốt lõi (Bottom Tips Bar)**: Đường kẻ đứt nét ngang `border-t border-dashed border-red-200/90` kèm 2–4 mẹo gạch đầu dòng ngắn gọn (`📸/💡/⚡/✨/📝/🎯/📋/💬/🖼️`) với `text-[11.5px] font-medium text-red-700` để nhân viên nắm bắt quy tắc cốt lõi ngay tức thì.
  - **Quy cách giới hạn và mật độ (K1 / PO 26/09/2026)**:
    - **Tối đa một `<FeatureGuidanceCard />` mỗi màn/tab**. Tuyệt đối không đặt nhiều khối hướng dẫn trên cùng một view (tránh lỗi spam 3 khối như trước đây).
    - **Độ dài nội dung**: Mô tả nghiệp vụ ≤ 3 dòng ở khổ 390px; thanh mẹo nhanh ≤ 3 mẹo ngắn gọn.
    - **Màu sắc**: Màu đi qua token ngữ nghĩa `--color-guidance-*` (T4.6); giá trị màu hiển thị giữ nguyên không đổi thị giác.
    - Component tự động ghi nhớ trạng thái đã xem qua `localStorage` (`floraos_guidance_seen_<id>`) và tự thu gọn sau lần xem đầu.
  - **Component chuẩn hóa**: Sử dụng component `<FeatureGuidanceCard />` tại `src/components/templates/shared/feature-guidance-card.tsx` (re-export tại `@/components/ui/feature-guidance-card`). *(Sửa 17/09, P-Fix-5: đường dẫn thật là `templates/shared/`, không phải `templates/guidance/` — thư mục đó không tồn tại; đã rà `src/` để xác nhận trước khi sửa.)*
  - **Kiến trúc & Quy chuẩn hệ thống Template (SSOT)**: Tuân thủ đặc tả kỹ thuật tại `docs/kien-truc/FLORAOS_TEMPLATE_ENGINE_ARCHITECTURE.md` và Sổ tay SSOT toàn diện tại `docs/kien-truc/FLORAOS_TEMPLATE_SYSTEM_SSOT.md` (chuẩn hóa 11 chức năng — bổ sung `platform-connections/` 17/09 — 5 họ template, Core Interpolation Engine, chuẩn biến `{{...}}`).
  - **Quy tắc phê duyệt**: Cấm tự ý thay đổi cấu trúc, màu sắc hay vị trí của khối hướng dẫn này sang dạng khác khi chưa báo cáo và nhận phê duyệt từ Chủ sản phẩm.
  - **Hợp đồng input/output Creative Studio (24/09/2026)**: input/output của 14 chặng là zod ở `src/modules/creative-production/contracts/` (nguồn chuẩn, route nhập trực tiếp). Đổi dữ liệu vào/ra của một chặng ⇒ sửa zod ở đó, `npm run typecheck` (khoá `conformance.ts`), `npm run gen:schemas:creative`, cập nhật IO Spec §0 — cùng một commit. Không sửa tay `docs/dac-ta/schemas/creative-studio/*.json`.
  - **Chống tái lệch tài liệu ↔ code (P-Fix-6, 18/09/2026)**: Bất kỳ pha nào thêm/xoá/đổi tên file trong `src/components/templates/*` đều BẮT BUỘC tự hỏi "SSOT template đã cập nhật?" trước khi coi là xong — cập nhật `FLORAOS_TEMPLATE_SYSTEM_SSOT.md` trong cùng lần commit và chạy `npm run check:template-ssot` xanh (script đối chiếu tự động tên file thật với tài liệu, cổng bắt buộc trong CI — xem `scripts/check-template-ssot.ts`). Quy tắc này ra đời sau khi đợt audit P-Fix-5 (17/09) phát hiện SSOT ghi sai đường dẫn thật của nhiều template suốt một thời gian dài mà không ai biết.
- **Tiêu chuẩn Dẫn chứng Video Kép & Chống Tràn Từ Khóa Thô của Market Intelligence (Evidence & Clean Phrasing Standard)**:
  - **Dẫn chứng Video Kép (Dual Video Evidence)**: Mọi thẻ cơ hội / xu hướng / kịch bản trên giao diện Market Intelligence bắt buộc hiển thị dẫn chứng video thực tế từ 2 nền tảng: **TikTok** và **YouTube**, có nút Play overlay và mở tab mới khi nhấp chuột (`window.open(url, "_blank")`). Quản lý tập trung tại `src/components/market-intelligence/video-evidence-catalog.ts`. **Quy chuẩn hiển thị (K3 / PO 26/09/2026)**: Thẻ danh sách chỉ hiển thị chỉ báo gọn ("2 video dẫn chứng" + 2 biểu tượng nền tảng); cặp thumbnail video đầy đủ (TikTok 9:16 + YouTube 16:9) kèm trình phát mở rộng được render ở lớp chi tiết (drawer/modal).
  - **Cấm tràn từ khóa thô (Strict Anti-Keyword-Dumping)**: Tuyệt đối CẤM render chuỗi từ khóa tìm kiếm nối bằng dấu phẩy (`keyword1, keyword2, keyword3...`) lên tag badge (`<Tag />`), tiêu đề hay câu trích dẫn kịch bản. Mọi dữ liệu phải đi qua bộ lọc làm sạch: `getOpportunityHeadline()` chuẩn hóa tiêu đề sang trọng, `formatCleanHook()` làm sạch kịch bản giật tít tự nhiên, và CSDL `topics` chuẩn hóa không lưu chuỗi từ khóa thô. Đặc tả kiến trúc SSOT: `docs/kien-truc/FLORAOS_MARKET_INTELLIGENCE_ARCHITECTURE.md`.
- **Cấm dùng màu Tailwind gốc trong className (UX Lint R1, PO 29/09/2026)**: Tuyệt đối CẤM viết class kiểu `bg-red-100`, `text-emerald-700`, `border-zinc-200`, `from-rose-600`… trong bất kỳ file `.tsx` nào thuộc `src/app/` hoặc `src/components/`. BẮT BUỘC dùng token ngữ nghĩa đã đăng ký tại `src/app/globals.css` @theme: `bg-primary`, `text-text`, `border-border`, `bg-surface`, `bg-danger-bg`, `text-success`, `bg-warning-bg`, `text-info`… Nếu thiếu token phù hợp → đăng ký token mới vào `globals.css` @theme TRƯỚC rồi mới dùng — KHÔNG hardcode màu. Kiểm bằng `npm run lint:ux -- --check` — cấm tăng vi phạm R1.
- **Cấm cỡ chữ tuỳ ý `text-[Npx]` (UX Lint R2, PO 29/09/2026)**: CẤM viết `text-[11px]`, `text-[10.5px]`, `text-[9px]`… trong className. BẮT BUỘC dùng thang token cỡ chữ chuẩn: 9–11.5px → `text-caption` (11px); 12–12.5px → `text-meta` (12px); 13px → `text-body-sm` (13px); 13.5–14px → `text-body` (13.5px); 14.5–15px → `text-title-sm` (14.5px); 16–18px → `text-title` (17px); 19–20px → `text-display` (20px). Kiểm bằng `npm run lint:ux -- --check` — cấm tăng vi phạm R2.
- **Cấm mã kỹ thuật trên giao diện (UX Lint R8, PO 29/09/2026)**: Không hiển thị `M01a`, `Khu vực D`, `SSOT`, `Chặng 05`, `P2`… trên label/text mà người dùng cửa hàng hoa nhìn thấy. Chỉ dùng trong `data-testid`, `title` cho dev, hoặc comment code. Kiểm bằng `npm run lint:ux -- --check` — cấm tăng vi phạm R8.
- **Cấm `onClick` trên phần tử phi tương tác (UX Lint R5 / WCAG 2.1.1, PO 29/09/2026)**: Không đặt `onClick` lên `<div>`, `<span>`, `<li>`, `<tr>`, `<td>`, `<img>`. Dùng `<button type="button">` thay thế. Nếu bất khả kháng (modal backdrop) thì PHẢI có `role="button"` + `tabIndex={0}` + `onKeyDown`. Kiểm bằng `npm run lint:ux -- --check` — cấm tăng vi phạm R5.
- **Chuẩn UX toàn cục (03a)**: Bất kỳ màn hình mới nào hoặc màn hình bị sửa đổi bố cục/thứ bậc/luồng bắt buộc phải có Screen Contract lưu tại `docs/dac-ta/screen-contracts/` + vượt qua QA Matrix 03a §34 (không có chỉ số FAIL) + `npm run lint:ux -- --check` không tăng vi phạm (từ T2.3).
- **Chuẩn Kiến trúc Trải nghiệm Người dùng Hành trình Trước (Journey-First UX Architecture Standard, PO 30/09/2026)**:
  - **Tài liệu SSOT**: `docs/FLORAOS_CORE_JOURNEY_FIRST_UX_ARCHITECTURE_FINAL.md`, Kế hoạch thực thi `docs/kien-truc/KE_HOACH_THUC_THI_JOURNEY_FIRST_UX_ARCHITECTURE.md` (`PLAN-2026-JOURNEY-UX-01`), và quyết định `D-JUX` trong `docs/dac-ta/03b-role-ux.md`.
  - **Phạm vi áp dụng**: BẮT BUỘC áp dụng cho toàn bộ hệ thống giao diện, dashboard, trang chủ và quy trình tác vụ của FloraOS.
  - **Bảy nguyên tắc cốt lõi (J1–J7)**:
    1. **J1 — Khởi đầu từ Hành trình (Journey-First)**: Trang chủ và luồng điều hướng khởi đầu bằng câu hỏi mục tiêu *"Bạn muốn làm gì?"* thông qua lưới lựa chọn hành trình (`ChoiceGrid` / `ActionCard`), cấm đập vào mắt người dùng một dashboard toàn số liệu/biểu đồ kỹ thuật hoặc danh mục module phức tạp gây quá tải nhận thức.
    2. **J2 — Tiết lộ lũy tiến (Progressive Disclosure)**: Chỉ hiển thị dữ liệu, biểu mẫu nhập liệu và công cụ tương ứng với bước hiện tại của hành trình (`JourneyShell`, `JourneyProgress`). Không phơi bày toàn bộ cấu hình phức tạp cùng lúc.
    3. **J3 — Luôn có hành động tiếp theo (Next Best Actions)**: Mọi màn hình kết quả hoặc trạng thái hoàn thành BẮT BUỘC phải có khối hành động đề xuất tiếp theo (`NextActions`), tuyệt đối không dẫn người dùng vào ngõ cụt (dead end).
    4. **J4 — AI trong tiến trình nghiệp vụ (Contextual AI)**: Trợ lý AI và tính năng tự động hóa phải được tích hợp tự nhiên như một bước trợ giúp tại chỗ trong tiến trình, không cô lập thành các trang/tính năng rời rạc.
    5. **J5 — Trải nghiệm vai tách biệt với quyền (Role UX ≠ Capability)**: Hành trình trải nghiệm theo vai định hướng luồng tác nghiệp và trang chủ tối ưu cho vai trò người dùng, nhưng mọi quyền truy cập, hiển thị nút bấm và phê duyệt vẫn do RBAC và Capability Code (trần cứng) kiểm soát.
    6. **J6 — Chuỗi Chuẩn Tác Vụ & Hợp Đồng Journey Contract (Action Contract)**:
       - Chuỗi tác vụ chuẩn hóa (bắt buộc tuân thủ):
         ```text
         USER GOAL → JOURNEY → EXECUTION MODE → RAW INPUT → CAPABILITY CHAIN
         → EXECUTION → RESULT → REVIEW/EDIT → PUBLISH/APPLY → NEXT ACTION
         ```
       - Agent MUST NOT bắt đầu code từ màn hình, component hay API khi **Journey Contract** chưa xác định. Mẫu chuẩn:
         ```yaml
         journey_contract:
           id:                      # Định danh duy nhất của Journey
           user_goal:               # Một mục tiêu nghiệp vụ cụ thể của người dùng, không phải tên module
           modes_supported: [guided, autonomous] # Nếu chỉ hỗ trợ một mode, phải ghi rõ lý do kiến trúc
           raw_inputs: []           # Ảnh/video/văn bản/URL/tệp/sản phẩm (coi là dữ liệu KHÔNG TIN CẬY)
           capability_allowlist: [] # Orchestrator CHỈ ĐƯỢC chọn trong danh sách capability này
           decisions:               # Quyền quyết định tham chiếu Decision Registry
             - {id, owner: USER|SHARED|SYSTEM, checkpoint, required_role}
           limits: {max_steps, max_cost, timeout}
           result: {editable, publishable, provenance, next_actions}
           recovery: {retry_policy, partial_policy, cancel_policy}
           rbac: {start, decide, publish}
           tests: [happy, failure, waiting, resume, permission_change]
         ```
       - Bọc và đồng bộ bởi component `ActionContractWrapper`.
    7. **J7 — Nguyên tắc "WRAP, không REPLACE" & Chế độ Chuyên gia (Expert Mode)**: Bọc các dashboard/workspace hiện có thành các đích đến hoặc chặng chuyên sâu trong Journey (ví dụ: hành trình "Xem báo cáo & tình hình cửa hàng"), không tự ý xóa bỏ; hỗ trợ công tắc Chế độ chuyên gia (lưu `localStorage`) cho phép người dùng chuyển đổi trực tiếp sang giao diện truyền thống.
  - **Hạ tầng chuẩn hóa**: Phân hệ lõi `src/modules/journey/` (Clean Architecture 4 tầng `domain/`, `use-cases/`, `infra/`, `adapters/`) và Bộ UI Kit dùng chung `src/components/journey/` (`ChoiceGrid`, `ActionCard`, `JourneyShell`, `JourneyProgress`, `ExecutionModeSelector`, `RawInputCollector`, `WorkflowPreview`, `ProcessingProgress`, `ResultWorkspace`, `ReviewEditor`, `PublishPanel`, `NextActions`, `ActionContractWrapper`).
- **Quy chuẩn Cặp Chế Độ Kép Khởi Đầu (Dual-Mode Entry Standard: Autonomous vs Guided, PO 01/10/2026)**:
  - **Phạm vi áp dụng**: BẮT BUỘC áp dụng cho mọi chức năng tạo mới, soạn thảo nội dung, thiết lập chiến dịch, nhập liệu hoặc xử lý tác vụ trong toàn bộ hệ thống FloraOS khi kết hợp với Journey-First UX.
  - **Hai chế độ chuẩn hóa & Nhãn UI**:
    | Mode | Nhãn UI | Ý nghĩa & Luồng thao tác |
    |---|---|---|
    | **AUTONOMOUS** | ⚡ **AI làm cho tôi** | User đưa raw input (ảnh/video/text) → AI tự lập plan, chạy background qua chuỗi capability, trả Result Workspace |
    | **GUIDED** | 🛠️ **Tôi muốn tự chọn từng bước** | User đưa raw input → tự lựa chọn thông số & cấu hình từng bước (3–5 bước tuần tự qua `StepIndicator`) |
  - **Quy tắc hiển thị và tương tác**:
    - Chọn mode **ở đầu Journey, trước khi nhập liệu chi tiết** (trừ raw input tối thiểu để kích hoạt Journey).
    - Câu hỏi UI chuẩn: *"Bạn muốn FloraOS thực hiện như thế nào?"*
    - **CẤM** dùng từ ngữ kỹ thuật `"manual"`, `"automatic"` làm nhãn hiển thị cho người dùng.
    - **Bảo toàn dữ liệu khi chuyển mode**: Khi người dùng chuyển đổi giữa 2 mode giữa chừng, **TUYỆT ĐỐI KHÔNG** làm mất input, output, bản sửa đổi của người dùng (`USER_EDITED`), hoặc bắt chạy lại các bước đã hoàn thành.
  - **Xử lý nguyên liệu đầu vào tại `SmartInputDropzone`**:
    - *Hình ảnh*: Phân tích thị giác (Vision AI) bóc tách loài hoa, màu sắc, phong cách, đọc thiệp mừng OCR; nâng cấp/tách nền/cân bằng sáng theo chuỗi Cloud Provider ➔ lùi Local Engine nếu lỗi; bắt buộc qua cổng kiểm định toàn vẹn sản phẩm (*Subject Integrity*).
    - *Video*: Giữ nguyên độ mượt gốc, không nén chỉnh sửa phức tạp, nhúng trực tiếp vào khu vực video của trang/mục tiêu.
    - *Văn bản (Text/Directives)*: Đưa trực tiếp vào Content Engine làm chỉ đạo ngữ cảnh (Context Prompt) để sinh tiêu đề, câu chuyện thương hiệu, đặc quyền, giá bán.
  - **Cơ chế Pre-fill Wizard (Human-in-the-loop)**: AI KHÔNG hoạt động như một "hộp đen" đóng kín. Sau khi phân tích, AI tự động điền sẵn (pre-fill) toàn bộ các thông số tối ưu vào chính Wizard từng bước kèm huy hiệu `✨ AI đã tối ưu lựa chọn cho bạn`. Người dùng có toàn quyền kiểm tra, điều chỉnh bất kỳ bước nào trước khi xuất bản.
- **Quyền Quyết Định (Decision Ownership) & Vùng Cấm Của AI**:
  - **Ba tầng sở hữu quyết định**:
    | Owner | Hành vi hệ thống |
    |---|---|
    | **USER** | Cần hành động chủ động của user. Chế độ Autonomous **BẮT BUỘC DỪNG** tại checkpoint (`WAITING_FOR_USER`) |
    | **SHARED** | Hệ thống đề xuất giá trị tối ưu, user có toàn quyền chỉnh sửa trực tiếp |
    | **SYSTEM** | Hệ thống tự động xử lý, hiển thị kết quả và lý do minh bạch |
  - **Vùng cấm của AI (AI MUST NOT)**:
    - AI **TUYỆT ĐỐI KHÔNG** tự ý: xuất bản (publish) · duyệt công khai · xác minh sự thật (fact) · cấp quyền truy cập · chấp nhận hậu quả pháp lý/tài chính · tự ghi đè nội dung người dùng đã chỉnh sửa.
    - *Nguyên tắc cốt lõi*: AI hoàn thành output **KHÔNG** đồng nghĩa với việc output đã được xuất bản (Publish).
- **Quy Chuẩn Vận Hành Autonomous Execution (State Machine & Background Worker)**:
  - **Máy trạng thái 3 tầng tách bạch**:
    ```text
    JourneyRun    : DRAFT → QUEUED → PROCESSING ⇄ WAITING_FOR_USER
                    PROCESSING → RETRYING → PROCESSING
                    terminal: COMPLETED | PARTIAL | FAILED | CANCELLED
    ExecutionStep : PENDING → RUNNING → SUCCEEDED | FAILED | SKIPPED | WAITING
    Output        : GENERATED → IN_REVIEW → USER_EDITED → USER_APPROVED → PUBLISHED
    ```
    *(Lưu ý: `RESUMED` và `RESULT_READY` là event/notification, KHÔNG phải trạng thái state).*
  - **Yêu cầu lưu trữ & xử lý nền (Persistence & Background Execution)**:
    - Bắt buộc persist `JourneyRun`, `ExecutionPlan`, `ExecutionStep` phía server trong Postgres. **Trình duyệt (Browser) không bao giờ là nơi lưu trạng thái duy nhất.**
    - Workflow dài (>10 giây), nhiều lời gọi AI, xử lý media/video, hoặc cần retry → **BẮT BUỘC** chạy worker/job ngầm qua Postgres queue. Cấm giữ một HTTP request dài chờ đợi hoặc xoay `isLoading` vô hạn.
    - Retry policy: Bắt buộc có `max_attempts`, phân rã lỗi `retryable` vs `non-retryable`, áp dụng exponential backoff, và thao tác retry **bắt buộc mang tính lũy đẳng (idempotent)**.
  - **Xử lý trạng thái `WAITING_FOR_USER`**:
    ```text
    PROCESSING → WAITING_FOR_USER → USER DECISION → RESUME → PROCESSING
    ```
    - Tuyệt đối không đánh dấu Fail Journey chỉ vì đang chờ phản hồi của người dùng. Bảo toàn 100% execution context để resume chính xác.
    - UI phải giải thích rõ ràng: vì sao cần người dùng quyết định, lựa chọn là gì, và tiếp tục từ đúng bước đó.
  - **Xử lý thất bại từng phần (Partial Failure)**: Phân định rành mạch giữa `COMPLETED` / `PARTIAL` / `FAILED`. Người dùng phải nắm rõ phần nào đã xong, phần nào bị lỗi, và nút thử lại (retry) riêng cho phần lỗi.
- **Tiêu Chuẩn Result Workspace & Bảo Vệ Chỉnh Sửa (User Edit Protection)**:
  - Mọi Autonomous Journey **BẮT BUỘC** kết thúc bằng Result Workspace đầy đủ:
    `Status · Preview · Output · Summary · Provenance · Warnings/Errors · Sửa (Edit) · Sinh lại (Regenerate) · Xuất bản (Publish/Apply) · Next Best Actions.`
  - Tuyệt đối không kết thúc cộc lốc bằng câu thông báo "Đã xong".
  - **User Edit Protection (Bảo vệ bản sửa của người dùng)**: Khi người dùng đã can thiệp chỉnh sửa (`USER_EDITED`), hành động *Tạo lại / Sinh lại (Regenerate)* **TUYỆT ĐỐI KHÔNG ĐƯỢC** âm thầm ghi đè nội dung người dùng đã sửa. Bắt buộc tạo phiên bản mới hoặc hiển thị hộp thoại xác nhận.
  - Khối **Next Best Actions (J3)** chỉ hiển thị những hành động phù hợp ngữ cảnh, người dùng có đủ quyền (Capability) và các điều kiện tiên quyết đã hoàn tất.
- **Bảo Mật Trong Vận Hành Autonomous Orchestration**:
  - **Kiểm tra quyền 2 lớp (Re-check on Resume & Publish)**: Quyền (RBAC / Entitlement / Capability) phải được kiểm tra lại ở phía máy chủ **cả lúc bắt đầu, lúc resume sau trạng thái chờ, và lúc bấm xuất bản (publish)** (phòng trường hợp vai trò hoặc quyền bị thu hồi trong lúc chờ).
  - **Zero-Trust Raw Input (Chống Prompt Injection)**: Mọi dữ liệu thô (URL, tệp đính kèm, văn bản chỉ đạo, metadata ảnh) từ người dùng là dữ liệu KHÔNG TIN CẬY. Không bao giờ đưa trực tiếp nội dung người dùng vào prompt như một chỉ thị hệ thống.
  - **Capability Allowlist**: Orchestrator AI chỉ được phép lập kế hoạch và kích hoạt các năng lực nằm trong `capability_allowlist` được khai báo trong Journey Contract.
  - **Audit Logging chuẩn hóa**: Ghi nhận đầy đủ audit log cho các sự kiện: `journey_started`, `mode_selected`, `plan_created`, `step_started`, `step_completed`, `step_failed`, `waiting_for_user`, `user_decision`, `resumed`, `retried`, `cancelled`, `regenerated`, `user_edited`, `permission_denied`, `published`. Không ghi PII vào tên sự kiện.
- **Quy Trình Triển Khai Journey & Definition of Done (DoD)**:
  - **Quy tắc ưu tiên tái sử dụng**: `REUSE → EXTEND → COMPOSE → CREATE`. Ưu tiên sử dụng **Journey Wrapper** bọc các workspace/capability hiện có đang hoạt động tốt; không viết lại module cũ từ đầu chỉ để gắn Journey-First.
  - **Trình tự 8 bước thực thi**:
    1. Soát xét hệ thống & capability hiện có (`REUSE / EXTEND`).
    2. Xác định User Goal, Journey Scope, và Output mong đợi.
    3. Xác định Execution Mode, Raw Input hợp lệ, Capability Allowlist, Dependency.
    4. Định nghĩa State Machine, Orchestrator Plan, Background Job.
    5. Thiết kế Result Workspace, Review/Edit, Publish Gate, Next Actions.
    6. Kiểm tra RBAC / Entitlement / Decision Registry.
    7. Tái sử dụng / Mở rộng / Hợp nhất / Viết mới (`REUSE / EXTEND / COMPOSE / CREATE`).
    8. Thực thi mã & Kiểm thử tự động khép kín.
    *(Lưu ý: Bước 1–6 BẮT BUỘC phải làm rõ trước khi viết bất kỳ dòng mã UI nào).*
  - **Checklist Definition of Done (DoD) cho Journey**:
    - [ ] Hợp đồng Journey Contract đầy đủ các trường bắt buộc.
    - [ ] Execution Mode rõ ràng; khối lựa chọn mode đặt ở đầu Journey.
    - [ ] State Machine 3 tầng lưu trữ persistent phía server; background worker cho tác vụ >10s.
    - [ ] Cơ chế `WAITING_FOR_USER` bảo toàn trọn vẹn context khi có quyết định của người dùng.
    - [ ] Retry policy có giới hạn, hỗ trợ resume, partial failure, cancel.
    - [ ] Result Workspace đầy đủ: provenance, Review/Edit, Publish gate, Next Best Actions.
    - [ ] Nội dung người dùng sửa (`USER_EDITED`) được bảo vệ 100%, không bị ghi đè.
    - [ ] Kiểm tra quyền RBAC phía server tại điểm bắt đầu, điểm resume và điểm publish.
    - [ ] Sử dụng shared component (`src/components/journey/`), đạt chuẩn WCAG 2.2 AA, responsive.
    - [ ] Ghi nhận đầy đủ chuỗi Audit Events chuẩn hóa.
    - [ ] Bộ test tự động xanh: Happy path, failure, waiting, resume, permission change, và tenant isolation.
- **Quy tắc Hành trình Sản phẩm ra Thị trường từ Ảnh Tải lên (FloraOS Product-to-Market User Journey Standard)**:
  - **Tài liệu SSOT quy trình**: `docs/dac-ta/FLORAOS_PRODUCT_TO_MARKET_USER_JOURNEY.md` (chuẩn hóa 14 chặng khép kín: `01. BRING` 📸 Tải ảnh → `02. UNDERSTAND` 🔎 Nhận diện cấu trúc & định tính thương mại → `03. DISCOVER` 🔥 Nghiên cứu xu hướng & cơ hội thị trường → `04. IDEATE` 💡 Sinh chủ đề / góc tiếp cận / hooks / stories → `05. CHOOSE` 🎯 Chủ shop chọn định hướng tiếp cận → `06. CREATE` ✍️ Nội dung / 🖼️ Ảnh biến thể / 🎬 Video / 🎙️ Voiceover & nhạc → `07. PACKAGE` 📦 Đóng gói trọn bộ chiến dịch Campaign Package → `08. QA` 🤖 Kiểm tra chất lượng Thương hiệu / Sản phẩm / Nội dung / Kênh → `09. APPROVE` 👤 Chủ shop chốt duyệt / hiệu chỉnh / yêu cầu AI nâng cấp → `10. LAUNCH` 🚀 Đăng tải / Lên lịch đa kênh → `11. SELL` 💬 AI Chat Sales tư vấn chốt đơn → `12. MEASURE` 📊 Đo lường hiệu quả kinh doanh & doanh thu → `13. LEARN` 🧠 Trích xuất mẫu thành công Winning Patterns → `14. NEXT BEST ACTION` 🎯 Đề xuất hành động tối ưu tiếp theo).
  - **Nguyên tắc không chạy mù quáng toàn bộ 14 bước**: Không phải bất kỳ lúc nào người dùng tải ảnh lên cũng chạy hết cả 14 bước trong Journey. Phạm vi các bước kích hoạt phụ thuộc hoàn toàn vào ngữ cảnh và mục tiêu cụ thể của từng tính năng nghiệp vụ (ví dụ: tạo sản phẩm catalog đơn thuần chỉ cần Chặng 01–02; studio sáng tạo ảnh chỉ cần 01–02–06; chiến dịch tiếp thị tổng lực mới kích hoạt chuỗi dài).
  - **BẮT BUỘC HỎI & CHỐT VỚI CHỦ SẢN PHẨM TRƯỚC KHI THỰC HIỆN (Mandatory User Consultation Rule)**:
    - Mọi khi bắt đầu thực hiện, thiết kế, hoặc can thiệp vào bất kỳ chức năng nào có hành vi **người dùng tải ảnh lên (user upload ảnh)**, Agent **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý SUY ĐOÁN** hoặc âm thầm nối toàn bộ/bỏ bớt các bước.
    - Agent **BẮT BUỘC PHẢI DỪNG LẠI HỎI TRỰC TIẾP CHỦ SẢN PHẨM (USER)** để chốt danh sách cụ thể các chặng và tác nghiệp cần thực thi trong Journey 14 bước này trước khi viết hoặc sửa bất kỳ dòng code nào.

## Thứ tự pha — điều kiện chặn

Lộ trình P0–P12 ở `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục 15.

**Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi P1 (tenant) và P2 (RBAC) đạt nghiệm thu.** Làm ngược sẽ sinh ra lược đồ thiếu `organization_id`, rồi phải migration lại toàn bộ khi đã có dữ liệu thật. Đây là lỗi tốn kém nhất của cả lộ trình.

Lộ trình có thêm hai tuyến kể từ 09/11: **Tuyến B** (P13–P23, bộ tính năng hoàn
chỉnh cho cửa hàng hoa; bảy pha đầu là MVP) và **Tuyến C** (AI-1…AI-4, nền AI —
cắt ngang mọi pha). Bảng đầy đủ ở `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục
15; đặc tả nền AI ở `docs/dac-ta/10-ai-orchestration.md`.

Trạng thái hiện tại và lịch sử các pha: **không ghi ở đây** — xem `docs/kien-truc/TRANG_THAI.md` (mục 1 "Đang ở đâu", mục 8 "Nhật ký"; lịch sử chuyển từ tệp này nằm ở mục 9). Tra bằng `grep`, đừng đọc cả tệp.

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
12. Nếu hạng mục có giao diện: vai trải nghiệm nào (03b), việc chính và câu hỏi chính của màn là gì, đã có Screen Contract chưa?

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
| Trải nghiệm theo vai (Role UX) | `src/modules/organization/domain/role-ux-catalog.ts` | 14 vai (4 `AVAILABLE`), `resolveRoleUx`/`orderByRolePriority` thuần; trang chủ `src/app/(app)/page.tsx`, khuôn `src/components/dashboard/{store-manager-dashboard,sales-workspace}.tsx`, danh mục `/vai-tro`. Đặc tả 03b |
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
| Kiểm soát chất lượng giao diện (UX Lint) | `scripts/ux-lint.ts` + `scripts/ux-lint/` | AST Linter tự động kiểm soát R1–R11 theo 03a UX Constitution, baseline ratchet lưu tại `scripts/ux-lint-baseline.json`, allowlist tại `scripts/ux-lint-allow.json` |
| Module nạp AVI GIFT (P8) | `src/modules/avi-gift-import/` | `domain/catalog-mapping.ts` thuần (`mapCatalogRowToProduct`/`deriveProductStatus`/`validateCatalogRow`) · `use-cases/bootstrap-avi-gift-organization.ts` (tổ chức `SINGLE`, KHÔNG tái dùng `signUp` vì đó cố định `EXPERIENCE`+trial) · `use-cases/import-catalog.ts` (idempotent theo `code`, gọi thẳng `ProductRepository`). Nguồn Excel đọc bằng Python NGOÀI `src/` — xem `scripts/nap-avi-gift/doc-excel.py` |
| Điều phối đơn hàng (Chức năng 12) | `src/modules/coordinator/` | `domain/stage-transitions.ts` (luồng bước + bằng chứng, `axesAfterTransition` giữ trục khi EXCEPTION/CANCELLED) · `domain/operation-rules.ts` (phân công/sản xuất/QC/giao F12/sự cố/đóng/huỷ, `evaluateRisk` tính lúc đọc) · `adapters/http-schemas.ts` (zod mọi route) · `use-cases/operations.ts` + `manage-exceptions.ts` + `manage-partners.ts` (một giao dịch: dữ liệu + `order_events` + `audit_logs`) · `contracts/` (7 bước = đúng zod route, `order-view.ts`). Route `/api/v1/coordinator/*` (`R1`–`R6`), UI `/dieu-phoi` chỉ qua `src/components/coordinator/coordinator-api.ts`. Test: `tests/tenant/coordinator.test.ts` |
| An toàn nội dung & Từ điển từ cấm | `docs/kien-truc/TU_DIEN_TU_CAM_CONTENT_NGANH_HOA.md` + `src/core/ai/domain/flower-content-banned-lexicon.json` | SSOT kiểm soát chất lượng nội dung ngành hoa; `FlowerContentGuard` (`flower-content-guard.ts`) áp dụng toàn hệ thống (chặn HARD_BLOCK, cảnh báo WARNING, tích hợp `brand_profiles.forbidden_styles`) |
| Module Catalog & Website (M06/M05) | `src/modules/catalog-links/` + `src/components/catalog/` | E-Catalog trực tuyến (`/catalog` & `/c/[slug]`), `qr-engine.ts` (mã QR SVG/PNG 500px), Storefront công khai `GET /api/v1/public/catalog/[slug]` (ký HMAC ảnh + logo), Modal chi tiết sản phẩm chuẩn Mobile, Chia sẻ mạng xã hội (`share-catalog-modal.tsx`), Họ Template Landing Page (`landing-templates/`: Hero, Products, Lead) 4 Archetypes kèm đồng hồ đếm ngược FOMO và CTA đặt Zalo, Cầu nối M07 AI Content Engine (`/noi-dung?catalog_slug=...`) tự động chèn liên kết đặt hoa trực tuyến |
| Module Video Studio (M04c) | `src/modules/video-studio/` + `workers/media_ai/video/` + `src/components/video-studio/` | AI Video Studio (P17, `/video`). 6 khuôn (Reel, TikTok, Story, Slideshow, Product, Ad), kịch bản linh hoạt 2–15 cảnh, tự động cân bằng thời lượng, Camera Motion Ken Burns (Zoom In/Out, Pan Up/Right, Static), phụ đề đa phong cách (Modern Badge, Minimal, Highlight Box, Bottom Banner), lồng tiếng TTS ducking nhạc nền, 2 cổng duyệt (Script & Video Output), kiến trúc Provider cắm rút: Phương án A Local Cinematic FFmpeg (0 credit, ~0.45s/cảnh) + Phương án B Standby AI Generative (Google Veo & HeyGen) |
| Module Đơn Hàng & Vận Hành (M10) | `src/modules/orders/` + `src/components/orders/` | P22, `/don-hang`. Kanban 4 cột, Event Sourcing, đo lường SLA 180 phút, bóc tách lát cắt Thợ cắm hoa xưởng (giấu 100% giá), phiếu giao hàng & thiệp A6. 4 bảng CSDL (`orders`, `order_items`, `order_assignments`, `order_events`), 8 mã năng lực `R1`–`R8` |
| Module CRM & Khách Hàng (M09) | `src/modules/crm/` + `src/components/crm/` | P21, `/khach-hang`. Customer Master Index SSOT, phân tầng RFM tự động (VIP/Gold/Silver/Bronze/New), quét ngày kỷ niệm trước 14 ngày, Consent Engine quyền riêng tư. 4 bảng CSDL (`customers`, `customer_occasions`, `customer_consents`, `vouchers`), 8 mã năng lực `Q1`–`Q8` |
| Module AI Chat Assistant & Đa Kênh (M08) | `src/modules/chat-assistant/` + `src/components/chat/` | P23, `/hoi-thoai` & `/hoi-thoai/kenh-tich-hop`. Dual-Intent Router (SaaS Help vs Flower Sales), Trợ lý nổi `<FloraOSGlobalCopilot />` (`Cmd+K`), 5 kênh tiếp xúc Omnichannel (E-Catalog, Landing Page, Messenger Webhook, Zalo OA Webhook, Script nhúng website ngoài), cơ chế định giá & thu phí credit nền tảng qua `usage`, chốt chặn Aegis Protection. 3 bảng CSDL (`chat_conversations`, `chat_messages`, `chat_channel_integrations`), 4 mã năng lực `T1`–`T4`. Đặc tả: `docs/kien-truc/FLORAOS_AI_CHAT_ASSISTANT_OMNICHANNEL_ARCHITECTURE.md` |
| Nhà cung cấp Creative Studio (PO 25/09) | `src/modules/creative-production/domain/provider-catalog.ts` + `use-cases/provider-preferences.ts` + `src/core/ai/adapters/{multi-llm,anthropic-llm,gemini-llm}-provider.ts` | Danh mục nhà cung cấp theo loại (`content`/`image_optimize`/`image_variant`/`video`/`voice`/`music`), thứ tự ưu tiên của tiệm ở `organizations.settings.creative_providers` (`GET·PUT /creative-production/providers`, `I1`/`U2`), bên chọn cho từng lượt. Nội dung: cổng AI nhận `preferredModelKeys` (routing.ts) — Claude/OpenAI/Gemini, lùi khuôn tất định. Khoá phải khớp worker (xem đầu tệp catalog) |
| Content Engine (P27) | `src/modules/content-engine/` | Chuỗi Strategist→Writer→Critic→Rewriter chạy tại chỗ (`use-cases/generate-content.ts`, `I1`, feature `content.generate`) · luật thuần `domain/{pipeline-rules,approval-rules,deterministic-checks,rubric}.ts` · adapter cổng AI `adapters/content-engine-ai-adapter.ts` (mỗi lượt gọi có `timeoutMs`) · bảng `content_generations` (`DRAFT→APPROVED→SCHEDULED`). Route `/api/v1/content-engine/generations` (POST/GET) · `…/[id]` · `…/[id]/approve` (`J5`, audit). Chặng 05 gọi tiếp sau kịch bản (`generate-scene-plan.ts`) |
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
- `next dev` (Next 16) TỰ CHÈN khối `<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
