import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/core/tenancy/infra/prisma"
import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { createInternalNote } from "@/modules/greeting-card/use-cases/create-internal-note"

// Cách ly hai bảng con của Thẻ chào mà greeting-card.test.ts chưa chạm tới:
// greeting_catalog_products (sản phẩm gắn vào catalog) và
// greeting_journey_events (sự kiện / ghi chú nội bộ của phiên chào khách).
describe("greeting_catalog_products & greeting_journey_events — cách ly tenant", () => {
  let tenantA: Tenant
  let tenantB: Tenant
  let repo: GreetingCardRepository
  let products: ProductRepository

  beforeEach(async () => {
    await resetDatabase()
    tenantA = await createTenant("alpha")
    tenantB = await createTenant("beta")
    repo = new GreetingCardRepository()
    products = new ProductRepository()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it("greeting_catalog_products: không gắn được sản phẩm của tổ chức khác vào catalog của mình", async () => {
    const productB = await products.create(tenantB.ctx, { code: "HOA-B", name: "Hoa của B" })
    const catA = await repo.createCatalog(tenantA.ctx, {
      code: "cat-a",
      name: "Catalog A",
      createdBy: tenantA.userId,
    })

    await expect(repo.addProductToCatalog(tenantA.ctx, catA.id, productB.id)).rejects.toThrow(
      "Không tìm thấy sản phẩm"
    )
    const detail = await repo.getCatalogById(tenantA.ctx, catA.id)
    expect(detail?.items).toHaveLength(0)
  })

  it("greeting_catalog_products: tạo catalog kèm productIds của tổ chức khác thì bỏ qua id đó", async () => {
    const productA = await products.create(tenantA.ctx, { code: "HOA-A", name: "Hoa của A" })
    const productB = await products.create(tenantB.ctx, { code: "HOA-B", name: "Hoa của B" })

    const catA = await repo.createCatalog(tenantA.ctx, {
      code: "cat-a",
      name: "Catalog A",
      productIds: [productB.id, productA.id],
      createdBy: tenantA.userId,
    })

    const detail = await repo.getCatalogById(tenantA.ctx, catA.id)
    expect(detail?.items.map((i) => i.product_id)).toEqual([productA.id])
  })

  it("greeting_catalog_products: không thêm/bớt được sản phẩm trong catalog của tổ chức khác", async () => {
    const productA = await products.create(tenantA.ctx, { code: "HOA-A", name: "Hoa của A" })
    const productB = await products.create(tenantB.ctx, { code: "HOA-B", name: "Hoa của B" })
    const catB = await repo.createCatalog(tenantB.ctx, {
      code: "cat-b",
      name: "Catalog B",
      productIds: [productB.id],
      createdBy: tenantB.userId,
    })

    await expect(repo.addProductToCatalog(tenantA.ctx, catB.id, productA.id)).rejects.toThrow(
      "Không tìm thấy catalog"
    )
    await expect(repo.removeProductFromCatalog(tenantA.ctx, catB.id, productB.id)).rejects.toThrow(
      "Không tìm thấy catalog"
    )
    expect(await repo.getCatalogById(tenantA.ctx, catB.id)).toBeNull()

    const detailB = await repo.getCatalogById(tenantB.ctx, catB.id)
    expect(detailB?.items.map((i) => i.product_id)).toEqual([productB.id])
  })

  it("greeting_journey_events: không ghi được ghi chú nội bộ vào phiên của tổ chức khác", async () => {
    const catB = await repo.createCatalog(tenantB.ctx, {
      code: "cat-b",
      name: "Catalog B",
      createdBy: tenantB.userId,
    })
    const linkB = await createSendLink(tenantB.ctx, { catalogId: catB.id, customerName: "Khách B" })
    const sessionB = await prisma.greeting_sessions.findFirstOrThrow({
      where: { organization_id: tenantB.organizationId, send_code: linkB.sendCode },
      select: { id: true },
    })

    await expect(
      createInternalNote(tenantA.ctx, {
        sessionId: sessionB.id,
        stepKey: "GENERAL",
        role: "SALE",
        senderName: "Nhân viên A",
        content: "Ghi chú chen ngang",
      })
    ).rejects.toThrow("Không tìm thấy phiên Thẻ chào tương ứng")

    const notes = await prisma.greeting_journey_events.count({
      where: { session_id: sessionB.id, event_type: "INTERNAL_NOTE" },
    })
    expect(notes).toBe(0)

    await createInternalNote(tenantB.ctx, {
      sessionId: sessionB.id,
      stepKey: "GENERAL",
      role: "SALE",
      senderName: "Nhân viên B",
      content: "Ghi chú hợp lệ",
    })
    const own = await prisma.greeting_journey_events.findMany({
      where: { session_id: sessionB.id, event_type: "INTERNAL_NOTE" },
      select: { organization_id: true },
    })
    expect(own).toEqual([{ organization_id: tenantB.organizationId }])
  })
})
