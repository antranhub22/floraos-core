/**
 * Domain: Social Post Generator — Sinh nội dung bài viết hoàn chỉnh đa kênh.
 *
 * Tạo bài viết mẫu chuyên sâu cho 4 nền tảng mạng xã hội:
 * 1. Facebook Fanpage: Bài viết dài, đầy đủ cung truyện, thông số, cam kết & CTA.
 * 2. Instagram: Caption thẩm mỹ cao, spacing thơ mộng, bullet points & visual aesthetic.
 * 3. TikTok: Kịch bản video 3s đầu giật tít + caption ngắn kích thích tương tác/bình luận.
 * 4. Zalo OA: Tin nhắn tư vấn bán hàng chuyên nghiệp, báo giá rõ ràng & hotline.
 *
 * Thuần TypeScript — Zero dependencies — 100% Deterministic & Safe.
 */

export interface SocialPostParams {
  platform: "facebook" | "instagram" | "tiktok" | "zalo"
  mode: "CREATIVE" | "AUTHENTIC"
  productName: string
  components?: readonly string[] | undefined
  colors?: readonly string[] | undefined
  style?: string | undefined
  price?: string | number | undefined
  topicTitle: string
  hook?: string | undefined
  cta?: string | undefined
  hashtags?: readonly string[] | undefined
}

export interface GeneratedSocialPost {
  platform: "facebook" | "instagram" | "tiktok" | "zalo"
  platformLabel: string
  icon: string
  headline: string
  fullContent: string
  hashtags: string[]
  characterCount: number
  targetAudience: string
  recommendedPostingTime: string
}

