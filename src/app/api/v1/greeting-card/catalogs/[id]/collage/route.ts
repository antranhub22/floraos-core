import { notFound } from "@/core/http/errors"
import { handle } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { catalogCollageById } from "@/modules/greeting-card/use-cases/catalog-collage"
import { renderCatalogCollage } from "@/components/greeting-card/og/catalog-collage-image"

/** GET /api/v1/greeting-card/catalogs/[id]/collage — tải ảnh catalog (PNG) để đăng lên kênh. */
export const GET = handle(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.read)
  // Kiểm catalog thuộc tổ chức trước — tiệm khác hay catalog đã ẩn đều 404
  const catalog = await new GreetingCardRepository().getCatalogById(ctx, id)
  if (!catalog) throw notFound()
  const data = await catalogCollageById(id)
  if (!data) throw notFound()
  const fileName = `bo-suu-tap-${catalog.code || id}.png`.replace(/[^a-zA-Z0-9._-]/g, "-")
  return renderCatalogCollage(data, {
    headers: { "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "private, no-store" },
  })
})

export const dynamic = "force-dynamic"
