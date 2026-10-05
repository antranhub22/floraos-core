import { expect, test } from "@playwright/test"
import { createTestUserAndLogin } from "./helpers"

test.describe("UX Role-based Homepage (03b Role UX §4)", () => {
  test("vai Điều hành (dieu_hanh, PRODUCTION) vào trang chủ Journey-First của cửa hàng (ChoiceGrid)", async ({ page }) => {
    await createTestUserAndLogin(page, {
      roleKey: "dieu_hanh",
      workspaceKind: "PRODUCTION",
    })
    await page.goto("/")

    // Từ 30/09/2026 (Journey-First, PO duyệt) trang chủ chủ tiệm là ChoiceGrid
    // "Bạn muốn làm gì?" thay cho khối "Cần can thiệp" cũ.
    await expect(page.getByRole("heading", { level: 1, name: /Bạn muốn làm gì/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole("heading", { level: 3, name: "Xem báo cáo" })).toBeVisible()
  })

  test("vai Bán hàng (sale, PRODUCTION) vào trang chủ Pipeline Workspace", async ({ page }) => {
    await createTestUserAndLogin(page, {
      roleKey: "sale",
      workspaceKind: "PRODUCTION",
    })
    await page.goto("/")

    // Kiểm tra khối "Khách cần liên hệ" hoặc nút tạo đơn
    const contactBlock = page.locator("text=/Khách cần liên hệ|Tạo đơn nhanh|Tạo đơn/i")
    await expect(contactBlock.first()).toBeVisible({ timeout: 15_000 })
  })

  test("vai Điều phối (dieu_phoi, PRODUCTION) tự động chuyển hướng sang /dieu-phoi (Control Tower)", async ({ page }) => {
    await createTestUserAndLogin(page, {
      roleKey: "dieu_phoi",
      workspaceKind: "PRODUCTION",
    })
    await page.goto("/")

    // Chuyển hướng sang /dieu-phoi
    await expect(page).toHaveURL(/\/dieu-phoi/)
  })
})
