// Dữ liệu mẫu cho popup xem trước — nhóm Chat Assistant (M10), Analytics
// (M11), Platform Connections (P-Fix-5). Chỉ để minh hoạ giao diện, KHÔNG
// phải dữ liệu thật.
import React from "react"
import { ChatGuidanceCard } from "@/components/templates/chat-assistant/chat-guidance-card"
import { ChatThreadCard, type ChatMessage } from "@/components/templates/chat-assistant/chat-thread-card"
import { HumanTakeoverBanner } from "@/components/templates/chat-assistant/human-takeover-banner"
import { AnalyticsGuidanceCard } from "@/components/templates/analytics/analytics-guidance-card"
import { KpiSummaryCard } from "@/components/templates/analytics/kpi-summary-card"
import { AiCreditUsageCard, type AiCapabilityUsage } from "@/components/templates/analytics/ai-credit-usage-card"
import { PlatformAccountCard, type PlatformConfig, type ConnectedAccountData } from "@/components/templates/platform-connections/platform-account-card"
import { ConnectAccountModal } from "@/components/templates/platform-connections/connect-account-modal"

const CHAT_MESSAGES: ChatMessage[] = [
  { id: "1", sender: "user", content: "Chào shop, mình muốn đặt hoa tặng vợ nhân kỷ niệm ngày cưới", time: "19:02" },
  {
    id: "2",
    sender: "bot",
    content: "Dạ chào anh! Shop gợi ý 2 mẫu hoa phù hợp dịp kỷ niệm ạ:",
    time: "19:02",
    suggestedProducts: [
      { name: "Nồng Nàn Yêu Thương", price: "650.000đ" },
      { name: "Hạnh Phúc Bên Nhau", price: "890.000đ" },
    ],
  },
  { id: "3", sender: "user", content: "Cho mình đặt mẫu đầu tiên nhé", time: "19:05" },
]

const AI_CAPABILITIES: AiCapabilityUsage[] = [
  { name: "Nhận diện ảnh hoa (Vision)", callCount: 340, costEstimate: "180.000đ", percentage: 40 },
  { name: "Sinh nội dung bán hàng", callCount: 512, costEstimate: "220.000đ", percentage: 35 },
  { name: "Trợ lý chat tư vấn", callCount: 890, costEstimate: "150.000đ", percentage: 25 },
]

const PLATFORM_CONFIG: PlatformConfig = {
  id: "facebook",
  name: "Facebook Fanpage",
  icon: "📘",
  tag: "Mạng xã hội",
  description: "Đăng bài tự động lên Fanpage, đồng bộ tin nhắn khách hàng.",
  features: ["Đăng bài tự động", "Đồng bộ tin nhắn", "Báo cáo tương tác"],
  badgeColor: "blue",
}

const CONNECTED_ACCOUNT: ConnectedAccountData = {
  platform: "facebook",
  username: "SiiN Store",
  is_logged_in: 1,
  last_login: new Date().toISOString(),
  page_id: "104829104812345",
}

export const chatAnalyticsPlatformPreviews: Record<string, React.ReactNode> = {
  "chat-guidance-card.tsx": <ChatGuidanceCard />,
  "chat-thread-card.tsx": <ChatThreadCard customerName="Chị Lan Anh" channel="zalo" messages={CHAT_MESSAGES} />,
  "human-takeover-banner.tsx": (
    <HumanTakeoverBanner
      reason="Khách yêu cầu giảm giá vượt hạn mức tự động"
      customerName="Chị Lan Anh"
      onAcceptTakeover={() => {}}
    />
  ),
  "analytics-guidance-card.tsx": <AnalyticsGuidanceCard />,
  "kpi-summary-card.tsx": (
    <KpiSummaryCard
      revenue={{ label: "Doanh thu", value: "128.500.000đ", changePercent: 12.5, isPositive: true }}
      orders={{ label: "Đơn hàng", value: "342", changePercent: 8.2, isPositive: true }}
      conversionRate={{ label: "Tỷ lệ chuyển đổi", value: "24.8%", changePercent: -1.4, isPositive: false }}
      avgOrderValue={{ label: "Giá trị TB/đơn", value: "375.000đ", changePercent: 4.1, isPositive: true }}
    />
  ),
  "ai-credit-usage-card.tsx": (
    <AiCreditUsageCard usedTokens={68000} totalTokens={100000} costSpent="550.000đ" budgetLimit="800.000đ" capabilities={AI_CAPABILITIES} />
  ),
  "platform-account-card.tsx": (
    <PlatformAccountCard
      platform={PLATFORM_CONFIG}
      account={CONNECTED_ACCOUNT}
      onConnect={() => {}}
      onLogin={() => {}}
      onCheck={() => {}}
      onEdit={() => {}}
      onDisconnect={() => {}}
    />
  ),
  "connect-account-modal.tsx": (
    <ConnectAccountModal
      platformId="facebook"
      platformName="Facebook Fanpage"
      isOpen={true}
      isLoading={false}
      onClose={() => {}}
      onSave={async () => {}}
    />
  ),
}

// Các template tự dựng modal fixed inset-0 riêng — wiring ở page.tsx cần
// biết để không lồng 2 lớp modal.
export const CHAT_ANALYTICS_PLATFORM_SELF_MODAL_FILES = new Set(["connect-account-modal.tsx"])
