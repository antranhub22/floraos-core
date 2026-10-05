"use client"

import React, { useState } from "react"
import { GreetingTemplateRenderer } from "./templates/greeting-template-renderer"
import { BrochureOrderForm } from "./brochure-order-form"
import { BrochurePaymentView } from "./brochure-payment-view"
import { BrochureTrackingView } from "./brochure-tracking-view"
import type {
  GreetingCatalogProduct,
  GreetingSessionRecord,
  ProductSnapshot,
  CustomerOrderSubmitInput,
} from "@/modules/greeting-card/domain/greeting-card-types"

interface BrochureCustomerExperienceProps {
  initialData: {
    status: "ACTIVE"
    session: GreetingSessionRecord
    catalog: {
      id: string
      code: string
      name: string
      description: string | null
      filters?: Record<string, unknown> | null
    }
    products: GreetingCatalogProduct[]
    order: {
      id: string
      code: string
      status: string
      totalVnd: number
      paidVnd: number
    } | null
  }
}

type CustomerStep = "SWIPING" | "ORDER_FORM" | "PAYMENT" | "TRACKING"

export function BrochureCustomerExperience({ initialData }: BrochureCustomerExperienceProps) {
  const { session, catalog, products } = initialData

  // Determine initial step based on session status
  const [step, setStep] = useState<CustomerStep>(() => {
    if (initialData.order) {
      if (initialData.order.paidVnd >= initialData.order.totalVnd || session.status === "COMPLETED") {
        return "TRACKING"
      }
      return "PAYMENT"
    }
    if (session.status === "SELECTED" && session.productSnapshot) {
      return "ORDER_FORM"
    }
    return "SWIPING"
  })

  const [selectedProduct, setSelectedProduct] = useState<GreetingCatalogProduct | null>(() => {
    if (session.selectedProductId) {
      return products.find((p) => p.id === session.selectedProductId) || null
    }
    return null
  })

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
  } | null>(() => {
    if (initialData.order) {
      return {
        orderId: initialData.order.id,
        orderCode: initialData.order.code,
        totalVnd: initialData.order.totalVnd,
        vietQr: {
          qrUrl: `https://img.vietqr.io/image/MB-0988776655-compact2.png?amount=${initialData.order.totalVnd}&addInfo=${initialData.order.code}&accountName=TIEM%20HOA%20FLORAOS`,
          bankName: "Ngân hàng Quân Đội (MB Bank)",
          accountNo: "0988776655",
          accountName: "TIEM HOA FLORAOS",
          amount: initialData.order.totalVnd,
          transferMemo: initialData.order.code,
        },
      }
    }
    return null
  })

  async function handleSelectProduct(product: GreetingCatalogProduct) {
    setSelectedProduct(product)
    try {
      await fetch(`/api/v1/public/brochure/${session.sendCode}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, product }),
      })
    } catch {}
    setStep("ORDER_FORM")
  }

  async function handleSubmitOrder(input: CustomerOrderSubmitInput) {
    const res = await fetch(`/api/v1/public/brochure/${session.sendCode}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || "Không thể gửi đơn đặt hoa")
    }

    const data = await res.json()
    setOrderResult(data)
    setStep("PAYMENT")
  }

  async function handleReportPaid() {
    await fetch(`/api/v1/public/brochure/${session.sendCode}/payment-notify`, {
      method: "POST",
    })
  }

  const activeSnapshot: ProductSnapshot = selectedProduct
    ? {
        id: selectedProduct.id,
        code: selectedProduct.code,
        name: selectedProduct.name,
        price: selectedProduct.price,
        imageUrl: selectedProduct.imageUrl,
        description: selectedProduct.description,
        selectedAt: new Date().toISOString(),
      }
    : session.productSnapshot || {
        id: "prod",
        code: "HOA",
        name: "Mẫu hoa tươi đã chọn",
        price: 500000,
        imageUrl: null,
        selectedAt: new Date().toISOString(),
      }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto mb-6 flex flex-col items-center">
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-body font-extrabold tracking-wide uppercase">
            FLORAOS STORE
          </span>
        </div>

        {step === "SWIPING" && (
          <GreetingTemplateRenderer
            showTemplateSwitcher={false}
            templateId={(catalog.filters as Record<string, unknown> | null)?.templateId as string | undefined}
            products={products}
            catalogName={catalog.name}
            selectedProductId={selectedProduct?.id || session.selectedProductId || null}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {step === "ORDER_FORM" && (
          <BrochureOrderForm
            productSnapshot={activeSnapshot}
            onBack={() => setStep("SWIPING")}
            onSubmit={handleSubmitOrder}
          />
        )}

        {step === "PAYMENT" && orderResult && (
          <BrochurePaymentView
            orderCode={orderResult.orderCode}
            totalVnd={orderResult.totalVnd}
            vietQr={orderResult.vietQr}
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
