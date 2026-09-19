/**
 * Cấu hình lịch quét thị trường tự động mỗi sáng cho Tenant & SaaS Admin.
 * Lưu trữ trong `organizations.settings.market_intelligence_schedule`.
 */

export interface TenantDailyScheduleConfig {
  enabled: boolean;
  dailyExecutionTime: string; // HH:mm (VD: "06:30")
  trackedTopics: string[];
  geo: string;
  notifyChannels: Array<"IN_APP_COPILOT" | "EMAIL" | "DASHBOARD_BADGE">;
}

export interface SaaSAdminSystemScheduleConfig {
  dailyDeepCron: string; // "0 23 * * *"
  intradayPulseCron: string; // "0 */3 * * *"
  weeklyDeepCron: string; // "0 22 * * 0"
  systemTrackedKeywords: string[];
  autoPublishReportToTenants: boolean;
}

export const DEFAULT_TENANT_SCHEDULE: TenantDailyScheduleConfig = {
  enabled: true,
  dailyExecutionTime: "06:30",
  trackedTopics: [
    "Hoa tulip pastel",
    "Bó hoa tốt nghiệp",
    "Lan hồ điệp khai trương",
  ],
  geo: "VN",
  notifyChannels: ["IN_APP_COPILOT", "DASHBOARD_BADGE"],
};

export const DEFAULT_SAAS_ADMIN_SCHEDULE: SaaSAdminSystemScheduleConfig = {
  dailyDeepCron: "0 23 * * *", // 06:00 AM VN
  intradayPulseCron: "0 */3 * * *", // Mỗi 3 giờ
  weeklyDeepCron: "0 22 * * 0", // 05:00 AM Thứ Hai
  systemTrackedKeywords: [
    "Hoa cưới vintage tone cam",
    "Hoa mẫu đơn nhập khẩu",
    "Hoa cẩm tú cầu tone xanh",
    "Bó hoa sinh nhật tinh tế",
  ],
  autoPublishReportToTenants: true,
};

export function validateTenantSchedule(
  config: Partial<TenantDailyScheduleConfig>
): TenantDailyScheduleConfig {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const time = config.dailyExecutionTime && timeRegex.test(config.dailyExecutionTime)
    ? config.dailyExecutionTime
    : DEFAULT_TENANT_SCHEDULE.dailyExecutionTime;

  const topics = Array.isArray(config.trackedTopics) && config.trackedTopics.length > 0
    ? config.trackedTopics.slice(0, 10).map((t) => String(t).trim()).filter(Boolean)
    : DEFAULT_TENANT_SCHEDULE.trackedTopics;

  const geo = config.geo && typeof config.geo === "string" ? config.geo : "VN";

  return {
    enabled: typeof config.enabled === "boolean" ? config.enabled : true,
    dailyExecutionTime: time,
    trackedTopics: topics,
    geo,
    notifyChannels: Array.isArray(config.notifyChannels) && config.notifyChannels.length > 0
      ? config.notifyChannels
      : DEFAULT_TENANT_SCHEDULE.notifyChannels,
  };
}
