"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Table,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModuleKnowledgeSpec } from "./knowledge-data"
import type { Route } from "next"

interface KnowledgeModuleCardProps {
  module: ModuleKnowledgeSpec
  onAskCopilot?: (prompt: string) => void
}

export function KnowledgeModuleCard({ module, onAskCopilot }: KnowledgeModuleCardProps) {
  const [showFields, setShowFields] = useState(true)

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all hover:shadow-md">
      {/* 1. Header Khối Thông Tin Phân Hệ (K1: Card con không lồng FeatureGuidanceCard) */}
      <div className="p-4 sm:p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 uppercase tracking-wider">
            {module.badgeLabel}
          </span>
          <h2 className="text-base font-bold text-foreground">{module.title}</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{module.summary}</p>
        {module.tips.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
            {module.tips.map((tip, idx) => (
              <li key={idx} className="flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1 text-foreground">
                <span aria-hidden="true">💡</span> <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2. Bảng Trường Dữ Liệu Nguyên Tử (Atomic Disaggregated Fields) */}
      <div className="border-t border-border px-4 sm:px-6 py-4 bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Các trường dữ liệu nguyên tử cần nhập liệu ({module.atomicFields.length} trường)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFields(!showFields)}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>{showFields ? "Thu gọn" : "Xem chi tiết"}</span>
            {showFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showFields && (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-xs font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2.5">Trường dữ liệu</th>
                  <th className="px-3 py-2.5">Kiểu</th>
                  <th className="px-3 py-2.5">Mô tả nghiệp vụ</th>
                  <th className="px-3 py-2.5">Ví dụ chuẩn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {module.atomicFields.map((field, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-foreground whitespace-nowrap">
                      {field.name}
                      {field.required && <span className="text-warning ml-1 font-bold">*</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge className="bg-secondary/20 text-secondary-foreground text-xs font-mono px-1.5 py-0.5">
                        {field.dataType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{field.description}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-primary/90 font-medium">
                      {field.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. So sánh Chuẩn vs Sai lệch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-6 border-t border-border bg-background">
        <div className="rounded-xl border border-success-border bg-success-bg p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Cách nhập liệu chuẩn (Recommended)</span>
          </div>
          <p className="text-xs leading-relaxed text-text">
            {module.goodPractice}
          </p>
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning-bg p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
            <XCircle className="h-4 w-4 text-warning" />
            <span>Sai lầm cần tránh (Anti-pattern)</span>
          </div>
          <p className="text-xs leading-relaxed text-warning line-through decoration-warning/60">
            {module.badPractice}
          </p>
        </div>
      </div>

      {/* 4. Thanh Tác Vụ 1-Chạm Ở Chân Khối */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-border bg-muted/30">
        <button
          type="button"
          onClick={() => onAskCopilot?.(module.copilotPrompt)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hỏi FloraOS Copilot về phân hệ này</span>
        </button>

        <Link href={module.routePath as Route}>
          <Button
            variant="primary"
            size="sm"
            className="text-xs font-bold gap-1.5 shadow-xs"
          >
            <span>👉 {module.actionButtonLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
