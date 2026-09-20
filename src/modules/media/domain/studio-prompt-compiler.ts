/**
 * Studio Prompt Compiler — Bộ biên dịch Prompt 3 lớp chống sai lệch hoa thật.
 *
 * Chuyển hóa dữ liệu bóc tách từ M01 (PhanTichSanPhamHoa), bối cảnh và cấu hình Visual Storytelling
 * (góc chụp, người mẫu, chuỗi ảnh câu chuyện) thành các câu lệnh Prompt chuẩn quốc tế.
 *
 * Tệp thuần Domain: Không I/O, không import thư viện ngoài.
 */

import type {
  ProductPassportInput,
  SceneConfigInput,
  ExecutionParamsInput,
  VisualStoryConfigInput,
  CameraAngleType,
  HumanInteractionType,
} from "./creative-studio-schemas"

export interface CompiledStudioPrompts {
  readonly systemPrompt: string
  readonly positivePrompt: string
  readonly negativePrompt: string
  readonly tags: readonly string[]
}

export interface StoryCarouselChapterPrompt {
  readonly chapterNumber: 1 | 2 | 3 | 4
  readonly chapterTitle: string
  readonly prompt: CompiledStudioPrompts
  readonly suggestedCaption: string
}

// Bảng ánh xạ kiểu dáng hoa tiếng Việt -> tiếng Anh chuẩn Catalog
const FORM_MAP: Record<string, string> = {
  bo_tron: "round hand-tied bouquet",
  bo_dai: "long-stem cascading floral bouquet",
  gio_hoa: "luxury woven flower basket arrangement",
  lang_hoa: "grand celebratory floral stand",
  hop_hoa: "premium boxed flower gift arrangement",
  binh_hoa: "elegant centerpiece vase floral arrangement",
}

// Bảng ánh xạ preset không gian -> mô tả studio thực tế
const PRESET_ENVIRONMENT_MAP: Record<string, { env: string; surface: string; light: string }> = {
  studio_white: {
    env: "seamless infinity white commercial photography studio",
    surface: "clean matte white reflective studio floor",
    light: "soft diffused dual-box commercial studio lighting",
  },
  luxury_warm: {
    env: "high-end luxury boutique hotel presidential lounge with soft ambient glow",
    surface: "polished golden Calacatta marble tabletop",
    light: "warm 3200K cinematic evening lighting with subtle chandelier bokeh",
  },
  cafe_lifestyle: {
    env: "trendy sunlit Parisian cafe aesthetic with large glass French windows",
    surface: "rustic light oak wood coffee table",
    light: "natural morning sunlight casting gentle diagonal window shadows",
  },
  minimal_nordic: {
    env: "serene Scandinavian minimalist living interior with clean lines",
    surface: "natural light ash wood bench against off-white limewash textured wall",
    light: "soft, diffused Nordic daylight with calm neutral shadows",
  },
  outdoor_garden: {
    env: "lush sun-dappled botanical garden veranda with manicured greenery",
    surface: "weathered natural stone terrace table",
    light: "golden hour late-afternoon natural sunlight through leaves",
  },
  wedding_event: {
    env: "opulent romantic wedding banquet hall with elegant drapery",
    surface: "fine silk organza table runner over white banquet linen",
    light: "romantic candlelit ambiance with soft warm fairy lights bokeh",
  },
}

// Bảng ánh xạ góc máy chụp ảnh thương mại
const CAMERA_ANGLE_MAP: Record<CameraAngleType, string> = {
  front_view:
    "Shot on Hasselblad H6D-100c with 85mm prime lens at f/4.0, direct eye-level perspective with tack-sharp focus",
  three_quarter_45:
    "Shot at a dynamic 45-degree three-quarter angle at f/4.0, emphasizing sculptural depth, floral contours, and wrapping layers",
  flat_lay_topdown:
    "Artisan overhead 90-degree flat-lay commercial photography, laid flat with curated editorial props, crisp edge-to-edge focus",
  macro_closeup:
    "Extreme macro close-up detail shot at f/2.8, magnifying crisp petal textures, dew droplets, and delicate ribbon weave with creamy bokeh",
}

