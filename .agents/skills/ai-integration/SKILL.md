---
name: ai-integration
description: >-
  Quy tắc tích hợp AI cho FloraOS. Kích hoạt khi agent làm việc với AI gateway,
  provider adapters, port interfaces, hoặc bất kỳ file nào trong src/core/ai/,
  src/core/ports/, hoặc module adapters gọi AI services (OpenAI, Anthropic, ElevenLabs).
---

# AI Integration — FloraOS

## Quick Reference (copy-paste)

### Gọi AI qua gateway
```typescript
import { aiGateway } from "@/core/ai/gateway"

const result = await aiGateway.generate({
  capability: "text_generation",
  input: { prompt: "..." },
  ctx,
})
```

### Tạo adapter mới cho provider
```typescript
// src/core/ai/adapters/<provider>-adapter.ts
import type { LlmProvider } from "@/core/ports/llm-provider"

export class MyProviderAdapter implements LlmProvider {
  async generate(input: LlmInput): Promise<LlmOutput> {
    // SDK call tại đây — KHÔNG ở đâu khác
  }
}
```

---

## Rules (bắt buộc)

### 1. AI Gateway
- Mọi lời gọi AI đi qua `src/core/ai/gateway.ts`. Cấm gọi SDK trực tiếp.
- **Mã nghiệp vụ gọi NĂNG LỰC, không gọi nhà cung cấp.**
- Mô hình AI là hàng trong bảng `ai_models`, không phải hằng trong mã.

### 2. Port Interfaces (13 cổng tại `src/core/ports/`)
`llm-provider` · `image-provider` · `video-provider` · `speech-provider` · `vision-analyzer` · `segmentation-provider` · `embedding-provider` · `storage-provider` · `queue-provider` · `publisher-provider` · `trend-provider` · `shared-media` · `video-provider`

### 3. Provider Rules
- SDK (OpenAI, Anthropic, ElevenLabs) **chỉ xuất hiện** trong `adapters/`.
- Providers tương đương: cùng port + bảng năng lực, bên lỗi → bên kế, mọi bên lỗi → luồng cục bộ + GHI RÕ lý do.
- Khi dùng provider → dùng TOÀN BỘ tính năng, không trộn cục bộ.

### 4. Licensing (bắt buộc)
Mô hình không vào production thiếu 1 trong 4 ô: `license`, `commercial_use`, `territory`, `allowed_use`. Filter: `eligibleModels()`.

### 5. Privacy Floor
Lời gọi `SENSITIVE` không ra nhà cung cấp ngoài, kể cả fallback.

### 6. Circuit Breaker
AI calls bắt buộc qua `AICircuitBreaker`.

---

## DO / DON'T

### ❌ DON'T — Import SDK trực tiếp trong use-case
```typescript
// src/modules/<module>/use-cases/generate-text.ts
import OpenAI from "openai"  // KHÔNG!
const client = new OpenAI()
const result = await client.chat.completions.create(...)
```

### ✅ DO — Gọi qua gateway
```typescript
// src/modules/<module>/use-cases/generate-text.ts
import { aiGateway } from "@/core/ai/gateway"
const result = await aiGateway.generate({ capability: "text_generation", input, ctx })
```

---

## Reference Files

| Pattern | File |
|---|---|
| AI Gateway | `src/core/ai/gateway.ts` |
| Gateway test | `src/core/ai/gateway.test.ts` |
| Wiring (DI) | `src/core/ai/wiring.ts` |
| Port interfaces | `src/core/ports/` (13 files) |
| Provider mẫu | `workers/media_ai/providers/scene/` |

> Xem thêm: skill `worker-python` §5 cho provider routing trong worker.
