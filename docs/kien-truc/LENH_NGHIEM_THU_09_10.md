# Lệnh nghiệm thu — đợt đồng bộ ba repo (2026-09-10)

Chạy trên Terminal Mac thật. Thứ tự có phụ thuộc: Bước 1 mở khoá Bước 3.

Ba cổng đã chốt: **floraos-core 3100 · LocalBudd 3000 · SocialFlow 8000**.

---

## Bước 0 — Postgres cho floraos-core

```bash
cd ~/Projects/floraos-core
docker compose up -d
docker compose ps          # chờ tới khi healthy
```

---

## Bước 1 — LocalBudd: Prisma (đây là thứ đang chặn 20 lỗi TypeScript)

```bash
cd ~/Projects/LocalBudd
npm install
npx prisma generate
```

`generate` xong là 20 lỗi TypeScript biến mất. Tiếp theo mới tới việc đẩy lược
đồ lên Supabase.

### 1b. XEM TRƯỚC SQL sẽ chạy trên Supabase (đừng bỏ bước này)

`DATABASE_URL` của LocalBudd trỏ thẳng vào Supabase thật, không phải DB cục bộ.
Xem SQL trước khi đụng vào nó:

```bash
cd ~/Projects/LocalBudd
set -a && source .env && set +a
npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

Kết quả mong đợi: chỉ có `ALTER TABLE ... ADD COLUMN` cho `sessions.organization_id`,
`projects.organization_id`, `products.core_product_id`, cộng một `CREATE UNIQUE INDEX`
trên `(project_id, core_product_id)`. Tất cả đều nullable nên không mất dữ liệu.

**Nếu thấy bất kỳ `DROP` nào — dừng lại, báo tôi.**

### 1c. Đẩy lược đồ

```bash
npx prisma db push
```

### 1d. Dựng migration nền (repo chưa có thư mục `migrations/`)

```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init
npx prisma migrate status      # phải báo "Database schema is up to date"
```

---

## Bước 2 — floraos-core: nghiệm thu

```bash
cd ~/Projects/floraos-core
npm install
npx prisma generate
npx prisma db push
npm run db:seed

npx tsc --noEmit          # kỳ vọng: sạch
npx eslint src tests      # kỳ vọng: 0 lỗi (1 cảnh báo font, có từ trước)
npm test                  # kỳ vọng: 175/175
npm run test:tenant       # kỳ vọng: XANH — gồm 7 ca mới integration-sso.test.ts
npm run build             # kỳ vọng: build sạch
cd workers && python3 -m pytest tests -q && cd ..
```

`npm run test:tenant` là cổng bắt buộc trước mọi merge (`AGENTS.md`). Bảy ca
mới nằm ở `tests/tenant/integration-sso.test.ts` — chúng khoá đúng lỗi rò dữ
liệu chéo tổ chức, chưa từng chạy trên DB thật.

---

## Bước 3 — LocalBudd: nghiệm thu (sau Bước 1)

```bash
cd ~/Projects/LocalBudd
npm run typecheck    # kỳ vọng: 0 lỗi (trước generate là 20)
npm test             # kỳ vọng: 14/14
npx eslint .         # kỳ vọng: 166 vấn đề — có từ trước, baseline là 167
npm run build
```

---

## Bước 4 — Chạy ba app cùng lúc (ba cửa sổ Terminal)

```bash
# Cửa sổ 1
cd ~/Projects/floraos-core && npm run dev        # http://localhost:3100

# Cửa sổ 2
cd ~/Projects/LocalBudd && npm run dev           # http://localhost:3000

# Cửa sổ 3
cd ~/Projects/SocialFlow && ./start.sh           # http://localhost:8000
```

---

## Bước 5 — Kiểm luồng SSO thật bằng curl

Đây là thứ chưa từng chạy: đăng nhập một lần ở core, LocalBudd đọc được danh
mục của ĐÚNG tổ chức đó.

```bash
# 5a. Đăng nhập vào core, giữ cookie
curl -si -X POST http://localhost:3100/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"<email cua anh>","password":"<mat khau>"}' \
  -c /tmp/floraos-cookies.txt | head -20
```

Kỳ vọng: thấy **hai** `Set-Cookie` — `floraos_session` và `floraos_sso`.

```bash
# 5b. Lấy JWT SSO ra biến
SSO=$(awk '$6=="floraos_sso"{print $7}' /tmp/floraos-cookies.txt)
echo "${SSO:0:40}..."      # phải in ra một chuỗi JWT, không rỗng

