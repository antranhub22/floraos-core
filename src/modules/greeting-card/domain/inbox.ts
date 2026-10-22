/**
 * Hộp việc: gom "cần làm", "tin nhắn", "cập nhật" của một người về một chỗ, theo vai.
 * Pure TypeScript — nhận dữ liệu đã đọc, không truy vấn.
 */
import type { MessageRole } from "./internal-message"
import type { TrackingPipelineStepId } from "./tracking-pipeline-types"
import type { InboxAction, InboxTab, PipelineLike } from "./inbox-types"
import { isDepositPendingApproval } from "./deposit-acknowledgement"

export type { InboxAction, InboxActionKind, InboxTab, PipelineLike } from "./inbox-types"

const TAB_OF_ROLE: Record<MessageRole, InboxTab> = { ADMIN: "payment", SALE: "sales", COORDINATOR: "coordinator" }
const COORDINATOR_STEPS = new Set<TrackingPipelineStepId>(["STEP_5_PAYMENT_CONFIRMED", "STEP_6_ARRANGING", "STEP_7_READY_QC", "STEP_8_DELIVERING", "STEP_9_COMPLETED"])
const code = (i: PipelineLike) => (i.orderCode ? `Đơn ${i.orderCode}` : `Link ${i.sendCode}`)

/** Việc cần làm của một vai từ quy trình theo dõi. */
export function inboxActions(items: PipelineLike[], role: MessageRole, userId: string): InboxAction[] {
  const out: InboxAction[] = []

  for (const i of items) {
    const isMySale = i.saleId === userId
    const isUnassignedSale = i.type === "ORDER" && (!i.saleId || i.saleId === "public") && i.currentStepId !== "STEP_9_COMPLETED"
    
    // Lọc theo vai trò: Sale chỉ nhận đơn của mình hoặc đơn chưa có người phụ trách
    if (role === "SALE" && !isMySale && !isUnassignedSale) continue
    // Đơn đã huỷ không sinh việc theo bước (khách báo chuyển khoản trước khi huỷ → việc riêng ở get-inbox)
    if (i.isCancelled) continue

    const base = { orderId: i.orderId ?? null, sessionId: i.sessionId || null, customerName: i.customerName, imageUrl: i.productImageUrl ?? null }

    if (i.stuck?.owner === role) {
      out.push({ ...base, id: `stuck:${i.id}`, kind: "STUCK", title: i.stuck.message, detail: `${code(i)} · ${i.productName}`, tab: TAB_OF_ROLE[role], urgency: 1000 + i.stuck.overdueMinutes })
      continue
    }

    const paid = i.paidVnd ?? 0
    const total = i.totalVnd
    const balance = i.balanceVnd ?? Math.max(0, total - paid)
    const hasDeposit = paid > 0 && balance > 0
    const isReady = (i.productionStatus === "READY" || i.currentStepId === "STEP_7_READY_QC") && i.currentStepId !== "STEP_3_FILLING_FORM" && i.currentStepId !== "STEP_4_PAYMENT_PENDING"
    const isDelivered = i.deliveryStatus === "DELIVERED" || i.currentStepId === "STEP_9_COMPLETED"
    const isReported = Boolean(i.customerReportedPaid || i.sessionStatus === "PAYMENT_REPORTED")
    // Đã giao mà còn nợ — kể cả đơn chưa thu đồng nào (PO 15/10/2026, mục 3)
    const deliveredWithDebt = i.type === "ORDER" && isDelivered && total > 0 && balance > 0

    // --- 1. NGHIỆP VỤ ĐIỀU HÀNH (ADMIN) ---
    if (role === "ADMIN") {
      // Điều phối đã nhận đơn khi sổ thu còn 0 đ — đơn đã qua bước 4 nên nhánh "Đối chiếu" bên dưới không bắt được
      const acceptedUnpaid = i.type === "ORDER" && isDepositPendingApproval({
        status: i.orderStatus ?? "", productionStatus: i.productionStatus, totalVnd: total, paidVnd: paid,
        customerReported: isReported || Boolean(i.paymentProofUrl),
      })
      if (acceptedUnpaid) {
        out.push({
          ...base, id: `accepted-unpaid:${i.id}`, kind: "CONFIRM_PAYMENT", title: "Điều phối đã nhận đơn — xác nhận tiền khách đã chuyển",
          detail: `${code(i)} · Khách đã báo chuyển khoản, sổ thu chưa ghi nhận đồng nào`, tab: "payment", urgency: 1300,
        })
      } else if (i.type === "ORDER" && hasDeposit && isReported) {
        out.push({
          ...base,
          id: `approve-balance-pay:${i.id}`,
          kind: "CONFIRM_PAYMENT",
          title: "Khách báo đã chuyển phần còn lại",
          detail: `${code(i)} · Cần xác nhận số tiền ${balance.toLocaleString("vi-VN")} đ`,
          tab: "payment",
          urgency: 1200,
        })
      } else if (i.type === "ORDER" && i.totalVnd <= 0 && i.currentStepId !== "STEP_9_COMPLETED") {
        out.push({ ...base, id: `quote:${i.id}`, kind: "QUOTE", title: "Báo giá mẫu chưa niêm yết", detail: `${code(i)} · ${i.productName}`, tab: "payment", urgency: 500 })
      } else if (i.currentStepId === "STEP_4_PAYMENT_PENDING") {
        out.push({ ...base, id: `pay:${i.id}`, kind: "CONFIRM_PAYMENT", title: "Đối chiếu và xác nhận tiền", detail: `${code(i)} · khách báo đã chuyển`, tab: "payment", urgency: 400 })
      } else if (deliveredWithDebt) {
        out.push({
          ...base,
          id: `collect-post-delivery:${i.id}`,
          kind: "COLLECT_POST_DELIVERY_BALANCE",
          title: "Thu phần tiền còn lại sau giao",
          detail: `${code(i)} · Còn nợ ${balance.toLocaleString("vi-VN")} đ`,
          tab: "payment",
          urgency: 420,
        })
      }
    }

    // --- 2. NGHIỆP VỤ SALE ---
    if (role === "SALE") {
      if (isUnassignedSale) {
        out.push(claimOrderAction(i))
      } else if (isMySale) {
        if (i.deliveryFailed && !isDelivered) {
          out.push({
            ...base,
            id: `delivery-failed-contact:${i.id}`,
            kind: "DELIVERY_FAILED_SALE_CONTACT",
            title: "Giao không thành công — Liên hệ lại người nhận",
            detail: `${code(i)} · Kiểm tra lại SĐT/địa chỉ để điều phối giao lại`,
            tab: "sales",
            urgency: 850,
          })
        } else if (i.type === "ORDER" && hasDeposit && isReady && !isDelivered) {
          out.push({
            ...base,
            id: `remind-second-pay:${i.id}`,
            kind: "REMIND_BALANCE_PAYMENT",
            title: "Nhắc khách xác nhận hoa & thanh toán lần 2",
            detail: `${code(i)} · Còn thiếu ${balance.toLocaleString("vi-VN")} đ để giao ship`,
            tab: "sales",
            urgency: 650,
          })
        } else if (i.type === "ORDER" && !hasDeposit && isReady && !isDelivered) {
          out.push({
            ...base,
            id: `send-photo-qc:${i.id}`,
            kind: "SEND_PHOTO_QC",
            title: "Gửi ảnh hoa thành phẩm cho khách duyệt",
            detail: `${code(i)} · Hoa đã cắm xong, gửi ảnh xác nhận trước khi giao`,
            tab: "sales",
            urgency: 620,
          })
        } else if (deliveredWithDebt) {
          out.push({
            ...base,
            id: `collect-post-delivery:${i.id}`,
            kind: "COLLECT_POST_DELIVERY_BALANCE",
            title: "Thu phần tiền còn lại sau giao",
            detail: `${code(i)} · Còn nợ ${balance.toLocaleString("vi-VN")} đ`,
            tab: "sales",
            urgency: 420,
          })
        } else if (i.type === "ORDER" && i.currentStepId === "STEP_3_FILLING_FORM" && total > 0 && paid === 0 && !isReported) {
          // Đơn đã gửi, đã có giá, khách chưa chuyển khoản — đơn chưa chuyển tiền luôn nằm ở bước 3
          out.push({
            ...base,
            id: `remind-deposit:${i.id}`,
            kind: "REMIND_DEPOSIT",
            title: "Nhắc khách chuyển khoản",
            detail: `${code(i)} · Khách đã đặt đơn, chưa chuyển khoản ${total.toLocaleString("vi-VN")} đ (cọc hoặc trả đủ)`,
            tab: "sales",
            urgency: 550,
          })
        } else if (i.type === "SESSION" && i.currentStepId === "STEP_3_FILLING_FORM") {
          out.push({
            ...base,
            id: `follow-up-lead:${i.id}`,
            kind: "FOLLOW_UP_LEAD",
            title: "Hỗ trợ khách đang điền form đặt hoa",
            detail: `${code(i)} · ${i.customerName} đang chọn mẫu/nhập đơn`,
            tab: "sales",
            urgency: 350,
          })
        }
      }
    }

    // --- 3. NGHIỆP VỤ ĐIỀU PHỐI (COORDINATOR) ---
    if (role === "COORDINATOR") {
      if (i.deliveryFailed) {
        out.push({
          ...base,
          id: `redeliver:${i.id}`,
          kind: "REDELIVER",
          title: "Giao không thành công — Hẹn giao lại",
          detail: `${code(i)} · ${i.productName} · Cần xếp tài xế hoặc đổi giờ giao`,
          tab: "coordinator",
          urgency: 950,
        })
      } else if (i.currentStepId === "STEP_5_PAYMENT_CONFIRMED" || (i.currentStepId === "STEP_4_PAYMENT_PENDING" && isReported)) {
        out.push({
          ...base,
          id: `assign:${i.id}`,
          kind: "ASSIGN",
          title: "Phân công thợ cắm hoa — Thẩm định nhận đơn",
          detail: `${code(i)} · ${i.productName} · Đã có bill chuyển khoản · Nhận đơn hoặc từ chối hoàn tiền`,
          tab: "coordinator",
          urgency: 750,
        })
      } else if (i.currentStepId === "STEP_6_ARRANGING" || i.productionStatus === "ARRANGING") {
        out.push({
          ...base,
          id: `check-arranging:${i.id}`,
          kind: "CHECK_ARRANGING_PROGRESS",
          title: "Theo dõi tiến độ thợ cắm hoa",
          detail: `${code(i)} · Xưởng đang cắm · Đôn đốc hoàn thành đúng giờ`,
          tab: "coordinator",
          urgency: 400,
        })
      } else if (isReady && !isDelivered) {
        if (i.productionStatus !== "READY") {
          out.push({
            ...base,
            id: `qc-inspect:${i.id}`,
            kind: "QC_INSPECTION",
            title: "Kiểm tra chất lượng (QC) & Chụp ảnh thành phẩm",
            detail: `${code(i)} · Thợ đã cắm xong, cần kiểm tra và tải ảnh QC`,
            tab: "coordinator",
            urgency: 720,
          })
        } else if (hasDeposit) {
          if (isReported) {
            out.push({
              ...base,
              id: `confirm-second-pay:${i.id}`,
              kind: "CONFIRM_PAYMENT",
              title: "Khách đã chuyển tiền Lần 2 — Xác nhận để giao hoa",
              detail: `${code(i)} · Đã có bill CK lần 2 · Cần xác nhận ${balance.toLocaleString("vi-VN")} đ để mở Giao Ship`,
              tab: "coordinator",
              urgency: 920,
            })
          } else {
            out.push({
              ...base,
              id: `wait-second-pay:${i.id}`,
              kind: "WAITING_SECOND_PAYMENT",
              title: "Chờ khách thanh toán lần 2 để giao hoa",
              detail: `${code(i)} · Đã có ảnh thành phẩm, còn nợ ${balance.toLocaleString("vi-VN")} đ`,
              tab: "coordinator",
              urgency: 280,
            })
          }
        } else {
          out.push({
            ...base,
            id: `assign-shipper:${i.id}`,
            kind: "ASSIGN_SHIPPER",
            title: "Sẵn sàng giao — Điều phối tài xế / Shipper",
            detail: `${code(i)} · Đã hoàn thiện, cần gán tài xế xuất giao`,
            tab: "coordinator",
            urgency: 680,
          })
        }
      }
    }
  }

  return out.sort((a, b) => b.urgency - a.urgency)
}

