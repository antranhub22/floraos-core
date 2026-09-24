import type { LLMProvider, LLMRequest, LLMResponse } from "@/core/ports/llm-provider"
import type { AiModelCandidate } from "@/core/ai/domain/routing"
import type { AdapterOutcome } from "@/core/ai/gateway"

import {
  buildScenePlanPrompt,
  normalizeAiScenePlan,
  scenePlanJsonSchema,
  type ScenePlan,
  type ScenePlanInput,
} from "../domain/scene-plan-rules"

/**
 * Adapter AI viết kịch bản bối cảnh (`AIC-18 video_storyboard`). Kênh chấm
 * duy nhất của năng lực là `plan_valid`: 1 khi đầu ra qua được
 * `normalizeAiScenePlan` — đầu ra không qua thì trả thất bại, không có điểm 0.
 */
export function createScenePlanAdapter(
  llmProvider: LLMProvider,
  input: ScenePlanInput,
  organizationId: string
): (model: AiModelCandidate) => Promise<AdapterOutcome<ScenePlan>> {
  return async (model: AiModelCandidate) => {
    const batDau = Date.now()
    try {
      const request: LLMRequest = {
        organizationId,
        prompt: buildScenePlanPrompt(input),
        model: model.key,
        jsonSchema: scenePlanJsonSchema(input.mode),
        maxTokens: 5000, // v2 (24/09/2026): thêm âm thanh, video, bài đăng từng kênh
      }
      const response: LLMResponse = await llmProvider.complete(request)

      let raw: unknown
      try {
        raw = JSON.parse(response.text)
      } catch {
        throw new Error("Mô hình trả về không phải JSON hợp lệ")
      }

      const normalized = normalizeAiScenePlan(raw, input)
      if (!normalized.ok) throw new Error(normalized.reason)

      const result: AdapterOutcome<ScenePlan> = {
        ok: true,
        output: normalized.plan,
        scores: { plan_valid: 1 },
        latencyMs: Date.now() - batDau,
      }
      if (response.costUsd !== undefined) Object.assign(result, { costUsd: response.costUsd })
      if (response.inputTokens !== undefined) Object.assign(result, { inputTokens: response.inputTokens })
      if (response.outputTokens !== undefined) Object.assign(result, { outputTokens: response.outputTokens })
      return result
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Lỗi không xác định" }
    }
  }
}
