export interface LLMRequest {
  organizationId: string;
  prompt: string;
  jsonSchema?: unknown;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  model: string;
  modelVersion: string;
  costUsd?: number;
}

export interface LLMProvider {
  readonly name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
}
