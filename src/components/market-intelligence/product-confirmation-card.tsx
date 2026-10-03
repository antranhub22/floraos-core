"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Edit3, Sparkles, Plus, Trash2, Tag, Layers, Gift, Target, Check } from "lucide-react";
import type {
  ProductFlowerComponent,
  ProductVisualAttributes,
  ProductPackaging,
  ProductInferredContext,
  CommercialPassport,
} from "@/modules/market-intelligence/domain/product-intelligence-types";
import { synthesizeProductResearchQueries } from "@/modules/market-intelligence/domain/synthesize-product-queries";
import { buildCommercialPassport } from "@/modules/market-intelligence/domain/trend-fit";
import { CommercialPassportCard } from "./commercial-passport-card";
import { ProductPackagingCard } from "./product-packaging-card";

interface ProductConfirmationCardProps {
  productTitle?: string;
  components: ProductFlowerComponent[];
  attributes: ProductVisualAttributes;
  packaging: ProductPackaging;
  context: ProductInferredContext;
  onConfirm: (data: {
    components: ProductFlowerComponent[];
    attributes: ProductVisualAttributes;
    packaging: ProductPackaging;
    context: ProductInferredContext;
    commercialPassport?: CommercialPassport;
    selectedQueries?: string[];
  }) => void;
  isSubmitting: boolean;
}

export function ProductConfirmationCard({
  productTitle,
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
  const [commercialPassport, setCommercialPassport] = useState<CommercialPassport>(() =>
    buildCommercialPassport(productTitle || "Bó hoa tươi", initialComponents, initialAttributes, initialPackaging, initialContext)
  );

  // Đồng bộ lại state khi initial props từ Vision AI thay đổi
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ lại khi kết quả Vision AI (props) đổi, chủ đích
    setComponents(initialComponents);
    setAttributes(initialAttributes);
    setPackaging(initialPackaging);
    setContext(initialContext);
    setCommercialPassport(
      buildCommercialPassport(productTitle || "Bó hoa tươi", initialComponents, initialAttributes, initialPackaging, initialContext)
    );
  }, [productTitle, initialComponents, initialAttributes, initialPackaging, initialContext]);

  const synthesized = synthesizeProductResearchQueries({
    components,
    attributes,
    packaging,
    context,
  });

  const [selectedQueries, setSelectedQueries] = useState<string[]>(synthesized.primaryKeywords);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gợi ý lại từ khoá khi thành phần sản phẩm đổi, chủ đích
    setSelectedQueries(synthesized.primaryKeywords);
  }, [components, attributes, packaging, context]);

  const handleUpdateComponent = <K extends keyof ProductFlowerComponent>(
    index: number,
    field: K,
    val: ProductFlowerComponent[K],
  ) => {
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

  const handleAddFoliage = () => {
    setComponents([
      ...components,
      { flowerType: "Lá bạc Eucalyptus", quantityEstimate: 3, unit: "cành", role: "foliage" },
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
        {/* Khối 1: Danh sách loài hoa & lá cấu thành */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Layers size={14} className="text-rose-600" />
              Thành phần hoa & lá ({components.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddComponent}
                className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200"
              >
                <Plus size={11} /> Hoa
              </button>
              <button
                type="button"
                onClick={handleAddFoliage}
                className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
              >
                <Plus size={11} /> Lá đệm
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {components.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <span
                  className={`text-[9px] font-bold px-1 py-0.2 rounded shrink-0 ${
                    comp.role === "foliage"
                      ? "bg-emerald-100 text-emerald-800"
                      : comp.role === "dominant"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {comp.role === "foliage" ? "Lá" : comp.role === "dominant" ? "Chính" : "Phụ"}
                </span>
                <input
                  type="text"
                  value={comp.flowerType}
                  onChange={(e) => handleUpdateComponent(idx, "flowerType", e.target.value)}
                  className="flex-1 bg-transparent px-1 font-medium text-stone-800 outline-none text-[11.5px]"
                />
                <input
                  type="number"
                  value={comp.quantityEstimate}
                  onChange={(e) => handleUpdateComponent(idx, "quantityEstimate", parseInt(e.target.value) || 1)}
                  className="w-11 text-center bg-white border border-stone-200 rounded px-1 text-[11px] font-bold"
                />
                <span className="text-[10px] text-stone-400 shrink-0">{comp.unit}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveComponent(idx)}
                  className="text-stone-400 hover:text-red-600 p-0.5 shrink-0"
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
            Màu sắc & Phong cách cắm
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
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Phong cách thiết kế</label>
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
              <label className="text-[10.5px] font-semibold text-stone-500 block mb-1">Dáng cắm & Khối</label>
              <input
                type="text"
                value={attributes.shape}
                onChange={(e) => setAttributes({ ...attributes, shape: e.target.value })}
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

      {/* Khối Phụ Liệu, Thiệp & Đóng Gói (Atomic Packaging & Accessories) */}
      <ProductPackagingCard
        packaging={packaging}
        onChange={setPackaging}
      />

      {/* Khối Hồ Sơ Thương Mại M01b (Commercial Passport) */}
      <CommercialPassportCard
        passport={commercialPassport}
        onChange={setCommercialPassport}
      />

      {/* Khối Lựa Chọn Hướng Nghiên Cứu Xu Hướng */}
      <div className="rounded-xl border border-rose-200 bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Target size={14} className="text-rose-600" />
            Chọn các hướng nghiên cứu bạn muốn AI đối soát thị trường:
          </span>
          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            Đã chọn {selectedQueries.length} hướng
          </span>
        </div>

        <p className="text-[11px] text-stone-500 leading-relaxed">
          AI tự động trích xuất các từ khóa trọng tâm từ thuộc tính hoa vừa bóc tách. Nhấp để chọn hoặc bỏ chọn hướng bạn muốn nghiên cứu.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {synthesized.primaryKeywords.map((keyword) => {
            const isChecked = selectedQueries.includes(keyword);
            return (
              <button
                key={keyword}
                type="button"
                onClick={() => {
                  if (isChecked) {
                    if (selectedQueries.length > 1) {
                      setSelectedQueries(selectedQueries.filter((k) => k !== keyword));
                    }
                  } else {
                    setSelectedQueries([...selectedQueries, keyword]);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                  isChecked
                    ? "bg-rose-50 text-rose-700 border-rose-300 shadow-xs"
                    : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <Check size={13} className={isChecked ? "text-rose-600" : "opacity-0"} />
                <span>{keyword}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-rose-100">
        <div className="text-[11px] text-stone-500">
          {/* Mô hình TỰ báo độ tin cậy — không phải số đo; chỉ nói nguồn dữ liệu (AGENTS.md: số hiển thị phải là số đo). */}
          Nguồn: <strong className="text-emerald-700">{components.length > 0 && context.confidence > 0 ? "Vision AI — kiểm lại từng dòng trước khi đối soát" : "Nhập tay"}</strong>
        </div>

        <button
          type="button"
          onClick={() => onConfirm({ components, attributes, packaging, context, commercialPassport, selectedQueries })}
          disabled={isSubmitting || selectedQueries.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
        >
          <Sparkles size={15} />
          {isSubmitting ? "Đang đối soát xu hướng thị trường..." : "Tiến hành Khám phá Trend Fit (Bước 3) →"}
        </button>
      </div>
    </div>
  );
}
