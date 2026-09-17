export interface LLMRequest {
  organizationId: string;
  prompt: string;
  jsonSchema?: unknown;
  maxTokens?: number;
  /**
   * Khoá mô hình trong sổ đăng ký (`ai_models.key`) mà bộ định tuyến của
   * cổng AI đã chọn cho lượt gọi này. Adapter dịch khoá sang mã mô hình của
   * nhà cung cấp. Bỏ trường này là bộ định tuyến chọn một đằng còn adapter
   * gọi một nẻo, và `ai_requests` ghi lại một quyết định chưa từng xảy ra
   * (D15, D17).
   */
  model?: string;
}

export interface LLMResponse {
  text: string;
  model: string;
  modelVersion: string;
  costUsd?: number;
  /** Số token thật của lượt gọi — `ai_requests` ghi lại để đối soát. */
  inputTokens?: number;
  outputTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
}
