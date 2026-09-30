"use client"

import React, { useState, useMemo } from "react"
import { Search, Sparkles, Copy, Check, TrendingUp, Filter } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  matchProductsByBudget,
  type BudgetMatchCriteria,
  type ProductMatchCandidate,
  type MatchScoredProduct,
} from "@/modules/products/domain/budget-flower-matcher"

export interface BudgetMatchingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProduct?: ((product: ProductMatchCandidate) => void) | undefined
  customCandidates?: ProductMatchCandidate[] | undefined
}

const SAMPLE_PRODUCTS: ProductMatchCandidate[] = [
  {
    id: "prod-1",
    code: "FL-801",
    name: "Bó Hoa Hồng Ohara Tinh Khôi",
    sellingPriceVnd: 550_000,
    category: "Bó hoa",
    colorTheme: "Hồng pastel",
    occasions: ["Sinh nhật", "Tình yêu", "Kỷ niệm"],
    style: "Bó hoa tròn",
    highlightFlowers: ["Hồng Ohara", "Baby trắng", "Lá bạc"],
    isFeatured: true,
  },
  {
    id: "prod-2",
    code: "FL-802",
    name: "Giỏ Hoa Hướng Dương Rực Rỡ",
    sellingPriceVnd: 680_000,
    category: "Giỏ hoa",
    colorTheme: "Vàng ấm",
    occasions: ["Sinh nhật", "Khai trương", "Chúc mừng"],
    style: "Giỏ mây",
    highlightFlowers: ["Hướng dương Đà Lạt", "Cúc tana", "Hồng vàng"],
    isFeatured: true,
  },
  {
    id: "prod-3",
    code: "FL-803",
    name: "Bó Hoa Hồng Juliet Hoàng Gia VIP",
    sellingPriceVnd: 850_000,
    category: "Bó hoa",
    colorTheme: "Cam pastel",
    occasions: ["Sinh nhật", "Kỷ niệm", "Tình yêu"],
    style: "Bó hoa dài",
    highlightFlowers: ["Hồng Juliet", "Lan hồ điệp", "Phi yến"],
    isFeatured: true,
  },
  {
    id: "prod-4",
    code: "FL-804",
    name: "Lẵng Hoa Khai Trương Thịnh Vượng",
    sellingPriceVnd: 1_250_000,
    category: "Lẵng hoa",
    colorTheme: "Đỏ vàng",
    occasions: ["Khai trương", "Khánh thành"],
    style: "Lẵng 1 tầng",
    highlightFlowers: ["Hồng môn đỏ", "Hướng dương", "Thiên điểu"],
    isFeatured: false,
  },
]

const QUICK_BUDGETS = [
  { label: "Dưới 500k", min: 250_000, max: 500_000 },
  { label: "500k - 800k", min: 500_000, max: 800_000 },
  { label: "800k - 1.2tr", min: 800_000, max: 1_200_000 },
  { label: "Trên 1.2tr", min: 1_200_000, max: 2_500_000 },
]

