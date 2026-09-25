"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Search,
  Sparkles,
  Bot,
  Filter,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"
import { KNOWLEDGE_MODULES } from "@/components/knowledge-base/knowledge-data"
import { KnowledgeModuleCard } from "@/components/knowledge-base/knowledge-module-card"
import { OnboardingProgressBar } from "@/components/knowledge-base/onboarding-progress-bar"
import type { Route } from "next"

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL")

  // Bộ lọc modules
  const filteredModules = KNOWLEDGE_MODULES.filter((m) => {
    const matchesFilter =
      selectedModuleFilter === "ALL" || m.code === selectedModuleFilter

    const q = searchQuery.toLowerCase().trim()
    if (!q) return matchesFilter

    const matchesSearch =
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.atomicFields.some(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      ) ||
      m.tips.some((t) => t.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  function handleAskCopilot(prompt: string) {
    // Kích hoạt Copilot toàn cục và tự động gửi câu hỏi mẫu
    window.dispatchEvent(new CustomEvent("floraos:open-copilot", { detail: { prompt } }))
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Standardized Top-Right Action Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-mono font-bold text-red-700 uppercase tracking-wider">
              SSOT KNOWLEDGE BASE
            </span>
            <h1 className="text-xl font-extrabold text-foreground">
              Cẩm Nang Tri Thức & Quy Chuẩn Nhập Liệu
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bảng tra cứu các trường nguyên tử bắt buộc, tiêu chuẩn thao tác và ví dụ chuẩn cho toàn bộ 7 phân hệ FloraOS
          </p>
        </div>

        {/* Top-Right Action Toolbar */}
        <div className="flex items-center gap-3">
          <Link href={"/hoi-thoai/kenh-tich-hop" as Route}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <Bot className="h-3.5 w-3.5 text-red-600" />
              <span>Kênh Chat Đa Kênh M08</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => handleAskCopilot("Hỏi Copilot")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mở FloraOS Copilot (⌘K)</span>
          </Button>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner Hướng Dẫn Chuẩn FeatureGuidanceCard */}
        <FeatureGuidanceCard
          badgeLabel="CẨM NANG VẬN HÀNH THƯƠNG MẠI SSOT"
          badgeIcon={BookOpen}
          title="Quy Chuẩn Nhập Liệu Nguyên Tử (Atomic Disaggregated Data)"
          description="Để hệ thống FloraOS hoạt động chính xác 100% khi tính giá vốn, đo SLA thợ cắm và tư vấn AI bán hàng, mọi thông tin phải được phân rã thành các trường độc lập (Tên hoa, Số lượng cành, Đơn vị tính, Màu sắc...). Tuyệt đối không gộp chung văn bản và số lượng vào cùng một ô tự do."
          tips={[
            { icon: "⚡", text: "Atomic Fields: Sửa trực tiếp từng ô dữ liệu nguyên tử mà không làm hỏng cấu trúc" },
            { icon: "🛡️", text: "Aegis Resource: Giữ nguyên tắc cách ly dữ liệu tenant và tránh ghi đè DB vô nghĩa" },
            { icon: "💬", text: "AI Copilot: Bấm 'Hỏi FloraOS Copilot' để được trợ lý ảo hướng dẫn từng bước 24/7" },
            { icon: "🖨️", text: "In ấn bảo mật: Luôn dùng phiếu cắm hoa giấu giá cho thợ và phiếu A6 cho shipper" },
          ]}
        />

        {/* Thước đo tiến độ dữ liệu cửa hàng */}
        <OnboardingProgressBar />

        {/* Thanh Tìm Kiếm & Bộ Lọc Phân Hệ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm trường nhập liệu, quy chuẩn, mẹo thao tác (vd: đếm cành, giá sàn, ẩn giá, zalo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Module Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { code: "ALL", label: "Tất cả" },
              { code: "M01", label: "M01 Vision" },
              { code: "M02", label: "M02 Giá" },
              { code: "M04c", label: "M04 Video" },
              { code: "M06", label: "M06 Catalog" },
              { code: "M08", label: "M08 Chat AI" },
              { code: "M09", label: "M09 CRM" },
              { code: "M10", label: "M10 Đơn hàng" },
            ].map((tab) => (
              <button
                key={tab.code}
                type="button"
                onClick={() => setSelectedModuleFilter(tab.code)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
                  selectedModuleFilter === tab.code
                    ? "bg-red-600 text-white"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh Sách Các Phân Hệ Cẩm Nang Nhập Liệu */}
        <div className="space-y-6">
          {filteredModules.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
              <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm font-bold text-foreground">Không tìm thấy hướng dẫn phù hợp</div>
              <p className="text-xs text-muted-foreground mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc &apos;Tất cả&apos;
              </p>
            </div>
          ) : (
            filteredModules.map((mod) => (
              <KnowledgeModuleCard
                key={mod.id}
                module={mod}
                onAskCopilot={handleAskCopilot}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
