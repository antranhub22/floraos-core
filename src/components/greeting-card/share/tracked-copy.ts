"use client"

import { apiSend } from "@/components/greeting-card/greeting-api"

/**
 * Chép một link phải lấy từ máy chủ trước (link mang tên người bấm). Safari/iPhone chỉ cho chép
 * trong chính lần bấm, nên dùng `ClipboardItem` nhận Promise; trình duyệt cũ chép sau khi có link.
 */
export async function copyFromServer(produce: () => Promise<string>): Promise<string> {
  const textPromise = produce()
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const blob = textPromise.then((t) => new Blob([t], { type: "text/plain" }))
    await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })])
    return textPromise
  }
  const text = await textPromise
  await navigator.clipboard.writeText(text)
  return text
}

/** Link bộ sưu tập mang tên người đang đăng nhập (`/s/<mã>`), dạng đầy đủ để gửi khách. */
export async function createShareUrl(catalogId: string, channel?: string | null): Promise<string> {
  const res = await apiSend<{ data: { path: string } }>("/api/v1/greeting-card/share-links", "POST", { catalogId, channel: channel || null }, "Không tạo được link")
  return `${window.location.origin}${res.data.path}`
}

/** Ghi mốc sao chép link riêng (bắt đầu tính "khách chưa mở"); lỗi mạng không chặn việc chép. */
export function markPersonalLinkCopied(sendCode: string): void {
  void apiSend(`/api/v1/greeting-card/send-links/${encodeURIComponent(sendCode)}/copied`, "POST", {}, "").catch(() => undefined)
}
