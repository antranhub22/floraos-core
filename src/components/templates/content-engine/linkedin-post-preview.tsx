"use client"

import React from "react"
import {
  ThumbsUp,
  MessageSquare,
  Repeat,
  Send,
  MoreHorizontal,
  Globe,
  Building2,
} from "lucide-react"
import type { SocialPostPreviewProps } from "./social-post-preview"

/**
 * LinkedInPreview - Mô phỏng giao diện bài viết chuyên nghiệp B2B trên LinkedIn Feed
 */
export function LinkedInPreview({
  post,
  productName = "Hoa tươi quà tặng doanh nghiệp",
  productImageUrl,
  shopName = "FloraOS Corporate Flowers",
}: SocialPostPreviewProps) {
  return (
    <div className="max-w-md mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md overflow-hidden text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header bài đăng LinkedIn */}
      <div className="p-3.5 flex items-start justify-between">
        <div className="flex items-start gap-2.5">
          <div className="w-11 h-11 rounded-full bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2] flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                {shopName}
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">• 1st</span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5 line-clamp-1">
              Giải Pháp Hoa Tươi & Quà Tặng Doanh Nghiệp Cao Cấp
            </div>
            <div className="flex items-center gap-1 text-[10.5px] text-neutral-400 mt-1">
              <span>Vừa xong</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Globe size={10} /> Đã chỉnh sửa
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Nội dung bài viết */}
      <div className="px-3.5 pb-3 text-xs leading-relaxed space-y-2">
        {post.headline && (
          <div className="font-extrabold text-[13.5px] text-neutral-900 dark:text-white leading-snug">
            {post.headline}
          </div>
        )}
        <div className="whitespace-pre-line text-neutral-800 dark:text-neutral-200 text-[12px] leading-relaxed">
          {post.bodyText}
        </div>

        {post.cta && (
          <div className="font-semibold text-[#0A66C2] dark:text-sky-400 bg-blue-50/70 dark:bg-sky-950/30 p-2.5 rounded-lg border border-blue-100 dark:border-sky-900/40 text-[11.5px]">
            💼 {post.cta}
          </div>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="text-[#0A66C2] dark:text-sky-400 font-semibold flex flex-wrap gap-1.5 pt-1 text-[11.5px]">
            {post.hashtags.map((h, i) => (
              <span key={i} className="hover:underline cursor-pointer">
                {h.startsWith("#") ? h : `#${h}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ảnh đính kèm */}
      <div className="w-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 dark:from-neutral-800 dark:to-neutral-950 aspect-[16/10] flex flex-col items-center justify-center relative overflow-hidden border-y border-neutral-100 dark:border-neutral-800">
        {productImageUrl ? (
          <img
            src={productImageUrl}
            alt={productName}
            onError={(e) => {
              e.currentTarget.src = "/images/sample-flower.jpg"
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-2xl border border-neutral-100 dark:border-neutral-700">
              💐
            </div>
            <div className="font-extrabold text-sm text-neutral-900 dark:text-white">
              {productName}
            </div>
            <span className="text-[11px] font-semibold text-[#0A66C2] bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200/50">
              B2B Premium Floral Styling · FloraOS
            </span>
          </div>
        )}
      </div>

      {/* Thống kê tương tác LinkedIn */}
      <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-[#0A66C2] text-white text-[9px] shadow-xs">
              👍
            </span>
            <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-amber-500 text-white text-[9px] shadow-xs">
              💡
            </span>
            <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[9px] shadow-xs">
              ❤️
            </span>
          </div>
          <span className="font-medium hover:text-[#0A66C2] hover:underline cursor-pointer">
            Nguyễn Tuấn và 64 người khác
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hover:text-[#0A66C2] hover:underline cursor-pointer">18 bình luận</span>
          <span>•</span>
          <span className="hover:text-[#0A66C2] hover:underline cursor-pointer">6 lượt đăng lại</span>
        </div>
      </div>

      {/* Thanh hành động LinkedIn (Like, Comment, Repost, Send) */}
      <div className="px-2 py-1.5 grid grid-cols-4 gap-1 text-[11.5px] font-semibold text-neutral-600 dark:text-neutral-300">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ThumbsUp size={15} />
          <span>Thích</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <MessageSquare size={15} />
          <span>Bình luận</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Repeat size={15} />
          <span>Đăng lại</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Send size={15} />
          <span>Gửi</span>
        </button>
      </div>
    </div>
  )
}
