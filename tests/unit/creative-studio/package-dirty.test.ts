import { describe, expect, it } from "vitest"

import { samePosts, type PackagePostDto } from "@/components/creative-studio/package-client"

// Bài đang soạn ở Chặng 07 — thứ tự khoá và thứ tự kênh như màn hình dựng.
const draft: PackagePostDto[] = [
  { channel: "facebook", text: "Kệ hoa khai trương", hashtags: ["#kehoa", "#khaitruong"] },
  { channel: "zalo", text: "Miễn phí thiệp", hashtags: [] },
]

describe("samePosts — cờ 'Có thay đổi chưa lưu' của Chặng 08", () => {
  it("coi là giống khi jsonb đảo thứ tự khoá", () => {
    // Postgres jsonb trả khoá ngắn trước: text, channel, hashtags.
    const fromDb = JSON.parse(
      '[{"text":"Kệ hoa khai trương","channel":"facebook","hashtags":["#kehoa","#khaitruong"]},{"text":"Miễn phí thiệp","channel":"zalo","hashtags":[]}]'
    ) as PackagePostDto[]
    expect(JSON.stringify(fromDb)).not.toBe(JSON.stringify(draft))
    expect(samePosts(draft, fromDb)).toBe(true)
  })

  it("coi là giống khi thứ tự kênh khác (bài từ Khu vực B)", () => {
    expect(samePosts(draft, [...draft].reverse())).toBe(true)
  })

  it("phát hiện thay đổi thật: nội dung, hashtag, bật/tắt kênh", () => {
    expect(samePosts(draft, [{ ...draft[0]!, text: "Khác" }, draft[1]!])).toBe(false)
    expect(samePosts(draft, [{ ...draft[0]!, hashtags: ["#kehoa"] }, draft[1]!])).toBe(false)
    expect(samePosts(draft, [draft[0]!])).toBe(false)
  })
})