// Bảng ánh xạ tương tác người mẫu (Human-in-the-loop)
const HUMAN_INTERACTION_MAP: Record<HumanInteractionType, string> = {
  none: "",
  female_holding:
    "Gently and elegantly held against the chest by a graceful young woman in a tailored neutral linen blazer, natural lifestyle pose",
  male_holding:
    "Held with confident poise by a sharply dressed gentleman in a crisp white shirt, ready for a special gifting surprise",
  florist_artisan_hands:
    "Delicate artisan florist hands in the frame gently tying the final silk ribbon bow, celebrating fine craftsmanship and care",
  gifting_moment:
    "Captured in a heartwarming gifting moment between two people, radiant smiles and genuine joy in a sophisticated setting",
}

export const STRICT_COMMERCIAL_NEGATIVE_PROMPT =
  "cartoon, 3d render, cgi, illustration, anime, deformed petals, mutated flowers, " +
  "wilted flowers, extra flower heads, severed stems, unnatural color shift, blurry subject, " +
  "floating bouquet, harsh flash reflection, oversaturated neon, deformed wrapping paper, " +
  "duplicate objects, watermark text, logo, signature, low resolution, noisy, plastic look, " +
  "unrealistic perspective, AI artifacts, distorted packaging."

export function compileStudioPrompts(params: {
  productPassport: ProductPassportInput
  sceneConfig?: SceneConfigInput
  executionParams?: ExecutionParamsInput
  visualStoryConfig?: VisualStoryConfigInput
}): CompiledStudioPrompts {
  const { productPassport, sceneConfig, visualStoryConfig } = params

  // 1. Tổng hợp hoa & bao bì từ M01
  const flowerDescriptions = productPassport.primaryFlowers.map((f) => {
    return `${f.quantity} stems of ${f.color} ${f.name}`
  })
  const flowerSummary = flowerDescriptions.join(", ")

  const formKey = productPassport.styleOccasion?.form ?? "bo_tron"
  const englishForm = FORM_MAP[formKey] ?? "artisan floral bouquet"

  let packagingText = ""
  if (productPassport.packaging) {
    const pkg = productPassport.packaging
    const wrapColor = pkg.wrapColor ? `${pkg.wrapColor} ` : ""
    const wrapMat = pkg.wrapMaterial ? `${pkg.wrapMaterial} wrapping paper` : "artisan paper"
    const ribbon = pkg.ribbonColor ? `tied with an elegant ${pkg.ribbonColor} ribbon bow` : ""
    packagingText = `carefully wrapped in ${wrapColor}${wrapMat} ${ribbon}`.trim()
  }

  // 2. Tổng hợp bối cảnh, mặt bàn & ánh sáng
  const presetKey = sceneConfig?.presetId ?? "studio_white"
  const presetData = PRESET_ENVIRONMENT_MAP[presetKey] ?? PRESET_ENVIRONMENT_MAP.studio_white!

  const surface = sceneConfig?.surfaceTexture
    ? `premium ${sceneConfig.surfaceTexture.replace("_", " ")}`
    : presetData.surface

  const lighting = sceneConfig?.lightingStyle
    ? `natural ${sceneConfig.lightingStyle.replace("_", " ")}`
    : presetData.light

  const environment = sceneConfig?.environmentDescription || presetData.env

  // 3. Góc chụp và yếu tố con người
  const angleKey = visualStoryConfig?.cameraAngle ?? "front_view"
  const cameraText = CAMERA_ANGLE_MAP[angleKey] ?? CAMERA_ANGLE_MAP.front_view

  const humanKey = visualStoryConfig?.humanInteraction ?? "none"
  const humanText = HUMAN_INTERACTION_MAP[humanKey] || ""

  // 4. Lớp 1: System Prompt (Mệnh lệnh bảo toàn sản phẩm)
  const systemPrompt = [
    "You are a specialized commercial e-commerce product visual artist.",
    "CRITICAL CONSTRAINT - SUBJECT INTEGRITY MANDATE:",
    "1. The floral arrangement in the foreground mask is an EXACT PHYSICAL PRODUCT sold by a flower boutique.",
    "2. DO NOT change, recolor, repaint, add, remove, or distort ANY flower petals, stems, leaves, wrapping paper, or ribbon in the masked area.",
    "3. You must ONLY render the surrounding environment, placing the product naturally in the scene.",
    humanText ? "4. Seamlessly incorporate the requested human presence without obscuring the floral arrangement." : "",
    "5. Generate physically accurate ambient contact shadows beneath the floral base and soft light wrapping matching the scene lighting.",
    "6. The final output must look 100% photorealistic and commercially ready for high-end catalog display.",
  ]
    .filter(Boolean)
    .join("\n")

  // 5. Lớp 2: Positive Prompt
  const positivePrompt = [
    `Professional commercial catalog photography of an authentic ${englishForm},`,
    `featuring ${flowerSummary}, ${packagingText}.`,
    humanText ? `HUMAN INTERACTION: ${humanText}.` : "",
    `ENVIRONMENT: Resting naturally and firmly on a ${surface}, placed in a ${environment}.`,
    `LIGHTING & SHADOWS: Illuminated by ${lighting}, casting delicate, physically accurate contact shadows and subtle soft ambient occlusion.`,
    `CAMERA SPECIFICATION: ${cameraText}.`,
    `QUALITY: Commercial product catalog standard, 8K UHD, photorealistic, pristine studio color grading.`,
  ]
    .filter(Boolean)
    .join(" ")

  const tags = [
    `preset:${presetKey}`,
    `angle:${angleKey}`,
    `human:${humanKey}`,
    `form:${formKey}`,
    "commercial-safe",
    "subject-locked",
  ]

  return {
    systemPrompt,
    positivePrompt,
    negativePrompt: STRICT_COMMERCIAL_NEGATIVE_PROMPT,
    tags,
  }
}

