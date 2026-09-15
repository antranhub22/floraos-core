"use client"

import React from "react"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  MoreHorizontal,
  ThumbsUp,
  Globe,
  Sparkles,
  Music,
  CheckCircle2,
} from "lucide-react"
import type { MultichannelPostItem } from "./multichannel-post-card"
import { LinkedInPreview } from "./linkedin-post-preview"

export interface SocialPostPreviewProps {
  post: MultichannelPostItem
  productName?: string | undefined
  productImageUrl?: string | undefined
  shopName?: string | undefined
}

/**
 * SocialPostPreview - Giả lập giao diện hiển thị thực tế của bài đăng trên các nền tảng MXH
 */
export function SocialPostPreview({
  post,
  productName = "Sản phẩm hoa tươi",
  productImageUrl,
  shopName = "Tiệm Hoa Tươi FloraOS",
}: SocialPostPreviewProps) {
  if (post.channel === "facebook") {
    return (
      <FacebookPreview
        post={post}
        productName={productName}
        productImageUrl={productImageUrl}
        shopName={shopName}
      />
    )
  }

  if (post.channel === "instagram") {
    return (
      <InstagramPreview
        post={post}
        productName={productName}
        productImageUrl={productImageUrl}
        shopName={shopName}
      />
    )
  }

  if (post.channel === "tiktok") {
    return (
      <TikTokPreview
        post={post}
        productName={productName}
        productImageUrl={productImageUrl}
        shopName={shopName}
      />
    )
  }

  if (post.channel === "linkedin") {
    return (
      <LinkedInPreview
        post={post}
        productName={productName}
        productImageUrl={productImageUrl}
        shopName={shopName}
      />
    )
  }

  return (
    <ZaloOAPreview
      post={post}
      productName={productName}
      productImageUrl={productImageUrl}
      shopName={shopName}
    />
  )
}

// ================= 1. FACEBOOK POST PREVIEW =================
function FacebookPreview({
  post,
  productName,
  productImageUrl,
  shopName,
}: SocialPostPreviewProps) {
  return (
    <div className="max-w-md mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md overflow-hidden text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-xs">
            🌸
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold leading-none">{shopName}</span>
              <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 text-white" />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5">
              <span>Vừa xong</span>
              <span>•</span>
              <Globe size={11} />
            </div>
          </div>
        </div>
        <button className="text-neutral-400 hover:text-neutral-600 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-3.5 pb-3 text-xs leading-relaxed space-y-2">
        <div className="font-bold text-sm text-neutral-900 dark:text-white">
          {post.headline}
        </div>
        <div className="whitespace-pre-line text-neutral-800 dark:text-neutral-200">
          {post.bodyText}
        </div>
        {post.cta && (
          <div className="font-semibold text-blue-600 dark:text-blue-400 italic">
            👉 {post.cta}
          </div>
        )}
        {post.hashtags.length > 0 && (
          <div className="text-blue-600 dark:text-blue-400 font-medium flex flex-wrap gap-1">
            {post.hashtags.map((h, i) => (
              <span key={i}>{h.startsWith("#") ? h : `#${h}`}</span>
            ))}
          </div>
        )}
      </div>

      {/* Media Mockup */}
      <div className="w-full bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 dark:from-neutral-800 dark:to-neutral-950 aspect-[4/3] flex flex-col items-center justify-center relative p-6 text-center border-y border-neutral-100 dark:border-neutral-800">
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
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl">💐</span>
            <div className="font-extrabold text-sm text-rose-950 dark:text-rose-200">{productName}</div>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs border border-rose-200/50">
              Thiết kế hoa tươi độc bản · Tiệm Hoa FloraOS
            </span>
          </div>
        )}
      </div>

      {/* Post Social Stats */}
      <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blue-500 text-white text-[9px]">
            👍
          </span>
          <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[9px]">
            ❤️
          </span>
          <span className="font-medium">128</span>
        </div>
        <div>
          <span>16 bình luận</span> • <span>5 chia sẻ</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-1 py-1 grid grid-cols-3 text-neutral-600 dark:text-neutral-400 font-semibold text-xs text-center">
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
          <ThumbsUp size={15} />
          <span>Thích</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
          <MessageCircle size={15} />
          <span>Bình luận</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
          <Share2 size={15} />
          <span>Chia sẻ</span>
        </button>
      </div>
    </div>
  )
}

