import { describe, it, expect } from "vitest";
import {
  validateTenantSchedule,
  DEFAULT_TENANT_SCHEDULE,
  DEFAULT_SAAS_ADMIN_SCHEDULE,
} from "@/modules/market-intelligence/domain/tenant-schedule-settings";

describe("tenant-schedule-settings", () => {
  it("trả về giá trị mặc định khi truyền cấu hình rỗng", () => {
    const res = validateTenantSchedule({});
    expect(res.enabled).toBe(true);
    expect(res.dailyExecutionTime).toBe("06:30");
    expect(res.trackedTopics.length).toBeGreaterThan(0);
    expect(res.geo).toBe("VN");
  });

  it("xác thực giờ quét định dạng HH:mm hợp lệ", () => {
    const valid = validateTenantSchedule({ dailyExecutionTime: "07:15" });
    expect(valid.dailyExecutionTime).toBe("07:15");

    const invalid = validateTenantSchedule({ dailyExecutionTime: "99:99" });
    expect(invalid.dailyExecutionTime).toBe("06:30");
  });

  it("giới hạn danh sách từ khóa tối đa 10 chủ đề và lọc từ khóa rỗng", () => {
    const res = validateTenantSchedule({
      trackedTopics: [" Hoa tulip ", "", "   ", "Hoa mẫu đơn", "Hoa cưới"],
    });
    expect(res.trackedTopics).toEqual(["Hoa tulip", "Hoa mẫu đơn", "Hoa cưới"]);
  });

  it("SaaS Admin có cấu hình cron vĩ mô mặc định", () => {
    expect(DEFAULT_SAAS_ADMIN_SCHEDULE.dailyDeepCron).toBe("0 23 * * *");
    expect(DEFAULT_SAAS_ADMIN_SCHEDULE.autoPublishReportToTenants).toBe(true);
  });
});
