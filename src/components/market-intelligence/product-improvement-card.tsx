"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, FlaskConical, Lightbulb, Sparkles } from "lucide-react";
import type { ProductImprovement } from "@/modules/market-intelligence/domain/product-intelligence-types";

interface ProductImprovementCardProps {
  improvements: ProductImprovement;
  onCreateVariation?: () => void;
}

export function ProductImprovementCard({
  improvements,
  onCreateVariation,
}: ProductImprovementCardProps) {
  return (
    <div className="rounded-2xl border border-cool-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cool-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-50 text-sand-700">
            <Lightbulb size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-cool-900">4. Khuyến nghị cải tiến sản phẩm</h3>
            <p className="text-caption text-cool-500">
              Định hướng cải tiến thẩm mỹ và bao gói nhằm tối đa hóa tỷ lệ chốt đơn và chia sẻ mạng xã hội
            </p>
          </div>
        </div>

        {onCreateVariation && (
          <button
            type="button"
            onClick={onCreateVariation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-cool-100 hover:bg-cool-200 text-cool-800 transition"
          >
            <Sparkles size={13} className="text-blush-600" />
            Tạo biến thể marketing
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cột 1: KEEP (Nên giữ lại) */}
        <div className="rounded-xl border border-mint-200 bg-mint-50/40 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-mint-900 font-bold text-xs">
            <CheckCircle2 size={16} className="text-success" />
            <span>Giữ — Điểm mạnh nên giữ lại</span>
          </div>
          <ul className="space-y-2 text-xs text-mint-950 font-medium leading-relaxed">
            {improvements.keep.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-mint-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 2: IMPROVE (Cần cải thiện) */}
        <div className="rounded-xl border border-sand-200 bg-sand-50/40 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sand-900 font-bold text-xs">
            <AlertTriangle size={16} className="text-sand-600" />
            <span>Cải tiến — Điểm cần khắc phục</span>
          </div>
          <ul className="space-y-2 text-xs text-sand-950 font-medium leading-relaxed">
            {improvements.improve.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-sand-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 3: TEST (Nên thử nghiệm) */}
        <div className="rounded-xl border border-orchid-200 bg-orchid-50/40 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-orchid-900 font-bold text-xs">
            <FlaskConical size={16} className="text-orchid-600" />
            <span>Thử nghiệm — Biến thể nên thử</span>
          </div>
          <ul className="space-y-2 text-xs text-orchid-950 font-medium leading-relaxed">
            {improvements.test.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-orchid-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
