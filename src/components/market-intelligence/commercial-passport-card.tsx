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
    <div className="rounded-xl border border-blush-200 bg-white p-4 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-blush-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush-100 text-blush-700">
            <Sparkles size={15} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-cool-900 flex items-center gap-1.5">
              Hồ Sơ Thương Mại Sinh dữ liệu bán hàng (Commercial Passport)
              <span className="px-1.5 py-0.5 rounded-md bg-blush-50 text-blush-700 text-caption font-bold border border-blush-200">
                AI Commercial Ready
              </span>
            </h3>
            <p className="text-caption text-cool-500">
              Định vị thương mại, câu chuyện cảm xúc và điểm chốt sale từ phân tích hoa
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* Slogan & Tagline */}
        <div className="space-y-1">
          <label className="text-caption font-semibold text-cool-600 flex items-center gap-1">
            <Tag size={12} className="text-blush-600" />
            Slogan / Tagline 1-chạm:
          </label>
          {readOnly ? (
            <div className="p-2 rounded-lg bg-cool-50 border border-cool-200 font-semibold text-cool-800">
              {passport.shortHeadline}
            </div>
          ) : (
            <input
              type="text"
              value={passport.shortHeadline}
              onChange={(e) => handleUpdate("shortHeadline", e.target.value)}
              className="h-8 w-full rounded-lg border border-cool-200 bg-cool-50/50 px-2.5 text-xs font-semibold text-cool-800 outline-none focus:border-blush-500"
            />
          )}
        </div>

        {/* Chân dung khách hàng */}
        <div className="space-y-1">
          <label className="text-caption font-semibold text-cool-600 flex items-center gap-1">
            <Users size={12} className="text-blush-600" />
            Khách hàng mục tiêu:
          </label>
          <div className="p-2 rounded-lg bg-cool-50 border border-cool-200 text-cool-800 flex flex-col gap-0.5">
            <div>
              <span className="font-bold text-cool-700">Người nhận:</span> {passport.targetAudience?.recipient || "Bạn gái / Người yêu"}
            </div>
            <div>
              <span className="font-bold text-cool-700">Người mua:</span> {passport.targetAudience?.buyerPersona || "Nam giới 22–35 tuổi"}
            </div>
          </div>
        </div>
      </div>

      {/* Câu chuyện ý nghĩa loài hoa */}
      <div className="space-y-1 text-xs">
        <label className="text-caption font-semibold text-cool-600 flex items-center gap-1">
          <BookOpen size={12} className="text-blush-600" />
          Ý nghĩa & Câu chuyện truyền cảm hứng (Storytelling):
        </label>
        {readOnly ? (
          <p className="p-2.5 rounded-lg bg-blush-50/40 border border-blush-100 text-cool-700 leading-relaxed italic">
            &quot;{passport.flowerMeaningStory}&quot;
          </p>
        ) : (
          <textarea
            rows={2}
            value={passport.flowerMeaningStory}
            onChange={(e) => handleUpdate("flowerMeaningStory", e.target.value)}
            className="w-full rounded-lg border border-cool-200 bg-cool-50/50 p-2 text-xs text-cool-800 outline-none focus:border-blush-500"
          />
        )}
      </div>

      {/* Điểm bán hàng chính (USP) */}
      <div className="space-y-1.5 text-xs">
        <label className="text-caption font-semibold text-cool-600 flex items-center gap-1">
          <CheckCircle size={12} className="text-mint-600" />
          Điểm bán hàng nổi bật (Key Selling Points):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(passport.keySellingPoints || []).map((usp, idx) => (
            <div key={idx} className="flex items-start gap-1.5 p-2 rounded-lg bg-cool-50 border border-cool-200 text-caption text-cool-700">
              <span className="text-mint-600 font-bold">✓</span>
              <span>{usp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dải giá & Sản phẩm mua kèm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-cool-100">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-cool-50 border border-cool-200">
          <DollarSign size={16} className="text-sand-600 shrink-0" />
          <div>
            <div className="text-caption text-cool-500 font-semibold">Dải giá đề xuất (Min - Chuẩn - Max):</div>
            <div className="font-extrabold text-cool-900 text-xs">
              {(passport.priceRange?.minPrice || 0).toLocaleString("vi-VN")}đ —{" "}
              <span className="text-blush-600 font-black">{(passport.priceRange?.targetPrice || 0).toLocaleString("vi-VN")}đ</span> —{" "}
              {(passport.priceRange?.maxPrice || 0).toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-cool-50 border border-cool-200">
          <PackagePlus size={16} className="text-orchid-600 shrink-0" />
          <div>
            <div className="text-caption text-cool-500 font-semibold">Gợi ý bán kèm (Cross-sell):</div>
            <div className="text-caption text-cool-700 font-medium truncate">
              {(passport.recommendedUpsells || []).join(", ") || "Thiệp viết tay, Bình hoa cao cấp"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
