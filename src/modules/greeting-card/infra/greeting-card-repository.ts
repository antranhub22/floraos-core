import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { Prisma } from "@/generated/prisma/client"
import { signStorageUrl } from "@/modules/assets/infra/storage-signing"
import { generateSendCode } from "../domain/greeting-card-rules"
import type {
  GreetingCatalogType,
  GreetingSessionStatus,
  ProductSnapshot,
} from "../domain/greeting-card-types"

export class GreetingCardRepository {
  constructor(private readonly db = prisma) {}

  async createCatalog(
    ctx: TenantContext,
    input: {
      code: string
      name: string
      type?: GreetingCatalogType | undefined
      description?: string | null | undefined
      filters?: Record<string, unknown> | null | undefined
      productIds?: string[] | undefined
      createdBy: string
    }
  ) {
    const catalog = await this.db.greeting_catalogs.create({
      data: {
        organization_id: ctx.organizationId,
        code: input.code.toLowerCase().trim(),
        name: input.name.trim(),
        type: input.type || "STANDARD",
        description: input.description ?? null,
        filters: (input.filters ?? Prisma.DbNull) as Prisma.InputJsonValue,
        created_by: input.createdBy,
      },
    })

    // Chỉ nhận sản phẩm của chính tenant; id của tổ chức khác coi như không tồn tại.
    const owned = input.productIds?.length
      ? new Set(
          (
            await this.db.products.findMany({
              where: scopedWhere(ctx, { id: { in: input.productIds } }),
              select: { id: true },
            })
          ).map((p) => p.id)
        )
      : new Set<string>()
    const productIds = (input.productIds ?? []).filter((id) => owned.has(id))

    if (productIds.length > 0) {
      await this.db.greeting_catalog_products.createMany({
        data: productIds.map((productId, index) => ({
          organization_id: ctx.organizationId,
          catalog_id: catalog.id,
          product_id: productId,
          sort_order: index,
        })),
        skipDuplicates: true,
      })
    }

    return catalog
  }

