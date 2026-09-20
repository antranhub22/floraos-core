/**
 * Music Catalog — SSOT danh mục nhạc nền cho Audio Studio.
 *
 * Quản lý tập trung các track nhạc nền bản quyền miễn phí,
 * phân loại theo mood và gợi ý tự động theo ProductionMode + Topic.
 *
 * Thuần TypeScript — Zero external dependencies.
 */

import type { MusicTrackSpec, MusicMood } from "./audio-types"

// ============================================================
// SSOT MUSIC CATALOG
// ============================================================

export const MUSIC_CATALOG: readonly MusicTrackSpec[] = [
  {
    trackId: "acoustic-warm-guitar",
    displayName: "Acoustic Warm Guitar",
    mood: "warm",
    durationSeconds: 120,
    filename: "acoustic_warm_guitar.mp3",
    license: "royalty_free",
    suitableFor: ["AUTHENTIC", "CREATIVE"],
  },
  {
    trackId: "upbeat-cheerful-pop",
    displayName: "Upbeat Cheerful Pop",
    mood: "upbeat",
    durationSeconds: 120,
    filename: "upbeat_cheerful_pop.mp3",
    license: "royalty_free",
    suitableFor: ["CREATIVE"],
  },
  {
    trackId: "lo-fi-chill-beats",
    displayName: "Lo-Fi Chill Beats",
    mood: "chill",
    durationSeconds: 120,
    filename: "lo_fi_chill_beats.mp3",
    license: "royalty_free",
    suitableFor: ["AUTHENTIC", "CREATIVE"],
  },
  {
    trackId: "romantic-piano-melody",
    displayName: "Romantic Piano Melody",
    mood: "romantic",
    durationSeconds: 120,
    filename: "romantic_piano_melody.mp3",
    license: "royalty_free",
    suitableFor: ["AUTHENTIC", "CREATIVE"],
  },
] as const

// ============================================================
// LOOKUP & SELECTION UTILITIES
// ============================================================

/**
 * Tìm track theo trackId.
 */
export function getMusicTrack(trackId: string): MusicTrackSpec | undefined {
  return MUSIC_CATALOG.find((t) => t.trackId === trackId)
}

/**
 * Lọc track theo mood.
 */
export function filterTracksByMood(mood: MusicMood): readonly MusicTrackSpec[] {
  if (mood === "none") return []
  return MUSIC_CATALOG.filter((t) => t.mood === mood)
}

/**
 * Lọc track phù hợp với ProductionMode.
 */
export function filterTracksForMode(
  mode: "AUTHENTIC" | "CREATIVE"
): readonly MusicTrackSpec[] {
  return MUSIC_CATALOG.filter((t) => t.suitableFor.includes(mode))
}

/**
 * Gợi ý nhạc nền theo mood.
 * Trả track đầu tiên phù hợp, hoặc Acoustic Guitar làm mặc định.
 */
export function suggestMusicTrack(mood: MusicMood): MusicTrackSpec | undefined {
  if (mood === "none") return undefined
  const matches = filterTracksByMood(mood)
  return matches[0] ?? MUSIC_CATALOG[0]
}

/**
 * Gợi ý mood nhạc nền phù hợp theo TopicAngleCategory.
 */
export function suggestMoodForTopicAngle(
  angleCategory: string
): MusicMood {
  switch (angleCategory) {
    case "EMOTIONAL":
      return "romantic"
    case "PRODUCT_SHOWCASE":
      return "warm"
    case "EDUCATIONAL":
      return "chill"
    case "PROBLEM_SOLUTION":
      return "warm"
    case "TREND":
      return "upbeat"
    case "PRICE_VALUE":
      return "upbeat"
    default:
      return "warm"
  }
}

/**
 * Ánh xạ tên track cũ (từ video_worker) sang trackId mới.
 * Dùng để backward-compatible khi refactor.
 */
export function migrateLegacyTrackName(legacyName: string): string | undefined {
  const map: Record<string, string> = {
    "Acoustic Warm Guitar": "acoustic-warm-guitar",
    "Upbeat Cheerful Pop": "upbeat-cheerful-pop",
    "Lo-Fi Chill Beats": "lo-fi-chill-beats",
    "Romantic Piano Melody": "romantic-piano-melody",
  }
  return map[legacyName]
}
