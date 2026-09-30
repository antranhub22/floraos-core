"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, SlidersHorizontal } from "lucide-react"
import { NETWORK_JOURNEYS } from "@/modules/journey/domain/journey-catalog"
import type { JourneyDefinition } from "@/modules/journey/domain/journey-model"
import { createJourneyState } from "@/modules/journey/domain/journey-state"
import { ChoiceGrid } from "@/components/journey/choice-grid"
import { JourneyShell } from "@/components/journey/journey-shell"
import { FlowerNetworkCommandCenter } from "./flower-network-command-center"

const STORAGE_KEY_EXPERT_MODE = "floraos_expert_mode_network"

export function NetworkJourneyHome() {
  const router = useRouter()
  const [isExpertMode, setIsExpertMode] = useState<boolean>(false)
  const [activeJourney, setActiveJourney] = useState<JourneyDefinition | null>(null)
  const [journeyState, setJourneyState] = useState(() =>
    activeJourney ? createJourneyState(activeJourney) : null
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPERT_MODE)
      if (saved === "true") {
        setIsExpertMode(true)
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
  }, [])

  const handleToggleExpertMode = (enabled: boolean) => {
    setIsExpertMode(enabled)
    try {
      localStorage.setItem(STORAGE_KEY_EXPERT_MODE, String(enabled))
    } catch {
      // Bỏ qua
    }
  }

  const handleSelectJourney = (journey: JourneyDefinition) => {
    if (journey.id === "network-overview") {
      setActiveJourney(journey)
      setJourneyState(createJourneyState(journey))
      return
    }

    if (journey.id === "network-dispatch") {
      router.push("/dieu-phoi" as never)
      return
    }

    if (journey.primaryHref) {
      router.push(journey.primaryHref as never)
      return
    }

    setActiveJourney(journey)
    setJourneyState(createJourneyState(journey))
  }

  const handleBackToHome = () => {
    setActiveJourney(null)
    setJourneyState(null)
  }

  // 1. Chế độ Chuyên gia: Hiển thị FlowerNetworkCommandCenter trực tiếp kèm thanh chuyển đổi
  if (isExpertMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4 py-2 bg-selected border border-border rounded-xl">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-body-sm font-semibold text-text">
              Bạn đang ở Chế độ chuyên gia (Trung tâm điều hành mạng lưới điện hoa)
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggleExpertMode(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border hover:bg-surface-alt text-caption font-bold text-primary transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Chuyển sang Chế độ hành trình tác vụ</span>
          </button>
        </div>
        <FlowerNetworkCommandCenter />
      </div>
    )
  }

  // 2. Đang trong luồng tác vụ (Journey Workspace)
  if (activeJourney && journeyState) {
    return (
      <JourneyShell
        journey={activeJourney}
        state={journeyState}
        onBackToHome={handleBackToHome}
      >
        {activeJourney.id === "network-overview" ? (
          <FlowerNetworkCommandCenter />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-selected flex items-center justify-center text-primary font-bold text-display">
              {journeyState.currentStepIndex + 1}
            </div>
            <div>
              <h3 className="text-title font-bold text-text">
                {activeJourney.steps[journeyState.currentStepIndex]?.label || activeJourney.goal}
              </h3>
              <p className="text-body text-text-muted mt-1 max-w-md">
                {activeJourney.steps[journeyState.currentStepIndex]?.description || activeJourney.description}
              </p>
            </div>
            {activeJourney.primaryHref && (
              <button
                type="button"
                onClick={() => router.push((activeJourney.primaryHref || "/") as never)}
                className="px-5 py-2.5 rounded-lg bg-primary text-surface text-body-sm font-bold hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Mở giao diện tác vụ chi tiết
              </button>
            )}
          </div>
        )}
      </JourneyShell>
    )
  }

  // 3. Mặc định: Lưới lựa chọn Hành trình tác vụ Điện hoa (ChoiceGrid)
  return (
    <ChoiceGrid
      title="BẠN MUỐN LÀM GÌ CHO HOẠT ĐỘNG ĐIỆN HOA?"
      subtitle="Chọn một tác vụ để bắt đầu điều phối hoặc quản lý mạng lưới hoa"
      journeys={NETWORK_JOURNEYS}
      onSelectJourney={handleSelectJourney}
      onSwitchToExpertMode={() => handleToggleExpertMode(true)}
    />
  )
}
