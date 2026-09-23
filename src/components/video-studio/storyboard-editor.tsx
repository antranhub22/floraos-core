"use client";

import React, { useEffect, useState } from "react";
import { Clock, Plus, Trash2, AlertTriangle, Sparkles, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoSceneItem, VideoFormat, VIDEO_FORMAT_SPECS, VideoMotionEffect, VIDEO_MOTION_SPECS } from "@/modules/video-studio/domain/video-types";
import { validateStoryboard } from "@/modules/video-studio/domain/video-storyboard";

const DEFAULT_FLOWER_IMAGES = [
  "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&auto=format&fit=crop&q=80",
];

const DEFAULT_MOTIONS: VideoMotionEffect[] = ["ZOOM_IN", "PAN_RIGHT", "ZOOM_OUT", "PAN_UP"];

interface StoryboardEditorProps {
  format: VideoFormat;
  initialScenes: VideoSceneItem[];
  isLocked?: boolean;
  onSaveScenes: (scenes: VideoSceneItem[]) => Promise<void>;
  /** Báo mọi thay đổi cho cha (23/09/2026) — Creative Studio Khu vực E gửi
   *  đúng storyboard đang thấy, không phải bản cũ trước khi bấm "Lưu". */
  onChange?: ((scenes: VideoSceneItem[]) => void) | undefined;
}