  async getCatalogByCode(ctx: TenantContext, code: string) {
    return this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { code: code.toLowerCase().trim() }),
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                variants: true,
                // Nguồn Master Index (bản phân tích APPROVED mới nhất) cho các trường hiển thị
                analyses: { where: { approval_state: "APPROVED" }, orderBy: { created_at: "desc" }, take: 1, select: { raw: true, edited: true } },
              },
            },
          },
          orderBy: { sort_order: "asc" },
        },
      },
    })
  }

  async listCatalogs(ctx: TenantContext) {
    return this.db.greeting_catalogs.findMany({
      where: scopedWhere(ctx, { is_active: true }),
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { items: true, sessions: true } },
      },
      orderBy: { created_at: "desc" },
    })
  }

  async getNextSendCode(ctx: TenantContext, prefix = "T01"): Promise<string> {
    const count = await this.db.greeting_sessions.count({
      where: scopedWhere(ctx, {}),
    })
    return generateSendCode(count + 1, prefix)
  }

  async createSession(
    ctx: TenantContext,
    input: {
      catalogId: string
      sendCode: string
      saleId: string
      customerName?: string | null | undefined
      customerPhone?: string | null | undefined
    }
  ) {
    return this.db.greeting_sessions.create({
      data: {
        organization_id: ctx.organizationId,
        catalog_id: input.catalogId,
        send_code: input.sendCode.toUpperCase().trim(),
        sale_id: input.saleId,
        customer_name: input.customerName ?? null,
        customer_phone: input.customerPhone ?? null,
        status: "CREATED",
      },
    })
  }

  async createPublicSession(input: {
    organizationId: string
    catalogId: string
    sendCode: string
    customerName?: string | null
    customerPhone?: string | null
    productId: string
    snapshot: ProductSnapshot
  }) {
    return this.db.greeting_sessions.create({
      data: {
        organization_id: input.organizationId,
        catalog_id: input.catalogId,
        send_code: input.sendCode.toUpperCase().trim(),
        sale_id: "public",
        customer_name: input.customerName ?? null,
        customer_phone: input.customerPhone ?? null,
        status: "SELECTED",
        selected_product_id: input.productId,
        product_snapshot: input.snapshot as object,
        selected_at: new Date(),
      },
    })
  }

  async getPublicSessionBySendCode(sendCode: string) {
    return this.db.greeting_sessions.findFirst({
      where: { send_code: sendCode.toUpperCase().trim() },
      include: {
        // Chỉ đọc khoá cấu hình hiển thị trong settings (xem toPublicCatalogFilters) — không gửi nguyên ra ngoài
        organization: { select: { settings: true } },
        catalog: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: true,
                    variants: true,
                    analyses: { where: { approval_state: "APPROVED" }, orderBy: { created_at: "desc" }, take: 1, select: { raw: true, edited: true } },
                  },
                },
              },
              orderBy: { sort_order: "asc" },
            },
          },
        },
        order: true,
      },
    })
  }

  /** Lấy catalog công khai theo ID — không cần auth, dùng cho route /g/[id]. */
  async getPublicCatalogById(catalogId: string) {
    return this.db.greeting_catalogs.findFirst({
      where: { id: catalogId, is_active: true },
      include: {
        organization: { select: { id: true, name: true, slug: true, settings: true } },
        items: {
          include: {
            product: {
              include: { images: { where: { role: "MAIN" }, take: 1 }, variants: { take: 1 }, analyses: { where: { approval_state: "APPROVED" }, orderBy: { created_at: "desc" }, take: 1, select: { raw: true, edited: true } } },
            },
          },
          orderBy: { sort_order: "asc" },
        },
      },
    })
  }

  /**
   * Lấy catalog công khai theo slug tổ chức + code catalog.
   * Dùng cho route /g/[orgSlug]/[catalogCode] — URL thân thiện, có ý nghĩa.
   */
  async getPublicCatalogBySlugAndCode(orgSlug: string, catalogCode: string) {
    return this.db.greeting_catalogs.findFirst({
      where: {
        code: catalogCode.toLowerCase().trim(),
        is_active: true,
        organization: { slug: orgSlug.toLowerCase().trim() },
      },
      include: {
        organization: { select: { id: true, name: true, slug: true, settings: true } },
        items: {
          include: {
            product: {
              include: { images: { where: { role: "MAIN" }, take: 1 }, variants: { take: 1 }, analyses: { where: { approval_state: "APPROVED" }, orderBy: { created_at: "desc" }, take: 1, select: { raw: true, edited: true } } },
            },
          },
          orderBy: { sort_order: "asc" },
        },
      },
    })
  }


  async updateSession(
    sessionId: string,
    data: {
      status?: GreetingSessionStatus | undefined
      selectedProductId?: string | null | undefined
      productSnapshot?: ProductSnapshot | null | undefined
      orderId?: string | null | undefined
      openedAt?: Date | undefined
      selectedAt?: Date | undefined
      customerName?: string | null | undefined
      customerPhone?: string | null | undefined
    }
  ) {
    return this.db.greeting_sessions.update({
      where: { id: sessionId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.selectedProductId !== undefined ? { selected_product_id: data.selectedProductId } : {}),
        ...(data.productSnapshot !== undefined
          ? { product_snapshot: data.productSnapshot as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.orderId !== undefined ? { order_id: data.orderId } : {}),
        ...(data.openedAt !== undefined ? { opened_at: data.openedAt } : {}),
        ...(data.selectedAt !== undefined ? { selected_at: data.selectedAt } : {}),
        ...(data.customerName !== undefined ? { customer_name: data.customerName } : {}),
        ...(data.customerPhone !== undefined ? { customer_phone: data.customerPhone } : {}),
        last_active_at: new Date(),
      },
    })
  }

  async recordJourneyEvent(
    organizationId: string,
    sessionId: string,
    eventType: string,
    metadata?: Record<string, unknown> | null | undefined
  ) {
    return this.db.greeting_journey_events.create({
      data: {
        organization_id: organizationId,
        session_id: sessionId,
        event_type: eventType,
        metadata: (metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    })
  }

  async listSessions(
    ctx: TenantContext,
    options: {
      saleId?: string | undefined
      catalogId?: string | undefined
      status?: string | undefined
      limit?: number | undefined
    } = {}
  ) {
    return this.db.greeting_sessions.findMany({
      where: scopedWhere(ctx, {
        ...(options.saleId ? { sale_id: options.saleId } : {}),
        ...(options.catalogId ? { catalog_id: options.catalogId } : {}),
        ...(options.status ? { status: options.status } : {}),
      }),
      include: {
        catalog: { select: { id: true, name: true, code: true } },
        order: { select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true } },
      },
      orderBy: { created_at: "desc" },
      take: options.limit || 50,
    })
  }

  async listBrochureOrders(
    ctx: TenantContext,
    options: {
      saleId?: string | undefined
      status?: string | undefined
      limit?: number | undefined
    } = {}
  ) {
    return this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        ...(options.status ? { status: options.status as any } : {}),
      }),
      include: {
        customer: true,
        items: true,
        payments: true,
        greeting_sessions: true,
      },
      orderBy: { created_at: "desc" },
      take: options.limit || 50,
    })
  }

  async getCatalogById(ctx: TenantContext, id: string) {
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { id }),
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { role: "MAIN" }, take: 1 }, variants: { take: 1 }, analyses: { where: { approval_state: "APPROVED" }, orderBy: { created_at: "desc" }, take: 1, select: { raw: true, edited: true } } },
            },
          },
          orderBy: { sort_order: "asc" },
        },
        _count: { select: { sessions: true } },
      },
    })
    if (!catalog) return null

    // Resolve storage_key → signed URL for each product's main image (chống N+1)
    const assetIds = catalog.items
      .flatMap((item) => item.product.images.map((img) => img.asset_id))
    const storageKeyById = new Map<string, string>()
    if (assetIds.length > 0) {
      const assets = await this.db.assets.findMany({
        where: { id: { in: assetIds } },
        select: { id: true, storage_key: true },
      })
      for (const a of assets) storageKeyById.set(a.id, a.storage_key)
    }

    return {
      ...catalog,
      items: catalog.items.map((item) => {
        const mainImg = item.product.images[0]
        const masterImageUrl = mainImg
          ? (() => {
              const key = storageKeyById.get(mainImg.asset_id)
              if (!key) return undefined
              const exp = Date.now() + 86_400_000
              return `/api/v1/storage/${key}?exp=${exp}&sig=${signStorageUrl(key, exp)}`
            })()
          : undefined
        return {
          ...item,
          product: {
            ...item.product,
            masterImageUrl,
          },
        }
      }),
    }
  }

  async updateCatalog(
    ctx: TenantContext,
    id: string,
    data: {
      name?: string | undefined
      description?: string | null | undefined
      type?: GreetingCatalogType | undefined
      isActive?: boolean | undefined
      filters?: Record<string, unknown> | null | undefined
    }
  ) {
    return this.db.greeting_catalogs.updateMany({
      where: scopedWhere(ctx, { id }),
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.isActive !== undefined ? { is_active: data.isActive } : {}),
        ...(data.filters !== undefined ? { filters: data.filters as object } : {}),
      },
    })
  }

  async deleteCatalog(ctx: TenantContext, id: string) {
    // Soft delete: đặt is_active=false, không xóa thật
    return this.db.greeting_catalogs.updateMany({
      where: scopedWhere(ctx, { id }),
      data: { is_active: false },
    })
  }

  async addProductToCatalog(ctx: TenantContext, catalogId: string, productId: string) {
    // Kiểm tra catalog thuộc tenant
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { id: catalogId }),
    })
    if (!catalog) throw new Error("Không tìm thấy catalog")

    // Sản phẩm cũng phải thuộc tenant — thiếu kiểm này thì gắn được sản phẩm
    // của tổ chức khác vào catalog mình và đọc ra tên/giá/ảnh ký của nó.
    const product = await this.db.products.findFirst({
      where: scopedWhere(ctx, { id: productId }),
      select: { id: true },
    })
    if (!product) throw new Error("Không tìm thấy sản phẩm")

    const maxOrder = await this.db.greeting_catalog_products.aggregate({
      where: { catalog_id: catalogId },
      _max: { sort_order: true },
    })

    return this.db.greeting_catalog_products.upsert({
      where: { catalog_id_product_id: { catalog_id: catalogId, product_id: productId } },
      create: {
        organization_id: ctx.organizationId,
        catalog_id: catalogId,
        product_id: productId,
        sort_order: (maxOrder._max.sort_order ?? -1) + 1,
      },
      update: {},
    })
  }

  async removeProductFromCatalog(ctx: TenantContext, catalogId: string, productId: string) {
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { id: catalogId }),
    })
    if (!catalog) throw new Error("Không tìm thấy catalog")

    return this.db.greeting_catalog_products.deleteMany({
      where: { catalog_id: catalogId, product_id: productId },
    })
  }

  async getAssetsStorageMap(assetIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    if (assetIds.length === 0) return map
    const assets = await this.db.assets.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, storage_key: true },
    })
    const exp = Date.now() + 7 * 86_400_000 // 7 ngày
    for (const a of assets) {
      const sig = signStorageUrl(a.storage_key, exp)
      map.set(a.id, `/api/v1/storage/${a.storage_key}?exp=${exp}&sig=${sig}`)
    }
    return map
  }

  async getAssetStorageUrl(assetId: string): Promise<string | null> {
    const asset = await this.db.assets.findUnique({
      where: { id: assetId },
      select: { storage_key: true },
    })
    if (!asset?.storage_key) return null
    const exp = Date.now() + 7 * 86_400_000
    const sig = signStorageUrl(asset.storage_key, exp)
    return `/api/v1/storage/${asset.storage_key}?exp=${exp}&sig=${sig}`
  }

  async createBrochureOrder(data: {
    organizationId: string
    sessionId: string
    code: string
    customerName: string
    customerPhone: string
    recipientName: string
    recipientPhone: string
    deliveryAddress: string
    deliveryDate: string
    cardMessage?: string | null | undefined
    note?: string | null | undefined
    snapshot: ProductSnapshot | null
    totalAmount: number
  }) {
    return this.db.$transaction(async (tx) => {
      // Upsert customer — an toàn khi nhiều đơn cùng SĐT đặt đồng thời
      const customerCount = await tx.customers.count({ where: { organization_id: data.organizationId } })
      const customer = await tx.customers.upsert({
        where: {
          organization_id_phone: {
            organization_id: data.organizationId,
            phone: data.customerPhone,
          },
        },
        create: {
          organization_id: data.organizationId,
          code: `KH-${String(customerCount + 1).padStart(4, "0")}`,
          name: data.customerName,
          phone: data.customerPhone,
          address: data.deliveryAddress,
        },
        update: {},
      })

      // Create order
      const order = await tx.orders.create({
        data: {
          organization_id: data.organizationId,
          customer_id: customer.id,
          code: data.code,
          source: "BROCHURE",
          source_session_id: data.sessionId,
          status: "DRAFT",
          production_status: "WAITING",
          delivery_status: "PENDING",
          total_vnd: data.totalAmount,
          paid_vnd: 0,
          balance_vnd: data.totalAmount,
          card_message: data.cardMessage ?? null,
          internal_note: data.note ?? null,
          delivery_window: {
            date: data.deliveryDate,
            timeSlot: "Trong ngày",
          },
          delivery_address: {
            recipientName: data.recipientName,
            phone: data.recipientPhone,
            street: data.deliveryAddress,
          },
          created_by: "customer-brochure",
          ...(data.snapshot
            ? {
                items: {
                  create: {
                    organization_id: data.organizationId,
                    product_id: data.snapshot.id,
                    quantity: 1,
                    unit_price_vnd: data.totalAmount,
                    description: data.snapshot.name,
                    metadata: data.snapshot as unknown as Prisma.InputJsonValue,
                  },
                },
              }
            : {}),
        },
      })

      // Update session
      await tx.greeting_sessions.update({
        where: { id: data.sessionId },
        data: {
          order_id: order.id,
          status: "ORDER_SUBMITTED",
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          product_snapshot: data.snapshot
            ? (data.snapshot as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          last_active_at: new Date(),
        },
      })

      // Create journey event
      await tx.greeting_journey_events.create({
        data: {
          organization_id: data.organizationId,
          session_id: data.sessionId,
          event_type: "ORDER_SUBMIT",
          metadata: {
            orderId: order.id,
            orderCode: order.code,
            amount: data.totalAmount,
          },
        },
      })

      return order
    })
  }

  async confirmPaymentTransaction(
    ctx: TenantContext,
    orderId: string,
    input: { reference?: string | null | undefined; note?: string | null | undefined }
  ) {
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
    })
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng Thẻ chào tương ứng")
    }

    const totalAmount = Number(order.total_vnd)

    return this.db.$transaction(async (tx) => {
      const payment = await tx.order_payments.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          kind: "BALANCE",
          amount_vnd: totalAmount,
          payment_method: "BANK_TRANSFER",
          reference: input.reference || `BROCHURE-${order.code}`,
          collected_by: ctx.userId || "admin",
          note: input.note || "Xác nhận chuyển khoản qua Thẻ chào",
        },
      })

      const updatedOrder = await tx.orders.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          production_status: "WAITING",
          paid_vnd: totalAmount,
          balance_vnd: 0,
        },
      })

      if (order.source_session_id) {
        await tx.greeting_sessions.update({
          where: { id: order.source_session_id },
          data: {
            status: "COMPLETED",
          },
        })

        await tx.greeting_journey_events.create({
          data: {
            organization_id: ctx.organizationId,
            session_id: order.source_session_id,
            event_type: "ADMIN_CONFIRMED_PAYMENT",
            metadata: {
              paymentId: payment.id,
              amount: totalAmount,
              confirmedBy: ctx.userId || "admin",
            },
          },
        })
      }

      return {
        orderId: updatedOrder.id,
        orderCode: updatedOrder.code,
        status: updatedOrder.status,
        paidVnd: Number(updatedOrder.paid_vnd),
        balanceVnd: Number(updatedOrder.balance_vnd),
      }
    })
  }

  async getTrackingOrderByCode(orderCode: string) {
    return this.db.orders.findFirst({
      where: {
        code: orderCode.trim().toUpperCase(),
      },
      include: {
        items: true,
        events: { orderBy: { created_at: "asc" } },
        qc_records: { orderBy: { created_at: "desc" }, take: 1 },
        greeting_sessions: true,
      },
    })
  }

  async updateBrochureOrderStatus(
    ctx: TenantContext,
    orderId: string,
    input: {
      production_status?: string
      delivery_status?: string
      internal_note_append?: string
      eventType: string
      eventMeta?: Record<string, unknown>
    }
  ) {
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
    })
    if (!order) throw new Error("Không tìm thấy đơn hàng Thẻ chào")

    return this.db.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          ...(input.production_status ? { production_status: input.production_status as any } : {}),
          ...(input.delivery_status ? { delivery_status: input.delivery_status as any } : {}),
          ...(input.internal_note_append
            ? { internal_note: [order.internal_note, input.internal_note_append].filter(Boolean).join("\n") }
            : {}),
        },
      })

      await tx.order_events.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          axis: input.delivery_status ? "delivery" : "production",
          to_value: input.production_status || input.delivery_status || "UPDATED",
          reason: input.eventType,
          ...(order.production_status ? { from_value: order.production_status } : {}),
          ...(ctx.userId ? { actor_id: ctx.userId } : {}),
        },
      })

      return { orderId: updated.id, orderCode: updated.code }
    })
  }

  async attachQcRecord(
    ctx: TenantContext,
    orderId: string,
    input: {
      imageAssetId: string
      eventType: string
      newProductionStatus?: string
      newDeliveryStatus?: string
      newOrderStatus?: string
    }
  ) {
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
    })
    if (!order) throw new Error("Không tìm thấy đơn hàng Thẻ chào")

    // Ảnh phải thuộc tenant: trang tra cứu công khai ký URL cho ảnh này.
    const asset = await this.db.assets.findFirst({
      where: scopedWhere(ctx, { id: input.imageAssetId }),
      select: { id: true },
    })
    if (!asset) throw new Error("Không tìm thấy ảnh")

    return this.db.$transaction(async (tx) => {
      await tx.order_qc_records.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          image_asset_ids: [input.imageAssetId] as unknown as Prisma.InputJsonValue,
          status: "PASSED" as any,
          notes: input.eventType,
          ...(ctx.userId ? { inspector_id: ctx.userId } : {}),
        },
      })

      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          ...(input.newProductionStatus ? { production_status: input.newProductionStatus as any } : {}),
          ...(input.newDeliveryStatus ? { delivery_status: input.newDeliveryStatus as any } : {}),
          ...(input.newOrderStatus ? { status: input.newOrderStatus as any } : {}),
        },
      })

      const fromValue = input.newProductionStatus
        ? order.production_status
        : order.delivery_status

      await tx.order_events.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          axis: input.newDeliveryStatus ? "delivery" : "production",
          to_value: input.newProductionStatus || input.newDeliveryStatus || "UPDATED",
          reason: input.eventType,
          ...(fromValue ? { from_value: fromValue } : {}),
          ...(ctx.userId ? { actor_id: ctx.userId } : {}),
        },
      })

      return { orderId: updated.id, orderCode: updated.code }
    })
  }
}
