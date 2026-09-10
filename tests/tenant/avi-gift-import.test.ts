import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as listProductsRoute } from "@/app/api/v1/products/route"
import type { TenantContext } from "@/core/tenancy"
import type { CatalogSourceRow } from "@/modules/avi-gift-import/domain/catalog-mapping"
import { bootstrapAviGiftOrganization } from "@/modules/avi-gift-import/use-cases/bootstrap-avi-gift-organization"
import { importCatalog } from "@/modules/avi-gift-import/use-cases/import-catalog"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

const BASE = "http://localhost/api/v1"

/**
 * Cách ly tenant và tính idempotent của lượt nạp AVI GIFT — P8, H7.
 *
 * `catalog-mapping.test.ts` đã khoá phần luật thuần (một dòng JSON → một
 * dòng `products`). Tệp này khoá ba điều mà CHỈ Postgres thật mới chứng minh
 * được, và cũng là ba điều hỏng thì hỏng im lặng:
 *
 *   1. Chạy lại một lượt nạp đã chạy thì BỎ QUA, không ghi đè và không vỡ ở
 *      `@@unique([organization_id, code])` — điều kiện để lượt nạp 1.316
 *      dòng chạy lại được sau khi đứt giữa chừng.
 *   2. Sản phẩm nạp vào đúng tổ chức của ngữ cảnh, và tổ chức khác không
 *      thấy dòng nào (`YC-T4`) — kể cả khi hai tổ chức có sản phẩm TRÙNG MÃ.
 *   3. `bootstrapAviGiftOrganization` dựng đủ bốn bảng trong MỘT giao dịch,
 *      và khi vỡ thì không để lại `users` mồ côi.
 */
