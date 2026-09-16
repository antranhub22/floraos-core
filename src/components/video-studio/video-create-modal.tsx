"use client";

import React, { useState } from "react";
import { X, Sparkles, Clock, Coins, Film, Music, Mic, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  if (!isOpen) return null;

  const currentSpec = VIDEO_FORMAT_SPECS[format];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-xl bg-surface border border-border shadow-xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Film size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text">Khởi tạo Video Marketing AI</h3>
              <p className="text-xs text-text-muted">Chọn khuôn định dạng và cấu hình ban đầu</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
            <X size={16} />
          </Button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
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
                  <div
                    key={fmtKey}
                    onClick={() => setFormat(fmtKey)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border bg-background hover:border-border-hover"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-text">{spec.label}</span>
                      <Badge tone={isSelected ? "success" : "neutral"} className="text-[10px] px-1.5 py-0">
                        {spec.aspectRatio}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-muted mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> ~{spec.targetDurationSeconds}s
                      </span>
                      <span className="font-semibold text-amber-600 flex items-center gap-0.5">
                        <Coins size={11} /> {spec.defaultCreditCost} credits
                      </span>
                    </div>
                  </div>
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
              className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-primary focus:outline-none"
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
                className="w-full rounded-lg border border-border px-2.5 py-2 text-xs focus:border-primary focus:outline-none"
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
                className="w-full rounded-lg border border-border px-2.5 py-2 text-xs focus:border-primary focus:outline-none"
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
                    onClick={() => setCaptionStyle(stKey)}
                    className={`text-left rounded-xl p-2.5 border transition-all text-xs flex flex-col justify-between gap-1 ${
                      isSel
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                        : "border-border bg-background hover:border-border-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-[11px] text-text">{spec.label}</span>
                      {isSel && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted leading-tight line-clamp-2">
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
              <span className="text-text-muted text-[11px]">
                {format === "SLIDESHOW" ? "Slideshow cục bộ chi phí $0 API" : "Bao gồm chi phí AI Render & Giọng đọc"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-amber-600">
              <Coins size={15} />
              {currentSpec?.defaultCreditCost} Credits
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-auto">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={loading || !title.trim()} className="gap-2">
              <Sparkles size={15} />
              {loading ? "Đang khởi tạo..." : "Tạo & Dựng kịch bản"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
