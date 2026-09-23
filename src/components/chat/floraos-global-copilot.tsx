"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopilotMessageItem } from "@/components/chat/copilot-message-item"

export function FloraOSGlobalCopilot() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputQuery, setInputQuery] = useState("")
  const [sending, setSending] = useState(false)
  const [creatingOrderFor, setCreatingOrderFor] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Khởi tạo hoặc nạp hội thoại của Copilot
  useEffect(() => {
    if (!isOpen || conversationId) return

    fetch("/api/v1/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "FloraOS In-App Copilot",
        channel: "INTERNAL_DASHBOARD",
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.conversation) {
          setConversationId(res.conversation.id)
        }
      })
      .catch((err) => console.error(err))
  }, [isOpen, conversationId])

  // Lắng nghe phím tắt Cmd+K hoặc Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Lắng nghe sự kiện mở Copilot từ các trang trong hệ thống (như Knowledge Base)
  useEffect(() => {
    function handleCustomOpen(e: Event) {
      const customEvent = e as CustomEvent<{ prompt?: string }>
      setIsOpen(true)
      if (customEvent.detail?.prompt) {
        setTimeout(() => {
          handleSendMessage(customEvent.detail.prompt)
        }, 150)
      }
    }
    window.addEventListener("floraos:open-copilot", handleCustomOpen)
    return () => window.removeEventListener("floraos:open-copilot", handleCustomOpen)
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  async function handleSendMessage(queryToSend?: string) {
    const text = (queryToSend || inputQuery).trim()
    if (!text || sending) return

    setInputQuery("")
    setSending(true)

    // 1. Hiển thị tin nhắn người dùng ngay lập tức (Optimistic UI)
    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      senderType: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      // 2. Khởi tạo hội thoại nếu chưa có
      let currentConvId = conversationId
      if (!currentConvId) {
        const initRes = await fetch("/api/v1/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "FloraOS In-App Copilot",
            channel: "INTERNAL_DASHBOARD",
          }),
        })
        const initData = await initRes.json()
        if (initData.conversation?.id) {
          currentConvId = initData.conversation.id
          setConversationId(currentConvId)
        } else {
          throw new Error(initData.error?.message || "Không thể khởi tạo hội thoại")
        }
      }

      // 3. Gửi tin nhắn đến server
      const res = await fetch(`/api/v1/chat/conversations/${currentConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      })

      const data = await res.json()
      if (res.ok && data.assistantMessage) {
        setMessages((prev) => [...prev, data.assistantMessage])
      } else {
        throw new Error(data.error?.message || "Lỗi nhận phản hồi AI")
      }
    } catch (err: any) {
      console.error("Lỗi gửi tin nhắn Copilot:", err)
      const errorAssistantMsg = {
        id: `err-${Date.now()}`,
        senderType: "ASSISTANT",
        content: `Dạ, hệ thống đang cập nhật kết nối: ${err?.message || "Vui lòng thử lại trong giây lát"}. Anh/chị thử bấm lại nhé ạ!`,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorAssistantMsg])
    } finally {
      setSending(false)
    }
  }

  async function handleQuickCreateOrder(productId: string) {
    if (!conversationId) return
    setCreatingOrderFor(productId)
    try {
      const res = await fetch(`/api/v1/chat/conversations/${conversationId}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (res.ok) {
        const resMsgs = await fetch(`/api/v1/chat/conversations/${conversationId}/messages`).then((r) => r.json())
        setMessages(resMsgs.messages || [])
      }
    } finally {
      setCreatingOrderFor(null)
    }
  }

  return (
    <>
      {/* NÚT BONG BÓNG COPILOT TRÒN NHỎ GỌN — ĐẶT Ở MÉP GIỮA BÊN PHẢI (TOP-1/2) ĐỂ KHÔNG BAO GIỜ CHE NÚT BẤM Ở ĐÁY */}
      <div className="fixed top-1/2 right-3 -translate-y-1/2 z-50 flex items-center gap-2">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Mở FloraOS Copilot"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 via-red-600 to-red-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            {/* Chấm báo trạng thái AI trực tuyến */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>

            {/* Icon AI Bot */}
            <Bot className="h-5 w-5 transition-transform group-hover:rotate-6" />

            {/* Tooltip bay sang trái khi hover — không chiếm chỗ cố định */}
            <div className="pointer-events-none absolute right-full mr-2.5 hidden sm:flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-stone-900/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <span>FloraOS Copilot</span>
              <kbd className="rounded bg-white/20 px-1 py-0.2 text-[9.5px] font-mono">⌘K</kbd>
            </div>
          </button>
        )}
      </div>

      {/* DRAWER / CỬA SỔ CHAT COPILOT */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[580px] w-[380px] sm:w-[420px] flex-col rounded-2xl border border-red-200/80 bg-surface shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Header Copilot */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-red-50 via-rose-50 to-red-100/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-extrabold text-red-950 flex items-center gap-1.5">
                  FloraOS SaaS Copilot
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="text-[10px] font-medium text-red-800/80">Hỏi đáp vận hành & Tư vấn hoa 24/7</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Vùng nội dung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground p-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">Xin chào! Em có thể giúp gì cho tiệm?</div>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[280px] mx-auto">
                    Anh/chị có thể hỏi về cách sử dụng tính năng trên hệ thống hoặc nhờ tư vấn mẫu hoa và chốt đơn!
                  </p>
                </div>

                <div className="space-y-1.5 w-full pt-2">
                  <div className="text-[10px] font-bold text-muted-foreground text-left px-1">💡 Câu hỏi gợi ý:</div>
                  {[
                    "Làm sao in phiếu cắm hoa giấu giá cho thợ?",
                    "Cách quét ngày kỷ niệm khách hàng?",
                    "Làm sao xuất mã QR catalog gửi Zalo?",
                    "Tư vấn bó hoa sinh nhật bạn gái tầm 500k",
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left rounded-xl border border-red-200/80 bg-red-50/50 p-2 text-[11px] font-medium text-red-900 hover:bg-red-100 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{q}</span>
                      <ArrowRight className="h-3 w-3 text-red-600 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <CopilotMessageItem
                    key={m.id}
                    message={m}
                    creatingOrderFor={creatingOrderFor}
                    onQuickCreateOrder={handleQuickCreateOrder}
                    onNavigate={(route) => {
                      router.push(route as any)
                      setIsOpen(false)
                    }}
                  />
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground p-2 rounded-xl bg-muted/40 animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                    <span>FloraOS Copilot đang tra cứu và soạn câu trả lời...</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Khung nhập tin nhắn */}
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
                placeholder="Hỏi về cách dùng hệ thống hoặc tìm mẫu hoa..."
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
