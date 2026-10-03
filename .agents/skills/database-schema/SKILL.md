---
name: database-schema
description: >-
  Quy tắc làm việc với Prisma schema và database cho FloraOS. Kích hoạt khi
  agent cần sửa prisma/schema.prisma, tạo migration, thay đổi data model,
  hoặc làm việc trực tiếp với PostgreSQL.
---

# Database & Prisma Schema — FloraOS

## Quick Reference (copy-paste)

### Thêm bảng mới (checklist)
```
1. Thêm model vào prisma/schema.prisma — BẮT BUỘC có organization_id
2. npx prisma generate
3. npx prisma db push (dev) hoặc npx prisma migrate dev (production-track)
4. Tạo repository tại src/modules/<module>/infra/<table>-repository.ts
5. Dùng scopedWhere(ctx) + scopedData(ctx, data)
6. Viết tenant test tại tests/tenant/<resource>.test.ts
7. npm run test:tenant → PHẢI xanh
```

### Model mẫu
```prisma
model my_table {
  id              String   @id @default(cuid())
  organization_id String
  name            String
  status          String   @default("DRAFT")
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  organization organizations @relation(fields: [organization_id], references: [id])

  @@index([organization_id])
}
```

---

## Rules (bắt buộc)

### 1. Tenant — organization_id bắt buộc
- Mọi bảng PHẢI có `organization_id`. Không ngoại lệ.
- Kiểm ở tầng repository (scopedWhere/scopedData), không ở route.
- **Không tạo bảng trước khi P1 (tenant) và P2 (RBAC) đạt nghiệm thu.**

### 2. Schema Conventions
- Lược đồ: `snake_case` tiếng Anh. Không PascalCase, không tiếng Việt.
- Schema file: `prisma/schema.prisma` (~99KB).
- Mỗi bảng có `@@index([organization_id])` cho tenant query.

### 3. Quy trình sửa schema
1. Sửa `prisma/schema.prisma`
2. `npx prisma generate`
3. `npx prisma db push` (dev) hoặc `npx prisma migrate dev`
4. `npx prisma db seed` nếu cần
5. **⚠️ DỪNG LẠI HỎI USER trước khi sửa schema.**

### 4. Docker & PostgreSQL
- Container: `floraos-core-db`, credentials: `floraos:floraos@localhost:5432/floraos`.
- `pg_cron` cần Docker custom image: `docker/postgres-pgcron.Dockerfile`.
- DB test: `floraos_test`, setup: `npm run db:test:setup`.

---

## DO / DON'T

### ❌ DON'T — Bảng không có organization_id
```prisma
model settings {
  id    String @id
  key   String
  value String
}
```

### ✅ DO — Luôn có organization_id + index
```prisma
model settings {
  id              String @id @default(cuid())
  organization_id String
  key             String
  value           String

  organization organizations @relation(fields: [organization_id], references: [id])
  @@index([organization_id])
  @@unique([organization_id, key])
}
```

### ❌ DON'T — Query không scope tenant
```typescript
const items = await db.myTable.findMany({ where: { status: "ACTIVE" } })
```

### ✅ DO — Luôn scope qua tenant context
```typescript
const items = await db.myTable.findMany({
  where: scopedWhere(ctx, { status: "ACTIVE" }),
})
```

---

## Reference Files

| Pattern | File |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Migrations | `prisma/migrations/` |
| Seed script | `prisma/seed.ts` |
| Tenant context | `src/core/tenancy/tenant-context.ts` |
| Tenant context test | `src/core/tenancy/tenant-context.test.ts` |
| Docker Postgres | `docker-compose.yml` |
| DB test setup | `scripts/dung-db-test.sh` |

## Gotchas

1. **Schema ~99KB** — `npx prisma generate` mất thời gian. Không chạy liên tục.
2. **`exactOptionalPropertyTypes: true`** — Không gán `undefined`. Bỏ key hoặc dùng `T | undefined`.
3. **Migration đã chạy** — KHÔNG sửa tay file trong `prisma/migrations/`.
4. **Index** — Mọi bảng ít nhất có `@@index([organization_id])`. Query thường xuyên → thêm composite index.

> Xem thêm: skill `api-development` §7 cho tenant trong use-case. Skill `testing` §4 cho tenant test.
