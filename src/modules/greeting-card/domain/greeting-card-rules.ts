/**
 * Domain rules and logic for Greeting Card / Swipe Brochure.
 * Pure TypeScript — No Prisma, No external I/O.
 */

import type {
  GreetingSessionStatus,
  ProductSnapshot,
  GreetingCatalogProduct,
  CustomerOrderSubmitInput,
} from "./greeting-card-types"

export const SEND_CODE_REGEX = /^[A-Z0-9]{2,6}-[0-9]{3,6}$/

export function generateSendCode(sequence: number, prefix = "T01"): string {
  const padded = String(Math.max(1, sequence)).padStart(3, "0")
  return `${prefix.toUpperCase()}-${padded}`
}

export function validateSendCode(code: string): boolean {
  if (!code || typeof code !== "string") return false
  return SEND_CODE_REGEX.test(code.trim().toUpperCase())
}

export function createProductSnapshot(
  product: GreetingCatalogProduct,
  timestamp: string = new Date().toISOString()
): ProductSnapshot {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    description: product.description ?? null,
    flowersSummary: product.flowersSummary ?? null,
    selectedAt: timestamp,
  }
}

export const VALID_SESSION_TRANSITIONS: Record<GreetingSessionStatus, GreetingSessionStatus[]> = {
  CREATED: ["OPENED", "BROWSING"],
  OPENED: ["BROWSING", "SELECTED"],
  BROWSING: ["SELECTED", "BROWSING"],
  SELECTED: ["BROWSING", "ORDER_SUBMITTED"],
  ORDER_SUBMITTED: ["PAYMENT_REPORTED", "COMPLETED"],
  PAYMENT_REPORTED: ["COMPLETED"],
  COMPLETED: [],
}

export function canTransitionSessionStatus(
  current: GreetingSessionStatus,
  target: GreetingSessionStatus
): boolean {
  if (current === target) return true
  const allowed = VALID_SESSION_TRANSITIONS[current] || []
  return allowed.includes(target)
}

export function validateCustomerOrderInput(input: CustomerOrderSubmitInput): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  if (!input.customerName?.trim()) {
    errors.customerName = "Vui lòng nhập họ tên người đặt hoa"
  }

  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
  const cleanPhone = (input.customerPhone || "").replace(/\s+/g, "")
  if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
    errors.customerPhone = "Số điện thoại người đặt không hợp lệ (10 số)"
  }

  if (!input.recipientName?.trim()) {
    errors.recipientName = "Vui lòng nhập họ tên người nhận hoa"
  }

  const cleanRecipientPhone = (input.recipientPhone || "").replace(/\s+/g, "")
  if (!cleanRecipientPhone || !phoneRegex.test(cleanRecipientPhone)) {
    errors.recipientPhone = "Số điện thoại người nhận không hợp lệ (10 số)"
  }

  if (!input.deliveryDate?.trim()) {
    errors.deliveryDate = "Vui lòng chọn ngày giao hoa"
  }

  if (!input.deliveryAddress?.trim() || input.deliveryAddress.trim().length < 5) {
    errors.deliveryAddress = "Vui lòng nhập địa chỉ giao hoa chi tiết (tối thiểu 5 ký tự)"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function mapOrderStatusToTrackingStep(
  orderStatus: string,
  productionStatus: string,
  deliveryStatus: string
): {
  stepIndex: number
  title: string
  description: string
  percentage: number
} {
  if (orderStatus === "CANCELLED") {
    return {
      stepIndex: -1,
      title: "Đơn hàng đã hủy",
      description: "Đơn hàng này đã được hủy bởi cửa hàng.",
      percentage: 0,
    }
  }

  if (deliveryStatus === "DELIVERED" || orderStatus === "COMPLETED") {
    return {
      stepIndex: 4,
      title: "Giao hoa thành công",
      description: "Đơn hoa đã được trao tận tay người nhận với tình cảm trọn vẹn.",
      percentage: 100,
    }
  }

  if (deliveryStatus === "DELIVERING" || deliveryStatus === "DISPATCHED") {
    return {
      stepIndex: 3,
      title: "Đang trên đường giao hoa",
      description: "Shipper đang cẩn thận vận chuyển bình/bó hoa đến địa chỉ nhận.",
      percentage: 75,
    }
  }

  if (productionStatus === "READY" || productionStatus === "ARRANGING") {
    return {
      stepIndex: 2,
      title: productionStatus === "READY" ? "Hoa đã cắm xong" : "Nghệ nhân đang cắm hoa",
      description:
        productionStatus === "READY"
          ? "Bình hoa hoàn thiện đã qua kiểm duyệt chất lượng và sẵn sàng giao."
          : "Florist đang tỉ mỉ lựa chọn từng cành hoa tươi và phối mẫu theo yêu cầu.",
      percentage: 50,
    }
  }

  return {
    stepIndex: 1,
    title: "Đã tiếp nhận đơn hàng",
    description: "Cửa hàng đã nhận thông tin đặt hoa và đang chuẩn bị nguyên liệu.",
    percentage: 25,
  }
}
