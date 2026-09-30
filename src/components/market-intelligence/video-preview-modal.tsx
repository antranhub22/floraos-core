"use client";

import React, { useEffect } from "react";
import { X, ExternalLink, Play, Film } from "lucide-react";

export interface VideoPreviewModalData {
  title: string;
  videoUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  thumbnailUrl?: string;
  author?: string;
  metrics?: string;
  topicName?: string;
}

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VideoPreviewModalData | null;
}

/**
 * Trích xuất YouTube Video ID từ nhiều định dạng URL khác nhau
 * (watch?v=, youtu.be/, embed/, shorts/, hoặc CDN thumbnail i.ytimg.com/vi/)
 */
export function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|i\.ytimg\.com\/vi\/)([\w-]{11})/
  );
  return match && match[1] ? match[1] : null;
}

export function VideoPreviewModal({ isOpen, onClose, data }: VideoPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  // Tìm YouTube Video ID từ youtubeUrl, videoUrl hoặc thumbnailUrl
  const ytId =
    extractYouTubeVideoId(data.youtubeUrl) ||
    extractYouTubeVideoId(data.videoUrl) ||
    extractYouTubeVideoId(data.thumbnailUrl);

  const directExternalUrl = data.youtubeUrl || data.videoUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : undefined);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
              role="button"
              tabIndex={0}
        className="relative w-full max-w-3xl bg-cool-950 rounded-2xl overflow-hidden shadow-2xl border border-cool-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cool-800/80 bg-cool-900/60">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush-600 text-white shrink-0 shadow-xs">
              <Film size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-caption font-extrabold uppercase px-1.5 py-0.5 rounded bg-blush-500/20 text-blush-400 border border-blush-500/30">
                  Dẫn chứng video
                </span>
                {data.topicName && (
                  <span className="text-xs font-semibold text-cool-400 truncate">
                    • {data.topicName}
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {data.title || "Video xu hướng"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng video"
            className="flex h-8 w-8 items-center justify-center rounded-full text-cool-400 hover:text-white hover:bg-cool-800 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {ytId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              title={data.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : data.videoUrl?.endsWith(".mp4") ? (
            <video
              src={data.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-cool-800 text-cool-400 flex items-center justify-center mx-auto">
                <Play size={20} className="translate-x-0.5" />
              </div>
              <p className="text-xs text-cool-300">
                Video này có định dạng xem trực tiếp trên nền tảng nguồn
              </p>
              {directExternalUrl && (
                <a
                  href={directExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blush-600 hover:bg-blush-500 text-white text-xs font-bold transition-colors"
                >
                  <span>Mở video trên tab mới</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Meta & Controls */}
        <div className="px-4 py-2.5 bg-cool-900/90 border-t border-cool-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-cool-400 text-caption">
            {data.author && (
              <span>
                Kênh: <strong className="text-cool-200">{data.author}</strong>
              </span>
            )}
            {data.metrics && (
              <span>
                Chỉ số: <span className="text-sand-400 font-semibold">{data.metrics}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {directExternalUrl && (
              <a
                href={directExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cool-800 hover:bg-cool-700 text-cool-200 hover:text-white text-caption font-semibold transition-colors"
              >
                <span>Xem trên YouTube</span>
                <ExternalLink size={11} />
              </a>
            )}
            {data.tiktokUrl && (
              <a
                href={data.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cool-800 hover:bg-cool-700 text-cool-200 hover:text-white text-caption font-semibold transition-colors"
              >
                <span>Kênh TikTok</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
