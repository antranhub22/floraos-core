import type {
  TrendProvider,
  TrendSearchQuery,
  TrendSignalData,
  TrendTimeseriesPoint,
  RelatedTopicData,
  ProviderHealthReport,
} from "@/core/ports/trend-provider";
import { GoogleTrendsAdapter } from "./google-trends-adapter";
import { SerpApiTrendAdapter } from "./serpapi-trend-adapter";
import { CachedFallbackProvider } from "./cached-fallback-provider";
import { YouTubeTrendAdapter } from "./youtube-trend-adapter";
import { TikTokTrendAdapter } from "./tiktok-trend-adapter";
import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";

export interface ProviderChainOptions {
  providers?: TrendProvider[];
  skipUnavailable?: boolean;
}

/**
 * Điều phối chuỗi ưu tiên nhà cung cấp dữ liệu xu hướng (D-MI5):
 * Hỗ trợ đa kênh: Google Trends, TikTok, YouTube và chế độ Quét Tổng hợp Đa kênh (Omnichannel).
 * Tự động ghi nhận tình trạng và độ trễ vào bảng `provider_health`.
 *
 * Facebook đã được GỠ khỏi chuỗi (19/09/2026, theo quyết định chủ sản phẩm):
 * không có API công khai nào đo được mức thảo luận theo chủ đề trên Facebook,
 * nên `facebook-trend-adapter.ts` (vốn chỉ suy diễn qua kết quả tìm kiếm Google
 * — không phải số đo Facebook thật) đã bị xoá khỏi hệ thống thay vì tiếp tục
 * trình bày như một kênh nghiên cứu.
 */
export class TrendProviderChain implements TrendProvider {
  readonly name = "trend_provider_chain";
  private readonly providers: TrendProvider[];
  private readonly skipUnavailable: boolean;
  private readonly youtubeAdapter: YouTubeTrendAdapter;
  private readonly tiktokAdapter: TikTokTrendAdapter;

  constructor(options?: ProviderChainOptions) {
    this.providers = options?.providers ?? [
      new GoogleTrendsAdapter(),
      new SerpApiTrendAdapter(),
      new CachedFallbackProvider(),
    ];
    this.skipUnavailable = options?.skipUnavailable ?? true;
    this.youtubeAdapter = new YouTubeTrendAdapter();
    this.tiktokAdapter = new TikTokTrendAdapter();
  }

  private async recordHealth(report: ProviderHealthReport): Promise<void> {
    try {
      await marketIntelligenceRepo.upsertProviderHealth({
        provider: report.provider,
        status: report.status,
        latencyMs: report.latencyMs,
        errorRate: report.errorRate,
        quotaStatus: report.quotaStatus ?? null,
      });
    } catch {
      // Tránh để việc ghi log sức khỏe làm đứt mạch nghiệp vụ
    }
  }

  async searchTrends(query: TrendSearchQuery): Promise<TrendSignalData[]> {
    const channel = query.channel?.toLowerCase() ?? "omnichannel";

    // 1. Quét riêng kênh YouTube
    if (channel === "youtube") {
      return this.youtubeAdapter.searchTrends(query);
    }

    // 2. Quét riêng kênh TikTok
    if (channel === "tiktok") {
      return this.tiktokAdapter.searchTrends(query);
    }

    // 3. Chế độ Tổng hợp Đa kênh (Omnichannel) — Kích hoạt cả 3 nguồn song song
    if (channel === "omnichannel") {
      const [googleRes, ytRes, ttRes] = await Promise.allSettled([
        this.executePrimaryChain(query),
        this.youtubeAdapter.searchTrends(query),
        this.tiktokAdapter.searchTrends(query),
      ]);

      const aggregated: TrendSignalData[] = [];
      if (googleRes.status === "fulfilled") aggregated.push(...googleRes.value);
      if (ytRes.status === "fulfilled") aggregated.push(...ytRes.value);
      if (ttRes.status === "fulfilled") aggregated.push(...ttRes.value);

      if (aggregated.length > 0) return aggregated;
    }

    // 4. Mặc định (Web Search): Đi qua chuỗi Google -> SerpApi -> Cached Fallback
    // Kênh "shopping" (hiển thị trên UI là "Google Shopping") CŨNG rơi vào đây —
    // CHƯA XÂY adapter thật (quyết định chủ sản phẩm 19/09/2026: giữ lựa chọn
    // trên UI, đánh dấu CHƯA XÂY trong đặc tả 06 mục 22 + nợ kỹ thuật #116 —
    // không âm thầm coi đây là dữ liệu Google Shopping thật).
    return this.executePrimaryChain(query);
  }

  private async executePrimaryChain(query: TrendSearchQuery): Promise<TrendSignalData[]> {
    for (const provider of this.providers) {
      const startTime = Date.now();
      try {
        const signals = await provider.searchTrends(query);
        const latencyMs = Date.now() - startTime;

        await this.recordHealth({
          provider: provider.name,
          status: "HEALTHY",
          latencyMs,
          errorRate: 0.0,
          quotaStatus: "OK",
        });

        if (signals.length > 0) {
          return signals;
        }
      } catch (err) {
        const latencyMs = Date.now() - startTime;
        await this.recordHealth({
          provider: provider.name,
          status: "DEGRADED",
          latencyMs,
          errorRate: 1.0,
          message: err instanceof Error ? err.message : String(err),
        });
        continue;
      }
    }

    // Nếu mọi provider đều thất bại, suy giảm có kiểm soát (Controlled Degrade)
    return [
      {
        platform: "degraded_fallback",
        topicRaw: query.query,
        countryCode: query.geo ?? "VN",
        industry: query.industry ?? "florist",
        metricName: "baseline_score",
        metricValue: 30.0,
        growthRate: 0.0,
        confidence: 0.2,
        capturedAt: new Date(),
      },
    ];
  }

  async getTimeseries(
    topic: string,
    timeframe?: string,
    geo?: string
  ): Promise<TrendTimeseriesPoint[]> {
    for (const provider of this.providers) {
      try {
        const points = await provider.getTimeseries(topic, timeframe, geo);
        if (points.length > 0) {
          return points;
        }
      } catch {
        continue;
      }
    }
    return [];
  }

  async getRelatedTopics(
    topic: string,
    geo?: string
  ): Promise<RelatedTopicData[]> {
    for (const provider of this.providers) {
      try {
        const related = await provider.getRelatedTopics(topic, geo);
        if (related.length > 0) {
          return related;
        }
      } catch {
        continue;
      }
    }
    return [];
  }

  async healthCheck(): Promise<ProviderHealthReport> {
    const reports: ProviderHealthReport[] = [];
    for (const provider of this.providers) {
      try {
        const report = await provider.healthCheck();
        reports.push(report);
        await this.recordHealth(report);
      } catch {
        const failed: ProviderHealthReport = {
          provider: provider.name,
          status: "UNAVAILABLE",
          latencyMs: 0,
          errorRate: 1.0,
          quotaStatus: "HEALTH_CHECK_FAILED",
        };
        reports.push(failed);
        await this.recordHealth(failed);
      }
    }

    const hasHealthy = reports.some((r) => r.status === "HEALTHY");
    return {
      provider: this.name,
      status: hasHealthy ? "HEALTHY" : "DEGRADED",
      latencyMs: Math.round(
        reports.reduce((acc, r) => acc + r.latencyMs, 0) / (reports.length || 1)
      ),
      errorRate:
        reports.filter((r) => r.status !== "HEALTHY").length / (reports.length || 1),
      quotaStatus: `${reports.filter((r) => r.status === "HEALTHY").length}/${reports.length} online`,
    };
  }
}
