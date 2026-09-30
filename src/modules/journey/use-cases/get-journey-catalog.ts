/**
 * Use-case: Lấy danh mục hành trình theo vai trải nghiệm.
 *
 * Luật Clean Architecture: Use-case điều phối nghiệp vụ, không import React/Prisma trực tiếp.
 */

import type { RoleUxGroup } from "@/modules/organization/domain/role-ux-catalog"
import {
  NETWORK_JOURNEYS,
  PLATFORM_JOURNEYS,
  STORE_JOURNEYS,
} from "../domain/journey-catalog"
import type { JourneyDefinition } from "../domain/journey-model"

export interface GetJourneyCatalogInput {
  roleScope: RoleUxGroup
}

export function getJourneyCatalogUseCase(
  input: GetJourneyCatalogInput
): JourneyDefinition[] {
  switch (input.roleScope) {
    case "PLATFORM":
      return PLATFORM_JOURNEYS
    case "FLOWER_NETWORK":
    case "CHAIN":
      return NETWORK_JOURNEYS
    case "STORE":
    case "ONE_STORE":
    default:
      return STORE_JOURNEYS
  }
}
