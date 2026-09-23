import { describe, it, expect } from "vitest"
import {
  evaluatePipelineGate,
  type PipelineRouteType,
} from "@/modules/media/domain/pipeline-route-rules"

describe("Dual-Phase Inline Pipeline Domain Rules", () => {
  describe("Route B: Pre-structured Input", () => {
    it("cho phép thực thi ngay khi có tài sản Master hợp lệ (bỏ qua Phase 1 & Guard)", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_B_PRESTRUCTURED",
        hasRawInput: false,
        hasStructuredAsset: true,
      })

      expect(gate.requiresPreprocess).toBe(false)
      expect(gate.requiresIdentityGate).toBe(false)
      expect(gate.canProceedToExecution).toBe(true)
      expect(gate.rejectionReason).toBeUndefined()
    })

    it("từ chối thực thi nếu không có tài sản Master nào được chọn", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_B_PRESTRUCTURED",
        hasRawInput: false,
        hasStructuredAsset: false,
      })

      expect(gate.canProceedToExecution).toBe(false)
      expect(gate.rejectionReason).toContain("Route B yêu cầu phải chọn tài sản Master")
    })
  })

  describe("Route A: Raw Input", () => {
    it("từ chối thực thi khi chưa có dữ liệu đầu vào thô", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_A_RAW",
        hasRawInput: false,
        hasStructuredAsset: false,
      })

      expect(gate.requiresPreprocess).toBe(true)
      expect(gate.requiresIdentityGate).toBe(true)
      expect(gate.canProceedToExecution).toBe(false)
      expect(gate.rejectionReason).toContain("Route A yêu cầu phải có dữ liệu thô")
    })

    it("chặn khi chưa hoàn thành bước tiền xử lý bóc tách Phase 1", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_A_RAW",
        hasRawInput: true,
        hasStructuredAsset: false,
        preprocessCompleted: false,
      })

      expect(gate.canProceedToExecution).toBe(false)
      expect(gate.rejectionReason).toContain("Chưa hoàn thành bước tiền xử lý")
    })

    it("chặn tuyệt đối khi Identity Guard trả về REJECTED", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_A_RAW",
        hasRawInput: true,
        hasStructuredAsset: false,
        preprocessCompleted: true,
        identityGateResult: "REJECTED",
      })

      expect(gate.canProceedToExecution).toBe(false)
      expect(gate.rejectionReason).toContain("Cổng kiểm định Identity Guard đã từ chối")
    })

    it("chặn khi chưa có kết quả đánh giá từ Identity Guard", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_A_RAW",
        hasRawInput: true,
        hasStructuredAsset: false,
        preprocessCompleted: true,
        identityGateResult: undefined,
      })

      expect(gate.canProceedToExecution).toBe(false)
      expect(gate.rejectionReason).toContain("Chưa có kết quả đánh giá")
    })

    it("cho phép thực thi Phase 2 khi tiền xử lý xong và Identity Guard SAFE", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_A_RAW",
        hasRawInput: true,
        hasStructuredAsset: false,
        preprocessCompleted: true,
        identityGateResult: "SAFE",
      })

      expect(gate.requiresPreprocess).toBe(true)
      expect(gate.requiresIdentityGate).toBe(true)
      expect(gate.canProceedToExecution).toBe(true)
      expect(gate.rejectionReason).toBeUndefined()
    })

    it("cho phép thực thi Phase 2 khi tiền xử lý xong và Identity Guard WARNING (kèm cảnh báo)", () => {
      const gate = evaluatePipelineGate({
        route: "ROUTE_A_RAW",
        hasRawInput: true,
        hasStructuredAsset: false,
        preprocessCompleted: true,
        identityGateResult: "WARNING",
      })

      expect(gate.canProceedToExecution).toBe(true)
      expect(gate.rejectionReason).toBeUndefined()
    })
  })
})
