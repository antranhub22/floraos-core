"use client"

import React from "react"
import { Settings, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChannelConfigModalProps {
  channelItem: any
  configForm: any
  onChangeForm: (newForm: any) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  saveError: string | null
  isBusy: boolean
}

export function ChannelConfigModal({
  channelItem,
  configForm,
  onChangeForm,
  onClose,
  onSubmit,
  saveError,
  isBusy,
}: ChannelConfigModalProps) {
  if (!channelItem) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="font-bold text-sm text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-red-600" />
            Cài Đặt {channelItem.pricing.name}
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {saveError && (
          <div className="rounded-xl bg-red-100 border border-red-200 p-2.5 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            {saveError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          {channelItem.channel === "FACEBOOK_MESSENGER" && (
            <>
              <div>
                <label className="font-bold text-muted-foreground mb-1 block">Facebook Page ID</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 1048291048102"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  value={configForm.fbPageId || ""}
                  onChange={(e) =>
                    onChangeForm({ ...configForm, fbPageId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-muted-foreground mb-1 block">Page Access Token</label>
                <input
                  type="password"
                  required
                  placeholder="EAAG..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-[11px]"
                  value={configForm.fbPageAccessToken || ""}
                  onChange={(e) =>
                    onChangeForm({ ...configForm, fbPageAccessToken: e.target.value })
                  }
                />
              </div>
              <div className="rounded-lg bg-surface-raised p-2 text-[11px] text-muted-foreground">
                Webhook Callback URL: <code className="text-red-600">https://floraos.vn/api/v1/chat/webhooks/facebook</code>
              </div>
            </>
          )}

          {channelItem.channel === "ZALO_OA" && (
            <>
              <div>
                <label className="font-bold text-muted-foreground mb-1 block">Zalo OA ID</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 394810294810"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  value={configForm.zaloOaId || ""}
                  onChange={(e) =>
                    onChangeForm({ ...configForm, zaloOaId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-muted-foreground mb-1 block">Zalo OA Access Token</label>
                <input
                  type="password"
                  placeholder="OA Access Token..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-[11px]"
                  value={configForm.zaloAccessToken || ""}
                  onChange={(e) =>
                    onChangeForm({ ...configForm, zaloAccessToken: e.target.value })
                  }
                />
              </div>
              <div className="rounded-lg bg-surface-raised p-2 text-[11px] text-muted-foreground">
                Webhook Callback URL: <code className="text-red-600">https://floraos.vn/api/v1/chat/webhooks/zalo</code>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isBusy}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Lưu & Bật Kênh"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
