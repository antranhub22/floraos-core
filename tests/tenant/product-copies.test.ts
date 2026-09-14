import { randomUUID } from "node:crypto"

import { afterAll, beforeEach, describe, expect, it } from "vitest"

import {
  GET as getProductCopyRoute,
  PATCH as patchProductCopyRoute,
} from "@/app/api/v1/product-copies/[id]/route"
import { POST as approveProductCopyRoute } from "@/app/api/v1/product-copies/[id]/approve/route"
import { POST as rejectProductCopyRoute } from "@/app/api/v1/product-copies/[id]/reject/route"
import { POST as generateProductCopyRoute } from "@/app/api/v1/product-copies/generate/route"
import { GET as listProductCopiesRoute } from "@/app/api/v1/product-copies/route"
import type { TenantContext } from "@/core/tenancy"
import type { approval_state } from "@/generated/prisma/client"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { ProductAnalysisRepository } from "@/modules/products/infra/product-analysis-repository"
import { ProductCopyRepository } from "@/modules/product-copies/infra/product-copy-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

const BASE = "http://localhost/api/v1"

async function seedAsset(ctx: TenantContext): Promise<string> {
  const asset = await new AssetRepository().create(ctx, {
    id: randomUUID(),
    productId: null,
    parentAssetId: null,
    kind: "ORIGINAL",
    version: 1,
    storageKey: `org/${ctx.organizationId}/khong-san-pham/${randomUUID()}.jpg`,
    mimeType: "image/jpeg",
    createdBy: ctx.userId,
  })
  return asset.id
}

async function seedApprovedAnalysis(ctx: TenantContext, assetId: string) {
  return new ProductAnalysisRepository().createApprovedHistorical(ctx, {
    productId: null,
    assetId,
    jobId: randomUUID(),
    provider: "openai",
    model: "gpt-4o",
    modelVersion: "2026-08-01",
    contractName: "PhanTichSanPhamHoa",
    contractVersion: "2",
    raw: {
      identity: { category: "Bó hoa", shape: "Tròn", facing: "Một mặt", container: "Giấy gói", phong_cach: "Cổ điển", dip_su_dung: "Tết" },
      bom: { flowers: [], foliage: [], accessories: [], wrapping: [], materials_note: null },
      confidence: 90,
      flower_count: 10,
      bud_count: 2,
      damaged_count: 0,
    },
    approvedBy: ctx.userId,
    approvedAt: new Date(),
  })
}

async function seedProductCopy(ctx: TenantContext, analysisId: string, approvalState: "PENDING" | "APPROVED" | "REJECTED" = "PENDING") {
  const analysis = await prisma.product_analyses.findUnique({ where: { id: analysisId } })
  if (!analysis) throw new Error("Analysis not found")

  const copy = await new ProductCopyRepository().createFromAnalysis(ctx, {
    analysisId,
    productId: null,
    raw: {
      suggested_name: "Bó Hoa Hồng Tết",
      suggested_description: "Bó hoa hồng đỏ tươi tắn, ý nghĩa may mắn cho năm mới",
      suggested_tags: ["hoa-hong", "tet", "may-man"],
      suggested_occasions: ["valentine", "wedding"],
      suggested_price_segment: "premium",
    },
    profileVersion: "v1",
  })

  if (approvalState !== "PENDING") {
    await prisma.product_copies.update({
      where: { id: copy.id },
      data: { approval_state: approvalState as approval_state },
    })
  }

  return copy
}

