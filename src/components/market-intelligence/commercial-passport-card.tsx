"use client";

import React from "react";
import { Sparkles, Tag, Gift, Users, BookOpen, CheckCircle, DollarSign, PackagePlus } from "lucide-react";
import type { CommercialPassport } from "@/modules/market-intelligence/domain/product-intelligence-types";

interface CommercialPassportCardProps {
  passport: CommercialPassport;
  onChange?: (updated: CommercialPassport) => void;
  readOnly?: boolean;
}

export function CommercialPassportCard({
  passport,
  onChange,
  readOnly = false,
}: CommercialPassportCardProps) {
  const handleUpdate = <K extends keyof CommercialPassport>(field: K, value: CommercialPassport[K]) => {
    if (onChange && !readOnly) {
      onChange({
        ...passport,
        [field]: value,
      });
    }
  };

  return (
    <div className="rounded-xl border border-rose-200 bg-white p-4 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <Sparkles size={15} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              Hồ Sơ Thương Mại M01b (Commercial Passport)
              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                AI Commercial Ready
              </span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Định vị thương mại, câu chuyện cảm xúc và điểm chốt sale từ phân tích hoa
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* Slogan & Tagline */}
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stone-600 flex items-center gap-1">
            <Tag size={12} className="text-rose-600" />
            Slogan / Tagline 1-chạm:
          </label>
          {readOnly ? (
            <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 font-semibold text-stone-800">
              {passport.shortHeadline}
            </div>
          ) : (
            <input
              type="text"
              value={passport.shortHeadline}
              onChange={(e) => handleUpdate("shortHeadline", e.target.value)}
              className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 text-xs font-semibold text-stone-800 outline-none focus:border-rose-500"
            />
          )}
        </div>

        {/* Chân dung khách hàng */}
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stone-600 flex items-center gap-1">
            <Users size={12} className="text-rose-600" />
            Khách hàng mục tiêu:
          </label>
          <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-800 flex flex-col gap-0.5">
            <div>
              <span className="font-bold text-stone-700">Người nhận:</span> {passport.targetAudience?.recipient || "Bạn gái / Người yêu"}
            </div>
            <div>
              <span className="font-bold text-stone-700">Người mua:</span> {passport.targetAudience?.buyerPersona || "Nam giới 22–35 tuổi"}
            </div>
          </div>
        </div>
      </div>

      {/* Câu chuyện ý nghĩa loài hoa */}
      <div className="space-y-1 text-xs">
        <label className="text-[10.5px] font-semibold text-stone-600 flex items-center gap-1">
          <BookOpen size={12} className="text-rose-600" />
          Ý nghĩa & Câu chuyện truyền cảm hứng (Storytelling):
        </label>
        {readOnly ? (
          <p className="p-2.5 rounded-lg bg-rose-50/40 border border-rose-100 text-stone-700 leading-relaxed italic">
            &quot;{passport.flowerMeaningStory}&quot;
          </p>
        ) : (
          <textarea
            rows={2}
            value={passport.flowerMeaningStory}
            onChange={(e) => handleUpdate("flowerMeaningStory", e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50/50 p-2 text-xs text-stone-800 outline-none focus:border-rose-500"
          />
        )}
      </div>

      {/* Điểm bán hàng chính (USP) */}
      <div className="space-y-1.5 text-xs">
        <label className="text-[10.5px] font-semibold text-stone-600 flex items-center gap-1">
          <CheckCircle size={12} className="text-emerald-600" />
          Điểm bán hàng nổi bật (Key Selling Points):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(passport.keySellingPoints || []).map((usp, idx) => (
            <div key={idx} className="flex items-start gap-1.5 p-2 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-700">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{usp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dải giá & Sản phẩm mua kèm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-stone-100">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200">
          <DollarSign size={16} className="text-amber-600 shrink-0" />
          <div>
            <div className="text-[10px] text-stone-500 font-semibold">Dải giá đề xuất (Min - Chuẩn - Max):</div>
            <div className="font-extrabold text-stone-900 text-xs">
              {(passport.priceRange?.minPrice || 0).toLocaleString("vi-VN")}đ —{" "}
              <span className="text-rose-600 font-black">{(passport.priceRange?.targetPrice || 0).toLocaleString("vi-VN")}đ</span> —{" "}
              {(passport.priceRange?.maxPrice || 0).toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200">
          <PackagePlus size={16} className="text-purple-600 shrink-0" />
          <div>
            <div className="text-[10px] text-stone-500 font-semibold">Gợi ý bán kèm (Cross-sell):</div>
            <div className="text-[11px] text-stone-700 font-medium truncate">
              {(passport.recommendedUpsells || []).join(", ") || "Thiệp viết tay, Bình hoa cao cấp"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
