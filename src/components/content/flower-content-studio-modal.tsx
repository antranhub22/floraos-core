"use client"

import React, { useState, useMemo } from "react"
import { Copy, Check, Sparkles, Video, Share2, FileText, ShoppingBag } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  generateFlowerContent,
  TONE_LABELS,
  type ContentFormatType,
  type ToneOfVoice,
  type FlowerContentInput,
} from "@/modules/content-engine/domain/flower-content-presets"

export interface FlowerContentStudioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialProductName?: string | undefined
  initialOccasion?: string | undefined
  initialColorTheme?: string | undefined
}

const FORMAT_OPTIONS: Array<{ value: ContentFormatType; label: string; icon: React.ReactNode }> = [
  { value: "FB_POST", label: "Facebook Post", icon: <Share2 size={13} /> },
  { value: "INSTA_CAPTION", label: "Instagram Caption", icon: <Sparkles size={13} /> },
  { value: "VIDEO_SCRIPT", label: "Kịch bản Video 30s", icon: <Video size={13} /> },
  { value: "WEB_DESCRIPTION", label: "Mô tả sản phẩm", icon: <ShoppingBag size={13} /> },
  { value: "SHORT_STATUS", label: "Story / Zalo", icon: <FileText size={13} /> },
]

export function FlowerContentStudioModal({
  open,
  onOpenChange,
  initialProductName = "Bó Hoa Hồng Juliet",
  initialOccasion = "Sinh nhật",
  initialColorTheme = "Cam pastel",
}: FlowerContentStudioModalProps) {
  const [productName, setProductName] = useState(initialProductName)
  const [occasion, setOccasion] = useState(initialOccasion)
  const [colorTheme, setColorTheme] = useState(initialColorTheme)
  const [flowerTypesText, setFlowerTypesText] = useState("Hồng Juliet, Baby trắng, Lá bạc")
  const [format, setFormat] = useState<ContentFormatType>("FB_POST")
  const [tone, setTone] = useState<ToneOfVoice>("SANG_TRONG")
  const [copied, setCopied] = useState(false)

  const contentResult = useMemo(() => {
    const flowers = flowerTypesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const input: FlowerContentInput = {
      productName: productName.trim() || "Mẫu hoa thiết kế",
      occasion: occasion.trim() || undefined,
      colorTheme: colorTheme.trim() || undefined,
      flowerTypes: flowers.length > 0 ? flowers : undefined,
      format,
      tone,
    }

    return generateFlowerContent(input)
  }, [productName, occasion, colorTheme, flowerTypesText, format, tone])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentResult.fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center justify-between gap-3 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">Studio sinh nội dung bán hoa</span>
            <Badge tone="accent" className="text-caption">5 Tone giọng</Badge>
          </div>
          <span className="text-caption text-muted">Chuẩn format mạng xã hội</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-caption text-muted">
            Độ dài: <span className="font-semibold text-text">{contentResult.characterCount} ký tự</span> ({contentResult.recommendedPlatform})
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check size={14} className="mr-1 text-success" />
                  Đã sao chép bài viết!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1" />
                  Sao chép bài viết
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
        {/* Cột trái: Tùy chỉnh thông tin & Tone giọng */}
        <div className="space-y-3.5">
          {/* Chọn Format kênh */}
          <div>
            <label className="block text-caption font-semibold text-text mb-1.5">Kênh đăng bài / Định dạng</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  type="button"
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-caption font-medium transition ${
                    format === f.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-surface text-muted hover:border-primary/40"
                  }`}
                >
                  {f.icon}
                  <span className="truncate">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Tone of Voice */}
          <div>
            <label className="block text-caption font-semibold text-text mb-1.5">Sắc thái giọng văn (Tone of Voice)</label>
            <div className="grid grid-cols-1 gap-1.5">
              {(Object.keys(TONE_LABELS) as ToneOfVoice[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTone(t)}
                  className={`text-left px-3 py-2 rounded-lg border transition ${
                    tone === t
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-caption font-semibold ${tone === t ? "text-primary" : "text-text"}`}>
                      {TONE_LABELS[t].label}
                    </span>
                    {tone === t && <Badge tone="accent" className="text-caption">Đang chọn</Badge>}
                  </div>
                  <p className="text-caption text-muted mt-0.5">{TONE_LABELS[t].desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Nhập liệu chi tiết hoa */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-caption font-medium text-muted mb-1">Tên sản phẩm hoa</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-surface text-body-sm text-text"
                placeholder="vd: Bó Hoa Juliet"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-muted mb-1">Dịp tặng</label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-surface text-body-sm text-text"
                placeholder="vd: Sinh nhật, Kỷ niệm..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-caption font-medium text-muted mb-1">Tông màu chủ đạo</label>
              <input
                type="text"
                value={colorTheme}
                onChange={(e) => setColorTheme(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-surface text-body-sm text-text"
                placeholder="vd: Hồng phấn, Cam pastel..."
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-muted mb-1">Các loại hoa chính</label>
              <input
                type="text"
                value={flowerTypesText}
                onChange={(e) => setFlowerTypesText(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-surface text-body-sm text-text"
                placeholder="Phân cách bằng dấu phẩy"
              />
            </div>
          </div>
        </div>

        {/* Cột phải: Khối xem trước bài đăng (Social Live Preview) */}
        <div className="flex flex-col h-full rounded-xl border border-border bg-surface p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-caption text-text">Xem trước trực tiếp</span>
              <Badge tone="neutral" className="text-caption">{contentResult.recommendedPlatform}</Badge>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-caption text-primary hover:underline flex items-center gap-1 font-medium"
            >
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {copied ? "Đã chép" : "Sao chép"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1 text-body-sm">
            {/* Tiêu đề / Hook */}
            <div className="p-2.5 rounded-lg bg-surface-alt border border-border">
              <div className="text-caption text-muted font-medium mb-0.5">Tiêu đề (Headline):</div>
              <div className="font-bold text-text text-body-sm">{contentResult.headline}</div>
            </div>

            {/* Phân cảnh kịch bản Video nếu có */}
            {contentResult.videoScenes && contentResult.videoScenes.length > 0 ? (
              <div className="space-y-2">
                <div className="text-caption font-semibold text-text">Phân cảnh kịch bản:</div>
                {contentResult.videoScenes.map((scene, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border bg-surface space-y-1">
                    <div className="text-caption font-bold text-primary">{scene.timeRange}</div>
                    <div className="text-caption text-text">
                      <span className="font-medium text-muted">Hình ảnh: </span>
                      {scene.visualDesc}
                    </div>
                    <div className="text-caption text-text">
                      <span className="font-medium text-muted">Lời thoại: </span>
                      {scene.voiceover}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Thân bài chuẩn */
              <div className="p-2.5 rounded-lg bg-surface border border-border">
                <div className="text-caption text-muted font-medium mb-1">Nội dung bài viết:</div>
                <div className="text-text whitespace-pre-line leading-relaxed text-body-sm">
                  {contentResult.bodyText}
                </div>
              </div>
            )}

            {/* Kêu gọi hành động */}
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-caption text-primary font-semibold mb-0.5">Kêu gọi hành động (CTA):</div>
              <div className="text-text text-body-sm font-medium">{contentResult.callToAction}</div>
            </div>

            {/* Hashtag */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {contentResult.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-surface-alt border border-border text-caption text-primary font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
