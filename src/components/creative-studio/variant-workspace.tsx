/**
 * VariantWorkspace — Tab 2: M04b Biến thể Marketing
 *
 * Cho phép tạo biến thể bối cảnh studio hoặc AI visual storytelling.
 * Tích hợp SourcePicker với lựa chọn:
 *   1. Dùng Master Image đã duyệt từ Tab 1
 *   2. Skip — Dùng nguyên ảnh gốc (duyệt nhanh 1-chạm tạo Master)
 */

"use client"

import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Download,
  RotateCcw,
  Layers,
  Image as ImageIcon,
  Check,
  AlertTriangle,
} from "lucide-react"
import { ResultCard } from "@/components/result/result-card"
import { FlowSteps } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  StudioVariantCard,
  VisualStorytellingControls,
} from "@/components/templates/creative-studio"
import {
  M04B_VARIANT_PRESETS,
  getVariantPreset,
} from "@/modules/media/domain/variant-presets"
import { SourcePicker } from "./source-picker"
import { FLOW_M04B } from "./types"
import type { UseCreativeStudioReturn } from "./use-creative-studio-data"

interface VariantWorkspaceProps {
  data: UseCreativeStudioReturn
}

export function VariantWorkspace({ data }: VariantWorkspaceProps) {
  const {
    phase,
    setPhase,
    approvedMasters,
    selectedMasterId,
    setSelectedMasterId,
    assets,
    promoteOriginalToMaster,
    loadingMasters,
    loadingAssets,
    canApprove,
    variantEngineMode,
    setVariantEngineMode,
    selectedVariantPreset,
    setSelectedVariantPreset,
    selectedCloudProvider,
    setSelectedCloudProvider,
    cameraAngle,
    setCameraAngle,
    humanInteraction,
    setHumanInteraction,
    storylineMode,
    setStorylineMode,
    variantRatio,
    setVariantRatio,
    watermarkEnabled,
    setWatermarkEnabled,
    goRunningB,
    canRunVariant,
    jobPhase,
    jobStatus,
    setJobStatus,
    judgmentB,
    generatedVariants,
    variantIntegrity,
    selectedVariantAssetId,
    selectVariant,
    canDownload,
    handleDownloadVariant,
    fieldsB,
    handleApproveB,
    canApproveVariantCap,
    errorMsg,
    setErrorMsg,
  } = data

  // ============================================================
  // PHASE: RUNNING B
  // ============================================================
  if (phase === "running-b") {
    return (
      <div className="flex flex-1 flex-col items-center gap-5 w-full max-w-xl mx-auto py-8">
        <div className="text-center">
          <div className="text-[17px] font-extrabold text-text">Đang sinh biến thể M04b</div>
          <div className="mt-1 text-[13px] text-text-muted">
            {jobPhase ?? "Đang xếp hàng chờ worker nhận việc..."}
          </div>
        </div>
        <div className="w-full">
          <FlowSteps
            steps={FLOW_M04B}
            currentStep={jobPhase ?? "SEGMENTING"}
            cancellable={jobStatus === "PENDING"}
            onCancel={() => {
              setJobStatus("CANCELLED")
              setPhase("config-b")
            }}
          />
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: RESULT B
  // ============================================================
  if (phase === "result-b") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b (Biến thể Marketing)</div>
            <div className="text-[17px] font-extrabold text-text">Danh sách biến thể đã sinh</div>
          </div>
          <Badge tone={judgmentB === "blocked" ? "danger" : judgmentB === "warning" ? "warning" : "neutral"}>
            {judgmentB === "blocked"
              ? "Bị cổng toàn vẹn từ chối"
              : `${generatedVariants.length} biến thể đã ghi vào kho`}
          </Badge>
        </div>

        {/* Cổng toàn vẹn từ chối */}
        {judgmentB === "blocked" && (
          <div className="w-full rounded-xl border-2 border-danger bg-danger-bg px-4 py-3 text-[13px] text-danger">
            <div className="font-bold">Không có biến thể nào được ghi</div>
            <div className="mt-1">
              Cổng toàn vẹn đo thấy lõi bó hoa bị thay đổi trong lúc ghép bối cảnh, nên không
              biến thể nào được lưu vào kho. Master Image của tiệm vẫn nguyên vẹn.
            </div>
            {variantIntegrity && variantIntegrity.ly_do.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {variantIntegrity.ly_do.map((ly, i) => (
                  <li key={i}>{ly}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Cảnh báo trước khi duyệt */}
        {judgmentB === "warning" && variantIntegrity && (
          <div className="w-full rounded-xl border-2 border-warning bg-warning-bg px-4 py-3 text-[13px] text-warning">
            Lõi chủ thể lệch nhẹ so với Master Image (
            {(variantIntegrity.subject_pixel_identity * 100).toFixed(2)}%). Xem kỹ ảnh trước
            khi duyệt.
          </div>
        )}

        {/* Variant Cards Grid — Ảnh gốc + Biến thể song song */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Ảnh gốc (Master) */}
          {(() => {
            const master = approvedMasters.find((m) => m.id === selectedMasterId) || approvedMasters[0]
            if (!master) return null
            return (
              <div className="relative overflow-hidden rounded-xl border-2 border-border bg-surface">
                <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden bg-[#f8fafc]">
                  {master.url ? (
                    <img
                      src={master.url}
                      alt="Ảnh gốc Master"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-text-muted" />
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge tone="neutral" className="text-[10px] font-bold bg-surface/90 backdrop-blur-sm">📸 Ảnh gốc (Master)</Badge>
                  </div>
                </div>
                <div className="p-3 border-t border-border">
                  <div className="text-[13px] font-bold truncate text-text">{master.product_name || master.name || "Master Image"}</div>
                  <div className="text-[11px] text-text-muted">Ảnh gốc trước khi sinh biến thể</div>
                </div>
              </div>
            )
          })()}

          {/* Biến thể đã sinh */}
          {generatedVariants.map((v) => {
            const isSelected = v.asset_id === selectedVariantAssetId
            const isTransparent = v.variant_key === "transparent"

            return (
              <div
                key={v.asset_id}
                className={`relative overflow-hidden rounded-xl border-2 bg-surface transition ${
                  isSelected ? "border-primary shadow-sm" : "border-border"
                }`}
              >
                <div
                  className="relative aspect-square w-full flex items-center justify-center overflow-hidden"
                  style={
                    isTransparent
                      ? {
                          backgroundImage:
                            "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        }
                      : { backgroundColor: "#f8fafc" }
                  }
                >
                  {v.url ? (
                    <img
                      src={v.url}
                      alt={v.title}
                      className="h-full w-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-text-muted" />
                  )}

                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isSelected && <Badge tone="accent" className="text-[10px]">Đang chọn</Badge>}
                    {v.approval_state === "approved" && (
                      <Badge tone="success" className="text-[10px]">Đã duyệt</Badge>
                    )}
                    {v.watermark && <Badge tone="neutral" className="text-[10px]">Có logo</Badge>}
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-1 border-t border-border">
                  <div className="text-[13px] font-bold truncate text-text">{v.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span className="truncate">Bối cảnh: {v.background || "—"}</span>
                    <span className="flex-shrink-0 pl-2">{v.ratio}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-dashed border-border text-[10px]">
                    <span className="text-secondary font-bold">
                      {variantIntegrity
                        ? `Lõi trùng khít ${(variantIntegrity.subject_pixel_identity * 100).toFixed(2)}%`
                        : "Chưa có số đo"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadVariant(v.asset_id)}
                      disabled={!canDownload}
                      className="text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
                    >
                      <Download size={11} /> Tải về
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectVariant(v.asset_id)}
                  aria-label={`Chọn biến thể ${v.title}`}
                  className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shadow-xs transition ${
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-surface-alt border border-border text-text-muted hover:border-primary"
                  }`}
                >
                  {isSelected ? "✓" : "+"}
                </button>
              </div>
            )
          })}
        </div>

        {/* Dynamic ResultCard with Atomic Fields */}
        <ResultCard
          fields={fieldsB}
          judgment={judgmentB}
          quality={{
            score: variantIntegrity
              ? Math.round(variantIntegrity.subject_pixel_identity * 100)
              : 0,
            label: variantIntegrity
              ? `Lõi chủ thể trùng khít ${(variantIntegrity.subject_pixel_identity * 100).toFixed(2)}% với Master Image`
              : "Chưa có số đo toàn vẹn",
            status: judgmentB === "blocked" ? "blocked" : judgmentB === "warning" ? "warning" : "safe",
          }}
          onApprove={handleApproveB}
          disabled={
            !canApproveVariantCap || judgmentB === "blocked" || generatedVariants.length === 0
          }
        />

        {/* Bottom Navigation */}
        <div className="w-full border-t border-border pt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setPhase("config-b")}>
            <RotateCcw size={15} className="mr-1.5" /> Tạo thêm biến thể khác
          </Button>
          <Button onClick={() => setPhase("saved")} className="gap-1.5">
            Xong → Lưu vào kho ảnh
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: SAVED
  // ============================================================
  if (phase === "saved") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg">
          <Check size={40} strokeWidth={2} className="text-secondary" />
        </div>
        <div>
          <div className="text-[18px] font-extrabold text-text">Đã lưu vào Kho ảnh sản phẩm</div>
          <div className="mt-1 text-[13px] text-text-muted">
            Biến thể marketing và Master Image đều được bảo toàn trong kho ảnh của tiệm
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => setPhase("config-b")}>
            Tạo thêm biến thể khác
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: ERROR
  // ============================================================
  if (phase === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-bg">
          <AlertTriangle size={40} strokeWidth={2} className="text-danger" />
        </div>
        <div>
          <div className="text-[18px] font-extrabold text-text">Đã xảy ra lỗi</div>
          <div className="mt-1 text-[13px] text-text-muted">{errorMsg ?? "Không thể hoàn thành tác vụ"}</div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => { setErrorMsg(null); setPhase("config-b") }}>Thử lại</Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: CONFIG-B (Default Configuration)
  // ============================================================
  const hasMaster = Boolean(selectedMasterId)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
      {/* Title */}
      <div className="text-center w-full">
        <div className="text-[17px] font-extrabold text-primary">Khu vực B — Biến thể Marketing Tiếp thị (M04b)</div>
        <div className="mt-1 text-[13px] text-text-muted">
          Tách nền trong suốt PNG hoặc hòa phối bó hoa vào các bối cảnh studio/lifestyle sang trọng.
        </div>
      </div>

      {/* Nguồn ảnh đầu vào: Master đã duyệt hoặc Skip dùng nguyên ảnh gốc */}
      <SourcePicker
        masters={approvedMasters}
        selectedMasterId={selectedMasterId}
        onSelectMaster={setSelectedMasterId}
        assets={assets}
        onPromoteToMaster={promoteOriginalToMaster}
        onGoToOptimize={() => setPhase("select")}
        loadingMasters={loadingMasters}
        loadingAssets={loadingAssets}
        canApprove={canApprove}
      />

      {/* Engine Switcher */}
      <div className="w-full">
        <div className="text-xs font-bold text-text mb-2">Chọn phong cách tiếp thị:</div>
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-alt rounded-xl border border-border w-full">
          <button
            type="button"
            onClick={() => setVariantEngineMode("local_studio")}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              variantEngineMode === "local_studio"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Layers size={14} /> 10 Phối cảnh Đồ họa Nội bộ (0đ)
          </button>
          <button
            type="button"
            onClick={() => setVariantEngineMode("cloud_provider")}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              variantEngineMode === "cloud_provider"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Sparkles size={14} /> AI Visual Storytelling (Cloud)
          </button>
        </div>
      </div>

      {/* Nhánh 1: Local Studio */}
      {variantEngineMode === "local_studio" && (
        <div className="w-full flex flex-col gap-3">
          <div className="rounded-lg bg-surface-alt p-3 border border-border text-[12px] text-text-muted flex items-start gap-2">
            <ShieldCheck size={16} className="text-success mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-text">Ghép bối cảnh đồ họa chuẩn (0đ):</span> Giữ nguyên 100% bó hoa thật từ Master Image, tự động ghép vào 10 bối cảnh decor sang trọng và đóng dấu watermark thương hiệu shop.
            </div>
          </div>

          <StudioVariantCard
            variants={M04B_VARIANT_PRESETS}
            selectedId={selectedVariantPreset}
            onSelectVariant={(id) => setSelectedVariantPreset(id)}
          />
        </div>
      )}

      {/* Nhánh 2: Cloud Provider Storytelling */}
      {variantEngineMode === "cloud_provider" && (
        <div className="w-full flex flex-col gap-4">
          <div className="rounded-lg bg-primary/5 p-3 border border-primary/20 text-[12px] text-primary flex items-start gap-2">
            <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">AI Visual Storytelling (Đa góc chụp & Người mẫu):</span> Sinh ảnh theo nhiều góc nhìn camera và người mẫu tương tác qua các Cloud Provider chuyên nghiệp (Fal.ai FLUX, Stability AI, Google Imagen, Photoroom).
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
            <span className="text-xs font-bold text-text">Cloud Provider ưu tiên:</span>
            <div className="flex gap-1.5">
              {(["fal", "stability", "imagen", "photoroom"] as const).map((pKey) => (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => setSelectedCloudProvider(pKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selectedCloudProvider === pKey
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-surface-alt border-border text-text hover:border-text-muted"
                  }`}
                >
                  {pKey === "fal" ? "Fal.ai FLUX" : pKey === "stability" ? "Stability AI" : pKey === "imagen" ? "Google Imagen 3" : "Photoroom"}
                </button>
              ))}
            </div>
          </div>

          <VisualStorytellingControls
            cameraAngle={cameraAngle}
            onCameraAngleChange={setCameraAngle}
            humanInteraction={humanInteraction}
            onHumanInteractionChange={setHumanInteraction}
            storylineMode={storylineMode}
            onStorylineModeChange={setStorylineMode}
          />
        </div>
      )}

      {/* Multi-channel Controls (Ratio, Watermark, Credit Cost) */}
      <Card className="w-full p-4.5 border border-border bg-surface flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tùy biến xuất bản đa kênh</div>
          <Badge tone="accent" className="text-[11px] font-bold">Chi phí: 1 credit / lượt</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-text block mb-1.5">Tỉ lệ khung hình</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["1:1", "4:5", "9:16", "16:9"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setVariantRatio(r)}
                  className={`h-8 rounded-lg text-xs font-bold border transition ${
                    variantRatio === r
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-surface-alt border-border text-text hover:border-text-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-text-muted mt-1">
              {variantRatio === "1:1" && "Vuông chuẩn Instagram / Zalo"}
              {variantRatio === "4:5" && "Dọc nhẹ chuẩn Facebook Feed"}
              {variantRatio === "9:16" && "Dọc toàn màn hình Story / Reels / TikTok"}
              {variantRatio === "16:9" && "Ngang Banner Website / Youtube"}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text block mb-1.5">Bản quyền & Đóng dấu</label>
            <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-surface-alt cursor-pointer hover:border-text-muted">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="accent-primary h-4 w-4 rounded"
              />
              <div className="text-xs">
                <span className="font-bold text-text">Đóng dấu Watermark Shop</span>
                <span className="block text-[11px] text-text-muted">Tự động lấy logo từ Hồ sơ thương hiệu</span>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Boundary Notice */}
      <div className="w-full rounded-xl bg-primary/5 p-4 border border-primary/20 flex items-start gap-3">
        <ShieldCheck size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-primary/90 leading-relaxed">
          <strong>Ranh giới bất biến:</strong> Biến thể marketing không thay đổi hình dáng hay màu sắc bó hoa thật. Bó hoa từ Master Image được bảo toàn 100%.
        </div>
      </div>

      {/* Primary Submit Button */}
      <Button
        className="h-[48px] w-full px-8 text-sm font-bold shadow-md shadow-primary/20"
        onClick={goRunningB}
        disabled={!hasMaster || !canRunVariant}
      >
        <Sparkles size={18} strokeWidth={2} className="mr-2" />
        {variantEngineMode === "local_studio"
          ? `Tạo biến thể marketing (${getVariantPreset(selectedVariantPreset).name})`
          : `Sinh ảnh AI Storytelling (${selectedCloudProvider === "fal" ? "Fal.ai FLUX" : selectedCloudProvider === "stability" ? "Stability AI" : selectedCloudProvider === "imagen" ? "Google Imagen 3" : "Photoroom"})`}
      </Button>

      <div className="w-full flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => setPhase("select")}>
          <ArrowLeft size={14} className="mr-1.5" /> Quay lại Tab Tối ưu
        </Button>
      </div>
    </div>
  )
}