describe("nạp danh mục AVI GIFT (P8)", () => {
  let a: Tenant
  let b: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  /** Một dòng nguồn tối thiểu — chỉ những trường `mapCatalogRowToProduct` đọc. */
  function sourceRow(code: string, overrides: Partial<CatalogSourceRow> = {}): CatalogSourceRow {
    return {
      code,
      name: `Bó hoa ${code}`,
      styleRaw: "KC01 Bó",
      styleDetailCode: "KC01-M",
      sizeCode: "M",
      templateCode: "TPL02",
      styleSource: "Website",
      occasion: null,
      sellPriceVnd: 780_000,
      costVnd: 410_937,
      laborCostVnd: 43_750,
      priceStatus: "HỢP LỆ",
      priceWarning: null,
      floorVnd: 410_937,
      ceilingVnd: 429_000,
      profileStatus: "Chưa có ảnh",
      componentCount: 2,
      ingredientCount: 4,
      bom: [],
      ...overrides,
    }
  }

  it("chạy lại lượt nạp thì bỏ qua mã đã có, không ghi đè, không vỡ khoá duy nhất", async () => {
    const rows = [sourceRow("BHBB0001"), sourceRow("BHBB0002"), sourceRow("BHBB0003")]

    const first = await importCatalog(a.ctx, rows, new Date("2026-09-10T00:00:00Z"))
    expect(first.created).toBe(3)
    expect(first.skippedExisting).toBe(0)
    expect(first.failed).toEqual([])

    // Lượt hai: cùng dữ liệu, nhưng một dòng đã đổi TÊN ở nguồn. Idempotent
    // theo `code` nghĩa là bỏ qua — KHÔNG cập nhật tên. Nếu có ngày muốn
    // lượt nạp ghi đè, ca thử này là chỗ phát hiện thay đổi hành vi đó.
    const second = await importCatalog(
      a.ctx,
      [rows[0]!, { ...rows[1]!, name: "TÊN ĐÃ ĐỔI Ở NGUỒN" }, rows[2]!],
      new Date("2026-09-11T00:00:00Z")
    )
    expect(second.created).toBe(0)
    expect(second.skippedExisting).toBe(3)
    expect(second.failed).toEqual([])

    const repo = new ProductRepository()
    const unchanged = await repo.findByCode(a.ctx, "BHBB0002")
    expect(unchanged?.name).toBe("Bó hoa BHBB0002")

    expect(await prisma.products.count({ where: { organization_id: a.organizationId } })).toBe(3)
  })

  it("hai dòng trùng mã trong CÙNG một tệp nguồn: dòng đầu tạo, dòng sau bỏ qua", async () => {
    const result = await importCatalog(
      a.ctx,
      [sourceRow("BHBB0001"), sourceRow("BHBB0001", { name: "Bản trùng" })],
      new Date()
    )

    expect(result.created).toBe(1)
    expect(result.skippedExisting).toBe(1)
    expect(result.failed).toEqual([])
    expect(await prisma.products.count({ where: { organization_id: a.organizationId } })).toBe(1)
  })

  it("dòng thiếu code/name bị ghi vào failed, các dòng còn lại vẫn nạp", async () => {
    const result = await importCatalog(
      a.ctx,
      [
        sourceRow("BHBB0001"),
        sourceRow("", { name: "Không có mã" }),
        sourceRow("BHBB0003", { name: "   " }),
        sourceRow("BHBB0004"),
      ],
      new Date()
    )

    expect(result.created).toBe(2)
    expect(result.failed).toHaveLength(2)
    expect(result.failed.map((f) => f.code)).toEqual(["(rỗng)", "BHBB0003"])
  })

  it("sản phẩm nạp vào chỉ thuộc tổ chức của ngữ cảnh, kể cả khi hai tổ chức trùng mã (YC-T4)", async () => {
    await importCatalog(a.ctx, [sourceRow("BHBB0001"), sourceRow("BHBB0002")], new Date())
    await importCatalog(
      b.ctx,
      [sourceRow("BHBB0001", { name: "Sản phẩm của B" })],
      new Date()
    )

    // Trùng mã giữa hai tổ chức là HỢP LỆ — khoá duy nhất là
    // `[organization_id, code]`, không phải `code`.
    expect(await prisma.products.count({ where: { organization_id: a.organizationId } })).toBe(2)
    expect(await prisma.products.count({ where: { organization_id: b.organizationId } })).toBe(1)

    const repo = new ProductRepository()
    expect((await repo.findByCode(a.ctx, "BHBB0001"))?.name).toBe("Bó hoa BHBB0001")
    expect((await repo.findByCode(b.ctx, "BHBB0001"))?.name).toBe("Sản phẩm của B")
    expect(await repo.findByCode(b.ctx, "BHBB0002")).toBeNull()

    // Và qua endpoint thật, không chỉ qua repository.
    const listed = await readJson(await listProductsRoute(withSession(`${BASE}/products`, b.token)))
    const codes = (listed.data as Array<{ code: string }>).map((row) => row.code)
    expect(codes).toEqual(["BHBB0001"])
  })

  it("listExistingCodes chỉ trả mã của tổ chức được hỏi", async () => {
    await importCatalog(a.ctx, [sourceRow("BHBB0001"), sourceRow("BHBB0002")], new Date())

    const repo = new ProductRepository()
    const forA = await repo.listExistingCodes(a.ctx, ["BHBB0001", "BHBB0002", "BHBB0009"])
    expect([...forA].sort()).toEqual(["BHBB0001", "BHBB0002"])

    const forB = await repo.listExistingCodes(b.ctx, ["BHBB0001", "BHBB0002"])
    expect(forB.size).toBe(0)
  })

  it("lượt nạp giữ nguyên category/shape/facing/container là null và ghi Sàn/Trần vào attributes", async () => {
    await importCatalog(
      a.ctx,
      [
        sourceRow("BHBB0001"),
        // Không có Sàn/Trần → không có khối priceGuard.
        sourceRow("BHBB0002", { floorVnd: null, ceilingVnd: null }),
      ],
      new Date("2026-09-10T00:00:00Z")
    )

    const repo = new ProductRepository()
    const withGuard = await repo.findByCode(a.ctx, "BHBB0001")
    const withoutGuard = await repo.findByCode(a.ctx, "BHBB0002")

    // Bốn cột nhận dạng CỐ Ý để null — chúng là kết quả M01 đã duyệt, không
    // phải từ vựng nghiệp vụ của v1 (xem đầu `catalog-mapping.ts`).
    for (const product of [withGuard, withoutGuard]) {
      expect(product?.category).toBeNull()
      expect(product?.shape).toBeNull()
      expect(product?.facing).toBeNull()
      expect(product?.container).toBeNull()
      expect(product?.status).toBe("DRAFT")
    }

    const attributes = withGuard?.attributes as Record<string, unknown>
    expect(attributes.priceGuard).toEqual({ floorVnd: 410_937, ceilingVnd: 429_000 })
    expect((attributes.catalog as Record<string, unknown>).sizeCode).toBe("M")
    expect((withoutGuard?.attributes as Record<string, unknown>).priceGuard).toBeNull()
  })

  it("bootstrap dựng tổ chức SINGLE + workspace PRODUCTION + admin, đủ bốn bảng", async () => {
    const result = await bootstrapAviGiftOrganization({
      organizationName: "AVI GIFT",
      adminEmail: "antranhub@gmail.com",
    })

    const organization = await prisma.organizations.findUnique({
      where: { id: result.organizationId },
    })
    expect(organization?.type).toBe("SINGLE")
    // Không có credit chào mừng như `signUp` — đây là tổ chức sản xuất thật.
    expect(organization?.credit_balance).toBe(0)

    const workspace = await new WorkspaceRepository().findDefaultForSessionOrganization(
      result.organizationId
    )
    expect(workspace?.kind).toBe("PRODUCTION")
    expect(workspace?.id).toBe(result.workspaceId)

    const membership = await prisma.memberships.findFirst({
      where: { organization_id: result.organizationId, user_id: result.userId },
    })
    expect(membership?.status).toBe("ACTIVE")

    const user = await prisma.users.findUnique({ where: { id: result.userId } })
    expect(user?.email).toBe("antranhub@gmail.com")
    // Mật khẩu tạm được BĂM, không lưu thô (nợ #35 chỉ nói về luồng buộc đổi
    // mật khẩu lần đầu, không phải về cách lưu).
    expect(user?.password_hash).not.toBe(result.temporaryPassword)
    expect((user?.password_hash ?? "").length).toBeGreaterThan(20)
  })

  it("bootstrap trùng địa chỉ thư thì cuộn lại cả giao dịch, không để lại tổ chức mồ côi", async () => {
    const first = await bootstrapAviGiftOrganization({
      organizationName: "AVI GIFT",
      adminEmail: "antranhub@gmail.com",
    })
    expect(first.organizationId).toBeTruthy()

    const organizationsBefore = await prisma.organizations.count()
    const usersBefore = await prisma.users.count()

    await expect(
      bootstrapAviGiftOrganization({
        organizationName: "AVI GIFT lần hai",
        adminEmail: "antranhub@gmail.com",
      })
    ).rejects.toThrow()

    // Không tổ chức mới, không user mới, không workspace mồ côi.
    expect(await prisma.organizations.count()).toBe(organizationsBefore)
    expect(await prisma.users.count()).toBe(usersBefore)
    expect(await prisma.organizations.findFirst({ where: { name: "AVI GIFT lần hai" } })).toBeNull()
  })

  it("nạp vào tổ chức vừa bootstrap: sản phẩm thuộc đúng tổ chức đó, không rò sang tổ chức có sẵn", async () => {
    const bootstrap = await bootstrapAviGiftOrganization({
      organizationName: "AVI GIFT",
      adminEmail: "antranhub@gmail.com",
    })
    const ctx: TenantContext = {
      organizationId: bootstrap.organizationId,
      workspaceId: bootstrap.workspaceId,
      userId: bootstrap.userId,
      branchId: null,
      capabilities: new Set<string>(),
    }

    await importCatalog(ctx, [sourceRow("BHBB0001"), sourceRow("BHBB0002")], new Date())

    expect(await prisma.products.count({ where: { organization_id: bootstrap.organizationId } })).toBe(2)
    expect(await prisma.products.count({ where: { organization_id: a.organizationId } })).toBe(0)

    const listed = await readJson(await listProductsRoute(withSession(`${BASE}/products`, a.token)))
    expect(listed.data).toEqual([])
  })
})
