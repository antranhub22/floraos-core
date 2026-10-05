"use client"

import React, { useState } from "react"
import { BrochurePreviewModal } from "@/components/greeting-card/customer/brochure-preview-modal"
import { useApi } from "@/components/greeting-card/greeting-api"
import { JourneyStepper } from "./journey-stepper"
import { JourneyStepCatalog } from "./journey-step-catalog"
import { JourneyStepCustomer, type CreatedLink } from "./journey-step-customer"
import { JourneyStepResult } from "./journey-step-result"
import type { CatalogOption, WizardStep } from "./journey-types"

interface JourneyWizardProps {
  onFinish?: () => void
  onGoToManager?: () => void
}

type CatalogRow = { id: string; name: string; code: string; _count?: { items: number } }

/** Luồng 3 bước gửi Thẻ chào: chọn bộ sưu tập → gán khách → nhận link. */
export function JourneyWizard({ onFinish, onGoToManager }: JourneyWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null)
  const [chosenId, setChosenId] = useState<string>("")
  // Số mẫu đã gán theo từng bộ sưu tập (picker báo về) — cần > 0 để tiếp tục
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({})
  const [created, setCreated] = useState<CreatedLink | null>(null)

  const list = useApi<{ data: CatalogRow[] }>("/api/v1/greeting-card/catalogs")
  // Slug tổ chức cho URL thân thiện; chưa có → link /g/{id}, không bao giờ đoán slug tiệm khác
  const org = useApi<{ slug?: string }>("/api/v1/organizations/current")
  const orgSlug = org.data?.slug ?? ""

  const catalogs: CatalogOption[] = (list.data?.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    itemCount: c._count?.items ?? 0,
  }))
  const selected = catalogs.find((c) => c.id === chosenId) ?? catalogs[0]
  const itemCount = selected ? itemCounts[selected.id] ?? selected.itemCount : 0

  function select(id: string, count?: number) {
    setChosenId(id)
    if (count !== undefined) setItemCounts((prev) => ({ ...prev, [id]: count }))
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {error && (
        <div role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm font-medium">{error}</div>
      )}
      <JourneyStepper step={step} onGoToManager={onGoToManager} />

      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        {step === 1 && (
          <JourneyStepCatalog
            catalogs={catalogs}
            loading={list.isLoading}
            orgSlug={orgSlug}
            selected={selected}
            itemCount={itemCount}
            onSelect={select}
            onItemCountChange={(count) => selected && setItemCounts((prev) => ({ ...prev, [selected.id]: count }))}
            onCatalogsChanged={() => list.mutate()}
            onPreview={(url, title) => setPreview({ url, title })}
            onNext={() => setStep(2)}
            onError={setError}
          />
        )}
        {step === 2 && selected && (
          <JourneyStepCustomer
            catalogId={selected.id}
            catalogName={selected.name}
            onBack={() => setStep(1)}
            onError={setError}
            onCreated={(link) => {
              setCreated(link)
              setStep(3)
            }}
          />
        )}
        {step === 3 && created && (
          <JourneyStepResult
            link={created}
            onPreview={(url, title) => setPreview({ url, title })}
            onRestart={() => {
              setCreated(null)
              setStep(1)
            }}
            onFinish={onFinish}
          />
        )}
      </div>

      {preview && <BrochurePreviewModal url={preview.url} title={preview.title} onClose={() => setPreview(null)} />}
    </div>
  )
}
