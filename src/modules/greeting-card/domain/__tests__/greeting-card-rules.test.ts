import { describe, it, expect } from "vitest"
import {
  generateSendCode,
  validateSendCode,
  createProductSnapshot,
  canTransitionSessionStatus,
  validateCustomerOrderInput,
  mapOrderStatusToTrackingStep,
} from "../greeting-card-rules"

describe("Greeting Card Domain Rules", () => {
  describe("generateSendCode", () => {
    it("should format sequence correctly with 3 digits padding", () => {
      expect(generateSendCode(1, "T01")).toBe("T01-001")
      expect(generateSendCode(37, "T01")).toBe("T01-037")
      expect(generateSendCode(105, "SIIN")).toBe("SIIN-105")
    })
  })

  describe("validateSendCode", () => {
    it("should accept valid send codes", () => {
      expect(validateSendCode("T01-037")).toBe(true)
      expect(validateSendCode("SIIN-001")).toBe(true)
    })

    it("should reject invalid format", () => {
      expect(validateSendCode("")).toBe(false)
      expect(validateSendCode("invalid")).toBe(false)
      expect(validateSendCode("T-1")).toBe(false)
    })
  })

  describe("createProductSnapshot", () => {
    it("should freeze product data into snapshot", () => {
      const mockProduct = {
        id: "prod-1",
        code: "HOA-001",
        name: "Bó Hồng Pastel",
        price: 850000,
        imageUrl: "/sample.jpg",
        description: "Hoa hồng Ecuador",
        sortOrder: 1,
      }
      const snapshot = createProductSnapshot(mockProduct, "2026-10-03T10:00:00Z")
      expect(snapshot.id).toBe("prod-1")
      expect(snapshot.price).toBe(850000)
      expect(snapshot.selectedAt).toBe("2026-10-03T10:00:00Z")
    })
  })

  describe("canTransitionSessionStatus", () => {
    it("should allow valid transitions", () => {
      expect(canTransitionSessionStatus("CREATED", "OPENED")).toBe(true)
      expect(canTransitionSessionStatus("OPENED", "SELECTED")).toBe(true)
      expect(canTransitionSessionStatus("SELECTED", "ORDER_SUBMITTED")).toBe(true)
      expect(canTransitionSessionStatus("ORDER_SUBMITTED", "PAYMENT_REPORTED")).toBe(true)
    })

    it("should disallow invalid jumps", () => {
      expect(canTransitionSessionStatus("CREATED", "COMPLETED")).toBe(false)
      expect(canTransitionSessionStatus("COMPLETED", "OPENED")).toBe(false)
    })
  })

  describe("validateCustomerOrderInput", () => {
    it("should validate complete input successfully", () => {
      const result = validateCustomerOrderInput({
        customerName: "Nguyễn Văn A",
        customerPhone: "0901234567",
        recipientName: "Trần Thị B",
        recipientPhone: "0912345678",
        deliveryDate: "2026-10-20",
        deliveryAddress: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
      })
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it("should catch missing fields and invalid phone numbers", () => {
      const result = validateCustomerOrderInput({
        customerName: "",
        customerPhone: "123",
        recipientName: "",
        recipientPhone: "invalid",
        deliveryDate: "",
        deliveryAddress: "abc",
      })
      expect(result.valid).toBe(false)
      expect(result.errors.customerName).toBeDefined()
      expect(result.errors.customerPhone).toBeDefined()
      expect(result.errors.recipientName).toBeDefined()
      expect(result.errors.deliveryDate).toBeDefined()
      expect(result.errors.deliveryAddress).toBeDefined()
    })
  })

  describe("mapOrderStatusToTrackingStep", () => {
    it("should map delivered status to step 4", () => {
      const step = mapOrderStatusToTrackingStep("COMPLETED", "READY", "DELIVERED")
      expect(step.stepIndex).toBe(4)
      expect(step.percentage).toBe(100)
    })

    it("should map arranging status to step 2", () => {
      const step = mapOrderStatusToTrackingStep("PROCESSING", "ARRANGING", "PENDING")
      expect(step.stepIndex).toBe(2)
      expect(step.percentage).toBe(50)
    })
  })
})
