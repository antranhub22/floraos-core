"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Flower2,
  ShoppingBag,
  Loader2,
  Bot,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SuggestedFlowerCard } from "@/modules/chat-assistant/domain/chat-types"

interface WidgetMessage {
  id: string
  senderType: "USER" | "ASSISTANT"
  content: string
  suggestedFlowers?: SuggestedFlowerCard[]
}

interface PublicStorefrontChatWidgetProps {
  shopSlug: string
  shopName?: string | undefined
}

// Visitor ID duy nhất theo phiên trình duyệt (sessionStorage). Đọc lúc gửi tin
// thay vì giữ trong state — không cần effect đồng bộ state khi mount.
function getVisitorId(): string {
  let vid = sessionStorage.getItem("floraos_visitor_id")
  if (!vid) {
    vid = `guest_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem("floraos_visitor_id", vid)
  }
  return vid
}

function newMessageId(prefix: "usr" | "bot"): string {
  return `${prefix}_${Date.now()}`
}

export function PublicStorefrontChatWidget({
  shopSlug,
  shopName = "Tiệm Hoa",
}: PublicStorefrontChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<WidgetMessage[]>([])
  const [inputQuery, setInputQuery] = useState("")
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSendMessage(queryText?: string) {
    const text = queryText || inputQuery
    if (!text.trim() || sending) return

    setInputQuery("")
    setSending(true)

    // Tin nhắn tạm thời của khách
    const userMsg: WidgetMessage = {
      id: newMessageId("usr"),
      senderType: "USER",
      content: text,
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch("/api/v1/chat/public/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: shopSlug,
          visitorId: getVisitorId(),
          message: text,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const botMsg: WidgetMessage = {
          id: newMessageId("bot"),
          senderType: "ASSISTANT",
          content: data.replyText,
          suggestedFlowers: data.suggestedFlowers || [],
        }
        setMessages((prev) => [...prev, botMsg])
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* NÚT BONG BÓNG TRÒN NỔI GÓC DƯỚI BÊN PHẢI */}
      <div className="fixed bottom-5 right-5 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-3.5 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            aria-label="Tư vấn đặt hoa"
          >
            <MessageCircle className="h-6 w-6 animate-pulse" />
            <span className="hidden sm:inline-block pr-1 text-xs font-bold tracking-wide">
              Tư vấn đặt hoa
            </span>
          </button>
        )}
      </div>

      {/* CỬA SỔ CHAT STOREFRONT */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[520px] w-[360px] sm:w-[390px] flex-col rounded-2xl border border-red-200 bg-surface shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                  Trợ Lý {shopName}
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div className="text-[10px] text-red-800/80">Tư vấn mẫu hoa & Báo giá trực tuyến</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Vùng tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground p-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-xs">Kính chào Quý Khách!</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Quý khách đang tìm hoa cho dịp gì và ngân sách khoảng bao nhiêu ạ?
                  </p>
                </div>

                <div className="space-y-1.5 w-full pt-3">
                  {[
                    "Tư vấn bó hoa sinh nhật tầm 500k",
                    "Kệ hoa khai trương trang trọng tone đỏ",
                    "Hoa tặng mẹ ngày lễ 20/10",
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left rounded-xl border border-red-200/80 bg-red-50/50 p-2 text-[11px] font-medium text-red-900 hover:bg-red-100 flex items-center justify-between"
                    >
                      <span className="truncate">{q}</span>
                      <ArrowRight className="h-3 w-3 text-red-600 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.senderType === "USER"
                const flowers = m.suggestedFlowers || []

                return (
                  <div key={m.id} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                    )}

                    <div className="max-w-[85%] space-y-2">
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-line ${
                          isUser
                            ? "bg-red-600 text-white font-medium rounded-br-none"
                            : "bg-surface-raised border border-border text-foreground rounded-bl-none shadow-2xs"
                        }`}
                      >
                        {m.content}
                      </div>

                      {/* Thẻ hoa gợi ý từ Master Index */}
                      {flowers.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {flowers.map((f) => (
                            <div
                              key={f.productId}
                              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 p-2 shadow-2xs"
                            >
                              {f.sampleImageUrl ? (
                                <img
                                  src={f.sampleImageUrl}
                                  alt={f.productName}
                                  className="h-11 w-11 rounded-lg object-cover border border-red-200"
                                />
                              ) : (
                                <div className="h-11 w-11 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                                  <Flower2 className="h-5 w-5" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-foreground text-xs truncate">
                                  {f.productName}
                                </div>
                                <div className="text-red-600 font-extrabold text-[11px]">
                                  {Number(f.priceVnd).toLocaleString("vi-VN")} đ
                                </div>
                              </div>

                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSendMessage(`Tôi muốn đặt mẫu hoa "${f.productName}"`)
                                }
                                className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white text-[11px] shrink-0"
                              >
                                <ShoppingBag className="mr-1 h-3 w-3" /> Đặt ngay
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form nhập */}
          <div className="border-t border-border p-2.5 bg-surface">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder="Nhắn tin cho tiệm hoa..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={sending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputQuery.trim() || sending}
                className="h-8 w-8 p-0 rounded-xl bg-red-600 hover:bg-red-700 text-white shrink-0"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
