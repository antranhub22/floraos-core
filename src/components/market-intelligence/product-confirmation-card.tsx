"use client";

import React, { useState } from "react";
import { CheckCircle2, Edit3, Sparkles, Plus, Trash2, Tag, Layers, Gift } from "lucide-react";
import type {
  ProductFlowerComponent,
  ProductVisualAttributes,
  ProductPackaging,
  ProductInferredContext,
} from "@/modules/market-intelligence/domain/product-intelligence-types";

interface ProductConfirmationCardProps {
  components: ProductFlowerComponent[];
  attributes: ProductVisualAttributes;
  packaging: ProductPackaging;
  context: ProductInferredContext;
  onConfirm: (data: {
    components: ProductFlowerComponent[];
    attributes: ProductVisualAttributes;
    packaging: ProductPackaging;
    context: ProductInferredContext;
  }) => void;
  isSubmitting: boolean;
}

export function ProductConfirmationCard({
  components: initialComponents,
  attributes: initialAttributes,
  packaging: initialPackaging,
  context: initialContext,
  onConfirm,
  isSubmitting,
}: ProductConfirmationCardProps) {
  const [components, setComponents] = useState<ProductFlowerComponent[]>(initialComponents);
  const [attributes, setAttributes] = useState<ProductVisualAttributes>(initialAttributes);
  const [packaging, setPackaging] = useState<ProductPackaging>(initialPackaging);
  const [context, setContext] = useState<ProductInferredContext>(initialContext);

  const handleUpdateComponent = (index: number, field: keyof ProductFlowerComponent, val: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index]!, [field]: val };
    setComponents(updated);
  };

  const handleAddComponent = () => {
    setComponents([
      ...components,
      { flowerType: "Hoa phụ bổ sung", quantityEstimate: 5, unit: "cành", role: "supporting" },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              2. Xác nhận & tinh chỉnh thuộc tính sản phẩm
            </h2>
            <p className="text-[11.5px] text-stone-500">
              AI đã trích xuất các thông số bên dưới. Bạn có thể sửa trực tiếp từng thông số trước khi đối soát xu hướng.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Khối 1: Danh sách loài hoa cấu thành */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Layers size={14} className="text-rose-600" />
              Thành phần hoa cấu tạo
            </span>
            <button
              type="button"
              onClick={handleAddComponent}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"
            >
              <Plus size={12} /> Thêm hoa
            </button>
          </div>

          <div className="space-y-2">
            {components.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <input
                  type="text"
                  value={comp.flowerType}
                  onChange={(e) => handleUpdateComponent(idx, "flowerType", e.target.value)}
                  className="flex-1 bg-transparent px-1 font-medium text-stone-800 outline-none"
                />
                <input
                  type="number"
                  value={comp.quantityEstimate}
                  onChange={(e) => handleUpdateComponent(idx, "quantityEstimate", parseInt(e.target.value) || 1)}
                  className="w-12 text-center bg-white border border-stone-200 rounded px-1 text-[11px] font-bold"
                />
                <span className="text-[10px] text-stone-400">{comp.unit}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveComponent(idx)}
                  className="text-stone-400 hover:text-red-600 p-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Khối 2: Màu sắc & Phong cách thiết kế */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Tag size={14} className="text-rose-600" />
            Màu sắc & Phong cách
          </span>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Tone màu chủ đạo</label>
              <input
                type="text"
                value={attributes.mainColors.join(", ")}
                onChange={(e) => setAttributes({ ...attributes, mainColors: e.target.value.split(",").map((s) => s.trim()) })}
                className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 text-xs text-stone-800 outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Phong cách cắm</label>
              <select
                value={attributes.style}
                onChange={(e) => setAttributes({ ...attributes, style: e.target.value })}
                className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2 text-xs text-stone-800 outline-none focus:border-rose-500"
              >
                <option value="Romantic & Tinh tế">Romantic & Tinh tế (Hàn Quốc)</option>
                <option value="Vintage Cổ điển">Vintage Cổ điển (Tone ấm)</option>
                <option value="Hiện đại Tối giản">Hiện đại Tối giản (Minimalism)</option>
                <option value="Sang trọng Quý phái">Sang trọng Quý phái (Luxury)</option>
              </select>
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Chất liệu giấy gói & Nơ</label>
              <input
                type="text"
                value={`${packaging.wrappingMaterial}, ${packaging.ribbon}`}
                onChange={(e) => setPackaging({ ...packaging, wrappingMaterial: e.target.value })}
                className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 text-xs text-stone-800 outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Khối 3: Bối cảnh, Dịp & Giá bán đề xuất */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Gift size={14} className="text-rose-600" />
            Dịp tặng & Phân khúc giá
          </span>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Dịp phù hợp nhất</label>
              <input
                type="text"
                value={context.likelyOccasions.join(", ")}
                onChange={(e) => setContext({ ...context, likelyOccasions: e.target.value.split(",").map((s) => s.trim()) })}
                className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 text-xs text-stone-800 outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Tệp khách hàng mục tiêu</label>
              <input
                type="text"
                value={context.likelyAudience}
                onChange={(e) => setContext({ ...context, likelyAudience: e.target.value })}
                className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 text-xs text-stone-800 outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Giá bán đề xuất (VNĐ)</label>
              <input
                type="number"
                value={context.suggestedPrice}
                onChange={(e) => setContext({ ...context, suggestedPrice: parseInt(e.target.value) || 0 })}
                className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 text-xs text-stone-800 font-bold outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-rose-100">
        <div className="text-[11px] text-stone-500">
          Độ tin cậy nhận diện: <strong className="text-emerald-700">{Math.round(context.confidence * 100)}%</strong>
        </div>

        <button
          type="button"
          onClick={() => onConfirm({ components, attributes, packaging, context })}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
        >
          <Sparkles size={15} />
          {isSubmitting ? "Đang đối soát xu hướng thị trường..." : "Xác nhận & Đối soát Thị trường ngay"}
        </button>
      </div>
    </div>
  );
}
