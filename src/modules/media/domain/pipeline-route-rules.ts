/**
 * Quy tắc phân nhánh và điều kiện cổng của Dual-Phase Inline Pipeline
 *
 * Route A (Raw Input):
 *   - Nhận ảnh thô / text thô trực tiếp
 *   - Bắt buộc qua Phase 1 (AI Pre-processing: taxonomy, component counts, OCR)
 *   - Bắt buộc qua Cổng kiểm định (Identity Guard M04a / Subject Integrity M04b)
 *   - Chặn tuyệt đối nếu kết quả là REJECTED
 *
 * Route B (Pre-structured Input):
 *   - Sử dụng tài sản Master / bản ghi Product Master đã kiểm định từ trước
 *   - Bỏ qua Phase 1
 *   - Bỏ qua Cổng kiểm định (đã đạt trước đó)
 *   - Thực thi thẳng Phase 2 (Business Logic)
 *
 * Tệp thuần — không import hạ tầng hay Prisma, bảo đảm test độc lập.
 */

import type { GuardResult } from "./optimization-rules"

export type PipelineRouteType = "ROUTE_A_RAW" | "ROUTE_B_PRESTRUCTURED"

export interface PipelineExecutionGate {
  readonly route: PipelineRouteType
  readonly requiresPreprocess: boolean
  readonly requiresIdentityGate: boolean
  readonly canProceedToExecution: boolean
  readonly rejectionReason?: string | undefined
}

/**
 * Đánh giá điều kiện để một payload đầu vào được phép tiến vào Phase 2 (Execution).
 */
export function evaluatePipelineGate(params: {
  route: PipelineRouteType
  hasRawInput: boolean
  hasStructuredAsset: boolean
  preprocessCompleted?: boolean | undefined
  identityGateResult?: GuardResult | undefined
}): PipelineExecutionGate {
  const { route, hasRawInput, hasStructuredAsset, preprocessCompleted, identityGateResult } = params

  if (route === "ROUTE_B_PRESTRUCTURED") {
    if (!hasStructuredAsset) {
      return {
        route,
        requiresPreprocess: false,
        requiresIdentityGate: false,
        canProceedToExecution: false,
        rejectionReason: "Route B yêu cầu phải chọn tài sản Master hoặc Product Master hợp lệ",
      }
    }

    return {
      route,
      requiresPreprocess: false,
      requiresIdentityGate: false,
      canProceedToExecution: true,
    }
  }

  // Route A: Raw Input
  if (!hasRawInput) {
    return {
      route,
      requiresPreprocess: true,
      requiresIdentityGate: true,
      canProceedToExecution: false,
      rejectionReason: "Route A yêu cầu phải có dữ liệu thô (ảnh chụp hoặc chuỗi văn bản)",
    }
  }

  if (!preprocessCompleted) {
    return {
      route,
      requiresPreprocess: true,
      requiresIdentityGate: true,
      canProceedToExecution: false,
      rejectionReason: "Chưa hoàn thành bước tiền xử lý bóc tách đặc tính AI (Phase 1)",
    }
  }

  if (identityGateResult === "REJECTED") {
    return {
      route,
      requiresPreprocess: true,
      requiresIdentityGate: true,
      canProceedToExecution: false,
      rejectionReason: "Cổng kiểm định Identity Guard đã từ chối sản phẩm này — vi phạm tính toàn vẹn chủ thể",
    }
  }

  if (!identityGateResult) {
    return {
      route,
      requiresPreprocess: true,
      requiresIdentityGate: true,
      canProceedToExecution: false,
      rejectionReason: "Chưa có kết quả đánh giá từ Cổng kiểm định Identity Guard",
    }
  }

  return {
    route,
    requiresPreprocess: true,
    requiresIdentityGate: true,
    canProceedToExecution: true,
  }
}
