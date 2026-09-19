"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Video, Image as ImageIcon, Sparkles, Send } from "lucide-react";
import type { ProductContentReadiness } from "@/modules/market-intelligence/domain/product-intelligence-types";

interface ProductReadinessCardProps {
  readiness: ProductContentReadiness;
  onGoToVideo: () => void;
  onGoToMedia: () => void;
}

export function ProductReadinessCard({
  readiness,
  onGoToVideo,
  onGoToMedia,
}: ProductReadinessCardProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-700/60 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-rose-400" />
            6. Đánh giá mức độ sẵn sàng tiếp thị
          </h3>
          <p className="text-[11.5px] text-stone-300">
            Hệ thống đã kiểm duyệt các tiêu chí kỹ thuật và định vị để sẵn sàng chuyển giao sang các xưởng sáng tạo
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto">
          <CheckCircle2 size={14} />
          Đủ điều kiện xuất bản
        </div>
      </div>

      {/* Grid Tiêu chí */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center space-y-1">
          <span className="text-[10px] text-stone-400 block">Nhận diện hoa</span>
          <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 size={13} /> Hoàn tất
          </span>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center space-y-1">
          <span className="text-[10px] text-stone-400 block">Khớp xu hướng</span>
          <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 size={13} /> Trend Fit Cao
          </span>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center space-y-1">
          <span className="text-[10px] text-stone-400 block">Khách hàng mục tiêu</span>
          <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 size={13} /> Đã xác lập
          </span>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center space-y-1">
          <span className="text-[10px] text-stone-400 block">Định vị & Dịp tặng</span>
          <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 size={13} /> Đã chuẩn hóa
          </span>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center space-y-1">
          <span className="text-[10px] text-stone-400 block">Chất lượng ảnh</span>
          <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 size={13} /> Sắc nét (HD)
          </span>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center space-y-1">
          <span className="text-[10px] text-stone-400 block">Tiềm năng Video</span>
          <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 size={13} /> Rất cao
          </span>
        </div>
      </div>

      {/* Action Handoffs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <span className="text-xs text-stone-300 font-medium">
          🚀 Chuyển giao ngay sang các công cụ sáng tạo nội dung của FloraOS:
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onGoToMedia}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition"
          >
            <ImageIcon size={14} />
            Tạo ảnh biến thể marketing
          </button>

          <button
            type="button"
            onClick={onGoToVideo}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
          >
            <Video size={14} />
            Dựng video marketing tự động
          </button>
        </div>
      </div>
    </div>
  );
}