export function BudgetMatchingModal({
  open,
  onOpenChange,
  onSelectProduct,
  customCandidates,
}: BudgetMatchingModalProps) {
  const [minPrice, setMinPrice] = useState<number>(500_000)
  const [maxPrice, setMaxPrice] = useState<number>(800_000)
  const [occasion, setOccasion] = useState<string>("Sinh nhật")
  const [recipient, setRecipient] = useState<string>("Bạn gái")
  const [colorTone, setColorTone] = useState<string>("")
  const [copiedPitchId, setCopiedPitchId] = useState<string | null>(null)

  const candidates = customCandidates ?? SAMPLE_PRODUCTS

  const matchResult = useMemo(() => {
    const criteria: BudgetMatchCriteria = {
      minPriceVnd: minPrice,
      maxPriceVnd: maxPrice,
      occasion: occasion || undefined,
      recipient: recipient || undefined,
      colorTone: colorTone || undefined,
    }
    return matchProductsByBudget(candidates, criteria)
  }, [candidates, minPrice, maxPrice, occasion, recipient, colorTone])

  const handleCopyPitch = async (item: MatchScoredProduct) => {
    try {
      await navigator.clipboard.writeText(item.suggestedCustomerPitch)
      setCopiedPitchId(item.product.id)
      setTimeout(() => setCopiedPitchId(null), 2500)
    } catch {
      // Fallback
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center justify-between gap-3 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">Tìm hoa theo ngân sách & Gợi ý Upsell</span>
            <Badge tone="accent" className="text-caption">Độ khớp AI</Badge>
          </div>
          <span className="text-caption text-muted">Tư vấn chốt đơn 1-chạm</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-caption text-muted">{matchResult.consultingSummary}</div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Bộ lọc ngân sách & Tiêu chí tư vấn */}
        <div className="p-3.5 rounded-xl border border-border bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-caption font-semibold text-text flex items-center gap-1.5">
              <Filter size={14} className="text-primary" />
              Tiêu chí ngân sách & người nhận
            </div>
            <div className="flex items-center gap-1.5">
              {QUICK_BUDGETS.map((qb) => (
                <button
                  type="button"
                  key={qb.label}
                  onClick={() => {
                    setMinPrice(qb.min)
                    setMaxPrice(qb.max)
                  }}
                  className={`px-2 py-0.5 rounded text-caption font-medium transition border ${
                    minPrice === qb.min && maxPrice === qb.max
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border bg-surface text-muted hover:border-primary/30"
                  }`}
                >
                  {qb.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-caption text-muted mb-1 font-medium">Ngân sách tối thiểu</label>
              <input
                type="number"
                step={50000}
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full h-8 px-2 rounded-md border border-border bg-surface text-body-sm text-text"
              />
            </div>
            <div>
              <label className="block text-caption text-muted mb-1 font-medium">Ngân sách tối đa</label>
              <input
                type="number"
                step={50000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-8 px-2 rounded-md border border-border bg-surface text-body-sm text-text"
              />
            </div>
            <div>
              <label className="block text-caption text-muted mb-1 font-medium">Dịp tặng hoa</label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="vd: Sinh nhật, Kỷ niệm..."
                className="w-full h-8 px-2 rounded-md border border-border bg-surface text-body-sm text-text"
              />
            </div>
            <div>
              <label className="block text-caption text-muted mb-1 font-medium">Người nhận</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="vd: Bạn gái, Mẹ, Sếp..."
                className="w-full h-8 px-2 rounded-md border border-border bg-surface text-body-sm text-text"
              />
            </div>
          </div>
        </div>

        {/* Danh sách mẫu hoa phù hợp chuẩn ngân sách */}
        <div>
          <div className="text-caption font-bold text-text mb-2 flex items-center justify-between">
            <span>Mẫu hoa chuẩn ngân sách ({matchResult.bestMatches.length} mẫu)</span>
            <span className="text-caption text-muted">Sắp xếp theo độ khớp cao nhất</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {matchResult.bestMatches.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-lg border border-border bg-surface hover:border-primary/40 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-body-sm text-text">{item.product.name}</div>
                  <Badge tone="success" className="text-caption">{item.matchScore}% khớp</Badge>
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span className="font-bold text-primary text-body-sm">
                    {item.product.sellingPriceVnd.toLocaleString("vi-VN")} đ
                  </span>
                  <span className="text-muted">{item.product.colorTheme} · {item.product.style}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.matchReasons.map((r, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-surface-alt text-caption text-text-muted">
                      ✓ {r}
                    </span>
                  ))}
                </div>
                <div className="pt-1 flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1"
                    onClick={() => handleCopyPitch(item)}
                  >
                    {copiedPitchId === item.product.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedPitchId === item.product.id ? "Đã chép câu tư vấn" : "Chép câu tư vấn"}
                  </Button>
                  {onSelectProduct && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary"
                      onClick={() => {
                        onSelectProduct(item.product)
                        onOpenChange(false)
                      }}
                    >
                      Báo giá ngay
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Khối gợi ý nâng cấp (Upsell Recommendations) */}
        {matchResult.upsellMatches.length > 0 && (
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center gap-1.5 text-caption font-bold text-primary">
              <TrendingUp size={14} />
              Gợi ý nâng cấp sang trọng hơn (Upsell +10% - 25% ngân sách)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {matchResult.upsellMatches.map((item) => (
                <div key={item.product.id} className="p-2.5 rounded-lg border border-border bg-surface space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-body-sm text-text">{item.product.name}</span>
                    <Badge tone="accent" className="text-caption">Đề xuất Upsell</Badge>
                  </div>
                  <div className="text-caption font-bold text-primary">
                    {item.product.sellingPriceVnd.toLocaleString("vi-VN")} đ
                  </div>
                  <p className="text-caption text-muted italic line-clamp-2">{item.suggestedCustomerPitch}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1 mt-1"
                    onClick={() => handleCopyPitch(item)}
                  >
                    {copiedPitchId === item.product.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    {copiedPitchId === item.product.id ? "Đã chép lời chào Upsell" : "Chép lời chào Upsell"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
