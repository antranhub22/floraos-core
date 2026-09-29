"use client";

import React, { useState } from "react";
import { Sparkles, Clock, Coins, Film, Music, Mic, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  VideoFormat,
  VIDEO_FORMAT_SPECS,
  CaptionStyle,
  CAPTION_STYLE_SPECS,
} from "@/modules/video-studio/domain/video-types";

interface VideoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    format: VideoFormat;
    musicTrack?: string | undefined;
    voiceCode?: string | undefined;
    captionStyle?: CaptionStyle | undefined;
  }) => Promise<void>;
}

export function VideoCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: VideoCreateModalProps) {
  const [format, setFormat] = useState<VideoFormat>("REEL_15S");
  const [title, setTitle] = useState("Video giới thiệu bó hoa tươi");
  const [musicTrack, setMusicTrack] = useState("Acoustic Warm Guitar");
  const [voiceCode, setVoiceCode] = useState("vi-VN-Standard-A");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("MODERN_BADGE");
  const [loading, setLoading] = useState(false);

  const currentSpec = VIDEO_FORMAT_SPECS[format];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        format,
        musicTrack: musicTrack || undefined,
        voiceCode: voiceCode || undefined,
        captionStyle,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) onClose();
      }}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Film size={18} />
          </div>
          <span>Khởi tạo Video Marketing AI</span>
        </div>
      }
      description="Chọn khuôn định dạng và cấu hình ban đầu cho video thương mại"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="video-create-form"
            disabled={loading || !title.trim()}
            className="gap-2 shadow-xs"
          >
            <Sparkles size={15} />
            {loading ? "Đang khởi tạo..." : "Tạo & Dựng kịch bản"}
          </Button>
        </div>
      }
    >
      <form
        id="video-create-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 text-xs"
      >
        {/* 1. Chọn khuôn video */}
        <div>
          <label className="text-xs font-bold text-text block mb-2">
            1. Chọn khuôn định dạng video (6 chuẩn thương mại)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(VIDEO_FORMAT_SPECS) as VideoFormat[]).map((fmtKey) => {
              const spec = VIDEO_FORMAT_SPECS[fmtKey];
              const isSelected = format === fmtKey;
              return (
                <button
                  key={fmtKey}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFormat(fmtKey)}
                  className={`text-left rounded-xl border p-3 transition-all flex flex-col justify-between gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                      : "border-border bg-surface hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <span className="text-xs font-bold text-text">{spec.label}</span>
                    <Badge tone={isSelected ? "success" : "neutral"} className="text-caption px-1.5 py-0">
                      {spec.aspectRatio}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-caption text-text-muted mt-1 w-full">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> ~{spec.targetDurationSeconds}s
                    </span>
                    <span className="font-semibold text-warning flex items-center gap-0.5">
                      <Coins size={11} /> {spec.defaultCreditCost} credits
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Tiêu đề video */}
        <div>
          <label className="text-xs font-bold text-text block mb-1.5">
            2. Tên chiến dịch / Tiêu đề video
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Video giới thiệu bó hoa hồng Valentine..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        {/* 3. Âm nhạc & Lồng tiếng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted flex items-center gap-1 mb-1.5">
              <Music size={13} /> Nhạc nền (Bản quyền miễn phí)
            </label>
            <select
              value={musicTrack}
              onChange={(e) => setMusicTrack(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs focus:border-primary focus:outline-none"
            >
              <option value="Acoustic Warm Guitar">Acoustic Warm Guitar</option>
              <option value="Upbeat Cheerful Pop">Upbeat Cheerful Pop</option>
              <option value="Lo-Fi Chill Beats">Lo-Fi Chill Beats</option>
              <option value="Romantic Piano Melody">Romantic Piano Melody</option>
              <option value="">Không sử dụng nhạc nền</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted flex items-center gap-1 mb-1.5">
              <Mic size={13} /> Giọng đọc lồng tiếng AI
            </label>
            <select
              value={voiceCode}
              onChange={(e) => setVoiceCode(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs focus:border-primary focus:outline-none"
            >
              <option value="vi-VN-Standard-A">Tiếng Việt - Nữ truyền cảm</option>
              <option value="vi-VN-Standard-B">Tiếng Việt - Nam ấm áp</option>
              <option value="vi-VN-Standard-C">Tiếng Việt - Nữ trẻ trung</option>
              <option value="">Không sử dụng giọng đọc</option>
            </select>
          </div>
        </div>

        {/* 4. Phong cách Phụ đề (Caption Styles) */}
        <div>
          <label className="text-xs font-semibold text-text-muted flex items-center gap-1 mb-2">
            <Type size={13} /> Phong cách Phụ đề chữ trên Video (Caption Styles)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(CAPTION_STYLE_SPECS) as CaptionStyle[]).map((stKey) => {
              const spec = CAPTION_STYLE_SPECS[stKey];
              const isSel = captionStyle === stKey;
              return (
                <button
                  key={stKey}
                  type="button"
                  aria-pressed={isSel}
                  onClick={() => setCaptionStyle(stKey)}
                  className={`text-left rounded-xl p-2.5 border transition-all text-xs flex flex-col justify-between gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isSel
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                      : "border-border bg-surface hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-caption text-text">{spec.label}</span>
                    {isSel && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-caption text-text-muted leading-tight line-clamp-2">
                    {spec.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chi phí ước tính */}
        <div className="rounded-xl bg-surface-alt border border-border p-3.5 flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="font-bold text-text">Dự toán hạn mức:</span>
            <span className="text-text-muted text-caption">
              {format === "SLIDESHOW" ? "Slideshow cục bộ chi phí $0 API" : "Bao gồm chi phí AI Render & Giọng đọc"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-extrabold text-warning">
            <Coins size={15} />
            {currentSpec?.defaultCreditCost} Credits
          </div>
        </div>
      </form>
    </Dialog>
  );
}
