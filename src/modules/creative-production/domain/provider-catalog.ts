/**
 * Danh mục nhà cung cấp của Creative Studio — nguồn chuẩn DUY NHẤT (PO 25/09/2026).
 *
 * Quyết định PO: mọi bước TẠO kết quả (nội dung, giọng đọc, nhạc nền, ảnh,
 * video) ưu tiên nhà cung cấp trả phí để đạt chất lượng cao nhất; xử lý cục
 * bộ CHỈ là phương án lùi khi mọi nhà cung cấp đều lỗi (worker ghi rõ lý do,
 * core hoàn phần chênh credit — bảng giá v1). Nhiều nhà cung cấp VAI TRÒ
 * TƯƠNG ĐƯƠNG cho mỗi loại; tiệm đặt thứ tự ưu tiên trong Cài đặt, mỗi lượt
 * tạo vẫn đổi được bên (cả hai cấp).
 *
 * Khoá ở đây phải khớp từng chữ với khoá phía thực thi:
 *   - `content`         → `ai_models.key` (cổng AI, `src/core/ai/`)
 *   - `image_optimize`  → `workers/media_ai/providers/enhancement/router.py`
 *   - `image_variant`   → `workers/media_ai/providers/scene/registry.py`
 *   - `video`           → `workers/media_ai/video/providers/__init__.py`
 *   - `voice`           → `workers/media_ai/audio/tts_engine.py`
 *   - `music`           → `workers/media_ai/audio/music_engine.py`
 * `provider-catalog.test.ts` khoá phần TS; ca thử Python khoá phía worker.
 *
 * Thuần: không import hạ tầng.
 */

export const PROVIDER_KINDS = ["content", "image_optimize", "image_variant", "video", "voice", "music"] as const
export type ProviderKind = (typeof PROVIDER_KINDS)[number]

export interface ProviderOption {
  readonly key: string
  readonly label: string
  /** Hãng — hiển thị cho người chọn. */
  readonly vendor: string
  /** Biến môi trường chứa khoá — thiếu thì bên này được bỏ qua trong chuỗi. */
  readonly envKey: string
  readonly quality: "cao" | "trung_binh"
  readonly note: string
}

export interface ProviderKindSpec {
  readonly label: string
  /** Nhà cung cấp, theo thứ tự mặc định (chất lượng cao trước). */
  readonly providers: readonly ProviderOption[]
  /** Đường lùi cục bộ khi MỌI nhà cung cấp lỗi — không chọn được làm bên chính. */
  readonly localFallback: { readonly key: string; readonly label: string } | null
}

export const PROVIDER_CATALOG: Readonly<Record<ProviderKind, ProviderKindSpec>> = {
  content: {
    label: "Nội dung (kịch bản, bài đăng, viết lại)",
    providers: [
      { key: "claude_opus", label: "Claude Opus 5", vendor: "Anthropic", envKey: "ANTHROPIC_API_KEY", quality: "cao", note: "Văn phong tiếng Việt tự nhiên, bám dữ kiện tốt" },
      { key: "openai_structured", label: "GPT-4o", vendor: "OpenAI", envKey: "OPENAI_API_KEY", quality: "cao", note: "Mặc định cũ, đã đo trên bộ ảnh vàng" },
      { key: "gemini_pro", label: "Gemini 2.5 Pro", vendor: "Google", envKey: "GEMINI_API_KEY", quality: "cao", note: "Ngữ cảnh dài, đa phương thức" },
      { key: "claude_sonnet", label: "Claude Sonnet 5", vendor: "Anthropic", envKey: "ANTHROPIC_API_KEY", quality: "trung_binh", note: "Nhanh, rẻ hơn Opus" },
      { key: "gemini_flash", label: "Gemini 2.5 Flash", vendor: "Google", envKey: "GEMINI_API_KEY", quality: "trung_binh", note: "Nhanh, chi phí thấp" },
      { key: "openai_direct", label: "GPT-4o mini", vendor: "OpenAI", envKey: "OPENAI_API_KEY", quality: "trung_binh", note: "Nhanh, chi phí thấp" },
    ],
    localFallback: { key: "template", label: "Khuôn bài tất định (không AI)" },
  },
  image_optimize: {
    label: "Tối ưu ảnh Master (Khu vực A)",
    providers: [
      { key: "photoroom", label: "Photoroom", vendor: "Photoroom", envKey: "PHOTOROOM_API_KEY", quality: "cao", note: "Tách nền, phông studio, bóng + ánh sáng AI" },
      { key: "fal_flux", label: "fal.ai Product Shot", vendor: "fal.ai", envKey: "FAL_KEY", quality: "cao", note: "BiRefNet + BRIA Product Shot + ESRGAN" },
      { key: "imagen", label: "Google Gemini Image", vendor: "Google", envKey: "GEMINI_API_KEY", quality: "cao", note: "Dựng phông + chỉnh sáng, bó hoa ghép lại từ ảnh gốc" },
      { key: "openai", label: "OpenAI Image", vendor: "OpenAI", envKey: "OPENAI_API_KEY", quality: "cao", note: "gpt-image-1, mặt nạ bảo vệ bó hoa" },
    ],
    localFallback: { key: "studio", label: "Studio cục bộ (rembg + phông)" },
  },
  image_variant: {
    label: "Biến thể ảnh marketing (Khu vực D)",
    providers: [
      { key: "fal", label: "fal.ai Product Shot", vendor: "fal.ai", envKey: "FAL_KEY", quality: "cao", note: "Dựng cảnh + hoà sáng, giữ vị trí bó hoa" },
      { key: "stability", label: "Stability AI Relight", vendor: "Stability AI", envKey: "STABILITY_API_KEY", quality: "cao", note: "Thay nền + chỉnh hướng sáng, seed tái tạo được" },
      { key: "imagen", label: "Google Gemini Image", vendor: "Google", envKey: "GEMINI_API_KEY", quality: "cao", note: "Dựng cảnh theo mô tả, bó hoa ghép lại từ Master" },
    ],
    localFallback: { key: "local_studio", label: "Phông cục bộ" },
  },
  video: {
    label: "Video (Khu vực E)",
    providers: [
      { key: "veo", label: "Google Veo", vendor: "Google", envKey: "GEMINI_API_KEY", quality: "cao", note: "Ảnh → video điện ảnh" },
      { key: "kling", label: "Kling", vendor: "Kuaishou (qua fal.ai)", envKey: "FAL_KEY", quality: "cao", note: "Ảnh → video, chuyển động tự nhiên" },
      { key: "runway", label: "Runway Gen-4", vendor: "Runway", envKey: "RUNWAYML_API_SECRET", quality: "cao", note: "Ảnh → video, kiểm soát camera" },
      { key: "luma", label: "Luma Ray 2", vendor: "Luma AI (qua fal.ai)", envKey: "FAL_KEY", quality: "cao", note: "Ảnh → video, ánh sáng mềm" },
    ],
    localFallback: { key: "local_cinematic", label: "Ken Burns cục bộ (FFmpeg)" },
  },
  voice: {
    label: "Giọng đọc (Khu vực C)",
    providers: [
      { key: "elevenlabs", label: "ElevenLabs", vendor: "ElevenLabs", envKey: "ELEVENLABS_API_KEY", quality: "cao", note: "Giọng tự nhiên nhất, nhân bản giọng" },
      { key: "openai", label: "OpenAI TTS", vendor: "OpenAI", envKey: "OPENAI_API_KEY", quality: "cao", note: "tts-1 / tts-1-hd" },
      { key: "minimax", label: "MiniMax", vendor: "MiniMax", envKey: "MINIMAX_API_KEY", quality: "trung_binh", note: "Giọng tiếng Việt ấm" },
      { key: "edge_tts", label: "Microsoft Edge TTS", vendor: "Microsoft", envKey: "", quality: "trung_binh", note: "Miễn phí, không cần khoá" },
    ],
    localFallback: null,
  },
  music: {
    label: "Nhạc nền (Khu vực C)",
    providers: [
      { key: "elevenlabs_music", label: "ElevenLabs Music", vendor: "ElevenLabs", envKey: "ELEVENLABS_API_KEY", quality: "cao", note: "Sinh nhạc nền theo tâm trạng, có giấy phép thương mại" },
    ],
    localFallback: { key: "library", label: "Thư viện nhạc có sẵn" },
  },
}

