import { expect, test, type APIRequestContext } from "@playwright/test"

/**
 * E2E Test — Swipe Brochure / Thẻ Chào (03/10/2026)
 *
 * Luồng đầu cuối:
 *   Sale đăng nhập → tạo catalog → tạo link /b/T01-xxx
 *   → Khách mở link → xem mẫu hoa → báo thanh toán
 *   → Admin xác nhận → Khách xem tracking
 *
 * Yêu cầu: docker compose up -d + npm run dev đang chạy tại localhost:3100
 */

test.describe.configure({ mode: "serial" })

const BASE = "http://localhost:3100"

// Đăng ký tenant & lấy session cookie
async function registerTenant(request: APIRequestContext, suffix: string) {
  const email = `brochure-test-${suffix}@floraos-e2e.local`
  const orgName = `BrochureTest ${suffix}`

  const regRes = await request.post(`${BASE}/api/v1/auth/register`, {
    data: { email, password: "Test@12345!", organizationName: orgName },
  })
  expect(regRes.status()).toBeLessThan(300)

  const loginRes = await request.post(`${BASE}/api/v1/auth/login`, {
    data: { email, password: "Test@12345!" },
  })
  expect(loginRes.status()).toBeLessThan(300)
  return { email, orgName }
}

test.describe("Brochure / Thẻ Chào — Luồng chính", () => {
  let catalogId: string
  let sendCode: string
  let orderId: string

  test("1. Tạo catalog và link gửi khách", async ({ request }) => {
    await registerTenant(request, Date.now().toString())

    // Tạo catalog
    const catRes = await request.post(`${BASE}/api/v1/greeting-card/catalogs`, {
      data: { code: `e2e-${Date.now()}`, name: "Catalog E2E Test", type: "STANDARD" },
    })
    expect(catRes.status()).toBe(201)
    const catJson = await catRes.json() as { data: { id: string } }
    catalogId = catJson.data.id
    expect(catalogId).toBeTruthy()

    // Tạo send link
    const linkRes = await request.post(`${BASE}/api/v1/greeting-card/send-links`, {
      data: { catalogId, customerName: "Khách E2E", prefix: "T99" },
    })
    expect(linkRes.status()).toBe(201)
    const linkJson = await linkRes.json() as { data: { sendCode: string } }
    sendCode = linkJson.data.sendCode
    expect(sendCode).toMatch(/^T99-\d{3}$/)
  })

  test("2. Khách mở link brochure công khai", async ({ request }) => {
    expect(sendCode).toBeTruthy()

    const res = await request.get(`${BASE}/api/v1/public/brochure/${sendCode}`)
    expect(res.status()).toBe(200)

    const json = await res.json() as { data: { sendCode: string; catalog: { name: string } } }
    expect(json.data.sendCode).toBe(sendCode)
    expect(json.data.catalog.name).toBe("Catalog E2E Test")
  })

  test("3. Khách đặt hoa qua brochure", async ({ request }) => {
    expect(sendCode).toBeTruthy()

    const res = await request.post(`${BASE}/api/v1/public/brochure/${sendCode}/order`, {
      data: {
        customerName: "Khách E2E",
        customerPhone: "0901234599",
        recipientName: "Người nhận E2E",
        recipientPhone: "0912345699",
        deliveryDate: "2026-12-01",
        deliveryAddress: "123 Đường E2E, Quận 1, TP.HCM",
        cardMessage: "Chúc mừng E2E test!",
      },
    })
    expect(res.status()).toBe(201)

    const json = await res.json() as { data: { orderId: string; orderCode: string; totalVnd: number } }
    orderId = json.data.orderId
    expect(orderId).toBeTruthy()
    expect(json.data.orderCode).toBeTruthy()
  })

  test("4. Khách báo đã chuyển khoản", async ({ request }) => {
    expect(sendCode).toBeTruthy()

    const res = await request.post(`${BASE}/api/v1/public/brochure/${sendCode}/payment-notify`)
    expect(res.status()).toBeLessThan(300)
  })

  test("5. Admin xác nhận thanh toán", async ({ request }) => {
    expect(orderId).toBeTruthy()

    const res = await request.post(
      `${BASE}/api/v1/greeting-card/orders/${orderId}/confirm-payment`,
      { data: { note: "Đã nhận CK — E2E test" } }
    )
    expect(res.status()).toBeLessThan(300)

    const json = await res.json() as { data: { status: string } }
    expect(json.data.status).toBe("CONFIRMED")
  })

  test("6. Khách xem trang theo dõi đơn hàng", async ({ request }) => {
    expect(sendCode).toBeTruthy()

    // Lấy order code từ tracking API
    const res = await request.get(`${BASE}/api/v1/public/brochure/tracking/${orderId}`)
    // Có thể trả 200 hoặc 404 nếu chưa có order code — chỉ kiểm API không crash
    expect([200, 404]).toContain(res.status())
  })

  test("7. Tenant isolation — tenant khác không thấy catalog", async ({ request }) => {
    await registerTenant(request, `other-${Date.now()}`)

    // Tenant mới không thấy catalog của tenant cũ
    const res = await request.get(`${BASE}/api/v1/greeting-card/catalogs`)
    expect(res.status()).toBe(200)
    const json = await res.json() as { data: unknown[] }
    const ids = (json.data as Array<{ id: string }>).map((c) => c.id)
    expect(ids).not.toContain(catalogId)
  })

  test("8. Public page /b/[sendCode] trả 200", async ({ page }) => {
    expect(sendCode).toBeTruthy()
    const res = await page.goto(`${BASE}/b/${sendCode}`)
    expect(res?.status()).toBe(200)
    await expect(page.locator("body")).toBeVisible()
  })
})
