import type { DbClient } from "./db-client";
import type { product_copies } from "./entities";
import type { approval_state } from "@/generated/prisma/client";

import { prisma } from "@/core/tenancy/infra/prisma";
import { scopedWhere, scopedData, ownedByTenant, type TenantContext } from "@/core/tenancy";
import { AppError } from "@/core/http/errors";

interface ProductCopyOutput {
  suggested_name: string;
  suggested_description: string;
  suggested_tags: string[];
  suggested_occasions: string[];
  suggested_price_segment: "budget" | "standard" | "premium" | "luxury";
}

interface ProductCopyRaw {
  suggested_name?: string;
  suggested_description?: string;
  suggested_tags?: string[];
  suggested_occasions?: string[];
  suggested_price_segment?: string;
  [key: string]: unknown;
}

export class ProductCopyRepository {
  readonly db: DbClient;
  constructor(db: DbClient = prisma) {
    this.db = db;
  }

  async createFromAnalysis(ctx: TenantContext, input: {
    analysisId: string;
    productId: string | null;
    raw: object;
    profileVersion?: string;
  }): Promise<product_copies> {
    const analysis = await this.db.product_analyses.findFirst({
      where: scopedWhere(ctx, { id: input.analysisId, approval_state: "APPROVED" as approval_state }),
    });

    if (!analysis) {
      throw new Error("ANALYSIS_NOT_APPROVED: Chỉ tạo dữ liệu bán hàng từ phân tích đã duyệt");
    }

    const existing = await this.db.product_copies.findFirst({
      where: scopedWhere(ctx, { analysis_id: input.analysisId }),
    });

    if (existing) {
      return existing;
    }

    return this.db.product_copies.create({
      data: scopedData(ctx, {
        analysis_id: input.analysisId,
        product_id: input.productId,
        raw: input.raw,
        profile_version: input.profileVersion ?? null,
      }),
    });
  }

  async findById(ctx: TenantContext, id: string): Promise<product_copies | null> {
    return ownedByTenant(ctx, await this.db.product_copies.findFirst({
      where: scopedWhere(ctx, { id }),
    }));
  }

  async findByAnalysisId(ctx: TenantContext, analysisId: string): Promise<product_copies | null> {
    return ownedByTenant(ctx, await this.db.product_copies.findFirst({
      where: scopedWhere(ctx, { analysis_id: analysisId }),
    }));
  }

  async listByProduct(ctx: TenantContext, productId: string): Promise<product_copies[]> {
    return this.db.product_copies.findMany({
      where: scopedWhere(ctx, { product_id: productId }),
      orderBy: { created_at: "desc" },
    });
  }

  async listPendingApproval(ctx: TenantContext): Promise<product_copies[]> {
    return this.db.product_copies.findMany({
      where: scopedWhere(ctx, { approval_state: "PENDING" as approval_state }),
      orderBy: { created_at: "desc" },
    });
  }

  async listByApprovalState(ctx: TenantContext, approvalState: approval_state): Promise<product_copies[]> {
    return this.db.product_copies.findMany({
      where: scopedWhere(ctx, { approval_state: approvalState }),
      orderBy: { created_at: "desc" },
    });
  }

  async updateEdited(ctx: TenantContext, id: string, edited: object): Promise<product_copies> {
    const existing = await this.findById(ctx, id);
    if (!existing) throw new AppError("NOT_FOUND", "Không tìm thấy dữ liệu bán hàng");
    if (existing.approval_state !== "PENDING") {
      throw new AppError("CONFLICT", "Chỉ sửa được bản ghi đang chờ duyệt");
    }

    return this.db.product_copies.update({
      where: { id },
      data: { edited },
    });
  }

  async approve(ctx: TenantContext, id: string, approvedBy: string, tx: DbClient): Promise<{ productCopy: product_copies; product: { id: string; name: string } }> {
    const copy = await tx.product_copies.findFirst({
      where: scopedWhere(ctx, { id }),
    });

    if (!copy) throw new AppError("NOT_FOUND", "Không tìm thấy dữ liệu bán hàng");
    if (copy.approval_state !== "PENDING") {
      throw new AppError("CONFLICT", "Chỉ duyệt được bản ghi PENDING");
    }

    const effective = this.resolveEffective(copy.raw as ProductCopyRaw, copy.edited as ProductCopyRaw | null);

    let product;
    if (copy.product_id) {
      product = await tx.products.update({
        where: { id: copy.product_id, organization_id: ctx.organizationId },
        data: {
          name: effective.suggested_name,
          attributes: {
            salesData: {
              description: effective.suggested_description,
              tags: effective.suggested_tags,
              occasions: effective.suggested_occasions,
              priceSegment: effective.suggested_price_segment,
            },
          },
          status: "ACTIVE",
        },
      });
    } else {
      const code = effective.suggested_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 50);

      product = await tx.products.create({
        data: scopedData(ctx, {
          code: await this.generateUniqueCode(tx, ctx.organizationId, code),
          name: effective.suggested_name,
          status: "ACTIVE",
          attributes: {
            salesData: {
              description: effective.suggested_description,
              tags: effective.suggested_tags,
              occasions: effective.suggested_occasions,
              priceSegment: effective.suggested_price_segment,
            },
          },
        }),
      });

      await tx.product_copies.update({
        where: { id },
        data: { product_id: product.id },
      });
    }

    const updatedCopy = await tx.product_copies.update({
      where: { id },
      data: {
        approval_state: "APPROVED" as approval_state,
        approved_by: approvedBy,
        approved_at: new Date(),
      },
    });

    return { productCopy: updatedCopy, product };
  }

  async reject(ctx: TenantContext, id: string, tx: DbClient, reason?: string): Promise<product_copies> {
    const copy = await tx.product_copies.findFirst({
      where: scopedWhere(ctx, { id }),
    });

    if (!copy) throw new AppError("NOT_FOUND", "Không tìm thấy dữ liệu bán hàng");

    return tx.product_copies.update({
      where: { id },
      data: {
        approval_state: "REJECTED" as approval_state,
        edited: {
          ...(copy.edited as object ?? {}),
          reject_reason: reason,
        },
      },
    });
  }

  private resolveEffective(raw: ProductCopyRaw, edited: ProductCopyRaw | null): ProductCopyOutput {
    if (!edited) return raw as ProductCopyOutput;
    return {
      ...raw,
      ...edited,
      suggested_tags: edited.suggested_tags ?? raw.suggested_tags ?? [],
      suggested_occasions: edited.suggested_occasions ?? raw.suggested_occasions ?? [],
    } as ProductCopyOutput;
  }

  private async generateUniqueCode(
    tx: DbClient,
    organizationId: string,
    baseCode: string
  ): Promise<string> {
    let code = baseCode;
    let suffix = 1;
    while (true) {
      const existing = await tx.products.findFirst({
        where: { organization_id: organizationId, code },
      });
      if (!existing) break;
      code = `${baseCode}-${suffix}`;
      suffix++;
    }
    return code;
  }
}