import { afterAll, beforeEach, describe, expect, it } from "vitest"

import type { StorageProvider } from "@/core/ports"
import type { AnalysisSourceRow } from "@/modules/avi-gift-import/domain/analysis-mapping"
import {
  HISTORICAL_JOB_FEATURE,
  HISTORICAL_JOB_IDEMPOTENCY_KEY,
} from "@/modules/avi-gift-import/domain/analysis-mapping"
import { importAnalyses } from "@/modules/avi-gift-import/use-cases/import-analyses"
import { importCatalog } from "@/modules/avi-gift-import/use-cases/import-catalog"
import { ProductRepository } from "@/modules/products/infra/product-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"

/**
 * Lượt nạp phân tích ảnh lịch sử của AVI GIFT — P8, nợ #34.
 *
 * `analysis-mapping.test.ts` đã khoá phần luật thuần. Tệp này khoá phần chỉ
 * Postgres mới chứng minh được: ba bảng (`generation_jobs`/`assets`/
 * `product_analyses`) nối đúng vào nhau, chạy lại không nhân đôi, và không
 * bảng nào rò sang tổ chức khác.
 */
describe("nạp phân tích ảnh lịch sử AVI GIFT (P8, nợ #34)", () => {
  let a: Tenant
  let b: Tenant

  /** Kho tệp giả — giữ trong bộ nhớ, không chạm đĩa. */
  function fakeStorage(): StorageProvider & { written: Map<string, Uint8Array> } {
    const written = new Map<string, Uint8Array>()
    return {
      name: "fake",
      written,
      async put(key, body) {
        written.set(key, body)
      },
      async get(key) {
        const found = written.get(key)
        if (!found) throw new Error(`không có ${key}`)
        return found
      },
      async signedUrl(key) {
        return `/fake/${key}`
      },
    }
  }

  function deps(storage: ReturnType<typeof fakeStorage>, approvedBy: string) {
    return {
      storage,
      readImage: async (absolutePath: string) =>
        new TextEncoder().encode(`byte giả của ${absolutePath}`),
      importedAt: new Date("2026-09-10T00:00:00Z"),
      approvedBy,
    }
  }

  function image(code: string, index: number, ext = "jpg") {
    const fileName = `${code}-${index}.${ext}`
    return {
      fileName,
      absolutePath: `/nguon/images/${code}/${fileName}`,
      mimeType: ext === "png" ? "image/png" : "image/jpeg",
      fileSize: 1000 + index,
      width: 1024,
      height: 1024,
      sha256: `${code}-${index}`.padEnd(64, "0"),
    }
  }

  function row(code: string, soAnh = 1, overrides: Partial<AnalysisSourceRow> = {}): AnalysisSourceRow {
    return {
      code,
      analyzedFileName: `${code}-1.jpg`,
      analyzedAt: "2026-08-10 12:45:34",
      schemaVersion: 10,
      images: Array.from({ length: soAnh }, (_, i) => image(code, i + 1)),
      analysis: {
        identity: { category: "Bó hoa", shape: "Tròn", facing: "Một mặt", container: "Giấy gói" },
        bom: { flowers: [{ name: "Cẩm chướng", quantity: 30 }] },
      },
      ...overrides,
    }
  }

  function catalogRow(code: string) {
    return {
      code,
      name: `Bó hoa ${code}`,
      styleRaw: null, styleDetailCode: null, sizeCode: null, templateCode: null,
      styleSource: null, occasion: null, sellPriceVnd: 780_000, costVnd: null,
      laborCostVnd: null, priceStatus: "CHƯA CÓ GIÁ VỐN", priceWarning: null,
      floorVnd: null, ceilingVnd: null, profileStatus: "Chưa có ảnh",
      componentCount: null, ingredientCount: null, bom: [],
    }
  }

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it("dựng một job tổng hợp COMPLETED, không đi qua hàng đợi và không ghi usage", async () => {
    const storage = fakeStorage()
    const result = await importAnalyses(a.ctx, [row("BHSK0001")], deps(storage, a.userId))

    const job = await prisma.generation_jobs.findUnique({ where: { id: result.jobId } })
    expect(job?.status).toBe("COMPLETED")
    expect(job?.feature).toBe(HISTORICAL_JOB_FEATURE)
    expect(job?.idempotency_key).toBe(HISTORICAL_JOB_IDEMPOTENCY_KEY)
    expect(job?.completed_at).not.toBeNull()
    // `result` là cột PHÁN QUYẾT (`String?`) của Identity Guard ở P9, không
    // phải chỗ chứa số liệu lượt chạy — lượt nạp lịch sử không đi qua cổng
    // nào nên không có phán quyết để ghi. Số liệu nằm ở `payload` (Json).
    expect(job?.result).toBeNull()
    expect((job?.payload as { analysisCount?: number }).analysisCount).toBe(1)

    // Lượt phân tích đã chạy và đã trả tiền ở v1 — tính credit hay ghi usage
    // lần nữa là tính hai lần cho một việc.
    expect(await prisma.usage.count({ where: { organization_id: a.organizationId } })).toBe(0)
    const organization = await prisma.organizations.findUnique({
      where: { id: a.organizationId },
    })
    expect(organization?.credit_balance).toBe(20) // TRIAL_CREDIT_BALANCE, không bị trừ
  })

  it("nối vào sản phẩm đã có của lượt nạp danh mục, không tạo trùng mã", async () => {
    await importCatalog(a.ctx, [catalogRow("BHSK0001")], new Date())
    const storage = fakeStorage()

    const result = await importAnalyses(a.ctx, [row("BHSK0001")], deps(storage, a.userId))

    expect(result.productsLinked).toBe(1)
    expect(result.productsCreated).toBe(0)
    expect(await prisma.products.count({ where: { organization_id: a.organizationId } })).toBe(1)

    // Tên của lượt nạp danh mục giữ nguyên — lượt này không ghi đè.
    const product = await new ProductRepository().findByCode(a.ctx, "BHSK0001")
    expect(product?.name).toBe("Bó hoa BHSK0001")
  })

  it("tạo sản phẩm mới cho mã không có trong danh mục, đánh dấu rõ nguồn", async () => {
    const storage = fakeStorage()
    const result = await importAnalyses(a.ctx, [row("GHTM")], deps(storage, a.userId))

    expect(result.productsCreated).toBe(1)
    const product = await new ProductRepository().findByCode(a.ctx, "GHTM")
    expect(product?.status).toBe("ACTIVE") // có ảnh thật, khác 1.316 dòng DRAFT
    const attributes = product?.attributes as { aviGiftImport?: Record<string, unknown> }
    expect(attributes.aviGiftImport?.notInPriceCatalog).toBe(true)

    // Bốn cột nhận dạng LẤY ĐƯỢC ở lượt này — khác lượt nạp danh mục cố ý để
    // null, vì đây là kết quả MÁY nhận ra từ ảnh, đúng nghĩa hợp đồng Vision.
    expect(product?.category).toBe("Bó hoa")
    expect(product?.shape).toBe("Tròn")
    expect(product?.facing).toBe("Một mặt")
    expect(product?.container).toBe("Giấy gói")
  })

  it("dựng asset cho MỌI ảnh, ghi byte vào kho, và nối phân tích vào đúng ảnh đã phân tích", async () => {
    const storage = fakeStorage()
    const result = await importAnalyses(a.ctx, [row("GHTG0008", 5)], deps(storage, a.userId))

    expect(result.assetsCreated).toBe(5)
    expect(storage.written.size).toBe(5)
    for (const key of storage.written.keys()) {
      expect(key.startsWith(`org/${a.organizationId}/`)).toBe(true)
    }

    const assets = await prisma.assets.findMany({ where: { organization_id: a.organizationId } })
    expect(assets).toHaveLength(5)
    for (const asset of assets) {
      expect(asset.kind).toBe("ORIGINAL")
      // Ảnh CHỤP, chưa qua Identity Guard — không giả mạo một lượt duyệt
      // chưa từng chạy (nợ #30).
      expect(asset.approval_state).toBe("PENDING")
      expect(asset.generated_flags).toEqual({
        generative_fill_used: false,
        requires_reshoot_warning: false,
      })
    }

    const analyses = await prisma.product_analyses.findMany({
      where: { organization_id: a.organizationId },
    })
    expect(analyses).toHaveLength(1)
    const analyzed = assets.find(
      (asset) => (asset.metadata as { sourceFile?: string } | null)?.sourceFile === "GHTG0008-1.jpg"
    )
    expect(analyses[0]?.asset_id).toBe(analyzed?.id)
    expect(analyses[0]?.job_id).toBe(result.jobId)
  })

  it("lượt phân tích nạp vào ở trạng thái APPROVED, có người duyệt và mốc duyệt thật", async () => {
    const storage = fakeStorage()
    await importAnalyses(a.ctx, [row("BHSK0001")], deps(storage, a.userId))

    const analysis = await prisma.product_analyses.findFirst({
      where: { organization_id: a.organizationId },
    })
    expect(analysis?.approval_state).toBe("APPROVED")
    expect(analysis?.approved_by).toBe(a.userId)
    // Mốc duyệt là lúc phân tích CHẠY ở v1, không phải lúc nạp.
    expect(analysis?.approved_at?.getFullYear()).toBe(2026)
    expect(analysis?.approved_at?.getMonth()).toBe(7) // tháng 8
    expect(analysis?.contract_name).toBe("PhanTichSanPhamHoa")
    expect(analysis?.contract_version).toBe("v1-schema-10")
    // `raw` giữ nguyên khối máy trả về, `edited` rỗng — không ai sửa tay.
    expect((analysis?.raw as Record<string, unknown>).identity).toBeTruthy()
    expect(analysis?.edited).toBeNull()
  })

  it("chạy lại lượt nạp không nhân đôi job, asset hay lượt phân tích", async () => {
    const storage = fakeStorage()
    const rows = [row("BHSK0001", 3), row("GHTM")]

    const first = await importAnalyses(a.ctx, rows, deps(storage, a.userId))
    expect(first.assetsCreated).toBe(4)
    expect(first.analysesCreated).toBe(2)
    expect(first.failed).toEqual([])

    const second = await importAnalyses(a.ctx, rows, deps(storage, a.userId))
    expect(second.jobId).toBe(first.jobId) // cùng job, không tạo cái thứ hai
    expect(second.assetsCreated).toBe(0)
    expect(second.assetsSkipped).toBe(4)
    expect(second.analysesCreated).toBe(0)
    expect(second.analysesSkipped).toBe(2)
    expect(second.productsCreated).toBe(0)

    expect(await prisma.generation_jobs.count({ where: { organization_id: a.organizationId } })).toBe(1)
    expect(await prisma.assets.count({ where: { organization_id: a.organizationId } })).toBe(4)
    expect(await prisma.product_analyses.count({ where: { organization_id: a.organizationId } })).toBe(2)
  })

  it("bản ghi hỏng vào failed, các bản ghi còn lại vẫn nạp", async () => {
    const storage = fakeStorage()
    const result = await importAnalyses(
      a.ctx,
      [
        row("BHSK0001"),
        row("GHTM", 1, { analyzedFileName: "GHTM-9.jpg" }), // ảnh phân tích không có thật
        row("MM17082026"),
      ],
      deps(storage, a.userId)
    )

    expect(result.analysesCreated).toBe(2)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]?.code).toBe("GHTM")
    expect(await prisma.product_analyses.count({ where: { organization_id: a.organizationId } })).toBe(2)
  })

  it("không bảng nào rò sang tổ chức khác, kể cả khi hai tổ chức cùng mã (YC-T4)", async () => {
    const storage = fakeStorage()
    await importAnalyses(a.ctx, [row("BHSK0001", 3)], deps(storage, a.userId))
    await importAnalyses(b.ctx, [row("BHSK0001")], deps(storage, b.userId))

    for (const [tenant, soAsset] of [
      [a, 3],
      [b, 1],
    ] as const) {
      expect(
        await prisma.assets.count({ where: { organization_id: tenant.organizationId } })
      ).toBe(soAsset)
      expect(
        await prisma.product_analyses.count({ where: { organization_id: tenant.organizationId } })
      ).toBe(1)
      expect(
        await prisma.generation_jobs.count({ where: { organization_id: tenant.organizationId } })
      ).toBe(1)
    }

    // Cùng `idempotency_key` ở hai tổ chức là HỢP LỆ — khoá duy nhất gồm cả
    // `organization_id`, nên tổ chức này không chặn tổ chức kia nạp.
    const jobs = await prisma.generation_jobs.findMany({
      where: { idempotency_key: HISTORICAL_JOB_IDEMPOTENCY_KEY },
    })
    expect(jobs).toHaveLength(2)

    // Và khoá kho tệp tách theo tổ chức, không tấm nào nằm nhầm chỗ.
    const cuaA = [...storage.written.keys()].filter((k) => k.includes(a.organizationId))
    const cuaB = [...storage.written.keys()].filter((k) => k.includes(b.organizationId))
    expect(cuaA).toHaveLength(3)
    expect(cuaB).toHaveLength(1)
  })
})
