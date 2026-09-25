import { prisma } from "@/core/tenancy/infra/prisma"
import { Prisma } from "@/generated/prisma/client"
import { env } from "@/lib/env"
import { ensureSystemRoles } from "@/modules/organization/use-cases/ensure-system-roles"
import { seedAiCapabilities, seedVisionModels } from "@/core/ai/infra/seed-ai-registry"

const TENANT_TABLES = [
  // Phân hệ Market Intelligence — Đợt A
  "content_opportunities",
  // Product Intelligence (Quét theo ảnh sản phẩm) — nợ #113, đã trả 21/09/2026
  "product_analysis_runs",
  // Gói chiến dịch Creative Studio (Khu vực F, Chặng 07–14) — 23/09/2026
  "campaign_packages",
  // Bài Khu vực B tự lưu — 24/09/2026
  "content_drafts",
  "voice_clones",
  "music_tracks",
  // Content Engine (P27) — 25/09/2026
  "content_generations",
  // Nền AI — AI-1. `ai_capabilities` và `ai_models` KHÔNG nằm ở đây: chúng là
  // sổ đăng ký cấp nền tảng, không phải dữ liệu thử của một tổ chức, và
  // `ensureSystemRoles` phía dưới cũng không dựng lại chúng.
  "chat_messages",
  "chat_conversations",
  "chat_channel_integrations",
  "vouchers",
  // Sáu bảng dưới đây có `organization_id` nhưng thiếu ở TRUNCATE cho tới
  // RS-2 18/09 (`check-docs.mjs` bắt được) — dữ liệu thử của chúng có thể
  // sót lại giữa các ca thử. `occasions` và `product_copies` đã có ca thử
  // cách ly ở nơi khác; bốn bảng còn lại có ca thử mới trong
  // `tests/tenant/scoping-gaps-18-09.test.ts`.
  "occasions",
  "product_copies",
  "content_metrics",
  "template_overrides",
  "catalog_links",
  "product_inventory",
  "customer_consents",
  "customer_occasions",
  // Chức năng 12 — Điều phối đơn hàng (25/09/2026)
  "order_exceptions",
  "order_qc_records",
  "order_coordinations",
  "partners",
  "order_events",
  "order_assignments",
  "order_items",
  "orders",
  "customers",
  "video_scenes",
  "video_jobs",
  "ai_evaluations",
  "ai_requests",
  "ai_policies",
  "integration_tokens",
  "product_analyses",
  "product_images",
  "product_variants",
  "pricing_rules",
  "products",
  "audit_logs",
  "usage",
  "job_events",
  "generation_jobs",
  "assets",
  "business_profiles",
  "brand_profiles",
  "capability_overrides",
  "role_capabilities",
  "memberships",
  "roles",
  "branches",
  "workspaces",
  "organizations",
  "sessions",
  "users",
] as const

/**
 * Chốt chặn: bộ test này XOÁ SẠCH database nó trỏ tới, nên nó chỉ được phép
 * trỏ tới một database có tên kết thúc bằng `_test`.
 *
 * Không phải phòng xa. Ngày 09/10 `npm run test:tenant` chạy trên chính
 * database phát triển và cuốn mất tổ chức AVI GIFT cùng 1.316 SKU — hai lần
 * trong một tối, vì `AGENTS.md` bắt cổng này xanh trước MỌI merge. Nợ #46.
 *
 * Dựng database test: `npm run db:test:setup`.
 */
