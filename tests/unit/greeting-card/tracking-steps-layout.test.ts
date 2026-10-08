import { describe, expect, it } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { TrackingSteps } from "@/components/greeting-card/customer/tracking-steps"

/** Dải 5 bước trên điện thoại: nhãn và khung giờ không bị gãy dòng. */
describe("TrackingSteps — gọn trên một dòng", () => {
  const html = renderToStaticMarkup(
    createElement(TrackingSteps, {
      stepIndex: 1,
      createdAt: "2026-10-08T14:24:00.000Z",
      timeline: { arranging: { displayRange: "17:30 - 19:30" }, delivering: { displayRange: "20:00 - 22:00" } },
    })
  )

  it("khung giờ dùng gạch nối liền, không dấu cách", () => {
    expect(html).toContain("17:30–19:30")
    expect(html).toContain("20:00–22:00")
    expect(html).not.toContain("17:30 - 19:30")
  })

  it("nhãn bước ngắn gọn: 'Xác nhận' thay cho 'Đã xác nhận'", () => {
    expect(html).toContain(">Xác nhận<")
    expect(html).not.toContain("Đã xác nhận")
  })
})
