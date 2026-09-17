"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Send,
  Plus,
  Bot,
  User,
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowRight,
  CheckCircle2,
  Flower2,
  Loader2,
  ExternalLink,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"

export default function ChatAssistantPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputQuery, setInputQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [creatingOrderFor, setCreatingOrderFor] = useState<string | null>(null)
  const [createdOrderNotice, setCreatedOrderNotice] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Tải danh sách hội thoại
  function loadConversations() {
    fetch("/api/v1/chat/conversations")
      .then((r) => r.json())
      .then((res) => {
        const items = res.items || []
        setConversations(items)
        if (items.length > 0 && !selectedConvId) {
          setSelectedConvId(items[0].id)
        }
      })
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    loadConversations()
  }, [])

  // 2. Tải tin nhắn của hội thoại đã chọn
  useEffect(() => {
    if (!selectedConvId) return
    setLoading(true)
    fetch(`/api/v1/chat/conversations/${selectedConvId}/messages`)
      .then((r) => r.json())
      .then((res) => {
        setMessages(res.messages || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [selectedConvId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 3. Tạo hội thoại mới
  async function handleCreateNewConv() {
    const res = await fetch("/api/v1/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Tư vấn khách hàng #${conversations.length + 1}`,
        channel: "INTERNAL_DASHBOARD",
      }),
    })
    if (res.ok) {
      const { conversation } = await res.json()
      setConversations((prev) => [conversation, ...prev])
      setSelectedConvId(conversation.id)
    }
  }

  // 4. Gửi tin nhắn
  async function handleSendMessage(queryToSend?: string) {
    const text = queryToSend || inputQuery
    if (!text.trim() || !selectedConvId || sending) return

    setInputQuery("")
    setSending(true)
    setCreatedOrderNotice(null)

    try {
      const res = await fetch(`/api/v1/chat/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      })

      if (res.ok) {
        const { userMessage, assistantMessage } = await res.json()
        setMessages((prev) => [...prev, userMessage, assistantMessage])
        loadConversations()
      }
    } catch (err) {
      console.error("Lỗi gửi tin:", err)
    } finally {
      setSending(false)
    }
  }

  // 5. 1-chạm chốt đơn sang M10
  async function handleQuickCreateOrder(productId: string) {
    if (!selectedConvId) return
    setCreatingOrderFor(productId)
    try {
      const res = await fetch(`/api/v1/chat/conversations/${selectedConvId}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedOrderNotice(`Đã tạo thành công Đơn hàng nháp #${data.order.code}!`)
        // Tải lại tin nhắn để thấy tin nhắn SYSTEM xác nhận đơn
        const resMsgs = await fetch(`/api/v1/chat/conversations/${selectedConvId}/messages`).then((r) => r.json())
        setMessages(resMsgs.messages || [])
      }
    } finally {
      setCreatingOrderFor(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Header chuẩn Top-Right Action Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-bold text-primary">
              M08 AI Chat
            </span>
            <h1 className="text-xl font-extrabold text-foreground">AI Chat Assistant & Tư Vấn Bán Hàng</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tự động truy vấn Product Master Index & Customer Master Index · Trả lời thông minh · 1-chạm chốt đơn sang M10
          </p>
        </div>

        {/* Top-Right Action Header */}
        <div className="flex items-center gap-3">
          <Link href={"/hoi-thoai/kenh-tich-hop" as any}>
            <Button
              variant="outline"
              size="sm"
              className="font-semibold text-xs gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
            >
              <Share2 className="h-3.5 w-3.5" />
              Tích Hợp Đa Kênh & Biểu Phí
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleCreateNewConv}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Cuộc trò chuyện mới
          </Button>
        </div>
      </header>

      {/* 2. Main content */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full flex flex-col">
        {/* Khối hướng dẫn SSOT FeatureGuidanceCard */}
        <FeatureGuidanceCard
          badgeLabel="HƯỚNG DẪN AI CHAT ASSISTANT M08"
          badgeIcon={Bot}
          title="Trợ Lý Tư Vấn Hoa Tươi & Tự Động Hóa Chốt Đơn"
          description="Hệ thống tích hợp kiến trúc Headless AI (Dify Engine), tự động liên kết dữ liệu mẫu hoa, công thức BOM từ M01 và lịch sử khách hàng từ M09 để gợi ý chính xác và đẩy đơn nháp 1-chạm sang M10."
          tips={[
            { icon: "⚡", text: "1-chạm chốt đơn: Bấm 'Chốt đơn mẫu này' để tạo ngay đơn nháp sang Kanban M10" },
            { icon: "🎯", text: "Nhận diện ngân sách & dịp: AI tự bóc tách số tiền (vd: 500k, 1tr) và ngày lễ (sinh nhật, khai trương)" },
            { icon: "💎", text: "Master Index SSOT: Mẫu hoa gợi ý luôn có ảnh thật, BOM cành hoa và giá niêm yết chuẩn" },
            { icon: "🛡️", text: "Bảo mật Tenant: Hoạt động cách ly hoàn toàn theo tổ chức, an toàn tuyệt đối" },
          ]}
        />

        {/* Thông báo tạo đơn thành công */}
        {createdOrderNotice && (
          <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 p-4 text-sm font-bold text-green-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {createdOrderNotice}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = "/don-hang")}
              className="text-xs border-green-300 text-green-800 hover:bg-green-100"
            >
              Mở bảng Đơn hàng M10 <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Khung Chat 2 Cột */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[550px] rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          {/* CỘT TRÁI: DANH SÁCH HỘI THOẠI */}
          <div className="border-r border-border flex flex-col bg-surface-raised/40">
            <div className="p-3.5 border-b border-border font-bold text-xs text-muted-foreground flex items-center justify-between">
              <span>Danh sách hội thoại ({conversations.length})</span>
              <Button size="sm" variant="ghost" onClick={handleCreateNewConv} className="h-7 px-2 text-xs">
                <Plus className="h-3.5 w-3.5" /> Mới
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Chưa có hội thoại nào. Bấm "+ Mới" để bắt đầu!
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1 ${
                      selectedConvId === c.id
                        ? "bg-red-50/80 border-l-4 border-red-600"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground truncate">{c.title}</span>
                      <Badge tone={c.channel === "ZALO" ? "accent" : "neutral"} className="text-[10px]">
                        {c.channel === "ZALO" ? "Zalo" : "Web"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(c.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CỘT PHẢI: CỬA SỔ CHAT & GỢI Ý MẪU HOA */}
          <div className="col-span-2 flex flex-col bg-background">
            {/* Vùng tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Bot className="h-10 w-10 text-red-400" />
                  <p className="max-w-md">
                    Chào bạn! Tôi là trợ lý AI am hiểu hoa tươi. Hãy thử hỏi về ngân sách, dịp tặng hoặc phong cách cắm hoa yêu thích!
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {[
                      "Bó hoa hồng tặng bạn gái tầm 500k",
                      "Kệ hoa khai trương 1 triệu tone đỏ",
                      "Tư vấn hoa sinh nhật mẹ sang trọng",
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sample)}
                        className="rounded-full border border-dashed border-red-300 bg-red-50/60 px-3 py-1.5 text-xs text-red-800 hover:bg-red-100 transition-colors"
                      >
                        ⚡ {sample}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.senderType === "USER"
                  const isSystem = m.senderType === "SYSTEM"
                  const suggestedFlowers = m.metadata?.suggestedFlowers || []

                  if (isSystem) {
                    return (
                      <div key={m.id} className="rounded-lg bg-surface-raised border border-border p-3 text-center text-text-muted italic">
                        {m.content}
                      </div>
                    )
                  }

                  return (
                    <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                          <Bot className="h-4 w-4" />
                        </span>
                      )}

                      <div className={`max-w-[80%] space-y-3`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isUser
                              ? "bg-red-600 text-white font-medium rounded-br-none"
                              : "bg-surface-raised border border-border text-foreground rounded-bl-none"
                          }`}
                        >
                          {m.content}
                        </div>

                        {/* Danh sách Card mẫu hoa gợi ý từ Master Index */}
                        {suggestedFlowers.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="text-[11px] font-bold text-red-900 flex items-center gap-1.5">
                              <Flower2 className="h-3.5 w-3.5 text-red-600" />
                              Mẫu hoa đề xuất từ Master Catalog ({suggestedFlowers.length} mẫu):
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                              {suggestedFlowers.map((f: any) => (
                                <div
                                  key={f.productId}
                                  className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/40 p-2.5 shadow-xs"
                                >
                                  {f.sampleImageUrl ? (
                                    <img
                                      src={f.sampleImageUrl}
                                      alt={f.productName}
                                      className="h-16 w-16 rounded-lg object-cover border border-red-200"
                                    />
                                  ) : (
                                    <div className="h-16 w-16 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                                      <Flower2 className="h-6 w-6" />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-foreground text-xs truncate">
                                      {f.productName}
                                    </div>
                                    <div className="text-red-600 font-extrabold text-xs mt-0.5">
                                      {Number(f.priceVnd).toLocaleString("vi-VN")} đ
                                    </div>
                                    <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                      {f.reason}
                                    </div>
                                  </div>

                                  <Button
                                    size="sm"
                                    disabled={creatingOrderFor === f.productId}
                                    onClick={() => handleQuickCreateOrder(f.productId)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs shrink-0"
                                  >
                                    {creatingOrderFor === f.productId ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <ShoppingBag className="mr-1 h-3.5 w-3.5" /> Chốt đơn
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raised border border-border text-foreground">
                          <User className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Khung soạn tin nhắn */}
            <div className="border-t border-border p-3 bg-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Hỏi về ngân sách, dịp tặng, màu sắc hoặc mẫu hoa..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputQuery.trim() || sending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
