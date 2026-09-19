/**
 * Ảnh minh họa & tiêu đề gọn cho các thẻ cơ hội/chủ đề trong Market Intelligence.
 *
 * Bối cảnh (19/09/2026): Tony phản ánh các thẻ hiển thị quá nhiều chữ và câu tiêu đề
 * lặp công thức "Cơ hội nội dung theo xu hướng X phù hợp phong cách Y" trên mọi thẻ.
 * Muốn có thêm hình ảnh cho cuốn hút hơn — nhưng các "dẫn chứng" (evidenceReferences)
 * hiện chỉ là link trang tìm kiếm chung (vd. tiktok.com/search?q=...), KHÔNG phải link
 * tới một video/ảnh cụ thể, nên không có thumbnail thật để lấy. Theo quyết định của Tony,
 * dùng ảnh hoa thật nhưng mang tính MINH HỌA theo chủ đề (không claim là ảnh chụp từ
 * video/bài đăng dẫn chứng cụ thể nào).
 *
 * Toàn bộ URL ảnh bên dưới đã được xác minh tồn tại thật trên Unsplash (không phải ID
 * tự bịa) trước khi đưa vào — tránh ảnh vỡ/404.
 */

export interface IllustrationEntry {
  url: string;
  alt: string;
}

interface IllustrationCategory {
  keywords: string[];
  images: IllustrationEntry[];
}

const CATEGORIES: IllustrationCategory[] = [
  {
    keywords: ["cưới", "kỷ niệm", "yêu", "tình"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80",
        alt: "Bó hoa cưới hồng phấn",
      },
      {
        url: "https://images.unsplash.com/photo-1676868198934-ef67ee2c808c?auto=format&fit=crop&w=600&q=80",
        alt: "Hoa hồng đỏ lãng mạn",
      },
    ],
  },
  {
    keywords: ["tốt nghiệp", "cử nhân", "bó hoa"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1543409777-30250849aa3e?auto=format&fit=crop&w=600&q=80",
        alt: "Bó hoa hướng dương",
      },
    ],
  },
  {
    keywords: ["khai trương", "công ty", "đối tác", "doanh nghiệp"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?auto=format&fit=crop&w=600&q=80",
        alt: "Lan hồ điệp",
      },
    ],
  },
  {
    keywords: ["sinh nhật", "mẹ", "chúc mừng", "tặng"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1610599929507-fac366fb4252?auto=format&fit=crop&w=600&q=80",
        alt: "Hoa hồng sinh nhật",
      },
      {
        url: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80",
        alt: "Giỏ hoa mẫu đơn",
      },
    ],
  },
];

const DEFAULT_IMAGES: IllustrationEntry[] = [
  {
    url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
    alt: "Bó hoa hồng pastel",
  },
  {
    url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80",
    alt: "Hoa tulip tone cam",
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Chọn ảnh minh họa theo từ khóa trong `text`, xoay vòng nhiều ảnh trong cùng
 * danh mục dựa trên `id` để các thẻ cùng danh mục không lặp y hệt một ảnh.
 */
export function getFlowerIllustration(id: string, text: string): IllustrationEntry {
  const normalized = text.toLowerCase();
  const matched = CATEGORIES.find((cat) => cat.keywords.some((kw) => normalized.includes(kw)));
  const pool = matched ? matched.images : DEFAULT_IMAGES;
  const idx = hashString(id) % pool.length;
  return pool[idx]!;
}

interface OpportunityLike {
  id: string;
  topicName: string;
  opportunitySummary: string;
  audience?: string | null;
}

export function getOpportunityIllustration(item: OpportunityLike): IllustrationEntry {
  return getFlowerIllustration(
    item.id,
    `${item.topicName} ${item.opportunitySummary} ${item.audience || ""}`
  );
}

interface HeadlineLike {
  opportunitySummary: string;
  recommendedHooks?: unknown;
}

/**
 * Tiêu đề gọn cho thẻ: ưu tiên câu Hook giật tít cụ thể (đã có sẵn trong dữ liệu,
 * khác nhau theo từng cơ hội) thay vì câu mô tả công thức lặp lại
 * "Cơ hội nội dung theo xu hướng X phù hợp phong cách Y" trên mọi thẻ.
 */
export function getOpportunityHeadline(item: HeadlineLike): string {
  const hooks = Array.isArray(item.recommendedHooks) ? item.recommendedHooks : [];
  const firstHook = hooks.find((h): h is string => typeof h === "string" && h.trim().length > 0);
  return firstHook ? firstHook.trim() : item.opportunitySummary;
}
