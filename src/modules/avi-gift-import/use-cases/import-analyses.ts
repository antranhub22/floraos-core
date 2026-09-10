import { randomUUID } from "node:crypto"

import type { StorageProvider } from "@/core/ports"
import type { TenantContext } from "@/core/tenancy"
import {
  ANALYSIS_IMPORT_SOURCE,
  draftNameForNewProduct,
  extensionFromFileName,
  extractIdentity,
  HISTORICAL_CONTRACT_NAME,
  HISTORICAL_JOB_FEATURE,
  HISTORICAL_JOB_IDEMPOTENCY_KEY,
  HISTORICAL_MODEL,
  HISTORICAL_PROVIDER,
  mapAnalysisRow,
  type AnalysisImageSource,
  type AnalysisSourceRow,
} from "@/modules/avi-gift-import/domain/analysis-mapping"
import { buildStorageKey } from "@/modules/assets/domain/storage-key"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { ProductAnalysisRepository } from "@/modules/products/infra/product-analysis-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"

export type ImportAnalysesDeps = {
  storage: StorageProvider
  /** Đọc byte của một ảnh theo đường dẫn tuyệt đối ở máy chạy lượt nạp.
   *  Tiêm vào thay vì gọi thẳng `fs` để use-case test được không cần đĩa. */
  readImage: (absolutePath: string) => Promise<Uint8Array>
  importedAt: Date
  /** Ai chịu trách nhiệm cho lượt duyệt một-lần này — `users.id` thật của
   *  quản trị AVI GIFT, không phải một chuỗi bịa. */
  approvedBy: string
}

export type ImportAnalysesResult = {
  jobId: string
  productsCreated: number
  productsLinked: number
  assetsCreated: number
  assetsSkipped: number
  analysesCreated: number
  analysesSkipped: number
  failed: Array<{ code: string; error: string }>
}

/**
 * Nạp tám lượt phân tích ảnh LỊCH SỬ của AVI GIFT (P8, nợ #34). Ba việc:
 *
 *   một `generation_jobs` tổng hợp → `assets` từ ảnh thật → `product_analyses`
 *
 * Idempotent ở cả ba mức, nên chạy lại an toàn:
 *
 *  - job: theo `idempotency_key` cố định;
 *  - asset: theo `metadata.sourceFile` trong phạm vi một sản phẩm;
 *  - phân tích: theo `asset_id` của tấm ảnh đã phân tích.
 *
 * KHÔNG chạy trong một giao dịch duy nhất, có chủ đích: giữa chừng có ghi
 * tệp vào kho (`storage.put`), mà kho tệp không tham gia giao dịch của
 * Postgres — cuộn lại cơ sở dữ liệu cũng không xoá được tệp đã ghi. Tính
 * idempotent ở trên mới là thứ làm cho một lượt chạy dở an toàn, không phải
 * giao dịch.
 */
