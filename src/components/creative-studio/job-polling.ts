/**
 * Luật theo dõi job của Khu vực A (tối ưu ảnh) và B (biến thể marketing) —
 * thuần, không React, để test khoá được.
 *
 * Trước 25/09/2026 hai vòng poll ở `use-creative-studio-data.ts` gọi
 * `setTimeout` vô hạn: không hạn thời gian, không dừng khi rời trang, không
 * xử lý `CANCELLED`, 404 bị poll lại mãi; còn vòng tối ưu ảnh thì NGỪNG
 * poll khi gặp một lỗi mạng thoáng qua — UI kẹt ở "đang chạy". Mẫu chuẩn là
 * vòng poll Khu vực C (`audio-workspace.tsx`: token + hạn 10 phút).
 */

export const JOB_POLL_INTERVAL_MS = 2_000
/** Cùng hạn với Khu vực C. Job vẫn nằm trong hàng đợi; người dùng kiểm tra lại sau. */
export const JOB_POLL_DEADLINE_MS = 10 * 60 * 1_000
/** Lỗi mạng / 5xx liên tiếp tối đa trước khi báo mất kết nối. */
export const JOB_POLL_MAX_CONSECUTIVE_ERRORS = 5

export interface JobPollState {
  startedAt: number
  consecutiveErrors: number
}

export type JobPollVerdict = { retry: true; state: JobPollState } | { retry: false; message: string }

export function startJobPoll(now: number = Date.now()): JobPollState {
  return { startedAt: now, consecutiveErrors: 0 }
}

export function pollDeadlineExceeded(state: JobPollState, now: number): boolean {
  return now - state.startedAt >= JOB_POLL_DEADLINE_MS
}

export const POLL_TIMEOUT_MESSAGE =
  "Chưa có kết quả sau 10 phút. Job vẫn nằm trong hàng đợi — kiểm tra worker media rồi mở lại job từ danh sách job."

/**
 * Một lượt đọc trạng thái hỏng. `httpStatus = null` là lỗi mạng (fetch ném).
 * 401/403/404 không tự khỏi → dừng ngay; lỗi mạng, 429, 5xx → thử lại tới
 * ngưỡng lỗi liên tiếp hoặc hết hạn.
 */
export function onPollFailure(httpStatus: number | null, state: JobPollState, now: number = Date.now()): JobPollVerdict {
  if (httpStatus === 401) return { retry: false, message: "Phiên đăng nhập đã hết hạn — đăng nhập lại để xem kết quả job." }
  if (httpStatus === 403 || httpStatus === 404)
    return { retry: false, message: "Không tìm thấy job này trong tổ chức hoặc không có quyền xem." }
  if (httpStatus !== null && httpStatus >= 400 && httpStatus < 500 && httpStatus !== 408 && httpStatus !== 429)
    return { retry: false, message: `Máy chủ từ chối đọc trạng thái job (mã ${httpStatus}).` }
  const next = { ...state, consecutiveErrors: state.consecutiveErrors + 1 }
  if (next.consecutiveErrors >= JOB_POLL_MAX_CONSECUTIVE_ERRORS)
    return { retry: false, message: "Mất kết nối tới máy chủ khi theo dõi job. Job vẫn chạy phía máy chủ — tải lại trang để xem kết quả." }
  if (pollDeadlineExceeded(next, now)) return { retry: false, message: POLL_TIMEOUT_MESSAGE }
  return { retry: true, state: next }
}

/** Một lượt đọc thành công nhưng job chưa xong. Đặt lại bộ đếm lỗi. */
export function onPollPending(state: JobPollState, now: number = Date.now()): JobPollVerdict {
  if (pollDeadlineExceeded(state, now)) return { retry: false, message: POLL_TIMEOUT_MESSAGE }
  return { retry: true, state: { ...state, consecutiveErrors: 0 } }
}

export const JOB_CANCELLED_MESSAGE = "Job đã bị huỷ."
