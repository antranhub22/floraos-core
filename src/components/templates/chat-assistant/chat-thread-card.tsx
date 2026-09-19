"use client"

import React, { useState } from "react"
import { Bot, User, Send, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface ChatMessage {
  id: string
  sender: "user" | "bot" | "staff"
  content: string
  time: string
  suggestedProducts?: { name: string; price: string }[]
}

export interface ChatThreadCardProps {
  customerName: string
  channel: "zalo" | "facebook" | "web"
  messages: ChatMessage[]
  onSendMessage?: (text: string) => void
  onTakeover?: () => void
}

/**
 * ChatThreadCard (Thẻ hội thoại tư vấn AI M10)
 */
export function ChatThreadCard({
  customerName,
  channel,
  messages,
  onSendMessage,
  onTakeover,
}: ChatThreadCardProps) {
  const [inputText, setInputText] = useState("")

  const handleSend = () => {
    if (!inputText.trim() || !onSendMessage) return
    onSendMessage(inputText)
    setInputText("")
  }

  return (
    <Card className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {customerName.charAt(0)}
          </div>
          <div>
            <div className="text-[15px] font-extrabold text-text">{customerName}</div>
            <div className="text-[11px] text-text-muted capitalize">Kênh: {channel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success" className="gap-1">
            <Sparkles size={11} />
            AI đang hỗ trợ
          </Badge>
          {onTakeover && (
            <Button variant="secondary" size="sm" onClick={onTakeover} className="h-7 text-xs">
              Tiếp quản chat
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface-alt/40 p-3.5">
        {messages.map((msg) => {
          const isUser = msg.sender === "user"
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  isUser
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-surface-alt text-text rounded-bl-none border border-border"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] opacity-75 font-semibold">
                  {isUser ? <User size={10} /> : <Bot size={10} />}
                  {isUser ? customerName : "Trợ lý AI Flora"} • {msg.time}
                </div>
                {msg.content}

                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1 border-t border-border/40 pt-1.5">
                    {msg.suggestedProducts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded bg-surface/60 px-2 py-1 text-[11px]">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-primary font-bold">{p.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập tin nhắn hoặc kịch bản trả lời..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button size="sm" onClick={handleSend} className="gap-1.5">
          <Send size={14} />
          Gửi
        </Button>
      </div>
    </Card>
  )
}
