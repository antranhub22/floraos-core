/**
 * Studio Local Image Provider — mắt xích cuối của `MultiImageProviderRouter`.
 *
 * 23/09/2026 — GỠ `execFileSync` gọi `workers/media_ai/generate_scene.py`.
 * Bản trước chạy Python ĐỒNG BỘ ngay trong tiến trình web (chặn event loop
 * Next.js tới 60 giây), chỉ đọc được ảnh ở `var/storage/` cục bộ, và khi
 * Python lỗi thì TRẢ LẠI NGUYÊN BYTES ẢNH GỐC — ảnh hợp lệ nên bị ghi thành
 * "biến thể" giống hệt ảnh gốc. Cả ba vi phạm luật "cấm `subprocess` + parse
 * stdout, cấm chạy job qua HTTP" ở `AGENTS.md`.
 *
 * Studio Backdrop Engine cục bộ nay CHỈ chạy trong worker Python qua hàng đợi
 * job (`POST /media/variants` → `media.variant` / `media.variant.cloud`).
 * Adapter này vì vậy luôn ném lỗi rõ ràng: router đi hết chuỗi mà không nhà
 * cung cấp nào sinh được ảnh thì người gọi nhận LỖI, không nhận ảnh giả.
 */

import type { ImageProvider, ImageGenerationInput, ImageEditInput } from "@/core/ports/image-provider"
import type { ProviderMedia } from "@/core/ports/shared-media"

export class StudioLocalProviderUnavailableError extends Error {
  constructor() {
    super(
      "Studio Backdrop Engine cục bộ chỉ chạy trong worker qua hàng đợi job " +
        "(POST /api/v1/media/variants, engine=local_studio) — không chạy đồng bộ trong tiến trình web."
    )
    this.name = "StudioLocalProviderUnavailableError"
  }
}

export class StudioLocalImageProvider implements ImageProvider {
  readonly name = "studio_local"
  readonly modelVersion = "studio-local-v1"

  async generate(_input: ImageGenerationInput): Promise<ProviderMedia> {
    throw new StudioLocalProviderUnavailableError()
  }

  async edit(_input: ImageEditInput): Promise<ProviderMedia> {
    throw new StudioLocalProviderUnavailableError()
  }
}
