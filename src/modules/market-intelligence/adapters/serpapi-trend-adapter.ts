import type {
  TrendProvider,
  TrendSearchQuery,
  TrendSignalData,
  TrendTimeseriesPoint,
  RelatedTopicData,
  ProviderHealthReport,
} from "@/core/ports/trend-provider";

export class SerpApiTrendAdapter implements TrendProvider {
  readonly name = "serpapi";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    let key =
      options?.apiKey ??
      (typeof process !== "undefined" ? process.env.SERPAPI_API_KEY : undefined);

    if (!key && typeof window === "undefined") {
      try {
        const fs = require("fs");
        const path = require("path");
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf-8");
          const match = content.match(/^SERPAPI_API_KEY=(.+)$/m);
          if (match && match[1]) {
            key = match[1].trim().replace(/^["']|["']$/g, "");
            if (typeof process !== "undefined") {
              process.env.SERPAPI_API_KEY = key;
            }
          }
        }
      } catch {
        // Bỏ qua lỗi đọc file
      }
    }

    this.apiKey = key;
    this.baseUrl = options?.baseUrl ?? "https://serpapi.com/search.json";
  }

  async searchTrends(query: TrendSearchQuery): Promise<TrendSignalData[]> {
    if (!this.apiKey) {
      throw new Error("[SerpApiTrendAdapter] SERPAPI_API_KEY is not configured");
    }

    const geo = query.geo ?? "VN";
    const timeframe = query.timeframe ?? "now 7-d";
    const industry = query.industry ?? "florist";

    const params = new URLSearchParams({
      engine: "google_trends",
      q: query.query,
      geo,
      date: timeframe,
      api_key: this.apiKey,
    });

    try {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`SerpApi HTTP error: ${res.statusText} (${res.status})`);
      }

      const data = await res.json();
      const interestOverTime = data?.interest_over_time?.timeline_data ?? [];

      const signals: TrendSignalData[] = [];

      if (interestOverTime.length > 0) {
        const latest = interestOverTime[interestOverTime.length - 1];
        const latestVal = latest?.values?.[0]?.extracted_value ?? 50;

        signals.push({
          platform: "google_trends_serpapi",
          topicRaw: query.query,
          countryCode: geo,
          industry,
          metricName: "interest_over_time",
          metricValue: Number(latestVal),
          growthRate: 10.0,
          confidence: 0.95,
          capturedAt: new Date(),
        });
      } else {
        signals.push({
          platform: "google_trends_serpapi",
          topicRaw: query.query,
          countryCode: geo,
          industry,
          metricName: "search_index",
          metricValue: 50.0,
          growthRate: 0.0,
          confidence: 0.9,
          capturedAt: new Date(),
        });
      }

      return signals;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[SerpApiTrendAdapter] searchTrends failed: ${message}`);
    }
  }

  async getTimeseries(
    topic: string,
    timeframe: string = "today 1-m",
    geo: string = "VN"
  ): Promise<TrendTimeseriesPoint[]> {
    if (!this.apiKey) {
      throw new Error("[SerpApiTrendAdapter] SERPAPI_API_KEY is not configured");
    }

    const params = new URLSearchParams({
      engine: "google_trends",
      q: topic,
      geo,
      date: timeframe,
      api_key: this.apiKey,
    });

    try {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`);
      if (!res.ok) throw new Error(`SerpApi timeseries HTTP error ${res.status}`);

      const data = await res.json();
      const timeline = data?.interest_over_time?.timeline_data ?? [];

      return timeline.map((item: any) => ({
        date: new Date(item.date),
        value: Number(item?.values?.[0]?.extracted_value ?? 0),
        growthRate: null,
        velocity: null,
        acceleration: null,
        confidence: 0.95,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[SerpApiTrendAdapter] getTimeseries failed: ${message}`);
    }
  }

  async getRelatedTopics(
    topic: string,
    geo: string = "VN"
  ): Promise<RelatedTopicData[]> {
    if (!this.apiKey) {
      return [
        { topicName: `${topic} đẹp`, topicType: "query", metricValue: 70 },
      ];
    }

    const params = new URLSearchParams({
      engine: "google_trends",
      q: topic,
      geo,
      api_key: this.apiKey,
    });

    try {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`);
      if (!res.ok) return [];

      const data = await res.json();
      const queries = data?.related_queries?.rising ?? [];

      return queries.map((q: any) => ({
        topicName: q.query,
        topicType: "rising_query",
        metricValue: Number(q.extracted_value ?? 50),
        isBreakout: String(q.value).toLowerCase().includes("breakout"),
      }));
    } catch {
      return [];
    }
  }

  async healthCheck(): Promise<ProviderHealthReport> {
    if (!this.apiKey) {
      return {
        provider: this.name,
        status: "UNAVAILABLE",
        latencyMs: 0,
        errorRate: 1.0,
        quotaStatus: "MISSING_API_KEY",
        message: "Chưa cấu hình SERPAPI_API_KEY trong môi trường",
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://serpapi.com/account?api_key=${this.apiKey}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          provider: this.name,
          status: "HEALTHY",
          latencyMs,
          errorRate: 0,
          quotaStatus: "ACTIVE",
        };
      }

      return {
        provider: this.name,
        status: "DEGRADED",
        latencyMs,
        errorRate: 0.5,
        quotaStatus: `HTTP_${res.status}`,
      };
    } catch (err: unknown) {
      return {
        provider: this.name,
        status: "UNAVAILABLE",
        latencyMs: Date.now() - start,
        errorRate: 1.0,
        quotaStatus: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