function bat_buoc_la_database_test(): void {
  let ten_db: string
  try {
    ten_db = new URL(env.DATABASE_URL).pathname.replace(/^\//, "")
  } catch {
    throw new Error(`DATABASE_URL không phải một URL đọc được: ${env.DATABASE_URL}`)
  }

  if (!ten_db.endsWith("_test")) {
    throw new Error(
      [
        `TỪ CHỐI CHẠY: bộ test cách ly sẽ TRUNCATE toàn bộ database "${ten_db}",`,
        `mà tên nó không kết thúc bằng "_test".`,
        ``,
        `Đây gần như chắc chắn là database phát triển của anh. Dựng database`,
        `test một lần bằng:`,
        ``,
        `    npm run db:test:setup`,
        ``,
        `rồi chạy lại \`npm run test:tenant\` — script đó tự trỏ sang database test.`,
      ].join("\n")
    )
  }
}

/**
 * Cột có trong `prisma/schema.prisma` mà database test chưa có — so TỪNG cột
 * của MỌI model (danh sách lấy từ Prisma Client đã sinh), không chỉ tên bảng.
 * Thuần: nhận danh sách cột thật để thử được không cần Postgres.
 */
export function missingSchemaColumns(existing: ReadonlySet<string>): string[] {
  const ns = Prisma as unknown as Record<string, unknown>
  const missing: string[] = []
  for (const model of Object.values(Prisma.ModelName) as string[]) {
    const fields = ns[`${model.charAt(0).toUpperCase()}${model.slice(1)}ScalarFieldEnum`]
    if (!fields || typeof fields !== "object") continue
    for (const column of Object.values(fields as Record<string, string>)) {
      if (!existing.has(`${model}.${column}`)) missing.push(`${model}.${column}`)
    }
  }
  return missing
}

let schemaChecked = false

/**
 * Database test cũ hơn lược đồ → dừng ngay với lời chỉ cách sửa. Trước đây
 * thiếu CỘT (vd. `campaign_packages.video_job_ids`, 24/09/2026) không bị bắt:
 * route trả 500 và ca thử chỉ báo "expected 500 to be 201".
 */
async function assertSchemaUpToDate(): Promise<void> {
  if (schemaChecked) return
  const rows = await prisma.$queryRawUnsafe<Array<{ t: string; c: string }>>(
    "SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema = current_schema()"
  )
  const missing = missingSchemaColumns(new Set(rows.map((r) => `${r.t}.${r.c}`)))
  if (missing.length > 0) {
    throw new Error(
      `Database test cũ hơn prisma/schema.prisma — thiếu ${missing.length} cột: ${missing.slice(0, 12).join(", ")}` +
        `${missing.length > 12 ? ", …" : ""}. Chạy \`npm run db:test:setup\` rồi chạy lại \`npm run test:tenant\`.`
    )
  }
  schemaChecked = true
}

/**
 * Dọn sạch các bảng nền giữa các trường hợp thử (bảy của P1, hai
 * bảng quyền của P2, năm bảng Asset/Job/Usage/Audit của P3, hai bảng Hồ sơ
 * của P4, năm bảng Product Master/Analysis của P5, một bảng token tích hợp
 * của P7). Bộ test cách ly phải bắt đầu từ một cơ sở dữ liệu rỗng, nếu không
 * thì "không tìm thấy" có thể là do dữ liệu sót lại chứ không do bộ gác.
 */
export async function resetDatabase(): Promise<void> {
  bat_buoc_la_database_test()
  await assertSchemaUpToDate()
  try {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${TENANT_TABLES.join(", ")} RESTART IDENTITY CASCADE`
    )
  } catch (e) {
    // 42P01 = bảng chưa có: database test dựng trước một migration mới (vd.
    // `campaign_packages` 23/09) — 221 ca đỏ cùng lúc mà không nói vì sao
    // (máy anh Tony, 24/09/2026). Nói thẳng cách sửa.
    if (String((e as { message?: unknown })?.message ?? e).includes("42P01")) {
      throw new Error(
        "Database test thiếu bảng — lược đồ cũ hơn prisma/schema.prisma (có migration mới). " +
          "Chạy `npm run db:test:setup` rồi chạy lại `npm run test:tenant`.\n" +
          String((e as { message?: unknown })?.message ?? e)
      )
    }
    throw e
  }
  // Vai hệ thống là danh mục cài đặt, không phải dữ liệu thử: nạp lại đúng
  // như `npm run db:seed` làm sau khi đẩy lược đồ.
  await ensureSystemRoles()
  // Sổ đăng ký nền AI (ai_capabilities, ai_models) không bị truncate ở trên,
  // nhưng phải đảm bảo capabilities mới (như AIC-04) được upsert vào models.
  await seedAiCapabilities()
  await seedVisionModels()
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

export { prisma }
