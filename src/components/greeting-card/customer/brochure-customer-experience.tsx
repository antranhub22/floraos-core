"use client"

import { ReorderButton } from "./reorder-button"
import { ShopContactBar } from "./shop-contact-bar"
import React, { useEffect, useState } from "react"
import { GreetingTemplateRenderer } from "./templates/greeting-template-renderer"
import type { OptionalDisplayField } from "@/modules/greeting-card/domain/display-fields"
import { BrochureOrderForm } from "./brochure-order-form"
import { BrochurePaymentView } from "./brochure-payment-view"
import { BrochureTrackingView } from "./brochure-tracking-view"
import { readApiError } from "@/components/greeting-card/api-error"
import type {
  BrochurePaymentInstructions,
  GreetingCatalogProduct,
  ProductSnapshot,
  CustomerOrderSubmitInput,
} from "@/modules/greeting-card/domain/greeting-card-types"
import type { CustomerBrochureView } from "@/modules/greeting-card/use-cases/get-greeting-catalog"

interface BrochureCustomerExperienceProps {
  initialData: CustomerBrochureView
}

type CustomerStep = "SWIPING" | "ORDER_FORM" | "PAYMENT" | "TRACKING"

interface OrderState {
  orderCode: string
  totalVnd: number
  vietQr: BrochurePaymentInstructions | null
}

export function BrochureCustomerExperience({ initialData }: BrochureCustomerExperienceProps) {
  const { session, catalog, products, shop } = initialData

  // Determine initial step based on session status
  const [step, setStep] = useState<CustomerStep>(() => {
    if (initialData.order) {
      // Theo số tiền thật của đơn: còn phải thu (chờ báo giá, mới cọc) → bước thanh toán để thấy QR
      const paid = initialData.order.totalVnd > 0 && initialData.order.paidVnd >= initialData.order.totalVnd
      return paid || initialData.order.status === "CANCELLED" ? "TRACKING" : "PAYMENT"
    }
    if (session.status === "SELECTED" && session.productSnapshot) return "ORDER_FORM"
    return "SWIPING"
  })

  // Báo "khách đã mở" từ trình duyệt thật (máy quét xem trước link không chạy JavaScript).
  // Ghi một lần, không phải tải dữ liệu; lỗi mạng bỏ qua — không ảnh hưởng khách.
  useEffect(() => {
    if (session.status !== "CREATED") return
    void fetch(`/api/v1/public/brochure/${encodeURIComponent(session.sendCode)}/open`, { method: "POST" }).catch(() => undefined)
  }, [session.status, session.sendCode])

  // Ảnh chụp mẫu do SERVER dựng (giá thật từ Product Master) — client không tự ghép giá.
  const [snapshot, setSnapshot] = useState<ProductSnapshot | null>(session.productSnapshot)
  const [selectError, setSelectError] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  // Hướng dẫn chuyển khoản luôn lấy từ server theo cấu hình của tiệm.
  const [orderResult, setOrderResult] = useState<OrderState | null>(() =>
    initialData.order
      ? { orderCode: initialData.order.code, totalVnd: initialData.order.totalVnd, vietQr: initialData.payment }
      : null
  )

  async function handleSelectProduct(product: GreetingCatalogProduct) {
    if (selecting) return
    setSelectError(null)
    setSelecting(true)
    try {
      const res = await fetch(`/api/v1/public/brochure/${session.sendCode}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      if (!res.ok) {
        setSelectError(await readApiError(res, "Không chọn được mẫu này, vui lòng thử lại"))
        return
      }
      const data = (await res.json()) as { snapshot: ProductSnapshot }
      setSnapshot(data.snapshot)
      setStep("ORDER_FORM")
    } catch {
      setSelectError("Mất kết nối mạng, vui lòng thử lại")
    } finally {
      setSelecting(false)
    }
  }

  async function handleSubmitOrder(input: CustomerOrderSubmitInput) {
    const res = await fetch(`/api/v1/public/brochure/${session.sendCode}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      throw new Error(await readApiError(res, "Không thể gửi đơn đặt hoa"))
    }

    const data = (await res.json()) as OrderState
    setOrderResult({ orderCode: data.orderCode, totalVnd: data.totalVnd, vietQr: data.vietQr })
    setStep("PAYMENT")
  }

  async function handleReportPaid() {
    const res = await fetch(`/api/v1/public/brochure/${session.sendCode}/payment-notify`, {
      method: "POST",
    })
    if (!res.ok) throw new Error(await readApiError(res, "Không gửi được thông báo, vui lòng thử lại"))
  }

  return (
    <>
    <ShopContactBar shop={shop} />
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto mb-6 flex flex-col items-center">

        {step === "SWIPING" && (
          <>
            {selectError && (
              <div role="alert" className="w-full mb-3 p-3 rounded-xl bg-danger-bg text-danger text-body-sm font-medium">
                {selectError}
                {shop.phone && <span className="block mt-1">Liên hệ cửa hàng: {shop.phone}</span>}
              </div>
            )}
            <GreetingTemplateRenderer
              showTemplateSwitcher={false}
              templateId={(catalog.filters as Record<string, unknown> | null | undefined)?.templateId as string | undefined}
              displayFields={(catalog.filters as Record<string, unknown> | null | undefined)?.displayFields as OptionalDisplayField[] | undefined}
              products={products}
              catalogName={catalog.name}
              selectedProductId={snapshot?.id || session.selectedProductId || null}
              onSelectProduct={handleSelectProduct}
            />
          </>
        )}

        {step === "ORDER_FORM" && snapshot && (
          <BrochureOrderForm
            productSnapshot={snapshot}
            variants={products.find((p) => p.id === snapshot.id)?.variants ?? []}
            shipping={initialData.shipping}
            quoteUrl={`/api/v1/public/brochure/${session.sendCode}/quote`}
            onBack={() => setStep("SWIPING")}
            onSubmit={handleSubmitOrder}
          />
        )}

        {step === "PAYMENT" && orderResult && (
          <BrochurePaymentView
            orderCode={orderResult.orderCode}
            totalVnd={orderResult.totalVnd}
            vietQr={orderResult.vietQr}
            shopPhone={shop.phone}
            onReportPaid={handleReportPaid}
            onGoToTracking={() => setStep("TRACKING")}
          />
        )}

        {step === "TRACKING" && orderResult && (
          <BrochureTrackingView orderCode={orderResult.orderCode} sendCode={session.sendCode} />
        )}

        {(step === "PAYMENT" || step === "TRACKING") && orderResult && (
          <ReorderButton sendCode={session.sendCode} />
        )}
      </div>

      <footer className="text-center text-caption text-text-muted mt-8">
        Hệ thống Thẻ Chào & Đặt Hoa Trực Tuyến · Vận hành bởi FloraOS
      </footer>
    </div>
    </>
  )
}
