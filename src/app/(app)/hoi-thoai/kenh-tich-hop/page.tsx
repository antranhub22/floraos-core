"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Share2,
  ArrowLeft,
  Coins,
  Globe,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"
import { ChannelIntegrationCard } from "@/components/chat/channel-integration-card"
import { ChannelConfigModal } from "@/components/chat/channel-config-modal"

export default function ChatChannelsIntegrationPage() {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingChannel, setUpdatingChannel] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)
  const [configModalChannel, setConfigModalChannel] = useState<any | null>(null)
  const [modalConfigForm, setModalConfigForm] = useState<any>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  function loadChannels() {
    setLoading(true)
    fetch("/api/v1/chat/channels")
      .then((r) => r.json())
      .then((res) => {
        setChannels(res.channels || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadChannels()
  }, [])

  async function handleToggleChannel(channelItem: any) {
    const nextState = !channelItem.isEnabled
    setUpdatingChannel(channelItem.channel)
    setSaveError(null)

    try {
      const res = await fetch("/api/v1/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channelItem.channel,
          isEnabled: nextState,
          config: channelItem.config,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Không thể thay đổi trạng thái kênh")
      } else {
        loadChannels()
      }
    } catch {
      alert("Lỗi kết nối máy chủ")
    } finally {
      setUpdatingChannel(null)
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault()
    if (!configModalChannel) return
    setUpdatingChannel(configModalChannel.channel)
    setSaveError(null)

    try {
      const res = await fetch("/api/v1/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: configModalChannel.channel,
          isEnabled: true,
          config: modalConfigForm,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error || "Lỗi lưu cấu hình kênh")
      } else {
        setConfigModalChannel(null)
        loadChannels()
      }
    } catch {
      setSaveError("Lỗi kết nối máy chủ")
    } finally {
      setUpdatingChannel(null)
    }
  }

  function copyEmbedScript() {
    const code = `<script src="https://floraos.vn/sdk/floraos-chat.js" data-shop-slug="tiem-hoa-moc-lan" defer></script>`
    navigator.clipboard.writeText(code)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col bg-surface overflow-hidden">
      {/* 1. TOP-RIGHT ACTION HEADER CHUẨN SSOT */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-3">
          <Link href={"/hoi-thoai" as any}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold">
              <ArrowLeft className="h-4 w-4" />
              Quay lại Hội thoại
            </Button>
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-red-600" />
            <h1 className="text-sm font-bold text-foreground">
              Tích Hợp Đa Kênh AI Chat Assistant (Omnichannel)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-red-50 text-red-700 border border-red-200 gap-1 text-xs">
            <Coins className="h-3.5 w-3.5" />
            Cơ chế định giá & Thu phí FloraOS
          </Badge>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        <FeatureGuidanceCard
          tag="HƯỚNG DẪN TÍCH HỢP ĐA KÊNH M08"
          title="Kết Nối Trợ Lý Ảo Đa Điểm Chạm & Kiểm Soát Biểu Phí Nền Tảng"
          description="Chủ cửa hàng có toàn quyền lựa chọn kích hoạt AI Assistant trên E-Catalog, Landing Page, Facebook Messenger, Zalo OA hoặc Website riêng. FloraOS-core áp dụng cơ chế trừ credit minh bạch theo gói thuê bao và lượt tin nhắn tư vấn."
          tips={[
            "⚡ E-Catalog & Landing Page: Miễn phí kích hoạt, trừ credit theo lượt tin nhắn AI.",
            "💰 Facebook & Zalo OA: Phí thuê bao tháng (50 - 70 credit/tháng) tự động gia hạn.",
            "🛡️ Aegis Protection: Tự động dừng AI khi hết credit và báo nhân viên trực trả lời.",
          ]}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-red-600" />
              Danh Sách Kênh Tiếp Xúc Khách Hàng
            </h2>
            <span className="text-xs text-muted-foreground">
              Tự động đồng bộ với Product Master Index & Chốt đơn M10
            </span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-red-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((item) => (
                <ChannelIntegrationCard
                  key={item.channel}
                  item={item}
                  isBusy={updatingChannel === item.channel}
                  onToggle={() => handleToggleChannel(item)}
                  onOpenConfig={() => {
                    setConfigModalChannel(item)
                    setModalConfigForm(item.config || {})
                    setSaveError(null)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Khối lấy mã nhúng cho website riêng */}
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white">
                <Globe className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-red-950">
                  Mã Nhúng Trợ Lý Ảo Lên Website Ngoài (WordPress, Haravan, Shopify)
                </h3>
                <p className="text-[11px] text-red-800/80">
                  Chèn thẻ script này vào trước thẻ &lt;/body&gt; trên website của tiệm để mở khung chat 24/7.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={copyEmbedScript}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 gap-1.5 shadow-xs"
            >
              {copiedScript ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedScript ? "Đã chép mã" : "Sao chép mã nhúng"}
            </Button>
          </div>

          <div className="rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-green-400 overflow-x-auto select-all">
            &lt;script src="https://floraos.vn/sdk/floraos-chat.js" data-shop-slug="tiem-hoa-moc-lan" defer&gt;&lt;/script&gt;
          </div>
        </div>
      </div>

      <ChannelConfigModal
        channelItem={configModalChannel}
        configForm={modalConfigForm}
        onChangeForm={setModalConfigForm}
        onClose={() => setConfigModalChannel(null)}
        onSubmit={handleSaveConfig}
        saveError={saveError}
        isBusy={updatingChannel !== null}
      />
    </div>
  )
}
