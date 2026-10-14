import { prisma } from "@/core/tenancy/infra/prisma"

/**
 * Truy vấn của bộ quét nền — chạy KHÔNG có phiên người dùng, xuyên tổ chức; mọi thao tác ghi
 * phía sau đều mang `organization_id` lấy từ chính bản ghi. An toàn khi nhiều instance cùng chạy:
 * mỗi bước ghi là một `updateMany` có điều kiện (chỉ một bên thắng), không khoá toàn cục.
 */
export class BackgroundSweepRepository {
  constructor(private readonly db = prisma) {}

  /** Tin kẹt SENDING quá `before` → FAILED (để vòng sau gửi lại). */
  async failStaleSending(before: Date): Promise<number> {
    const res = await this.db.greeting_notifications.updateMany({
      where: { status: "SENDING", updated_at: { lt: before } },
      data: { status: "FAILED", error: "Hết thời gian gửi (tiến trình bị dừng giữa chừng)" },
    })
    return res.count
  }

  /** Tin lỗi đến lượt gửi lại: lần thử cuối trước `retryBefore`, mốc tạo sau `windowStart`. */
  async listRetryable(retryBefore: Date, windowStart: Date, take = 100) {
    return this.db.greeting_notifications.findMany({
      where: { status: "FAILED", updated_at: { lt: retryBefore }, created_at: { gte: windowStart } },
      select: { organization_id: true, order_id: true, event_key: true },
      orderBy: { updated_at: "asc" },
      take,
    })
  }

  /** Đơn Thẻ chào còn chờ chuyển khoản lần đầu (DRAFT, chưa thu, đã có giá) trong `since`. */
  async listUnpaidDrafts(since: Date, take = 500) {
    return this.db.orders.findMany({
      where: { source: "BROCHURE", status: "DRAFT", paid_vnd: 0, total_vnd: { gt: 0 }, created_at: { gte: since } },
      select: {
        id: true, organization_id: true, created_at: true, total_vnd: true, paid_vnd: true, status: true, pricing_rule_ref: true,
        organization: { select: { settings: true } },
        greeting_sessions: { take: 1, select: { status: true, catalog: { select: { filters: true } } } },
      },
      orderBy: { created_at: "asc" },
      take,
    })
  }

  /** Phiên Thẻ chào chưa có đơn, chưa thu hồi trong `since` để kiểm tra quá hạn mở link hoặc quá hạn chọn mẫu. */
  async listPendingSessions(since: Date, take = 500) {
    return this.db.greeting_sessions.findMany({
      where: {
        order_id: null,
        revoked_at: null,
        created_at: { gte: since },
      },
      select: {
        id: true,
        organization_id: true,
        send_code: true,
        status: true,
        opened_at: true,
        selected_at: true,
        last_active_at: true,
        created_at: true,
        organization: { select: { settings: true } },
        catalog: { select: { filters: true } },
      },
      orderBy: { created_at: "asc" },
      take,
    })
  }

  /** Thu hồi / vô hiệu phiên quá hạn và ghi vết sự kiện hành trình. */
  async expireSession(organizationId: string, sessionId: string, reason: string, now = new Date()): Promise<void> {
    await this.db.$transaction([
      this.db.greeting_sessions.update({
        where: { id: sessionId },
        data: {
          revoked_at: now,
          expires_at: now,
          revoked_by: "system:timeout-sweep",
        },
      }),
      this.db.greeting_journey_events.create({
        data: {
          organization_id: organizationId,
          session_id: sessionId,
          event_type: "INTERNAL_NOTE",
          metadata: { note: reason, action: "EXPIRE_SESSION", expiredAt: now.toISOString() },
        },
      }),
    ])
  }

  /**
   * Đơn Thẻ chào chưa thu đồng nào mà khách đã báo chuyển khoản kèm ảnh bill từ trước `before`,
   * kèm cài đặt tiệm và trạng thái đối soát AI của bill — bước quét chỉ tự duyệt khi tiệm bật.
   */
  async listPendingPaymentProofOrders(before: Date, take = 100) {
    const orders = await this.db.orders.findMany({
      where: {
        source: "BROCHURE",
        status: "DRAFT",
        paid_vnd: 0,
        total_vnd: { gt: 0 },
        greeting_sessions: {
          some: { status: "PAYMENT_REPORTED", payment_proof_asset_id: { not: null }, updated_at: { lte: before } },
        },
      },
      select: {
        id: true,
        organization_id: true,
        organization: { select: { settings: true } },
        greeting_sessions: {
          where: { status: "PAYMENT_REPORTED", payment_proof_asset_id: { not: null } },
          select: { payment_proof_asset_id: true, updated_at: true },
          take: 1,
        },
      },
      take,
    })
    const proofIds = orders.flatMap((o) => o.greeting_sessions.map((s) => s.payment_proof_asset_id ?? ""))
    const assets = proofIds.length
      ? await this.db.assets.findMany({ where: { id: { in: proofIds } }, select: { id: true, organization_id: true, metadata: true } })
      : []
    return orders.map((o) => {
      const session = o.greeting_sessions[0]
      const asset = assets.find((a) => a.id === session?.payment_proof_asset_id && a.organization_id === o.organization_id)
      const analysis = (asset?.metadata as { ai_analysis?: { status?: unknown } } | null)?.ai_analysis
      return {
        id: o.id,
        organizationId: o.organization_id,
        settings: o.organization.settings,
        reportedAt: session?.updated_at ?? null,
        analysisStatus: typeof analysis?.status === "string" ? analysis.status : null,
      }
    })
  }
}
