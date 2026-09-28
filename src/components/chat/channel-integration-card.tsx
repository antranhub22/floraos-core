"use client"

import React from "react"
import { Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ChannelStatusItem } from "@/modules/chat-assistant/use-cases/list-chat-channels"

interface ChannelIntegrationCardProps {
  item: ChannelStatusItem
  isBusy: boolean
  onToggle: () => void
  onOpenConfig: () => void
}

export function ChannelIntegrationCard({
  item,
  isBusy,
  onToggle,
  onOpenConfig,
}: ChannelIntegrationCardProps) {
  const { channel, pricing, isEnabled, subscriptionExpiresAt } = item
  const isFree = pricing.isFree

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-xs ${
        isEnabled
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-surface hover:border-primary/20"
      }`}
    >
      <div className="space-y-3">
        {/* Header Kênh */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-sm text-foreground">{pricing.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {pricing.description}
            </div>
          </div>
          <Badge
            className={`text-[10px] shrink-0 font-bold ${
              isEnabled
                ? "bg-success-bg text-success border-success/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isEnabled ? "Đang Bật" : "Đang Tắt"}
          </Badge>
        </div>

        {/* Thông tin biểu phí */}
        <div className="rounded-xl bg-surface-raised border border-border/70 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px]">Phí kích hoạt kênh:</span>
            <span className="font-bold text-primary">
              {isFree ? "Miễn Phí" : `${pricing.monthlyCreditCost} Credit / tháng`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px]">Phí tin nhắn tư vấn:</span>
            <span className="font-medium text-foreground">
              {pricing.messageCreditCost} Credit / 10 tin
            </span>
          </div>
          {!isFree && subscriptionExpiresAt && (
            <div className="flex items-center justify-between border-t border-border pt-1.5 text-[10.5px]">
              <span className="text-muted-foreground">Hạn thuê bao:</span>
              <span className="text-muted-foreground font-mono">
                {new Date(subscriptionExpiresAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex items-center gap-2 pt-4 border-t border-border/70 mt-3">
        {pricing.requiresSetup && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenConfig}
            className="flex-1 text-xs h-8 gap-1"
          >
            <Settings className="h-3.5 w-3.5" />
            Cài đặt API
          </Button>
        )}

        <Button
          size="sm"
          disabled={isBusy}
          variant={isEnabled ? "outline" : "primary"}
          onClick={onToggle}
          className={`text-xs h-8 ${pricing.requiresSetup ? "flex-1" : "w-full"} ${
            !isEnabled ? "bg-primary hover:bg-primary-dark text-white" : "border-primary/30 text-primary hover:bg-primary/5"
          }`}
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isEnabled ? (
            "Tắt kênh"
          ) : (
            `Kích hoạt ${!isFree ? `(${pricing.monthlyCreditCost} cr)` : ""}`
          )}
        </Button>
      </div>
    </div>
  )
}
