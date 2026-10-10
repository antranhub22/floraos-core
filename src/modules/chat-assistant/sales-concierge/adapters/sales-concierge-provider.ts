/**
 * Sales Concierge AI Provider Adapter.
 * Trợ lý AI Bán hoa cho Khách hàng tiệm hoa.
 * TUYỆT ĐỐI KHÔNG chứa tri thức vận hành SaaS nội bộ (Zero-Leakage Guarantee).
 */

import { env } from "@/lib/env"
import {
  extractBudgetFromQuery,
  extractOccasionFromQuery,
  matchProductsFromMasterIndex,
  formatQuotePriceForChat,
} from "../../domain/flower-consultant-rules"
import type { SuggestedFlowerCard } from "../../domain/chat-types"
import type {
  SalesConsultantInput,
  SalesConsultantOutput,
} from "../domain/sales-concierge-types"

export class SalesConciergeProvider {
  private apiKey: string | undefined
  private apiUrl: string
  private openaiApiKey: string | undefined
  private ollamaUrl: string

  constructor() {
    this.apiKey = process.env.DIFY_API_KEY
    this.apiUrl = process.env.DIFY_API_URL || "https://api.dify.ai/v1"
    this.openaiApiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    this.ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434"
  }

  async send(input: SalesConsultantInput): Promise<SalesConsultantOutput> {
    const budget = extractBudgetFromQuery(input.query)
    const occasion = extractOccasionFromQuery(input.query)
    const suggestedFlowers = matchProductsFromMasterIndex(
      input.masterProducts,
      budget,
      occasion
    )

    // 1. Ưu tiên Dify nếu có cấu hình
    if (this.apiKey) {
      const difyReply = await this.callDify(input, budget, occasion, suggestedFlowers)
      if (difyReply) return difyReply
    }

    // 2. Gọi OpenAI API (gpt-4o-mini) nếu có key
    if (this.openaiApiKey) {
      const openaiReply = await this.callOpenAI(input, budget, occasion, suggestedFlowers)
      if (openaiReply) return openaiReply
    }

    // 3. Gọi Local Qwen (Ollama)
    const qwenReply = await this.callOllamaQwen(input, budget, occasion, suggestedFlowers)
    if (qwenReply) return qwenReply

    // 4. Fallback an toàn: Rule Engine tiệm hoa
    return this.generateLocalFlowerSalesReply(input, budget, occasion, suggestedFlowers)
  }

