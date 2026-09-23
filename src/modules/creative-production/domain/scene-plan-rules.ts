/**
 * Kịch bản bối cảnh hình ảnh theo chủ đề (Narrative Arc Chặng 04–05 → Khu vực D).
 *
 * Trước 24/09/2026 Khu vực D dùng một khuôn 4 cảnh viết cứng trong giao diện
 * (studio trắng → một bối cảnh chọn theo `angleCategory` → bàn gỗ → PNG), nên
 * chủ đề "bó hoa sinh nhật tone vàng" vẫn ra "Sảnh khách sạn & tiệc mừng".
 * Quyết định của PO (24/09): số cảnh theo kịch bản của chủ đề (CREATIVE 5,
 * AUTHENTIC 3) và kịch bản do AI viết qua job (`creative.scene_plan`).
 *
 * Tệp này là phần THUẦN: hợp đồng dữ liệu, lời nhắc, chuẩn hoá đầu ra của mô
 * hình và kịch bản cơ bản (không gọi AI) để người dùng tự chọn khi AI lỗi.
 * Không import Prisma, không gọi mạng.
 */

import {
  MAX_SCENE_PROMPT_LENGTH,
  type VariantPresetId,
} from "@/modules/media/domain/variant-rules"

// ============================================================
// HỢP ĐỒNG
// ============================================================

export const SCENE_PLAN_FEATURE = "creative.scene_plan" as const
export const SCENE_PLAN_VERSION = 1 as const

export type ScenePlanMode = "CREATIVE" | "AUTHENTIC"
export type ScenePlanBeat = "SETUP" | "RISING" | "CLIMAX" | "RESOLUTION" | "CTA"
export type ScenePlanMotion = "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "pan_up" | "static"

/** Nhịp theo mode — cùng thứ tự với `planNarrativeArc` (Khu vực B). */
export const SCENE_BEATS_BY_MODE: Readonly<Record<ScenePlanMode, readonly ScenePlanBeat[]>> = {
  CREATIVE: ["SETUP", "RISING", "CLIMAX", "RESOLUTION", "CTA"],
  AUTHENTIC: ["SETUP", "CLIMAX", "CTA"],
}

/** Số cảnh tối đa của mọi mode — giới hạn `scene_index` ở API biến thể. */
export const MAX_SCENE_PLAN_SCENES = 5

/**
 * Phông Studio cục bộ mà worker dựng được, kèm mô tả để mô hình chọn phông
 * gần nhất cho từng cảnh. `transparent` không nằm đây: mỗi job biến thể đã
 * luôn ghi kèm một bản PNG tách nền.
 */
export const LOCAL_BACKDROPS: Readonly<Record<Exclude<VariantPresetId, "transparent">, string>> = {
  studio_white: "phông trắng sạch, đổ bóng mềm (catalog)",
  wedding: "nền bokeh ấm, lãng mạn (tiệc, hẹn hò, cưới)",
  living_room: "không gian nhà ấm cúng, ánh sáng cửa sổ",
  wood_minimal: "mặt gỗ ấm tối giản, ánh ban mai",
  luxury_hotel: "tông xám ấm sang trọng (sảnh, sự kiện, văn phòng)",
}
export type LocalBackdrop = keyof typeof LOCAL_BACKDROPS
const LOCAL_BACKDROP_IDS = Object.keys(LOCAL_BACKDROPS) as LocalBackdrop[]

