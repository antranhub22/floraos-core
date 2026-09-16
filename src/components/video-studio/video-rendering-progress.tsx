"use client";

import React, { useState, useEffect, useRef } from "react";
import { Film, CheckCircle2, AlertCircle, Clock, Sparkles, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VideoRenderingProgressProps {
  videoJobId: string;
  generationJobId?: string | null;
  onCompleted: () => void;
  onFailed: (error: string) => void;
  onRetry?: () => void;
}

const RENDER_STEPS = [
  { key: "prepare", label: "Tải tài nguyên Master Image & Âm thanh", minProgress: 15 },
  { key: "filter", label: "Khởi tạo bộ lọc chuyển cảnh mượt mà xfade", minProgress: 40 },
  { key: "render", label: "Mã hóa từng phân cảnh theo tỉ lệ khung hình", minProgress: 75 },
  { key: "mux", label: "Lồng tiếng, ghép nhạc nền & hoàn thiện MP4", minProgress: 100 },
];

export function VideoRenderingProgress({
  videoJobId,
  generationJobId,
  onCompleted,
  onFailed,
  onRetry,
}: VideoRenderingProgressProps) {
  const [progress, setProgress] = useState(12);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const completedRef = useRef(false);

  // Bộ đếm thời gian thực
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling trạng thái tiến độ từ server
  useEffect(() => {
    let isSubscribed = true;

    const checkStatus = async () => {
      if (completedRef.current) return;

      try {
        // 1. Kiểm tra video job
        const res = await fetch(`/api/v1/video/jobs/${videoJobId}`);
        if (!res.ok) return;
        const job = await res.json();

        if (!isSubscribed) return;

        if (job.stage === "RENDER_COMPLETED" || job.stage === "APPROVED") {
          completedRef.current = true;
          setProgress(100);
          setTimeout(() => {
            if (isSubscribed) onCompleted();
          }, 1200);
          return;
        }

        if (job.stage === "FAILED") {
          setIsFailed(true);
          setErrorMessage(job.error_message || "Tác vụ dựng video thất bại.");
          onFailed(job.error_message || "Tác vụ dựng video thất bại.");
          return;
        }

        // 2. Nếu có generationJobId, kiểm tra tiến độ chi tiết
        if (generationJobId) {
          const genRes = await fetch(`/api/v1/jobs/${generationJobId}`);
          if (genRes.ok) {
            const genData = await genRes.json();
            const genJob = genData.job;
            if (genJob?.status === "PROCESSING") {
              setProgress((prev) => Math.min(88, Math.max(prev, 35) + 3));
            }
          }
        } else {
          // Tăng tiến độ mượt mà giả lập trong lúc worker chạy ngầm
          setProgress((prev) => {
            if (prev < 40) return prev + 6;
            if (prev < 75) return prev + 3;
            if (prev < 90) return prev + 1;
            return prev;
          });
        }
      } catch (err) {
        console.error("Lỗi kiểm tra tiến độ video:", err);
      }
    };

    const interval = setInterval(checkStatus, 1800);
    void checkStatus();

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [videoJobId, generationJobId, onCompleted, onFailed]);

  // Derived state: Tính chỉ số phân đoạn và thông điệp tương ứng trực tiếp từ progress
  const currentStepIndex = progress < 25 ? 0 : progress < 60 ? 1 : progress < 90 ? 2 : 3;
  const statusText =
    progress < 25
      ? "Đang chuẩn bị hình ảnh Master Image & âm thanh nền..."
      : progress < 60
      ? "Khởi tạo hiệu ứng chuyển cảnh và xử lý tỉ lệ khung hình..."
      : progress < 90
      ? "Đang ghép các phân cảnh và tối ưu chất lượng hình ảnh..."
      : "Đang hoàn tất lồng tiếng, hòa âm và xuất bản tệp MP4...";

  if (isFailed) {
    return (
      <Card className="p-6 bg-surface border-destructive/30 border-2 rounded-2xl flex flex-col items-center gap-4 text-center max-w-lg mx-auto shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={28} />
        </div>
        <div>
          <h3 className="text-base font-bold text-text">Dựng video thất bại</h3>
          <p className="mt-1 text-xs text-text-muted leading-relaxed max-w-sm">
            {errorMessage || "Hệ thống gặp sự cố trong quá trình mã hóa video. Hạn mức credit chưa bị trừ."}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="secondary" className="gap-2 mt-2">
            <RotateCcw size={15} /> Thử lại tác vụ
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-surface border border-border rounded-2xl flex flex-col gap-6 max-w-2xl w-full mx-auto shadow-sm">
      {/* Header trạng thái */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary animate-spin">
            <Film size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-text">Đang sản xuất video marketing</h3>
              <Badge tone="warning" className="animate-pulse text-[10px]">
                Xử lý nền
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{statusText}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-primary">{Math.round(progress)}%</span>
          <div className="flex items-center gap-1 text-[11px] text-text-muted justify-end mt-0.5">
            <Clock size={11} /> Đã chạy {elapsedSeconds}s
          </div>
        </div>
      </div>

      {/* Thanh tiến độ động */}
      <div className="flex flex-col gap-1.5">
        <Progress value={progress} className="h-2.5 bg-surface-alt rounded-full overflow-hidden" />
        <div className="flex items-center justify-between text-[11px] text-text-muted px-0.5">
          <span>0% Bắt đầu</span>
          <span>Ước tính còn ~{Math.max(5, 30 - elapsedSeconds)} giây</span>
          <span>100% Hoàn tất</span>
        </div>
      </div>

      {/* Danh sách 4 bước phân kỳ (Progression Timeline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
        {RENDER_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={step.key}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 font-semibold text-text shadow-xs"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                  : "border-border/50 bg-background text-text-muted opacity-60"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 size={15} className="text-emerald-600" />
                ) : isCurrent ? (
                  <Sparkles size={15} className="text-primary animate-pulse" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-border" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[11px]">Bước {idx + 1}</span>
                <span className="leading-snug text-[11.5px]">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
