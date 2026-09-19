"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Shield,
  Sparkles,
  Sliders,
  Globe,
  Layers,
  Search,
  Check,
  RotateCcw,
  CheckSquare,
} from "lucide-react";
import {
  MARKET_TAXONOMY_CATEGORIES,
  ALL_CORE_KEYWORDS,
  getSeasonalRecommendedKeywords,
} from "@/modules/market-intelligence/domain/market-taxonomy";

interface SaaSAdminCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndTrigger: (config: SaaSAdminCriteriaConfig) => Promise<void>;
  isSaving: boolean;
}

export interface SaaSAdminCriteriaConfig {
  macroTopics: string[];
  weights: {
    trend: number;
    viral: number;
    commercial: number;
  };
  channels: string[];
  geoScope: string;
  autoBroadcastToTenants: boolean;
}

export function SaaSAdminCriteriaModal({
  isOpen,
  onClose,
  onSaveAndTrigger,
  isSaving,
}: SaaSAdminCriteriaModalProps) {
  // Mặc định chọn bộ đề xuất theo mùa thu (20/10, tốt nghiệp, hoa cưới)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() =>
    getSeasonalRecommendedKeywords()
  );
  const [activeCategory, setActiveCategory] = useState<string>("recommended");
  const [filterQuery, setFilterQuery] = useState("");
  const [newCustomInput, setNewCustomInput] = useState("");

  const [trendWeight, setTrendWeight] = useState(40);
  const [viralWeight, setViralWeight] = useState(30);
  const [commercialWeight, setCommercialWeight] = useState(30);
  const [geoScope, setGeoScope] = useState("VN");
  const [autoBroadcast, setAutoBroadcast] = useState(true);

  // Danh sách keywords hiển thị theo tab đang chọn
  const displayKeywords = useMemo(() => {
    let list: readonly string[] = [];
    if (activeCategory === "recommended") {
      list = getSeasonalRecommendedKeywords();
    } else if (activeCategory === "all") {
      list = ALL_CORE_KEYWORDS;
    } else {
      const cat = MARKET_TAXONOMY_CATEGORIES.find((c) => c.id === activeCategory);
      list = cat ? cat.keywords : [];
    }

    if (!filterQuery.trim()) return list;
    const lower = filterQuery.toLowerCase().trim();
    return list.filter((k) => k.toLowerCase().includes(lower));
  }, [activeCategory, filterQuery]);

  if (!isOpen) return null;

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSelectAllInView = () => {
    const toAdd = displayKeywords.filter((k) => !selectedTopics.includes(k));
    setSelectedTopics([...selectedTopics, ...toAdd]);
  };

  const handleDeselectAllInView = () => {
    setSelectedTopics(selectedTopics.filter((t) => !displayKeywords.includes(t)));
  };

  const handleSelectAll210 = () => {
    setSelectedTopics([...ALL_CORE_KEYWORDS]);
  };

  const handleResetToSeasonal = () => {
    setSelectedTopics(getSeasonalRecommendedKeywords());
  };

  const handleAddCustom = () => {
    const trimmed = newCustomInput.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics([trimmed, ...selectedTopics]);
      setNewCustomInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveAndTrigger({
      macroTopics: selectedTopics.length > 0 ? selectedTopics : getSeasonalRecommendedKeywords(),
      weights: {
        trend: trendWeight,
        viral: viralWeight,
        commercial: commercialWeight,
      },
      channels: ["google", "tiktok", "youtube"],
      geoScope,
      autoBroadcastToTenants: autoBroadcast,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-2xs">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  Thiết Lập Tiêu Chí Xu Hướng Thị Trường Vĩ Mô
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  SaaS Admin SSOT
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Kho 210 Core Keywords phân loại 9 nhóm nghiệp vụ & thư viện ý định thương mại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thanh công cụ chọn nhanh theo nhóm */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Layers size={14} className="text-purple-600" />
                Danh mục phân nhóm nghiệp vụ (Đang chọn:{" "}
                <span className="text-purple-700 font-extrabold">{selectedTopics.length}</span> / 210)
              </label>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll210}
                  className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 border border-purple-200/70 transition"
                >
                  Chọn cả 210
                </button>
                <button
                  type="button"
                  onClick={handleResetToSeasonal}
                  className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition"
                  title="Gợi ý mùa thu: 20/10, tốt nghiệp, hoa cưới"
                >
                  Đề xuất mùa này
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTopics([])}
                  className="px-2 py-0.5 rounded-md text-stone-500 hover:text-red-600 transition"
                >
                  Xóa hết
                </button>
              </div>
            </div>

            {/* Tabs danh mục */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategory("recommended")}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg font-bold transition ${
                  activeCategory === "recommended"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                ✨ Đề xuất mùa thu ({getSeasonalRecommendedKeywords().length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg font-bold transition ${
                  activeCategory === "all"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Tất cả (210)
              </button>
              {MARKET_TAXONOMY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg font-medium transition ${
                    activeCategory === cat.id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cat.shortName} ({cat.keywords.length})
                </button>
              ))}
            </div>

            {/* Tìm kiếm & Thao tác chọn theo nhóm hiện tại */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Lọc từ khóa trong nhóm này..."
                  className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50/70 pl-7 pr-3 text-xs outline-none focus:border-purple-600 focus:bg-white transition"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAllInView}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 h-8 rounded-lg border border-purple-200 transition"
              >
                <CheckSquare size={13} />
                Chọn nhóm này
              </button>
              <button
                type="button"
                onClick={handleDeselectAllInView}
                className="text-[11px] font-medium text-stone-500 hover:text-stone-700 px-2 h-8 rounded-lg hover:bg-stone-100 transition"
              >
                Bỏ chọn
              </button>
            </div>

            {/* Lưới chọn Keywords */}
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 max-h-48 overflow-y-auto">
              {displayKeywords.map((k) => {
                const isSelected = selectedTopics.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleTopic(k)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-white border border-stone-200 text-stone-700 hover:border-purple-300 hover:bg-purple-50/50"
                    }`}
                  >
                    {isSelected ? <Check size={12} className="stroke-[3]" /> : null}
                    <span>{k}</span>
                  </button>
                );
              })}
              {displayKeywords.length === 0 && (
                <p className="text-xs text-stone-400 py-3 text-center w-full">
                  Không tìm thấy từ khóa phù hợp với bộ lọc
                </p>
              )}
            </div>

            {/* Nhập từ khóa tùy biến thủ công nếu cần */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newCustomInput}
                onChange={(e) => setNewCustomInput(e.target.value)}
                placeholder="Thêm từ khóa tùy chỉnh khác ngoài 210 từ SSOT..."
                className="h-8 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none focus:border-purple-600 transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3 h-8 rounded-lg border border-stone-200 bg-stone-100 text-xs font-semibold text-stone-700 hover:bg-purple-50 hover:text-purple-700 transition"
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* 2. Trọng số đánh giá 3 trục */}
          <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Sliders size={14} className="text-purple-600" />
                Cân bằng trọng số tính Điểm Cơ Hội Thị Trường:
              </span>
              <span className="text-[11px] font-bold text-purple-700">
                Tổng: {trendWeight + viralWeight + commercialWeight}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">
                  Độ nóng tìm kiếm ({trendWeight}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={trendWeight}
                  onChange={(e) => setTrendWeight(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">
                  Lan tỏa TikTok/Reels ({viralWeight}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={viralWeight}
                  onChange={(e) => setViralWeight(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">
                  Thương mại chốt đơn ({commercialWeight}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={commercialWeight}
                  onChange={(e) => setCommercialWeight(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>
          </div>

          {/* 3. Phạm vi & Tự động phát hành */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Globe size={14} className="text-purple-600" />
                Khu vực địa lý tổng thể
              </label>
              <select
                value={geoScope}
                onChange={(e) => setGeoScope(e.target.value)}
                className="h-8 w-full rounded-lg border border-stone-200 bg-white px-2.5 text-xs text-stone-800 outline-none focus:border-purple-600 transition"
              >
                <option value="VN">Toàn quốc (Việt Nam)</option>
                <option value="VN-HN">Trọng điểm Hà Nội & Miền Bắc</option>
                <option value="VN-SG">Trọng điểm TP.HCM & Miền Nam</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-3 sm:pt-5">
              <input
                type="checkbox"
                id="autoBroadcast"
                checked={autoBroadcast}
                onChange={(e) => setAutoBroadcast(e.target.checked)}
                className="h-4 w-4 rounded accent-purple-600"
              />
              <label htmlFor="autoBroadcast" className="text-xs text-stone-700 select-none cursor-pointer">
                Tự động đồng bộ báo cáo cho tất cả Tenant sau khi quét
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm transition disabled:opacity-50"
            >
              <Sparkles size={14} />
              {isSaving
                ? "Đang lưu & phát lệnh quét..."
                : `Lưu ${selectedTopics.length} tiêu chí & Kích hoạt quét vĩ mô`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
