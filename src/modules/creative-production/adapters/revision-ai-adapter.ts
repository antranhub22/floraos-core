import type { LLMProvider, LLMResponse } from "@/core/ports/llm-provider"
import type { AiModelCandidate } from "@/core/ai/domain/routing"
import type { AdapterOutcome } from "@/core/ai/gateway"

import type { ScenePlanScene } from "../domain/scene-plan-rules"
import {
  buildContentRewritePrompt,
  buildSceneRevisePrompt,
  contentRewriteJsonSchema,
  normalizeRevisedScene,
  normalizeRewrite,
  sceneReviseJsonSchema,
  type ContentRewriteInput,
  type SceneReviseInput,
} from "../domain/revision-rules"

function withUsage<T>(result: AdapterOutcome<T>, response: LLMResponse): AdapterOutcome<T> {
  if (response.costUsd !== undefined) Object.assign(result, { costUsd: response.costUsd })
  if (response.inputTokens !== undefined) Object.assign(result, { inputTokens: response.inputTokens })
  if (response.outputTokens !== undefined) Object.assign(result, { outputTokens: response.outputTokens })
  return result
}

function parse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Mô hình trả về không phải JSON hợp lệ")
  }
}

/** Sửa MỘT cảnh (`AIC-18 video_storyboard`, kênh `plan_valid`). */
export function createSceneReviseAdapter(llm: LLMProvider, input: SceneReviseInput, organizationId: string) {
  return async (model: AiModelCandidate): Promise<AdapterOutcome<ScenePlanScene>> => {
    const t0 = Date.now()
    try {
      const response = await llm.complete({
        organizationId,
        prompt: buildSceneRevisePrompt(input),
        model: model.key,
        jsonSchema: sceneReviseJsonSchema(),
        maxTokens: 700,
      })
      const r = normalizeRevisedScene(parse(response.text), input.scene)
      if (!r.ok) throw new Error(r.reason)
      return withUsage({ ok: true, output: r.scene, scores: { plan_valid: 1 }, latencyMs: Date.now() - t0 }, response)
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Lỗi không xác định" }
    }
  }
}

export type RewriteOutput = { text: string; hashtags: string[]; warnings: string[] }

/** AI viết lại MỘT bài (`AIC-23 content_generation`). Chấm 4 kênh bằng luật tất định. */
export function createContentRewriteAdapter(llm: LLMProvider, input: ContentRewriteInput, organizationId: string) {
  return async (model: AiModelCandidate): Promise<AdapterOutcome<RewriteOutput>> => {
    const t0 = Date.now()
    try {
      const response = await llm.complete({
        organizationId,
        prompt: buildContentRewritePrompt(input),
        model: model.key,
        jsonSchema: contentRewriteJsonSchema(),
        maxTokens: 1800,
      })
      const r = normalizeRewrite(parse(response.text), input)
      if (!r.ok) throw new Error(r.reason)
      const output: RewriteOutput = { text: r.text, hashtags: r.hashtags, warnings: r.warnings }
      return withUsage(
        {
          ok: true,
          output,
          scores: {
            factual: 1,
            brand: r.warnings.length === 0 ? 1 : 0.7,
            platform: 1,
            readability: 1,
          },
          latencyMs: Date.now() - t0,
        },
        response
      )
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Lỗi không xác định" }
    }
  }
}
