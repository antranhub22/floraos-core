import { handle, jsonResponse } from "@/core/http/response"
import { getCatalogLinkBySlug } from "@/modules/catalog-links/use-cases/get-catalog-link"
import { notFound } from "@/core/http/errors"

export const GET = handle<[{ params: Promise<{ slug: string }> }]>(
  async (request, context) => {
    const { slug } = await context.params
    const link = await getCatalogLinkBySlug(slug)
    if (!link) throw notFound()
    return jsonResponse(link)
  }
)