# 5c. Gọi thẳng Integration API bằng danh tính người dùng (đường MỚI)
curl -s http://localhost:3100/api/v1/integration/products \
  -H "X-FloraOS-SSO: $SSO" | head -c 500; echo

# 5d. Hồ sơ thương hiệu và hồ sơ kinh doanh
curl -s http://localhost:3100/api/v1/integration/brand-profile    -H "X-FloraOS-SSO: $SSO"; echo
curl -s http://localhost:3100/api/v1/integration/business-profile -H "X-FloraOS-SSO: $SSO"; echo

# 5e. Master Image — kỳ vọng có trường "url" tuyệt đối, không chỉ storage_key
PID=$(curl -s "http://localhost:3100/api/v1/integration/products?limit=1" \
  -H "X-FloraOS-SSO: $SSO" | sed -E 's/.*"id":"([^"]+)".*/\1/')
curl -s "http://localhost:3100/api/v1/integration/products/$PID/master-image" \
  -H "X-FloraOS-SSO: $SSO"; echo
```

`master-image` trả 404 là **đúng** nếu sản phẩm đó chưa có ảnh nào
`approval_state = APPROVED` — không phải lỗi.

```bash
# 5f. JWT giả phải bị từ chối — kỳ vọng 401
curl -s -o /dev/null -w '%{http_code}\n' \
  http://localhost:3100/api/v1/integration/products \
  -H "X-FloraOS-SSO: ${SSO}x"

# 5g. Không có chứng thư nào — kỳ vọng 401
curl -s -o /dev/null -w '%{http_code}\n' \
  http://localhost:3100/api/v1/integration/products
```

### 5h. Qua LocalBudd (dùng chung cookie jar — cookie là host-only "localhost", không phân biệt cổng)

```bash
curl -s http://localhost:3000/api/v1/core-products \
  -b /tmp/floraos-cookies.txt | head -c 500; echo
```

Kỳ vọng: cùng danh mục như 5c. Nếu trả `SSO_REQUIRED` nghĩa là cookie
`floraos_sso` không tới được LocalBudd — kiểm lại 5a.

### 5i. Hạn mức chặn thật

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST http://localhost:3000/api/v1/generate/landing \
  -H 'content-type: application/json' \
  -b /tmp/floraos-cookies.txt \
  -d '{"project_id":"<uuid project cua anh>"}'
```

Ba mã lỗi có ý nghĩa khác nhau, đọc đúng thì biết hỏng ở đâu:

| Mã | Nghĩa |
|---|---|
| 200 | core cho phép, job cục bộ đã tạo |
| 403 | người này không có năng lực `J3` (`landing.create`) |
| 422 | tổ chức hết credit — core chặn, job KHÔNG được tạo |
| 503 | không hỏi được core (chưa chạy 3100, hoặc phiên không có `floraos_sso`) |

Dọn cookie khi xong:

```bash
rm -f /tmp/floraos-cookies.txt
```

---

## Bước 6 — Đẩy lên GitHub

Ba repo đã commit và gắn cùng tag `unified-shell-b2e`, chưa push.

```bash
cd ~/Projects/floraos-core && git push origin soat-p1-p8-va-sua && git push origin unified-shell-b2e
cd ~/Projects/LocalBudd   && git push -u origin feature/unified-shell-b2e && git push origin unified-shell-b2e
cd ~/Projects/SocialFlow  && git push origin feat/media-hub && git push origin unified-shell-b2e
```

LocalBudd đang ở nhánh mới `feature/unified-shell-b2e`; `main` giữ nguyên trạng
thái cũ, đúng quy tắc "không commit thẳng vào main".

---

## Nếu hỏng

| Triệu chứng | Nguyên nhân gần như chắc chắn |
|---|---|
| `npx prisma generate` báo 403 `binaries.prisma.sh` | Mạng chặn host đó. Đây chính là lý do tôi không chạy được — thử mạng khác hoặc mở host trên proxy |
| `npm run test:tenant` báo `ECONNREFUSED :5432` | Bước 0 chưa chạy, hoặc container chưa `healthy` |
| LocalBudd `npm run dev` báo cổng bận | Core đang chiếm 3000 — core phải chạy 3100, kiểm lại `package.json` của core |
| 5b in ra chuỗi rỗng | Login thất bại, hoặc `SSO_SESSION_SECRET` chưa có trong `.env` của core |
| 5h trả `SSO_REQUIRED` | `SSO_SESSION_SECRET` của LocalBudd khác của core — hai bên phải TRÙNG giá trị |
