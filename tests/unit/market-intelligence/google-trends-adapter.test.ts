import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleTrendsAdapter } from "@/modules/market-intelligence/adapters/google-trends-adapter";

/**
 * Đối tượng test này khoá đúng quy tắc "không bịa số" (v1.0 mục 59 quy tắc
 * #9 / v2.0 mục 34): adapter phải trích metricValue/growthRate THẬT từ
 * luồng 2 bước explore + widgetdata/multiline, và phải NÉM LỖI (hoặc trả
 * mảng rỗng cho timeseries) khi không có dữ liệu thật để trích — không
 * được trả hằng số cố định (75.0/15.0 như phiên bản trước khi sửa).
 */

function withPrefix(obj: unknown): string {
  return ")]}',\n" + JSON.stringify(obj);
}

function mockJsonResponse(body: string) {
  return { ok: true, status: 200, statusText: "OK", text: async () => body };
}

describe("GoogleTrendsAdapter — trích giá trị thật từ luồng explore + widgetdata/multiline", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("searchTrends trả đúng metricValue/growthRate thật, không phải hằng số cố định", async () => {
    const exploreResponse = withPrefix({
      widgets: [
        { id: "TIMESERIES", token: "TOKEN_ABC", request: { time: "now 7-d" } },
        { id: "GEO_MAP", token: "OTHER_TOKEN", request: {} },
      ],
    });

    const multilineResponse = withPrefix({
      default: {
        timelineData: [
          { time: "1000", value: [40], hasData: [true] },
          { time: "2000", value: [60], hasData: [true] },
          { time: "3000", value: [80], hasData: [true] },
        ],
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(exploreResponse))
      .mockResolvedValueOnce(mockJsonResponse(multilineResponse));
    global.fetch = fetchMock as unknown as typeof fetch;

    const adapter = new GoogleTrendsAdapter();
    const signals = await adapter.searchTrends({ query: "hoa pastel", geo: "VN" });

    expect(signals).toHaveLength(1);
    const [signal] = signals;
    expect(signal).toBeDefined();
    if (!signal) throw new Error("unreachable");

    // Giá trị THẬT cuối chuỗi (80), không phải hằng số cũ 75.0.
    expect(signal.metricValue).toBe(80);
    // (80 - 40) / 40 * 100 = 100% — tính thật từ chuỗi, không phải hằng số cũ 15.0.
    expect(signal.growthRate).toBeCloseTo(100, 0);
    expect(signal.confidence).toBe(0.85);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ném lỗi khi không tìm thấy widget TIMESERIES/token — không bịa tín hiệu mặc định", async () => {
    const exploreResponse = withPrefix({
      widgets: [{ id: "GEO_MAP", token: "x", request: {} }],
    });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(exploreResponse)) as unknown as typeof fetch;

    const adapter = new GoogleTrendsAdapter();
    await expect(adapter.searchTrends({ query: "hoa pastel", geo: "VN" })).rejects.toThrow();
  });

  it("ném lỗi khi timeline rỗng — không trả metricValue mặc định 50.0/75.0 như bản cũ", async () => {
    const exploreResponse = withPrefix({
      widgets: [{ id: "TIMESERIES", token: "TOKEN_ABC", request: {} }],
    });
    const multilineResponse = withPrefix({ default: { timelineData: [] } });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(exploreResponse))
      .mockResolvedValueOnce(mockJsonResponse(multilineResponse)) as unknown as typeof fetch;

    const adapter = new GoogleTrendsAdapter();
    await expect(adapter.searchTrends({ query: "hoa pastel", geo: "VN" })).rejects.toThrow();
  });

  it("getTimeseries trả mảng rỗng khi không có dữ liệu thật, không bịa chuỗi ngẫu nhiên", async () => {
    const exploreResponse = withPrefix({ widgets: [] });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(exploreResponse)) as unknown as typeof fetch;

    const adapter = new GoogleTrendsAdapter();
    const points = await adapter.getTimeseries("hoa pastel");
    expect(points).toEqual([]);
  });

  it("healthCheck vẫn hoạt động độc lập với luồng dữ liệu (không đổi hành vi cũ)", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 200 }) as unknown as typeof fetch;
    const adapter = new GoogleTrendsAdapter();
    const report = await adapter.healthCheck();
    expect(report.provider).toBe("google_trends");
    expect(["HEALTHY", "DEGRADED", "UNAVAILABLE"]).toContain(report.status);
  });
});
