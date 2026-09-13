"use client";

/**
 * FeaturePicker — Main component for selecting AI capabilities per product.
 * 
 * Flow:
 * 1. Load product + check Master Image approval status
 * 2. Render ModuleFeatureGroup accordion for each module
 * 3. User ticks checkboxes for desired features
 * 4. Real-time credit estimation + dependency validation
 * 5. Submit → POST /api/v1/jobs/batch → returns job IDs
 * 6. Redirect to job monitoring page or show SSE progress
 */

import { useState, useCallback, useMemo } from "react";
import {
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
  CreditCard,
  Zap,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import {
  FEATURE_CATALOG,
  MODULE_GROUPS,
  ModuleFeatureGroup,
  SubFeature,
  ModuleKey,
  checkFeatureDependencies,
  checkModuleDependencies,
  getJobFeatureForModule,
  getCapabilitiesForModule,
  getVisibleFeaturesByModule,
} from "@/lib/feature-catalog";
import { estimateTotalCredits, getCreditBreakdown, getCostWarningLevel, formatCredits } from "@/lib/credit-estimator";

interface FeaturePickerProps {
  productId: string;
  productName: string;
  hasApprovedAnalysis: boolean;
  hasApprovedMasterImage: boolean;
  masterImageId: string | undefined;
  userCreditBalance: number;
  onJobsCreated: (jobs: Array<{ jobId: string; feature: string; module: string }>) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

export function FeaturePicker({
  productId,
  productName,
  hasApprovedAnalysis,
  hasApprovedMasterImage,
  masterImageId,
  userCreditBalance,
  onJobsCreated,
  onError,
  onClose,
}: FeaturePickerProps) {
  const { capabilities } = useSession();
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<ModuleKey>>(new Set(["M01b", "M04b", "M04c", "M07"]));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCreditDetails, setShowCreditDetails] = useState(false);

  // Filter features by user RBAC and status
  const moduleGroups = useMemo(() => {
    return MODULE_GROUPS.map(group => ({
      ...group,
      features: group.features.filter(f => 
        f.status !== "coming_soon" || f.module === "M01b" // show coming soon for M01b as preview
      ).filter(f => !f.rbacRun || capabilities.includes(f.rbacRun)), // RBAC gate
      dependencyCheck: checkModuleDependencies(group.module, {
        hasApprovedAnalysis,
        hasApprovedMasterImage,
      }),
    })).filter(g => g.features.length > 0);
  }, [capabilities, hasApprovedAnalysis, hasApprovedMasterImage]);

  // Dependency context for feature-level checks
  const depContext = useMemo(() => ({
    hasApprovedAnalysis,
    hasApprovedMasterImage,
    hasCustomerConsent: false, // TODO: check actual consent
  }), [hasApprovedAnalysis, hasApprovedMasterImage]);

  // Selected features array
  const selectedArray = Array.from(selectedFeatures);

  // Credit estimation
  const totalCredits = estimateTotalCredits(selectedArray);
  const creditBreakdown = getCreditBreakdown(selectedArray);
  const costWarning = getCostWarningLevel(userCreditBalance, selectedArray);

  // Can submit?
  const canSubmit = selectedArray.length > 0 && !submitting && costWarning !== "danger";

  // Toggle module expansion
  const toggleModule = (module: ModuleKey) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  // Toggle feature selection
  const toggleFeature = (feature: SubFeature) => {
    const depCheck = checkFeatureDependencies(feature, depContext);
    if (!depCheck.canRun) return; // blocked by dependency
    
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(feature.key)) next.delete(feature.key);
      else next.add(feature.key);
      return next;
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Group selected features by module
      const featuresByModule = new Map<ModuleKey, string[]>();
      for (const key of selectedArray) {
        const feature = FEATURE_CATALOG.find(f => f.key === key);
        if (feature) {
          const arr = featuresByModule.get(feature.module) ?? [];
          arr.push(key);
          featuresByModule.set(feature.module, arr);
        }
      }

      // Create jobs per module
      const jobs = await Promise.all(
        Array.from(featuresByModule.entries()).map(async ([module, featureKeys]) => {
          const jobFeature = getJobFeatureForModule(module);
          const capabilitiesList = getCapabilitiesForModule(module, featureKeys);
          
          const res = await fetch("/api/v1/jobs/batch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({
              productId,
              masterImageId,
              feature: jobFeature,
              capabilities: capabilitiesList,
              module,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
            throw new Error(err.message ?? `Failed to create ${module} job`);
          }

          const data = await res.json();
          return {
            jobId: data.job_id,
            feature: jobFeature,
            module,
          };
        })
      );

      onJobsCreated(jobs);
      if (onClose) onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Có lỗi khi tạo tác vụ";
      setSubmitError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-run modules (M01, M04a) — show as single action buttons
  const autoRunModules = moduleGroups.filter(g => g.isAutoRun);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full gap-4 p-4 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-extrabold">Chọn tính năng AI cho sản phẩm</h2>
              <p className="text-[12.5px] text-text-muted mt-0.5">
                {productName} — Tick từng tính năng, hệ thống sẽ tạo job riêng cho mỗi module
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreditEstimateBadge
                totalCredits={totalCredits}
                userBalance={userCreditBalance}
                warning={costWarning}
                onClick={() => setShowCreditDetails(!showCreditDetails)}
              />
            </div>
          </div>

          {/* Credit Details Popover */}
          {showCreditDetails && (
            <CreditDetailsPanel
              breakdown={creditBreakdown}
              totalCredits={totalCredits}
              userBalance={userCreditBalance}
              onClose={() => setShowCreditDetails(false)}
            />
          )}

          {/* Submit Bar */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-3 text-[12.5px]">
              {selectedArray.length > 0 && (
                <>
                  <span className="text-primary font-bold">{selectedArray.length} tính năng đã chọn</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className={cn(
                    "font-bold",
                    costWarning === "danger" && "text-danger",
                    costWarning === "warning" && "text-warning",
                    costWarning === "safe" && "text-secondary-text"
                  )}>
                    {costWarning === "danger" && "⚠ Hết credit — "}
                    {costWarning === "warning" && "⚠ Sắp hết credit — "}
                    {formatCredits(totalCredits)} / {formatCredits(userCreditBalance)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Đóng
                </Button>
              )}
              <Button
                className="h-[44px] px-6"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Đang tạo tác vụ…" : `Tạo ${featuresByModuleCount(moduleGroups, selectedArray)} tác vụ`}
              </Button>
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-700">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Auto-run Modules (M01, M04a) — Single Action Cards */}
        {autoRunModules.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {autoRunModules.map(group => (
              <AutoRunModuleCard
                key={group.module}
                group={group}
                depCheck={group.dependencyCheck}
                hasApprovedMasterImage={hasApprovedMasterImage}
              />
            ))}
          </div>
        )}

        {/* Selectable Modules — Accordion */}
        <div className="flex flex-col gap-3">
          {moduleGroups
            .filter(g => !g.isAutoRun)
            .map(group => (
              <ModuleAccordion
                key={group.module}
                group={group}
                depCheck={group.dependencyCheck}
                selectedFeatures={selectedFeatures}
                onToggleFeature={toggleFeature}
                isExpanded={expandedModules.has(group.module)}
                onToggleExpand={() => toggleModule(group.module)}
                userCapabilities={capabilities}
                depContext={depContext}
              />
            ))}
        </div>

        {/* Empty state */}
        {moduleGroups.filter(g => !g.isAutoRun).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
            <HelpCircle size={32} className="mb-2 opacity-50" />
            <p className="font-medium">Chưa có tính năng nào sẵn sàng cho quyền của bạn</p>
            <p className="text-[12.5px] mt-1">Liên hệ quản trị để cấp quyền hoặc chờ triển khai module mới</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function CreditEstimateBadge({
  totalCredits,
  userBalance,
  warning,
  onClick,
}: {
  totalCredits: number;
  userBalance: number;
  warning: "safe" | "warning" | "danger";
  onClick: () => void;
}) {
  const bgClass = warning === "danger" ? "bg-danger-bg" : 
                  warning === "warning" ? "bg-warning-bg" : "bg-success-bg";
  const textClass = warning === "danger" ? "text-danger" : 
                    warning === "warning" ? "text-warning" : "text-primary";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors hover:opacity-80",
        bgClass,
        textClass
      )}
      aria-label="Xem chi tiết credit"
    >
      <Zap size={14} strokeWidth={2} />
      <span className="font-bold text-[12.5px]">{formatCredits(totalCredits)}</span>
      <span className="text-[10.5px] opacity-70">/ {formatCredits(userBalance)}</span>
      <Info size={12} strokeWidth={1.8} className="ml-0.5" />
    </button>
  );
}

function CreditDetailsPanel({
  breakdown,
  totalCredits,
  userBalance,
  onClose,
}: {
  breakdown: Array<{ featureKey: string; featureLabel: string; estimatedCredits: number; breakdown?: string; confidence: "low" | "medium" | "high" }>;
  totalCredits: number;
  userBalance: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-bold text-[14.5px]">Chi tiết ước tính Credit</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-alt">
            <EyeOff size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {breakdown.map((item, i) => (
              <div key={item.featureKey} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-surface-alt">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[12.5px] truncate">{item.featureLabel}</span>
                    <Badge tone="neutral" className="text-[9.5px]">
                      {item.confidence === "high" ? "🟢" : item.confidence === "medium" ? "🟡" : "🔴"}
                    </Badge>
                  </div>
                  {item.breakdown && (
                    <p className="mt-0.5 text-[11px] text-text-muted truncate">{item.breakdown}</p>
                  )}
                </div>
                <span className="font-bold text-[13px] text-primary whitespace-nowrap">
                  {formatCredits(item.estimatedCredits)}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-[13.5px] font-bold">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatCredits(totalCredits)}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px] text-text-muted">
              <span>Số dư hiện tại</span>
              <span>{formatCredits(userBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px] font-medium">
              <span>Còn lại sau khi chạy</span>
              <span className={totalCredits > userBalance ? "text-danger" : "text-secondary-text"}>
                {formatCredits(Math.max(0, userBalance - totalCredits))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoRunModuleCard({
  group,
  depCheck,
  hasApprovedMasterImage,
}: {
  group: ModuleFeatureGroup;
  depCheck: { canRun: boolean; reason?: string };
  hasApprovedMasterImage: boolean;
}) {
  const isM01 = group.module === "M01";
  const isM04a = group.module === "M04a";
  const label = isM01 ? "Phân tích ảnh sản phẩm" : "Tạo Master Image";
  const desc = isM01 
    ? "Nhận diện hoa, đếm cành, màu sắc, phong cách, gói/nơ — 1 lượt chạy"
    : "Tăng cường (Real-ESRGAN) + Identity Guard + Smart Reframe 4 tỷ lệ";
  const creditCost = isM01 ? 10 : 15;
  const capability = isM01 ? "H1" : "I1";

  return (
    <Card className={cn(
      "flex flex-col gap-3 p-4 border-border",
      !depCheck.canRun && "opacity-50"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Zap size={22} strokeWidth={1.8} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-[14.5px]">{label}</h3>
            <p className="mt-0.5 text-[12.5px] text-text-muted">{desc}</p>
          </div>
        </div>
        <Badge tone={depCheck.canRun ? "neutral" : "warning"} className="text-[10.5px]">
          {depCheck.canRun ? "Sẵn sàng" : "Chờ điều kiện"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 text-[12.5px] text-text-muted border-t border-border pt-3">
        <div className="flex justify-between">
          <span>Chi phí ước tính</span>
          <span className="font-bold text-primary">{formatCredits(creditCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Quyền cần thiết</span>
          <span className="font-medium">{capability}</span>
        </div>
      </div>

      {!depCheck.canRun && depCheck.reason && (
        <div className="flex items-start gap-1.5 rounded-lg bg-warning-bg p-2.5 text-[11.5px] text-warning">
          <AlertCircle size={12} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
          <span>{depCheck.reason}</span>
        </div>
      )}

      <Button
        className="w-full mt-2"
        disabled={!depCheck.canRun}
        variant={isM04a ? "secondary" : "primary"}
      >
        {isM01 ? "Bắt đầu phân tích" : "Tạo Master Image"}
      </Button>
    </Card>
  );
}

function ModuleAccordion({
  group,
  depCheck,
  selectedFeatures,
  onToggleFeature,
  isExpanded,
  onToggleExpand,
  userCapabilities,
  depContext,
}: {
  group: ModuleFeatureGroup;
  depCheck: { canRun: boolean; reason?: string };
  selectedFeatures: Set<string>;
  onToggleFeature: (feature: SubFeature) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  userCapabilities: string[];
  depContext: { hasApprovedAnalysis: boolean; hasApprovedMasterImage: boolean; hasCustomerConsent: boolean };
}) {
  const visibleFeatures = getVisibleFeaturesByModule(group.module);
  const selectedCount = visibleFeatures.filter(f => selectedFeatures.has(f.key)).length;

return (
      <Card className={cn("border-border", !depCheck.canRun && "opacity-50")}>
        <div 
          className="flex flex-row items-center justify-between p-3 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt">
              <Zap size={20} strokeWidth={1.8} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[14.5px] font-bold">{group.label}</h3>
              <p className="text-[11.5px] text-text-muted">{group.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={depCheck.canRun ? "neutral" : "warning"} className="text-[10.5px]">
              {depCheck.canRun ? "Sẵn sàng" : "Chờ điều kiện"}
            </Badge>
            {selectedCount > 0 && (
              <Badge tone="accent" className="text-[10.5px]">
                {selectedCount}/{visibleFeatures.length}
              </Badge>
            )}
            <ChevronDown 
              size={16} 
              strokeWidth={2} 
              className={cn("text-text-muted transition-transform", isExpanded && "rotate-180")}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="pt-0 pb-4">
          {!depCheck.canRun && depCheck.reason && (
            <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-warning-bg p-2.5 text-[11.5px] text-warning">
              <AlertCircle size={12} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
              <span>{depCheck.reason}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleFeatures.map(feature => (
              <FeatureCard
                key={feature.key}
                feature={feature}
                isSelected={selectedFeatures.has(feature.key)}
                onToggle={onToggleFeature}
                depCheck={checkFeatureDependencies(feature, depContext)}
                userCanRun={!feature.rbacRun || userCapabilities.includes(feature.rbacRun)}
              />
            ))}
          </div>

          {visibleFeatures.length === 0 && (
            <div className="py-4 text-center text-[12.5px] text-text-muted">
              Tất cả tính năng của module này đang phát triển (coming soon)
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function FeatureCard({
  feature,
  isSelected,
  onToggle,
  depCheck,
  userCanRun,
}: {
  feature: SubFeature;
  isSelected: boolean;
  onToggle: (feature: SubFeature) => void;
  depCheck: { canRun: boolean; reason?: string };
  userCanRun: boolean;
}) {
  const enabled = userCanRun && depCheck.canRun;
  const showTooltip = !enabled || feature.status === "coming_soon";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <label className={cn(
            "feature-card relative flex flex-col gap-2 rounded-xl border p-3 transition-all",
            "border-border bg-surface",
            isSelected && "border-primary bg-primary/5",
            !enabled && "opacity-40 cursor-not-allowed",
            feature.status === "coming_soon" && "border-dashed"
          )}>
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => enabled && onToggle(feature)}
                disabled={!enabled}
                className="mt-0.5 flex-shrink-0 h-4.5 w-4.5 rounded border-[1.5px] border-border bg-surface text-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-[12.5px] truncate">{feature.label}</h4>
                  {feature.status === "coming_soon" && (
                    <Badge tone="warning" className="text-[9.5px] h-4 px-1.5">
                      Sắp có
                    </Badge>
                  )}
                  {feature.needsApproval && (
                    <Badge tone="danger" className="text-[9.5px] h-4 px-1.5">
                      Cần duyệt
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-text-muted line-clamp-2">{feature.description}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="neutral" className="text-[9.5px] h-4 px-1.5">
                    {feature.aiCapability}
                  </Badge>
                  <Badge tone="neutral" className={cn("text-[9.5px] h-4 px-1.5", 
                    feature.privacyFloor === "SENSITIVE" && "border-red-200 text-red-600",
                    feature.privacyFloor === "SHOP" && "border-yellow-200 text-yellow-600",
                    feature.privacyFloor === "PUBLIC" && "border-green-200 text-green-600"
                  )}>
                    {feature.privacyFloor}
                  </Badge>
                  {feature.creditCost && (
                    <Badge tone="accent" className="text-[9.5px] h-4 px-1.5">
                      ~{feature.creditCost} cr
                    </Badge>
                  )}
                  {feature.requiresApprovedInput && (
                    <Badge tone="neutral" className="text-[9.5px] h-4 px-1.5">
                      Cần: {feature.requiresApprovedInput}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {!enabled && depCheck.reason && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 px-2.5 py-1.5 rounded-lg bg-warning-bg text-[10.5px] text-warning text-center">
                {depCheck.reason}
              </div>
            )}
          </label>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent side="top" align="center" className="max-w-xs p-2.5 text-[11px]">
            {!userCanRun && <p>❌ Bạn thiếu quyền: <code className="font-mono">{feature.rbacRun}</code></p>}
            {!depCheck.canRun && depCheck.reason && <p>⏸ {depCheck.reason}</p>}
            {feature.status === "coming_soon" && <p>🚧 Tính năng đang phát triển, chưa thể sử dụng</p>}
            {feature.creditCost && <p>💰 Chi phí ước tính: {feature.creditCost} credits (D14 placeholder)</p>}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

function featuresByModuleCount(groups: ModuleFeatureGroup[], selected: string[]): number {
  const modules = new Set<string>();
  for (const key of selected) {
    const f = FEATURE_CATALOG.find(x => x.key === key);
    if (f) modules.add(f.module);
  }
  return modules.size;
}