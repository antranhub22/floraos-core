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
    <div className="max-w-md mx-auto rounded-xl border border-cool-200 dark:border-cool-800 bg-white dark:bg-cool-900 shadow-md overflow-hidden text-cool-900 dark:text-cool-100 font-sans">
      {/* Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blush-400 to-petal-500 flex items-center justify-center text-white font-bold shadow-xs">
            🌸
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold leading-none">{shopName}</span>
              <CheckCircle2 size={14} className="text-ocean-500 fill-ocean-500 text-white" />
            </div>
            <div className="flex items-center gap-1 text-caption text-text-muted mt-0.5">
              <span>Vừa xong</span>
              <span>•</span>
              <Globe size={11} />
            </div>
          </div>
        </div>
        <button
              aria-label="Thêm tùy chọn" className="text-cool-400 hover:text-cool-600 p-1" type="button" onClick={() => undefined}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-3.5 pb-3 text-xs leading-relaxed space-y-2">
        <div className="font-bold text-sm text-cool-900 dark:text-white">
          {post.headline}
        </div>
        <div className="whitespace-pre-line text-cool-800 dark:text-cool-200">
          {post.bodyText}
        </div>
        {post.cta && (
          <div className="font-semibold text-ocean-600 dark:text-ocean-400 italic">
            👉 {post.cta}
          </div>
        )}
        {post.hashtags.length > 0 && (
          <div className="text-ocean-600 dark:text-ocean-400 font-medium flex flex-wrap gap-1">
            {post.hashtags.map((h, i) => (
              <span key={i}>{h.startsWith("#") ? h : `#${h}`}</span>
            ))}
          </div>
        )}
      </div>

      {/* Media Mockup */}
      <div className="w-full bg-gradient-to-br from-blush-100 via-petal-50 to-sand-50 dark:from-cool-800 dark:to-cool-950 aspect-[4/3] flex flex-col items-center justify-center relative p-6 text-center border-y border-cool-100 dark:border-cool-800">
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
            <div className="font-extrabold text-sm text-blush-950 dark:text-blush-200">{productName}</div>
            <span className="text-caption font-semibold text-primary bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs border border-primary-muted/50">
              Thiết kế hoa tươi độc bản · Tiệm Hoa FloraOS
            </span>
          </div>
        )}
      </div>

      {/* Post Social Stats */}
      <div className="px-3.5 py-2 flex items-center justify-between text-caption text-text-muted border-b border-border dark:border-cool-800">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-ocean-500 text-white text-caption">
            👍
          </span>
          <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blush-500 text-white text-caption">
            ❤️
          </span>
          <span className="font-medium">128</span>
        </div>
        <div>
          <span>16 bình luận</span> • <span>5 chia sẻ</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-1 py-1 grid grid-cols-3 text-cool-600 dark:text-cool-400 font-semibold text-xs text-center">
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-cool-100 dark:hover:bg-cool-800 transition" type="button" onClick={() => undefined}>
          <ThumbsUp size={15} />
          <span>Thích</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-cool-100 dark:hover:bg-cool-800 transition" type="button" onClick={() => undefined}>
          <MessageCircle size={15} />
          <span>Bình luận</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-cool-100 dark:hover:bg-cool-800 transition" type="button" onClick={() => undefined}>
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
    <div className="max-w-md mx-auto rounded-xl border border-cool-200 dark:border-cool-800 bg-white dark:bg-black shadow-md overflow-hidden text-cool-900 dark:text-white font-sans">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-cool-100 dark:border-cool-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-sand-500 via-blush-500 to-orchid-600">
            <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center text-xs">
              🌸
            </div>
          </div>
          <div>
            <div className="text-xs font-bold leading-none">tiemhoa.floraos</div>
            <div className="text-caption text-text-muted mt-0.5">{shopName}</div>
          </div>
        </div>
        <button
              aria-label="Thêm tùy chọn" className="text-cool-400 p-1" type="button" onClick={() => undefined}>
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* 1:1 Aspect Media */}
      <div className="w-full aspect-square bg-gradient-to-tr from-orchid-100 via-petal-50 to-blush-100 dark:from-cool-900 dark:to-cool-950 flex flex-col items-center justify-center relative p-6 text-center">
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
            <div className="font-extrabold text-sm text-cool-900 dark:text-white">{productName}</div>
            <div className="text-caption text-text-muted">Instagram Aesthetic Grid</div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart size={20} className="hover:text-blush-500 cursor-pointer" />
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
          <div className="text-cool-800 dark:text-cool-300 whitespace-pre-line mt-1">
            {post.bodyText}
          </div>
          {post.cta && (
            <div className="text-cool-600 dark:text-cool-400 italic pt-1">
              ✨ {post.cta}
            </div>
          )}
          {post.hashtags.length > 0 && (
            <div className="text-info text-caption pt-1">
              {post.hashtags.map((h, i) => (
                <span key={i} className="mr-1">{h.startsWith("#") ? h : `#${h}`}</span>
              ))}
            </div>
          )}
        </div>

        <div className="text-caption uppercase text-text-muted tracking-wider mt-2 mb-1">
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
    <div className="max-w-[320px] mx-auto rounded-2xl bg-black text-white shadow-2xl overflow-hidden aspect-[9/16] relative flex flex-col justify-between border-4 border-cool-900 font-sans">
      {/* Top Header */}
      <div className="pt-3 px-4 flex items-center justify-center gap-4 text-xs font-bold z-10 text-cool-400">
        <span>Đang theo dõi</span>
        <span className="text-white border-b-2 border-white pb-0.5">Dành cho bạn</span>
      </div>

      {/* Background Visual Mockup */}
      <div className="absolute inset-0 bg-gradient-to-b from-cool-900 via-cool-950 to-black flex items-center justify-center p-6 text-center">
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
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-blush-300 font-bold border border-blush-500/30">
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
          <div className="w-10 h-10 rounded-full border-2 border-white bg-blush-500 flex items-center justify-center text-sm font-bold">
            🌸
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-blush-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-caption font-black">
            +
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <Heart size={22} className="fill-blush-500 text-blush-500" />
          </div>
          <span className="text-caption font-bold mt-0.5">18.4K</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <MessageCircle size={22} />
          </div>
          <span className="text-caption font-bold mt-0.5">342</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <Bookmark size={22} />
          </div>
          <span className="text-caption font-bold mt-0.5">1.2K</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-2 rounded-full bg-black/40 backdrop-blur-xs">
            <Share2 size={22} />
          </div>
          <span className="text-caption font-bold mt-0.5">486</span>
        </div>

        {/* Spinning Vinyl */}
        <div className="w-8 h-8 rounded-full bg-cool-800 border-2 border-cool-700 animate-spin flex items-center justify-center">
          <Music size={14} className="text-white" />
        </div>
      </div>

      {/* Bottom Info Overlay */}
      <div className="p-3.5 z-10 bg-gradient-to-t from-black via-black/80 to-transparent pr-14 text-left">
        <div className="text-sm font-extrabold flex items-center gap-1.5">
          <span>@tiemhoa_floraos</span>
          <CheckCircle2 size={13} className="text-ocean-400 fill-ocean-400 text-black" />
        </div>

        <div className="text-xs font-bold text-white mt-1 line-clamp-1">
          {post.headline}
        </div>

        <div className="text-caption text-cool-300 line-clamp-2 mt-0.5 leading-snug">
          {post.bodyText}
        </div>

        {post.hashtags.length > 0 && (
          <div className="text-caption font-bold text-white/90 line-clamp-1 mt-1">
            {post.hashtags.map((h, i) => (
              <span key={i} className="mr-1">{h.startsWith("#") ? h : `#${h}`}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-caption text-cool-300 mt-2">
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
    <div className="max-w-md mx-auto rounded-xl border border-cool-200 dark:border-cool-800 bg-[var(--color-zalo-bg)] dark:bg-cool-950 shadow-md overflow-hidden font-sans">
      {/* Zalo Top Bar */}
      <div className="bg-[var(--color-zalo)] text-white p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white text-[var(--color-zalo)] font-bold flex items-center justify-center text-xs">
            🌸
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1">
              <span>{shopName}</span>
              <span className="text-caption bg-sand-400 text-sand-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                OA
              </span>
            </div>
            <div className="text-caption text-ocean-100">Đã xác thực doanh nghiệp</div>
          </div>
        </div>
        <div className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
          Zalo OA
        </div>
      </div>

      {/* Message Area */}
      <div className="p-3.5 space-y-3">
        <div className="text-center">
          <span className="text-caption text-text-muted bg-surface-alt/80 dark:bg-cool-800 px-2.5 py-0.5 rounded-full">
            Hôm nay 09:30
          </span>
        </div>

        {/* Message Bubble */}
        <div className="bg-white dark:bg-cool-900 rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-cool-200/60 dark:border-cool-800 space-y-2 text-cool-900 dark:text-cool-100">
          <div className="text-sm font-extrabold text-[var(--color-zalo)] dark:text-ocean-400">
            {post.headline}
          </div>

          <div className="text-xs text-cool-700 dark:text-cool-300 leading-relaxed whitespace-pre-line">
            {post.bodyText}
          </div>

          {/* Media in Chat */}
          <div className="rounded-xl overflow-hidden bg-gradient-to-tr from-ocean-50 to-petal-50 dark:from-cool-800 dark:to-cool-900 aspect-[16/9] flex items-center justify-center border border-cool-200/40 dark:border-cool-800 text-center p-3">
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
                <span className="text-xs font-bold text-cool-800 dark:text-cool-200">{productName}</span>
                <span className="text-caption text-text-muted">Mẫu hoa tươi thiết kế trong ngày</span>
              </div>
            )}
          </div>

          {post.cta && (
            <div className="text-xs font-bold text-warning bg-warning-bg dark:bg-sand-950/40 p-2.5 rounded-lg border border-warning-border/60">
              💬 {post.cta}
            </div>
          )}

          {/* Interactive OA Quick Action Buttons */}
          <div className="pt-2 border-t border-cool-100 dark:border-cool-800 grid grid-cols-2 gap-2">
            <button className="py-2 px-3 rounded-lg bg-[var(--color-zalo)] text-white text-xs font-bold hover:bg-ocean-700 transition flex items-center justify-center gap-1" type="button" onClick={() => undefined}>
              <span>Nhắn tin tư vấn</span>
            </button>
            <button className="py-2 px-3 rounded-lg bg-cool-100 dark:bg-cool-800 text-cool-800 dark:text-cool-200 text-xs font-bold hover:bg-cool-200 transition flex items-center justify-center gap-1" type="button" onClick={() => undefined}>
              <span>Xem album mẫu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
