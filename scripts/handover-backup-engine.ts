/**
 * CÔNG CỤ DỰ PHÒNG & KHÔI PHỤC BÀN GIAO SẠCH (HANDOVER BACKUP & DISASTER RECOVERY ENGINE)
 *
 * Chức năng:
 *   1. Tự động Snapshot Dump toàn bộ dữ liệu giao dịch ra tệp JSON trước khi xóa.
 *   2. Khôi phục (Disaster Recovery) lại 100% dữ liệu nếu có sự cố chạy nhầm.
 */

import fs from "node:fs"
import path from "node:path"
import type { Prisma, PrismaClient } from "@/generated/prisma/client"

export interface TenantBackupData {
  version: "1.0"
  organization_id: string
  slug: string
  created_at: string
  data: {
    orders: Record<string, unknown>[]
    order_items: Record<string, unknown>[]
    order_payments: Record<string, unknown>[]
    order_events: Record<string, unknown>[]
    order_assignments: Record<string, unknown>[]
    order_coordinations: Record<string, unknown>[]
    order_qc_records: Record<string, unknown>[]
    order_exceptions: Record<string, unknown>[]
    order_info_requests: Record<string, unknown>[]
    order_change_requests: Record<string, unknown>[]
    greeting_sessions: Record<string, unknown>[]
    greeting_journey_events: Record<string, unknown>[]
    greeting_messages: Record<string, unknown>[]
    greeting_message_reads: Record<string, unknown>[]
    greeting_notifications: Record<string, unknown>[]
    greeting_payment_events: Record<string, unknown>[]
  }
}

