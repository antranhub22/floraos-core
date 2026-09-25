import { describe, it, expect } from "vitest"
import { COORDINATOR_STEPS, findStepById } from "@/modules/coordinator/contracts/registry"
import { buildCoordinatorSchemaFiles } from "@/modules/coordinator/contracts/json-schema"

describe("Coordinator Contracts & JSON Schemas", () => {
  it("đủ 7 bước điều phối trong registry", () => {
    expect(COORDINATOR_STEPS).toHaveLength(7)

    const step01 = findStepById("01")
    expect(step01).toBeDefined()
    expect(step01?.code).toBe("INTAKE")

    const step05 = findStepById("05")
    expect(step05).toBeDefined()
    expect(step05?.code).toBe("QUALITY_CHECK")

    const step07 = findStepById("07")
    expect(step07).toBeDefined()
    expect(step07?.code).toBe("CLOSE_LEARN")
  })

  it("mọi bước đều có example hợp lệ thỏa mãn input/output schema", () => {
    for (const step of COORDINATOR_STEPS) {
      const parsedInput = step.input.safeParse(step.examples.input)
      if (!parsedInput.success) {
        console.error(`Step ${step.id} input parse error:`, parsedInput.error)
      }
      expect(parsedInput.success).toBe(true)

      const parsedOutput = step.output.safeParse(step.examples.output)
      if (!parsedOutput.success) {
        console.error(`Step ${step.id} output parse error:`, parsedOutput.error)
      }
      expect(parsedOutput.success).toBe(true)
    }
  })

  it("sinh đầy đủ 15 tệp JSON schema (1 index + 14 input/output)", () => {
    const files = buildCoordinatorSchemaFiles()
    expect(files).toHaveLength(15)
    expect(files[0]!.file).toBe("index.json")
  })
})
