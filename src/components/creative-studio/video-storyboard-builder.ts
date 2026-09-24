/**
 * Dựng storyboard Khu vực E từ kịch bản bối cảnh của chủ đề (24/09/2026).
 * Thuần — không gọi mạng, để khoá bằng test.
 */

import type { ScenePlan, ScenePlanMotion } from "@/modules/creative-production/domain/scene-plan-rules"
import type { ConcreteTopic } from "@/modules/market-intelligence/domain/product-intelligence-types"
import type { VideoMotionEffect, VideoSceneItem } from "@/modules/video-studio/domain/video-types"

export type SceneImage = { assetId: string; url: string }

const MOTION: Readonly<Record<ScenePlanMotion, VideoMotionEffect>> = {
  zoom_in: "ZOOM_IN",
  zoom_out: "ZOOM_OUT",
  pan_left: "PAN_RIGHT", // worker chưa có pan trái — gần nhất là lia ngang
  pan_right: "PAN_RIGHT",
  pan_up: "PAN_UP",
  static: "STATIC",
}

/** Chia `total` giây cho `n` cảnh, làm tròn 0,1s, cảnh cuối nhận phần dư, mỗi cảnh ≥ 1,5s. */
export function distributeDurations(total: number, n: number): number[] {
  if (n <= 0) return []
  const per = Math.max(1.5, Math.round((total / n) * 10) / 10)
  const out = Array.from({ length: n }, () => per)
  const last = Math.round((total - per * (n - 1)) * 10) / 10
  out[n - 1] = Math.max(1.5, last)
  return out
}

export function buildStoryboardFromPlan(
  plan: ScenePlan,
  targetSeconds: number,
  imagesByScene: Readonly<Record<number, SceneImage>>,
  master: SceneImage | null
): { scenes: VideoSceneItem[]; missingImages: number } {
  const durations = distributeDurations(targetSeconds, plan.scenes.length)
  let missingImages = 0
  const scenes = plan.scenes.map((sc, i) => {
    const img = imagesByScene[sc.sceneIndex] ?? null
    if (!img) missingImages++
    const chosen = img ?? master
    return {
      sceneIndex: i + 1,
      durationSeconds: durations[i]!,
      imageAssetId: chosen?.assetId ?? null,
      imageUrl: chosen?.url ?? null,
      textOverlay: sc.textOverlay || sc.title,
      voiceScript: sc.voiceScript || sc.textOverlay || sc.title,
      transitionEffect: "fade" as const,
      motionEffect: MOTION[sc.motionEffect] ?? "ZOOM_IN",
    }
  })
  return { scenes, missingImages }
}

/** Khi chưa có kịch bản: 3 cảnh hook → tiêu đề → CTA, ảnh là Master (không ảnh mẫu). */
export function buildStoryboardFromTopic(
  topic: ConcreteTopic | null,
  productName: string,
  targetSeconds: number,
  master: SceneImage | null
): VideoSceneItem[] {
  const name = productName || "Bó hoa"
  const texts: Array<[string, string, VideoMotionEffect]> = topic
    ? [
        [topic.hook || `Giới thiệu ${name}`, topic.hook || `Giới thiệu ${name}`, "ZOOM_IN"],
        [topic.title, `${name} — ${topic.title}`, "PAN_RIGHT"],
        [topic.cta || "Nhắn tiệm để đặt hoa", topic.cta || "Nhắn tiệm để đặt hoa", "ZOOM_OUT"],
      ]
    : [
        [name, `Giới thiệu ${name}`, "ZOOM_IN"],
        [name, name, "PAN_RIGHT"],
        ["Nhắn tiệm để đặt hoa", "Nhắn tiệm để đặt hoa", "ZOOM_OUT"],
      ]
  const durations = distributeDurations(targetSeconds, texts.length)
  return texts.map(([textOverlay, voiceScript, motionEffect], i) => ({
    sceneIndex: i + 1,
    durationSeconds: durations[i]!,
    imageAssetId: master?.assetId ?? null,
    imageUrl: master?.url ?? null,
    textOverlay,
    voiceScript,
    transitionEffect: "fade" as const,
    motionEffect,
  }))
}
