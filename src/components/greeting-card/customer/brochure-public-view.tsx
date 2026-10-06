"use client"

import React, { useState } from "react"
import { readSavedState, useSavedState } from "./use-saved-state"
import { useRememberedStep } from "./use-remembered-step"
import { resumePublicStep, type PublicStep } from "@/modules/greeting-card/domain/customer-step"
import { GreetingTemplateRenderer } from "./templates/greeting-template-renderer"
import type { OptionalDisplayField } from "@/modules/greeting-card/domain/display-fields"
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
import { useCatalogTracking } from "./use-catalog-tracking"
import { rememberCatalogOrder, useResumeCatalogOrder } from "./use-remembered-order"

interface Props {
  catalog: { id: string; code: string; name: string; description: string | null; filters?: Record<string, unknown> | null }
  products: GreetingCatalogProduct[]
  shipping: ShippingConfig
}


const SELECTED_KEY = "public-selected"

export function BrochurePublicView({ catalog, products, shipping }: Props) {
  const [step, setStep] = useState<PublicStep>("SWIPING")
  // Mẫu đang chọn + bước đang đứng nhớ trên máy: rời trang lúc xem mẫu đã chọn / điền form thì quay lại đúng chỗ
  const [selectedId, setSelectedId] = useSavedState<string | null>(SELECTED_KEY, null)
  const selected = products.find((p) => p.id === selectedId) ?? null
  const setSelected = (p: GreetingCatalogProduct | null) => setSelectedId(p?.id ?? null)
  const [orderResult, setOrderResult] = useState<{
    sendCode: string
    orderId: string
    orderCode: string
    totalVnd: number
    vietQr: BrochurePaymentInstructions | null
  } | null>(null)
  const { track, orderMeta } = useCatalogTracking(catalog.id)
  // Máy này đã đặt đơn từ bộ sưu tập này → về trang đơn (QR / chờ xác nhận), không quay lại xem mẫu
  const resuming = useResumeCatalogOrder(catalog.id)
  useRememberedStep("public-step", step, setStep, (saved) => resumePublicStep(saved, readSavedState<string>(SELECTED_KEY), products))

  function handleSelectFromDeck(product: GreetingCatalogProduct) {
    track("DETAIL")
    setSelected(product)
    setStep("PREVIEW")
  }

  async function handleSubmitOrder(input: CustomerOrderSubmitInput) {
    if (!selected) return

    const res = await fetch(`/api/v1/public/greeting-catalog/${catalog.id}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, productId: selected.id, tracking: orderMeta() }),
    })

    if (!res.ok) {
      throw new Error(await readApiError(res, "Không thể gửi đơn đặt hoa"))
    }

    const data = await res.json()
    setOrderResult(data)
    setStep("PAYMENT")
    // Đổi địa chỉ sang link riêng của đơn (không tải lại trang): khách tải lại hoặc
    // mở lại vẫn thấy QR và tiến độ, thay vì quay về màn lướt mẫu và mất mã đơn.
    if (data?.sendCode) {
      rememberCatalogOrder(catalog.id, data.sendCode)
      window.history.replaceState(null, "", `/b/${encodeURIComponent(data.sendCode)}`)
    }
  }

  // Giá hiển thị trên form chỉ để khách xem — server tự tính lại giá khi tạo đơn.
  const activeSnapshot: ProductSnapshot | null =
    selected
      ? {
          id: selected.id,
          code: selected.code,
          name: selected.name,
          price: selected.price ?? 0,
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
        <BrochureTrackingView orderCode={orderResult.orderCode} sendCode={orderResult.sendCode} />
      </div>
    )
  }

  // 3. PREVIEW SELECTED CARD WITH "ĐẶT NGAY" BUTTON
  if (step === "PREVIEW" && selected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
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
                  Mẫu này chưa niêm yết giá — bạn cứ đặt, cửa hàng sẽ liên hệ báo giá trước khi thu tiền.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                track("FORM_OPEN")
                setStep("ORDER_FORM")
              }}
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

  if (resuming) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6 text-center text-body text-text-muted" aria-busy="true">
        Đang mở đơn hàng của bạn…
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
