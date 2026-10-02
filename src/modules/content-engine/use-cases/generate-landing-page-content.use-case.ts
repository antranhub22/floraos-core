/**
 * Use-case: Sinh nội dung hoàn chỉnh cho Landing Page 7-Section.
 *
 * Pipeline Option B Full (Writer → Critic):
 *   1. Writer AI sinh hero/story/perks/faq/lead qua cổng AI (callCapability)
 *   2. Critic AI kiểm factual + completeness → nếu thấp → re-generate 1 lần
 *   3. Fallback về template (generateLandingPageContent) khi AI hoàn toàn không gọi được
 *   4. ProductTruthValidator (LocalBudd TR-POL-001) kiểm sau cùng
 *
 * Kế thừa cơ chế Gateway + Circuit Breaker từ LocalBudd / SocialFlow.
 */

import { callCapability } from "@/core/ai/gateway"
import { aiGatewayDeps } from "@/core/ai/wiring"
import { createContentLLM } from "@/core/ai/adapters/multi-llm-provider"
import type { TenantContext } from "@/core/tenancy"

import {
  generateLandingPageContent,
  type LandingContentInput,
  type GeneratedLandingPackage,
} from "../domain/landing-content-generator"
import { validateProductTruth } from "../domain/product-truth-validator"
import {
  createLandingWriterAdapter,
  createLandingCriticAdapter,
} from "../adapters/landing-catalog-ai-adapter"
import type { LandingWriterOutput } from "../domain/prompts/landing/v1"

const CRITIC_THRESHOLD = 0.65

/** Chuyển LandingWriterOutput → GeneratedLandingPackage (merge với template fallback cho section chưa có) */
function mergeWithTemplate(
  ai: LandingWriterOutput,
  template: GeneratedLandingPackage
): GeneratedLandingPackage {
  return {
    hero: {
      badge: ai.hero.badge || template.hero.badge,
      headline: ai.hero.headline || template.hero.headline,
      subHeadline: ai.hero.subHeadline || template.hero.subHeadline,
      countdownLabel: template.hero.countdownLabel,
    },
    story: {
      title: ai.story.title || template.story.title,
      paragraphs: [
        ai.story.paragraph1 || template.story.paragraphs[0] || "",
        ai.story.paragraph2 || template.story.paragraphs[1] || "",
      ].filter(Boolean),
      quote: ai.story.quote || template.story.quote,
      floristName: template.story.floristName,
    },
    perks: ai.perks.length > 0
      ? ai.perks.map((p, i) => ({
          id: `perk-${i + 1}`,
          title: p.title,
          description: p.description,
          icon: (["camera", "clock", "shield", "gift"] as const)[i % 4]!,
        }))
      : template.perks,
    steps: template.steps,
    faq: ai.faq.length > 0
      ? ai.faq.map((f) => ({ question: f.question, answer: f.answer }))
      : template.faq,
    lead: {
      tag: template.lead.tag,
      title: ai.lead.title || template.lead.title,
      description: ai.lead.description || template.lead.description,
      discountBadge: template.lead.discountBadge,
      urgencyNotice: template.lead.urgencyNotice,
    },
  }
}

export async function executeGenerateLandingContent(
  input: LandingContentInput,
  ctx?: TenantContext
): Promise<GeneratedLandingPackage> {
  // Template luôn được tính sẵn làm fallback
  const template = generateLandingPageContent(input)

  // Nếu không có TenantContext (gọi từ test hay client-side) → dùng template
  if (!ctx) return template

  try {
    const llm = createContentLLM()
    const deps = aiGatewayDeps(ctx)

    const writerInput = {
      shopName: input.shopName,
      shopTone: input.shopTone as string | undefined,
      occasionId: input.occasionId,
      occasionLabel: input.occasionLabel,
      archetypeId: input.archetypeId,
      selectedProducts: input.selectedProducts,
      userDirectives: input.userDirectives,
      discountPercent: input.discountPercent,
    }

    // 1. Writer AI
    const writerResult = await callCapability(
      {
        capability: "content_generation",
        privacy: "SHOP",
        source: "CORE",
        jobId: null,
      },
      createLandingWriterAdapter(llm, writerInput, ctx.organizationId),
      deps
    )

    if (writerResult.kind === "khong_chay_duoc") {
      // AI không chạy được → fallback template
      return template
    }

    let aiOutput = writerResult.output

    // 2. Critic AI — kiểm factual + completeness
    const criticResult = await callCapability(
      {
        capability: "content_qa",
        privacy: "SHOP",
        source: "CORE",
        jobId: null,
      },
      createLandingCriticAdapter(
        llm,
        {
          shopName: input.shopName,
          occasionLabel: input.occasionLabel,
          output: aiOutput,
          selectedProducts: input.selectedProducts,
        },
        ctx.organizationId
      ),
      deps
    )

    if (criticResult.kind === "xong") {
      const { factual, completeness } = criticResult.output
      const avgScore = (factual + completeness) / 2

      // Nếu điểm thấp → thử Writer lần 2 với fix instructions
      if (avgScore < CRITIC_THRESHOLD && criticResult.output.fixInstructions) {
        const retryInput = {
          ...writerInput,
          userDirectives: [input.userDirectives, `[Sửa lỗi] ${criticResult.output.fixInstructions}`]
            .filter(Boolean)
            .join("\n"),
        }
        const retryResult = await callCapability(
          { capability: "content_generation", privacy: "SHOP", source: "CORE", jobId: null },
          createLandingWriterAdapter(llm, retryInput, ctx.organizationId),
          deps
        )
        if (retryResult.kind === "xong") {
          aiOutput = retryResult.output
        }
      }
    }

    // 3. Merge AI output với template (giữ các section AI không sinh được)
    const merged = mergeWithTemplate(aiOutput, template)

    // 4. ProductTruthValidator (TR-POL-001 từ LocalBudd)
    const validation = validateProductTruth(
      input.selectedProducts.map((p) => ({ name: p.name, code: p.code, price: p.price })),
      { headline: merged.hero.headline, subHeadline: merged.hero.subHeadline, paragraphs: merged.story.paragraphs }
    )
    if (!validation.isValid) {
      // Hallucination phát hiện → khôi phục hero về template (an toàn)
      merged.hero.headline = template.hero.headline
      merged.hero.subHeadline = template.hero.subHeadline
    }

    return merged
  } catch {
    // Mọi lỗi network / timeout → fallback template, không để job FAILED
    return template
  }
}