export function providerOption(kind: ProviderKind, key: string): ProviderOption | undefined {
  return PROVIDER_CATALOG[kind].providers.find((p) => p.key === key)
}

export function isProviderKind(value: unknown): value is ProviderKind {
  return typeof value === "string" && (PROVIDER_KINDS as readonly string[]).includes(value)
}

/** Thứ tự mặc định của nền tảng (chất lượng cao trước). */
export function defaultProviderOrder(kind: ProviderKind): string[] {
  return PROVIDER_CATALOG[kind].providers.map((p) => p.key)
}

/**
 * Thứ tự thử cho MỘT lượt tạo: bên người dùng chọn cho lượt này → thứ tự tiệm
 * đã đặt → phần còn lại theo mặc định. Khoá lạ bị bỏ; không trùng; KHÔNG chứa
 * đường cục bộ (worker tự lùi về đó khi hết danh sách, và ghi lý do).
 */
export function resolveProviderOrder(
  kind: ProviderKind,
  orgOrder?: readonly string[] | null,
  requested?: string | null
): string[] {
  const known = new Set(defaultProviderOrder(kind))
  const out: string[] = []
  for (const key of [requested, ...(orgOrder ?? []), ...defaultProviderOrder(kind)]) {
    if (key && known.has(key) && !out.includes(key)) out.push(key)
  }
  return out
}

/** Chuẩn hoá thứ tự tiệm gửi lên — phải là hoán vị (có thể thiếu) của các khoá đã biết. */
export function validateOrgOrder(kind: ProviderKind, order: unknown): { ok: true; order: string[] } | { ok: false; error: string } {
  if (!Array.isArray(order) || order.some((k) => typeof k !== "string")) return { ok: false, error: "order phải là mảng khoá" }
  const known = new Set(defaultProviderOrder(kind))
  const la = (order as string[]).filter((k) => !known.has(k))
  if (la.length > 0) return { ok: false, error: `Khoá không có trong danh mục ${kind}: ${la.join(", ")}` }
  if (new Set(order).size !== order.length) return { ok: false, error: "order có khoá trùng" }
  if (order.length === 0) return { ok: false, error: "order không được rỗng" }
  return { ok: true, order: [...(order as string[])] }
}

/** Đọc thứ tự của tiệm từ `organizations.settings.creative_providers`. */
export function orgProviderOrders(settings: unknown): Partial<Record<ProviderKind, string[]>> {
  const raw = settings && typeof settings === "object" ? (settings as Record<string, unknown>).creative_providers : null
  if (!raw || typeof raw !== "object") return {}
  const out: Partial<Record<ProviderKind, string[]>> = {}
  for (const kind of PROVIDER_KINDS) {
    const v = (raw as Record<string, unknown>)[kind]
    if (Array.isArray(v)) out[kind] = v.filter((k): k is string => typeof k === "string")
  }
  return out
}
