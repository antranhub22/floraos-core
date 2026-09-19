/**
 * Cổng thu thập dữ liệu xu hướng thị trường — đặc tả 10 và Phân hệ Market Intelligence.
 *
 * Mọi adapter thu thập dữ liệu xu hướng (Google Trends, SerpApi, TikTok, v.v.)
 * đều phải tuân thủ hợp đồng này. Không use-case nào được gọi trực tiếp API
 * của nhà cung cấp ngoài cổng.
 */

export interface TrendSearchQuery {
  readonly query: string;
  readonly geo?: string; // Mặc định 'VN'
  readonly timeframe?: string; // Mặc định 'now 7-d' hoặc 'today 1-m'
  readonly category?: number; // Mã danh mục (ví dụ hoa/quà tặng)
  readonly industry?: string; // Mặc định 'florist'
  readonly channel?: string; // 'omnichannel' | 'web' | 'tiktok' | 'youtube'
}

export interface TrendSignalData {
  readonly platform: string;
  readonly topicRaw: string;
  readonly countryCode: string;
  readonly regionCode?: string | null;
  readonly city?: string | null;
  readonly industry: string;
  readonly metricName: string;
  readonly metricValue: number;
  readonly growthRate?: number | null;
  readonly confidence: number;
  readonly capturedAt: Date;
}

export interface TrendTimeseriesPoint {
  readonly date: Date;
  readonly value: number;
  readonly growthRate?: number | null;
  readonly velocity?: number | null;
  readonly acceleration?: number | null;
  readonly confidence: number;
}

export interface RelatedTopicData {
  readonly topicName: string;
  readonly topicType?: string | null;
  readonly metricValue: number;
  readonly isBreakout?: boolean;
}

export interface ProviderHealthReport {
  readonly provider: string;
  readonly status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  readonly latencyMs: number;
  readonly errorRate: number;
  readonly quotaStatus?: string | null;
  readonly message?: string | null;
}

export interface TrendProvider {
  readonly name: string;

  /** Tìm kiếm các tín hiệu xu hướng theo từ khóa / chủ đề */
  searchTrends(query: TrendSearchQuery): Promise<TrendSignalData[]>;

  /** Lấy chuỗi thời gian biến thiên của một chủ đề */
  getTimeseries(
    topic: string,
    timeframe?: string,
    geo?: string
  ): Promise<TrendTimeseriesPoint[]>;

  /** Lấy các chủ đề liên quan (related queries / topics) */
  getRelatedTopics(topic: string, geo?: string): Promise<RelatedTopicData[]>;

  /** Kiểm tra sức khỏe kết nối và quota của nhà cung cấp */
  healthCheck(): Promise<ProviderHealthReport>;
}
