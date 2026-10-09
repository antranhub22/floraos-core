/**
 * Landing Page 7-Section Content Generator.
 * Hợp nhất 3 nguồn: Business Profile + Dynamic Market/Product Signals + User Directives.
 * Pure Domain - Không phụ thuộc DB hay mạng.
 */

import { type ToneOfVoice } from "./flower-content-presets"
import { sanitizeFlowerText } from "./flower-banned-dictionary"

export interface LandingContentInput {
  shopName: string
  shopTone?: ToneOfVoice | string | undefined
  occasionId: string
  occasionLabel: string
  archetypeId?: string | undefined
  selectedProducts: Array<{
    name: string
    code?: string | undefined
    price?: number | null | undefined
    category?: string | null | undefined
  }>
  userDirectives?: string | undefined
  discountPercent?: number | undefined
  usps?: string[] | undefined
  guarantees?: string[] | undefined
  targetAudience?: string | undefined
  designDirection?: string | undefined
}

export interface LandingSectionHero {
  badge: string
  headline: string
  subHeadline: string
  countdownLabel: string
}

export interface LandingSectionStory {
  title: string
  paragraphs: string[]
  quote: string
  floristName: string
}

export interface LandingSectionPerk {
  id: string
  title: string
  description: string
  icon: "camera" | "clock" | "shield" | "gift"
}

export interface LandingSectionStep {
  step: number
  title: string
  description: string
}

export interface LandingSectionFaq {
  question: string
  answer: string
}

export interface LandingSectionLead {
  tag: string
  title: string
  description: string
  discountBadge: string
  urgencyNotice: string
}

export interface GeneratedLandingPackage {
  hero: LandingSectionHero
  story: LandingSectionStory
  perks: LandingSectionPerk[]
  steps: LandingSectionStep[]
  faq: LandingSectionFaq[]
  lead: LandingSectionLead
}

/**
 * Sinh gói nội dung hoàn chỉnh cho 7 Sections của Landing Page
 */