const MOTIONS: readonly ScenePlanMotion[] = ["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "static"]

export interface ScenePlanTopic {
  readonly id: string
  readonly title: string
  readonly angleCategory?: string | undefined
  readonly hook?: string | undefined
  readonly cta?: string | undefined
  readonly format?: string | undefined
}

export interface ScenePlanInput {
  readonly mode: ScenePlanMode
  readonly productName: string
  readonly category?: string | undefined
  readonly style?: string | undefined
  readonly colors: readonly string[]
  readonly components: readonly string[]
  readonly occasions: readonly string[]
  readonly targetAudience?: string | undefined
  readonly priceRange?: string | undefined
  readonly topic: ScenePlanTopic
}

export interface ScenePlanScene {
  readonly sceneIndex: number
  readonly beat: ScenePlanBeat
  /** Tên cảnh ngắn, tiếng Việt. */
  readonly title: string
  /** Không gian/bối cảnh của cảnh, tiếng Việt — hiển thị cho chủ tiệm. */
  readonly setting: string
  readonly lighting: string
  readonly palette: readonly string[]
  /** Mục đích dùng ảnh (kênh/định dạng). */
  readonly purpose: string
  /** Mô tả KHÔNG GIAN hậu cảnh, tiếng Anh, gửi Stability — không hoa, không người, không chữ. */
  readonly backgroundPrompt: string
  /** Phông cục bộ gần nhất — dùng khi chạy Studio cục bộ hoặc khi Stability lỗi. */
  readonly localBackdrop: LocalBackdrop
  readonly voiceScript: string
  readonly textOverlay: string
  readonly motionEffect: ScenePlanMotion
}

export interface ScenePlan {
  readonly version: typeof SCENE_PLAN_VERSION
  /** `ai` = mô hình viết qua job; `rule` = kịch bản cơ bản người dùng tự chọn khi AI lỗi. */
  readonly source: "ai" | "rule"
  readonly mode: ScenePlanMode
  readonly topicId: string
  readonly topicTitle: string
  readonly emotionalTone: string
  readonly reasoning: string
  readonly scenes: readonly ScenePlanScene[]
}

// ============================================================
// TIỆN ÍCH
// ============================================================

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, max)
}

function textList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => text(v, maxLen)).filter((v) => v.length > 0).slice(0, maxItems)
}

/**
 * Lời nhắc hậu cảnh chỉ được tả không gian. Bỏ ký tự điều khiển và cắt độ dài;
 * worker còn tự nối "no flowers, no people, no text" — đây là lớp chặn thứ nhất.
 */
export function sanitizeBackgroundPrompt(value: unknown): string {
  return text(value, MAX_SCENE_PROMPT_LENGTH * 2)
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\b(bouquets?|flowers?|florals?|roses?|people|person|woman|man|hands?|text|logo|letters?)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .replace(/^[,.\s]+/, "")
    .trim()
    .slice(0, MAX_SCENE_PROMPT_LENGTH)
}

export function isLocalBackdrop(value: unknown): value is LocalBackdrop {
  return typeof value === "string" && (LOCAL_BACKDROP_IDS as string[]).includes(value)
}

/** Số cảnh đúng của mode. */
export function sceneCountFor(mode: ScenePlanMode): number {
  return SCENE_BEATS_BY_MODE[mode].length
}

/**
 * Khoá idempotency cho kịch bản của MỘT chủ đề trên MỘT ảnh — mở lại Khu vực D
 * hay Khu vực C tra lại đúng kịch bản cũ, không trừ credit lần hai.
 */
export function scenePlanKey(input: { assetId: string; topicId: string; mode: ScenePlanMode }): string {
  return `scene-plan:${input.assetId}:${input.topicId}:${input.mode}`
}

// ============================================================
// LỜI NHẮC
// ============================================================

function dong(nhan: string, giaTri: string | readonly string[] | undefined | null): string {
  const v = Array.isArray(giaTri) ? giaTri.join(", ") : (giaTri as string | undefined | null)
  return `- ${nhan}: ${v && v.length > 0 ? v : "chưa xác định"}`
}