export async function createTenantHandoverBackup(
  prisma: PrismaClient,
  orgId: string,
  slug: string
): Promise<string> {
  const backupDir = path.resolve(process.cwd(), "backups")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const [
    orders,
    orderItems,
    orderPayments,
    orderEvents,
    orderAssignments,
    orderCoordinations,
    orderQcRecords,
    orderExceptions,
    orderInfoRequests,
    orderChangeRequests,
    greetingSessions,
    greetingJourneyEvents,
    greetingMessages,
    greetingMessageReads,
    greetingNotifications,
    greetingPaymentEvents,
  ] = await Promise.all([
    prisma.orders.findMany({ where: { organization_id: orgId } }),
    prisma.order_items.findMany({ where: { organization_id: orgId } }),
    prisma.order_payments.findMany({ where: { organization_id: orgId } }),
    prisma.order_events.findMany({ where: { organization_id: orgId } }),
    prisma.order_assignments.findMany({ where: { organization_id: orgId } }),
    prisma.order_coordinations.findMany({ where: { organization_id: orgId } }),
    prisma.order_qc_records.findMany({ where: { organization_id: orgId } }),
    prisma.order_exceptions.findMany({ where: { organization_id: orgId } }),
    prisma.order_info_requests.findMany({ where: { organization_id: orgId } }),
    prisma.order_change_requests.findMany({ where: { organization_id: orgId } }),
    prisma.greeting_sessions.findMany({ where: { organization_id: orgId } }),
    prisma.greeting_journey_events.findMany({ where: { organization_id: orgId } }),
    prisma.greeting_messages.findMany({ where: { organization_id: orgId } }),
    prisma.greeting_message_reads.findMany({ where: { organization_id: orgId } }),
    prisma.greeting_notifications.findMany({ where: { organization_id: orgId } }),
    prisma.greeting_payment_events.findMany({ where: { organization_id: orgId } }),
  ])

  const payload: TenantBackupData = {
    version: "1.0",
    organization_id: orgId,
    slug,
    created_at: new Date().toISOString(),
    data: {
      orders: orders as unknown as Record<string, unknown>[],
      order_items: orderItems as unknown as Record<string, unknown>[],
      order_payments: orderPayments as unknown as Record<string, unknown>[],
      order_events: orderEvents as unknown as Record<string, unknown>[],
      order_assignments: orderAssignments as unknown as Record<string, unknown>[],
      order_coordinations: orderCoordinations as unknown as Record<string, unknown>[],
      order_qc_records: orderQcRecords as unknown as Record<string, unknown>[],
      order_exceptions: orderExceptions as unknown as Record<string, unknown>[],
      order_info_requests: orderInfoRequests as unknown as Record<string, unknown>[],
      order_change_requests: orderChangeRequests as unknown as Record<string, unknown>[],
      greeting_sessions: greetingSessions as unknown as Record<string, unknown>[],
      greeting_journey_events: greetingJourneyEvents as unknown as Record<string, unknown>[],
      greeting_messages: greetingMessages as unknown as Record<string, unknown>[],
      greeting_message_reads: greetingMessageReads as unknown as Record<string, unknown>[],
      greeting_notifications: greetingNotifications as unknown as Record<string, unknown>[],
      greeting_payment_events: greetingPaymentEvents as unknown as Record<string, unknown>[],
    },
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const fileName = `snapshot-${slug}-${timestamp}.json`
  const filePath = path.join(backupDir, fileName)

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8")
  return filePath
}

export async function restoreTenantHandoverBackup(
  prisma: PrismaClient,
  filePath: string
): Promise<{ restoredOrders: number; restoredSessions: number }> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file sao lưu: ${filePath}`)
  }

  const raw = fs.readFileSync(filePath, "utf-8")
  const backup = JSON.parse(raw) as TenantBackupData
  const { data } = backup

  await prisma.$transaction(
    async (tx) => {
      // 1. Nạp lại orders
      for (const order of data.orders) {
        await tx.orders.create({ data: order as unknown as Prisma.ordersUncheckedCreateInput })
      }
      // 2. Nạp lại order_items
      for (const item of data.order_items) {
        await tx.order_items.create({ data: item as unknown as Prisma.order_itemsUncheckedCreateInput })
      }
      // 3. Nạp lại order_assignments & order_events
      for (const assign of data.order_assignments) {
        await tx.order_assignments.create({ data: assign as unknown as Prisma.order_assignmentsUncheckedCreateInput })
      }
      for (const evt of data.order_events) {
        await tx.order_events.create({ data: evt as unknown as Prisma.order_eventsUncheckedCreateInput })
      }
      // 4. Nạp lại order_payments & order_coordinations
      for (const payment of data.order_payments) {
        await tx.order_payments.create({ data: payment as unknown as Prisma.order_paymentsUncheckedCreateInput })
      }
      for (const coord of data.order_coordinations) {
        await tx.order_coordinations.create({ data: coord as unknown as Prisma.order_coordinationsUncheckedCreateInput })
      }
      // 5. Nạp lại QC, ngoại lệ, info requests, change requests
      for (const qc of data.order_qc_records) {
        await tx.order_qc_records.create({ data: qc as unknown as Prisma.order_qc_recordsUncheckedCreateInput })
      }
      for (const exc of data.order_exceptions) {
        await tx.order_exceptions.create({ data: exc as unknown as Prisma.order_exceptionsUncheckedCreateInput })
      }
      for (const info of data.order_info_requests) {
        await tx.order_info_requests.create({ data: info as unknown as Prisma.order_info_requestsUncheckedCreateInput })
      }
      for (const chg of data.order_change_requests) {
        await tx.order_change_requests.create({ data: chg as unknown as Prisma.order_change_requestsUncheckedCreateInput })
      }
      // 6. Nạp lại greeting_sessions
      for (const session of data.greeting_sessions) {
        await tx.greeting_sessions.create({ data: session as unknown as Prisma.greeting_sessionsUncheckedCreateInput })
      }
      // 7. Nạp lại phụ thuộc Thẻ Chào
      for (const journey of data.greeting_journey_events) {
        await tx.greeting_journey_events.create({ data: journey as unknown as Prisma.greeting_journey_eventsUncheckedCreateInput })
      }
      for (const msg of data.greeting_messages) {
        await tx.greeting_messages.create({ data: msg as unknown as Prisma.greeting_messagesUncheckedCreateInput })
      }
      for (const read of data.greeting_message_reads) {
        await tx.greeting_message_reads.create({ data: read as unknown as Prisma.greeting_message_readsUncheckedCreateInput })
      }
      for (const notif of data.greeting_notifications) {
        await tx.greeting_notifications.create({ data: notif as unknown as Prisma.greeting_notificationsUncheckedCreateInput })
      }
      for (const payEvt of data.greeting_payment_events) {
        await tx.greeting_payment_events.create({ data: payEvt as unknown as Prisma.greeting_payment_eventsUncheckedCreateInput })
      }
    },
    { timeout: 60000 }
  )

  return {
    restoredOrders: data.orders.length,
    restoredSessions: data.greeting_sessions.length,
  }
}
