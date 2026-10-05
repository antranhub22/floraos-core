"use client"

import React, { useState } from "react"
import { GreetingTemplateRenderer } from "./templates/greeting-template-renderer"
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
      const paid = initialData.order.paidVnd >= initialData.order.totalVnd
      return paid || session.status === "COMPLETED" ? "TRACKING" : "PAYMENT"
    }
    if (session.status === "SELECTED" && session.productSnapshot) return "ORDER_FORM"
    return "SWIPING"
  })

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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto mb-6 flex flex-col items-center">
        {/* Brand header — tên tiệm thật, không phải nhãn mẫu */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-body font-extrabold tracking-wide uppercase">{shop.name}</span>
        </div>

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
          <BrochureTrackingView orderCode={orderResult.orderCode} />
        )}
      </div>

      <footer className="text-center text-caption text-text-muted mt-8">
        Hệ thống Thẻ Chào & Đặt Hoa Trực Tuyến · Vận hành bởi FloraOS
      </footer>
    </div>
  )
}