export function buildScenePlanPrompt(input: ScenePlanInput): string {
  const beats = SCENE_BEATS_BY_MODE[input.mode]
  const phong = LOCAL_BACKDROP_IDS.map((id) => `  - ${id}: ${LOCAL_BACKDROPS[id]}`).join("\n")
  const modeRule =
    input.mode === "AUTHENTIC"
      ? "AUTHENTIC: giữ tinh thần ảnh thật, bối cảnh giản dị, gần với tiệm hoa thật; không dựng không gian xa hoa."
      : "CREATIVE: mỗi cảnh một không gian khác nhau nhưng cùng một câu chuyện, bám sát dịp và tông màu của chủ đề."

  return `Bạn là đạo diễn hình ảnh cho cửa hàng hoa. Viết KỊCH BẢN BỐI CẢNH cho bộ ảnh/video quảng bá MỘT sản phẩm theo đúng chủ đề đã chọn.

CHỦ ĐỀ (Chặng 04–05)
${dong("Tiêu đề", input.topic.title)}
${dong("Góc tiếp cận", input.topic.angleCategory)}
${dong("Hook", input.topic.hook)}
${dong("CTA", input.topic.cta)}
${dong("Định dạng", input.topic.format)}

SẢN PHẨM
${dong("Tên", input.productName)}
${dong("Hình dáng", input.category)}
${dong("Phong cách", input.style)}
${dong("Màu hoa", input.colors)}
${dong("Thành phần", input.components)}
${dong("Dịp phù hợp", input.occasions)}
${dong("Người mua", input.targetAudience)}
${dong("Khoảng giá", input.priceRange)}

YÊU CẦU
- Đúng ${beats.length} cảnh, theo thứ tự nhịp: ${beats.join(" → ")}.
- ${modeRule}
- Bối cảnh phải khớp DỊP và TÔNG MÀU nêu trong tiêu đề chủ đề (ví dụ chủ đề sinh nhật tone vàng thì không gian sinh nhật, bảng màu hài hoà với vàng). Không dùng bối cảnh không liên quan đến dịp.
- Bó hoa thật sẽ được dán nguyên khối vào ảnh: KHÔNG mô tả hoa, người, bàn tay, chữ hay logo trong bối cảnh; chỉ mô tả không gian, bề mặt đặt bó hoa, ánh sáng, màu.
- setting, title, lighting, purpose, voiceScript, textOverlay: tiếng Việt có dấu. voiceScript 1–2 câu tự nhiên; textOverlay tối đa 60 ký tự.
- background_prompt: tiếng Anh, 1–3 câu, chỉ tả không gian trống (surface, room, light, colour palette, depth of field), dạng ảnh chụp sản phẩm chân thực.
- local_backdrop: chọn MỘT phông cục bộ gần nhất với cảnh:
${phong}
- motion_effect: một trong ${MOTIONS.join(" | ")}.
- Không bịa giá, khuyến mãi hay cam kết dịch vụ.

Trả về JSON: { "emotional_tone": string, "reasoning": string, "scenes": [ { "beat", "title", "setting", "lighting", "palette": string[], "purpose", "background_prompt", "local_backdrop", "voice_script", "text_overlay", "motion_effect" } ] }. Không thêm lời dẫn.`
}

/** JSON schema gửi kèm lời gọi mô hình. */
export function scenePlanJsonSchema(mode: ScenePlanMode): Record<string, unknown> {
  const n = sceneCountFor(mode)
  return {
    type: "object",
    properties: {
      emotional_tone: { type: "string" },
      reasoning: { type: "string" },
      scenes: {
        type: "array",
        minItems: n,
        maxItems: n,
        items: {
          type: "object",
          properties: {
            beat: { type: "string", enum: [...SCENE_BEATS_BY_MODE[mode]] },
            title: { type: "string" },
            setting: { type: "string" },
            lighting: { type: "string" },
            palette: { type: "array", items: { type: "string" } },
            purpose: { type: "string" },
            background_prompt: { type: "string" },
            local_backdrop: { type: "string", enum: LOCAL_BACKDROP_IDS },
            voice_script: { type: "string" },
            text_overlay: { type: "string" },
            motion_effect: { type: "string", enum: [...MOTIONS] },
          },
          required: ["beat", "title", "setting", "background_prompt", "local_backdrop"],
        },
      },
    },
    required: ["scenes"],
  }
}

// ============================================================
// CHUẨN HOÁ ĐẦU RA MÔ HÌNH
// ============================================================

export type NormalizeResult = { ok: true; plan: ScenePlan } | { ok: false; reason: string }

/**
 * Nhận JSON của mô hình, trả kịch bản đã chuẩn hoá hoặc lý do loại. Không tự
 * "vá" một cảnh thiếu bối cảnh bằng chữ mặc định — thiếu thì loại cả lượt để
 * cổng AI ghi thất bại và hoàn credit.
 */
