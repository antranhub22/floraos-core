/**
 * Giá theo `feature`, tính bằng credit — đặc tả 07 mục 7, ví dụ ở đặc tả 06
 * mục 8 (`"usage": { "cost_credit": 1, "balance_after": 479 }`).
 *
 * Không tài liệu nào của bộ đặc tả 13 tệp cho một bảng giá theo tính năng —
 * đây là một giả định đơn giản hoá, ghi ở
 * `docs/dac-ta/TECHNICAL_DEBT.md`. Hằng số, không phải cấu hình theo tổ
 * chức: D2 chốt nền tảng giữ khoá và tính credit, chưa nói giá khác nhau
 * giữa các tổ chức.
 *
 * Thuần: không import hạ tầng, test không cần cơ sở dữ liệu.
 */
const FEATURE_COST_CREDIT: Readonly<Record<string, number>> = {
  "vision.analyze": 1,
  // Sinh câu chữ bán hàng (M01b). Một lượt gọi mô hình ngôn ngữ trên dữ liệu
  // đã có sẵn, không đụng ảnh — rẻ hơn một lượt phân tích ảnh, nhưng KHÔNG
  // miễn phí: bỏ nó khỏi bảng này là mọi lượt sinh nội dung chạy ngoài sổ,
  // không trừ hạn mức và không đối soát được với hoá đơn nhà cung cấp.
  "product.copy.generate": 1,
  "media.optimize": 2,
  // Biến thể marketing (M04b). Rẻ hơn một lượt tối ưu vì nó KHÔNG gọi lại
  // mô hình tăng cường: chủ thể đã có sẵn trong Master Image, lượt này chỉ
  // tách nền, ghép bối cảnh và đóng khung. Nhưng vẫn là một lượt chạy mô
  // hình phân đoạn trên GPU, nên không đặt 0 — để 0 là mở lại đúng cái lỗ
  // mà P24 vừa vá: một đường chạy AI không đi qua sổ nào.
  //
  // Con số này là giả định tạm, cùng hạng với cả bảng — chốt giá thật cho
  // biến thể là nợ #64 (D14), chờ chủ sản phẩm.
  "media.variant": 1,
  // Nhánh Cloud của M04b (23/09/2026): cùng pipeline local, thêm MỘT lượt gọi
  // nhà cung cấp trả phí (Stability, sinh hậu cảnh). Đặt bằng `media.optimize`
  // — cũng là một lượt gọi mô hình ngoài trên một ảnh. Giá tạm, cùng hạng với
  // cả bảng — chờ chủ sản phẩm chốt ở nợ #64 (D14).
  "media.variant.cloud": 2,
  // Kịch bản bối cảnh theo chủ đề (24/09/2026): MỘT lượt gọi LLM văn bản,
  // cùng hạng với `product.copy.generate`. Giá tạm — chờ chủ sản phẩm (nợ #64).
  "creative.scene_plan": 1,
  // Sửa tại chỗ ở Chặng 07 (24/09/2026): mỗi lượt là MỘT lời gọi LLM văn bản.
  // Giá tạm — chờ chủ sản phẩm (nợ #64).
  "creative.scene_revise": 1,
  "creative.content_rewrite": 1,
  "catalog.generate": 1,
  "landing.generate": 1,
  "video.render": 5,
  // Audio Studio (24/09/2026): giá THẬT của từng lượt `audio.generate` tính
  // theo cảnh × nhà cung cấp × chất lượng (`audio-pricing-guard.ts`) và truyền
  // vào `enqueueJob({ costCredit })`; số ở đây chỉ là mức sàn khi không truyền.
  "audio.generate": 1,
  // Nhân bản giọng (ElevenLabs Instant Voice Clone) — giá tạm, nợ #64.
  "audio.voice_clone": 5,
  "chat.channel.messenger_monthly": 50,
  "chat.channel.zalo_monthly": 70,
  "chat.channel.embed_monthly": 30,
  "chat.message.ai_reply": 1,
}

const DEFAULT_COST_CREDIT = 1

export function costCreditForFeature(feature: string): number {
  return FEATURE_COST_CREDIT[feature] ?? DEFAULT_COST_CREDIT
}
