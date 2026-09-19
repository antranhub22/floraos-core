import type {
  TrendProvider,
  TrendSearchQuery,
  TrendSignalData,
  TrendTimeseriesPoint,
  RelatedTopicData,
  ProviderHealthReport,
} from "@/core/ports/trend-provider";
import { marketIntelligenceRepo } from "../infra/market-intelligence-repository";

/**
 * Provider Fallback từ bộ nhớ đệm CSDL (`trend_timeseries` & `trend_signals`).
 *
 * Được kích hoạt khi toàn bộ các nhà cung cấp bên ngoài (Google Trends, SerpApi)
 * đều gặp sự cố hoặc hết quota.
 */
export class CachedFallbackProvider implements TrendProvider {
  readonly name = "cached_fallback";

  async searchTrends(query: TrendSearchQuery): Promise<TrendSignalData[]> {
    const geo = query.geo ?? "VN";
    const industry = query.industry ?? "florist";

    try {
      const dbSignals = await marketIntelligenceRepo.findCachedSignals(query.query, geo, industry);

      if (dbSignals.length === 0) {
        // Trả về tín hiệu tối thiểu nếu chưa từng có dữ liệu
        return [
          {
            platform: "cached_fallback",
            topicRaw: query.query,
            countryCode: geo,
            industry,
            metricName: "cached_baseline",
            metricValue: 40.0,
            growthRate: 0.0,
            confidence: 0.5,
            capturedAt: new Date(),
          },
        ];
      }

      return dbSignals.map((s) => ({
        platform: "cached_fallback",
        topicRaw: s.topic_raw,
        countryCode: s.country_code,
        regionCode: s.region_code,
        city: s.city,
        industry: s.industry,
        metricName: s.metric_name,
        metricValue: s.metric_value,
        growthRate: s.growth_rate,
        confidence: Math.max(0.3, s.confidence * 0.8), // Giảm nhẹ độ tin cậy do là cache cũ
        capturedAt: s.captured_at,
      }));
    } catch {
      return [
        {
          platform: "cached_fallback",
          topicRaw: query.query,
          countryCode: geo,
          industry,
          metricName: "static_default",
          metricValue: 35.0,
          growthRate: 0.0,
          confidence: 0.4,
          capturedAt: new Date(),
        },
      ];
    }
  }

  async getTimeseries(
    topic: string,
    _timeframe?: string,
    geo: string = "VN"
  ): Promise<TrendTimeseriesPoint[]> {
    try {
      const points = await marketIntelligenceRepo.findCachedTimeseries(topic, geo);

      return points.map((p) => ({
        date: p.date,
        value: p.value,
        growthRate: p.growth_rate,
        velocity: p.velocity,
        acceleration: p.acceleration,
        confidence: Math.max(0.3, p.confidence * 0.8),
      }));
    } catch {
      return [];
    }
  }

  async getRelatedTopics(
    topic: string,
    _geo?: string
  ): Promise<RelatedTopicData[]> {
    try {
      const related = await marketIntelligenceRepo.findCachedRelatedTopics(topic);

      return related.map((r) => ({
        topicName: r.canonical_name,
        topicType: "cached_topic",
        metricValue: 50,
      }));
    } catch {
      return [];
    }
  }

  async healthCheck(): Promise<ProviderHealthReport> {
    return {
      provider: this.name,
      status: "HEALTHY",
      latencyMs: 1,
      errorRate: 0,
      quotaStatus: "LOCAL_DB",
      message: "Cache CSDL luôn sẵn sàng",
    };
  }
}
