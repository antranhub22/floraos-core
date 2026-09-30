---
name: testing
description: >-
  Quy tắc testing cho FloraOS. Kích hoạt khi agent viết test, debug test failure,
  cấu hình Vitest/Playwright, hoặc cần chạy test suite (unit, tenant, e2e).
---

# Testing — FloraOS

## Quick Reference (copy-paste)

### Unit test cho use-case
```typescript
// tests/unit/<module>/<action>.test.ts
import { describe, it, expect, vi } from "vitest"
import type { TenantContext } from "@/core/tenancy"

const ctx: TenantContext = { organizationId: "org-test", userId: "user-1", capabilities: ["L1"] }

describe("myAction", () => {
  it("trả về kết quả khi input hợp lệ", async () => {
    const result = await myAction(ctx, { name: "Test" })
    expect(result).toBeDefined()
    expect(result.name).toBe("Test")
  })

  it("ném notFound khi id không tồn tại", async () => {
    await expect(myAction(ctx, { id: "invalid" })).rejects.toThrow("NOT_FOUND")
  })
})
```

### Tenant isolation test (Chuẩn FloraOS: 404 chứ không 403)
```typescript
// tests/tenant/<resource>.test.ts
import { describe, it, expect } from "vitest"

describe("tenant isolation: <resource>", () => {
  it("org-A không thấy dữ liệu org-B (phải trả về 404/rỗng, KHÔNG trả 403 vì 403 làm lộ sự tồn tại)", async () => {
    // 1. Tạo record cho org-B
    const recordB = await createForOrg("org-B", { name: "Secret B" })
    
    // 2. Query bằng ctx của org-A
    const result = await findById(ctxOrgA, recordB.id)
    
    // 3. Kỳ vọng: null hoặc ném 404 NOT_FOUND (tuyệt đối không trả 403 FORBIDDEN)
    expect(result).toBeNull()
  })
})
```
---

## Rules (bắt buộc)

### 1. Test Suites & Lệnh

| Suite | Lệnh | Gate |
|---|---|---|
| Unit | `npm test` | Phải xanh |
| Tenant | `npm run test:tenant` | **BẮT BUỘC xanh trước merge** |
| Platform | `npm run test:platform` | Phải xanh |
| E2E | `npm run test:e2e` | Cần worker media đang chạy |
| Worker | `cd workers && .venv/bin/python -m pytest tests -q` | |
| Typecheck | `npm run typecheck` | Phải sạch 100% |

### 2. Naming Convention

- `describe("functionName")` — tên hàm/module đang test.
- `it("mô tả hành vi bằng tiếng Việt")` — mô tả kỳ vọng.
- Ví dụ: `it("ném lỗi khi thiếu tên sản phẩm")`, `it("trả về danh sách phân trang")`.

### 3. Mocking Strategy

- **Mock ở tầng infra**: Mock repository, không mock domain logic.
- **Dùng `vi.mock()`** cho external services (AI, storage).
- **KHÔNG mock** `TenantContext` — tạo context thật: `{ organizationId: "org-test", ... }`.
- **Test DB** cho tenant test: dùng `floraos_test`, setup bằng `npm run db:test:setup`.

### 4. Test Data

- Tạo test data rõ ràng trong mỗi test. Không dùng shared mutable state.
- Dọn dẹp sau test nếu dùng DB thật (tenant suite).

### 5. Vitest Gotchas

- **`fileParallelism: false`**: KHÔNG bật — tests dùng chung DB.
- **`server-only` stub**: Đã alias tại `vitest.config.ts` → `tests/helpers/server-only-stub.ts`. Không cần xử lý riêng.
- **Setup**: `tests/setup.ts` chạy trước mỗi suite.

---

## DO / DON'T

### ❌ DON'T — Test không assert rõ ràng
```typescript
it("works", async () => {
  const result = await myAction(ctx, input)
  expect(result).toBeTruthy() // Quá chung chung
})
```

### ✅ DO — Assert cụ thể
```typescript
it("tạo sản phẩm với tên và organization_id đúng", async () => {
  const result = await createProduct(ctx, { name: "Hoa Hồng" })
  expect(result.name).toBe("Hoa Hồng")
  expect(result.organization_id).toBe(ctx.organizationId)
  expect(result.status).toBe("DRAFT")
})
```

### ❌ DON'T — Quên test tenant isolation
```typescript
// Chỉ test happy path, quên kiểm tra cross-tenant
it("lấy sản phẩm", async () => {
  const product = await getProduct(ctx, id)
  expect(product).toBeDefined()
})
```

### ✅ DO — Test tenant boundary
```typescript
it("không trả sản phẩm của tổ chức khác", async () => {
  const otherCtx = { ...ctx, organizationId: "org-other" }
  const product = await getProduct(otherCtx, productOfOrgA.id)
  expect(product).toBeNull()
})
```

---

## Reference Files

| Pattern | File |
|---|---|
| Vitest config | `vitest.config.ts` |
| Test setup | `tests/setup.ts` |
| server-only stub | `tests/helpers/server-only-stub.ts` |
| Unit test mẫu | `tests/unit/market-intelligence/` |
| Tenant test mẫu | `tests/tenant/` |
| E2E test | `tests/e2e/` |
| Architecture test (cấm import Prisma ngoài infra) | `tests/tenant/khong-import-prisma-ngoai-infra.test.ts` |
| Tenant context test | `src/core/tenancy/tenant-context.test.ts` |

> Xem thêm: skill `api-development` cho pattern API cần test. Skill `database-schema` §4 cho DB test setup.