export function generateLandingPageContent(input: LandingContentInput): GeneratedLandingPackage {
  const shop = input.shopName || "Siin Store"
  const occasion = input.occasionLabel || "Dịp Đặc Biệt"
  const directive = input.userDirectives ? sanitizeFlowerText(input.userDirectives) : ""
  const discount = input.discountPercent || 10

  const primaryProduct = input.selectedProducts[0]?.name || "những tác phẩm hoa tươi tuyển chọn"
  const flowerCount = input.selectedProducts.length

  // 1. Hero Content — Đa dạng biến thể (Stochastic Variant Pool)
  const heroBadgeOptions = [
    `Bộ Sưu Tập Giới Hạn • Mừng ${occasion}`,
    `Tuyệt Tác Thiết Kế • Dịp ${occasion}`,
    `Bộ Sưu Tập Độc Bản • Mùa ${occasion}`,
    `Tuyển Chọn Tinh Hoa • Chào ${occasion}`,
  ]
  const heroBadge = heroBadgeOptions[Math.floor(Math.random() * heroBadgeOptions.length)] ?? `Bộ Sưu Tập Giới Hạn • Mừng ${occasion}`

  const headlinePools: Record<string, Array<{ headline: string; sub: string }>> = {
    "20-10": [
      {
        headline: `Tôn Vinh Phái Đẹp — Ngàn Lời Tri Ân Gửi Trao Ngày ${occasion}`,
        sub: `Mỗi cánh hoa là một lời cảm ơn sâu sắc gửi đến người phụ nữ tuyệt vời nhất trong cuộc đời bạn. Thiết kế độc bản bởi nghệ nhân ${shop}.`,
      },
      {
        headline: `Thay Ngàn Lời Yêu — Tuyệt Tác Hoa Tươi Dành Riêng Cho Nàng`,
        sub: `Tuyển chọn những đóa hoa nhập khẩu rực rỡ nhất từ ${shop}, thay bạn gửi gắm trọn vẹn tình cảm chân thành và sự tinh tế.`,
      },
      {
        headline: `Đóa Hoa Cảm Xúc — Tỏa Sáng Nét Duyên Dáng Của Người Phụ Nữ Bạn Yêu`,
        sub: `Sự kết hợp hoàn mỹ giữa sắc hoa thanh tao và nghệ thuật cắm hoa hiện đại tại ${shop}, món quà xứng tầm trao gửi trân quý.`,
      },
      {
        headline: `Trao Gửi Trân Quý — Món Quà Hoàn Hảo Chạm Đến Trái Tim`,
        sub: `Dành tặng mẹ, vợ, đối tác hay người thương những đóa hoa tươi sớm tinh khôi từ ${shop}, lưu giữ khoảnh khắc ngọt ngào ngày ${occasion}.`,
      },
    ],
    "valentine": [
      {
        headline: `Gửi Trọn Tình Yêu — Ngọt Ngào & Nồng Nàn Mùa Lễ Tình Nhân`,
        sub: `Những đóa hồng Ecuador tuyển chọn loại 1 từ ${shop}, minh chứng cho tình yêu vĩnh cửu và sự chân thành sâu sắc nhất.`,
      },
      {
        headline: `Khoảnh Khắc Tỏ Tình — Rung Động Con Tim Mùa Lễ Tình Nhân`,
        sub: `Từng cánh hồng nhung đỏ thắm được phối cùng hoa baby dịu dàng từ ${shop}, tạo nên bản hòa ca lãng mạn bất tận.`,
      },
    ],
    "khai-truong": [
      {
        headline: `Khai Trương Hồng Phát — Tài Lộc Tấn Tới, Vạn Sự Hanh Thông`,
        sub: `Kệ hoa và giỏ hoa chúc mừng từ ${shop} mang sắc màu đại cát, chúc đối tác kinh doanh phát tài, may mắn khởi sắc.`,
      },
      {
        headline: `Khai Trương Hồng Phát — Đại Cát Đại Lợi, Đón Đầu Thịnh Vượng`,
        sub: `Thiết kế hoa chúc mừng sang trọng, nổi bật và trang nghiêm từ ${shop}, thay lời chúc đối tác mã đáo thành công.`,
      },
    ],
  }

  const defaultOccasionPool = [
    {
      headline: `Trao Yêu Thương Trọn Vẹn — Tôn Vinh Khoảnh Khắc ${occasion}`,
      sub: `Tuyển chọn những đóa hoa tươi nhập khẩu rực rỡ nhất từ ${shop}, gửi gắm trọn vẹn tình cảm và sự tinh tế đến người bạn trân quý.`,
    },
    {
      headline: `Sắc Hoa Tươi Mới — Rạng Rỡ Khoảnh Khắc Kỷ Niệm ${occasion}`,
      sub: `Mỗi tác phẩm hoa tại ${shop} là một bản giao hưởng màu sắc, đem niềm vui bất ngờ và hạnh phúc ngập tràn đến người nhận.`,
    },
    {
      headline: `Món Quà Tinh Tế — Gắn Kết Yêu Thương Dịp ${occasion}`,
      sub: `Trao hoa tươi, gửi tấm lòng. Những thiết kế độc quyền từ nghệ nhân ${shop} giúp lời chúc mừng của bạn trở nên đáng nhớ hơn bao giờ hết.`,
    },
  ]

  const activePool = headlinePools[input.occasionId] || defaultOccasionPool
  const pickedVariant = activePool[Math.floor(Math.random() * activePool.length)] ?? activePool[0]!
  let heroHeadline = pickedVariant.headline
  let heroSubHeadline = pickedVariant.sub

  if (directive) {
    heroSubHeadline += ` Điểm nhấn: ${directive}.`
  }

  // 2. Brand & Florist Craftsmanship Story — Biến thể góc kể chuyện
  const storyAngles = [
    {
      title: `Nghệ Thuật Cắm Hoa & Triết Lý Chăm Sóc Tại ${shop}`,
      paragraphs: [
        `Tại ${shop}, chúng tôi tin rằng hoa tươi không đơn thuần là một món quà, mà là chiếc cầu nối cảm xúc vô giá giữa hai tâm hồn. Mỗi thiết kế trong bộ sưu tập ${occasion} đều được chăm chút tỉ mỉ từ khâu chọn lọc từng đóa hoa tươi sớm tinh khôi đến cách phối màu hài hòa chuẩn phong cách hiện đại.`,
        `Với hơn ${flowerCount > 0 ? `${flowerCount} thiết kế tâm điểm` : "nhiều mẫu hoa độc bản"}, tiêu biểu như ${primaryProduct}, các nghệ nhân tại ${shop} kết hợp kỹ thuật dưỡng hoa nhập khẩu chuyên sâu giúp hoa giữ trọn độ bung nở tươi tắn suốt 3–5 ngày.`,
      ],
      quote: `“Chúng tôi không chỉ cắm hoa, chúng tôi gửi gắm cả sự trân trọng và tấm lòng của người tặng vào từng nhành lá, cánh hoa.”`,
    },
    {
      title: `Đam Mê Bất Tận Với Từng Đóa Hoa Tươi Tại ${shop}`,
      paragraphs: [
        `Mỗi sáng từ 5:00, các nghệ nhân tại ${shop} đều đích thân tuyển lựa từng cành hoa mới về từ các nông trại Đà Lạt và nhà vườn nhập khẩu Hà Lan, Ecuador. Chúng tôi tin rằng độ tươi và hồn hoa là linh hồn tạo nên sự khác biệt của món quà ${occasion}.`,
        `Tác phẩm ${primaryProduct} cùng các mẫu hoa trong chiến dịch lần này mang phong cách tự nhiên, bay bổng nhưng vô cùng thanh lịch, sẵn sàng làm xiêu lòng bất kỳ ai ngay từ ánh nhìn đầu tiên.`,
      ],
      quote: `“Một đóa hoa đẹp có thể thay vạn lời muốn nói, xua tan mọi mỏi mệt và sưởi ấm những trái tim.”`,
    },
    {
      title: `Tiêu Chuẩn Hoa Tươi Cao Cấp & Tinh Hoa Sáng Tạo Tại ${shop}`,
      paragraphs: [
        `Chúng tôi áp dụng quy trình kiểm soát chất lượng 3 bước nghiêm ngặt: từ tuyển chọn cành hoa chuẩn loại 1, dưỡng hoa bằng công thức khoáng chất độc quyền, đến thiết kế cắm hoa bởi đội ngũ florist hơn 7 năm kinh nghiệm.`,
        `Với bộ sưu tập ${occasion}, ${shop} mong muốn đồng hành cùng quý khách tạo nên những ký ức trọn vẹn, đáng nhớ thông qua các tuyệt tác như ${primaryProduct}.`,
      ],
      quote: `“Sự hài lòng và nụ cười rạng ngời của người nhận chính là thước đo giá trị cao nhất cho tâm huyết của chúng tôi.”`,
    },
  ]

  const pickedStory = storyAngles[Math.floor(Math.random() * storyAngles.length)] ?? storyAngles[0]!
  const storyTitle = pickedStory.title
  const storyParagraphs = pickedStory.paragraphs
  const storyQuote = pickedStory.quote

  // 3. Service Perks (4 Cam kết vàng)
  const perks: LandingSectionPerk[] = [
    {
      id: "perk-1",
      title: "Chụp ảnh duyệt trước khi giao",
      description: "Thợ cắm hoa chụp ảnh thật 360 độ gửi khách duyệt qua Zalo, ưng ý 100% mới đóng gói xuất xưởng.",
      icon: "camera",
    },
    {
      id: "perk-2",
      title: "Giao hỏa tốc chuẩn hẹn 2h",
      description: "Đội ngũ giao hoa chuyên nghiệp bảo đảm hoa đứng dáng, đúng địa chỉ và đúng thời khắc hẹn.",
      icon: "clock",
    },
    {
      id: "perk-3",
      title: "Cam kết hoa tươi bền 3–5 ngày",
      description: "Hoa mới về mỗi sớm, dưỡng bằng dung dịch dinh dưỡng hữu cơ độc quyền giữ sắc hoa rực rỡ dài lâu.",
      icon: "shield",
    },
    {
      id: "perk-4",
      title: "Tặng thiệp & banner thiết kế riêng",
      description: "In thiệp thông điệp tay hoặc banner nhũ sang trọng miễn phí, truyền tải trọn vẹn lời chúc yêu thương.",
      icon: "gift",
    },
  ]

  // 4. 3-Step Ordering Process
  const steps: LandingSectionStep[] = [
    {
      step: 1,
      title: "Chọn mẫu & Gửi thông điệp",
      description: `Lựa chọn thiết kế yêu thích trong bộ sưu tập ${occasion} và để lại nội dung chúc mừng mong muốn.`,
    },
    {
      step: 2,
      title: "Nghệ nhân thực hiện & Chụp duyệt",
      description: `Florist tay nghề cao tại ${shop} tuyển hoa mới cắm và gửi ảnh thực tế qua Zalo cho bạn duyệt trước.`,
    },
    {
      step: 3,
      title: "Giao hoa tận tay & Báo cáo",
      description: "Shipper giao hoa nâng niu đến tận tay người nhận và gửi ảnh xác nhận hoàn tất giao hàng tức thì.",
    },
  ]

  // 5. FAQ Questions & Answers
  const faq: LandingSectionFaq[] = [
    {
      question: "Hoa thực tế khi giao có giống 100% hình mẫu trên trang không?",
      answer: `Vì hoa tươi phụ thuộc theo mùa và độ nở tự nhiên của từng cành hoa, ${shop} cam kết độ giống mẫu đạt từ 90%–95% về tone màu và kiểu dáng. Đặc biệt, tiệm luôn chụp ảnh thực tế gửi bạn duyệt trước khi giao.`,
    },
    {
      question: "Tôi cần đặt hoa gấp trong vòng 2 tiếng thì có kịp không?",
      answer: `Hoàn toàn kịp thời! ${shop} luôn có sẵn các loại hoa tươi mới nhập trong ngày và nghệ nhân túc trực để hoàn thiện và giao hỏa tốc nội thành trong 90–120 phút.`,
    },
    {
      question: "Cửa hàng có xuất hóa đơn điện tử VAT cho công ty không?",
      answer: "Có. Chúng tôi hỗ trợ xuất đầy đủ hóa đơn VAT điện tử nhanh chóng theo thông tin doanh nghiệp quý khách yêu cầu.",
    },
    {
      question: "Chính sách đổi trả hoặc bảo hành hoa tươi như thế nào?",
      answer: `Nếu hoa bị dập nát, gãy cành do quá trình vận chuyển hoặc không đúng mẫu đã duyệt, ${shop} cam kết 1 đổi 1 hoặc hoàn tiền 100% ngay lập tức cho quý khách.`,
    },
  ]

  // 6. Lead Capture & Special Promotion
  const lead: LandingSectionLead = {
    tag: "Đặc Quyền Đặt Hoa Sớm",
    title: `Nhận Ngay Ưu Đãi ${discount}% & Tặng Thiệp Thiết Kế Riêng`,
    description: `Áp dụng cho quý khách hàng đăng ký đặt trước trong chiến dịch "${occasion}". Số lượng hoa tuyển chọn mỗi ngày có hạn để đảm bảo chất lượng phục vụ tốt nhất!`,
    discountBadge: `GIẢM ${discount}%`,
    urgencyNotice: "Ưu đãi có thể đóng sớm khi xưởng đạt hạn mức nhận đơn trong ngày.",
  }

  return {
    hero: {
      badge: heroBadge,
      headline: heroHeadline,
      subHeadline: heroSubHeadline,
      countdownLabel: "Ưu đãi đặt sớm còn:",
    },
    story: {
      title: storyTitle,
      paragraphs: storyParagraphs,
      quote: storyQuote,
      floristName: `Nghệ nhân ${shop}`,
    },
    perks,
    steps,
    faq,
    lead,
  }
}
