import { describe, it, expect } from "vitest"
import {
  compileStudioPrompts,
  compileStoryCarouselPrompts,
} from "@/modules/media/domain/studio-prompt-compiler"
import type { ProductPassportInput } from "@/modules/media/domain/creative-studio-schemas"

describe("Visual Storytelling Prompts Compilation", () => {
  const samplePassport: ProductPassportInput = {
    primaryFlowers: [
      { name: "Juliet Garden Roses", quantity: 12, color: "Peach Apricot", role: "chinh" },
      { name: "White Astilbe", quantity: 6, color: "Pure White", role: "phu" },
    ],
    packaging: {
      wrapMaterial: "linen texture paper",
      wrapColor: "cream white",
      ribbonColor: "dusty rose satin",
    },
    styleOccasion: {
      form: "bo_tron",
      tone: "luxury",
      intendedOccasion: "Wedding Anniversary",
    },
  }

  it("biên dịch chính xác góc chụp phẳng từ trên xuống (flat_lay_topdown)", () => {
    const result = compileStudioPrompts({
      productPassport: samplePassport,
      sceneConfig: { presetId: "cafe_lifestyle" },
      visualStoryConfig: { cameraAngle: "flat_lay_topdown", humanInteraction: "none" },
    })

    expect(result.positivePrompt).toContain("Artisan overhead 90-degree flat-lay commercial photography")
    expect(result.positivePrompt).toContain("12 stems of Peach Apricot Juliet Garden Roses")
    expect(result.tags).toContain("angle:flat_lay_topdown")
  })

  it("biên dịch chính xác góc chụp cận cảnh macro (macro_closeup)", () => {
    const result = compileStudioPrompts({
      productPassport: samplePassport,
      visualStoryConfig: { cameraAngle: "macro_closeup", humanInteraction: "none" },
    })

    expect(result.positivePrompt).toContain("Extreme macro close-up detail shot at f/2.8")
    expect(result.positivePrompt).toContain("magnifying crisp petal textures")
    expect(result.tags).toContain("angle:macro_closeup")
  })

  it("biên dịch chính xác bối cảnh người mẫu nữ thanh lịch ôm hoa (female_holding)", () => {
    const result = compileStudioPrompts({
      productPassport: samplePassport,
      sceneConfig: { presetId: "luxury_warm" },
      visualStoryConfig: {
        cameraAngle: "three_quarter_45",
        humanInteraction: "female_holding",
      },
    })

    expect(result.positivePrompt).toContain("Gently and elegantly held against the chest by a graceful young woman")
    expect(result.positivePrompt).toContain("Shot at a dynamic 45-degree three-quarter angle")
    expect(result.systemPrompt).toContain("Seamlessly incorporate the requested human presence without obscuring the floral arrangement")
    expect(result.tags).toContain("human:female_holding")
  })

  it("biên dịch chính xác đôi bàn tay thợ hoa nghệ thuật (florist_artisan_hands)", () => {
    const result = compileStudioPrompts({
      productPassport: samplePassport,
      visualStoryConfig: {
        cameraAngle: "front_view",
        humanInteraction: "florist_artisan_hands",
      },
    })

    expect(result.positivePrompt).toContain("Delicate artisan florist hands in the frame gently tying the final silk ribbon bow")
    expect(result.tags).toContain("human:florist_artisan_hands")
  })

  it("tự động đóng gói trọn bộ 4 chương Story Carousel kịch bản bán hàng", () => {
    const carousel = compileStoryCarouselPrompts({
      productPassport: samplePassport,
    })

    expect(carousel).toHaveLength(4)

    // Chương 1: The Craft
    expect(carousel[0]!.chapterNumber).toBe(1)
    expect(carousel[0]!.chapterTitle).toContain("The Craft")
    expect(carousel[0]!.prompt.positivePrompt).toContain("artisan florist hands")
    expect(carousel[0]!.suggestedCaption).toBeTruthy()

    // Chương 2: The Masterpiece
    expect(carousel[1]!.chapterNumber).toBe(2)
    expect(carousel[1]!.chapterTitle).toContain("The Masterpiece")
    expect(carousel[1]!.prompt.tags).toContain("preset:studio_white")

    // Chương 3: The Surprise
    expect(carousel[2]!.chapterNumber).toBe(3)
    expect(carousel[2]!.chapterTitle).toContain("The Surprise")
    expect(carousel[2]!.prompt.positivePrompt).toContain("graceful young woman")

    // Chương 4: The Living Memory
    expect(carousel[3]!.chapterNumber).toBe(4)
    expect(carousel[3]!.chapterTitle).toContain("The Living Memory")
    expect(carousel[3]!.prompt.tags).toContain("preset:luxury_warm")
  })
})
