import { randomUUID } from "node:crypto"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import type { CatalogEventType, ChannelCount } from "../domain/catalog-channel"

export interface CatalogEventInput {
  catalogId: string
  channel: string
  eventType: CatalogEventType
  visitorHash: string
  orderId?: string | null | undefined
}

/** Sự kiện xem/đặt trên link bộ sưu tập công khai — tổ chức suy ra từ catalog, không từ khách. */
export class CatalogEventRepository {
  constructor(private readonly db = prisma) {}

  /** Ghi một sự kiện; catalog không tồn tại/đã ẩn → false. Mỗi khách × bước chỉ ghi 1 lần/ngày. */
  async record(input: CatalogEventInput): Promise<boolean> {
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: { id: input.catalogId, is_active: true },
      select: { organization_id: true },
    })
    if (!catalog) return false
    const dayStart = new Date(new Date().toISOString().slice(0, 10))
    if (input.eventType !== "ORDER") {
      const seen = await this.db.greeting_catalog_events.findFirst({
        where: {
          organization_id: catalog.organization_id,
          catalog_id: input.catalogId,
          event_type: input.eventType,
          visitor_hash: input.visitorHash,
          created_at: { gte: dayStart },
        },
        select: { id: true },
      })
      if (seen) return true
    }
    await this.db.greeting_catalog_events.create({
      data: {
        id: randomUUID(),
        organization_id: catalog.organization_id,
        catalog_id: input.catalogId,
        channel: input.channel,
        event_type: input.eventType,
        visitor_hash: input.visitorHash,
        order_id: input.orderId ?? null,
      },
    })
    return true
  }

  /** Số khách không trùng theo kênh × bước từ `since`. */
  async countByChannel(ctx: TenantContext, since: Date, catalogId?: string): Promise<ChannelCount[]> {
    const rows = await this.db.greeting_catalog_events.groupBy({
      by: ["channel", "event_type", "visitor_hash"],
      where: scopedWhere(ctx, { created_at: { gte: since }, ...(catalogId ? { catalog_id: catalogId } : {}) }),
      take: 50_000,
      orderBy: { channel: "asc" },
    })
    const counts = new Map<string, ChannelCount>()
    for (const r of rows) {
      const key = `${r.channel}|${r.event_type}`
      const cur = counts.get(key) ?? { channel: r.channel, eventType: r.event_type as CatalogEventType, visitors: 0 }
      cur.visitors += 1
      counts.set(key, cur)
    }
    return [...counts.values()]
  }
}
