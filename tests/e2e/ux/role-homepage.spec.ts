import { expect, test } from "@playwright/test"
import { createTestUserAndLogin } from "./helpers"

test.describe("UX Role-based Homepage (03b Role UX §4)", () => {
  test("vai Điều hành (dieu_hanh, PRODUCTION) vào trang chủ Business & Operations Command Center", async ({ page }) => {
    await createTestUserAndLogin(page, {
      roleKey: "dieu_hanh",
      workspaceKind: "PRODUCTION",
    })
    await page.goto("/")

    // Tiêu đề hoặc trạng thái can thiệp của Quản lý cửa hàng
    const interventionHeading = page.locator("text=/Cần can thiệp|Không có việc cần can thiệp/i")
    await expect(interventionHeading.first()).toBeVisible({ timeout: 15_000 })
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
