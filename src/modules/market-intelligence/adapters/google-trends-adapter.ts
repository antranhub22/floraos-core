import type {
  TrendProvider,
  TrendSearchQuery,
  TrendSignalData,
  TrendTimeseriesPoint,
  RelatedTopicData,
  ProviderHealthReport,
} from "@/core/ports/trend-provider";

interface GoogleTrendsWidget {
  id?: string;
  request?: unknown;
  token?: string;
}

interface GoogleTrendsTimelinePoint {
  time?: string;
  value?: number[];
  hasData?: boolean[];
}

/**
 * Adapter Google Trends (Provider #1).
 *
 * Lưu ý nghiệp vụ: Google Trends không có API chính thức công khai.
 * Adapter coi Google Trends là "rẻ, dễ vỡ" (D-MI5) — timeout ngắn (5s),
 * phát hiện HTTP 429 / Captcha thì ngắt ngay sang SerpApi (Provider #2),
 * tuyệt đối không retry nhiều lần làm nghẽn worker.
 *
 * Quy tắc dữ liệu (v2.0 mục 34 / v1.0 mục 59 quy tắc #9):
 * "Never fabricate unavailable metrics." Adapter này gọi đúng 2 bước thật
 * của Google Trends — `explore` lấy token, rồi `widgetdata/multiline` lấy
 * giá trị thật — thay vì trả một hằng số cố định khi request thành công.
 * Nếu không trích được số thật (thiếu widget/token, hoặc response không có
 * dữ liệu), adapter NÉM LỖI để `trend-provider-chain` rơi đúng xuống
 * SerpApi (Provider #2), thay vì bịa một tín hiệu trông giống số đo thật.
 */
