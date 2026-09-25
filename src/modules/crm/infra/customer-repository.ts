/**
 * Customer Repository (Infra).
 * Phân lập hoàn toàn theo organization_id (Tenant Isolation).
 */

import type {
  Prisma,
  customer_consents,
  customer_occasions,
  customers,
  vouchers,
} from "@/generated/prisma/client"
import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { CustomerMasterIndex, CustomerTier } from "../domain/customer-master-index"
import { deriveCustomerTier } from "../domain/crm-rules"

/** Hàng `customers` kèm các quan hệ mà truy vấn nào `include` thì có. */
type CustomerRow = customers & {
  occasions?: customer_occasions[]
  consents?: customer_consents[]
  vouchers?: vouchers[]
}

export interface CreateCustomerInput {
  name: string
  phone: string
  email?: string | undefined
  address?: string | undefined
  notes?: string | undefined
  tags?: string[] | undefined
  preferredFlowers?: string[] | undefined
  preferredColors?: string[] | undefined
}

export interface UpdateCustomerInput {
  name?: string | undefined
  phone?: string | undefined
  email?: string | undefined
  address?: string | undefined
  notes?: string | undefined
  tags?: string[] | undefined
  preferredFlowers?: string[] | undefined
  preferredColors?: string[] | undefined
}

export class CustomerRepository {
  async create(ctx: TenantContext, input: CreateCustomerInput): Promise<CustomerMasterIndex> {
    const count = await prisma.customers.count({ where: { organization_id: ctx.organizationId } })
    const code = `KH-${String(count + 1).padStart(4, "0")}`

    const row = await prisma.customers.create({
      data: {
        organization_id: ctx.organizationId,
        code,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        preferred_flowers: input.preferredFlowers ?? [],
        preferred_colors: input.preferredColors ?? [],
        tier: "NEW",
        total_spent: 0,
        order_count: 0,
      },
      include: {
        occasions: true,
        consents: true,
        vouchers: { where: { is_used: false } },
      },
    })

    return this.mapToMasterIndex(row)
  }

  async getById(ctx: TenantContext, id: string): Promise<CustomerMasterIndex | null> {
    const row = await prisma.customers.findFirst({
      where: { id, organization_id: ctx.organizationId },
      include: {
        occasions: true,
        consents: true,
        vouchers: { where: { is_used: false } },
      },
    })

    if (!row) return null
    return this.mapToMasterIndex(row)
  }

  async findByPhone(ctx: TenantContext, phone: string): Promise<CustomerMasterIndex | null> {
    const row = await prisma.customers.findFirst({
      where: { phone, organization_id: ctx.organizationId },
      include: {
        occasions: true,
        consents: true,
        vouchers: { where: { is_used: false } },
      },
    })

    if (!row) return null
    return this.mapToMasterIndex(row)
  }

