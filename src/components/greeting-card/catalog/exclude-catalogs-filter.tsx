"use client"

import { useState } from "react"
import { Layers, Loader2 } from "lucide-react"
import { useApi } from "@/components/greeting-card/greeting-api"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type CatalogRow = { id: string; name: string; _count?: { items: number } }

const HINT =
  "Chọn những bộ sưu tập mà bạn không muốn trùng mẫu. Các mẫu đã có trong những bộ đó sẽ được ẩn khỏi danh sách bên dưới."

interface Props {
  /** Bộ sưu tập đang thêm mẫu — không hiện trong danh sách để chọn. */
  currentCatalogId: string
  selected: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
  hiddenCount: number
}

/** Nút lọc "Không trùng với bộ sưu tập khác" + danh sách bộ sưu tập để chọn. */
export function ExcludeCatalogsFilter({ currentCatalogId, selected, onChange, loading = false, hiddenCount }: Props) {
  const [open, setOpen] = useState(false)
  const list = useApi<{ data: CatalogRow[] }>(open ? "/api/v1/greeting-card/catalogs?limit=100" : null)
  const catalogs = (list.data?.data ?? []).filter((c) => c.id !== currentCatalogId)
  const active = selected.length > 0
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label={`Không trùng mẫu với bộ sưu tập khác. ${HINT}`}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-caption font-semibold transition ${
                  active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-text-muted hover:border-primary/40"
                }`}
              >
                <Layers size={14} aria-hidden="true" />
                Không trùng với bộ sưu tập khác{active ? ` (${selected.length})` : ""}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72 text-caption">{HINT}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {active && (
          <span className="flex items-center gap-1 text-caption text-text-muted">
            {loading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : null}
            {loading ? "Đang lọc..." : `Đã ẩn ${hiddenCount} mẫu trùng`}
            <button type="button" onClick={() => onChange([])} className="ml-1 font-medium text-primary hover:underline">
              Bỏ chọn
            </button>
          </span>
        )}
      </div>
      {open && (
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="mb-1.5 text-caption text-text-muted">{HINT}</p>
          {list.isLoading ? (
            <p className="text-caption text-text-muted">Đang tải bộ sưu tập...</p>
          ) : catalogs.length === 0 ? (
            <p className="text-caption text-text-muted">Chưa có bộ sưu tập nào khác.</p>
          ) : (
            <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {catalogs.map((c) => (
                <li key={c.id}>
                  <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-body-sm text-text hover:bg-surface-muted">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-primary" />
                    <span className="flex-1 truncate">{c.name}</span>
                    {c._count && <span className="text-caption text-text-muted">{c._count.items} mẫu</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
