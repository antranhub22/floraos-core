"use client"

import React, { useState } from "react"
import { Eye, CheckCircle2, ExternalLink, QrCode, Smartphone, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CatalogProduct } from "./catalog-management-tab"
import {
  LandingTemplateHero,
  LandingTemplateProducts,
  LandingTemplateLead,
} from "./landing-templates"

interface LandingCampaignPreviewProps {
  headline: string
  selectedProducts: CatalogProduct[]
  occasionId?: string
  archetypeId?: string
  isPublished: boolean
  isPublishing: boolean
  publishedUrl: string | null
  downloadingQR: boolean
  onPublish: () => void
  onDownloadQR: () => void
}

export function LandingCampaignPreview({
  headline,
  selectedProducts,
  occasionId = "20-10",
  archetypeId = "minimal-luxury",
  isPublished,
  isPublishing,
  publishedUrl,
  downloadingQR,
  onPublish,
  onDownloadQR,
}: LandingCampaignPreviewProps) {
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("mobile")

  return (
    <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-4 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-text">Bản xem trước giao diện chiến dịch (Live Preview)</h3>
          {isPublished && <Badge tone="success">ĐÃ XUẤT BẢN FINAL</Badge>}
        </div>

        <div className="flex items-center gap-2">
          {/* Device Viewport Toggle */}
          <div className="flex items-center bg-surface p-0.5 rounded-lg border border-border text-xs mr-2">
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-colors ${
                deviceView === "mobile"
                  ? "bg-white text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Smartphone size={13} />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-colors ${
                deviceView === "desktop"
                  ? "bg-white text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Monitor size={13} />
              <span>Desktop</span>
            </button>
          </div>

          {/* Action Buttons */}
          {!isPublished ? (
            <Button
              onClick={onPublish}
              disabled={isPublishing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs font-bold"
            >
              <CheckCircle2 size={14} />
              <span>{isPublishing ? "Đang xuất bản..." : "Duyệt & Xuất bản Landing Page"}</span>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(publishedUrl || "", "_blank")}
                className="h-8 gap-1.5 text-xs text-primary font-bold"
              >
                <ExternalLink size={13} />
                <span>Mở trang thật</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownloadQR}
                disabled={downloadingQR}
                className="h-8 gap-1.5 text-xs text-primary font-bold"
              >
                <QrCode size={13} />
                <span>{downloadingQR ? "Đang tạo..." : "Tải mã QR chiến dịch"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Visual Live Preview Frame */}
      <div className="bg-slate-100/80 p-4 sm:p-6 rounded-2xl border border-slate-200/80 flex justify-center">
        <div
          className={`w-full transition-all duration-300 space-y-4 ${
            deviceView === "mobile"
              ? "max-w-md bg-white p-3.5 rounded-3xl shadow-lg border border-slate-200"
              : "max-w-2xl bg-white p-5 rounded-3xl shadow-lg border border-slate-200"
          }`}
        >
          {/* 1. Hero Section */}
          <LandingTemplateHero
            headline={headline}
            occasionId={occasionId}
            archetypeId={archetypeId}
          />

          {/* 2. Products Showcase Section */}
          <LandingTemplateProducts
            products={selectedProducts}
            archetypeId={archetypeId}
          />

          {/* 3. Lead Voucher CTA Section */}
          <LandingTemplateLead
            archetypeId={archetypeId}
            occasionTitle={headline}
          />
        </div>
      </div>
    </div>
  )
}
