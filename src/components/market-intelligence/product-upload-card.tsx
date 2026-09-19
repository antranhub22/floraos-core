"use client";

import React, { useState } from "react";
import { Upload, Image as ImageIcon, Sparkles, Check, Flower2 } from "lucide-react";

interface ProductUploadCardProps {
  selectedImage: string;
  onSelectImage: (url: string, name: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const DEMO_FLOWERS = [
  {
    name: "Bó hoa hồng pastel phong cách Hàn Quốc",
    url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
    style: "Romantic & Tinh tế",
  },
  {
    name: "Bó hoa tulip tone cam cháy vintage",
    url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80",
    style: "Vintage Cổ điển",
  },
  {
    name: "Giỏ hoa sinh nhật hoa mẫu đơn & cúc mẫu đơn",
    url: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80",
    style: "Sang trọng & Hiện đại",
  },
];

export function ProductUploadCard({
  selectedImage,
  onSelectImage,
  onAnalyze,
  isAnalyzing,
}: ProductUploadCardProps) {
  const [productTitle, setProductTitle] = useState("Bó hoa hồng pastel phong cách Hàn Quốc");

  const handleSelectDemo = (item: typeof DEMO_FLOWERS[0]) => {
    setProductTitle(item.name);
    onSelectImage(item.url, item.name);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Flower2 size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-stone-900">1. Tải ảnh & Nhận diện Sản phẩm hoa</h2>
            <p className="text-[11.5px] text-stone-500">
              Tải lên 1–3 ảnh hoa thực tế của xưởng hoặc chọn mẫu có sẵn để AI phân tích thị giác
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Box */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-xs font-bold text-stone-800 block">
            Tên sản phẩm / Bó hoa đang nghiên cứu
          </label>
          <input
            type="text"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
            placeholder="VD: Bó hoa kem dâu 20 bông tặng sinh nhật..."
            className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-xs text-stone-900 outline-none focus:border-rose-500 focus:bg-white transition"
          />

          {/* Drag and Drop Zone */}
          <div className="relative border-2 border-dashed border-stone-200 hover:border-rose-300 rounded-2xl p-6 text-center bg-stone-50/30 hover:bg-rose-50/20 transition cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  onSelectImage(url, productTitle || file.name);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-rose-600 group-hover:scale-110 transition">
                <Upload size={18} />
              </span>
              <p className="text-xs font-bold text-stone-700">
                Kéo thả ảnh hoa vào đây, hoặc <span className="text-rose-600 underline">chọn tệp từ máy</span>
              </p>
              <p className="text-[11px] text-stone-400">Hỗ trợ JPG, PNG, WebP (Tối đa 3 ảnh)</p>
            </div>
          </div>

          {/* Quick Demo Selector */}
          <div>
            <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
              Hoặc thử nghiệm nhanh với mẫu hoa tiêu biểu:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_FLOWERS.map((flower) => {
                const isSelected = selectedImage === flower.url;
                return (
                  <button
                    key={flower.name}
                    type="button"
                    onClick={() => handleSelectDemo(flower)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/60 text-rose-900 font-semibold"
                        : "border-stone-200 hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    <img
                      src={flower.url}
                      alt={flower.name}
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate leading-tight">{flower.name}</p>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">{flower.style}</p>
                    </div>
                    {isSelected && <Check size={14} className="text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Image Preview & Trigger Button */}
        <div className="flex flex-col justify-between rounded-xl border border-stone-100 bg-stone-50/50 p-3.5 space-y-3">
          <span className="text-xs font-bold text-stone-700">Ảnh hoa đã chọn</span>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-stone-200">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-stone-400 gap-1 text-xs">
                <ImageIcon size={24} />
                <span>Chưa chọn ảnh</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || !selectedImage}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
          >
            <Sparkles size={15} />
            {isAnalyzing ? "AI đang phân tích thị giác..." : "Bóc tách & Phân tích Sản phẩm"}
          </button>
        </div>
      </div>
    </div>
  );
}