export function generateSocialPost(params: SocialPostParams): GeneratedSocialPost {
  const {
    platform,
    mode,
    productName,
    components = ["Hoa hồng tươi tuyển chọn", "Hoa baby trắng", "Lá bạc Eucalyptus"],
    colors = ["Hồng pastel", "Trắng kem"],
    style = "Hiện đại & Tinh tế",
    price = "599.000đ",
    topicTitle,
    hook,
    cta,
    hashtags = ["#hoatuoi", "#quatang", "#hoaflorist"],
  } = params

  const flowerList = components.length > 0 ? components.join(", ") : "Hoa tươi tuyển chọn chuẩn form"
  const colorStr = colors.length > 0 ? colors.join(" & ") : "Tone màu thanh lịch"
  const formattedPrice = typeof price === "number" ? `${price.toLocaleString("vi-VN")}đ` : price

  switch (platform) {
    case "facebook": {
      const fbHeadline = hook
        ? `🌸 ${hook.toUpperCase()}`
        : `🌸 ${productName.toUpperCase()} — TRỌN VẸN YÊU THƯƠNG TỪ ÁNH NHÌN ĐẦU TIÊN`

      const fbBody = mode === "CREATIVE"
        ? `Có những khoảnh khắc lời nói chẳng thể diễn tả hết tấm lòng, hãy để những đóa hoa tươi thay bạn gửi gắm sự chân thành sâu sắc nhất.\n\n` +
          `✨ Thiết kế độc bản: ${productName}\n` +
          `💐 Phong cách: ${style} — Sự kết hợp hài hòa giữa ${colorStr}.\n` +
          `🌿 Thành phần hoa tuyển chọn: ${flowerList}.\n` +
          `🎀 Bao bì: Giấy gói cao cấp, thắt nơ ruy băng voan sang trọng chuẩn phong cách quà tặng cao cấp.\n\n` +
          `🎁 ĐẶC QUYỀN KHI ĐẶT HOA TẠI TIỆM:\n` +
          `✓ Miễn phí thiệp thiết kế riêng in thông điệp chúc mừng theo yêu cầu.\n` +
          `✓ Tặng kèm gói dưỡng hoa tươi bền lâu từ 5–7 ngày.\n` +
          `✓ Chụp ảnh thành phẩm gửi quý khách duyệt trước khi giao.\n` +
          `✓ Giao nhanh hỏa tốc trong 2 giờ — Đảm bảo hoa tươi nguyên vẹn đến tận tay người nhận.\n\n` +
          `🏷️ Giá ưu đãi hôm nay: ${formattedPrice}\n\n` +
          `👉 ${cta || "Nhắn tin trực tiếp cho Fanpage để nhận tư vấn mẫu hoa và ưu đãi giao hàng trong ngày!"}`
        : `Chào cả nhà! Hôm nay xưởng vừa cắm xong một mẫu hoa rất đỗi dịu dàng và muốn chia sẻ ngay cùng bạn.\n\n` +
          `Bó hoa "${productName}" mang phong cách ${style}, được chính tay thợ hoa cắm tỉ mỉ từng cành ${flowerList}.\n` +
          `Tone màu ${colorStr} dịu mát, không quá cầu kỳ nhưng toát lên vẻ trang nhã, rất thích hợp tặng sinh nhật, kỷ niệm hay đơn giản là tự thưởng cho bản thân một ngày an yên.\n\n` +
          `🎁 Tiệm luôn tặng kèm thiệp viết tay và gói thuốc dưỡng hoa cho bạn nhé.\n` +
          `🏷️ Giá tại xưởng: ${formattedPrice}\n\n` +
          `👉 ${cta || "Bạn cần đặt hoa nhắn tin tiệm chuẩn bị chu đáo nhé!"}`

      const allFbHashtags = Array.from(new Set([...hashtags, "#hoatuoithietke", "#shophoatuoi", "#hoasinhnhat"]))
      const fullContent = `${fbHeadline}\n\n${fbBody}\n\n${allFbHashtags.join(" ")}`

      return {
        platform: "facebook",
        platformLabel: "Facebook Fanpage",
        icon: "📘",
        headline: fbHeadline,
        fullContent,
        hashtags: allFbHashtags,
        characterCount: fullContent.length,
        targetAudience: "Khách hàng mua tặng người yêu, gia đình, đối tác (22–45 tuổi)",
        recommendedPostingTime: "08:30 – 11:30 & 19:30 – 21:30",
      }
    }

    case "instagram": {
      const igHeadline = `✨ ${hook || topicTitle}`
      const igBody =
        `Có những ngày chẳng cần lý do đặc biệt...\n` +
        `Chỉ cần một bó hoa dịu dàng để làm ai đó mỉm cười trọn vẹn. 🌿\n\n` +
        `• Design: ${productName}\n` +
        `• Palette: ${colorStr}\n` +
        `• Flowers: ${flowerList}\n` +
        `• Style: ${style}\n\n` +
        `Bó hoa được thiết kế với từng đóa hoa nở chuẩn form, giấy gói lụa mờ tôn lên vẻ đẹp tự nhiên nhất. Tặng kèm thiệp thiết kế & freeship nội thành.\n\n` +
        `Price: ${formattedPrice}\n\n` +
        `💌 ${cta || "Send a DM to order your personalized bouquet today."}`

      const allIgHashtags = Array.from(new Set([...hashtags, "#floristsofinstagram", "#aestheticflowers", "#flowerlover", "#saigonflorist"]))
      const fullContent = `${igHeadline}\n\n${igBody}\n\n${allIgHashtags.join(" ")}`

      return {
        platform: "instagram",
        platformLabel: "Instagram Reels & Post",
        icon: "📸",
        headline: igHeadline,
        fullContent,
        hashtags: allIgHashtags,
        characterCount: fullContent.length,
        targetAudience: "Giới trẻ, người yêu thích nghệ thuật & thẩm mỹ (18–35 tuổi)",
        recommendedPostingTime: "11:30 – 13:30 & 20:00 – 22:30",
      }
    }

    case "tiktok": {
      const ttHeadline = hook
        ? `${hook}`
        : `Người ta thích hoa không phải vì nó đắt, mà vì người tặng nhớ đến họ... 🌿`

      const ttBody = mode === "CREATIVE"
        ? `${ttHeadline}\n\n` +
          `Mẫu hoa "${productName}" tone ${colorStr} nhẹ nhàng mà ngắm ngoài đời mê xỉu luôn! ✨\n` +
          `Tuyển chọn từng bông ${flowerList} tươi rói nở chuẩn form từ Đà Lạt.\n\n` +
          `💐 Mẫu này tặng sinh nhật, kỷ niệm hay tỏ tình người thương là chuẩn bài luôn nha!\n` +
          `🏷️ Giá ưu đãi: ${formattedPrice} (Đã gồm thiệp in thiết kế riêng & freeship)\n\n` +
          `👉 ${cta || "Comment ngày sinh nhật của người ấy bên dưới tiệm tư vấn mẫu chuẩn gu nha! 👇 Hoặc bấm nhắn tin tiệm giao nhanh 2 giờ 🚀"}`
        : `${ttHeadline}\n\n` +
          `Hôm nay xưởng vừa cắm xong mẫu "${productName}" này, vừa hoàn thiện là phải quay ngay cho cả nhà ngắm! 🌸\n` +
          `Tone màu ${colorStr} phối cùng ${flowerList}, mộc mạc dịu dàng mà tinh tế vô cùng.\n\n` +
          `🏷️ Giá tại xưởng: ${formattedPrice} (Tặng kèm thiệp viết tay & thuốc dưỡng hoa)\n\n` +
          `👉 ${cta || "Bạn cần đặt hoa nhắn tin tiệm chuẩn bị chu đáo nhé! Giao tận tay người thương trong 2h ạ 🛵💨"}`

      const allTtHashtags = Array.from(new Set([...hashtags, "#learnontiktok", "#trending", "#hoatuoi", "#quasinhnhat", "#shophoatuoi"]))
      const fullContent = `${ttBody}\n\n${allTtHashtags.join(" ")}`

      return {
        platform: "tiktok",
        platformLabel: "TikTok Video Caption (9:16)",
        icon: "🎵",
        headline: ttHeadline,
        fullContent,
        hashtags: allTtHashtags,
        characterCount: fullContent.length,
        targetAudience: "Gen Z & Millennials thích xem video ngắn và mua quà tặng (16–30 tuổi)",
        recommendedPostingTime: "12:00 – 14:00 & 19:00 – 22:00",
      }
    }

    case "zalo": {
      const zaloHeadline = `[TIỆM HOA TƯƠI] THÔNG BÁO MẪU HOA MỚI: ${productName.toUpperCase()}`
      const zaloBody =
        `Kính gửi Quý khách hàng,\n\n` +
        `Tiệm xin trân trọng giới thiệu mẫu hoa thiết kế mới nhất vừa hoàn thiện tại xưởng:\n\n` +
        `🌸 Tên sản phẩm: ${productName}\n` +
        `🎨 Phong cách: ${style} (${colorStr})\n` +
        `💐 Thành phần: ${flowerList}\n` +
        `🏷️ Giá niêm yết: ${formattedPrice}\n\n` +
        `🎁 ƯU ĐÃI ĐẶC QUYỀN KHÁCH HÀNG ZALO:\n` +
        `• Giảm ngay 10% khi đặt trước 24 giờ.\n` +
        `• Miễn phí thiệp in thông điệp & freeship bán kính 5km.\n` +
        `• Chụp ảnh hoa thực tế gửi anh/chị duyệt trước khi giao.\n` +
        `• Cam kết hoa tươi bền đẹp trên 5 ngày.\n\n` +
        `👉 ${cta || "Quý khách bấm 'Gửi tin nhắn' hoặc gọi hotline để được phục vụ chu đáo nhất ạ!"}`

      const fullContent = `${zaloHeadline}\n\n${zaloBody}`

      return {
        platform: "zalo",
        platformLabel: "Zalo OA Bán Hàng",
        icon: "💬",
        headline: zaloHeadline,
        fullContent,
        hashtags: [],
        characterCount: fullContent.length,
        targetAudience: "Khách hàng trung thành, khách công sở & doanh nghiệp (25–55 tuổi)",
        recommendedPostingTime: "08:00 – 09:30 & 16:30 – 18:00",
      }
    }
  }
}

/**
 * Sinh đồng thời trọn bộ cả 4 nền tảng cho 1 chiến dịch.
 */
export function generateAllPlatformPosts(params: Omit<SocialPostParams, "platform">): Record<string, GeneratedSocialPost> {
  return {
    facebook: generateSocialPost({ ...params, platform: "facebook" }),
    instagram: generateSocialPost({ ...params, platform: "instagram" }),
    tiktok: generateSocialPost({ ...params, platform: "tiktok" }),
    zalo: generateSocialPost({ ...params, platform: "zalo" }),
  }
}
