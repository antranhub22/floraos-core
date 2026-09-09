# floraos-core — ngữ cảnh cho agent

Nền tảng SaaS đa tenant cho cửa hàng hoa. `src/` (Next.js + Prisma/Postgres) → `workers/` (Python, xử lý ảnh) → Postgres dùng chung.

**Đọc trước khi làm bất cứ việc gì:** `docs/kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` (Level 1) và `docs/kien-truc/TRANG_THAI.md` (đang ở đâu).

## Lệnh

| Việc | Lệnh |
|---|---|
| Cài | `docker compose up -d && npm i && npx prisma db push` |
| Chạy web | `npm run dev` |
| Chạy worker | `cd workers && python -m media_ai.worker` |
| Test web | `npm test` |
| Test đầu cuối | `npm run test:e2e` |
| Test worker | `cd workers && python3 -m pytest tests -q` |
| Typecheck | `npx tsc --noEmit` |
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
- Provider AI chỉ gọi qua cổng (`VisionAnalyzer`, `LLMProvider`, …). Không module nào gọi thẳng API nhà cung cấp.

## Thứ tự pha — điều kiện chặn

Lộ trình P0–P12 ở `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục 15.

**Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi P1 (tenant) và P2 (RBAC) đạt nghiệm thu.** Làm ngược sẽ sinh ra lược đồ thiếu `organization_id`, rồi phải migration lại toàn bộ khi đã có dữ liệu thật. Đây là lỗi tốn kém nhất của cả lộ trình.

Trạng thái hiện tại: khung repo, chưa có bảng nào. Hạng mục kế tiếp là P1.

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

Xếp hạng BUILD cho thứ đã tồn tại ở một trong ba repo là lỗi phải chặn ở review.

## Bản đồ

*(Điền dần khi có mã thật.)*

| Vùng | Đường dẫn | Ghi chú |
|---|---|---|
| Ngữ cảnh tenant | `src/core/tenancy/` | bộ gác truy vấn — P1 |
| Năng lực & quyền | `src/core/rbac/` | 76 mã thu hoạch từ `FloraOS/floraos-web/src/lib/maChucNang.ts` — P2 |
| Cổng ra ngoài | `src/core/ports/` | `VisionAnalyzer` · `LLMProvider` · `StorageProvider` · `QueueProvider` · `PublisherProvider` |
| Module | `src/modules/<tên>/` | bốn thư mục mỗi module |
| API | `src/app/api/v1/` | chưa có route |
| Lược đồ | `prisma/schema.prisma` | còn trống; worker đọc bản sinh sẵn, không tự khai bảng |
| Worker phân tích ảnh | `workers/vision/` | M01 — P5 |
| Worker tối ưu ảnh | `workers/media_ai/` | M04a — P9 |
| Test cách ly tenant | `tests/tenant/` | `npm run test:tenant` |
| Tài liệu kiến trúc | `docs/kien-truc/` | 8 tệp, xem `TRANG_THAI.md` |

## Bẫy

*(Mỗi lần một điều bất ngờ làm mất hơn một giờ, thêm một dòng.)*

- Bộ ảnh vàng là điều kiện nghiệm thu P5. Không có nó thì không đổi được provider và không hồi quy được phần thu hoạch. Quy cách ở `docs/kien-truc/BO_ANH_VANG.md`.
- `npm run test:tenant` cố tình thất bại tới khi P1 xong — tệp `tests/tenant/chua-trien-khai.test.ts`. Đừng "sửa" nó bằng cách cho nó xanh; xoá nó khi có bộ test thật.

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
