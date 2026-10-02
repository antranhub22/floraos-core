"use client"

import React from "react"
import { Star, MessageSquareQuote, CheckCircle2 } from "lucide-react"

interface ReviewItem {
  id: string
  author: string
  occasion: string
  rating: number
  comment: string
  verified: boolean
}

interface LandingTemplateReviewsProps {
  archetypeId?: string | undefined
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    author: "Thanh Hằng",
    occasion: "Tặng sinh nhật mẹ",
    rating: 5,
    comment: "Hoa giao đến còn tươi rói, mẹ mình khen tấm tắc. Thợ cắm hoa chụp ảnh gửi duyệt trước rất nhiệt tình và chu đáo!",
    verified: true,
  },
  {
    id: "rev-2",
    author: "Quốc Anh",
    occasion: "Kỷ niệm ngày cưới",
    rating: 5,
    comment: "Bó hồng Ohara thơm nức và đóng gói rất sang. Giao đúng giờ hẹn dù thời tiết mưa gió. Sẽ tiếp tục ủng hộ tiệm dài dài.",
    verified: true,
  },
  {
    id: "rev-3",
    author: "Chị Minh Thư",
    occasion: "Hoa khai trương đối tác",
    rating: 5,
    comment: "Lẵng hoa nổi bật nhất buổi lễ khai trương, banner in chữ nhũ rất sắc nét. Tiệm có xuất hóa đơn VAT đầy đủ cho công ty.",
    verified: true,
  },
]

export function LandingTemplateReviews({
  archetypeId = "minimal-luxury",
}: LandingTemplateReviewsProps) {
  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"
  const isFestive = archetypeId === "festive-sale"

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
          <MessageSquareQuote size={14} className={isLuxury || isRomantic ? "text-primary" : isFestive ? "text-danger" : "text-warning"} />
          <span className={isLuxury ? "font-serif" : ""}>
            {isLuxury ? "Cảm Nhận Tri Kỷ & Lời Trân Quý" : "Cảm Nhận Từ Khách Hàng"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-caption text-text-muted">
          <div className="flex text-warning">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} fill="currentColor" />
            ))}
          </div>
          <span className={`font-bold ${isLuxury ? "font-serif text-primary" : "text-text"}`}>4.9/5</span>
          <span className={isLuxury ? "font-serif" : ""}>(500+ đánh giá)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {DEFAULT_REVIEWS.map((rev) => (
          <div
            key={rev.id}
            className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between space-y-3 transition-all ${
              isLuxury
                ? "bg-surface-alt/60 border-primary/20 hover:border-primary/50"
                : isFestive
                ? "bg-surface border-danger/20 hover:border-danger"
                : "bg-surface border-border hover:border-primary/50"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex text-warning">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={11} fill="currentColor" />
                  ))}
                </div>
                {rev.verified && (
                  <span className="text-caption font-medium text-success flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Đã mua hàng</span>
                  </span>
                )}
              </div>
              <p className={`text-caption leading-relaxed italic ${isLuxury ? "font-serif text-text/85 text-body-sm" : "text-text-muted"}`}>
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            <div className={`pt-2 border-t flex items-center justify-between text-caption ${
              isLuxury ? "border-primary/15 font-serif" : "border-border"
            }`}>
              <span className={`font-bold ${isLuxury ? "text-primary" : "text-text"}`}>{rev.author}</span>
              <span className={isLuxury ? "text-text-muted/80 italic" : "text-text-muted"}>{rev.occasion}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
