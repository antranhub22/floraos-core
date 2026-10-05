import { PRIVACY_POLICY_PATH, isPrivacyNoticeEnabled } from "@/lib/privacy-notice"

/** Dòng chữ nhỏ dưới nút đặt hoa; không hiện gì khi chưa bật (xem `lib/privacy-notice.ts`). */
export function PrivacyNotice() {
  if (!isPrivacyNoticeEnabled()) return null
  return (
    <p className="text-center text-caption text-text-muted">
      Khi đặt hoa, bạn đồng ý để cửa hàng dùng thông tin trên chỉ để giao hoa.{" "}
      <a href={PRIVACY_POLICY_PATH} target="_blank" rel="noreferrer" className="underline">
        Chính sách bảo mật
      </a>
    </p>
  )
}
