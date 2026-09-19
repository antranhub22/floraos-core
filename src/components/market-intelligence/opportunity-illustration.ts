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

export {
  type EvidenceItemLike,
  type OpportunityLike,
  type VideoEvidencePreview,
  type DualVideoEvidencePreview,
  getTopicDualRealVideoEvidence,
  getDualOpportunityEvidencePreview,
  getOpportunityEvidencePreview,
} from "./video-evidence-catalog";
import { getOpportunityEvidencePreview, type OpportunityLike } from "./video-evidence-catalog";

export function getOpportunityIllustration(item: OpportunityLike): IllustrationEntry {
  const preview = getOpportunityEvidencePreview(item);
  return {
    url: preview.thumbnailUrl,
    alt: preview.alt,
  };
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
  let text = firstHook?.trim() || item.opportunitySummary || "";

  // Xử lý mẫu câu lặp cũ "Bật mí bí quyết chọn ... không phải ai cũng biết"
  if (text.startsWith("Bật mí bí quyết chọn ") && text.endsWith(" không phải ai cũng biết")) {
    const rawTopic = text
      .replace("Bật mí bí quyết chọn ", "")
      .replace(" không phải ai cũng biết", "")
      .trim();
    // Lấy tên chủ đề chính, lọc bỏ danh sách từ khóa phân tách bằng dấu phẩy
    const cleanTopic = rawTopic.includes(",") ? rawTopic.split(",")[0]?.trim() || rawTopic : rawTopic;
    const lower = cleanTopic.toLowerCase();

    if (lower.includes("mẹ") || lower.includes("bố") || lower.includes("20/10") || lower.includes("8/3")) {
      return `Bí quyết chọn ${cleanTopic} ý nghĩa & đong đầy tình cảm`;
    }
    if (lower.includes("khai trương") || lower.includes("đối tác") || lower.includes("doanh nghiệp")) {
      return `Gợi ý ${cleanTopic} sang trọng chiêu tài lộc mừng hồng phát`;
    }
    if (lower.includes("cưới") || lower.includes("kỷ niệm")) {
      return `BST ${cleanTopic} thanh lịch dẫn đầu xu hướng năm nay`;
    }
    if (lower.includes("sinh nhật")) {
      return `Gợi ý ${cleanTopic} tinh tế ghi điểm tuyệt đối`;
    }
    if (lower.includes("tốt nghiệp")) {
      return `Top thiết kế ${cleanTopic} rực rỡ chúc mừng ngày cử nhân`;
    }
    return `Xu hướng thiết kế ${cleanTopic} chuẩn gu & tươi lâu`;
  }

  // Nếu tiêu đề là chuỗi nối nhiều từ khóa bằng dấu phẩy (vd: "BST Hoa 20/10, Bó hoa tốt nghiệp...")
  if (text.includes(",") && text.split(",").length >= 2) {
    const firstSegment = text.split(",")[0]?.trim() || text;
    if (firstSegment.toLowerCase().startsWith("bst ")) {
      return `${firstSegment} thanh lịch dẫn đầu xu hướng`;
    }
    return `${firstSegment} — Xu hướng thiết kế thịnh hành`;
  }

  return text;
}
