"use client"

import React from "react"
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface ConnectedChannel {
  id: string
  name: string
  accountName: string
  isConnected: boolean
  lastSyncTime?: string
}

export interface ChannelStatusCardProps {
  channels: ConnectedChannel[]
  onReconnect?: (id: string) => void
}

/**
 * ChannelStatusCard (Thẻ kết nối kênh mạng xã hội M07)
 */
export function ChannelStatusCard({
  channels,
  onReconnect,
}: ChannelStatusCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div>
        <div className="text-xs font-semibold text-text-muted">M07 Channel Integration</div>
        <div className="text-[16px] font-extrabold text-text">Trạng thái kết nối kênh</div>
      </div>

      <div className="flex flex-col gap-2">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  ch.isConnected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {ch.isConnected ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              </div>
              <div>
                <div className="text-xs font-bold text-text">{ch.name}</div>
                <div className="text-[11px] text-text-muted">{ch.accountName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">{ch.lastSyncTime || "Vừa xong"}</span>
              {!ch.isConnected && onReconnect && (
                <Button variant="outline" size="sm" onClick={() => onReconnect(ch.id)} className="gap-1 h-7 text-xs">
                  <RefreshCw size={12} />
                  Kết nối lại
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