/** Việc "nhận đơn" cho Sale khi đơn chưa có Sale phụ trách — dùng chung cho bảng theo dõi và đơn ngoài phạm vi xem. */
export function claimOrderAction(i: Pick<PipelineLike, "id" | "orderId" | "sessionId" | "orderCode" | "sendCode" | "customerName" | "productName" | "productImageUrl">): InboxAction {
  return {
    orderId: i.orderId ?? null, sessionId: i.sessionId || null, customerName: i.customerName, imageUrl: i.productImageUrl ?? null,
    id: `claim-order:${i.id}`, kind: "CLAIM_ORDER", title: "Tiếp nhận đơn mới chưa có Sale phụ trách",
    detail: `${i.orderCode ? `Đơn ${i.orderCode}` : `Link ${i.sendCode}`} · ${i.customerName} · ${i.productName}`, tab: "sales", urgency: 700,
  }
}

/** Đơn đổi bước trong `hours` giờ gần nhất mà người này cần biết. */
export function inboxUpdates(items: PipelineLike[], role: MessageRole, userId: string, now: Date, hours = 24): PipelineLike[] {
  const since = now.getTime() - hours * 3_600_000
  const relevant = (i: PipelineLike) =>
    role === "SALE" ? i.saleId === userId : role === "COORDINATOR" ? i.type === "ORDER" && COORDINATOR_STEPS.has(i.currentStepId) : i.type === "ORDER"
  return items
    .filter((i) => relevant(i) && Date.parse(i.stepStartedAt) >= since)
    .sort((a, b) => Date.parse(b.stepStartedAt) - Date.parse(a.stepStartedAt))
    .slice(0, 20)
}
