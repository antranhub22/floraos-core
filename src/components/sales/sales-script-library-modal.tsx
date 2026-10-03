"use client"

import React, { useState, useMemo } from "react"
import {
  MessageSquareText,
  Copy,
  Check,
  Search,
  Sparkles,
  Lightbulb,
  Tag,
  Filter,
} from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  FLORIST_SALES_SCRIPTS,
  renderSalesScript,
  type SalesScriptCategory,
  type SalesScriptItem,
  type ScriptVariables,
} from "@/modules/products/domain/sales-scripts-catalog"

export interface SalesScriptLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  variables?: ScriptVariables
}

const CATEGORY_TABS: Array<{ id: SalesScriptCategory | "ALL"; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "CHAO_HOI", label: "Chào hỏi" },
  { id: "TU_VAN_DIP", label: "Tư vấn dịp" },
  { id: "NGAN_SACH", label: "Ngân sách" },
  { id: "XU_LY_TU_CHOI", label: "Xử lý chê đắt" },
  { id: "CHOT_DON", label: "Chốt cọc & đơn" },
  { id: "XU_LY_SU_CO", label: "Xử lý khiếu nại" },
  { id: "CHAM_SOC_SAU_BAN", label: "Chăm sóc sau bán" },
]

export function SalesScriptLibraryModal({
  isOpen,
  onClose,
  variables = {},
}: SalesScriptLibraryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<SalesScriptCategory | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedScriptId, setSelectedScriptId] = useState<string>(FLORIST_SALES_SCRIPTS[0]?.id ?? "kb-01")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Bộ lọc danh sách kịch bản
  const filteredScripts = useMemo(() => {
    return FLORIST_SALES_SCRIPTS.filter((script) => {
      const matchesCategory = selectedCategory === "ALL" || script.category === selectedCategory
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        script.title.toLowerCase().includes(q) ||
        script.summary.toLowerCase().includes(q) ||
        script.template.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const activeScript = useMemo(() => {
    return FLORIST_SALES_SCRIPTS.find((s) => s.id === selectedScriptId) || filteredScripts[0] || FLORIST_SALES_SCRIPTS[0]
  }, [selectedScriptId, filteredScripts])

  const renderedContent = useMemo(() => {
    if (!activeScript) return ""
    return renderSalesScript(activeScript.template, variables)
  }, [activeScript, variables])

  const handleCopy = async (script: SalesScriptItem, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(script.id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      // Bỏ qua lỗi clipboard
    }
  }

  const dialogTitle = (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-selected text-primary">
        <MessageSquareText className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-title-sm font-bold text-text">Thư Viện Kịch Bản Tư Vấn Bán Hoa</h2>
      </div>
    </div>
  )

  const dialogFooter = (
    <div className="flex w-full items-center justify-between">
      <span className="text-caption text-text-muted">
        14 mẫu kịch bản thực chiến chuẩn hóa cho nhân viên trực page và tư vấn viên.
      </span>
      <Button type="button" variant="outline" onClick={onClose}>
        Đóng
      </Button>
    </div>
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose() }}
      title={dialogTitle}
      description="Chọn kịch bản phù hợp, cá nhân hóa nội dung và sao chép phản hồi khách chỉ với 1 cú nhấp."
      size="lg"
      footer={dialogFooter}
    >
      <div className="flex flex-col gap-4 text-body-sm">
        {/* Bộ lọc danh mục & Tìm kiếm */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-caption font-semibold transition-colors ${
                  selectedCategory === tab.id
                    ? "bg-primary text-white"
                    : "bg-surface-alt text-text-muted hover:text-text hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Tìm kịch bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-1.5 text-caption text-text placeholder:text-text-muted outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Khung chia 2 cột: Danh sách bên trái + Chi tiết nội suy bên phải */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[380px]">
          {/* Cột trái: Danh sách (5 cột) */}
          <div className="md:col-span-5 flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredScripts.map((script) => {
              const isSelected = activeScript?.id === script.id
              return (
                <button
                  key={script.id}
                  type="button"
                  onClick={() => setSelectedScriptId(script.id)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-selected/40 shadow-xs"
                      : "border-border bg-surface hover:bg-surface-alt"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-caption text-text leading-snug">
                      {script.title}
                    </span>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-caption font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-text-muted mt-1 line-clamp-2 leading-relaxed">
                    {script.summary}
                  </p>
                </button>
              )
            })}
            {filteredScripts.length === 0 && (
              <div className="py-8 text-center text-caption text-text-muted">
                Không tìm thấy kịch bản phù hợp.
              </div>
            )}
          </div>

          {/* Cột phải: Xem trước nội dung đã điền biến + Nút sao chép (7 cột) */}
          {activeScript && (
            <div className="md:col-span-7 flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <h3 className="text-body-sm font-bold text-text">
                      {activeScript.title}
                    </h3>
                    <p className="text-caption text-text-muted mt-0.5">
                      {activeScript.summary}
                    </p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-caption font-semibold text-text-muted shrink-0">
                    Sẵn sàng gửi
                  </span>
                </div>

                {/* Khung nội dung tin nhắn */}
                <div className="relative rounded-xl border border-border bg-surface-alt p-3.5 text-body-sm leading-relaxed text-text whitespace-pre-line font-normal selection:bg-selected">
                  {renderedContent}
                </div>

                {/* Khối Mẹo tâm lý thực chiến */}
                <div className="rounded-xl border border-warning/30 bg-warning-bg/60 p-3 flex items-start gap-2.5 text-caption text-warning">
                  <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mẹo tâm lý thực chiến: </span>
                    <span className="text-text font-normal">{activeScript.psychologicalTip}</span>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-4 border-t border-border mt-3 flex items-center justify-between">
                <span className="text-caption text-text-muted">
                  Tự động điền tên shop, khách hàng và giá hoa nếu có.
                </span>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleCopy(activeScript, renderedContent)}
                  className="gap-2 font-semibold"
                >
                  {copiedId === activeScript.id ? (
                    <>
                      <Check size={16} />
                      Đã sao chép kịch bản!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      {activeScript.suggestedActionLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
