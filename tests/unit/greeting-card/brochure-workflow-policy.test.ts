import { describe, it, expect } from "vitest"
import {
  BROCHURE_WORKFLOW_POLICY_KEY,
  LEAN_WORKFLOW_POLICY,
  STANDARD_WORKFLOW_POLICY,
  STRICT_WORKFLOW_POLICY,
  parseBrochureWorkflowPolicy,
  serializeWorkflowPolicy,
  detectWorkflowPreset,
  isUrgentOrder,
  canRoleApproveDeposit,
  shouldRequireCoordinatorAcceptance,
  canBypassFinishedPhoto,
  shouldBlockDispatchForBalance,
  type BrochureWorkflowPolicy,
} from "@/modules/greeting-card/domain/brochure-workflow-policy"

describe("Brochure Workflow Policy Domain Tests", () => {
  describe("Presets and Defaults", () => {
    it("returns STANDARD_WORKFLOW_POLICY when settings is empty or null", () => {
      expect(parseBrochureWorkflowPolicy(null)).toEqual(STANDARD_WORKFLOW_POLICY)
      expect(parseBrochureWorkflowPolicy({})).toEqual(STANDARD_WORKFLOW_POLICY)
    })

    it("migrates smartly from legacy brochure_policy if present", () => {
      const legacySettings = {
        brochure_policy: {
          tracking_trigger_policy: "PAYMENT_ONLY",
          require_product_photo_qc: false,
          require_full_before_dispatch: false,
          require_recipient_photo: false,
        },
      }
      const policy = parseBrochureWorkflowPolicy(legacySettings)
      expect(policy.requireAdminDepositApproval).toBe(true)
      expect(policy.requireCoordinatorAcceptance).toBe(false)
      expect(policy.requireFinishedPhoto).toBe(false)
      expect(policy.customerApprovalMode).toBe("BYPASS")
      expect(policy.requireFullPaymentBeforeDispatch).toBe(false)
      expect(policy.preset).toBe("CUSTOM")
    })

    it("parses LEAN preset accurately", () => {
      const payload = {
        [BROCHURE_WORKFLOW_POLICY_KEY]: serializeWorkflowPolicy(LEAN_WORKFLOW_POLICY),
      }
      const policy = parseBrochureWorkflowPolicy(payload)
      expect(policy).toEqual(LEAN_WORKFLOW_POLICY)
      expect(policy.preset).toBe("LEAN")
    })

    it("parses STRICT preset accurately", () => {
      const payload = {
        [BROCHURE_WORKFLOW_POLICY_KEY]: serializeWorkflowPolicy(STRICT_WORKFLOW_POLICY),
      }
      const policy = parseBrochureWorkflowPolicy(payload)
      expect(policy).toEqual(STRICT_WORKFLOW_POLICY)
      expect(policy.preset).toBe("STRICT")
    })

    it("detects CUSTOM preset when any toggle differs from presets", () => {
      const custom: BrochureWorkflowPolicy = {
        ...STANDARD_WORKFLOW_POLICY,
        preset: "CUSTOM",
        requireFinishedPhoto: false, // differ from standard
      }
      expect(detectWorkflowPreset(custom)).toBe("CUSTOM")
    })

    it("serializes and deserializes roundtrip with full fidelity", () => {
      const custom: BrochureWorkflowPolicy = {
        preset: "CUSTOM",
        requireAdminDepositApproval: false,
        requireCoordinatorAcceptance: true,
        requireFinishedPhoto: false,
        customerApprovalMode: "BYPASS",
        requireFullPaymentBeforeDispatch: true,
        requireDeliveryProofPhoto: true,
        allowSlaEscalation: false,
        slaEscalationMinutes: 30,
      }
      const serialized = serializeWorkflowPolicy(custom)
      const parsed = parseBrochureWorkflowPolicy({ [BROCHURE_WORKFLOW_POLICY_KEY]: serialized })
      expect(parsed).toEqual(custom)
    })
  })

  describe("Fast-Track & Urgent Order Logic", () => {
    it("recognizes explicit isUrgent flag", () => {
      expect(isUrgentOrder({ isUrgent: true })).toBe(true)
      expect(isUrgentOrder({ isUrgent: false })).toBe(false)
    })

    it("recognizes orders delivering within 2 hours today as urgent", () => {
      const now = new Date(2026, 9, 14, 9, 0, 0, 0)
      // slot at 10:30 (1.5 hours later)
      const order = {
        deliveryDate: "2026-10-14",
        deliveryTimeSlot: "10:30 - 11:30",
      }
      expect(isUrgentOrder(order, now)).toBe(true)

      // slot at 14:00 (5 hours later)
      const nonUrgentOrder = {
        deliveryDate: "2026-10-14",
        deliveryTimeSlot: "14:00 - 15:00",
      }
      expect(isUrgentOrder(nonUrgentOrder, now)).toBe(false)
    })
  })

  describe("Gate Decision Evaluators", () => {
    describe("canRoleApproveDeposit", () => {
      it("always allows ADMIN", () => {
        expect(canRoleApproveDeposit("ADMIN", STANDARD_WORKFLOW_POLICY)).toBe(true)
        expect(canRoleApproveDeposit("ADMIN", STRICT_WORKFLOW_POLICY)).toBe(true)
        expect(canRoleApproveDeposit("ADMIN", LEAN_WORKFLOW_POLICY)).toBe(true)
      })

      it("allows COORDINATOR and SALE when policy has requireAdminDepositApproval = false", () => {
        expect(canRoleApproveDeposit("COORDINATOR", LEAN_WORKFLOW_POLICY)).toBe(true)
        expect(canRoleApproveDeposit("SALE", LEAN_WORKFLOW_POLICY)).toBe(true)
      })

      it("blocks COORDINATOR and SALE in STANDARD policy unless overdue SLA or urgent", () => {
        expect(canRoleApproveDeposit("COORDINATOR", STANDARD_WORKFLOW_POLICY, { isOverdueSla: false })).toBe(false)
        expect(canRoleApproveDeposit("SALE", STANDARD_WORKFLOW_POLICY, { isOverdueSla: false })).toBe(false)

        // When overdue SLA and escalation allowed
        expect(canRoleApproveDeposit("COORDINATOR", STANDARD_WORKFLOW_POLICY, { isOverdueSla: true })).toBe(true)
        expect(canRoleApproveDeposit("SALE", STANDARD_WORKFLOW_POLICY, { isOverdueSla: true })).toBe(true)

        // When order is urgent
        expect(canRoleApproveDeposit("COORDINATOR", STANDARD_WORKFLOW_POLICY, { isUrgent: true })).toBe(true)
        expect(canRoleApproveDeposit("SALE", STANDARD_WORKFLOW_POLICY, { isUrgent: true })).toBe(true)
      })

      it("never escalates in STRICT policy if allowSlaEscalation is false", () => {
        expect(canRoleApproveDeposit("COORDINATOR", STRICT_WORKFLOW_POLICY, { isOverdueSla: true })).toBe(false)
        expect(canRoleApproveDeposit("SALE", STRICT_WORKFLOW_POLICY, { isOverdueSla: true })).toBe(false)
      })
    })

    describe("shouldRequireCoordinatorAcceptance", () => {
      it("returns false in LEAN policy", () => {
        expect(shouldRequireCoordinatorAcceptance(LEAN_WORKFLOW_POLICY)).toBe(false)
      })

      it("returns true in STANDARD and STRICT policies for normal orders", () => {
        expect(shouldRequireCoordinatorAcceptance(STANDARD_WORKFLOW_POLICY)).toBe(true)
        expect(shouldRequireCoordinatorAcceptance(STRICT_WORKFLOW_POLICY)).toBe(true)
      })

      it("returns false for urgent orders even in STANDARD or STRICT policies", () => {
        expect(shouldRequireCoordinatorAcceptance(STANDARD_WORKFLOW_POLICY, true)).toBe(false)
        expect(shouldRequireCoordinatorAcceptance(STRICT_WORKFLOW_POLICY, true)).toBe(false)
      })
    })

    describe("canBypassFinishedPhoto", () => {
      it("returns true in LEAN policy", () => {
        expect(canBypassFinishedPhoto(LEAN_WORKFLOW_POLICY)).toBe(true)
      })

      it("returns false in STANDARD policy normally, but true for urgent orders", () => {
        expect(canBypassFinishedPhoto(STANDARD_WORKFLOW_POLICY, false)).toBe(false)
        expect(canBypassFinishedPhoto(STANDARD_WORKFLOW_POLICY, true)).toBe(true)
      })
    })

    describe("shouldBlockDispatchForBalance", () => {
      const partialMoney = { totalVnd: 1_000_000, paidVnd: 500_000 }
      const fullyPaidMoney = { totalVnd: 1_000_000, paidVnd: 1_000_000 }

      it("does not block if order is fully paid", () => {
        expect(shouldBlockDispatchForBalance(STANDARD_WORKFLOW_POLICY, fullyPaidMoney)).toBe(false)
      })

      it("blocks in STANDARD policy if balance is unpaid", () => {
        expect(shouldBlockDispatchForBalance(STANDARD_WORKFLOW_POLICY, partialMoney)).toBe(true)
      })

      it("does not block in LEAN policy (allows COD)", () => {
        expect(shouldBlockDispatchForBalance(LEAN_WORKFLOW_POLICY, partialMoney)).toBe(false)
      })

      it("does not block for urgent orders even in STANDARD policy", () => {
        expect(shouldBlockDispatchForBalance(STANDARD_WORKFLOW_POLICY, partialMoney, true)).toBe(false)
      })
    })
  })
})
