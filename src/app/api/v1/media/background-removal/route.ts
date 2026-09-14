import { spawn } from "node:child_process"
import path from "node:path"
import { handle, jsonResponse } from "@/core/http/response"
import { AppError } from "@/core/http/errors"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * `POST /api/v1/media/background-removal`
 * Endpoint AI Matting Deep Learning (U2-Net + EdgeDefringer + StudioBackdropEngine).
 * Thực thi trực tiếp mô hình AI nội bộ để sinh bộ 3 biến thể Marketing M04b chuẩn studio.
 */
export const POST = handle(async (request: Request) => {
  const body = await request.json().catch(() => null)
  if (!body) {
    throw new AppError("VALIDATION_FAILED", "Payload JSON không hợp lệ")
  }

  const projectRoot = process.cwd()
  const pythonPath = path.join(projectRoot, "workers", ".venv", "bin", "python")
  const scriptPath = path.join(projectRoot, "scripts", "media", "process_m04b_variants.py")

  const pyProcess = spawn(pythonPath, [scriptPath], {
    cwd: projectRoot,
    env: { ...process.env },
  })

  return new Promise<Response>((resolve, reject) => {
    let stdoutData = ""
    let stderrData = ""

    pyProcess.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString()
    })

    pyProcess.stderr.on("data", (chunk) => {
      stderrData += chunk.toString()
    })

    pyProcess.on("error", (err) => {
      reject(new AppError("INTERNAL", `Lỗi khởi chạy Python AI: ${err.message}`))
    })

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        let errDetail = stderrData.trim() || stdoutData.trim()
        try {
          const parsed = JSON.parse(stdoutData)
          if (parsed.error) errDetail = parsed.error
        } catch { /* ignore */ }
        return reject(
          new AppError("INTERNAL", `AI bóc tách nền thất bại (mã ${code}): ${errDetail}`)
        )
      }

      try {
        const result = JSON.parse(stdoutData)
        if (!result.ok) {
          return reject(
            new AppError("INTERNAL", result.error || "AI bóc tách nền không thành công")
          )
        }
        resolve(jsonResponse(result))
      } catch (e) {
        reject(
          new AppError(
            "INTERNAL",
            `Không đọc được kết quả từ mô hình AI: ${e instanceof Error ? e.message : String(e)}`
          )
        )
      }
    })

    // Gửi payload qua stdin
    pyProcess.stdin.write(JSON.stringify(body))
    pyProcess.stdin.end()
  })
})
