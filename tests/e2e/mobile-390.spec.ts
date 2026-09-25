// Kiểm mobile-first ở 390px (nợ #135). Chạy trên máy dev có Postgres:
//   npm run dev   (cổng 3100)   rồi   npm run test:e2e -- mobile-390
// Mỗi lượt tạo một workspace dùng thử mới qua POST /api/v1/auth/signup.
// Luật: không trang nào được tràn ngang ở 390px; trang "Thêm" phải có menu đầy đủ.

import { expect, test } from "@playwright/test"

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

const TRANG = [
  "/", "/them", "/san-pham", "/tai-anh", "/duyet", "/job", "/don-hang", "/khach-hang", "/hoi-thoai",
  "/so-lieu", "/creative-studio", "/market-intelligence", "/lich-dang", "/noi-dung", "/catalog",
  "/kho-du-lieu", "/kho-templates", "/tri-thuc", "/gia", "/video", "/ket-noi", "/ho-so",
]

test.beforeEach(async ({ page }) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const res = await page.request.post("/api/v1/auth/signup", {
    data: { email: `e2e-${id}@floraos.test`, password: `Mk-${id}-Aa1!`, organization_name: `Tiem E2E ${id}` },
  })
  expect(res.ok(), `signup ${res.status()}`).toBeTruthy()
})

test("trang Thêm có menu đầy đủ trên điện thoại", async ({ page }) => {
  await page.goto("/them")
  const menu = page.getByRole("navigation", { name: "Tất cả chức năng" })
  await expect(menu).toBeVisible()
  for (const href of ["/creative-studio", "/don-hang", "/khach-hang", "/hoi-thoai"]) {
    await expect(menu.locator(`a[href="${href}"]`)).toBeVisible()
  }
})

for (const duong of TRANG) {
  test(`không tràn ngang ở 390px: ${duong}`, async ({ page }) => {
    await page.goto(duong)
    await page.waitForLoadState("networkidle")
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(scroll, `${duong} rộng ${scroll}px > ${client}px`).toBeLessThanOrEqual(client + 1)
  })
}
