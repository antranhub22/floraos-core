"use client"

import React, { useState } from "react"
import { GreetingTemplateRenderer } from "./templates/greeting-template-renderer"
import { BrochureOrderForm } from "./brochure-order-form"
import { BrochurePaymentView } from "./brochure-payment-view"
import { BrochureTrackingView } from "./brochure-tracking-view"
import { formatPriceVnd, readApiError } from "@/components/greeting-card/api-error"
import type {
  BrochurePaymentInstructions,
  GreetingCatalogProduct,
  CustomerOrderSubmitInput,
  ProductSnapshot,
} from "@/modules/greeting-card/domain/greeting-card-types"
import { ShoppingBag } from "lucide-react"
import type { ShippingConfig } from "@/modules/greeting-card/domain/brochure-pricing"
import { FlowerImage } from "@/components/greeting-card/flower-image"

interface Props {
  catalog: { id: string; code: string; name: string; description: string | null; filters?: Record<string, unknown> | null }
  products: GreetingCatalogProduct[]
  shipping: ShippingConfig
}

type PublicStep = "SWIPING" | "PREVIEW" | "ORDER_FORM" | "PAYMENT" | "TRACKING"

export function BrochurePublicView({ catalog, products, shipping }: Props) {
  const [step, setStep] = useState<PublicStep>("SWIPING")
  const [selected, setSelected] = useState<GreetingCatalogProduct | null>(null)
  const [orderResult, setOrderResult] = useState<{
    sendCode: string
    orderId: string
    orderCode: string
    totalVnd: number
    vietQr: BrochurePaymentInstructions | null
  } | null>(null)

  function handleSelectFromDeck(product: GreetingCatalogProduct) {
    setSelected(product)
    setStep("PREVIEW")
  }

  async function handleSubmitOrder(input: CustomerOrderSubmitInput) {
    if (!selected) return

    const res = await fetch(`/api/v1/public/greeting-catalog/${catalog.id}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, productId: selected.id }),
    })

    if (!res.ok) {
      throw new Error(await readApiError(res, "Không thể gửi đơn đặt hoa"))
    }

    const data = await res.json()
    setOrderResult(data)
    setStep("PAYMENT")
  }

  // Giá hiển thị trên form chỉ để khách xem — server tự tính lại giá khi tạo đơn.
  const activeSnapshot: ProductSnapshot | null =
    selected && selected.price !== null
      ? {
          id: selected.id,
          code: selected.code,
          name: selected.name,
          price: selected.price,
          imageUrl: selected.imageUrl,
          description: selected.description,
          selectedAt: new Date().toISOString(),
        }
      : null

  // 1. ORDER FORM STEP
  if (step === "ORDER_FORM" && activeSnapshot) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-start py-6 px-4 sm:px-6">
        <BrochureOrderForm
          productSnapshot={activeSnapshot}
          variants={selected?.variants ?? []}
          shipping={shipping}
          quoteUrl={`/api/v1/public/greeting-catalog/${catalog.id}/quote`}
          quoteExtraBody={{ productId: activeSnapshot.id }}
          onBack={() => setStep("PREVIEW")}
          onSubmit={handleSubmitOrder}
        />
      </div>
    )
  }

  // 2. PAYMENT STEP WITH VIETQR
  if (step === "PAYMENT" && orderResult) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-start py-6 px-4 sm:px-6">
        <BrochurePaymentView
          orderCode={orderResult.orderCode}
          totalVnd={orderResult.totalVnd}
          vietQr={orderResult.vietQr}
          onReportPaid={async () => {
            const res = await fetch(`/api/v1/public/brochure/${orderResult.sendCode}/payment-notify`, {
              method: "POST",
            })
            if (!res.ok) throw new Error(await readApiError(res, "Không gửi được thông báo, vui lòng thử lại"))
          }}
          onGoToTracking={() => setStep("TRACKING")}
        />
      </div>
    )
  }

  // 2b. ORDER TRACKING STEP
  if (step === "TRACKING" && orderResult) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-start py-6 px-4 sm:px-6">
        <div className="w-full max-w-lg mx-auto mb-4">
          <button
            type="button"
            onClick={() => setStep("SWIPING")}
            className="text-body-sm text-text-muted hover:text-foreground font-medium underline inline-flex items-center gap-1 cursor-pointer"
          >
            ← Quay lại Bộ sưu tập hoa
          </button>
        </div>
        <BrochureTrackingView orderCode={orderResult.orderCode} />
      </div>
    )
  }

  // 3. PREVIEW SELECTED CARD WITH "ĐẶT NGAY" BUTTON
  if (step === "PREVIEW" && selected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-surface rounded-3xl shadow-xl overflow-hidden border border-border">
          <FlowerImage src={selected.imageUrl} alt={selected.name} sizes="(max-width: 448px) 100vw, 448px" priority className="w-full aspect-square" />
          <div className="p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-title font-extrabold text-foreground">{selected.name}</h2>
              {selected.description && (
                <p className="text-body-sm text-text-muted mt-1">{selected.description}</p>
              )}
              <p className="text-display font-extrabold text-primary mt-3">
                {formatPriceVnd(selected.price)}
              </p>
              {selected.price === null && (
                <p className="text-body-sm text-text-muted mt-1">
                  Mẫu này chưa có giá bán online — vui lòng liên hệ cửa hàng để được báo giá.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={selected.price === null}
              onClick={() => setStep("ORDER_FORM")}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary text-white font-bold text-body shadow-md hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={18} />
              <span>Đặt ngay</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelected(null)
                setStep("SWIPING")
              }}
              className="text-body-sm text-text-muted hover:text-foreground font-medium underline text-center cursor-pointer"
            >
              ← Xem mẫu khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 4. MAIN GREETING TEMPLATE DECK
  return (
    <GreetingTemplateRenderer
      showTemplateSwitcher={false}
      templateId={(catalog.filters as Record<string, unknown> | null)?.templateId as string | undefined}
      catalogName={catalog.name}
      products={products}
      selectedProductId={selected?.id ?? null}
      onSelectProduct={handleSelectFromDeck}
    />
  )
}