/**
 * Đóng gói chuỗi 4 kịch bản Story Carousel cho một chiến dịch marketing hoa tươi
 */
export function compileStoryCarouselPrompts(params: {
  productPassport: ProductPassportInput
  sceneConfig?: SceneConfigInput
}): readonly StoryCarouselChapterPrompt[] {
  const base = params

  // Chương 1: The Craft (Xưởng hoa & Bàn tay thợ cắm hoa)
  const p1 = compileStudioPrompts({
    ...base,
    sceneConfig: { presetId: "minimal_nordic", surfaceTexture: "oak_wood" },
    visualStoryConfig: { cameraAngle: "macro_closeup", humanInteraction: "florist_artisan_hands" },
  })

  // Chương 2: The Masterpiece (Chân dung kiệt tác trong Studio)
  const p2 = compileStudioPrompts({
    ...base,
    sceneConfig: { presetId: "studio_white", surfaceTexture: "marble_white" },
    visualStoryConfig: { cameraAngle: "front_view", humanInteraction: "none" },
  })

  // Chương 3: The Surprise (Khoảnh khắc đón nhận hạnh phúc)
  const p3 = compileStudioPrompts({
    ...base,
    sceneConfig: { presetId: "cafe_lifestyle" },
    visualStoryConfig: { cameraAngle: "three_quarter_45", humanInteraction: "female_holding" },
  })

  // Chương 4: The Living Memory (Bó hoa trang trọng trong phòng khách)
  const p4 = compileStudioPrompts({
    ...base,
    sceneConfig: { presetId: "luxury_warm", surfaceTexture: "marble_white" },
    visualStoryConfig: { cameraAngle: "three_quarter_45", humanInteraction: "none" },
  })

  return [
    {
      chapterNumber: 1,
      chapterTitle: "1. The Craft — Tỉ mỉ từ xưởng hoa",
      prompt: p1,
      suggestedCaption: "Từng cành hoa được tuyển chọn và cắm tỉ mỉ bằng tất cả tình yêu thương của nghệ nhân...",
    },
    {
      chapterNumber: 2,
      chapterTitle: "2. The Masterpiece — Kiệt tác hoàn mỹ",
      prompt: p2,
      suggestedCaption: "Một thiết kế hoa độc bản mang vẻ đẹp tinh tế, sang trọng và kiêu sa...",
    },
    {
      chapterNumber: 3,
      chapterTitle: "3. The Surprise — Nụ cười đón nhận",
      prompt: p3,
      suggestedCaption: "Khoảnh khắc trao tay đong đầy niềm vui và sự bất ngờ ngọt ngào...",
    },
    {
      chapterNumber: 4,
      chapterTitle: "4. The Living Memory — Tỏa sáng không gian",
      prompt: p4,
      suggestedCaption: "Mang hương sắc dịu dàng làm bừng sáng góc phòng và lưu giữ kỷ niệm khó phai...",
    },
  ]
}
