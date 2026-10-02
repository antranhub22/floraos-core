/**
 * POST /api/v1/public/catalog/[slug]/lead
 *
 * Public endpoint — không yêu cầu xác thực session.
 * Nhận SĐT + thông điệp từ form Lead Capture trên Landing Page và lưu vào
 * field metadata của catalog_link tương ứng (JSON array `leads`).
 *
 * Không ghi thêm tenant ID từ client (chỉ đọc từ catalog_link DB) — tuân thủ Anti-pattern A12.
 */

import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { notFound, validationFailed } from "@/core/http/errors"
import { prisma } from "@/core/tenancy/infra/prisma"

const bodySchema = z.object({
  phone: z.string().min(8).max(20),
  message: z.string().max(500).optional(),
})

export const POST = handle<[{ params: Promise<{ slug: string }> }]>(
  async (request, context) => {
    const { slug } = await context.params

    const link = await prisma.catalog_links.findUnique({ where: { slug } })
    if (!link || link.is_revoked) {
      throw notFound()
    }

    const body = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      throw validationFailed({ issues: parsed.error.issues })
    }

    // Ghi lead vào JSON field `leads` của catalog_link — không cần schema migration riêng
    const existing = (link.filters as Record<string, unknown>) ?? {}
    const existingLeads = Array.isArray(existing.leads)
      ? (existing.leads as Array<Record<string, unknown>>)
      : []

    const newLead = {
      phone: parsed.data.phone,
      message: parsed.data.message ?? null,
      submittedAt: new Date().toISOString(),
    }

    await prisma.catalog_links.update({
      where: { slug },
      data: {
        filters: {
          ...existing,
          leads: [...existingLeads, newLead],
        } as never,
      },
    })

    return jsonResponse({ success: true })
  }
)

export const dynamic = "force-dynamic"
