/**
 * Studio Local Image Provider — Bộ tăng cường ảnh Studio Cục bộ nội bộ.
 *
 * Chức năng:
 * - Bảo tồn 100% pixel vùng hoa gốc, không qua API bên thứ ba (0đ, an toàn tuyệt đối).
 * - Sử dụng StudioBackdropEngine (Python / Pillow / OpenCV) để sinh bóng đổ tự nhiên (Contact Shadow),
 *   Optical Light Wrap và ghép bối cảnh Studio/Lifestyle/Gỗ ấm/Tách nền trong suốt chuẩn E-commerce.
 * - Cổng: Implements ImageProvider (src/core/ports/image-provider.ts).
 */

import { execFileSync } from "node:child_process"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import type { ImageProvider, ImageGenerationInput, ImageEditInput } from "@/core/ports/image-provider"
import type { ProviderMedia } from "@/core/ports/shared-media"

export class StudioLocalImageProvider implements ImageProvider {
  readonly name = "studio_local"
  readonly modelVersion = "studio-local-v1"

  async generate(input: ImageGenerationInput): Promise<ProviderMedia> {
    return {
      bytes: new Uint8Array(),
      mimeType: "image/jpeg",
      modelVersion: this.modelVersion,
      costUsd: 0.0,
      providerFlags: {
        generative_fill_used: false,
        subject_preserved: true,
      },
    }
  }

  async edit(input: ImageEditInput): Promise<ProviderMedia> {
    // 1. Phân tích bối cảnh từ prompt
    const prompt = (input.prompt || "").toLowerCase()
    let style = "boutique_bokeh"

    if (prompt.includes("transparent") || prompt.includes("cutout") || prompt.includes("png")) {
      style = "transparent"
    } else if (prompt.includes("clean") || prompt.includes("studio") || prompt.includes("white")) {
      style = "clean_white"
    } else if (
      prompt.includes("wood") ||
      prompt.includes("nordic") ||
      prompt.includes("minimal") ||
      prompt.includes("oak") ||
      prompt.includes("card") ||
      prompt.includes("ribbon")
    ) {
      style = "wood_warm"
    } else if (
      prompt.includes("lifestyle") ||
      prompt.includes("hotel") ||
      prompt.includes("banquet") ||
      prompt.includes("bokeh") ||
      prompt.includes("grand opening")
    ) {
      style = "boutique_bokeh"
    }

    const isPng = style === "transparent"
    const ext = isPng ? "png" : "jpg"
    const mimeType = isPng ? "image/png" : "image/jpeg"

    // 2. Xác định đường dẫn file master gốc
    let masterFilePath: string | null = null
    let tempMasterFile: string | null = null

    if (input.imageRef?.storageKey) {
      const candidatePath = path.join(process.cwd(), "var", "storage", input.imageRef.storageKey)
      if (fs.existsSync(candidatePath)) {
        masterFilePath = candidatePath
      }
    }

    if (!masterFilePath && input.imageBytes && input.imageBytes.length > 0) {
      tempMasterFile = path.join(os.tmpdir(), `master_${Date.now()}_${crypto.randomUUID()}.png`)
      fs.writeFileSync(tempMasterFile, Buffer.from(input.imageBytes))
      masterFilePath = tempMasterFile
    }

    // 3. Nếu tìm được master file, gọi generate_scene.py
    if (masterFilePath) {
      const venvPy = path.join(process.cwd(), "workers", ".venv", "bin", "python")
      const scriptPath = path.join(process.cwd(), "workers", "media_ai", "generate_scene.py")
      const tempOutFile = path.join(
        os.tmpdir(),
        `scene_${style}_${Date.now()}_${crypto.randomUUID()}.${ext}`
      )

      try {
        if (fs.existsSync(venvPy) && fs.existsSync(scriptPath)) {
          execFileSync(venvPy, [scriptPath, masterFilePath, style, tempOutFile], {
            encoding: "utf8",
            timeout: 60000,
          })

          if (fs.existsSync(tempOutFile) && fs.statSync(tempOutFile).size > 1000) {
            const resultBytes = new Uint8Array(fs.readFileSync(tempOutFile))
            try {
              fs.unlinkSync(tempOutFile)
              if (tempMasterFile && fs.existsSync(tempMasterFile)) fs.unlinkSync(tempMasterFile)
            } catch {
              // ignore
            }

            return {
              bytes: resultBytes,
              mimeType,
              modelVersion: this.modelVersion,
              costUsd: 0.0,
              providerFlags: {
                generative_fill_used: style !== "clean_white" && style !== "transparent",
                subject_preserved: true,
                local_engine: true,
              },
            }
          }
        }
      } catch (err) {
        console.error("[StudioLocalImageProvider] Error executing generate_scene.py:", err)
      } finally {
        if (tempMasterFile && fs.existsSync(tempMasterFile)) {
          try {
            fs.unlinkSync(tempMasterFile)
          } catch {
            // ignore
          }
        }
        if (fs.existsSync(tempOutFile)) {
          try {
            fs.unlinkSync(tempOutFile)
          } catch {
            // ignore
          }
        }
      }
    }

    // 4. Fallback an toàn nếu không chạy được Python
    const bytes = input.imageBytes && input.imageBytes.length > 0 ? input.imageBytes : new Uint8Array()

    return {
      bytes,
      mimeType: "image/jpeg",
      modelVersion: this.modelVersion,
      costUsd: 0.0,
      providerFlags: {
        generative_fill_used: false,
        subject_preserved: true,
        local_engine: true,
      },
    }
  }
}