describe("cách ly tenant — M01b dữ liệu bán hàng sản phẩm (P14)", () => {
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

  it("POST /product-copies/generate với analysis_id của tổ chức khác trả 404", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)

    const response = await generateProductCopyRoute(
      withSession(`${BASE}/product-copies/generate`, b.token, {
        method: "POST",
        body: JSON.stringify({ analysisId: analysis.id }),
      })
    )

    expect(response.status).toBe(404)
  })

  it("POST /product-copies/generate với analysis chưa APPROVED trả 422", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await new ProductAnalysisRepository().create(a.ctx, {
      productId: null,
      assetId: assetOfA,
      jobId: randomUUID(),
      provider: "openai",
      model: "gpt-4o",
      modelVersion: "2026-08-01",
      contractName: "PhanTichSanPhamHoa",
      contractVersion: "2",
      raw: { identity: { category: "Bó hoa" }, bom: {}, confidence: 90, flower_count: 10, bud_count: 2, damaged_count: 0 },
    })

    const response = await generateProductCopyRoute(
      withSession(`${BASE}/product-copies/generate`, a.token, {
        method: "POST",
        body: JSON.stringify({ analysisId: analysis.id }),
      })
    )

    expect(response.status).toBe(422)
  })

  it("POST /product-copies/generate hợp lệ trả copyId và raw", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)

    const response = await generateProductCopyRoute(
      withSession(`${BASE}/product-copies/generate`, a.token, {
        method: "POST",
        body: JSON.stringify({ analysisId: analysis.id }),
      })
    )

    console.log("Status:", response.status)
    const body = await readJson(response) as { copyId: string; raw: Record<string, unknown> }
    console.log("Body:", JSON.stringify(body, null, 2))
    expect(response.status).toBe(200)
    expect(typeof body.copyId).toBe("string")
    expect(typeof body.raw).toBe("object")
    expect(body.raw.suggested_name).toBeDefined()
  }, 15000)

  it("POST /product-copies/generate idempotent — gọi lại trả cùng copyId", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)

    const first = await generateProductCopyRoute(
      withSession(`${BASE}/product-copies/generate`, a.token, {
        method: "POST",
        body: JSON.stringify({ analysisId: analysis.id }),
      })
    )
    const firstBody = await readJson(first)
    expect(first.status).toBe(200)

    const second = await generateProductCopyRoute(
      withSession(`${BASE}/product-copies/generate`, a.token, {
        method: "POST",
        body: JSON.stringify({ analysisId: analysis.id }),
      })
    )
    const secondBody = await readJson(second)
    expect(second.status).toBe(200)
    expect(secondBody.copyId).toBe(firstBody.copyId)
  }, 15000)

  it("GET /product-copies/:id của tổ chức khác trả 404, không lộ dữ liệu", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    const asOwner = await getProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}`, a.token),
      { params: Promise.resolve({ id: copy.id }) }
    )
    expect(asOwner.status).toBe(200)

    const asOther = await getProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}`, b.token),
      { params: Promise.resolve({ id: copy.id }) }
    )
    expect(asOther.status).toBe(404)
  })

  it("PATCH /product-copies/:id ghi vào edited, không đụng raw", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    const response = await patchProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}`, a.token, {
        method: "PATCH",
        body: JSON.stringify({ edited: { suggested_name: "Tên Mới" } }),
      }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    expect(response.status).toBe(200)
    const body = await readJson(response) as { edited: { suggested_name: string }; raw: { suggested_name: string } }
    expect(body.edited?.suggested_name).toBe("Tên Mới")
    expect(body.raw.suggested_name).toBe("Bó Hoa Hồng Tết")
  })

  it("PATCH /product-copies/:id của tổ chức khác trả 404", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    const response = await patchProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}`, b.token, {
        method: "PATCH",
        body: JSON.stringify({ edited: { suggested_name: "Tên Mới" } }),
      }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    expect(response.status).toBe(404)
  })

  it("PATCH /product-copies/:id khi không PENDING trả 409", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id, "APPROVED")

    const response = await patchProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}`, a.token, {
        method: "PATCH",
        body: JSON.stringify({ edited: { suggested_name: "Tên Mới" } }),
      }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    expect(response.status).toBe(409)
  })

  it("POST /product-copies/:id/approve tạo sản phẩm mới, ghi audit_logs, trả 409 khi duyệt lại", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    const response = await approveProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}/approve`, a.token, { method: "POST" }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    expect(response.status).toBe(200)
    const body = await readJson(response) as { approval_state: string; approved_by: string; product_id: string }
    expect(body.approval_state).toBe("APPROVED")
    expect(body.approved_by).toBe(a.userId)
    expect(typeof body.product_id).toBe("string")

    const product = await prisma.products.findUnique({ where: { id: body.product_id as string } })
    expect(product?.name).toBe("Bó Hoa Hồng Tết")
    expect(product?.organization_id).toBe(a.organizationId)

    const auditRows = await prisma.audit_logs.findMany({
      where: { organization_id: a.organizationId, action: "product_copy.approve" },
    })
    expect(auditRows).toHaveLength(1)
    expect(auditRows[0]?.entity_id).toBe(copy.id)

    const second = await approveProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}/approve`, a.token, { method: "POST" }),
      { params: Promise.resolve({ id: copy.id }) }
    )
    expect(second.status).toBe(409)
  })

  it("POST /product-copies/:id/approve của tổ chức khác trả 404", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    const response = await approveProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}/approve`, b.token, { method: "POST" }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    expect(response.status).toBe(404)
  })

  it("POST /product-copies/:id/reject ghi audit_logs, trả 409 khi duyệt lại", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    const response = await rejectProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}/reject`, a.token, {
        method: "POST",
        body: JSON.stringify({ reason: "Không phù hợp" }),
      }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    expect(response.status).toBe(200)
    const body = await readJson(response) as { approval_state: string }
    expect(body.approval_state).toBe("REJECTED")

    const copyAfter = await prisma.product_copies.findUnique({ where: { id: copy.id } })
    expect(copyAfter?.approval_state).toBe("REJECTED")

    const auditRows = await prisma.audit_logs.findMany({
      where: { organization_id: a.organizationId, action: "product_copy.reject" },
    })
    expect(auditRows).toHaveLength(1)

    const second = await approveProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}/approve`, a.token, { method: "POST" }),
      { params: Promise.resolve({ id: copy.id }) }
    )
    expect(second.status).toBe(409)
  })

  it("POST /product-copies/:id/reject của tổ chức khác trả 404", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    const response = await rejectProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}/reject`, b.token, {
        method: "POST",
        body: JSON.stringify({ reason: "Không phù hợp" }),
      }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    expect(response.status).toBe(404)
  })

  it("GET /product-copies lọc theo product_id", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    const copy = await seedProductCopy(a.ctx, analysis.id)

    // Approve the copy first to create a product
    await approveProductCopyRoute(
      withSession(`${BASE}/product-copies/${copy.id}/approve`, a.token, { method: "POST" }),
      { params: Promise.resolve({ id: copy.id }) }
    )

    const approvedCopy = await prisma.product_copies.findUnique({ where: { id: copy.id } })
    const product = await prisma.products.findUnique({ where: { id: approvedCopy?.product_id as string } })
    const response = await listProductCopiesRoute(
      withSession(`${BASE}/product-copies?product_id=${product?.id}`, a.token)
    )

    expect(response.status).toBe(200)
    const body = await readJson(response) as { data: Array<{ id: string }> }
    expect(body.data.some((c: { id: string }) => c.id === copy.id)).toBe(true)
  })

  it("GET /product-copies lọc theo approval_state", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const analysis = await seedApprovedAnalysis(a.ctx, assetOfA)
    await seedProductCopy(a.ctx, analysis.id, "APPROVED")

    const response = await listProductCopiesRoute(
      withSession(`${BASE}/product-copies?approval_state=APPROVED`, a.token)
    )

    expect(response.status).toBe(200)
    const body = await readJson(response) as { data: Array<{ approval_state: string }> }
    expect(body.data.every((c: { approval_state: string }) => c.approval_state === "APPROVED")).toBe(true)
  })
})