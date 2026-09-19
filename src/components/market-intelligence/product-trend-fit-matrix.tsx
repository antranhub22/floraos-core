"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, BarChart3 } from "lucide-react";
import type { ProductTrendFitItem } from "@/modules/market-intelligence/domain/product-intelligence-types";
import { LIFECYCLE_SPECS } from "@/modules/market-intelligence/domain/trend-lifecycle";

interface ProductTrendFitMatrixProps {
  matrix: ProductTrendFitItem[];
  trendFitScore: number;
  audienceFitScore: number;
  contentFitScore: number;
  overallFit: "HIGH" | "MEDIUM" | "LOW";
}

export function ProductTrendFitMatrix({
  matrix,
  trendFitScore,
  audienceFitScore,
  contentFitScore,
  overallFit,
}: ProductTrendFitMatrixProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm space-y-4 p-5">
      {/* Header Điểm số Tổng quan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <BarChart3 size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">3. Ma trận đối soát thị trường</h3>
            <p className="text-[11.5px] text-stone-500">
              So khớp thuộc tính sản phẩm với nhu cầu thực tế đang thịnh hành trên Google, TikTok &amp; YouTube
            </p>
          </div>
        </div>

        {/* 3 Trục Điểm số */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-stone-500 block font-medium">Khớp xu hướng</span>
            <span className="text-sm font-black text-rose-700">{trendFitScore}/100</span>
          </div>
          <div className="bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-stone-500 block font-medium">Khớp khách hàng</span>
            <span className="text-sm font-black text-purple-700">{audienceFitScore}/100</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-stone-500 block font-medium">Khớp nội dung</span>
            <span className="text-sm font-black text-emerald-700">{contentFitScore}/100</span>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết đối soát từng thuộc tính */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-100 text-xs text-left">
          <thead className="bg-stone-50/80 text-stone-500 font-semibold">
            <tr>
              <th className="px-3.5 py-2.5">Thuộc tính sản phẩm</th>
              <th className="px-3.5 py-2.5">Giá trị của bó hoa</th>
              <th className="px-3.5 py-2.5">Tín hiệu nhu cầu thị trường</th>
              <th className="px-3.5 py-2.5">Vòng đời</th>
              <th className="px-3.5 py-2.5 text-center">Mức độ khớp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {matrix.map((item, idx) => {
              const spec = LIFECYCLE_SPECS[item.lifecycle];
              return (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="px-3.5 py-3 font-semibold text-stone-800">{item.attribute}</td>
                  <td className="px-3.5 py-3 text-stone-600 font-medium">{item.productValue}</td>
                  <td className="px-3.5 py-3 text-stone-600">
                    <div>{item.marketSignal}</div>
                    <div className="text-[10.5px] text-stone-400 italic mt-0.5">{item.note}</div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${spec.bgClass} ${spec.colorClass} ${spec.borderClass}`}>
                      {spec.shortLabel}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    {item.matchStatus === "MATCH" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Khớp chuẩn
                      </span>
                    ) : item.matchStatus === "PARTIAL" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={12} /> Khớp 1 phần
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        <XCircle size={12} /> Lệch sóng
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
