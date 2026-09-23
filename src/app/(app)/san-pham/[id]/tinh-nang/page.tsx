"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FeaturePicker } from "@/components/dashboard/FeaturePicker";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface ProductData {
  id: string;
  name: string;
  status: string;
  hasApprovedAnalysis: boolean;
  hasApprovedMasterImage: boolean;
  masterImageId?: string | undefined;
  creditBalance: number;
}

export default function ProductFeatureDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { capabilities } = useSession();
  
  const productId = params.id as string;
  const returnTo = searchParams.get("return") ?? "/san-pham";

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobsCreated, setJobsCreated] = useState<Array<{ jobId: string; feature: string; module: string }> | null>(null);
  const [monitoringJobs, setMonitoringJobs] = useState(false);

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        // Fetch product basic info
        const productRes = await fetch(`/api/v1/products/${productId}`);
        if (!productRes.ok) throw new Error("Không tìm thấy sản phẩm");
        const productData = await productRes.json();

        // Check approved analysis
        const analysisRes = await fetch(`/api/v1/vision/analyses?product_id=${productId}&approval_state=APPROVED&limit=1`);
        let hasApprovedAnalysis = false;
        if (analysisRes.ok) {
          const { data } = await analysisRes.json();
          hasApprovedAnalysis = data.length > 0;
        }

        // Check approved master image (M04a)
        const masterImageRes = await fetch(`/api/v1/integration/products/${productId}/master-image`);
        const hasApprovedMasterImage = masterImageRes.ok;
        let masterImageId: string | undefined;
        if (hasApprovedMasterImage) {
          const masterData = await masterImageRes.json();
          masterImageId = masterData.asset_id;
        }

        // Get credit balance (from usage summary)
        const usageRes = await fetch("/api/v1/usage/summary");
        let creditBalance = 0;
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          creditBalance = usageData.balance ?? 0;
        }

        setProduct({
          id: productData.id,
          name: productData.name,
          status: productData.status,
          hasApprovedAnalysis,
          hasApprovedMasterImage,
          masterImageId,
          creditBalance,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi khi tải dữ liệu sản phẩm");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  // Handle jobs created from FeaturePicker
  const handleJobsCreated = (jobs: Array<{ jobId: string; feature: string; module: string }>) => {
    setJobsCreated(jobs);
    setMonitoringJobs(true);
  };

  const handleError = (err: string) => {
    setError(err);
  };

  const handleClose = () => {
    setJobsCreated(null);
    setMonitoringJobs(false);
  };

  const handleRetry = () => {
    setError(null);
    router.refresh();
  };

const handleMonitorJobs = () => {
    if (jobsCreated && jobsCreated.length > 0) {
      const jobId = jobsCreated[0]!.jobId;
      // Navigate to jobs list with filter
      router.push(("/job?job_id=" + jobId) as any);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-text-muted">Đang tải sản phẩm…</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg">
          <AlertCircle size={32} strokeWidth={1.8} className="text-danger" />
        </div>
        <h2 className="text-[17px] font-bold">Không tải được sản phẩm</h2>
        <p className="text-text-muted max-w-xs">{error}</p>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={handleRetry}>
            <RefreshCw size={15} strokeWidth={2} /> Thử lại
          </Button>
          <Button variant="ghost" onClick={() => router.push((returnTo ?? "/san-pham") as any)}>
            <ArrowLeft size={15} strokeWidth={2} /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // Show job creation success
  if (jobsCreated && jobsCreated.length > 0 && !monitoringJobs) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
          <CheckCircle2 size={32} strokeWidth={1.8} className="text-primary" />
        </div>
        <h2 className="text-[17px] font-bold">Đã tạo {jobsCreated.length} tác vụ</h2>
        <p className="text-text-muted max-w-xs">
          Tác vụ đang chạy trong hàng đợi. Bạn có thể theo dõi tiến trình hoặc quay lại sau.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {jobsCreated.map((job, i) => (
            <div key={job.jobId} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-left">
              <div className="flex items-center gap-2">
                <Badge tone="neutral" className="text-[10.5px]">{job.module}</Badge>
                <span className="font-mono text-[11px] text-text-muted truncate max-w-[200px]">{job.jobId.slice(0, 8)}…</span>
              </div>
              <Badge tone={job.feature.includes("vision") ? "success" : "neutral"} className="text-[10.5px]">
                {job.feature}
              </Badge>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleMonitorJobs}>
            <Loader2 size={15} strokeWidth={2} /> Theo dõi tiến trình
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            <ArrowLeft size={15} strokeWidth={2} /> Quay lại chọn thêm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push((returnTo ?? "/san-pham") as any)}>
            <ArrowLeft size={20} strokeWidth={2} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-[17px] font-extrabold text-primary">{product.name}</div>
              <Badge tone={product.status === "ACTIVE" ? "success" : "neutral"} className="text-[10.5px]">
                {product.status}
              </Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-text-muted">
              <span>ID: <code className="font-mono">{product.id.slice(0, 8)}…</code></span>
              <Separator orientation="vertical" className="h-3" />
              <span className="flex items-center gap-1">
                <Info size={12} strokeWidth={1.8} />
                Credit: <strong>{product.creditBalance}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.refresh()}>
            <RefreshCw size={18} strokeWidth={2} className={cn("text-text-muted", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Prerequisites Status */}
      <div className="flex flex-shrink-0 gap-3 border-b border-border bg-surface/50 px-[18px] py-3">
        <PrerequisiteBadge
          label="Phân tích ảnh (M01)"
          ready={product.hasApprovedAnalysis}
          icon={product.hasApprovedAnalysis ? CheckCircle2 : AlertCircle}
          description={product.hasApprovedAnalysis ? "Đã duyệt — có thể chạy M01b, M04a" : "Chưa duyệt — cần phân tích và duyệt trước"}
        />
        <PrerequisiteBadge
          label="Master Image (M04a)"
          ready={product.hasApprovedMasterImage}
          icon={product.hasApprovedMasterImage ? CheckCircle2 : AlertCircle}
          description={product.hasApprovedMasterImage ? "Đã duyệt — có thể chạy Creative, Video, Content" : "Chưa duyệt — cần chạy M04a và duyệt trước"}
        />
      </div>

      {/* Feature Picker */}
      <div className="flex-1 overflow-hidden">
        {product.hasApprovedAnalysis ? (
          <FeaturePicker
            productId={product.id}
            productName={product.name}
            hasApprovedAnalysis={product.hasApprovedAnalysis}
            hasApprovedMasterImage={product.hasApprovedMasterImage}
            masterImageId={product.masterImageId}
            userCreditBalance={product.creditBalance}
            onJobsCreated={handleJobsCreated}
            onError={handleError}
            onClose={handleClose}
          />
        ) : (
          <EmptyState
            title="Cần phân tích ảnh trước"
            description="Sản phẩm này chưa có kết quả phân tích ảnh được duyệt. Hãy chạy Phân tích ảnh (M01) và duyệt kết quả trước khi sử dụng các tính năng AI khác."
            actionLabel="Đi đến Phân tích ảnh"
            onAction={() => router.push(("/tai-anh?product_id=" + productId + "&return=" + encodeURIComponent(window.location.pathname)) as any)}
          />
        )}
      </div>
    </div>
  );
}

function PrerequisiteBadge({
  label,
  ready,
  icon: Icon,
  description,
}: {
  label: string;
  ready: boolean;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  description: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 transition-colors",
            ready ? "bg-success-bg" : "bg-warning-bg"
          )}>
            <Icon 
              size={16} 
              strokeWidth={1.8} 
              className={cn(ready ? "text-primary" : "text-warning")} 
            />
            <span className={cn("font-medium text-[12.5px]", ready ? "text-primary" : "text-warning")}>
              {label}
            </span>
            <span className={cn("text-[10.5px] font-bold", ready ? "text-primary" : "text-warning")}>
              {ready ? "✓ Sẵn sàng" : "⏳ Chờ"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="max-w-xs p-2.5 text-[11px]">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-alt">
        <Info size={40} strokeWidth={1.5} className="text-text-muted" />
      </div>
      <div className="max-w-md">
        <h2 className="text-[17px] font-bold">{title}</h2>
        <p className="mt-2 text-text-muted">{description}</p>
      </div>
      <Button onClick={onAction} className="w-full max-w-sm">
        <ArrowLeft size={15} strokeWidth={2} className="mr-2" />
        {actionLabel}
      </Button>
    </div>
  );
}