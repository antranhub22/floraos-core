import { prisma } from "@/core/tenancy/infra/prisma"
import type { TrashItemType } from "../../domain/trash-types"
import { AssetTrashHandler } from "./asset-trash-handler"
import type { TrashHandler } from "./handler-types"
import { ProductTrashHandler } from "./product-trash-handler"
import { SimpleTrashHandler, type SoftDeleteDelegate, type TrashRow } from "./simple-trash-handler"

function delegate(model: unknown): SoftDeleteDelegate {
  return model as SoftDeleteDelegate
}

const text = (row: TrashRow, key: string): string | null => (typeof row[key] === "string" ? (row[key] as string) : null)

/** Mọi loại dữ liệu có thùng rác. Thêm loại mới: cột `deleted_at`/`deleted_by` + một dòng ở đây. */
export function createTrashHandlers(): TrashHandler[] {
  return [
    new AssetTrashHandler(),
    new ProductTrashHandler(),
    new SimpleTrashHandler({
      type: "CUSTOMER",
      delegate: () => delegate(prisma.customers),
      select: { name: true, code: true },
      nameOf: (row) => text(row, "name") ?? "Khách hàng",
      codeOf: (row) => text(row, "code"),
    }),
    new SimpleTrashHandler({
      type: "GREETING_CATALOG",
      delegate: () => delegate(prisma.greeting_catalogs),
      select: { name: true, code: true },
      nameOf: (row) => text(row, "name") ?? "Bộ sưu tập",
      codeOf: (row) => text(row, "code"),
      onTrash: { is_active: false },
      onRestore: { is_active: true },
      // Xoá hẳn catalog kéo theo phiên khách + thanh toán (cascade) — đã có phiên thì giữ lại.
      retainWhere: { sessions: { some: {} } },
    }),
    new SimpleTrashHandler({
      type: "CATALOG_LINK",
      delegate: () => delegate(prisma.catalog_links),
      select: { name: true, slug: true },
      nameOf: (row) => text(row, "name") ?? "Catalog chia sẻ",
      codeOf: (row) => text(row, "slug"),
    }),
    new SimpleTrashHandler({
      type: "CONTENT_DRAFT",
      delegate: () => delegate(prisma.content_drafts),
      select: { topic_title: true },
      nameOf: (row) => text(row, "topic_title") ?? "Bài đăng nháp",
    }),
    new SimpleTrashHandler({
      type: "CAMPAIGN_PACKAGE",
      delegate: () => delegate(prisma.campaign_packages),
      select: { name: true },
      nameOf: (row) => text(row, "name") ?? "Gói chiến dịch",
    }),
    new SimpleTrashHandler({
      type: "VIDEO",
      delegate: () => delegate(prisma.video_jobs),
      select: { title: true },
      nameOf: (row) => text(row, "title") ?? "Video",
    }),
    new SimpleTrashHandler({
      type: "VOUCHER",
      delegate: () => delegate(prisma.vouchers),
      select: { code: true },
      nameOf: (row) => text(row, "code") ?? "Mã giảm giá",
      codeOf: (row) => text(row, "code"),
      // Mã đã dùng gắn với một đơn — giữ để đối soát.
      retainWhere: { is_used: true },
    }),
  ]
}

export function handlerFor(handlers: TrashHandler[], type: TrashItemType): TrashHandler | null {
  return handlers.find((handler) => handler.types.includes(type)) ?? null
}
