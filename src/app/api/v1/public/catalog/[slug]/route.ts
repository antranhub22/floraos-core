import { handle, jsonResponse } from "@/core/http/response"
import { notFound } from "@/core/http/errors"
import { getPublicCatalog } from "@/modules/catalog-links/use-cases/get-public-catalog"

export const GET = handle<[{ params: Promise<{ slug: string }> }]>(
  async (_request, context) => {
    const { slug } = await context.params
    const result = await getPublicCatalog(slug)

    if (result.status === "NOT_FOUND") {
      throw notFound()
    }

    return jsonResponse(result)
  }
)

export const dynamic = "force-dynamic"