export async function importAnalyses(
  ctx: TenantContext,
  rows: AnalysisSourceRow[],
  deps: ImportAnalysesDeps
): Promise<ImportAnalysesResult> {
  const jobRepo = new GenerationJobRepository()
  const productRepo = new ProductRepository()
  const assetRepo = new AssetRepository()
  const analysisRepo = new ProductAnalysisRepository()

  const result: ImportAnalysesResult = {
    jobId: "",
    productsCreated: 0,
    productsLinked: 0,
    assetsCreated: 0,
    assetsSkipped: 0,
    analysesCreated: 0,
    analysesSkipped: 0,
    failed: [],
  }

  const existingJob = await jobRepo.findByIdempotencyKey(
    ctx,
    HISTORICAL_JOB_FEATURE,
    HISTORICAL_JOB_IDEMPOTENCY_KEY
  )
  const job =
    existingJob ??
    (await jobRepo.createCompletedHistorical(ctx, {
      workspaceId: ctx.workspaceId,
      branchId: ctx.branchId,
      userId: ctx.userId,
      productId: null,
      feature: HISTORICAL_JOB_FEATURE,
      idempotencyKey: HISTORICAL_JOB_IDEMPOTENCY_KEY,
      payload: {
        source: ANALYSIS_IMPORT_SOURCE,
        note: "Lượt phân tích đã chạy ở FloraOS v1, nạp lại vào core",
        analysisCount: rows.length,
      },
      completedAt: deps.importedAt,
    }))
  result.jobId = job.id

  for (const row of rows) {
    try {
      const mapped = mapAnalysisRow(row)
      const identity = extractIdentity(mapped.raw)

      // 1. Sản phẩm — nối vào bản ghi của lượt nạp danh mục nếu có, tạo mới
      //    nếu không (chốt với anh Tony 09/10 cho ba mã `GHTM`,
      //    `MM17082026`, `KG-20260831-001`).
      let product = await productRepo.findByCode(ctx, mapped.code)
      if (product) {
        result.productsLinked += 1
      } else {
        product = await productRepo.create(ctx, {
          code: mapped.code,
          name: draftNameForNewProduct(mapped.code, identity),
          status: "ACTIVE",
          category: identity.category,
          shape: identity.shape,
          facing: identity.facing,
          container: identity.container,
          attributes: {
            aviGiftImport: {
              source: ANALYSIS_IMPORT_SOURCE,
              importedAt: deps.importedAt.toISOString(),
              // Đánh dấu rõ: mã này KHÔNG có trong danh mục giá 1.316 SKU,
              // nó đến từ lượt nạp phân tích. Đừng lẫn hai nguồn khi đối
              // chiếu với `BAN_GIAO.md`.
              notInPriceCatalog: true,
            },
          },
        })
        result.productsCreated += 1
      }

      // 2. Ảnh — mọi tấm trong thư mục sản phẩm, không chỉ tấm đã phân tích
      //    (chốt với anh Tony 09/10). Bảy tấm còn lại là tư liệu gốc thật,
      //    và là ảnh thật để P9 chạy Identity Guard sau này.
      const existing = await assetRepo.list(ctx, { productId: product.id, limit: 500 })
      const daCo = new Map<string, string>()
      for (const asset of existing) {
        const sourceFile = (asset.metadata as { sourceFile?: unknown } | null)?.sourceFile
        if (typeof sourceFile === "string") daCo.set(sourceFile, asset.id)
      }

      let analyzedAssetId = daCo.get(mapped.analyzedFileName) ?? null

      for (const image of mapped.images) {
        if (daCo.has(image.fileName)) {
          result.assetsSkipped += 1
          continue
        }
        const assetId = await createAssetFromImage({
          ctx,
          deps,
          assetRepo,
          productId: product.id,
          image,
          analyzedAt: mapped.analyzedAt,
        })
        result.assetsCreated += 1
        if (image.fileName === mapped.analyzedFileName) analyzedAssetId = assetId
      }

      if (!analyzedAssetId) {
        throw new Error(`không dựng được asset cho ảnh đã phân tích ${mapped.analyzedFileName}`)
      }

      // 3. Lượt phân tích — đã duyệt sẵn, xem lý do ở `analysis-mapping.ts`.
      const daPhanTich = await analysisRepo.findByAssetId(ctx, analyzedAssetId)
      if (daPhanTich) {
        result.analysesSkipped += 1
        continue
      }

      await analysisRepo.createApprovedHistorical(ctx, {
        productId: product.id,
        assetId: analyzedAssetId,
        jobId: job.id,
        provider: HISTORICAL_PROVIDER,
        model: HISTORICAL_MODEL,
        modelVersion: HISTORICAL_MODEL,
        contractName: HISTORICAL_CONTRACT_NAME,
        contractVersion: mapped.contractVersion,
        raw: mapped.raw,
        approvedBy: deps.approvedBy,
        // Mốc duyệt là lúc phân tích chạy ở v1 khi biết được — đó mới là lúc
        // kết quả này thật sự được dùng. Không có thì lấy lúc nạp.
        approvedAt: mapped.analyzedAt ?? deps.importedAt,
      })
      result.analysesCreated += 1
    } catch (error) {
      result.failed.push({ code: row.code || "(rỗng)", error: (error as Error).message })
    }
  }

  return result
}

/** Ghi byte vào kho rồi tạo dòng `assets` trỏ tới đúng khoá đó. */
async function createAssetFromImage(input: {
  ctx: TenantContext
  deps: ImportAnalysesDeps
  assetRepo: AssetRepository
  productId: string
  image: AnalysisImageSource
  analyzedAt: Date | null
}): Promise<string> {
  const { ctx, deps, assetRepo, productId, image } = input

  // Cấp `id` trước để `storage_key` khớp với dòng sắp ghi — cùng cách
  // `create-upload-url.ts` (P3) làm.
  const assetId = randomUUID()
  const storageKey = buildStorageKey({
    organizationId: ctx.organizationId,
    productId,
    assetId,
    extension: extensionFromFileName(image.fileName),
  })

  const bytes = await deps.readImage(image.absolutePath)
  await deps.storage.put(storageKey, bytes, image.mimeType)

  await assetRepo.create(ctx, {
    id: assetId,
    productId,
    parentAssetId: null,
    // ORIGINAL, không phải MASTER: đây là ảnh CHỤP của cửa hàng, chưa qua
    // Identity Guard và không do máy dựng. `approval_state` giữ mặc định
    // PENDING vì cùng lý do — xem đầu `analysis-mapping.ts` và nợ #30.
    kind: "ORIGINAL",
    version: 1,
    storageKey,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    fileSize: image.fileSize,
    inputSha256: image.sha256,
    // `generated_flags` phải khai TƯỜNG MINH (`YC-A5`): ảnh chụp thật, không
    // có khâu sinh ảnh nào, nên cả hai cờ đều false — khác hẳn "để trống".
    generatedFlags: { generative_fill_used: false, requires_reshoot_warning: false },
    metadata: {
      sourceFile: image.fileName,
      source: ANALYSIS_IMPORT_SOURCE,
      importedAt: deps.importedAt.toISOString(),
      analyzedAt: input.analyzedAt?.toISOString() ?? null,
    },
    createdBy: ctx.userId,
  })

  return assetId
}
