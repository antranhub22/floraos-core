"use client"

import { useState, useMemo } from "react"
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Download,
  RotateCcw,
  Check,
} from "lucide-react"
import { TabActionHeader, type TabItem, type TabAction, type TabOverflowAction } from "@/components/ui/tab-header"
import { CreativeGuidanceCard } from "@/components/templates/creative-studio/creative-guidance-card"
import { OptimizeWorkspace } from "@/components/creative-studio/optimize-workspace"
import { VariantWorkspace } from "@/components/creative-studio/variant-workspace"
import { useCreativeStudioData } from "@/components/creative-studio/use-creative-studio-data"
import { Button } from "@/components/ui/button"

// ============================================================
// Phase → Tab mapping
// ============================================================

const M04B_PHASES = new Set(["config-b", "running-b", "result-b"])

// ============================================================
// PAGE SHELL
// ============================================================

export default function CreativeStudioPage() {
  const data = useCreativeStudioData()

  const {
    phase,
    setPhase,
    router,
    masterApproved,
    optimizationData,
    optimizationId,
    approvalState,
    savedA,
    setSavedA,
    judgmentA,
    setJudgmentA,
    judgmentB,
    selectedRatio,
    canApprove,
    canDownload,
    canRunVariant,
    canApproveVariantCap,
    selectedVariantAssetId,
    generatedVariants,
    errorMsg,
    setErrorMsg,
    handleApproveAApi,
    handleDownloadRatio,
    goRunningB,
    handleApproveB,
    handleDownloadVariant,
    loadAssets,
  } = data

  // --- Active tab derived from phase ---
  const activeTabId = M04B_PHASES.has(phase) ? "area-b" : "area-a"

  // --- Tabs ---
  const tabs: TabItem[] = useMemo(() => [
    {
      id: "area-a",
      label: "Khu vực A — Tối ưu ảnh gốc (M04a)",
      ...(masterApproved ? { badge: "Đã duyệt", badgeTone: "success" as const } : {}),
    },
    {
      id: "area-b",
      label: "Khu vực B — Biến thể marketing (M04b)",
      badge: "M04b",
      badgeTone: "neutral",
    },
  ], [masterApproved])

  // --- Primary Actions (top-right) ---
  const primaryActions: TabAction[] = useMemo(() => {
    const actions: TabAction[] = []

    if (phase === "result-a") {
      if (approvalState !== "approved" && judgmentA !== "blocked" && canApprove) {
        actions.push({
          id: "approve-master",
          label: "Duyệt Master Image",
          icon: ShieldCheck,
          variant: "success",
          onClick: handleApproveAApi,
        })
      }
      if (canDownload && (masterApproved || approvalState === "approved")) {
        actions.push({
          id: "download-master",
          label: `Tải Master (${selectedRatio})`,
          icon: Download,
          variant: "primary",
          onClick: () => handleDownloadRatio(selectedRatio),
        })
      }
      actions.push({
        id: "save-draft",
        label: savedA ? "Đã lưu nháp" : "Lưu nháp",
        icon: Check,
        variant: "outline",
        onClick: () => {
          setSavedA(true)
          setTimeout(() => setSavedA(false), 2000)
        },
      })
    } else if (phase === "config-b") {
      actions.push({
        id: "generate-variants-btn",
        label: "Tạo biến thể marketing",
        icon: Sparkles,
        variant: "primary",
        onClick: goRunningB,
      })
    } else if (phase === "result-b") {
      const dangChon = generatedVariants.find((v) => v.asset_id === selectedVariantAssetId)
      const daDuyet = dangChon?.approval_state === "approved"
      if (canApproveVariantCap && dangChon && !daDuyet && judgmentB !== "blocked") {
        actions.push({
          id: "approve-variant",
          label: "Duyệt biến thể đã chọn",
          icon: ShieldCheck,
          variant: "success",
          onClick: handleApproveB,
        })
      }
      if (dangChon) {
        actions.push({
          id: "download-variant",
          label: "Tải ảnh biến thể",
          icon: Download,
          variant: daDuyet ? "primary" : "outline",
          onClick: () => handleDownloadVariant(dangChon.asset_id),
        })
      }
    }

    return actions
  }, [
    phase, approvalState, judgmentA, judgmentB, canApprove, canDownload,
    masterApproved, selectedRatio, savedA, canApproveVariantCap,
    selectedVariantAssetId, generatedVariants, handleApproveAApi,
    handleDownloadRatio, setSavedA, goRunningB, handleApproveB,
    handleDownloadVariant,
  ])

  // --- Overflow Actions (⋯ menu) ---
  const overflowActions: TabOverflowAction[] = useMemo(() => {
    if (activeTabId === "area-a") {
      return [
        { id: "dl-1-1", label: "Tải tỷ lệ 1:1 (Vuông Instagram)", icon: Download, disabled: !canDownload || !optimizationId || judgmentA === "blocked", onClick: () => handleDownloadRatio("1:1") },
        { id: "dl-4-5", label: "Tải tỷ lệ 4:5 (Dọc Feed)", icon: Download, disabled: !canDownload || !optimizationId || judgmentA === "blocked", onClick: () => handleDownloadRatio("4:5") },
        { id: "dl-9-16", label: "Tải tỷ lệ 9:16 (Story/TikTok)", icon: Download, disabled: !canDownload || !optimizationId || judgmentA === "blocked", onClick: () => handleDownloadRatio("9:16") },
        { id: "dl-16-9", label: "Tải tỷ lệ 16:9 (Ngang Web)", icon: Download, disabled: !canDownload || !optimizationId || judgmentA === "blocked", onClick: () => handleDownloadRatio("16:9") },
        { id: "re-optimize", label: "Tối ưu lại với ảnh khác", icon: RotateCcw, dividerAbove: true, onClick: () => { setJudgmentA("safe"); setPhase("confirm-a"); loadAssets() } },
        { id: "go-home", label: "Quay về Trang chủ", icon: ArrowLeft, dividerAbove: true, onClick: () => router.push("/") },
      ]
    }
    return [
      { id: "switch-preset", label: "Tạo thêm biến thể bối cảnh khác", icon: RotateCcw, onClick: () => setPhase("config-b") },
      { id: "back-to-a", label: "Quay lại Khu vực A (Tối ưu hoa gốc)", icon: ArrowLeft, dividerAbove: true, onClick: () => setPhase("result-a") },
      { id: "go-home-b", label: "Quay về Trang chủ", icon: ArrowLeft, onClick: () => router.push("/") },
    ]
  }, [activeTabId, canDownload, optimizationId, judgmentA, handleDownloadRatio, setJudgmentA, setPhase, loadAssets, router])

  // --- Tab change handler ---
  const handleTabChange = (tabId: string) => {
    if (tabId === "area-b") {
      setPhase("config-b")
    } else if (tabId === "area-a") {
      if (M04B_PHASES.has(phase)) {
        setPhase(optimizationData ? "result-a" : "select")
      }
    }
  }

  // --- Render ---
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Header with Standard Action Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div>
          <div className="text-xs text-text-muted">M04a (Tối ưu ảnh gốc) + M04b (Biến thể Marketing)</div>
          <div className="text-[17px] font-extrabold text-primary">AI Creative Studio</div>
        </div>
        <TabActionHeader
          tabs={tabs}
          activeTab={activeTabId}
          onTabChange={handleTabChange}
          primaryActions={primaryActions}
          overflowActions={overflowActions}
        />
      </div>

      {errorMsg && (
        <div className="mx-4 mt-3 rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)}>Đóng</Button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6 gap-6">
        {/* Standard Feature Guidance Card */}
        <div className="w-full max-w-3xl mx-auto">
          <CreativeGuidanceCard area={activeTabId === "area-b" ? "area-b" : "area-a"} />
        </div>

        {/* Workspace Switcher */}
        {activeTabId === "area-a" && <OptimizeWorkspace data={data} />}
        {activeTabId === "area-b" && <VariantWorkspace data={data} />}
      </div>
    </div>
  )
}
