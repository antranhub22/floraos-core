"use client"

// Danh mục 14 vai trải nghiệm (đặc tả 03b-role-ux mục 3). Vai đã có dữ liệu và
// luồng thật hiện "Đang dùng được"; vai chưa có vẫn HIỆN (để tiệm thấy lộ
// trình) nhưng ở trạng thái vô hiệu — không bấm, không gán được — cho tới khi
// phát triển xong (PO 26/09/2026, nợ #165).
//
// Màn chỉ ĐỌC danh mục trong mã (`ROLE_UX_CATALOG`), không gọi API, không đổi
// vai của ai: đổi vai vẫn là `A4 access.user.change_role`.

import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import {
  ROLE_UX_CATALOG,
  ROLE_UX_GROUP_LABEL,
  type RoleUxDefinition,
  type RoleUxGroup,
} from "@/modules/organization/domain/role-ux-catalog"

const NHOM: RoleUxGroup[] = ["PLATFORM", "STORE", "FLOWER_NETWORK"]

function DongVai({ role, laVaiCuaToi }: { role: RoleUxDefinition; laVaiCuaToi: boolean }) {
  const dungDuoc = role.status === "AVAILABLE"
  return (
    <li
      aria-disabled={!dungDuoc || undefined}
      className={cn(
        "flex items-start justify-between gap-3 px-4 py-3",
        laVaiCuaToi && "bg-surface-alt",
        !dungDuoc && "opacity-60"
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm font-bold text-text">{role.label}</span>
          {laVaiCuaToi && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-caption font-bold text-white">
              Vai của bạn
            </span>
          )}
          {dungDuoc ? (
            <span className="rounded-full bg-success-bg px-2 py-0.5 text-caption font-bold text-success">
              Đang dùng được
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-caption font-bold text-text-muted"
              aria-label="Trạng thái: Đang phát triển"
            >
              <Lock size={11} aria-hidden="true" />
              Đang phát triển
            </span>
          )}
        </div>
        <div className="mt-0.5 line-clamp-2 text-caption text-text-muted">
          {role.homepageModel} · {role.primaryQuestion}
        </div>
      </div>
      {dungDuoc && role.entryHref && (
        <Link
          href={role.entryHref as never}
          className="flex min-h-11 flex-shrink-0 items-center rounded-xl border border-border px-3 text-body-sm font-semibold text-primary hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
        >
          {role.group === "PLATFORM" ? "Console" : "Mở"}
        </Link>
      )}
    </li>
  )
}

export default function VaiTroPage() {
  const { roleUx } = useSession()
  const soDungDuoc = ROLE_UX_CATALOG.filter((r) => r.status === "AVAILABLE").length

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-4">
        <Link
          href="/"
          aria-label="Về trang chủ"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-title font-extrabold text-primary">Vai trò</h1>
          <div className="text-caption text-text-muted">
            {soDungDuoc}/{ROLE_UX_CATALOG.length} vai đang dùng được
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 xl:grid xl:grid-cols-3 xl:items-start">
        {NHOM.map((nhom) => (
          <section key={nhom} aria-labelledby={`nhom-${nhom}`} className="flex flex-col">
            <h2 id={`nhom-${nhom}`} className="mb-1.5 px-1 text-caption font-bold uppercase tracking-wider text-text-muted">
              {ROLE_UX_GROUP_LABEL[nhom]}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {ROLE_UX_CATALOG.filter((r) => r.group === nhom).map((role) => (
                <DongVai key={role.key} role={role} laVaiCuaToi={roleUx?.key === role.key} />
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  )
}
