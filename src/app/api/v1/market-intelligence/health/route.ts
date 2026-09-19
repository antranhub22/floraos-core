import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { requireCapability } from "@/core/rbac/capabilities";
import { marketIntelligenceRepo } from "@/modules/market-intelligence/infra/market-intelligence-repository";

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request);
  // Gác quyền V1: market-intel.research.run
  requireCapability(ctx, "V1");

  const healthRecords = await marketIntelligenceRepo.getAllProviderHealth();

  return jsonResponse({ providers: healthRecords });
});
