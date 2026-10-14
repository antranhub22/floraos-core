/**
 * Agent 3: Tone & Copywriting Synthesizer Agent.
 *
 * Tổng hợp câu trả lời theo văn phong nhân viên tiệm hoa từ FactSheet bằng mẫu câu cố định.
 * KHÔNG gọi thẳng nhà cung cấp AI (OpenAI/Ollama): mọi lệnh gọi AI phải qua `callCapability`
 * (`src/core/ai/gateway.ts`) — bản gọi thẳng trước đây đã gỡ khi soát chuẩn bàn giao 14/10/2026;
 * nối lại qua cổng AI cần đăng ký năng lực AI riêng (chờ PO).
 */

import type { ParsedIntent, KnowledgeFactSheet, PolishedDraft } from "./pipeline-types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Làm sạch thuật ngữ kỹ thuật trước khi đưa vào context LLM hoặc fallback */
function purifyDevJargon(text: string): string {
  return text
    .replace(/\s*->\s*/g, ", sau đó ")
    .replace(/\s*\(icon\s+[A-Za-z0-9_-]+\s*(?:trên Header)?\)/gi, "")
    .replace(/\(SlidersHorizontal\)/gi, "")
    .replace(/\(Wand2\)/gi, "")
    .replace(/\(LayoutList\)/gi, "")
    .replace(/\(InboxButton\)/gi, "")
    .replace(/JourneyWizard\s*/gi, "luồng ")
    .replace(/TrashConfirmModal/gi, "hộp thoại xác nhận")
    .replace(/AnalysisResultCard/gi, "bảng kết quả")
    .replace(/In-place Editing/gi, "chỉnh sửa trực tiếp")
    .replace(/FlowSteps/gi, "các bước trên màn hình")
    .replace(/ShopProfileReadiness/gi, "hệ thống")
    .replace(/AccountStorageHub/gi, "kho dữ liệu")
    .replace(/AddStaffDialog/gi, "hộp thoại thêm nhân viên")
    .replace(/MemberTable/gi, "danh sách nhân viên")
    .replace(/Cursor-based Pagination/gi, "tự động tải trang")
    .replace(/\(isExecutive[^)]*\)/gi, "")
    .replace(/\(isExecutive\)/gi, "")
    .replace(/\(Quyền [A-Za-z0-9_-]+\)/gi, "")
    .replace(/Search Box/gi, "ô tìm kiếm")
    .replace(/Dropzone 1/gi, "khung Excel")
    .replace(/Dropzone 2/gi, "khung Ảnh")
    .replace(/import-session-storage/gi, "bộ nhớ tạm")
    .replace(/importStats/gi, "thống kê")
    .replace(/\('\/[^']+'\)/g, "")
    .replace(/'\/[^']+'/g, "")
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function templateFallback(intent: ParsedIntent, facts: KnowledgeFactSheet): PolishedDraft {
  if (facts.isOverview && facts.overviewItems) {
    const greeting = intent.userRole !== "ALL"
      ? `Dạ em là FloraOS Ops Copilot — Trợ lý vận hành đồng hành cùng anh/chị (${intent.userRole})!`
      : "Dạ em là FloraOS Ops Copilot — Trợ lý vận hành nền tảng FloraOS của tiệm hoa!"

    const bodyText = `${greeting} Em có thể hướng dẫn anh/chị thao tác 10 chức năng chính của tiệm:\n\n` +
      `1. **Trang Chủ:** Xem việc cần làm đầu ngày, theo dõi đơn tồn và hạn mức AI.\n` +
      `2. **Đơn Hàng & Xưởng:** Quản lý tiến độ đơn, in phiếu cắm hoa giấu giá và phiếu giao cho shipper.\n` +
      `3. **Thẻ Chào Mẫu Hoa:** Tạo link xem hoa gửi Zalo cho khách và nhận cọc tự động qua mã QR.\n` +
      `4. **Sản Phẩm & Giá:** Quản lý bảng giá niêm yết, tra cứu mẫu theo dịp và khoảng giá.\n` +
      `5. **Tạo Mẫu Hoa Mới:** Đăng mẫu hoa mới, ghi rõ số cành hoa để thợ cắm chuẩn mẫu.\n` +
      `6. **Nhập từ Excel:** Nạp hàng loạt mẫu hoa cũ và tải ảnh nhanh chóng.\n` +
      `7. **Quét Ảnh Hoa AI & Phân tích hoa:** Nhận diện loại hoa, đếm cành và soạn sẵn tin nhắn Zalo chốt đơn.\n` +
      `8. **Kho Dữ Liệu:** Lưu trữ ảnh hoa của tiệm và quản lý thùng rác 30 ngày.\n` +
      `9. **Hồ Sơ Cửa Hàng:** Cài đặt thông tin tiệm, logo và số tài khoản ngân hàng nhận tiền cọc.\n` +
      `10. **Cài Đặt & Thành Viên:** Cấp tài khoản nhân viên dùng ngay trong 10 giây và phân quyền.\n\n` +
      `Anh/chị đang cần hỗ trợ thao tác phần nào ạ?`

    return { greeting, bodyText, targetRoute: "/", actionLabel: "Khám Phá Các Chức Năng" }
  }

  if (!facts.nodeId) {
    const roleNote = intent.userRole !== "ALL" ? ` (${intent.userRole})` : ""
    const bodyText = `Dạ, em chưa nhận diện được thao tác cụ thể trong câu hỏi của anh/chị${roleNote}.\n\n` +
      `Anh/chị có thể miêu tả việc muốn làm để em hướng dẫn từng bước nhé. Ví dụ:\n` +
      `• *"Tạo link mẫu hoa gửi Zalo cho khách"*\n` +
      `• *"In phiếu cắm hoa giấu giá cho thợ"*\n` +
      `• *"Có cần gửi ảnh khi cắm hoa xong không"*\n` +
      `• *"Cài đặt số tài khoản nhận tiền cọc"*\n` +
      `• *"Thêm tài khoản cho nhân viên mới"*\n\n` +
      `Anh/chị cứ gõ câu hỏi, em sẽ hướng dẫn chi tiết ngay ạ!`

    return {
      greeting: "Dạ em xin phép hỗ trợ anh/chị ạ!",
      bodyText,
      targetRoute: "/the-chao",
      actionLabel: "Xem Hướng Dẫn Thẻ Chào Mẫu Hoa",
    }
  }

  if (facts.focusedStep) {
    const step = facts.focusedStep
    const cleanStepText = purifyDevJargon(step.actionText)
    const bodyText = `Dạ, em hướng dẫn chi tiết **Bước ${step.stepNumber}** trong phần **${facts.topicTitle}** nhé:\n\n` +
      `👉 ${cleanStepText}\n\n` +
      `Anh/chị bấm nút bên dưới để mở màn hình và thao tác ngay nhé ạ!`

    return {
      greeting: `Chi tiết Bước ${step.stepNumber}`,
      bodyText,
      targetRoute: facts.routePath ?? undefined,
      actionLabel: facts.actionLabel ?? undefined,
      actionSteps: [cleanStepText],
      relatedLinks: facts.relatedLinks,
    }
  }

  const stepsFormatted = facts.steps.map((s) => {
    const cleanAction = purifyDevJargon(s.actionText).replace(/^Bước\s*\d+\s*[-:]\s*/i, "").trim()
    if (cleanAction.includes(":")) {
      const parts = cleanAction.split(":")
      const header = parts[0]?.trim()
      const desc = parts.slice(1).join(":").trim()
      return `${s.stepNumber}. **${header}:** ${desc}`
    }
    return `${s.stepNumber}. ${cleanAction}`
  })
  const stepsText = stepsFormatted.join("\n")

  const rawCaveat = facts.caveats.length > 0 ? facts.caveats[0]! : ""
  const cleanCaveat = purifyDevJargon(rawCaveat)
  const primaryCaveat = cleanCaveat ? `\n\n💡 **Lưu ý nghiệp vụ:** ${cleanCaveat}` : ""

  const crossModuleBlock = facts.relatedLinks.length > 0
    ? `\n🔗 **Liên kết nghiệp vụ liên quan:** [${facts.relatedLinks[0]!.title}](${facts.relatedLinks[0]!.route})`
    : ""

  let greeting = ""
  let bodyText = ""

  switch (intent.style) {
    case "CONSULTANT": {
      greeting = `**[Cố vấn Vận hành FloraOS]**`
      bodyText = `${greeting} Hướng dẫn **${facts.topicTitle}**:\n\n` +
        `${stepsText}${primaryCaveat}${crossModuleBlock}\n\n` +
        `💡 *Khuyến nghị quản trị:* Thực hiện đúng các bước trên để tối ưu thời gian và đối soát.`
      break
    }
    case "TROUBLESHOOTER": {
      greeting = `🔧 **[Khắc phục Sự cố & Hướng dẫn Xử lý Nhanh]**`
      bodyText = `${greeting}\n` +
        `Xử lý nhanh **${facts.topicTitle}** theo các bước sau:\n\n` +
        `${stepsText}${primaryCaveat}${crossModuleBlock}`
      break
    }
    case "FAST_SOP": {
      greeting = `⚡ **[Thao tác Nhanh] ${facts.topicTitle}:**`
      bodyText = `${greeting}\n\n${stepsText}${crossModuleBlock}`
      break
    }
    case "COACH":
    default: {
      const roleName = intent.displayRole || (intent.userRole !== "ALL" ? intent.userRole : "")
      const roleGreeting = roleName ? ` (${roleName})` : ""
      greeting = `Dạ, em xin phép hướng dẫn anh/chị thao tác **"${facts.topicTitle}"**${roleGreeting}:`
      bodyText = `${greeting}\n\n${stepsText}${primaryCaveat}${crossModuleBlock}`
      break
    }
  }

  return {
    greeting,
    bodyText,
    targetRoute: facts.routePath ?? undefined,
    actionLabel: facts.actionLabel ?? undefined,
    actionSteps: facts.steps.map((s) => purifyDevJargon(s.actionText)),
    relatedLinks: facts.relatedLinks,
  }
}

// ---------------------------------------------------------------------------
// ToneSynthesizerAgent
// ---------------------------------------------------------------------------

export class ToneSynthesizerAgent {
  /** Tổng hợp câu trả lời từ FactSheet. Luôn trả về kết quả — không bao giờ throw. */
  async synthesize(intent: ParsedIntent, facts: KnowledgeFactSheet): Promise<PolishedDraft> {
    return templateFallback(intent, facts)
  }
}
