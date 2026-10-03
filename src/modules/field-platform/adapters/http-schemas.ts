import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { CUSTOM_FIELD_DATA_TYPES, type CustomFieldDataType } from "../domain/custom-field-schema"

export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return parsed.data
}

const visibilitySchema = z
  .object({ INTERNAL: z.boolean(), PARTNER: z.boolean(), SHIPPER: z.boolean(), CUSTOMER: z.boolean() })
  .partial()

const requirementSchema = z.enum(["OPTIONAL", "RECOMMENDED", "REQUIRED"])

export const updateFieldConfigSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  placeholder: z.string().trim().max(200).nullable().optional(),
  requirement: requirementSchema.optional(),
  visibility: visibilitySchema.optional(),
  catalogKey: z.string().trim().max(100).nullable().optional(),
  defaultEnabled: z.boolean().optional(),
})

export const createCustomFieldSchema = z.object({
  entity: z.enum(["ORDER", "PARTNER"]),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  placeholder: z.string().trim().max(200).optional(),
  dataType: z.enum(CUSTOM_FIELD_DATA_TYPES as [CustomFieldDataType, ...CustomFieldDataType[]]),
  requirement: requirementSchema.optional(),
  requiredAtStage: z.string().trim().max(60).optional(),
  visibility: visibilitySchema.optional(),
  catalogKey: z.string().trim().max(100).optional(),
  sensitivity: z.enum(["NORMAL", "PII", "SENSITIVE"]).optional(),
  defaultEnabled: z.boolean().optional(),
})

export const upsertCatalogValueSchema = z.object({
  code: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  behavior: z.string().trim().max(100).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
})

export const setFieldOverrideSchema = z.object({
  fieldKey: z.string().trim().min(1),
  label: z.string().trim().max(200).optional(),
  visibility: visibilitySchema.optional(),
  requirement: requirementSchema.optional(),
  isEnabled: z.boolean().optional(),
})

export const setCatalogValueOverrideSchema = z.object({
  catalogKey: z.string().trim().min(1),
  code: z.string().trim().min(1),
  label: z.string().trim().max(200).optional(),
  isEnabled: z.boolean().optional(),
})
