import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";

export type ResearchRunType = "DAILY_DEEP" | "INTRADAY_PULSE" | "WEEKLY_DEEP" | "MANUAL";

export interface TriggerRunResult {
  runId: string;
  status: string;
  runType: string;
  createdAt: Date;
}

/**
 * Kích hoạt một lượt chạy nghiên cứu thị trường (thủ công hoặc theo lịch).
 * Tạo hàng trong `research_runs` và phát `NOTIFY market_intelligence_research`.
 */
export async function triggerResearchRun(
  runType: ResearchRunType = "MANUAL",
  params?: { keyword?: string | undefined; geo?: string | undefined; timeframe?: string | undefined; channel?: string | undefined }
): Promise<TriggerRunResult> {
  const run = await marketIntelligenceRepo.triggerResearchRunAndNotify(runType, params);

  return {
    runId: run.id,
    status: run.status,
    runType: run.run_type,
    createdAt: run.created_at,
  };
}
