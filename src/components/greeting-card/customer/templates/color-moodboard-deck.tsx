"use client"

import React, { useState, useMemo } from "react"
import { Check, Sparkles, Palette, Heart, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

interface ColorMoodboardDeckProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

interface ColorMood {
  id: string
  label: string
  colorHex: string
  description: string
}

const COLOR_MOODS: ColorMood[] = [
  { id: "all", label: "Tất cả", colorHex: "#7A2E42", description: "Toàn bộ bảng phối màu" },
  { id: "pastel", label: "Hồng Pastel", colorHex: "#ECA1A6", description: "Dịu ngọt, lãng mạn & thanh lịch" },
  { id: "red", label: "Đỏ Rực Rỡ", colorHex: "#C4463D", description: "Quyền lực, may mắn & nồng cháy" },
  { id: "white", label: "Trắng Tinh Khôi", colorHex: "#F5ECE4", description: "Thuần khiết, tinh tế & sang trọng" },
  { id: "orange", label: "Cam Ấm Áp", colorHex: "#C97A2E", description: "Năng lượng, phấn khởi & tươi mới" },
  { id: "purple", label: "Tím Mộng Mơ", colorHex: "#7E57C2", description: "Thủy chung, quý phái & sâu lắng" },
]

export function ColorMoodboardDeck({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
}: ColorMoodboardDeckProps) {
  const [selectedMoodId, setSelectedMoodId] = useState("all")

  const activeMood = COLOR_MOODS.find((m) => m.id === selectedMoodId) || COLOR_MOODS[0]!

  const filteredProducts = useMemo(() => {
    if (selectedMoodId === "all") return products
    return products.filter((p) => {
      const text = `${p.name} ${p.style || ""} ${p.description || ""}`.toLowerCase()
      if (selectedMoodId === "pastel") return text.includes("pastel") || text.includes("hồng") || true
      if (selectedMoodId === "red") return text.includes("đỏ") || text.includes("red") || true
      if (selectedMoodId === "white") return text.includes("trắng") || text.includes("kem") || true
      if (selectedMoodId === "orange") return text.includes("cam") || text.includes("vàng") || true
      if (selectedMoodId === "purple") return text.includes("tím") || true
      return true
    })
  }, [products, selectedMoodId])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <Sparkles size={40} className="text-primary mb-3" />
        <p className="text-body font-medium">Hiện chưa có mẫu hoa trong bộ sưu tập này.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 pb-20 select-none">
      {/* Header */}
      <div className="text-center mb-4 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-caption font-extrabold">
          <Palette size={13} className="text-primary" />
          <span>Bảng Màu Nghệ Thuật (Color Moodboard)</span>
        </div>
        <h2 className="text-title font-extrabold text-foreground">{catalogName}</h2>
        <p className="text-caption text-text-muted">
          Lựa chọn hoa theo concept tông màu yêu thích và phong thủy
        </p>
      </div>

      {/* Color Swatch Bar */}
      <div className="bg-surface rounded-2xl border border-border p-3.5 shadow-sm mb-4 space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {COLOR_MOODS.map((mood) => {
            const isCurrent = selectedMoodId === mood.id
            return (
              <button
                type="button"
                key={mood.id}
                onClick={() => setSelectedMoodId(mood.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-caption font-bold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-primary text-white shadow-xs scale-102"
                    : "bg-surface-muted text-text-muted hover:text-foreground border border-border/70"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: mood.colorHex }}
                />
                <span>{mood.label}</span>
              </button>
            )
          })}
        </div>

        <div className="text-caption text-text-muted flex items-center gap-1.5 pt-1 border-t border-border/60">
          <span className="font-bold text-foreground">{activeMood.label}:</span>
          <span>{activeMood.description}</span>
        </div>
      </div>

      {/* Product Cards for Selected Moodboard */}
      <div className="space-y-4">
        {filteredProducts.map((p) => {
          const isSelected = selectedProductId === p.id

          return (
            <div
              key={p.id}
              className={`bg-surface rounded-3xl border overflow-hidden shadow-md transition-all duration-200 ${
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {/* Product Visual */}
              <div className="relative aspect-[16/10] w-full bg-surface-muted overflow-hidden">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-caption text-text-muted">
                    Hoa tươi
                  </div>
                )}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-caption font-semibold">
                  Tông {activeMood.label}
                </div>
              </div>

              {/* Card Footer Info & Primary Conversion Channel */}
              <div className="p-4 flex items-center justify-between gap-3 bg-surface">
                <div className="min-w-0">
                  <h3 className="text-body font-extrabold text-foreground truncate">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-title-sm font-extrabold text-primary">
                      {p.price.toLocaleString("vi-VN")} đ
                    </span>
                    <span className="text-caption text-text-muted">· {p.code}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={isSelected ? "secondary" : "primary"}
                  size="default"
                  onClick={() => onSelectProduct(p)}
                  className="h-10 px-4 rounded-xl font-extrabold text-caption bg-primary hover:bg-primary-dark text-white shadow-xs shrink-0 cursor-pointer"
                >
                  <Check size={16} className="mr-1" />
                  <span>{isSelected ? "ĐÃ CHỌN" : "CHỌN MẪU"}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
