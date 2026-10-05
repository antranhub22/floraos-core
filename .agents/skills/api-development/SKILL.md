---
name: api-development
description: >-
  Quy tắc phát triển API backend cho FloraOS. Kích hoạt khi agent tạo/sửa
  API route, use-case, repository, error handling, hoặc bất kỳ file nào
  trong src/app/api/ hoặc src/modules/*/use-cases/.
---

# API Development — FloraOS

> Rà theo mã thật: 05/10/2026. Đường dẫn và lệnh `npm run` trong tệp này được `npm run check:docs` kiểm tự động.

## Quick Reference (copy-paste)

### Tạo API route
```typescript
// src/app/api/v1/<resource>/route.ts
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { requireCapability } from "@/core/rbac/capabilities"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L1")
  const result = await myUseCase(ctx)
  return jsonResponse(result)
})
```

### Route danh sách có Cursor Pagination (chuẩn từ products/route.ts)
```typescript
// src/app/api/v1/<resource>/route.ts
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L1")

  const url = new URL(request.url)
  const limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : 20
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw validationFailed({ limit: "Phải là số nguyên từ 1 đến 100" })
  }
  const cursor = url.searchParams.get("cursor") ?? undefined

  const result = await listItemsUseCase(ctx, { limit, cursor })
  return jsonResponse(result)
})
```

### Tạo use-case
```typescript
// src/modules/<module>/use-cases/<action>.ts
import type { TenantContext } from "@/core/tenancy"
import { notFound } from "@/core/http/errors"
import { MyRepository } from "@/modules/<module>/infra/my-repository"

export async function myAction(ctx: TenantContext, input: MyInput, repo = new MyRepository()) {
  const record = await repo.findById(ctx, input.id) // repository là instance, nhận ctx — xem products/infra/product-repository.ts
  if (!record) throw notFound()
  return repo.update(ctx, record.id, input)
}
```

### Tạo repository
```typescript
// src/modules/<module>/infra/my-repository.ts
import { db } from "@/lib/db"
import { scopedWhere, scopedData } from "@/core/tenancy"
import type { TenantContext } from "@/core/tenancy"

export const MyRepository = {
  async findById(ctx: TenantContext, id: string) {
    return db.myTable.findFirst({ where: scopedWhere(ctx, { id }) })
  },
  async create(ctx: TenantContext, data: CreateInput) {
    return db.myTable.create({ data: scopedData(ctx, data) })
  },
}
```

---

## Rules (bắt buộc)

### 1. Route Pattern
- Mọi route PHẢI qua `requireTenantContext()` → `requireCapability()`.
- Khoá bằng test: `tests/unit/architecture/route-capability-guard.test.ts` đỏ khi route mới không gọi gác quyền. Ngoại lệ có chủ đích (webhook, URL ký, đăng nhập…) ghi vào `NO_CAPABILITY_GUARD` kèm lý do.
- Route wrapper `handle()` tự bắt `AppError` và format response.
- Route dưới `/api/v1/`. Endpoint duyệt tách: `/x/[id]/approve`.

### 2. Error Handling
- **Lỗi HTTP duy nhất**: class `AppError` tại `src/core/http/errors.ts`. Không tạo error class riêng.
- **Factory functions**: `notFound()`, `validationFailed(details)`, `conflict()`, `quotaExceeded()`.
- **Validation message** viết bằng tiếng Việt: `throw validationFailed({ status: "Phải là một trong: ..." })`.

### 3. Clean Architecture (bắt buộc 4 thư mục)
- `domain/` — pure business logic, **KHÔNG import Prisma, KHÔNG import infra**.
- `use-cases/` — orchestration (có gạch nối, KHÔNG viết `usecases`).
- `infra/` — repository, Prisma queries.
- `adapters/` — external service adapters.

### 4. Import Style
- Path alias `@/` (không relative). Dùng `import type` cho types.
- Thứ tự: External → Core → Modules → Components → Lib.

### 5. Pagination (cursor-based)
- Mọi list endpoint PHẢI có `cursor` + `limit` (max 100).
- Dùng cursor-based (không offset) — ổn định khi data thêm/xóa.

### 6. Transaction
- Dùng `runInTransaction()` từ `@/modules/jobs/infra/transaction` cho multi-step writes.

### 7. Tenancy (trong code)
- `scopedWhere(ctx)` cho đọc, `scopedData(ctx, data)` cho ghi.
- `ownedByTenant(ctx, record)` kiểm tra sở hữu.
- **Ném lỗi** nếu code tự khai `organization_id`.

### 8. RBAC
- Quyền theo **mã năng lực** (capability code), KHÔNG theo vai UI.
- Catalog tại `src/core/rbac/capability-catalog.ts`.
- **Không bao giờ suy quyền từ `roleKey`**.

---

## DO / DON'T

### ❌ DON'T — Lấy org_id từ body
```typescript
export const POST = handle(async (req) => {
  const { organization_id, name } = await req.json()
  await db.product.create({ data: { organization_id, name } })
})
```

### ✅ DO — Giải org_id từ session, validate input
```typescript
export const POST = handle(async (req) => {
  const { ctx } = await requireTenantContext(req)
  requireCapability(ctx, "L2")
  const input = CreateProductSchema.parse(await req.json())
  return jsonResponse(await createProduct(ctx, input))
})
```

### ❌ DON'T — Query trong loop (N+1)
```typescript
const products = await db.product.findMany({ where: scopedWhere(ctx) })
for (const p of products) {
  p.assets = await db.asset.findMany({ where: { product_id: p.id } })
}
```

### ✅ DO — Batch query với include
```typescript
const products = await db.product.findMany({
  where: scopedWhere(ctx),
  include: { assets: { select: { id: true, url: true } } },
})
```

---

## Reference Files (file mẫu trong codebase)

| Pattern | File |
|---|---|
| API route chuẩn | `src/app/api/v1/products/route.ts` |
| Use-case chuẩn | `src/modules/products/use-cases/create-product.ts` |
| Use-case với transaction | `src/modules/products/use-cases/approve-analysis.ts` |
| Repository chuẩn | `src/modules/products/infra/product-repository.ts` |
| Domain rule thuần | `src/modules/products/domain/product-analysis-rules.ts` |
| Error class | `src/core/http/errors.ts` |
| Response helpers | `src/core/http/response.ts` |
| Tenant context | `src/core/tenancy/tenant-context.ts` |
| RBAC capabilities | `src/core/rbac/capabilities.ts` |

> Xem thêm: skill `testing` để biết cách test API route. Skill `database-schema` cho quy tắc tenant trên bảng mới.
