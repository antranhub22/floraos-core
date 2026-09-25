/**
 * Đăng ký phiên bản prompt đang dùng cho mỗi agent (mục 5.1 kế hoạch: đổi
 * phiên bản = đổi một dòng ở đây, không rải rác trong use-case). Nâng cấp
 * prompt: tạo `vN.ts` mới cạnh `v1.ts`, rồi trỏ registry sang bản mới —
 * không sửa lặng lẽ bản đang chạy.
 *
 * Thuần — không import Prisma, không gọi mạng.
 */

import { CRITIC_PROMPT_V1 } from "./critic/v1"
import { REWRITER_PROMPT_V1 } from "./rewriter/v1"
import { STRATEGIST_PROMPT_V1 } from "./strategist/v1"
import { WRITER_PROMPT_V1 } from "./writer/v1"

export const ACTIVE_PROMPTS = {
  strategist: STRATEGIST_PROMPT_V1,
  writer: WRITER_PROMPT_V1,
  critic: CRITIC_PROMPT_V1,
  rewriter: REWRITER_PROMPT_V1,
} as const
