"use client"

import React, { useState } from "react"
import { Sparkles, SlidersHorizontal, Search } from "lucide-react"
import type { JourneyDefinition } from "@/modules/journey/domain/journey-model"
import { useSession } from "@/lib/session"
import { UserMenu } from "@/components/layout/user-menu"
import { ActionCard } from "./action-card"

interface ChoiceGridProps {
  title: string
  subtitle?: string
  journeys: JourneyDefinition[]
  onSelectJourney: (journey: JourneyDefinition) => void
  onSwitchToExpertMode?: () => void
}

export function ChoiceGrid({
  title,
  subtitle = "Chọn một tác vụ để bắt đầu hành trình làm việc có định hướng",
  journeys,
  onSelectJourney,
  onSwitchToExpertMode,
}: ChoiceGridProps) {
  const { userInitials } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")

  const filteredJourneys = journeys.filter((j) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      j.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === "ALL" ||
      (selectedCategory === "COMBO" && j.category === "COMBO") ||
      (selectedCategory === "AI_SUGGEST" && j.category === "AI_SUGGEST") ||
      (selectedCategory === "SINGLE" && j.category === "SINGLE")

    return matchesSearch && matchesCategory
  })

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-selected text-primary text-caption font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>HÀNH TRÌNH TÁC VỤ THÔNG MINH</span>
          </div>
          <h1 className="text-display font-extrabold text-text tracking-tight">
            {title}
          </h1>
          <p className="text-body text-text-muted mt-1">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {onSwitchToExpertMode && (
            <button
              type="button"
              onClick={onSwitchToExpertMode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-surface hover:bg-surface-alt text-body-sm font-medium text-text transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-text-muted" aria-hidden="true" />
              <span>Chế độ chuyên gia</span>
            </button>
          )}
          <UserMenu initials={userInitials || "U"} direction="down" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-primary text-surface font-semibold"
                : "bg-surface border border-border text-text hover:bg-surface-alt"
            }`}
          >
            Tất cả ({journeys.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("SINGLE")}
            className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === "SINGLE"
                ? "bg-primary text-surface font-semibold"
                : "bg-surface border border-border text-text hover:bg-surface-alt"
            }`}
          >
            Tác vụ đơn
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("COMBO")}
            className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === "COMBO"
                ? "bg-primary text-surface font-semibold"
                : "bg-surface border border-border text-text hover:bg-surface-alt"
            }`}
          >
            Gói quy trình
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("AI_SUGGEST")}
            className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === "AI_SUGGEST"
                ? "bg-primary text-surface font-semibold"
                : "bg-surface border border-border text-text hover:bg-surface-alt"
            }`}
          >
            Gợi ý từ ảnh
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tác vụ mong muốn..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-body-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Grid Cards */}
      {filteredJourneys.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredJourneys.map((journey) => (
            <ActionCard
              key={journey.id}
              journey={journey}
              onSelect={onSelectJourney}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-surface">
          <p className="text-body text-text-muted">
            Không tìm thấy tác vụ phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      )}
    </div>
  )
}
