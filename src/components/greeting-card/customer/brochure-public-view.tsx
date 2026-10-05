"use client"

import React, { useState } from "react"
import { GreetingTemplateRenderer } from "./templates/greeting-template-renderer"
import type { OptionalDisplayField } from "@/modules/greeting-card/domain/display-fields"
import { BrochureOrderForm } from "./brochure-order-form"
import { BrochurePaymentView } from "./brochure-payment-view"
import { BrochureTrackingView } from "./brochure-tracking-view"
import type {
  GreetingCatalogProduct,
  CustomerOrderSubmitInput,
  ProductSnapshot,
} from "@/modules/greeting-card/domain/greeting-card-types"
import { ShoppingBag } from "lucide-react"
import { ProductImage } from "./templates/aux/aux-kit"

interface Props {
  catalog: { id: string; code: string; name: string; description: string | null; filters?: Record<string, unknown> | null }
  products: GreetingCatalogProduct[]
}

type PublicStep = "SWIPING" | "PREVIEW" | "ORDER_FORM" | "PAYMENT" | "TRACKING"

export function BrochurePublicView({ catalog, products }: Props) {
  const [step, setStep] = useState<PublicStep>("SWIPING")
  const [selected, setSelected] = useState<GreetingCatalogProduct | null>(null)
  const [orderResult, setOrderResult] = useState<{
    orderId: string
    orderCode: string
    totalVnd: number
    vietQr: {
      qrUrl: string
      bankName: string
      accountNo: string
      accountName: string
      amount: number
      transferMemo: string
    }
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
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || "Không thể gửi đơn đặt hoa")
    }

    const data = await res.json()
    setOrderResult(data)
    setStep("PAYMENT")
  }

  const activeSnapshot: ProductSnapshot = selected
    ? {
        id: selected.id,
        code: selected.code,
        name: selected.name,
        price: selected.price,
        imageUrl: selected.imageUrl,
        description: selected.description,
        selectedAt: new Date().toISOString(),
      }
    : {
        id: "prod",
        code: "HOA",
        name: "Mẫu hoa tươi đã chọn",
        price: 500000,
        imageUrl: null,
        selectedAt: new Date().toISOString(),
      }

  // 1. ORDER FORM STEP
  if (step === "ORDER_FORM" && selected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-start py-6 px-4 sm:px-6">
        <BrochureOrderForm
          productSnapshot={activeSnapshot}
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
          onReportPaid={async () => {}}
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
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="w-full max-w-md bg-surface rounded-3xl shadow-xl overflow-hidden border border-border">
          <div className="aspect-square w-full">
            <ProductImage product={selected} />
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-title font-extrabold text-foreground">{selected.name}</h2>
              {selected.description && (
                <p className="text-body-sm text-text-muted mt-1">{selected.description}</p>
              )}
              <p className="text-display font-extrabold text-primary mt-3">
                {selected.price > 0 ? `${selected.price.toLocaleString("vi-VN")}đ` : "Liên hệ"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep("ORDER_FORM")}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary text-white font-bold text-body shadow-md hover:bg-primary-dark transition-colors cursor-pointer"
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
      displayFields={(catalog.filters as Record<string, unknown> | null)?.displayFields as OptionalDisplayField[] | undefined}
      catalogName={catalog.name}
      products={products}
      selectedProductId={selected?.id ?? null}
      onSelectProduct={handleSelectFromDeck}
    />
  )
}
