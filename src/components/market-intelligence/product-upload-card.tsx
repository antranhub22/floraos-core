"use client";

import React, { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Sparkles, Check, Flower2, Library, Loader2, X } from "lucide-react";

interface ProductUploadCardProps {
  selectedImage: string;
  selectedAssetId?: string | undefined;
  productTitle: string;
  onUpdateProductTitle: (title: string) => void;
  onSelectImage: (url: string, name: string, assetId?: string | undefined) => void;
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
    style: "Sang trọng & Quý phái",
  },
];

interface CatalogProductItem {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
}

/** Một dòng `GET /api/v1/products` — chỉ các trường thẻ chọn từ catalog đọc. */
interface ProductApiRow {
  id: string;
  title?: string;
  name?: string;
  price?: number | null;
  image_url?: string | null;
  master_asset?: { url?: string } | null;
}

export function ProductUploadCard({
  selectedImage,
  selectedAssetId,
  productTitle,
  onUpdateProductTitle,
  onSelectImage,
  onAnalyze,
  isAnalyzing,
}: ProductUploadCardProps) {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProductItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 25/09/2026: kiểm TỪNG bước (xin URL → PUT kho → đăng ký asset). Bản trước
  // nuốt mọi lỗi và vẫn chọn ảnh — Chặng 02 rồi chạy trên một asset trỏ tới tệp
  // không tồn tại. Chặng 02 nay đọc ảnh từ kho theo asset_id, nên không có
  // asset hợp lệ thì không cho chọn.
  const uploadFileAsset = async (file: File, displayUrl: string, title: string) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const mime = file.type || "image/jpeg";
      const res = await fetch("/api/v1/assets/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime_type: mime }),
      });
      if (!res.ok) throw new Error(`Không xin được chỗ lưu ảnh (HTTP ${res.status})`);
      const { upload_url, asset_id, storage_key } = await res.json();
      const put = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": mime }, body: file });
      if (!put.ok) throw new Error(`Tải ảnh lên kho thất bại (HTTP ${put.status})`);
      const reg = await fetch("/api/v1/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id, kind: "ORIGINAL", storage_key, mime_type: mime, file_size: file.size }),
      });
      if (!reg.ok) throw new Error(`Đăng ký ảnh vào kho thất bại (HTTP ${reg.status})`);
      onSelectImage(displayUrl, title, asset_id);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Không lưu được ảnh vào kho — thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  /** Sản phẩm Catalog → ảnh Master đã duyệt (hoặc ảnh gốc mới nhất) trong kho của đúng sản phẩm. */
  const handleSelectCatalogProduct = async (p: CatalogProductItem) => {
    setIsCatalogModalOpen(false);
    setUploadError(null);
    setIsUploading(true);
    try {
      const tim = async (q: string) => {
        const r = await fetch(`/api/v1/assets?product_id=${encodeURIComponent(p.id)}&limit=1&${q}`);
        if (!r.ok) return null;
        const j = (await r.json()) as { data?: { id: string; url: string | null }[] };
        return j.data?.[0] ?? null;
      };
      const anh = (await tim("kind=MASTER&approval_state=APPROVED")) ?? (await tim("kind=ORIGINAL"));
      if (!anh || !anh.url) throw new Error(`"${p.title}" chưa có ảnh trong kho — hãy tải ảnh của mẫu này lên.`);
      onUpdateProductTitle(p.title);
      onSelectImage(anh.url, p.title, anh.id);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Không lấy được ảnh của sản phẩm.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDemo = async (item: typeof DEMO_FLOWERS[0]) => {
    onUpdateProductTitle(item.name);
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`Không tải được ảnh mẫu (HTTP ${res.status})`);
      const blob = await res.blob();
      const file = new File([blob], "demo-flower.jpg", { type: blob.type || "image/jpeg" });
      await uploadFileAsset(file, item.url, item.name);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Không tải được ảnh mẫu — hãy tải ảnh của tiệm.");
    }
  };

  const handleOpenCatalog = async () => {
    setIsCatalogModalOpen(true);
    if (catalogProducts.length > 0) return;
    setLoadingCatalog(true);
    try {
      const res = await fetch("/api/v1/products?limit=15");
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json.data)
          ? (json.data as ProductApiRow[]).map((p) => ({
              id: p.id,
              title: p.title || p.name || "",
              ...(typeof p.price === "number" ? { price: p.price } : {}),
              ...(p.master_asset?.url || p.image_url ? { imageUrl: (p.master_asset?.url || p.image_url) as string } : {}),
            }))
          : [];
        setCatalogProducts(items);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = (e.target?.result as string) || URL.createObjectURL(file);
      const rawName = file.name.replace(/\.[^/.]+$/, "");
      const title = rawName.length > 3 ? rawName : "Mẫu hoa đang nhận diện";
      onUpdateProductTitle(title);
      await uploadFileAsset(file, dataUrl, title);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Flower2 size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-stone-900">1. Tải ảnh & Nhận diện Sản phẩm hoa (Chặng 01 & 02)</h2>
            <p className="text-[11.5px] text-stone-500">
              Tải ảnh thực tế của tiệm, chọn mẫu từ Catalog hoặc thử nghiệm nhanh mẫu tiêu biểu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCatalog}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-bold transition"
        >
          <Library size={14} />
          Chọn từ Catalog tiệm
        </button>
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
            onChange={(e) => onUpdateProductTitle(e.target.value)}
            placeholder="VD: Bó hoa kem dâu 20 bông tặng sinh nhật..."
            className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-xs text-stone-900 outline-none focus:border-rose-500 focus:bg-white transition"
          />

          {/* Drag and Drop Zone */}
          <div className="relative border-2 border-dashed border-stone-200 hover:border-rose-300 rounded-2xl p-6 text-center bg-stone-50/30 hover:bg-rose-50/20 transition cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-rose-600 group-hover:scale-110 transition">
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </span>
              <p className="text-xs font-bold text-stone-700">
                {isUploading ? (
                  "Đang đồng bộ hóa ảnh lên hệ thống..."
                ) : (
                  <>
                    Kéo thả ảnh hoa vào đây, hoặc <span className="text-rose-600 underline">chọn tệp từ máy</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-stone-400">Hỗ trợ JPG, PNG, WebP (Tối đa 10MB)</p>
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">Ảnh hoa đã chọn</span>
            {selectedAssetId && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Asset Đã Đăng Ký
              </span>
            )}
          </div>

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

          {uploadError && (
            <p role="alert" className="text-[11px] leading-snug text-red-700">{uploadError}</p>
          )}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || !selectedImage || !selectedAssetId || isUploading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Vision AI đang bóc tách cấu trúc...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Bóc tách Cấu trúc Hoa (Vision AI · 1 credit)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Chọn từ Catalog tiệm */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Library className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold text-stone-900">Chọn mẫu hoa từ Catalog của tiệm</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingCatalog ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-stone-500 text-xs">
                  <Loader2 size={20} className="animate-spin text-rose-600" />
                  <span>Đang tải danh sách sản phẩm tiệm...</span>
                </div>
              ) : catalogProducts.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  Chưa có sản phẩm nào trong Catalog. Bạn có thể kéo thả ảnh hoa mới từ máy tính.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {catalogProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => void handleSelectCatalogProduct(p)}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 hover:border-rose-500 hover:bg-rose-50/40 cursor-pointer transition text-left"
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.title} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-stone-400 flex-shrink-0">
                          <ImageIcon size={18} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-bold text-stone-900 truncate">{p.title}</p>
                        {p.price && (
                          <p className="text-[11px] font-semibold text-rose-600 mt-0.5">
                            {p.price.toLocaleString("vi-VN")}đ
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