export function StoryboardEditor({
  format,
  initialScenes,
  isLocked = false,
  onSaveScenes,
  onChange,
}: StoryboardEditorProps) {
  const [scenes, setScenes] = useState<VideoSceneItem[]>(
    initialScenes.length > 0
      ? initialScenes
      : [
          {
            sceneIndex: 1,
            durationSeconds: 3.5,
            imageUrl: DEFAULT_FLOWER_IMAGES[0],
            textOverlay: "Hoa tươi ngát hương đón ngày mới",
            voiceScript: "Mỗi đóa hoa được chọn lựa thủ công từ sáng sớm",
            transitionEffect: "fade",
            motionEffect: "ZOOM_IN",
          },
          {
            sceneIndex: 2,
            durationSeconds: 3.5,
            imageUrl: DEFAULT_FLOWER_IMAGES[1],
            textOverlay: "Nghệ thuật cắm hoa tỉ mỉ",
            voiceScript: "Thiết kế sang trọng phù hợp mọi dịp kỷ niệm",
            transitionEffect: "slide_left",
            motionEffect: "PAN_RIGHT",
          },
          {
            sceneIndex: 3,
            durationSeconds: 4.0,
            imageUrl: DEFAULT_FLOWER_IMAGES[2],
            textOverlay: "Giao tận tay trong 2 giờ",
            voiceScript: "Đặt ngay hôm nay để nhận thiệp chúc mừng ý nghĩa",
            transitionEffect: "fade",
            motionEffect: "ZOOM_OUT",
          },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    onChange?.(scenes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes]);

  const spec = VIDEO_FORMAT_SPECS[format];
  const validation = validateStoryboard(scenes, format);

  const handleUpdateScene = <K extends keyof VideoSceneItem>(
    index: number,
    field: K,
    value: VideoSceneItem[K]
  ) => {
    if (isLocked) return;
    setSavedSuccess(false);
    const updated = [...scenes];
    updated[index] = { ...updated[index]!, [field]: value };
    setScenes(updated);
  };

  const handleAddScene = () => {
    if (isLocked) return;
    setSavedSuccess(false);
    const newCount = scenes.length + 1;
    const target = spec?.targetDurationSeconds || 30;
    const perSec = Math.max(1.5, Math.round((target / newCount) * 10) / 10);
    const updated = scenes.map((s) => ({ ...s, durationSeconds: perSec }));
    setScenes([
      ...updated,
      {
        sceneIndex: newCount,
        durationSeconds: Math.max(1.0, Math.round((target - perSec * (newCount - 1)) * 10) / 10),
        textOverlay: "Phân cảnh mới",
        voiceScript: "Lời thoại mô tả nét đẹp của hoa",
        transitionEffect: "fade",
        motionEffect: DEFAULT_MOTIONS[(newCount - 1) % DEFAULT_MOTIONS.length]!,
      },
    ]);
  };

  const handleRemoveScene = (index: number) => {
    if (isLocked || scenes.length <= 1) return;
    setSavedSuccess(false);
    const filtered = scenes.filter((_, idx) => idx !== index);
    const newCount = filtered.length;
    const target = spec?.targetDurationSeconds || 30;
    const perSec = Math.max(1.5, Math.round((target / newCount) * 10) / 10);
    setScenes(
      filtered.map((s, idx) => ({
        ...s,
        sceneIndex: idx + 1,
        durationSeconds:
          idx === newCount - 1
            ? Math.max(1.0, Math.round((target - perSec * (newCount - 1)) * 10) / 10)
            : perSec,
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveScenes(scenes);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header trạng thái kịch bản */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border">
        <div>
          <h3 className="text-sm font-bold text-text">Kịch bản phân cảnh chi tiết (Storyboard)</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Phân rã trường nguyên tử: chỉnh sửa độc lập văn bản, phụ đề, thời lượng và hiệu ứng từng cảnh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={validation.isValid ? "success" : "warning"} className="gap-1">
            <Clock size={12} />
            Tổng thời lượng: {validation.totalDurationSeconds}s / {spec?.targetDurationSeconds}s
          </Badge>
          <Badge tone="neutral">{scenes.length} phân cảnh</Badge>
        </div>
      </div>

      {/* Cảnh báo nếu kịch bản chưa hợp lệ */}
      {!validation.isValid && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Cần điều chỉnh kịch bản:</span>
            {validation.errors.map((err, i) => (
              <span key={i}>• {err}</span>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách các cảnh */}
      <div className="flex flex-col gap-3">
        {scenes.map((scene, idx) => (
          <Card key={idx} className="border border-border p-4 bg-background flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  #{idx + 1}
                </span>
                <span className="text-xs font-bold text-text">Phân cảnh {idx + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <Clock size={12} className="text-text-muted" />
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="15"
                    disabled={isLocked}
                    value={scene.durationSeconds}
                    onChange={(e) => handleUpdateScene(idx, "durationSeconds", parseFloat(e.target.value) || 1.0)}
                    className="w-14 rounded border border-border px-1.5 py-0.5 text-xs text-center font-bold focus:border-primary focus:outline-none disabled:bg-muted"
                  />
                  <span className="text-text-muted">giây</span>
                </div>
                {!isLocked && scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveScene(idx)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0"
                    title={`Xóa phân cảnh #${idx + 1}`}
                  >
                    <Trash2 size={13} />
                    <span>Xóa cảnh</span>
                  </button>
                )}
              </div>
            </div>

            {/* Khối Ảnh phân cảnh (Master Image Preview & Selector) */}
            <div className="flex items-center gap-3 bg-surface-alt/60 p-2.5 rounded-lg border border-border">
              <div className="relative aspect-[9/16] w-12 shrink-0 rounded-md overflow-hidden bg-black/10 border border-border shadow-xs">
                <img
                  src={scene.imageUrl || DEFAULT_FLOWER_IMAGES[idx % DEFAULT_FLOWER_IMAGES.length]}
                  alt={`Phân cảnh ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <label className="text-[11px] font-bold text-text flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-primary" /> Hình ảnh phân cảnh (Master Image)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isLocked}
                    value={scene.imageUrl || ""}
                    onChange={(e) => handleUpdateScene(idx, "imageUrl", e.target.value)}
                    placeholder="Nhập liên kết ảnh hoặc chọn ảnh mẫu hoa bên cạnh..."
                    className="flex-1 rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:bg-muted font-mono text-[11px]"
                  />
                  {!isLocked && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateScene(idx, "imageUrl", e.target.value);
                        }
                      }}
                      className="rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none shrink-0"
                    >
                      <option value="">Chọn mẫu hoa</option>
                      <option value="https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80">🌹 Bó hồng đỏ lãng mạn</option>
                      <option value="https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800&auto=format&fit=crop&q=80">🌷 Bó tulip pastel nhẹ nhàng</option>
                      <option value="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80">🌻 Giỏ hướng dương rạng rỡ</option>
                      <option value="https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&auto=format&fit=crop&q=80">🤍 Bó baby trắng tinh khôi</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Trường Chữ hiển thị / Phụ đề */}
              <div>
                <label className="text-[11px] font-semibold text-text-muted block mb-1">
                  Phụ đề hiển thị (Caption)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={scene.textOverlay || ""}
                  onChange={(e) => handleUpdateScene(idx, "textOverlay", e.target.value)}
                  placeholder="Nhập chữ phụ đề ngắn..."
                  className="w-full rounded-md border border-border px-3 py-1.5 text-xs focus:border-primary focus:outline-none disabled:bg-muted font-medium"
                />
              </div>

              {/* Chuyển động máy quay điện ảnh */}
              <div>
                <label className="text-[11px] font-semibold text-text-muted block mb-1">
                  Chuyển động máy quay (Camera)
                </label>
                <select
                  disabled={isLocked}
                  value={scene.motionEffect || "ZOOM_IN"}
                  onChange={(e) => handleUpdateScene(idx, "motionEffect", e.target.value as VideoMotionEffect)}
                  className="w-full rounded-md border border-emerald-200 bg-emerald-50/40 text-emerald-800 px-2.5 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none disabled:bg-muted"
                >
                  {Object.values(VIDEO_MOTION_SPECS).map((m) => (
                    <option key={m.motion} value={m.motion}>
                      🎬 {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hiệu ứng chuyển cảnh */}
              <div>
                <label className="text-[11px] font-semibold text-text-muted block mb-1">
                  Chuyển cảnh (Transition)
                </label>
                <select
                  disabled={isLocked}
                  value={scene.transitionEffect || "fade"}
                  onChange={(e) => handleUpdateScene(idx, "transitionEffect", e.target.value as VideoSceneItem["transitionEffect"])}
                  className="w-full rounded-md border border-border px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none disabled:bg-muted"
                >
                  <option value="fade">Mờ dần (Fade)</option>
                  <option value="slide_left">Trượt trái (Slide Left)</option>
                  <option value="slide_right">Trượt phải (Slide Right)</option>
                  <option value="zoom_in">Phóng to (Zoom In)</option>
                  <option value="zoom_out">Thu nhỏ (Zoom Out)</option>
                  <option value="dissolve">Hòa tan (Dissolve)</option>
                </select>
              </div>

              {/* Lời thoại đọc voiceover */}
              <div className="md:col-span-3">
                <label className="text-[11px] font-semibold text-text-muted block mb-1">
                  Lời thoại lồng tiếng AI (Voiceover Script)
                </label>
                <textarea
                  rows={2}
                  disabled={isLocked}
                  value={scene.voiceScript || ""}
                  onChange={(e) => handleUpdateScene(idx, "voiceScript", e.target.value)}
                  placeholder="Nhập kịch bản cho giọng đọc AI..."
                  className="w-full rounded-md border border-border px-3 py-1.5 text-xs focus:border-primary focus:outline-none disabled:bg-muted resize-none leading-relaxed"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Thanh tác vụ dưới kịch bản */}
      <div className="flex items-center justify-between pt-2">
        {!isLocked && (
          <Button variant="secondary" size="sm" onClick={handleAddScene} className="gap-1.5">
            <Plus size={14} /> Thêm phân cảnh
          </Button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check size={14} /> Đã lưu kịch bản
            </span>
          )}
          {!isLocked && (
            <Button size="sm" onClick={handleSave} disabled={saving || !validation.isValid} className="gap-1.5">
              <Sparkles size={14} />
              {saving ? "Đang lưu..." : "Lưu kịch bản"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
