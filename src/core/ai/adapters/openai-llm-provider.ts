import type { LLMProvider, LLMRequest, LLMResponse } from "@/core/ports/llm-provider";
import { env } from "@/lib/env";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  response_format?: { type: "json_object" } | undefined;
  max_tokens?: number;
  temperature?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenAILLMProvider implements LLMProvider {
  readonly name = "openai";

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY không được cấu hình");
    }
    this.apiKey = apiKey;
    this.baseUrl = "https://api.openai.com/v1";
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const messages: OpenAIMessage[] = [
      { role: "system", content: "Bạn là chuyên viên viết nội dung bán hàng cho cửa hàng hoa. Luôn trả về JSON hợp lệ theo schema được cung cấp." },
      { role: "user", content: request.prompt },
    ];

    const openAIRequest: OpenAIRequest = {
      model: "gpt-4o-mini",
      messages,
      max_tokens: request.maxTokens ?? 1000,
      temperature: 0.7,
    };

    if (request.jsonSchema) {
      openAIRequest.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(openAIRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data: OpenAIResponse = await response.json();
    
    const text = data.choices[0]?.message?.content ?? "";
    const modelVersion = data.model;
    
    let costUsd: number | undefined;
    if (data.usage) {
      // Rough cost estimation for gpt-4o-mini
      const inputCost = (data.usage.prompt_tokens / 1_000_000) * 0.15;
      const outputCost = (data.usage.completion_tokens / 1_000_000) * 0.60;
      costUsd = inputCost + outputCost;
    }

    const result: LLMResponse = {
      text,
      model: this.name,
      modelVersion,
    };
    if (costUsd !== undefined) {
      result.costUsd = costUsd;
    }
    return result;
  }
}