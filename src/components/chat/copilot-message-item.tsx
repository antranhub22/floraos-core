"use client"

import React from "react"
import { Bot, BookOpen, ExternalLink, Flower2, ShoppingBag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChatMessageMetadata } from "@/modules/chat-assistant/domain/chat-types"

interface CopilotMessageItemProps {
  message: {
    id: string
    senderType: string
    content: string
    metadata?: ChatMessageMetadata | undefined
  }
  creatingOrderFor: string | null
  onQuickCreateOrder: (productId: string) => void
  onNavigate: (route: string) => void
}

export function CopilotMessageItem({
  message,
  creatingOrderFor,
  onQuickCreateOrder,
  onNavigate,
}: CopilotMessageItemProps) {
  const isUser = message.senderType === "USER"
  const isSystem = message.senderType === "SYSTEM"
  const meta: ChatMessageMetadata = message.metadata || {}
  const suggestedFlowers = meta.suggestedFlowers || []
  const targetRoute = meta.targetRoute
  const actionLabel = meta.actionLabel

  if (isSystem) {
    return (
      <div className="rounded-lg bg-surface-raised border border-border p-2.5 text-center text-[11px] text-muted-foreground italic">
        {message.content}
      </div>
    )
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
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
          {message.content}
        </div>

        {/* NÚT DEEP LINK CHUYỂN TRANG NHANH KHI HỎI VẬN HÀNH SAAS */}
        {targetRoute && actionLabel && (
          <div className="pt-1">
            <Button
              size="sm"
              onClick={() => onNavigate(targetRoute)}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {actionLabel}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* THẺ MẪU HOA GỢI Ý TỪ MASTER INDEX */}
        {suggestedFlowers.length > 0 && (
          <div className="space-y-2 pt-1">
            {suggestedFlowers.map((f) => (
              <div
                key={f.productId}
                className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/60 p-2 shadow-2xs"
              >
                {f.sampleImageUrl ? (
                  <img
                    src={f.sampleImageUrl}
                    alt={f.productName}
                    className="h-12 w-12 rounded-lg object-cover border border-red-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
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
                  disabled={creatingOrderFor === f.productId}
                  onClick={() => onQuickCreateOrder(f.productId)}
                  className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white text-[11px] shrink-0"
                >
                  {creatingOrderFor === f.productId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="mr-1 h-3 w-3" /> Chốt đơn
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