// ================= 2. INSTAGRAM POST PREVIEW =================
function InstagramPreview({
  post,
  productName,
  productImageUrl,
  shopName,
}: SocialPostPreviewProps) {
  return (
    <div className="max-w-md mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black shadow-md overflow-hidden text-neutral-900 dark:text-white font-sans">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
            <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center text-xs">
              🌸
            </div>
          </div>
          <div>
            <div className="text-xs font-bold leading-none">tiemhoa.floraos</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{shopName}</div>
          </div>
        </div>
        <button className="text-neutral-400 p-1">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* 1:1 Aspect Media */}
      <div className="w-full aspect-square bg-gradient-to-tr from-purple-100 via-pink-50 to-rose-100 dark:from-neutral-900 dark:to-neutral-950 flex flex-col items-center justify-center relative p-6 text-center">
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
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl">🌷</span>
            <div className="font-extrabold text-sm text-neutral-900 dark:text-white">{productName}</div>
            <div className="text-[11px] text-neutral-500">Instagram Aesthetic Grid</div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart size={20} className="hover:text-rose-500 cursor-pointer" />
            <MessageCircle size={20} className="cursor-pointer" />
            <Send size={20} className="cursor-pointer" />
          </div>
          <Bookmark size={20} className="cursor-pointer" />
        </div>

        <div className="text-xs font-bold mb-1.5">284 lượt thích</div>

        {/* Caption */}
        <div className="text-xs leading-relaxed space-y-1">
          <span className="font-bold mr-1.5">tiemhoa.floraos</span>
          <span className="font-semibold">{post.headline}</span>
          <div className="text-neutral-800 dark:text-neutral-300 whitespace-pre-line mt-1">
            {post.bodyText}
          </div>
          {post.cta && (
            <div className="text-neutral-600 dark:text-neutral-400 italic pt-1">
              ✨ {post.cta}
            </div>
          )}
          {post.hashtags.length > 0 && (
            <div className="text-blue-500 text-[11px] pt-1">
              {post.hashtags.map((h, i) => (
                <span key={i} className="mr-1">{h.startsWith("#") ? h : `#${h}`}</span>
              ))}
            </div>
          )}
        </div>

        <div className="text-[10px] uppercase text-neutral-400 tracking-wider mt-2 mb-1">
          25 PHÚT TRƯỚC
        </div>
      </div>
    </div>
  )
}

