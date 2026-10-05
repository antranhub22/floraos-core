import { describe, it, expect } from "vitest"
import {
  GREETING_TEMPLATES,
  GREETING_TEMPLATE_LIST,
  resolveGreetingTemplateId,
} from "../greeting-template-registry"

describe("Greeting Template Registry Domain Tests", () => {
  it("should contain enterprise-luxury as default template", () => {
    expect(GREETING_TEMPLATES["enterprise-luxury"]).toBeDefined()
    expect(GREETING_TEMPLATES["enterprise-luxury"].isDefault).toBe(true)
    expect(GREETING_TEMPLATES["enterprise-luxury"].name).toBe("Enterprise Luxury Deck")
  })

  it("should contain all 8 templates", () => {
    const expectedIds = [
      "enterprise-luxury",
      "swipe-classic",
      "lookbook-grid",
      "editorial-story",
      "video-reels",
      "occasion-budget-quiz",
      "event-moodboard",
      "split-compare",
    ]

    expect(GREETING_TEMPLATE_LIST.length).toBe(8)
    for (const id of expectedIds) {
      expect(GREETING_TEMPLATES[id as keyof typeof GREETING_TEMPLATES]).toBeDefined()
    }
  })

  it("should correctly resolve template IDs with fallback to enterprise-luxury", () => {
    expect(resolveGreetingTemplateId("enterprise-luxury")).toBe("enterprise-luxury")
    expect(resolveGreetingTemplateId("swipe-classic")).toBe("swipe-classic")
    expect(resolveGreetingTemplateId("lookbook-grid")).toBe("lookbook-grid")
    expect(resolveGreetingTemplateId("editorial-story")).toBe("editorial-story")
    expect(resolveGreetingTemplateId("video-reels")).toBe("video-reels")
    expect(resolveGreetingTemplateId("occasion-budget-quiz")).toBe("occasion-budget-quiz")
    expect(resolveGreetingTemplateId("event-moodboard")).toBe("event-moodboard")
    expect(resolveGreetingTemplateId("split-compare")).toBe("split-compare")
    expect(resolveGreetingTemplateId(null)).toBe("enterprise-luxury")
    expect(resolveGreetingTemplateId(undefined)).toBe("enterprise-luxury")
    expect(resolveGreetingTemplateId("unknown-template")).toBe("enterprise-luxury")
  })

  it("all 8 templates should have required commercial features and description", () => {
    for (const tpl of GREETING_TEMPLATE_LIST) {
      expect(tpl.name.length).toBeGreaterThan(0)
      expect(tpl.description.length).toBeGreaterThan(0)
      expect(tpl.badge.length).toBeGreaterThan(0)
      expect(tpl.features.length).toBeGreaterThan(0)
      expect(tpl.recommendedFor.length).toBeGreaterThan(0)
    }
  })
})