export class GoogleTrendsAdapter implements TrendProvider {
  readonly name = "google_trends";
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options?: { baseUrl?: string; timeoutMs?: number }) {
    this.baseUrl = options?.baseUrl ?? "https://trends.google.com/trends/api";
    this.timeoutMs = options?.timeoutMs ?? 5000;
  }

  private async fetchWithTimeout(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
          Accept: "application/json, text/plain, */*",
        },
      });

      if (res.status === 429 || res.status === 403) {
        throw new Error(`Google Trends rate-limited/blocked (HTTP ${res.status})`);
      }
      if (!res.ok) {
        throw new Error(`Google Trends HTTP error: ${res.statusText} (${res.status})`);
      }

      const rawText = await res.text();
      // Google Trends API trả về chuỗi bắt đầu bằng ")]}',\n"
      return rawText.replace(/^\)\]\}',?\n/, "");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Bước 1 (explore): lấy danh sách widget + token cần cho bước 2.
   * Bước 2 (widgetdata/multiline): dùng đúng token của widget TIMESERIES
   * để lấy chuỗi giá trị thật — đây là luồng 2 bước thật của Google Trends,
   * không có cách nào lấy số đo thật chỉ bằng 1 lệnh gọi `explore`.
   */
  private async fetchTimeseriesPoints(
    query: string,
    geo: string,
    timeframe: string,
    category: number
  ): Promise<GoogleTrendsTimelinePoint[]> {
    const exploreUrl = `${this.baseUrl}/explore?hl=vi&tz=-420&req=${encodeURIComponent(
      JSON.stringify({
        comparisonItem: [{ keyword: query, geo, time: timeframe }],
        category,
        property: "",
      })
    )}`;

    const exploreJson = JSON.parse(await this.fetchWithTimeout(exploreUrl));
    const widgets: GoogleTrendsWidget[] = exploreJson?.widgets ?? [];
    const timeseriesWidget = widgets.find((w) => w.id === "TIMESERIES");

    if (!timeseriesWidget?.token || !timeseriesWidget.request) {
      throw new Error("Google Trends: không tìm thấy widget TIMESERIES/token trong response explore");
    }

    const multilineUrl = `${this.baseUrl}/widgetdata/multiline?hl=vi&tz=-420&req=${encodeURIComponent(
      JSON.stringify(timeseriesWidget.request)
    )}&token=${encodeURIComponent(timeseriesWidget.token)}`;

    const multilineJson = JSON.parse(await this.fetchWithTimeout(multilineUrl));
    const timelineData: GoogleTrendsTimelinePoint[] = multilineJson?.default?.timelineData ?? [];

    return timelineData;
  }

  async searchTrends(query: TrendSearchQuery): Promise<TrendSignalData[]> {
    const geo = query.geo ?? "VN";
    const timeframe = query.timeframe ?? "now 7-d";
    const industry = query.industry ?? "florist";

    try {
      const timelineData = await this.fetchTimeseriesPoints(
        query.query,
        geo,
        timeframe,
        query.category ?? 0
      );

      const values: number[] = [];
      const fullDataFlags: boolean[] = [];
      for (const p of timelineData) {
        const v = Array.isArray(p.value) ? p.value[0] : undefined;
        if (typeof v === "number") {
          values.push(v);
          fullDataFlags.push((p.hasData ?? [true]).every(Boolean));
        }
      }

      if (values.length === 0) {
        // Đúng luật "không bịa số" — ném lỗi để chain rơi xuống SerpApi,
        // thay vì trả một tín hiệu mặc định trông giống số đo thật.
        throw new Error("Google Trends: response không có giá trị timeline nào để dùng");
      }

      const firstValue = values[0];
      const latestValue = values[values.length - 1];
      if (typeof firstValue !== "number" || typeof latestValue !== "number") {
        throw new Error("Google Trends: không đọc được giá trị đầu/cuối của chuỗi timeline");
      }

      const growthRate =
        firstValue > 0 ? Math.round(((latestValue - firstValue) / firstValue) * 1000) / 10 : 0;

      const hasFullData = fullDataFlags.every(Boolean);

      return [
        {
          platform: "google_trends",
          topicRaw: query.query,
          countryCode: geo,
          industry,
          metricName: "interest_over_time",
          metricValue: latestValue,
          growthRate,
          confidence: hasFullData ? 0.85 : 0.6,
          capturedAt: new Date(),
        },
      ];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[GoogleTrendsAdapter] searchTrends failed: ${message}`);
    }
  }

  async getTimeseries(
    topic: string,
    timeframe: string = "now 7-d",
    geo: string = "VN"
  ): Promise<TrendTimeseriesPoint[]> {
    try {
      const timelineData = await this.fetchTimeseriesPoints(topic, geo ?? "VN", timeframe, 0);

      const raw: Array<{ date: Date; value: number; confidence: number }> = [];
      for (const p of timelineData) {
        const v = Array.isArray(p.value) ? p.value[0] : undefined;
        if (typeof v === "number" && p.time) {
          raw.push({
            date: new Date(Number(p.time) * 1000),
            value: v,
            confidence: (p.hasData ?? [true]).every(Boolean) ? 0.85 : 0.5,
          });
        }
      }

      // Tính growthRate/velocity từ chuỗi giá trị thật vừa lấy được (so với
      // điểm liền trước), không bịa số ngẫu nhiên cho các điểm còn lại.
      const points: TrendTimeseriesPoint[] = raw.map((p, i) => {
        if (i === 0) {
          return { ...p, growthRate: null, velocity: null, acceleration: null };
        }
        const prevPoint = raw[i - 1];
        const prev = prevPoint ? prevPoint.value : undefined;
        if (typeof prev !== "number") {
          return { ...p, growthRate: null, velocity: null, acceleration: null };
        }
        const growthRate = prev > 0 ? Math.round(((p.value - prev) / prev) * 1000) / 10 : 0;
        return { ...p, growthRate, velocity: p.value - prev, acceleration: null };
      });

      return points;
    } catch (_err: unknown) {
      // Không có số thật để trả — trả mảng rỗng để trend-provider-chain rơi
      // xuống provider kế tiếp, thay vì giả lập một chuỗi ngẫu nhiên.
      return [];
    }
  }

  async getRelatedTopics(
    _topic: string,
    _geo: string = "VN"
  ): Promise<RelatedTopicData[]> {
    // V1: chưa nối luồng RELATED_QUERIES/RELATED_TOPICS thật (cần thêm 1 cặp
    // explore+widgetdata riêng, cùng cơ chế token ở trên). Trả mảng rỗng để
    // provider kế tiếp trong chain đảm nhận, không bịa danh sách chủ đề liên
    // quan giả — đúng luật "không bịa số" khi chưa có nguồn thật.
    return [];
  }

  async healthCheck(): Promise<ProviderHealthReport> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("https://trends.google.com/trends/?geo=VN", {
        signal: controller.signal,
        method: "HEAD",
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          provider: this.name,
          status: "HEALTHY",
          latencyMs,
          errorRate: 0,
          quotaStatus: "OK",
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
        quotaStatus: "BLOCKED_OR_OFFLINE",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