export function normalizeAiScenePlan(raw: unknown, input: ScenePlanInput): NormalizeResult {
  const o = raw as { emotional_tone?: unknown; reasoning?: unknown; scenes?: unknown } | null
  if (!o || typeof o !== "object") return { ok: false, reason: "Đầu ra không phải object" }
  if (!Array.isArray(o.scenes)) return { ok: false, reason: "Thiếu danh sách scenes" }

  const beats = SCENE_BEATS_BY_MODE[input.mode]
  if (o.scenes.length !== beats.length) {
    return { ok: false, reason: `Cần đúng ${beats.length} cảnh, mô hình trả ${o.scenes.length}` }
  }

  const scenes: ScenePlanScene[] = []
  for (let i = 0; i < beats.length; i++) {
    const s = o.scenes[i] as Record<string, unknown> | null
    if (!s || typeof s !== "object") return { ok: false, reason: `Cảnh ${i + 1} không hợp lệ` }
    const setting = text(s.setting, 300)
    const backgroundPrompt = sanitizeBackgroundPrompt(s.background_prompt)
    const title = text(s.title, 80)
    if (!setting || !title) return { ok: false, reason: `Cảnh ${i + 1} thiếu tên hoặc bối cảnh` }
    if (backgroundPrompt.length < 15) {
      return { ok: false, reason: `Cảnh ${i + 1} thiếu mô tả hậu cảnh dùng được` }
    }
    scenes.push({
      sceneIndex: i + 1,
      // Thứ tự nhịp do mode quyết định, không do mô hình.
      beat: beats[i]!,
      title,
      setting,
      lighting: text(s.lighting, 120),
      palette: textList(s.palette, 5, 30),
      purpose: text(s.purpose, 120),
      backgroundPrompt,
      localBackdrop: isLocalBackdrop(s.local_backdrop) ? s.local_backdrop : inferLocalBackdrop(setting),
      voiceScript: text(s.voice_script, 300),
      textOverlay: text(s.text_overlay, 60),
      motionEffect: MOTIONS.includes(s.motion_effect as ScenePlanMotion)
        ? (s.motion_effect as ScenePlanMotion)
        : "static",
    })
  }

  return {
    ok: true,
    plan: {
      version: SCENE_PLAN_VERSION,
      source: "ai",
      mode: input.mode,
      topicId: input.topic.id,
      topicTitle: input.topic.title,
      emotionalTone: text(o.emotional_tone, 120),
      reasoning: text(o.reasoning, 600),
      scenes,
    },
  }
}

/** Đọc lại kịch bản đã lưu trong `generation_jobs.output` — trả null nếu hình dạng lạ. */
export function parseStoredScenePlan(value: unknown): ScenePlan | null {
  const p = value as Partial<ScenePlan> | null
  if (!p || typeof p !== "object" || p.version !== SCENE_PLAN_VERSION) return null
  if (!Array.isArray(p.scenes) || p.scenes.length === 0 || p.scenes.length > MAX_SCENE_PLAN_SCENES) {
    return null
  }
  if (p.mode !== "CREATIVE" && p.mode !== "AUTHENTIC") return null
  return p as ScenePlan
}

// ============================================================
// KỊCH BẢN CƠ BẢN (không AI — người dùng tự chọn khi AI lỗi)
// ============================================================

interface OccasionProfile {
  readonly keys: readonly string[]
  readonly name: string
  readonly spaces: readonly { setting: string; prompt: string; backdrop: LocalBackdrop }[]
}