// ================= 3. TIKTOK VIDEO PREVIEW =================
function TikTokPreview({
  post,
  productName,
  productImageUrl,
  shopName,
}: SocialPostPreviewProps) {
  return (
    <div className="max-w-[320px] mx-auto rounded-2xl bg-black text-white shadow-2xl overflow-hidden aspect-[9/16] relative flex flex-col justify-between border-4 border-neutral-900 font-sans">
      {/* Top Header */}
      <div className="pt-3 px-4 flex items-center justify-center gap-4 text-xs font-bold z-10 text-neutral-400">
        <span>Đang theo dõi</span>
        <span className="text-white border-b-2 border-white pb-0.5">Dành cho bạn</span>
      </div>

      {/* Background Visual Mockup */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black flex items-center justify-center p-6 text-center">
        {productImageUrl ? (
          <img
            src={productImageUrl}
            alt={productName}
            onError={(e) => {
              e.currentTarget.src = "/images/sample-flower.jpg"
            }}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-80">
            <span className="text-7xl">🌺</span>
            <div className="text-sm font-extrabold">{productName}</div>
            {post.script?.hook && (
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-rose-300 font-bold border border-rose-500/30">
                Hook: &quot;{post.script.hook}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Column */}
      <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-4 z-10 text-xs">
        {/* Avatar with + */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-white bg-rose-500 flex items-center justify-center text-sm font-bold">
            🌸
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">
            +
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <Heart size={22} className="fill-rose-500 text-rose-500" />
          </div>
          <span className="text-[11px] font-bold mt-0.5">18.4K</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <MessageCircle size={22} />
          </div>
          <span className="text-[11px] font-bold mt-0.5">342</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <Bookmark size={22} />
          </div>
          <span className="text-[11px] font-bold mt-0.5">1.2K</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <Share2 size={22} />
          </div>
          <span className="text-[11px] font-bold mt-0.5">486</span>
        </div>

        {/* Spinning Vinyl */}
        <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-700 animate-spin flex items-center justify-center">
          <Music size={14} className="text-white" />
        </div>
      </div>

      {/* Bottom Info Overlay */}
      <div className="p-3.5 z-10 bg-gradient-to-t from-black via-black/80 to-transparent pr-14 text-left">
        <div className="text-sm font-extrabold flex items-center gap-1.5">
          <span>@tiemhoa_floraos</span>
          <CheckCircle2 size={13} className="text-blue-400 fill-blue-400 text-black" />
        </div>

        <div className="text-xs font-bold text-white mt-1 line-clamp-1">
          {post.headline}
        </div>

        <div className="text-[11px] text-neutral-300 line-clamp-2 mt-0.5 leading-snug">
          {post.bodyText}
        </div>

        {post.hashtags.length > 0 && (
          <div className="text-[11px] font-bold text-white/90 line-clamp-1 mt-1">
            {post.hashtags.map((h, i) => (
              <span key={i} className="mr-1">{h.startsWith("#") ? h : `#${h}`}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-[10.5px] text-neutral-300 mt-2">
          <Music size={12} className="animate-pulse" />
          <span className="truncate">
            {post.script?.audio_suggestion || "Nhạc nền hoa tươi nhẹ nhàng - Trending Sound"}
          </span>
        </div>
      </div>
    </div>
  )
}

// ================= 4. ZALO OA PREVIEW =================
function ZaloOAPreview({
  post,
  productName,
  productImageUrl,
  shopName,
}: SocialPostPreviewProps) {
  return (
    <div className="max-w-md mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#EEF2F8] dark:bg-neutral-950 shadow-md overflow-hidden font-sans">
      {/* Zalo Top Bar */}
      <div className="bg-[#0068FF] text-white p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white text-[#0068FF] font-bold flex items-center justify-center text-xs">
            🌸
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1">
              <span>{shopName}</span>
              <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                OA
              </span>
            </div>
            <div className="text-[10px] text-blue-100">Đã xác thực doanh nghiệp</div>
          </div>
        </div>
        <div className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
          Zalo OA
        </div>
      </div>

      {/* Message Area */}
      <div className="p-3.5 space-y-3">
        <div className="text-center">
          <span className="text-[10px] text-neutral-500 bg-neutral-200/80 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full">
            Hôm nay 09:30
          </span>
        </div>

        {/* Message Bubble */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-neutral-200/60 dark:border-neutral-800 space-y-2 text-neutral-900 dark:text-neutral-100">
          <div className="text-sm font-extrabold text-[#0068FF] dark:text-blue-400">
            {post.headline}
          </div>

          <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
            {post.bodyText}
          </div>

          {/* Media in Chat */}
          <div className="rounded-xl overflow-hidden bg-gradient-to-tr from-blue-50 to-pink-50 dark:from-neutral-800 dark:to-neutral-900 aspect-[16/9] flex items-center justify-center border border-neutral-200/40 dark:border-neutral-800 text-center p-3">
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
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">💐</span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{productName}</span>
                <span className="text-[10.5px] text-neutral-500">Mẫu hoa tươi thiết kế trong ngày</span>
              </div>
            )}
          </div>

          {post.cta && (
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/60">
              💬 {post.cta}
            </div>
          )}

          {/* Interactive OA Quick Action Buttons */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
            <button className="py-2 px-3 rounded-lg bg-[#0068FF] text-white text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1">
              <span>Nhắn tin tư vấn</span>
            </button>
            <button className="py-2 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-200 transition flex items-center justify-center gap-1">
              <span>Xem album mẫu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
