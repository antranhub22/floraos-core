"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  BarChart3,
  TrendingUp,
  Compass,
  ArrowRight,
  Sparkles,
  Bot,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Users,
  Eye,
  Send,
  ShoppingBag,
  Award,
  RefreshCw,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"

export interface PackageDownstreamCardProps {
  productName: string
  topicTitle: string
  activeStage?: number
  approvedStages?: number[]
  onApproveStage?: (stage: number) => void
}

export function PackageDownstreamCard({
  productName,
  topicTitle,
  activeStage = 11,
  approvedStages = [],
  onApproveStage = () => {},
}: PackageDownstreamCardProps) {
  const router = useRouter()

  const isApproved11 = approvedStages.includes(11)
  const isApproved12 = approvedStages.includes(12)
  const isApproved13 = approvedStages.includes(13)
  const isApproved14 = approvedStages.includes(14)

  const isUnlocked11 = activeStage >= 11
  const isUnlocked12 = activeStage >= 12
  const isUnlocked13 = activeStage >= 13
  const isUnlocked14 = activeStage >= 14

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════════
          CHẶNG 11: SELL 💬 — AI Chat Assistant Bán hàng
      ══════════════════════════════════════════════════════════════════ */}
      <div id="package-stage-11" className="space-y-3">
        {!isUnlocked11 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> Chặng 11 — SELL (AI Chat Sales & Kịch bản Tư vấn)
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Chặng 11 đang tạm khóa. Vui lòng bấm <strong>"Xuất bản & Lên lịch đăng"</strong> ở Chặng 10 để mở khóa trợ lý AI bán hàng.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-stone-50 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs shrink-0">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-extrabold uppercase tracking-wider mb-1">
                    Chặng 11 — SELL 💬
                  </div>
                  <h4 className="text-[15px] font-bold text-stone-900">
                    Kịch bản Tư vấn Tự động & AI Chat Sales (M08)
                  </h4>
                  <p className="text-[12px] text-stone-600 mt-0.5">
                    Đồng bộ thông tin sản phẩm <strong>{productName}</strong> và góc tiếp cận <strong>"{topicTitle}"</strong> sang Trợ lý AI Đa kênh.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/hoi-thoai" as any)}
                className="shrink-0 border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold gap-1.5 self-start sm:self-center"
              >
                <MessageSquare size={13} />
                Mở Hội thoại M08
                <ArrowRight size={12} />
              </Button>
            </div>

            {/* Live Chat Simulation Display (Kết quả trực quan) */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200/60 pb-2">
                <span>📱 Mô phỏng Hội thoại Tư vấn AI (Zalo OA / Messenger)</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  AI Trợ lý Bán hàng Sẵn sàng 24/7
                </span>
              </div>

              {/* Chat Bubble 1: Customer */}
              <div className="flex items-start gap-2.5 max-w-md">
                <div className="h-7 w-7 rounded-full bg-stone-300 flex items-center justify-center text-[11px] font-bold text-stone-700 shrink-0">
                  KH
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-white p-3 border border-stone-200 text-xs text-stone-800 shadow-2xs">
                  <p className="font-semibold text-stone-900 mb-0.5">Khách hàng:</p>
                  Shop ơi, mẫu hoa <strong>{productName}</strong> này tặng sinh nhật người yêu có phù hợp không ạ? Giá bao nhiêu và giao trong bao lâu?
                </div>
              </div>

              {/* Chat Bubble 2: AI Sales Bot */}
              <div className="flex items-start gap-2.5 max-w-md ml-auto flex-row-reverse">
                <div className="h-7 w-7 rounded-full bg-rose-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-xs">
                  <Bot size={14} />
                </div>
                <div className="rounded-2xl rounded-tr-xs bg-rose-600 text-white p-3 text-xs shadow-xs space-y-1.5">
                  <p className="font-bold text-rose-100 flex items-center gap-1">
                    <Sparkles size={12} /> FloraOS Sales Copilot:
                  </p>
                  <p className="leading-relaxed">
                    Dạ chào bạn! Mẫu <strong>{productName}</strong> được thiết kế theo phong cách Hàn Quốc lãng mạn, phối hoa hồng kem dâu và lá đệm sang trọng, rất được các cặp đôi ưa chuộng dịp sinh nhật ạ.
                  </p>
                  <div className="rounded-lg bg-rose-700/60 p-2 text-[11.5px] border border-rose-500/40">
                    <p className="font-bold">✨ Báo giá ưu đãi: 599.000đ (Đã gồm thiệp thiết kế & freeship 5km)</p>
                    <p className="text-rose-100 text-[10.5px]">⏱️ Tiệm cam kết giao nhanh tận tay người thương trong 2 giờ!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cổng duyệt Chặng 11 */}
            <StageGateApprovalBar
              stageCode="Chặng 11 — SELL"
              title="Phê duyệt Kịch bản Bán hàng & Kích hoạt Trợ lý AI"
              description="Xác nhận kịch bản tư vấn, giá bán niêm yết và cam kết giao hàng đã chuẩn xác. Bấm duyệt để kích hoạt Trợ lý AI tự động phản hồi khách và chuyển sang Chặng 12 (MEASURE)."
              isApproved={isApproved11}
              approveLabel="Phê duyệt Kịch bản & Mở khóa Chặng 12 (MEASURE)"
              onApprove={() => onApproveStage(11)}
              metrics={[
                { label: "Kênh kết nối", value: "Zalo OA + Fanpage" },
                { label: "Thời gian phản hồi", value: "< 5 giây" },
                { label: "Tỷ lệ chốt dự kiến", value: "28%" },
              ]}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHẶNG 12: MEASURE 📊 — Đo lường Hiệu quả Kinh doanh
      ══════════════════════════════════════════════════════════════════ */}
      <div id="package-stage-12" className="space-y-3">
        {!isUnlocked12 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> Chặng 12 — MEASURE (Đo lường Doanh thu & Hiệu quả Chiến dịch)
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Chặng 12 đang tạm khóa. Vui lòng bấm <strong>"Phê duyệt Kịch bản & Mở khóa Chặng 12"</strong> ở Chặng 11 để mở khóa bảng phân tích số liệu kinh doanh.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-white to-stone-50 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs shrink-0">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10.5px] font-extrabold uppercase tracking-wider mb-1">
                    Chặng 12 — MEASURE 📊
                  </div>
                  <h4 className="text-[15px] font-bold text-stone-900">
                    Báo cáo Đo lường Hiệu quả & Doanh số Thực tế
                  </h4>
                  <p className="text-[12px] text-stone-600 mt-0.5">
                    Đo lường toàn diện từ lượt tiếp cận, hội thoại tư vấn đến doanh thu thực tế ghi nhận vào hệ thống.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/so-lieu" as any)}
                className="text-purple-700 hover:bg-purple-50 text-xs font-bold gap-1 self-start sm:self-center"
              >
                Trung tâm Số liệu
                <ArrowRight size={13} />
              </Button>
            </div>

            {/* KPI Cards Grid (Kết quả trực quan Chặng 12) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
                  <span>Lượt tiếp cận</span>
                  <Eye size={13} className="text-purple-600" />
                </div>
                <div className="text-xl font-black text-stone-900">42.500</div>
                <div className="text-[10.5px] text-emerald-600 font-bold">↑ 34% so với tuần trước</div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
                  <span>Tin nhắn tư vấn</span>
                  <MessageSquare size={13} className="text-rose-600" />
                </div>
                <div className="text-xl font-black text-stone-900">118 khách</div>
                <div className="text-[10.5px] text-emerald-600 font-bold">Tỷ lệ hỏi giá: 82%</div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
                  <span>Đơn hàng chốt</span>
                  <ShoppingBag size={13} className="text-blue-600" />
                </div>
                <div className="text-xl font-black text-stone-900">34 đơn</div>
                <div className="text-[10.5px] text-blue-600 font-bold">Chuyển đổi: 28.8%</div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold">
                  <span>Doanh thu quy đổi</span>
                  <DollarSign size={13} className="text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-700">20.366.000đ</div>
                <div className="text-[10.5px] text-emerald-600 font-bold">ROAS: 5.2x lợi nhuận</div>
              </div>
            </div>

            {/* Channel Breakdown */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 flex items-center justify-between text-xs text-stone-600 gap-2 flex-wrap">
              <span className="font-bold text-stone-800">Hiệu quả theo kênh:</span>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-600" /> Facebook: 16 đơn (9.584.000đ)
                </span>
                <span className="flex items-center gap-1 font-semibold text-pink-700">
                  <span className="h-2 w-2 rounded-full bg-pink-600" /> TikTok Video: 12 đơn (7.188.000đ)
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" /> Zalo OA: 6 đơn (3.594.000đ)
                </span>
              </div>
            </div>

            {/* Cổng duyệt Chặng 12 */}
            <StageGateApprovalBar
              stageCode="Chặng 12 — MEASURE"
              title="Xác nhận Số liệu Kinh doanh & Chuyển sang Học máy (LEARN)"
              description="Chủ shop xác nhận bảng số liệu đo lường doanh thu 20.366.000đ từ 34 đơn hàng. Bấm duyệt để AI tiến hành trích xuất Mẫu thành công (Winning Patterns) ở Chặng 13."
              isApproved={isApproved12}
              approveLabel="Xác nhận Số liệu & Tiến sang Chặng 13 (LEARN)"
              onApprove={() => onApproveStage(12)}
              metrics={[
                { label: "Doanh thu", value: "20.366.000đ" },
                { label: "Đơn chốt", value: "34 đơn" },
                { label: "ROAS", value: "5.2x" },
              ]}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHẶNG 13: LEARN 🧠 — AI Trích xuất Winning Patterns
      ══════════════════════════════════════════════════════════════════ */}
      <div id="package-stage-13" className="space-y-3">
        {!isUnlocked13 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> Chặng 13 — LEARN (AI Trích xuất Winning Patterns)
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Chặng 13 đang tạm khóa. Vui lòng bấm <strong>"Xác nhận Số liệu & Tiến sang Chặng 13"</strong> ở Chặng 12 để AI trích xuất mẫu thành công.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-stone-50 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-extrabold uppercase tracking-wider mb-1">
                    Chặng 13 — LEARN 🧠
                  </div>
                  <h4 className="text-[15px] font-bold text-stone-900">
                    Trích xuất Mẫu Thành công (Winning Patterns Insights)
                  </h4>
                  <p className="text-[12px] text-stone-600 mt-0.5">
                    AI phân tích nguyên nhân tạo nên doanh số và lưu vết bài học vào Bộ tri thức tiệm SSOT.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 self-start sm:self-center">
                <Award size={13} className="text-amber-700" />
                Độ tin cậy: 96%
              </span>
            </div>

            {/* Winning Pattern Display (Kết quả trực quan Chặng 13) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-amber-200 bg-white p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">1. Góc tiếp cận thắng thế</span>
                <p className="font-bold text-stone-900 text-[13px]">Góc cảm xúc tình yêu (EMOTIONAL)</p>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  Tập trung vào sự trân trọng và chân thành mang lại tỷ lệ nhắn tin tư vấn cao hơn 2.4 lần so với các bài đăng thuần giảm giá.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-white p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">2. Golden Hook giật tít</span>
                <p className="font-bold text-stone-900 text-[13px]">"Anh ấy đặt bó hoa này lúc 10:47 tối..."</p>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  Tỷ lệ xem hết video (Completion Rate) đạt 64%, cao vượt trội so với trung bình 32% của ngành hoa tươi.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-white p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">3. Định dạng chuyển đổi cao nhất</span>
                <p className="font-bold text-stone-900 text-[13px]">Reels 9:16 Ken Burns + Voiceover ấm</p>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  Video chuyển động cận cảnh từng đóa hoa phối nhạc ducking nhẹ nhàng tạo sự tin tưởng tuyệt đối vào chất lượng hoa thật.
                </p>
              </div>
            </div>

            {/* Bài học SSOT */}
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700 flex items-start gap-2.5">
              <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900">Bài học đúc kết lưu vào Bộ tri thức tiệm (SSOT): </span>
                Đối với dòng hoa tặng sinh nhật người yêu, khách hàng luôn muốn nhìn thấy thiệp viết tay và cam kết giao đúng giờ hơn là giảm giá trực tiếp.
              </div>
            </div>

            {/* Cổng duyệt Chặng 13 */}
            <StageGateApprovalBar
              stageCode="Chặng 13 — LEARN"
              title="Phê duyệt Mẫu Thành công & Lưu vào Bộ Tri thức Tiệm SSOT"
              description="Xác nhận lưu Winning Pattern (Cung truyện 5 nhịp + Hook đêm muộn) vào kho tri thức của tiệm để AI tự động ứng dụng cho các chiến dịch tương lai. Tiến sang Chặng 14."
              isApproved={isApproved13}
              approveLabel="Phê duyệt & Chuyển sang Đề xuất Hành động (Chặng 14)"
              onApprove={() => onApproveStage(13)}
              metrics={[
                { label: "Mẫu hình", value: "Emotional Storytelling" },
                { label: "Tỷ lệ giữ chân", value: "64%" },
                { label: "Độ tin cậy", value: "96%" },
              ]}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHẶNG 14: NEXT BEST ACTION 🎯 — Hành động Tối ưu Tiếp theo (Growth Loop)
      ══════════════════════════════════════════════════════════════════ */}
      <div id="package-stage-14" className="space-y-3">
        {!isUnlocked14 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> Chặng 14 — NEXT BEST ACTION (Hành động Tối ưu Kế tiếp)
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Chặng 14 đang tạm khóa. Vui lòng bấm <strong>"Phê duyệt & Chuyển sang Đề xuất Hành động"</strong> ở Chặng 13 để mở khóa khuyến nghị tối ưu.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-stone-50 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold uppercase tracking-wider mb-1">
                    Chặng 14 — NEXT BEST ACTION 🎯
                  </div>
                  <h4 className="text-[15px] font-bold text-stone-900">
                    Đề xuất Hành động Chiến lược Kế tiếp (FloraOS Growth Loop)
                  </h4>
                  <p className="text-[12px] text-stone-600 mt-0.5">
                    Dựa trên dữ liệu 13 chặng vừa hoàn thành, AI đề xuất 3 hành động cụ thể để nhân đôi doanh số đợt tới.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 self-start sm:self-center">
                <RefreshCw size={13} className="text-emerald-700" />
                Vòng lặp Tăng trưởng Khép kín
              </span>
            </div>

            {/* 3 Next Best Actions Display (Kết quả trực quan Chặng 14) */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white p-3.5 shadow-2xs hover:border-emerald-400 transition-colors">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs shrink-0">
                  1
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 text-xs">
                    Nhân bản kịch bản sang 2 mẫu Video Reels 15s đón dịp lễ sắp tới
                  </p>
                  <p className="text-[11.5px] text-stone-600 mt-0.5">
                    Áp dụng nguyên vẹn Golden Hook "Anh ấy đặt bó hoa này lúc 10:47 tối..." và tone cảm xúc đã thắng thế để tạo chuỗi video ngắn chạy phủ kênh.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/video" as any)}
                  className="shrink-0 text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-[11px] font-bold"
                >
                  Tạo video ngay →
                </Button>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs hover:border-emerald-400 transition-colors">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-stone-700 font-extrabold text-xs shrink-0">
                  2
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 text-xs">
                    Mở rộng biến thể Size L (Phân khúc 890K) cho mẫu {productName}
                  </p>
                  <p className="text-[11.5px] text-stone-600 mt-0.5">
                    Giữ nguyên công thức hoa hồng kem dâu và bao bì lụa mờ, tăng thêm 6 bông hồng để nâng giá trị trung bình trên mỗi đơn hàng (AOV).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/tai-anh" as any)}
                  className="shrink-0 text-stone-700 border-stone-300 hover:bg-stone-50 text-[11px] font-bold"
                >
                  Tạo biến thể mới →
                </Button>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs hover:border-emerald-400 transition-colors">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-stone-700 font-extrabold text-xs shrink-0">
                  3
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 text-xs">
                    Kích hoạt chuỗi Remarketing tự động cho 84 khách chưa chốt
                  </p>
                  <p className="text-[11.5px] text-stone-600 mt-0.5">
                    Gửi tin nhắn kèm voucher giảm 10% thiệp chúc mừng qua Zalo OA vào 19:00 tối mai để kích hoạt lại nhóm khách hàng tiềm năng.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/hoi-thoai" as any)}
                  className="shrink-0 text-stone-700 border-stone-300 hover:bg-stone-50 text-[11px] font-bold"
                >
                  Cài đặt gửi tin →
                </Button>
              </div>
            </div>

            {/* Cổng duyệt Chặng 14 — Hoàn tất trọn vẹn 14 Chặng */}
            <StageGateApprovalBar
              stageCode="Chặng 14 — NEXT BEST ACTION"
              title="Phê duyệt Kế hoạch Hành động Kế tiếp & Khởi động Chu kỳ Mới"
              description="Chúc mừng bạn đã hoàn tất xuất sắc cả 14 chặng trong Hành trình Product-to-Market! Bấm phê duyệt để ghi nhận chu kỳ tăng trưởng khép kín (FloraOS Growth Loop)."
              isApproved={isApproved14}
              approveLabel={isApproved14 ? "✓ Đã hoàn tất toàn bộ 14 Chặng" : "Phê duyệt Kế hoạch & Khởi động Chu kỳ Tăng trưởng Mới"}
              onApprove={() => onApproveStage(14)}
              metrics={[
                { label: "Tổng chặng hoàn thành", value: "14/14 Chặng" },
                { label: "Tình trạng chu kỳ", value: "Hoàn tất 100%" },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
