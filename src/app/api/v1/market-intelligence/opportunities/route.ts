import { handle, jsonResponse } from "@/core/http/response";
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session";
import { requireCapability } from "@/core/rbac/capabilities";
import { listTenantOpportunities } from "@/modules/market-intelligence/use-cases/list-tenant-opportunities";
import type { MarketTimeframeKey } from "@/modules/market-intelligence/domain/trend-timeframe";

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request);
  // Gác quyền V2: market-intel.opportunity.read
  requireCapability(ctx, "V2");

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit")
    ? parseInt(url.searchParams.get("limit")!, 10)
    : 20;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const minScore = url.searchParams.get("min_score")
    ? parseFloat(url.searchParams.get("min_score")!)
    : undefined;
  const timeframe = (url.searchParams.get("timeframe") as MarketTimeframeKey | null) ?? undefined;

  const result = await listTenantOpportunities({
    organizationId: ctx.organizationId,
    limit,
    cursor,
    minScore,
    timeframe,
  });

  return jsonResponse(result);
});
