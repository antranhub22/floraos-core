import { describe, it, expect } from "vitest";
import { extractYouTubeVideoId } from "@/components/market-intelligence/video-preview-modal";

describe("extractYouTubeVideoId", () => {
  it("trích xuất chính xác ID từ URL YouTube chuẩn watch?v=", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=sE9qFNfInw8")).toBe("sE9qFNfInw8");
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=8fR6IEYH880&t=10s")).toBe("8fR6IEYH880");
  });

  it("trích xuất chính xác ID từ URL ngắn youtu.be/", () => {
    expect(extractYouTubeVideoId("https://youtu.be/0oDJt8dzHrE")).toBe("0oDJt8dzHrE");
  });

  it("trích xuất chính xác ID từ YouTube Shorts và Embed", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/XCGy6RSa_gg")).toBe("XCGy6RSa_gg");
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/-Y4zNZW2_Cg")).toBe("-Y4zNZW2_Cg");
  });

  it("trích xuất chính xác ID từ CDN thumbnail YouTube (i.ytimg.com/vi/)", () => {
    expect(extractYouTubeVideoId("https://i.ytimg.com/vi/sE9qFNfInw8/hqdefault.jpg")).toBe("sE9qFNfInw8");
    expect(extractYouTubeVideoId("https://i.ytimg.com/vi/8fR6IEYH880/maxresdefault.jpg")).toBe("8fR6IEYH880");
  });

  it("trả về null nếu URL không hợp lệ hoặc không phải YouTube", () => {
    expect(extractYouTubeVideoId(undefined)).toBeNull();
    expect(extractYouTubeVideoId("")).toBeNull();
    expect(extractYouTubeVideoId("https://www.tiktok.com/@hoatuoituongan")).toBeNull();
  });
});
