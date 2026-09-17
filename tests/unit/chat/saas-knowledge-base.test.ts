import { describe, it, expect } from "vitest"
import {
  detectUserIntent,
  querySaasKnowledge,
  SAAS_KNOWLEDGE_BASE,
} from "@/modules/chat-assistant/domain/saas-knowledge-base"

describe("SaaS Knowledge Base & Dual-Intent Router (FloraOS Copilot)", () => {
  describe("Phân loại ý định (detectUserIntent)", () => {
    it("nhận diện chính xác câu hỏi vận hành hệ thống SaaS (SAAS_HELP)", () => {
      expect(detectUserIntent("Làm sao để in phiếu cắm hoa giấu giá cho thợ xưởng?")).toBe("SAAS_HELP")
      expect(detectUserIntent("Cách quét ngày kỷ niệm sinh nhật khách hàng ở đâu?")).toBe("SAAS_HELP")
      expect(detectUserIntent("Làm thế nào để xuất video 9:16 đăng TikTok?")).toBe("SAAS_HELP")
      expect(detectUserIntent("Chức năng đo SLA đơn hàng hoạt động ra sao?")).toBe("SAAS_HELP")
      expect(detectUserIntent("Làm sao để tạo mã QR chia sẻ catalog?")).toBe("SAAS_HELP")
      expect(detectUserIntent("Cài đặt giá sàn và giá trần ở đâu?")).toBe("SAAS_HELP")
    })

    it("nhận diện chính xác câu hỏi tư vấn mua hoa & báo giá (FLOWER_SALES)", () => {
      expect(detectUserIntent("Tư vấn bó hoa sinh nhật bạn gái tầm 500k")).toBe("FLOWER_SALES")
      expect(detectUserIntent("Kệ hoa khai trương 1 triệu tone đỏ")).toBe("FLOWER_SALES")
      expect(detectUserIntent("Bó hoa hồng đỏ 20 cành có sẵn không?")).toBe("FLOWER_SALES")
      expect(detectUserIntent("Tìm hoa tặng mẹ ngày 20/10")).toBe("FLOWER_SALES")
    })
  })

  describe("Tra cứu tri thức vận hành (querySaasKnowledge)", () => {
    it("trả về hướng dẫn in phiếu cắm hoa xưởng M10 (ẩn giá)", () => {
      const match = querySaasKnowledge("Làm sao in phiếu cắm hoa giấu giá cho thợ?")
      expect(match).not.toBeNull()
      expect(match!.id).toBe("m10_florist_ticket")
      expect(match!.routePath).toBe("/don-hang")
      expect(match!.steps.length).toBeGreaterThan(0)
    })

    it("trả về hướng dẫn phiếu giao hàng và thiệp A6", () => {
      const match = querySaasKnowledge("Cách in phiếu giao hàng A6 cho shipper và in thiệp?")
      expect(match).not.toBeNull()
      expect(match!.id).toBe("m10_delivery_receipt")
      expect(match!.routePath).toBe("/don-hang")
    })

    it("trả về hướng dẫn quét ngày kỷ niệm CRM M09", () => {
      const match = querySaasKnowledge("Làm thế nào để quét các ngày kỷ niệm của khách hàng?")
      expect(match).not.toBeNull()
      expect(match!.id).toBe("m09_occasions_reminder")
      expect(match!.routePath).toBe("/khach-hang")
    })

    it("trả về hướng dẫn dựng video marketing 9:16 M04c", () => {
      const match = querySaasKnowledge("Dựng video marketing hoa tươi dọc 9:16 ở đâu?")
      expect(match).not.toBeNull()
      expect(match!.id).toBe("m04c_video_studio")
      expect(match!.routePath).toBe("/video")
    })

    it("trả về hướng dẫn xuất mã QR catalog M06", () => {
      const match = querySaasKnowledge("Cách xuất mã QR chia sẻ catalog?")
      expect(match).not.toBeNull()
      expect(match!.id).toBe("m06_qr_catalog")
      expect(match!.routePath).toBe("/catalog")
    })

    it("trả về hướng dẫn cấu hình tích hợp đa kênh M08", () => {
      const match = querySaasKnowledge("Làm sao để tích hợp đa kênh facebook và zalo?")
      expect(match).not.toBeNull()
      expect(match!.id).toBe("m08_channel_integration")
      expect(match!.routePath).toBe("/hoi-thoai/kenh-tich-hop")
    })

    it("trả về hướng dẫn cẩm nang nhập liệu chuẩn SSOT", () => {
      const match = querySaasKnowledge("Tôi cần nhập liệu những thông tin gì cho hệ thống?")
      expect(match).not.toBeNull()
      expect(match!.id).toBe("kb_input_guide")
      expect(match!.routePath).toBe("/tri-thuc")
    })
  })

  describe("Tính toàn vẹn của Knowledge Base SSOT", () => {
    it("mọi mục tri thức đều có đầy đủ id, tiêu đề, các bước thực hiện và routePath", () => {
      for (const item of SAAS_KNOWLEDGE_BASE) {
        expect(item.id).toBeTruthy()
        expect(item.title).toBeTruthy()
        expect(item.steps.length).toBeGreaterThan(0)
        expect(item.routePath.startsWith("/")).toBe(true)
        expect(item.actionLabel).toBeTruthy()
      }
    })
  })
})
