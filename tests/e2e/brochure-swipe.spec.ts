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

  // Đăng ký đặt luôn cookie phiên (đường /auth/register cũ không tồn tại)
  const regRes = await request.post(`${BASE}/api/v1/auth/signup`, {
    data: { email, password: "Test@12345!", organization_name: orgName },
  })
  expect(regRes.status()).toBe(201)
  return { email, orgName }
}

test.describe("Brochure / Thẻ Chào — Luồng chính", () => {
  // Một context dùng chung cho cả chuỗi: fixture `request` mặc định tạo context
  // mới mỗi ca nên mất cookie phiên giữa các bước.
  let request: APIRequestContext
  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext()
  })
  test.afterAll(async () => {
    await request.dispose()
  })

  let catalogId: string
  let productId: string
  let sendCode: string
  let orderId: string
  let orderCode: string
  const deliveryDate = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)

  test("1. Tạo catalog và link gửi khách", async () => {
    await registerTenant(request, Date.now().toString())

    // Tạo sản phẩm có giá (Thẻ chào không bán mẫu chưa có giá)
    const prodRes = await request.post(`${BASE}/api/v1/products`, {
      data: { code: `E2E-${Date.now()}`, name: "Bó hồng E2E", attributes: { price: 650000 } },
    })
    expect(prodRes.status()).toBe(201)
    productId = ((await prodRes.json()) as { id: string }).id

    // Tạo catalog
    const catRes = await request.post(`${BASE}/api/v1/greeting-card/catalogs`, {
      data: { code: `e2e-${Date.now()}`, name: "Catalog E2E Test", type: "STANDARD", productIds: [productId] },
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
    expect(sendCode).toMatch(/^T99-[A-Z0-9]{8}$/)
  })

  test("2. Khách mở link brochure công khai", async () => {
    expect(sendCode).toBeTruthy()

    const res = await request.get(`${BASE}/api/v1/public/brochure/${sendCode}`)
    expect(res.status()).toBe(200)

    const json = await res.json() as {
      session: { sendCode: string }
      catalog: { name: string }
      products: Array<{ id: string; price: number | null }>
    }
    expect(json.session.sendCode).toBe(sendCode)
    expect(json.catalog.name).toBe("Catalog E2E Test")
    expect(json.products[0]?.price).toBe(650000)
  })

  test("2b. Khách chọn mẫu — giá khách gửi lên bị bỏ qua", async () => {
    const res = await request.post(`${BASE}/api/v1/public/brochure/${sendCode}/select`, {
      data: { productId, product: { price: 1000 } },
    })
    expect(res.status()).toBe(200)
    const json = await res.json() as { snapshot: { price: number } }
    expect(json.snapshot.price).toBe(650000)
  })

  test("3. Khách đặt hoa qua brochure", async () => {
    expect(sendCode).toBeTruthy()

    const res = await request.post(`${BASE}/api/v1/public/brochure/${sendCode}/order`, {
      data: {
        customerName: "Khách E2E",
        customerPhone: "0901234599",
        recipientName: "Người nhận E2E",
        recipientPhone: "0912345699",
        deliveryDate,
        deliveryAddress: "123 Đường E2E, Quận 1, TP.HCM",
        cardMessage: "Chúc mừng E2E test!",
      },
    })
    expect(res.status()).toBe(201)

    const json = await res.json() as { orderId: string; orderCode: string; totalVnd: number }
    orderId = json.orderId
    orderCode = json.orderCode
    expect(orderId).toBeTruthy()
    expect(json.totalVnd).toBe(650000)
  })

  test("4. Khách báo đã chuyển khoản", async () => {
    expect(sendCode).toBeTruthy()

    const res = await request.post(`${BASE}/api/v1/public/brochure/${sendCode}/payment-notify`)
    expect(res.status()).toBeLessThan(300)
  })

  test("5. Admin xác nhận thanh toán", async () => {
    expect(orderId).toBeTruthy()

    const res = await request.post(
      `${BASE}/api/v1/greeting-card/orders/${orderId}/confirm-payment`,
      { data: { note: "Đã nhận CK — E2E test" } }
    )
    expect(res.status()).toBeLessThan(300)

    const json = await res.json() as { data: { status: string } }
    expect(json.data.status).toBe("CONFIRMED")
  })

  test("6. Khách xem trang theo dõi đơn hàng", async () => {
    expect(sendCode).toBeTruthy()

    const res = await request.get(`${BASE}/api/v1/public/brochure/tracking/${orderCode}`)
    expect(res.status()).toBe(200)
    const json = await res.json() as { order: { status: string } }
    expect(json.order.status).toBe("CONFIRMED")
  })

  test("7. Tenant isolation — tenant khác không thấy catalog", async () => {
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
