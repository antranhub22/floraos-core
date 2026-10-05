/**
 * 12 Visual Swipe Template Style Configurations.
 * SSOT based on docs/kien-truc/Nâng cấp tasks/Nang_cap_cac_Templates_The_chao_hang
 * and mockup reference. 100% compliant with FloraOS semantic design tokens.
 */

export interface TemplateStyleConfig {
  id: string
  styleNumber: string
  name: string
  nameVi: string
  shopName: string
  backgroundClass: string
  overlayClass?: string
  textLight: boolean
  titleFontClass: string
  subtitleClass: string
  priceClass: string
  accentColor: string
  headerCursive?: boolean
  effects: {
    vignette?: boolean
    botanicalFrame?: boolean
    glassPanel?: boolean
    realLifeScene?: "shop" | "daylight" | "in-store" | "handheld" | "lifestyle"
    mixedMedia?: boolean
    floatingPetals?: boolean
    ribbonBow?: boolean
  }
  controlsTheme: {
    rejectBtnClass: string
    favBtnClass: string
    nextBtnClass: string
    ctaBtnClass: string
  }
}

export const TEMPLATE_STYLE_CONFIGS: Record<string, TemplateStyleConfig> = {
  "01": {
    id: "editorial-luxury",
    styleNumber: "01",
    name: "Editorial Luxury",
    nameVi: "Sang trọng, tạp chí thời trang",
    shopName: "BLOOM",
    backgroundClass: "bg-gradient-to-b from-cool-900 via-black to-cool-950 text-white",
    textLight: true,
    titleFontClass: "font-serif text-3xl sm:text-4xl tracking-tight text-white font-normal leading-tight drop-shadow-md",
    subtitleClass: "text-caption tracking-widest uppercase text-cool-300 font-light",
    priceClass: "text-body-sm sm:text-title font-semibold text-blush-300",
    accentColor: "var(--color-blush-500)",
    effects: { vignette: true },
    controlsTheme: {
      rejectBtnClass: "bg-white/10 hover:bg-white/20 text-white/80 border border-white/15 backdrop-blur-md",
      favBtnClass: "bg-blush-500 hover:bg-blush-600 text-white shadow-xl shadow-black/60 scale-110",
      nextBtnClass: "bg-white/10 hover:bg-white/20 text-white/80 border border-white/15 backdrop-blur-md",
      ctaBtnClass: "bg-blush-600 hover:bg-blush-700 text-white shadow-md shadow-black/40",
    },
  },
  "02": {
    id: "minimal-clean",
    styleNumber: "02",
    name: "Minimal Clean",
    nameVi: "Tối giản, hiện đại",
    shopName: "LUCY FLORAL",
    backgroundClass: "bg-cool-50 text-cool-900 border border-cool-200",
    textLight: false,
    titleFontClass: "font-serif text-2xl sm:text-3xl text-cool-900 font-medium tracking-tight",
    subtitleClass: "text-caption text-cool-500 font-normal",
    priceClass: "text-body-sm sm:text-title font-semibold text-cool-900",
    accentColor: "var(--color-blush-600)",
    effects: {},
    controlsTheme: {
      rejectBtnClass: "bg-cool-100 hover:bg-cool-200 text-cool-600 border border-cool-300",
      favBtnClass: "bg-blush-400 hover:bg-blush-500 text-white shadow-md shadow-blush-200 scale-110",
      nextBtnClass: "bg-cool-100 hover:bg-cool-200 text-cool-600 border border-cool-300",
      ctaBtnClass: "bg-cool-900 hover:bg-black text-white",
    },
  },
  "03": {
    id: "cinematic-dark",
    styleNumber: "03",
    name: "Cinematic Dark",
    nameVi: "Điện ảnh, ấn tượng",
    shopName: "NOIR FLORIST",
    backgroundClass: "bg-cool-950 text-sand-100 border border-sand-950",
    textLight: true,
    titleFontClass: "font-cursive text-3xl sm:text-4xl tracking-wide text-sand-200 font-normal leading-snug drop-shadow-md",
    subtitleClass: "text-caption uppercase tracking-wider text-sand-400/80 font-light",
    priceClass: "text-body-sm sm:text-title font-medium text-sand-300",
    accentColor: "var(--color-sand-500)",
    effects: { vignette: true },
    controlsTheme: {
      rejectBtnClass: "bg-cool-900 hover:bg-cool-800 text-cool-400 border border-cool-800",
      favBtnClass: "bg-sand-500 hover:bg-sand-600 text-cool-950 shadow-xl shadow-black/60 scale-110 font-bold",
      nextBtnClass: "bg-cool-900 hover:bg-cool-800 text-cool-400 border border-cool-800",
      ctaBtnClass: "bg-sand-600 hover:bg-sand-500 text-cool-950 font-bold",
    },
  },
  "04": {
    id: "romantic-pastel",
    styleNumber: "04",
    name: "Romantic Pastel",
    nameVi: "Lãng mạn, mềm mại",
    shopName: "Blooming Moments",
    headerCursive: true,
    backgroundClass: "bg-gradient-to-b from-blush-50 via-blush-100 to-orchid-50 text-blush-950",
    textLight: false,
    titleFontClass: "font-serif text-2xl sm:text-3xl text-blush-950 font-semibold tracking-tight",
    subtitleClass: "text-caption text-blush-700 font-normal",
    priceClass: "text-body-sm sm:text-title font-bold text-blush-800",
    accentColor: "var(--color-blush-500)",
    effects: { floatingPetals: true },
    controlsTheme: {
      rejectBtnClass: "bg-blush-100 hover:bg-blush-200 text-blush-700 border border-blush-200",
      favBtnClass: "bg-blush-500 hover:bg-blush-600 text-white shadow-md shadow-blush-300 scale-110",
      nextBtnClass: "bg-blush-100 hover:bg-blush-200 text-blush-700 border border-blush-200",
      ctaBtnClass: "bg-blush-600 hover:bg-blush-700 text-white",
    },
  },
  "05": {
    id: "botanical-frame",
    styleNumber: "05",
    name: "Botanical Frame",
    nameVi: "Thiên nhiên, tinh tế",
    shopName: "THE GARDEN",
    backgroundClass: "bg-sage-bg text-cool-900 border border-cool-300",
    textLight: false,
    titleFontClass: "font-serif text-2xl sm:text-3xl text-cool-900 font-medium tracking-tight",
    subtitleClass: "text-caption text-cool-600 font-normal",
    priceClass: "text-body-sm sm:text-title font-semibold text-secondary-text",
    accentColor: "var(--color-gold)",
    effects: { botanicalFrame: true },
    controlsTheme: {
      rejectBtnClass: "bg-cool-200 hover:bg-cool-300 text-cool-700 border border-cool-300",
      favBtnClass: "bg-gold hover:bg-gold/90 text-white shadow-md shadow-cool-300 scale-110",
      nextBtnClass: "bg-cool-200 hover:bg-cool-300 text-cool-700 border border-cool-300",
      ctaBtnClass: "bg-secondary-text hover:bg-secondary-text/90 text-white",
    },
  },
  "06": {
    id: "glassmorphism",
    styleNumber: "06",
    name: "Glassmorphism",
    nameVi: "Hiện đại, trong suốt",
    shopName: "FLORA",
    backgroundClass: "bg-gradient-to-b from-ocean-950 via-cool-950 to-black text-white",
    textLight: true,
    titleFontClass: "font-sans text-2xl sm:text-3xl font-bold tracking-tight text-white",
    subtitleClass: "text-caption text-white/80 font-light",
    priceClass: "text-body-sm sm:text-title font-bold text-sand-300",
    accentColor: "var(--color-azure-300)",
    effects: { glassPanel: true },
    controlsTheme: {
      rejectBtnClass: "bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 backdrop-blur-md",
      favBtnClass: "bg-sand-400 hover:bg-sand-500 text-cool-950 shadow-xl shadow-black/50 scale-110",
      nextBtnClass: "bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 backdrop-blur-md",
      ctaBtnClass: "bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md",
    },
  },
  "07": {
    id: "real-life-shop",
    styleNumber: "07",
    name: "Real Life - Shop Photo",
    nameVi: "Ảnh chụp thực tế, tự nhiên",
    shopName: "BLOOM",
    backgroundClass: "bg-cool-900 text-white",
    textLight: true,
    titleFontClass: "font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white drop-shadow-md",
    subtitleClass: "text-caption text-cool-200",
    priceClass: "text-body-sm sm:text-title font-semibold text-blush-300",
    accentColor: "var(--color-blush-600)",
    effects: { realLifeScene: "shop", ribbonBow: true },
    controlsTheme: {
      rejectBtnClass: "bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm",
      favBtnClass: "bg-blush-500 hover:bg-blush-600 text-white shadow-xl shadow-black/50 scale-110",
      nextBtnClass: "bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm",
      ctaBtnClass: "bg-blush-600 hover:bg-blush-700 text-white",
    },
  },
  "08": {
    id: "real-life-daylight",
    styleNumber: "08",
    name: "Real Life - Daylight",
    nameVi: "Ánh sáng tự nhiên, đời thực",
    shopName: "FLORA",
    backgroundClass: "bg-cool-800 text-white",
    textLight: true,
    titleFontClass: "font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow-md",
    subtitleClass: "text-caption text-cool-200",
    priceClass: "text-body-sm sm:text-title font-semibold text-sand-200",
    accentColor: "var(--color-sand-400)",
    effects: { realLifeScene: "daylight" },
    controlsTheme: {
      rejectBtnClass: "bg-black/35 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm",
      favBtnClass: "bg-blush-400 hover:bg-blush-500 text-white shadow-xl shadow-black/40 scale-110",
      nextBtnClass: "bg-black/35 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm",
      ctaBtnClass: "bg-blush-500 hover:bg-blush-600 text-white",
    },
  },
  "09": {
    id: "real-life-in-store",
    styleNumber: "09",
    name: "Real Life - In Store",
    nameVi: "Trong cửa hàng, gần gũi",
    shopName: "MAY FLOWER",
    backgroundClass: "bg-cool-900 text-white",
    textLight: true,
    titleFontClass: "font-serif text-2xl sm:text-3xl font-medium tracking-tight text-sand-50 drop-shadow-md",
    subtitleClass: "text-caption text-sand-200/80",
    priceClass: "text-body-sm sm:text-title font-semibold text-sand-300",
    accentColor: "var(--color-sand-500)",
    effects: { realLifeScene: "in-store" },
    controlsTheme: {
      rejectBtnClass: "bg-black/40 hover:bg-black/60 text-sand-100 border border-white/15 backdrop-blur-sm",
      favBtnClass: "bg-sand-500 hover:bg-sand-600 text-cool-950 shadow-xl shadow-black/50 scale-110",
      nextBtnClass: "bg-black/40 hover:bg-black/60 text-sand-100 border border-white/15 backdrop-blur-sm",
      ctaBtnClass: "bg-sand-600 hover:bg-sand-700 text-white",
    },
  },
  "10": {
    id: "real-life-handheld",
    styleNumber: "10",
    name: "Real Life - Handheld",
    nameVi: "Cầm tay, góc chụp casual",
    shopName: "LUCY FLORAL",
    backgroundClass: "bg-cool-900 text-white",
    textLight: true,
    titleFontClass: "font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow-md",
    subtitleClass: "text-caption text-cool-200",
    priceClass: "text-body-sm sm:text-title font-semibold text-blush-200",
    accentColor: "var(--color-blush-400)",
    effects: { realLifeScene: "handheld" },
    controlsTheme: {
      rejectBtnClass: "bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm",
      favBtnClass: "bg-blush-400 hover:bg-blush-500 text-white shadow-xl shadow-black/40 scale-110",
      nextBtnClass: "bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm",
      ctaBtnClass: "bg-blush-500 hover:bg-blush-600 text-white",
    },
  },
  "11": {
    id: "lifestyle-context",
    styleNumber: "11",
    name: "Lifestyle Context",
    nameVi: "Trong bối cảnh sử dụng",
    shopName: "HOME FLOWER",
    backgroundClass: "bg-cool-100 text-cool-900 border border-cool-300",
    textLight: false,
    titleFontClass: "font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-cool-900",
    subtitleClass: "text-caption text-cool-600",
    priceClass: "text-body-sm sm:text-title font-semibold text-cool-900",
    accentColor: "var(--color-blush-600)",
    effects: { realLifeScene: "lifestyle" },
    controlsTheme: {
      rejectBtnClass: "bg-white/80 hover:bg-white text-cool-700 border border-cool-300 shadow-2xs",
      favBtnClass: "bg-blush-400 hover:bg-blush-500 text-white shadow-md shadow-blush-200 scale-110",
      nextBtnClass: "bg-white/80 hover:bg-white text-cool-700 border border-cool-300 shadow-2xs",
      ctaBtnClass: "bg-cool-900 hover:bg-black text-white",
    },
  },
  "12": {
    id: "mixed-media",
    styleNumber: "12",
    name: "Mixed Media Style",
    nameVi: "Kết hợp thật và thiết kế",
    shopName: "PETITE FLEUR",
    backgroundClass: "bg-gradient-to-b from-cool-800 via-cool-900 to-black text-white",
    textLight: true,
    titleFontClass: "font-serif text-2xl sm:text-3xl font-bold tracking-tight text-sand-50 drop-shadow-md",
    subtitleClass: "text-caption text-sand-200/80",
    priceClass: "text-body-sm sm:text-title font-semibold text-sand-300",
    accentColor: "var(--color-sand-500)",
    effects: { mixedMedia: true },
    controlsTheme: {
      rejectBtnClass: "bg-black/30 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm",
      favBtnClass: "bg-sand-400 hover:bg-sand-500 text-cool-950 shadow-md shadow-black/40 scale-110",
      nextBtnClass: "bg-black/30 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm",
      ctaBtnClass: "bg-sand-500 hover:bg-sand-600 text-cool-950 font-bold",
    },
  },
}

/** Helper resolving style config by id or style number */
export function getTemplateStyleConfig(idOrNum: string): TemplateStyleConfig {
  const direct = TEMPLATE_STYLE_CONFIGS[idOrNum]
  if (direct) {
    return direct
  }
  const match = Object.values(TEMPLATE_STYLE_CONFIGS).find(
    (cfg) => cfg.id === idOrNum || cfg.styleNumber === idOrNum
  )
  if (match) return match
  // Fallback to 01 Editorial Luxury
  return TEMPLATE_STYLE_CONFIGS["01"]!
}
