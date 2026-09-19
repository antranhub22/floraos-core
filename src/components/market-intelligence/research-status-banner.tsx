"use client";

import React from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowDown, ExternalLink } from "lucide-react";

export type ResearchBannerState = "idle" | "running" | "completed" | "error";

export interface ResearchStatusInfo {
  state: ResearchBannerState;
  message: string;
  keyword?: string;
  details?: string;
}

interface ResearchStatusBannerProps {
  status: ResearchStatusInfo;
  onViewResults?: () => void;
  onDismiss?: () => void;
}

export function ResearchStatusBanner({
  status,
  onViewResults,
  onDismiss,
}: ResearchStatusBannerProps) {
  if (status.state === "idle") return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 shadow-sm ${
        status.state === "running"
          ? "border-rose-200 bg-gradient-to-r from-rose-50/90 via-pink-50/70 to-rose-50/90 text-rose-950"
          : status.state === "completed"
          ? "border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 text-emerald-950"
          : "border-red-200 bg-red-50 text-red-950"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {status.state === "running" ? (
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
          ) : status.state === "completed" ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold tracking-tight">
                {status.state === "running" && "Đang nghiên cứu đa kênh..."}
                {status.state === "completed" && "Nghiên cứu hoàn tất, đã cập nhật dữ liệu"}
                {status.state === "error" && "Lỗi trong quá trình nghiên cứu"}
              </h3>
              {status.keyword && (
                <span className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold shadow-xs">
                  {status.keyword}
                </span>
              )}
            </div>
            <p className="text-[12px] opacity-90 leading-relaxed font-medium">
              {status.message}
            </p>
            {status.details && (
              <p className="text-[11px] opacity-75 italic">{status.details}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {status.state === "completed" && onViewResults && (
            <button
              type="button"
              onClick={onViewResults}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Xem kết quả ngay
            </button>
          )}

          {status.state === "running" && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100/80 px-2.5 py-1 text-[11px] font-bold text-rose-800">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
              Đang cào dữ liệu...
            </div>
          )}

          {onDismiss && status.state !== "running" && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-black/5 transition text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {status.state === "running" && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-rose-100">
          <div className="h-full w-full bg-rose-600 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
