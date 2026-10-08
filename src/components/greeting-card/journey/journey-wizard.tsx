"use client"

import { useCallback, useState } from "react"
import { BrochurePreviewModal } from "@/components/greeting-card/customer/brochure-preview-modal"
import { CatalogFormDialog } from "./catalog-form-dialog"
import { JourneyStepper, type JourneyStep } from "./journey-stepper"
import { ShareSummaryPanel } from "./share-summary-panel"
import { StepCatalog } from "./step-catalog"
import { StepCustomer } from "./step-customer"
import { StepResult } from "./step-result"
import { TemplateSection, catalogTemplateId, templateName } from "./template-section"
import { useCopyLink } from "./use-copy-link"
import { useSession } from "@/lib/session"
import { createShareUrl, markPersonalLinkCopied } from "@/components/greeting-card/share/tracked-copy"
import { catalogPublicPath, normalizeLinkCode, useJourneyCatalogs, type CatalogOption } from "./use-journey-catalogs"

interface JourneyWizardProps {
  onFinish?: () => void
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`
}

export function JourneyWizard({ onFinish }: JourneyWizardProps) {
  // Sửa mẫu/giao diện bộ sưu tập dùng chung: người được sửa sản phẩm (L3 — Điều hành, Điều phối); Sale chỉ chọn
  const canEditCatalog = useSession().can("L3")
  const data = useJourneyCatalogs()
  const { catalogs, setCatalogs, orgSlug } = data
  const { copy, copiedKey, copyError, copyFallback } = useCopyLink()

  const [step, setStep] = useState<JourneyStep>(1)
  const [pickedId, setPickedId] = useState("")
  const [dialog, setDialog] = useState<"create" | "clone" | null>(null)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null)

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [sent, setSent] = useState<{ sendCode: string; shareUrl: string } | null>(null)

  // Mặc định chọn bộ sưu tập đầu tiên; số mẫu hoa lấy từ danh sách (được cập nhật khi thêm/xóa mẫu)
  const selectedId = pickedId || catalogs[0]?.id || ""
  const selected = catalogs.find((c) => c.id === selectedId)
  const itemCount = selected?.itemCount ?? 0
  const publicPath = selected ? catalogPublicPath(orgSlug, selected) : ""
  const publicUrl = publicPath ? absoluteUrl(publicPath) : ""

  const handleItemCountChange = useCallback(
    (count: number) => {
      setCatalogs((list) => list.map((c) => (c.id === selectedId ? { ...c, itemCount: count } : c)))
    },
    [selectedId, setCatalogs],
  )

  function selectCatalog(cat: CatalogOption) {
    setPickedId(cat.id)
  }

  async function handleDialogSubmit(input: { name: string; code: string }) {
    if (dialog === "clone" && selectedId) {
      const result = await data.cloneCatalog(selectedId, input)
      setPickedId(result.id)
      return
    }
    const id = await data.createCatalog(input)
    setPickedId(id)
  }

  async function handleCreateLink() {
    if (!selectedId) return
    const result = await data.createSendLink({
      catalogId: selectedId,
      customerName,
      customerPhone,
    })
    setSent({ sendCode: result.sendCode, shareUrl: absoluteUrl(result.shareUrl) })
    setStep(3)
  }

  function resetForAnother() {
    setCustomerName("")
    setCustomerPhone("")
    setSent(null)
    setStep(2)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface px-3 py-1 sm:px-4">
        <JourneyStepper step={step} onStepClick={setStep} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          {step === 1 && (
            <StepCatalog
              catalogs={catalogs}
              orgSlug={orgSlug}
              loading={data.loading}
              loadError={data.loadError}
              selectedId={selectedId}
              itemCount={itemCount}
              onRetry={() => void data.reload()}
              onSelect={selectCatalog}
              onCreate={() => setDialog("create")}
              onItemCountChange={handleItemCountChange}
              onNext={() => setStep(2)}
              readOnly={!canEditCatalog}
              templateSlot={selected && canEditCatalog && <TemplateSection catalog={selected} onSave={data.saveTemplate} />}
            />
          )}
          {step === 2 && selected && (
            <StepCustomer
              catalogName={selected.name}
              customerName={customerName}
              customerPhone={customerPhone}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
              onBack={() => setStep(1)}
              onSubmit={handleCreateLink}
            />
          )}
          {step === 3 && sent && (
            <StepResult
              shareUrl={sent.shareUrl}
              sendCode={sent.sendCode}
              customerName={customerName}
              copied={copiedKey === "send"}
              copyError={copyError}
              onCopy={() => {
                void copy("send", sent.shareUrl)
                markPersonalLinkCopied(sent.sendCode)
              }}
              onPreview={() => setPreview({ url: sent.shareUrl, title: `Xem trước thẻ gửi ${customerName || "khách"}` })}
              onCreateAnother={resetForAnother}
              onFinish={onFinish}
            />
          )}
        </div>

        <ShareSummaryPanel
          catalog={selected}
          templateLabel={selected ? templateName(catalogTemplateId(selected)) : null}
          itemCount={itemCount}
          copied={copiedKey === "public"}
          copyError={copyError}
          copyFallback={copyFallback}
          onCopy={() => selected && void copy("public", () => createShareUrl(selected.id))}
          onPreview={() => selected && setPreview({ url: publicUrl, title: `Xem trước: ${selected.name}` })}
          onClone={() => setDialog("clone")}
        />
      </div>

      <CatalogFormDialog
        key={dialog ?? "closed"}
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        mode={dialog ?? "create"}
        orgSlug={orgSlug}
        cloneItemCount={itemCount}
        initialName={dialog === "clone" && selected ? `${selected.name} – kênh 2` : ""}
        initialCode={dialog === "clone" && selected ? normalizeLinkCode(`${selected.code}-kenh-2`) : ""}
        onSubmit={handleDialogSubmit}
      />

      {preview && <BrochurePreviewModal url={preview.url} title={preview.title} onClose={() => setPreview(null)} />}
    </div>
  )
}