const OCCASIONS: readonly OccasionProfile[] = [
  {
    keys: ["sinh nhật", "sinh nhat", "birthday"],
    name: "Sinh nhật",
    spaces: [
      { setting: "Bàn tiệc sinh nhật tại gia, bánh kem và nến mờ phía sau", prompt: "a cosy home birthday table, softly blurred cake and candles in the background", backdrop: "wedding" },
      { setting: "Góc phòng khách trang trí bóng bay nhẹ nhàng", prompt: "a bright living room corner with a few soft balloons out of focus", backdrop: "living_room" },
    ],
  },
  {
    keys: ["cưới", "cuoi", "wedding", "hẹn hò", "valentine", "tình yêu", "kỷ niệm"],
    name: "Lãng mạn",
    spaces: [
      { setting: "Bàn tiệc lãng mạn, nến ấm và khăn trải bàn lụa", prompt: "a romantic dinner table with warm candlelight and a silk tablecloth", backdrop: "wedding" },
      { setting: "Cửa sổ hoàng hôn trong căn hộ ấm cúng", prompt: "a cosy apartment window at golden hour", backdrop: "living_room" },
    ],
  },
  {
    keys: ["khai trương", "khai truong", "chúc mừng", "sự kiện", "hội nghị", "văn phòng"],
    name: "Khai trương & sự kiện",
    spaces: [
      { setting: "Sảnh sự kiện sang trọng, ánh đèn vàng ấm", prompt: "an elegant event lobby with warm ambient lighting", backdrop: "luxury_hotel" },
      { setting: "Quầy lễ tân văn phòng hiện đại", prompt: "a modern office reception counter with clean lines", backdrop: "luxury_hotel" },
    ],
  },
  {
    keys: ["tốt nghiệp", "tot nghiep", "graduation", "20/11", "thầy cô"],
    name: "Tốt nghiệp",
    spaces: [
      { setting: "Sân trường nắng nhẹ, hậu cảnh mờ", prompt: "a sunny campus courtyard, softly blurred", backdrop: "living_room" },
    ],
  },
  {
    keys: ["chia buồn", "tang", "viếng"],
    name: "Chia buồn",
    spaces: [
      { setting: "Không gian trang nghiêm, tông trầm và ánh sáng dịu", prompt: "a calm solemn room with muted tones and soft diffused light", backdrop: "studio_white" },
    ],
  },
]

const DEFAULT_OCCASION: OccasionProfile = {
  keys: [],
  name: "Tặng hoa",
  spaces: [
    { setting: "Góc phòng khách ấm cúng, ánh sáng cửa sổ", prompt: "a cosy living room corner with natural window light", backdrop: "living_room" },
  ],
}

function detectOccasion(input: ScenePlanInput): OccasionProfile {
  const haystack = [input.topic.title, input.topic.hook, ...input.occasions]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return OCCASIONS.find((o) => o.keys.some((k) => haystack.includes(k))) ?? DEFAULT_OCCASION
}

const COLOR_WORDS: Readonly<Record<string, string>> = {
  vàng: "warm yellow and cream",
  đỏ: "deep red and ivory",
  hồng: "blush pink and white",
  trắng: "white and soft beige",
  tím: "lavender and soft grey",
  xanh: "sage green and white",
  cam: "peach and warm beige",
  pastel: "soft pastel",
}

function detectPalette(input: ScenePlanInput): { vi: string[]; en: string } {
  const haystack = [input.topic.title, ...input.colors].join(" ").toLowerCase()
  const found = Object.keys(COLOR_WORDS).filter((c) => haystack.includes(c))
  const vi = found.length > 0 ? found.slice(0, 3) : input.colors.slice(0, 3)
  const en = found.length > 0 ? found.map((c) => COLOR_WORDS[c]).join(", ") : "neutral warm tones"
  return { vi, en }
}

/** Đoán phông cục bộ theo chữ trong bối cảnh — dùng khi mô hình trả phông lạ. */
export function inferLocalBackdrop(setting: string): LocalBackdrop {
  const s = setting.toLowerCase()
  if (/trắng|studio|catalog/.test(s)) return "studio_white"
  if (/gỗ|bàn làm việc|ban mai|tối giản/.test(s)) return "wood_minimal"
  if (/sảnh|khách sạn|sự kiện|văn phòng|sang trọng/.test(s)) return "luxury_hotel"
  if (/tiệc|nến|lãng mạn|cưới|hẹn hò|bokeh/.test(s)) return "wedding"
  return "living_room"
}

/**
 * Kịch bản cơ bản theo dịp + tông màu phát hiện trong chủ đề. Không gọi mô
 * hình, không trừ credit — ghi `source: "rule"` để giao diện nói rõ.
 */
