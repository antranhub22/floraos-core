import { describe, expect, it } from "vitest"

import {
  JOB_POLL_DEADLINE_MS,
  JOB_POLL_MAX_CONSECUTIVE_ERRORS,
  POLL_TIMEOUT_MESSAGE,
  onPollFailure,
  onPollPending,
  startJobPoll,
} from "@/components/creative-studio/job-polling"

describe("luật theo dõi job Khu vực A/B", () => {
  const t0 = 1_000_000

  it("lỗi mạng thoáng qua thì thử lại chứ không bỏ dở (lỗi cũ của vòng tối ưu ảnh)", () => {
    const v = onPollFailure(null, startJobPoll(t0), t0 + 2_000)
    expect(v.retry).toBe(true)
    if (v.retry) expect(v.state.consecutiveErrors).toBe(1)
  })

  it("5xx/429 thử lại; lỗi liên tiếp tới ngưỡng thì dừng và báo", () => {
    let s = startJobPoll(t0)
    for (let i = 1; i < JOB_POLL_MAX_CONSECUTIVE_ERRORS; i++) {
      const v = onPollFailure(i % 2 ? 502 : 429, s, t0 + i * 2_000)
      expect(v.retry).toBe(true)
      if (v.retry) s = v.state
    }
    expect(onPollFailure(503, s, t0 + 20_000).retry).toBe(false)
  })

  it("một lượt đọc thành công đặt lại bộ đếm lỗi", () => {
    const failed = onPollFailure(null, startJobPoll(t0), t0 + 1)
    if (!failed.retry) throw new Error("phải thử lại")
    const ok = onPollPending(failed.state, t0 + 2)
    expect(ok.retry && ok.state.consecutiveErrors).toBe(0)
  })

  it("401/403/404/400 dừng ngay — không poll lại mãi", () => {
    for (const code of [401, 403, 404, 400]) expect(onPollFailure(code, startJobPoll(t0), t0).retry).toBe(false)
  })

  it("quá hạn 10 phút thì dừng, kể cả khi job vẫn PENDING", () => {
    const v = onPollPending(startJobPoll(t0), t0 + JOB_POLL_DEADLINE_MS)
    expect(v).toEqual({ retry: false, message: POLL_TIMEOUT_MESSAGE })
    expect(onPollPending(startJobPoll(t0), t0 + JOB_POLL_DEADLINE_MS - 1).retry).toBe(true)
  })
})
