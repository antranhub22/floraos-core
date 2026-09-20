import { describe, it, expect } from "vitest"
import {
  compileStudioPrompts,
  STRICT_COMMERCIAL_NEGATIVE_PROMPT,
} from "@/modules/media/domain/studio-prompt-compiler"

describe("StudioPromptCompiler", () => {
  it("biên dịch chính xác prompt 3 lớp từ dữ liệu bóc tách hoa hồng đỏ M01", () => {
    const result = compileStudioPrompts({
      productPassport: {
        primaryFlowers: [
          { name: "Red Naomi Roses", quantity: 20, color: "Deep Red", role: "chinh" },
        ],
        packaging: {
          wrapMaterial: "matte silk",
          wrapColor: "charcoal black",
          ribbonColor: "burgundy satin",
        },
        styleOccasion: {
          form: "bo_tron",
          tone: "luxury",
          intendedOccasion: "Anniversary",
        },
      },
      sceneConfig: {
        presetId: "luxury_warm",
      },
    })

    // 1. Kiểm tra System Prompt (Mandate bảo tồn hoa thật)
    expect(result.systemPrompt).toContain("CRITICAL CONSTRAINT - SUBJECT INTEGRITY MANDATE")
    expect(result.systemPrompt).toContain("DO NOT change, recolor, repaint, add, remove, or distort ANY flower petals")
    expect(result.systemPrompt).toContain("The floral arrangement in the foreground mask is an EXACT PHYSICAL PRODUCT")

    // 2. Kiểm tra Positive Prompt (Thông tin hoa + bối cảnh + máy ảnh 85mm f/4)
    expect(result.positivePrompt).toContain("20 stems of Deep Red Red Naomi Roses")
    expect(result.positivePrompt).toContain("charcoal black matte silk wrapping paper")
    expect(result.positivePrompt).toContain("round hand-tied bouquet")
    expect(result.positivePrompt).toContain("Calacatta marble tabletop")
    expect(result.positivePrompt).toContain("85mm prime lens at f/4.0")
    expect(result.positivePrompt).toContain("Hasselblad H6D-100c")

    // 3. Kiểm tra Negative Prompt (Chặn nguy cơ 3d, cartoon, biến dạng)
    expect(result.negativePrompt).toBe(STRICT_COMMERCIAL_NEGATIVE_PROMPT)
    expect(result.negativePrompt).toContain("deformed petals")
    expect(result.negativePrompt).toContain("cartoon")
    expect(result.negativePrompt).toContain("3d render")

    // 4. Kiểm tra Tags
    expect(result.tags).toContain("preset:luxury_warm")
    expect(result.tags).toContain("commercial-safe")
    expect(result.tags).toContain("subject-locked")
  })

  it("tự động áp dụng preset mặc định khi không truyền sceneConfig", () => {
    const result = compileStudioPrompts({
      productPassport: {
        primaryFlowers: [
          { name: "Pink Tulips", quantity: 10, color: "Pastel Pink", role: "chinh" },
        ],
      },
    })

    expect(result.positivePrompt).toContain("10 stems of Pastel Pink Pink Tulips")
    expect(result.positivePrompt).toContain("seamless infinity white commercial photography studio")
    expect(result.tags).toContain("preset:studio_white")
  })
})
