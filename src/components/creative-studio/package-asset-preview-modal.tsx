"use client"

import React, { useState } from "react"
import {
  X,
  Copy,
  Check,
  Film,
  FileText,
  Image as ImageIcon,
  Headphones,
  Sparkles,
  Volume2,
  Play,
  Clock,
  Download,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PackageAssetPreviewProps {
  open: boolean
  onClose: () => void
  assetId: string
  assetLabel: string
  productName: string
  topicTitle: string
  sourceImageUrl?: string | undefined
  mode: "CREATIVE" | "AUTHENTIC"
}

export function PackageAssetPreviewModal({
  open,
  onClose,
  assetId,
  assetLabel,
  productName,
  topicTitle,
  sourceImageUrl,
  mode,
}: PackageAssetPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  if (!open) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const renderContent = () => {
    switch (assetId) {
      case "content-caption":
      case "content-post": {
        const postText = `🌸 ${productName.toUpperCase()} — TRỌN VẸN YÊU THƯƠNG\n\n✨ Bó hoa tươi thiết kế sang trọng, tuyển chọn từng đóa hoa nở căng tràn sức sống. Thiết kế độc bản theo phong cách hiện đại, phối màu tinh tế giúp bạn gửi gắm trọn vẹn sự chân thành và tình cảm ấm áp.\n\n💐 Phù hợp: Sinh nhật, Kỷ niệm, Chúc mừng khai trương, Tri ân người thương.\n🎁 Tặng kèm: Thiệp thiết kế in thông điệp riêng + Hướng dẫn chăm sóc hoa tươi bền lâu.\n\n👉 Đặt hoa ngay hôm nay để nhận ưu đãi giao nhanh trong 2 giờ!`
        return (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <span>Nội dung bài viết hoàn chỉnh</span>
                <button
                  type="button"
                  onClick={() => handleCopy(postText)}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold"
                >
                  {copied ? <><Check size={12} /> Đã sao chép</> : <><Copy size={12} /> Sao chép</>}
                </button>
              </div>
              <p className="text-stone-800 whitespace-pre-line leading-relaxed font-medium bg-white p-3 rounded-lg border border-stone-100">
                {postText}
              </p>
            </div>
          </div>
        )
      }

      case "content-hashtags": {
        const tags = ["#hoatuoi", "#hoasinhnhat", "#tiemhoatuoi", "#quatangbangai", "#floristvietnam", "#bohoasangtrong", "#hoatuoithietke", "#langhoa"]
        return (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 font-bold">Danh sách hashtags tối ưu thuật toán:</span>
              <button
                type="button"
                onClick={() => handleCopy(tags.join(" "))}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold"
              >
                {copied ? <><Check size={12} /> Đã sao chép tất cả</> : <><Copy size={12} /> Sao chép tất cả</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-800 font-semibold text-xs border border-stone-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )
      }

      case "image-variant-1":
      case "image-variant-2":
      case "image-crop": {
        const isPastel = assetId === "image-variant-1"
        return (
          <div className="space-y-3 text-xs">
            <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-900 group">
              <img
                src={sourceImageUrl || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80"}
                alt={productName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10.5px] font-bold">
                {isPastel ? "✨ Studio AI Pastel" : "👑 Studio AI Luxury"}
              </div>
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-stone-900 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
                © Watermark Bản quyền
              </div>
            </div>
            <p className="text-center text-[11.5px] text-stone-500">
              Độ phân giải: <strong>2048 x 2048px (1:1)</strong> · Bảo toàn 99.9% chủ thể hoa tươi thật
            </p>
          </div>
        )
      }

      case "audio-voiceover":
      case "audio-mix": {
        const script = `Chào bạn, nếu bạn đang tìm kiếm một món quà thật tinh tế để gửi gắm tình cảm trong dịp đặc biệt, thì ${productName} chính là lựa chọn hoàn hảo nhất.`
        return (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Volume2 size={15} /> Giọng đọc Edge TTS (vi-VN-HoaiMyNeural)
                </span>
                <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                  <Clock size={11} /> 15 giây
                </span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-purple-100 font-medium text-stone-800 leading-relaxed italic">
                "{script}"
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs font-bold"
                >
                  <Play size={13} /> {isPlayingAudio ? "Đang phát..." : "Nghe thử âm thanh"}
                </Button>
                <button
                  type="button"
                  onClick={() => handleCopy(script)}
                  className="text-purple-700 hover:text-purple-900 font-semibold text-xs flex items-center gap-1"
                >
                  {copied ? <><Check size={12} /> Đã chép lời</> : <><Copy size={12} /> Sao chép lời đọc</>}
                </button>
              </div>
            </div>
          </div>
        )
      }

      case "video-story": {
        return (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Fake Phone Screen 9:16 */}
              <div className="relative w-44 aspect-[9/16] rounded-2xl overflow-hidden border-2 border-stone-800 bg-stone-900 shadow-xl shrink-0 flex flex-col justify-between p-3 text-white">
                <img
                  src={sourceImageUrl || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80"}
                  alt={productName}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="relative z-10 flex justify-between items-center text-[10px] font-bold">
                  <span className="bg-rose-600 px-1.5 py-0.5 rounded">TikTok 9:16</span>
                  <span>15s</span>
                </div>
                <div className="relative z-10 flex items-center justify-center my-auto">
                  <div className="h-10 w-10 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition">
                    <Play size={18} className="text-white fill-white ml-0.5" />
                  </div>
                </div>
                <div className="relative z-10 text-[10.5px] leading-tight space-y-1">
                  <p className="font-extrabold text-amber-300 drop-shadow-md">
                    {productName}
                  </p>
                  <p className="text-[9.5px] text-stone-200 line-clamp-2">
                    {topicTitle}
                  </p>
                </div>
              </div>

              {/* Storyboard 3 Beats */}
              <div className="flex-1 space-y-2 w-full">
                <h5 className="font-bold text-stone-900">Phân cảnh dựng video Ken Burns:</h5>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <div className="flex justify-between font-bold text-[11px] text-stone-700">
                      <span>Cảnh 1: Mở đầu thu hút (Hook)</span>
                      <span>5s · Zoom In</span>
                    </div>
                    <p className="text-[11.5px] text-stone-600 mt-1">
                      Cận cảnh đóa hoa tươi rạng rỡ, text overlay chạy chữ nổi bật.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <div className="flex justify-between font-bold text-[11px] text-stone-700">
                      <span>Cảnh 2: Trình diễn chi tiết (Showcase)</span>
                      <span>6s · Pan Right</span>
                    </div>
                    <p className="text-[11.5px] text-stone-600 mt-1">
                      Toàn cảnh bó hoa tươi trên nền bối cảnh Studio sang trọng.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <div className="flex justify-between font-bold text-[11px] text-stone-700">
                      <span>Cảnh 3: Kêu gọi hành động (CTA)</span>
                      <span>4s · Static</span>
                    </div>
                    <p className="text-[11.5px] text-stone-600 mt-1">
                      Hiện hotline tiệm, logo thương hiệu và lời kêu gọi đặt hoa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      default:
        return (
          <p className="text-xs text-stone-500 italic">
            Tài nguyên đã sẵn sàng trong gói chiến dịch.
          </p>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{assetLabel}</h3>
              <p className="text-[11.5px] text-stone-500">Xem trước tài nguyên chiến dịch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {renderContent()}
        </div>

        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs font-bold">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
