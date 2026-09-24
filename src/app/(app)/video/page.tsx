"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Film,
  Sparkles,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Check,
  ChevronLeft,
} from "lucide-react";
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VideoJobList, VideoJobSummary } from "@/components/video-studio/video-job-list";
import { VideoCreateModal } from "@/components/video-studio/video-create-modal";
import { StoryboardEditor } from "@/components/video-studio/storyboard-editor";
import { VideoRenderingProgress } from "@/components/video-studio/video-rendering-progress";
import { VideoPlayerCard } from "@/components/templates/video-studio/video-player-card";
import { VideoFormat, VideoSceneItem, CaptionStyle } from "@/modules/video-studio/domain/video-types";

interface VideoJobDetail extends VideoJobSummary {
  aspect_ratio: string;
  /** URL ký có hạn để phát video (24/09/2026) — `final_video_url` thô không mở được. */
  final_video_view_url?: string | null;
  scenes: Array<{
    scene_index: number;
    duration_seconds: number;
    image_asset_id?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    text_overlay?: string | null;
    voice_script?: string | null;
    transition_effect?: VideoSceneItem["transitionEffect"];
  }>;
}

export default function VideoStudioPage() {
  const [jobs, setJobs] = useState<VideoJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<VideoJobDetail | null>(null);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Tải danh sách video jobs thật từ API
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/video/jobs");
      if (res.ok) {
        const json = await res.json();
        setJobs(json.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải video jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/video/jobs")
      .then((res) => res.json())
      .then((json) => {
        if (active) {
          setJobs(json.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Tải chi tiết job khi được chọn
  const fetchJobDetail = useCallback(async (id: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/v1/video/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveJob(data);
        setActiveJobId(id);
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết job:", err);
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Đang render: đọc lại mỗi 3 giây tới khi xong/lỗi (24/09/2026 — trước đây
  // phải tự bấm lại mới thấy kết quả).
  useEffect(() => {
    if (!activeJobId || activeJob?.stage !== "RENDERING") return;
    const t = window.setTimeout(() => void fetchJobDetail(activeJobId), 3000);
    return () => window.clearTimeout(t);
  }, [activeJobId, activeJob, fetchJobDetail]);

  // Xử lý tạo job mới
  const handleCreateJob = async (data: {
    title: string;
    format: VideoFormat;
    musicTrack?: string | undefined;
    voiceCode?: string | undefined;
    captionStyle?: CaptionStyle | undefined;
  }) => {
    const res = await fetch("/api/v1/video/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Tạo video thất bại");
    }

    const created = await res.json();
    await fetchJobs();
    await fetchJobDetail(created.id);
  };

  // Cập nhật kịch bản phân cảnh
  const handleSaveScenes = async (scenes: VideoSceneItem[]) => {
    if (!activeJobId) return;
    const res = await fetch(`/api/v1/video/jobs/${activeJobId}/storyboard`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Cập nhật kịch bản thất bại");
    }

    const updated = await res.json();
    setActiveJob(updated);
  };

  // Cổng duyệt 1: Phê duyệt kịch bản
  const handleApproveScript = async () => {
    if (!activeJobId) return;
    setActionLoading(true);
    setActionMessage("Đang phê duyệt kịch bản (Cổng 1)...");
    try {
      const res = await fetch(`/api/v1/video/jobs/${activeJobId}/approve-script`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Phê duyệt kịch bản thất bại");
        return;
      }
      const approved = await res.json();
      setActiveJob(approved);
      void fetchJobDetail(approved.id);
      await fetchJobs();
    } finally {
      setActionLoading(false);
      setActionMessage(null);
    }
  };

  // Kích hoạt tác vụ render video
  const handleDispatchRender = async () => {
    if (!activeJobId) return;
    setActionLoading(true);
    setActionMessage("Đang kích hoạt tác vụ dựng video...");
    try {
      const res = await fetch(`/api/v1/video/jobs/${activeJobId}/render`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Không thể kích hoạt dựng video");
        return;
      }
      const data = await res.json();
      setActiveJob(data.videoJob);
      void fetchJobDetail(data.videoJob.id);
      setGenerationJobId(data.generationJobId);
      await fetchJobs();
    } finally {
      setActionLoading(false);
      setActionMessage(null);
    }
  };

  // Cổng duyệt 2: Phê duyệt video thành phẩm
  const handleApproveVideo = async () => {
    if (!activeJobId) return;
    setActionLoading(true);
    setActionMessage("Đang chốt duyệt video chính thức (Cổng 2)...");
    try {
      const res = await fetch(`/api/v1/video/jobs/${activeJobId}/approve-video`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Chốt duyệt video thất bại");
        return;
      }
      const approved = await res.json();
      setActiveJob(approved);
      void fetchJobDetail(approved.id);
      await fetchJobs();
    } finally {
      setActionLoading(false);
      setActionMessage(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Standardized Header & Top-Right Action Header ───────────────── */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          {activeJobId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveJobId(null);
                setActiveJob(null);
              }}
              className="gap-1.5"
            >
              <ChevronLeft size={16} /> Danh sách
            </Button>
          ) : (
            <div>
              <div className="text-xs text-text-muted font-bold tracking-wider uppercase">M04c Marketing Studio</div>
              <div className="text-[18px] font-extrabold text-primary flex items-center gap-2">
                <Film size={20} /> AI Video Studio
              </div>
            </div>
          )}
        </div>

        {/* Khối nút tác vụ góc trên bên phải (Standardized Tab Action Header) */}
        <div className="flex items-center gap-2">
          {!activeJobId ? (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-xs">
              <Sparkles size={16} /> Tạo video mới
            </Button>
          ) : (
            <>
              {/* Tác vụ theo trạng thái của job đang chọn */}
              {(activeJob?.stage === "SCRIPT_READY" || activeJob?.stage === "DRAFT") && activeJob?.script_approval !== "APPROVED" && (
                <Button
                  onClick={handleApproveScript}
                  disabled={actionLoading}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle2 size={16} /> Chốt duyệt kịch bản (Cổng 1)
                </Button>
              )}

              {activeJob?.script_approval === "APPROVED" && activeJob?.stage !== "RENDERING" && activeJob?.stage !== "RENDER_COMPLETED" && activeJob?.stage !== "APPROVED" && (
                <Button
                  onClick={handleDispatchRender}
                  disabled={actionLoading}
                  className="gap-2 shadow-xs"
                >
                  <Play size={16} /> Dựng video
                </Button>
              )}

              {activeJob?.stage === "RENDER_COMPLETED" && activeJob?.video_approval !== "APPROVED" && (
                <Button
                  onClick={handleApproveVideo}
                  disabled={actionLoading}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle2 size={16} /> Chốt duyệt video (Cổng 2)
                </Button>
              )}

              {activeJob?.video_approval === "APPROVED" && (
                <Badge tone="success" className="gap-1 px-3 py-1 text-xs">
                  <Check size={14} /> Video đã chốt duyệt
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchJobDetail(activeJobId)}
                disabled={actionLoading}
                className="gap-1.5"
              >
                <RotateCcw size={14} className={actionLoading ? "animate-spin" : ""} />
                Làm mới
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-6xl w-full mx-auto">
        {/* Khối hướng dẫn chuẩn hóa (Standardized Feature Guidance Callout) */}
        <FeatureGuidanceCard
          badgeLabel="HƯỚNG DẪN DỰNG VIDEO M04c"
          title="Quy trình 2 cổng duyệt dựng video thương mại"
          description="Dựng video ngắn (Reel, TikTok, Story, Slideshow) từ Master Image đã duyệt. Tuân thủ 2 cổng kiểm soát chất lượng: Duyệt Kịch bản trước khi render -> Duyệt Video thành phẩm trước khi xuất bản."
          tips={[
            "📸 Khung hình đầu và cuối luôn được khóa vào Master Image đã duyệt",
            "⚡ Cổng 1: Duyệt kịch bản phân cảnh trước để không phát sinh chi phí render thừa",
            "🎯 Slideshow FFmpeg nội bộ chi phí $0 credit; Veo/HeyGen trừ credit theo thời lượng",
            "✨ Cổng 2: Chốt duyệt video thành phẩm để tự động lưu vào Kho Asset và Catalog",
          ]}
          maxWidthClassName="max-w-4xl"
        />

        {/* Trạng thái xử lý toàn cục */}
        {actionMessage && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-xl p-3 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
            <Clock size={16} /> {actionMessage}
          </div>
        )}

        {/* 1. Màn hình danh sách video */}
        {!activeJobId && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text">Dự án Video của cửa hàng</h2>
              <span className="text-xs text-text-muted">{jobs.length} video đã tạo</span>
            </div>
            <VideoJobList
              jobs={jobs}
              loading={loading}
              onSelectJob={(id) => fetchJobDetail(id)}
              onCreateNew={() => setIsCreateModalOpen(true)}
            />
          </div>
        )}

        {/* 2. Màn hình chi tiết dự án & Kịch bản (Storyboard Editor) */}
        {activeJobId && activeJob && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái & giữa: Storyboard Editor */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <Card className="p-4 bg-surface border border-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-text">{activeJob.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge tone="neutral">{activeJob.format}</Badge>
                    <span className="text-xs text-text-muted">
                      Tỉ lệ: {activeJob.aspect_ratio} • {activeJob.duration_seconds}s
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted block">Hạn mức dự toán</span>
                  <span className="text-sm font-extrabold text-amber-600">{activeJob.cost_credits} credits</span>
                </div>
              </Card>

              {/* Khi đang render: Hiển thị thanh tiến độ sinh động (Progression) */}
              {activeJob.stage === "RENDERING" && (
                <VideoRenderingProgress
                  videoJobId={activeJob.id}
                  generationJobId={generationJobId}
                  onCompleted={async () => {
                    await fetchJobs();
                    await fetchJobDetail(activeJob.id);
                  }}
                  onFailed={(err) => {
                    setActionMessage(`Tác vụ dựng video tạm dừng: ${err}`);
                  }}
                  onRetry={handleDispatchRender}
                />
              )}

              {/* Bộ biên soạn phân cảnh Storyboard */}
              <StoryboardEditor
                format={activeJob.format as VideoFormat}
                initialScenes={activeJob.scenes?.map((s) => ({
                  sceneIndex: s.scene_index,
                  durationSeconds: s.duration_seconds,
                  imageAssetId: s.image_asset_id,
                  imageUrl: s.imageUrl || s.image_url || (s.image_asset_id?.startsWith("http") ? s.image_asset_id : undefined),
                  textOverlay: s.text_overlay,
                  voiceScript: s.voice_script,
                  transitionEffect: s.transition_effect,
                })) || []}
                isLocked={activeJob.script_approval === "APPROVED" || activeJob.stage === "RENDERING"}
                onSaveScenes={handleSaveScenes}
              />
            </div>

            {/* Cột phải: Video Preview / Status Card */}
            <div className="flex flex-col gap-4">
              <VideoPlayerCard
                title={activeJob.title}
                videoUrl={activeJob.final_video_view_url || undefined}
                posterUrl={
                  activeJob.scenes?.[0]?.imageUrl ||
                  activeJob.scenes?.[0]?.image_url ||
                  (activeJob.scenes?.[0]?.image_asset_id?.startsWith("http") ? activeJob.scenes?.[0]?.image_asset_id : undefined) ||
                  undefined
                }
                productName={activeJob.title}
                price={activeJob.cost_credits ? `${activeJob.cost_credits} credits` : "0 credit"}
                onDownload={() => {
                  if (activeJob.final_video_view_url) {
                    window.open(activeJob.final_video_view_url, "_blank");
                  } else {
                    alert("Video đang chờ render, vui lòng quay lại sau.");
                  }
                }}
                onShare={() => {
                  // Trước đây báo "đã sao chép" mà không sao chép gì.
                  if (activeJob.final_video_view_url) {
                    void navigator.clipboard.writeText(new URL(activeJob.final_video_view_url, window.location.origin).toString());
                    alert("Đã sao chép liên kết video (có hạn 1 giờ).");
                  } else {
                    alert("Video chưa render xong — chưa có liên kết để chia sẻ.");
                  }
                }}
              />

              {/* Hộp thông tin tiến độ render */}
              <Card className="p-4 bg-surface border border-border flex flex-col gap-3 text-xs">
                <span className="font-bold text-text">Tiến độ quy trình 2 cổng duyệt:</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Cổng 1 (Duyệt kịch bản):</span>
                    <Badge tone={activeJob.script_approval === "APPROVED" ? "success" : "warning"}>
                      {activeJob.script_approval === "APPROVED" ? "Đã duyệt" : "Chưa duyệt"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Trạng thái Render:</span>
                    <Badge tone={activeJob.stage === "RENDER_COMPLETED" || activeJob.stage === "APPROVED" ? "success" : "neutral"}>
                      {activeJob.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Cổng 2 (Duyệt video):</span>
                    <Badge tone={activeJob.video_approval === "APPROVED" ? "success" : "warning"}>
                      {activeJob.video_approval === "APPROVED" ? "Đã duyệt" : "Chờ chốt"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal khởi tạo video mới */}
      <VideoCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJob}
      />
    </div>
  );
}