export function buildRuleScenePlan(input: ScenePlanInput): ScenePlan {
  const occasion = detectOccasion(input)
  const palette = detectPalette(input)
  const name = input.productName || "bó hoa"
  const main = occasion.spaces[0]!
  const alt = occasion.spaces[1] ?? main
  const cta = input.topic.cta || "Nhắn tin cho tiệm để đặt hoa"

  const byBeat: Record<ScenePlanBeat, Omit<ScenePlanScene, "sceneIndex" | "beat">> = {
    SETUP: {
      title: "Giới thiệu sản phẩm",
      setting: "Phông studio sáng, đổ bóng mềm, tông màu hoà với bó hoa",
      lighting: "Ánh sáng tản đều",
      palette: palette.vi,
      purpose: "Ảnh catalog, bài giới thiệu",
      backgroundPrompt: sanitizeBackgroundPrompt(`a clean seamless studio backdrop in ${palette.en}, soft shadow, product photography`),
      localBackdrop: "studio_white",
      voiceScript: input.topic.hook || `Giới thiệu ${name}.`,
      textOverlay: text(input.topic.title, 60),
      motionEffect: "zoom_in",
    },
    RISING: {
      title: `${occasion.name} — không gian`,
      setting: main.setting,
      lighting: "Ánh sáng ấm tự nhiên",
      palette: palette.vi,
      purpose: "Bài Facebook/Instagram lifestyle",
      backgroundPrompt: sanitizeBackgroundPrompt(`${main.prompt}, ${palette.en} palette, shallow depth of field`),
      localBackdrop: main.backdrop,
      voiceScript: `${name} cho dịp ${occasion.name.toLowerCase()}.`,
      textOverlay: text(occasion.name, 60),
      motionEffect: "pan_right",
    },
    CLIMAX: {
      title: "Cận cảnh điểm nhấn",
      setting: "Mặt bàn gỗ sáng, cận cảnh để thấy rõ phụ liệu và thiệp",
      lighting: "Ánh ban mai nghiêng",
      palette: palette.vi,
      purpose: "Ảnh chi tiết, chốt đơn Zalo",
      backgroundPrompt: sanitizeBackgroundPrompt(`a light wooden tabletop close-up with morning side light, ${palette.en} accents`),
      localBackdrop: "wood_minimal",
      voiceScript: `Từng chi tiết của ${name} đều được chăm chút.`,
      textOverlay: "",
      motionEffect: "zoom_out",
    },
    RESOLUTION: {
      title: "Khoảnh khắc trao tặng",
      setting: alt.setting,
      lighting: "Ánh sáng dịu",
      palette: palette.vi,
      purpose: "Story, Reels",
      backgroundPrompt: sanitizeBackgroundPrompt(`${alt.prompt}, ${palette.en} palette`),
      localBackdrop: alt.backdrop,
      voiceScript: "Một món quà trọn vẹn cảm xúc.",
      textOverlay: "",
      motionEffect: "pan_left",
    },
    CTA: {
      title: "Kêu gọi đặt hoa",
      setting: "Phông tối giản cùng tông màu, chừa khoảng trống cho chữ CTA",
      lighting: "Ánh sáng sạch",
      palette: palette.vi,
      purpose: "Banner, ảnh kết video",
      backgroundPrompt: sanitizeBackgroundPrompt(`a minimal backdrop in ${palette.en} with generous empty space, soft light`),
      localBackdrop: "studio_white",
      voiceScript: cta,
      textOverlay: text(cta, 60),
      motionEffect: "static",
    },
  }

  const beats = SCENE_BEATS_BY_MODE[input.mode]
  return {
    version: SCENE_PLAN_VERSION,
    source: "rule",
    mode: input.mode,
    topicId: input.topic.id,
    topicTitle: input.topic.title,
    emotionalTone: occasion.name,
    reasoning: `Kịch bản cơ bản (không dùng AI): dịp "${occasion.name}", tông màu ${palette.vi.join(", ") || "theo bó hoa"}.`,
    scenes: beats.map((beat, i) => ({ sceneIndex: i + 1, beat, ...byBeat[beat] })),
  }
}
