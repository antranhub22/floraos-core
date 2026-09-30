"use client";

import React from "react";
import { Mail, Gift, Scissors, Plus, Trash2, Sparkles, CheckSquare, Square } from "lucide-react";
import type {
  ProductPackaging,
  ProductCardAccessory,
  ProductRibbonAccessory,
  ProductDecorAccessory,
} from "@/modules/market-intelligence/domain/product-intelligence-types";

interface ProductPackagingCardProps {
  packaging: ProductPackaging;
  onChange: (updated: ProductPackaging) => void;
}

export function ProductPackagingCard({ packaging, onChange }: ProductPackagingCardProps) {
  const card: ProductCardAccessory = packaging.card || {
    hasCard: Boolean(packaging.accessories?.some((a) => a.toLowerCase().includes("thiệp"))),
    cardType: "Thiệp gập thiết kế",
    printedText: undefined,
  };

  const ribbon: ProductRibbonAccessory = packaging.ribbonDetail || {
    ribbonMaterial: packaging.ribbon || "Ruy băng voan",
    ribbonColor: "Trắng kem",
    bowStyle: "Nơ cánh bướm",
  };

  const otherAccessories: ProductDecorAccessory[] = packaging.otherAccessories || [];

  const handleUpdateCard = (updates: Partial<ProductCardAccessory>) => {
    const updatedCard = { ...card, ...updates };
    const updatedAccessories = [...(packaging.accessories || []).filter((a) => !a.startsWith("Thiệp"))];
    if (updatedCard.hasCard) {
      updatedAccessories.unshift(
        updatedCard.printedText ? `Thiệp: "${updatedCard.printedText}"` : `Thiệp chúc mừng (${updatedCard.cardType || "thiết kế"})`
      );
    }
    onChange({
      ...packaging,
      card: updatedCard,
      accessories: updatedAccessories,
    });
  };

  const handleUpdateRibbon = (updates: Partial<ProductRibbonAccessory>) => {
    const updatedRibbon = { ...ribbon, ...updates };
    onChange({
      ...packaging,
      ribbonDetail: updatedRibbon,
      ribbon: `${updatedRibbon.ribbonMaterial || "Ruy băng"} màu ${updatedRibbon.ribbonColor || "đồng điệu"}`,
    });
  };

  const handleAddDecor = () => {
    const newDecor: ProductDecorAccessory = {
      id: `decor-${Date.now()}`,
      name: "Đèn LED đom đóm",
      quantity: 1,
      unit: "dây",
    };
    const updated = [...otherAccessories, newDecor];
    onChange({
      ...packaging,
      otherAccessories: updated,
    });
  };

  const handleRemoveDecor = (id?: string) => {
    const updated = otherAccessories.filter((d) => d.id !== id);
    onChange({
      ...packaging,
      otherAccessories: updated,
    });
  };

  const handleUpdateDecor = <K extends keyof ProductDecorAccessory>(idx: number, field: K, val: ProductDecorAccessory[K]) => {
    const updated = [...otherAccessories];
    updated[idx] = { ...updated[idx]!, [field]: val };
    onChange({
      ...packaging,
      otherAccessories: updated,
    });
  };

  return (
    <div className="rounded-xl border border-cool-200 bg-white p-4 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-cool-100 pb-2.5">
        <span className="text-xs font-bold text-cool-800 flex items-center gap-1.5">
          <Gift size={14} className="text-blush-600" />
          Phụ liệu, Thiệp & Đóng gói (BOM Phụ)
        </span>
        <span className="text-caption font-medium text-cool-400">Atomic Disaggregated</span>
      </div>

      {/* 1. KHỐI THIỆP & BIỂN CHỮ OCR */}
      <div className="rounded-lg border border-sand-200/80 bg-sand-50/40 p-3 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <label className="text-caption font-bold text-sand-950 flex items-center gap-1.5">
            <Mail size={13} className="text-sand-700" />
            Thiệp chúc mừng & Biển chữ
            {card.hasCard && (
              <span className="px-1.5 py-0.2 rounded bg-sand-100 text-sand-800 text-caption font-bold">
                Có trong ảnh
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={() => handleUpdateCard({ hasCard: !card.hasCard })}
            className="inline-flex items-center gap-1 text-caption font-semibold text-cool-600 hover:text-cool-900"
          >
            {card.hasCard ? (
              <>
                <CheckSquare size={13} className="text-mint-600" /> Có thiệp
              </>
            ) : (
              <>
                <Square size={13} className="text-cool-400" /> Không thiệp
              </>
            )}
          </button>
        </div>

        {card.hasCard && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-caption font-medium text-cool-500 block mb-0.5">Phân loại thiệp</span>
                <select
                  value={card.cardType || "Thiệp gập thiết kế"}
                  onChange={(e) => handleUpdateCard({ cardType: e.target.value as ProductCardAccessory["cardType"] })}
                  className="h-7 w-full rounded border border-sand-200 bg-white px-1.5 text-caption text-cool-800 outline-none"
                >
                  <option value="Thiệp gập thiết kế">Thiệp gập thiết kế</option>
                  <option value="Tag cắm mini">Tag cắm mini</option>
                  <option value="Biển mica nghệ thuật">Biển mica nghệ thuật</option>
                  <option value="Banner dải băng chữ">Banner dải băng chữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <span className="text-caption font-medium text-cool-500 block mb-0.5">Tone màu thiệp</span>
                <input
                  type="text"
                  value={card.color || ""}
                  placeholder="Vd: Trắng viền kim..."
                  onChange={(e) => handleUpdateCard({ color: e.target.value })}
                  className="h-7 w-full rounded border border-sand-200 bg-white px-2 text-caption text-cool-800 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-caption font-bold text-sand-900 flex items-center gap-1">
                  <Sparkles size={11} className="text-sand-600" />
                  Nội dung chữ in / Thông điệp bóc tách (AI OCR):
                </span>
                <span className="text-caption text-sand-700 italic">Nhân viên sửa trực tiếp</span>
              </div>
              <input
                type="text"
                value={card.printedText || ""}
                placeholder="Nhập hoặc để AI đọc chữ trên thiệp (ví dụ: Chúc mừng sinh nhật em yêu)..."
                onChange={(e) => handleUpdateCard({ printedText: e.target.value })}
                className="h-8 w-full rounded border border-sand-300 bg-white px-2.5 text-xs font-semibold text-cool-900 outline-none focus:border-sand-500 focus:ring-1 focus:ring-sand-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. KHỐI GIẤY GÓI & NƠ RUY BĂNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="p-2.5 rounded-lg border border-cool-200 bg-cool-50/60 space-y-1.5">
          <label className="text-caption font-bold text-cool-700 flex items-center gap-1">
            <Scissors size={12} className="text-cool-500" />
            Giấy gói & Bao bì
          </label>
          <input
            type="text"
            value={packaging.wrappingMaterial}
            placeholder="Chất liệu giấy (Kraft, Lụa mờ...)"
            onChange={(e) => onChange({ ...packaging, wrappingMaterial: e.target.value })}
            className="h-7 w-full rounded border border-cool-200 bg-white px-2 text-caption text-cool-800 outline-none focus:border-blush-400"
          />
          <input
            type="text"
            value={packaging.wrappingColor}
            placeholder="Màu sắc giấy gói..."
            onChange={(e) => onChange({ ...packaging, wrappingColor: e.target.value })}
            className="h-7 w-full rounded border border-cool-200 bg-white px-2 text-caption text-cool-800 outline-none focus:border-blush-400"
          />
        </div>

        <div className="p-2.5 rounded-lg border border-cool-200 bg-cool-50/60 space-y-1.5">
          <label className="text-caption font-bold text-cool-700 flex items-center gap-1">
            <Gift size={12} className="text-blush-500" />
            Nơ & Ruy băng thắt
          </label>
          <input
            type="text"
            value={ribbon.ribbonMaterial || ""}
            placeholder="Chất liệu nơ (Satin, Voan...)"
            onChange={(e) => handleUpdateRibbon({ ribbonMaterial: e.target.value })}
            className="h-7 w-full rounded border border-cool-200 bg-white px-2 text-caption text-cool-800 outline-none focus:border-blush-400"
          />
          <input
            type="text"
            value={ribbon.ribbonColor || ""}
            placeholder="Màu sắc ruy băng..."
            onChange={(e) => handleUpdateRibbon({ ribbonColor: e.target.value })}
            className="h-7 w-full rounded border border-cool-200 bg-white px-2 text-caption text-cool-800 outline-none focus:border-blush-400"
          />
        </div>
      </div>

      {/* 3. PHỤ KIỆN TRANG TRÍ ĐẶC BIỆT */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-caption font-bold text-cool-700 flex items-center gap-1">
            <Sparkles size={12} className="text-blush-500" />
            Phụ kiện trang trí khác ({otherAccessories.length})
          </span>
          <button
            type="button"
            onClick={handleAddDecor}
            className="inline-flex items-center gap-1 text-caption font-bold text-blush-600 hover:text-blush-700"
          >
            <Plus size={11} /> Thêm phụ kiện
          </button>
        </div>

        {otherAccessories.length > 0 ? (
          <div className="space-y-1.5">
            {otherAccessories.map((decor, idx) => (
              <div key={decor.id || idx} className="flex items-center gap-1.5 p-1 rounded bg-cool-50 border border-cool-200 text-xs">
                <input
                  type="text"
                  value={decor.name}
                  placeholder="Tên phụ kiện..."
                  onChange={(e) => handleUpdateDecor(idx, "name", e.target.value)}
                  className="flex-1 bg-transparent px-1 font-medium text-cool-800 outline-none text-caption"
                />
                <input
                  type="number"
                  value={decor.quantity}
                  onChange={(e) => handleUpdateDecor(idx, "quantity", parseInt(e.target.value) || 1)}
                  className="w-10 text-center bg-white border border-cool-200 rounded px-1 text-caption font-bold"
                />
                <span className="text-caption text-cool-400">{decor.unit}</span>
                <button
              aria-label="Xóa"
                  type="button"
                  onClick={() => handleRemoveDecor(decor.id)}
                  className="text-cool-400 hover:text-alert-600 p-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-caption text-cool-400 italic p-2 rounded bg-cool-50/50 text-center border border-dashed border-cool-200">
            Không có phụ kiện phụ đặc biệt (Bấm &quot;Thêm phụ kiện&quot; nếu có đèn led, gấu bông, topper...)
          </div>
        )}
      </div>
    </div>
  );
}
