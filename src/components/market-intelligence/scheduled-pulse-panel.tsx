"use client";

import React, { useState } from "react";
import {
  Clock,
  Settings,
  Bell,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Flame,
  Shield,
  History,
} from "lucide-react";
import type { RunItem } from "./research-runs-table";

/** Cấu hình lịch quét xu hướng định kỳ của tiệm, gửi lên khi bấm lưu. */
export interface TenantPulseScheduleConfig {
  enabled: boolean;
  dailyExecutionTime: string;
  trackedTopics: string[];
  notifyChannels: Array<"IN_APP_COPILOT" | "EMAIL">;
}

interface ScheduledPulsePanelProps {
  runs: RunItem[];
  isSaaSAdmin: boolean;
  onSaveTenantSchedule?: (config: TenantPulseScheduleConfig) => Promise<void>;
}

export function ScheduledPulsePanel({
  runs,
  isSaaSAdmin,
  onSaveTenantSchedule,
}: ScheduledPulsePanelProps) {
  const [scheduleTime, setScheduleTime] = useState("06:30");
  const [isEnabled, setIsEnabled] = useState(true);
  const [trackedKeywords, setTrackedKeywords] = useState<string[]>([
    "Hoa tulip pastel",
    "Bó hoa tốt nghiệp Hàn Quốc",
    "Lan hồ điệp khai trương",
  ]);
  const [newKeyword, setNewKeyword] = useState("");
  const [notifyCopilot, setNotifyCopilot] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !trackedKeywords.includes(trimmed) && trackedKeywords.length < 10) {
      setTrackedKeywords([...trackedKeywords, trimmed]);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setTrackedKeywords(trackedKeywords.filter((k) => k !== kw));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveTenantSchedule) {
      await onSaveTenantSchedule({
        enabled: isEnabled,
        dailyExecutionTime: scheduleTime,
        trackedTopics: trackedKeywords,
        notifyChannels: [
          notifyCopilot ? "IN_APP_COPILOT" : null,
          notifyEmail ? "EMAIL" : null,
        ].filter((c): c is "IN_APP_COPILOT" | "EMAIL" => c !== null),
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Khu vực Thiết lập Lịch Quét Tự Động */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-sm">
                  {isSaaSAdmin
                    ? "Cấu hình lịch quét cho từng cửa hàng"
                    : "Lịch quét sáng của tiệm"}
                </h3>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  {isEnabled ? "Đang kích hoạt" : "Đã tạm dừng"}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {isSaaSAdmin
                  ? "Điều phối cron job toàn hệ thống và thiết lập lịch quét riêng cho từng cửa hàng"
                  : "Mỗi sáng AI tự động quét thị trường theo danh mục hoa của tiệm và gửi bản tin tóm tắt lúc mở cửa"}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-rose-600"
            />
            Bật tự động quét mỗi ngày
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Giờ quét */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-600" />
                Giờ quét tự động mỗi sáng
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-xs font-semibold text-stone-900 outline-none focus:border-rose-500 focus:bg-white transition"
              />
              <span className="text-[10px] text-stone-400 block">
                Khuyến nghị: 06:00 - 07:00 sáng trước giờ mở cửa tiệm
              </span>
            </div>

            {/* Thông báo */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Bell size={14} className="text-amber-600" />
                Kênh nhận bản tin sau khi quét
              </label>
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyCopilot}
                    onChange={(e) => setNotifyCopilot(e.target.checked)}
                    className="h-4 w-4 rounded accent-rose-600"
                  />
                  <span>FloraOS Copilot chào buổi sáng</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="h-4 w-4 rounded accent-rose-600"
                  />
                  <span>Gửi email báo cáo hàng ngày</span>
                </label>
              </div>
            </div>
          </div>

          {/* Danh mục từ khóa tiệm theo dõi */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Layers size={14} className="text-amber-600" />
                Từ khóa & Chủ đề hoa tiệm theo dõi thường trực ({trackedKeywords.length}/10)
              </label>
              <span className="text-[10.5px] text-stone-400">
                AI sẽ quét sâu các từ khóa này để tạo Bản Tin Sáng
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 min-h-[50px]">
              {trackedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-stone-800 shadow-2xs"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-stone-400 hover:text-rose-600 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Thêm từ khóa hoa riêng của tiệm (VD: Hoa cúc tana, Hoa baby bó lớn)..."
                className="h-9 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-900 outline-none focus:border-rose-500 transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-1.5 rounded-xl border border-stone-200 bg-stone-100 text-xs font-bold text-stone-700 hover:bg-rose-50 hover:text-rose-700 transition"
              >
                + Thêm
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            {isSaved ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                Đã lưu lịch quét tự động thành công!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-sm transition"
            >
              <Settings size={14} />
              Lưu thiết lập lịch quét
            </button>
          </div>
        </form>
      </div>

      {/* 2. Bản Tin Nhịp Đập Buổi Sáng (Morning Daily Pulse Brief) */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-rose-50/40 p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Sparkles size={16} />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-stone-900">Bản tin sáng: Gợi ý hôm nay</h4>
              <span className="text-[10.5px] text-stone-500">
                Cập nhật tự động lúc {scheduleTime} sáng hôm nay
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-rose-200/70 bg-white p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
              <Flame size={14} />
              <span>3 Xu hướng tăng vọt 24h</span>
            </div>
            <ul className="text-xs text-stone-700 space-y-1 pt-1">
              <li>• <strong>Hoa tulip pastel</strong> (+45% tìm kiếm)</li>
              <li>• <strong>Tone cam cháy vintage</strong> (+32% Reels)</li>
              <li>• <strong>Bó tốt nghiệp Hàn Quốc</strong> (+28% Group FB)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>Cảnh báo mẫu hạ nhiệt</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed pt-1">
              Các mẫu hoa giấy gói màu đậm truyền thống đang giảm tương tác 18%. Khách hàng trẻ chuyển dịch mạnh sang <strong>giấy mờ phong cách Pháp</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200/70 bg-white p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <TrendingUp size={14} />
              <span>Đề xuất cắm & đăng bán hôm nay</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed pt-1">
              Ưu tiên cắm 1 bó mẫu <strong>Hoa Tulip phối Thủy tiên tone kem</strong> chụp cận cảnh đăng lúc 11:30 trưa để đón đầu nhu cầu sinh nhật cuối tuần.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Lịch Sử Các Phiên Quét Tự Động */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <History size={16} className="text-stone-500" />
            <span>Lịch Sử Các Phiên Quét Tự Động & Hàng Đợi Hệ Thống</span>
          </div>
          <span className="text-xs text-stone-400">
            Tổng cộng: {runs.length} phiên đã lưu
          </span>
        </div>

        {runs.length === 0 ? (
          <p className="text-center py-8 text-xs text-stone-400">
            Chưa có phiên quét tự động nào được ghi nhận.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {runs.slice(0, 5).map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-semibold text-stone-800">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-[10.5px] font-mono">
                      {r.run_type}
                    </span>
                    <span>Lượt quét lúc {new Date(r.created_at).toLocaleString("vi-VN")}</span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Thu thập {r.records_collected || 0} tín hiệu · Tạo {r.opportunities_created || 0} cơ hội
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                  r.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {r.status === "COMPLETED" ? "Thành công" : r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