  private async callDify(
    input: SalesConsultantInput,
    budget: number | null,
    occasion: string | null,
    suggestedFlowers: SuggestedFlowerCard[]
  ): Promise<SalesConsultantOutput | null> {
    try {
      const res = await fetch(`${this.apiUrl}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            customer_name: input.customer?.name || "Quý khách",
            customer_tier: input.customer?.metrics.tier || "Khách mới",
            fav_flowers: input.customer?.preferences.preferredFlowers.join(", ") || "",
            budget: budget ? `${budget.toLocaleString("vi-VN")} đ` : "Chưa rõ",
            occasion: occasion || "Tự do",
          },
          query: input.query,
          response_mode: "blocking",
          conversation_id: input.conversationId.length === 36 ? input.conversationId : undefined,
          user: input.customer?.phone || "anonymous_shopper",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return {
          replyText: data.answer || "Dạ, em xin phép tư vấn mẫu hoa phù hợp nhất cho anh/chị ạ.",
          suggestedFlowers,
          detectedBudget: budget ?? undefined,
          detectedOccasion: occasion ?? undefined,
        }
      }
    } catch {
      // Chuyển sang fallback
    }
    return null
  }

  private async callOpenAI(
    input: SalesConsultantInput,
    budget: number | null,
    occasion: string | null,
    suggestedFlowers: SuggestedFlowerCard[]
  ): Promise<SalesConsultantOutput | null> {
    try {
      const catalogSummary =
        suggestedFlowers.length > 0
          ? suggestedFlowers
              .slice(0, 5)
              .map(
                (p) =>
                  `- ${p.productName} (Giá: ${formatQuotePriceForChat(p.priceVnd)}, Phong cách: ${p.wrapStyle || "Hiện đại"})`
              )
              .join("\n")
          : "Hiện các mẫu hoa thiết kế đang được cập nhật thêm."

      const customerContext = input.customer
        ? `Khách hàng: ${input.customer.name}`
        : "Khách hàng"

      const systemPrompt = `Bạn là Chuyên viên Tư vấn Hoa Tươi duyên dáng, nhiệt tình của tiệm hoa.
Nhiệm vụ:
- Giao tiếp lễ phép, ấm áp, tinh tế bằng tiếng Việt với khách mua hoa.
- Tư vấn mẫu hoa phù hợp theo ngân sách, tone màu và dịp tặng hoa (sinh nhật, khai trương, kỷ niệm, chia buồn...).
- Nếu có mẫu hoa phù hợp, gợi ý khách xem và nhấn nút chốt đơn mẫu hoa yêu thích.
- Nếu chưa có mẫu hoa hoàn toàn trùng khớp, giải thích nhẹ nhàng và gợi ý tư vấn cắm hoa theo yêu cầu riêng.
- Tuyệt đối KHÔNG nhắc đến các thuật ngữ kỹ thuật phần mềm hoặc mã hệ thống nội bộ.
- Trả lời ngắn gọn, sinh động trong 2-3 câu.

Khách hàng: ${customerContext}
Mẫu hoa gợi ý:
${catalogSummary}`

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.query },
          ],
          max_tokens: 350,
          temperature: 0.7,
        }),
      })

      if (!res.ok) return null

      const data = await res.json()
      const answer = data.choices?.[0]?.message?.content?.trim()
      if (!answer) return null

      return {
        replyText: answer,
        suggestedFlowers,
        detectedBudget: budget ?? undefined,
        detectedOccasion: occasion ?? undefined,
      }
    } catch {
      return null
    }
  }

  private async callOllamaQwen(
    input: SalesConsultantInput,
    budget: number | null,
    occasion: string | null,
    suggestedFlowers: SuggestedFlowerCard[]
  ): Promise<SalesConsultantOutput | null> {
    try {
      const catalogSummary =
        suggestedFlowers.length > 0
          ? suggestedFlowers
              .slice(0, 5)
              .map(
                (p) =>
                  `- ${p.productName} (Giá: ${formatQuotePriceForChat(p.priceVnd)})`
              )
              .join("\n")
          : "Đang cập nhật thêm mẫu mới."

      const systemPrompt = `Bạn là Trợ lý Hoa Tươi của tiệm hoa.
Nhiệm vụ:
- Tư vấn hoa tươi cho khách hàng chu đáo, thân thiện, lễ phép bằng tiếng Việt.
- Gợi ý mẫu hoa theo dịp và ngân sách của khách.
- Tuyệt đối không đề cập đến bất kỳ thuật ngữ phần mềm quản trị nào.
- Trả lời súc tích trong 2-3 câu.

Mẫu hoa gợi ý:
${catalogSummary}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const res = await fetch(`${this.ollamaUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "qwen2.5:7b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.query },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      })

      clearTimeout(timeoutId)
      if (!res.ok) return null

      const data = await res.json()
      const answer = data.choices?.[0]?.message?.content?.trim()
      if (!answer) return null

      return {
        replyText: answer,
        suggestedFlowers,
        detectedBudget: budget ?? undefined,
        detectedOccasion: occasion ?? undefined,
      }
    } catch {
      return null
    }
  }

  private generateLocalFlowerSalesReply(
    input: SalesConsultantInput,
    budget: number | null,
    occasion: string | null,
    suggestedFlowers: SuggestedFlowerCard[]
  ): SalesConsultantOutput {
    const customerName = input.customer?.name ? ` ${input.customer.name}` : ""
    const greeting = `Dạ em chào anh/chị${customerName}! Em là tư vấn viên hoa tươi của tiệm ạ.`

    if (suggestedFlowers.length === 0) {
      return {
        replyText: `${greeting} Hiện tại tiệm đang có các mẫu hoa tươi thiết kế theo yêu cầu riêng rất đẹp. Anh/chị có thể chia sẻ thêm về dịp tặng hoặc mức ngân sách mong muốn để bên em gợi ý mẫu phù hợp nhất nhé ạ!`,
        suggestedFlowers: [],
        detectedBudget: budget ?? undefined,
        detectedOccasion: occasion ?? undefined,
      }
    }

    let body = ""
    if (occasion && budget) {
      body = `Dịp **${occasion}** với mức ngân sách khoảng **${budget.toLocaleString("vi-VN")} đ**, em xin gửi anh/chị những thiết kế hoa tươi được yêu thích nhất dưới đây ạ.`
    } else if (occasion) {
      body = `Dành riêng cho dịp **${occasion}**, tiệm có những mẫu hoa với tone màu rất trang nhã và ý nghĩa gửi anh/chị tham khảo ạ.`
    } else if (budget) {
      body = `Với tầm ngân sách khoảng **${budget.toLocaleString("vi-VN")} đ**, em xin gợi ý các mẫu hoa bán chạy nhất tại tiệm dưới đây ạ.`
    } else {
      body = `Dạ tiệm có sẵn các mẫu bó hoa, giỏ hoa và bình hoa thiết kế rất tinh tế. Em xin gửi anh/chị một số mẫu hoa nổi bật của tiệm hôm nay ạ!`
    }

    const cta = "\n\nAnh/chị ưng mẫu nào có thể bấm nút **⚡ Chọn mẫu này** để bên em chuẩn bị chu đáo nhé ạ!"

    return {
      replyText: `${greeting}\n\n${body}${cta}`,
      suggestedFlowers,
      detectedBudget: budget ?? undefined,
      detectedOccasion: occasion ?? undefined,
    }
  }
}