  async update(ctx: TenantContext, id: string, input: UpdateCustomerInput): Promise<CustomerMasterIndex | null> {
    const existing = await prisma.customers.findFirst({
      where: { id, organization_id: ctx.organizationId },
    })
    if (!existing) return null

    const updated = await prisma.customers.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email ?? null } : {}),
        ...(input.address !== undefined ? { address: input.address ?? null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.preferredFlowers !== undefined ? { preferred_flowers: input.preferredFlowers } : {}),
        ...(input.preferredColors !== undefined ? { preferred_colors: input.preferredColors } : {}),
      },
      include: {
        occasions: true,
        consents: true,
        vouchers: { where: { is_used: false } },
      },
    })

    return this.mapToMasterIndex(updated)
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const existing = await prisma.customers.findFirst({
      where: { id, organization_id: ctx.organizationId },
    })
    if (!existing) return false

    await prisma.customers.delete({ where: { id } })
    return true
  }

  async list(
    ctx: TenantContext,
    filters?: { tier?: CustomerTier | undefined; search?: string | undefined },
    pagination?: { limit?: number | undefined; offset?: number | undefined }
  ): Promise<{ items: CustomerMasterIndex[]; total: number }> {
    const where: Prisma.customersWhereInput = {
      organization_id: ctx.organizationId,
      ...(filters?.tier ? { tier: filters.tier } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { phone: { contains: filters.search } },
              { code: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        include: {
          occasions: true,
          consents: true,
          vouchers: { where: { is_used: false } },
        },
        orderBy: { updated_at: "desc" },
        take: pagination?.limit ?? 50,
        skip: pagination?.offset ?? 0,
      }),
      prisma.customers.count({ where }),
    ])

    return {
      items: rows.map((r) => this.mapToMasterIndex(r)),
      total,
    }
  }

  async addOccasion(
    ctx: TenantContext,
    customerId: string,
    data: {
      name: string
      date: string
      isRecurring?: boolean | undefined
      reminderDaysBefore?: number | undefined
      recipientName?: string | undefined
      notes?: string | undefined
    }
  ) {
    return prisma.customer_occasions.create({
      data: {
        organization_id: ctx.organizationId,
        customer_id: customerId,
        name: data.name,
        date: data.date,
        is_recurring: data.isRecurring ?? true,
        reminder_days_before: data.reminderDaysBefore ?? 7,
        recipient_name: data.recipientName ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async updateConsent(
    ctx: TenantContext,
    customerId: string,
    channel: "ZALO_ZNS" | "SMS" | "PHONE_CALL" | "PROMOTION",
    granted: boolean
  ) {
    return prisma.customer_consents.upsert({
      where: {
        customer_id_channel: {
          customer_id: customerId,
          channel,
        },
      },
      create: {
        organization_id: ctx.organizationId,
        customer_id: customerId,
        channel,
        granted,
        granted_at: new Date(),
      },
      update: {
        granted,
        ...(granted ? { granted_at: new Date(), revoked_at: null } : { revoked_at: new Date() }),
      },
    })
  }

  /**
   * Đồng bộ tự động chi tiêu và số đơn từ bảng `orders` của M10
   */
  async syncMetricsFromOrders(ctx: TenantContext, customerId: string): Promise<void> {
    const orders = await prisma.orders.findMany({
      where: {
        organization_id: ctx.organizationId,
        customer_id: customerId,
        status: { in: ["CONFIRMED", "PROCESSING", "DELIVERED", "COMPLETED"] },
      },
      select: { total_vnd: true, created_at: true },
      orderBy: { created_at: "desc" },
    })

    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_vnd), 0)
    const orderCount = orders.length
    const lastOrderAt = orders[0]?.created_at ?? null
    const tier = deriveCustomerTier(totalSpent, orderCount)

    await prisma.customers.update({
      where: { id: customerId },
      data: {
        total_spent: totalSpent,
        order_count: orderCount,
        last_order_at: lastOrderAt,
        tier,
      },
    })
  }

  private mapToMasterIndex(row: CustomerRow): CustomerMasterIndex {
    const totalSpentVnd = Number(row.total_spent)
    const orderCount = Number(row.order_count)
    const aovVnd = orderCount > 0 ? Math.round(totalSpentVnd / orderCount) : 0

    return {
      id: row.id,
      organizationId: row.organization_id,
      code: row.code,
      name: row.name,
      phone: row.phone,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
      notes: row.notes ?? undefined,
      tags: row.tags ?? [],
      metrics: {
        tier: row.tier as CustomerTier,
        totalSpentVnd,
        orderCount,
        lastOrderAt: row.last_order_at ? row.last_order_at.toISOString() : undefined,
        aovVnd,
      },
      preferences: {
        preferredFlowers: row.preferred_flowers ?? [],
        preferredColors: row.preferred_colors ?? [],
      },
      occasions: (row.occasions ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        date: o.date,
        isRecurring: o.is_recurring,
        reminderDaysBefore: o.reminder_days_before,
        recipientName: o.recipient_name ?? undefined,
        notes: o.notes ?? undefined,
      })),
      consents: (row.consents ?? []).map((c) => ({
        channel: c.channel,
        granted: c.granted,
        grantedAt: c.granted_at.toISOString(),
      })),
      availableVouchers: (row.vouchers ?? []).map((v) => ({
        code: v.code,
        discountType: v.discount_type,
        discountValue: Number(v.discount_value),
        expiresAt: v.expires_at ? v.expires_at.toISOString() : undefined,
      })),
    }
  }
}
